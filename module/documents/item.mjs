export class AnimusItem extends Item {
  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    this._prepareBonusAttributes();
    this._prepareWeaponData();
  }

  /**
   * Se os atributos de bônus estiverem vazios (ex: importação legada), tenta extraí-los.
   */
  _prepareBonusAttributes() {
    if (!["ascendancy", "element"].includes(this.type)) return;
    
    const bonus = this.system.bonus;
    if (!bonus) return;

    // Se já tiver atributos, não faz nada
    if (Array.isArray(bonus.attributes) && bonus.attributes.length > 0) return;

    let attrs = [];
    // Normaliza o nome para comparação (remove acentos e espaços)
    const name = this.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    // Mapeamento manual para garantir consistência
    const elementMaps = {
      "fogo": ["hab", "pre"],
      "agua": ["cog", "ani"],
      "vento": ["hab", "per"],
      "terra": ["pot", "cog"],
      "madeira": ["pot", "ani"],
      "metal": ["pot", "per"],
      "trovao": ["per", "pre"]
    };

    if (this.type === "element" && elementMaps[name]) {
      attrs = elementMaps[name];
    } else if (this.type === "ascendancy") {
      // Ascendências geralmente permitem qualquer atributo (Padrão do Animus)
      attrs = ["pot", "hab", "cog", "per", "pre", "ani"];
    }

    if (attrs.length > 0) {
      // Definimos os atributos no dado derivado
      // Usamos defineProperty para garantir que o Foundry não bloqueie a alteração em dados derivados
      Object.defineProperty(bonus, "attributes", {
        value: attrs,
        writable: true,
        configurable: true
      });
    }
  }

  /**
   * Calcula o custo de uso (PA) da arma baseado em seu tipo.
   */
  _prepareWeaponData() {
    if (this.type !== "weapon") return;

    const config = CONFIG.ANIMUS;
    let type = this.system.type;

    // Se o tipo for um índice numérico (legado), converter para string
    if (typeof type === "number" || !isNaN(parseInt(type)) && config.weaponTypesByIndex[type]) {
      type = config.weaponTypesByIndex[type];
    }

    // Forçar a atualização do custo no sistema
    const costs = config.weaponActionCosts || {};
    const finalCost = costs[type] || 1;
    
    // Se o sistema for um DataModel, tentamos atualizar o valor
    if (this.system.updateSource) {
      this.system.updateSource({ cost: finalCost });
    } else {
      this.system.cost = finalCost;
    }
  }

  /**
   * Executa a lógica de uso do item
   */
  async use() {
    const usage = this.system.application;
    const actor = this.actor;
    
    if ( !actor ) return;

    // 0. Verificar e Consumir Recursos (PA/PE)
    const basePaCost = (this.type === "action" ? this.system.cost : (this.type === "talent" ? this.system.action : 0)) || 0;
    const peCost = (this.type === "action" ? this.system.peCost : (this.type === "talent" ? this.system.cost : 0)) || 0;

    // Lógica de Repetição (Apenas para ações que gastam PA)
    let paCost = basePaCost;
    if (paCost > 0) {
      const repeatCost = actor.getActionRepeatCost(this.name);
      paCost += repeatCost;
      
      const consumedPA = await actor.consumeResource("pa", paCost);
      if (!consumedPA) return;

      // Registrar ação no turno
      await actor.recordTurnAction(this.name);
    }

    if (peCost > 0) {
      const consumedPE = await actor.consumeResource("pe", peCost);
      if (!consumedPE) return;
    }

    if ( !usage || usage.type === "none" ) {
      return ui.notifications.warn(`O item ${this.name} não possui uma ação de uso definida.`);
    }

    let chatContent = `<h3>Usou ${this.name}</h3>`;
    let updates = {};

    // 1. Resolver Cura/Dano
    if ( ["heal", "damage"].includes(usage.type) ) {
      const roll = new Roll(usage.formula || "0", actor.getRollData());
      await roll.evaluate();
      
      const isHeal = usage.type === "heal";
      const label = isHeal ? "Recuperação" : "Dano";
      const color = isHeal ? "#2e7d32" : "#c62828";
      
      chatContent += `<p><strong>${label}:</strong> <span style="color:${color}; font-weight: bold;">${roll.total}</span></p>`;
      
      // Aplicar cura ou dano automático
      if ( isHeal && usage.resource ) {
         const current = foundry.utils.getProperty(actor.system, `status.${usage.resource}.value`) ?? 0;
         const max = foundry.utils.getProperty(actor.system, `status.${usage.resource}.max`) ?? 10;
         const newValue = Math.min(max, current + roll.total);
         updates[`system.status.${usage.resource}.value`] = newValue;
      } 
      else if ( usage.type === "damage" ) {
        const currentProt = actor.system.status.prot.value || 0;
        const currentHP = actor.system.status.hp.value || 0;
        let remainingDmg = roll.total;

        // Primeiro consome a Proteção
        const protLoss = Math.min(currentProt, remainingDmg);
        updates["system.status.prot.value"] = currentProt - protLoss;
        remainingDmg -= protLoss;

        // Se sobrar dano, aplica no PV real
        if ( remainingDmg > 0 ) {
          updates["system.status.hp.value"] = Math.max(0, currentHP - remainingDmg);
        }
      }

      await roll.toMessage({
        speaker: ChatMessage.getSpeaker({actor}),
        flavor: `Usou ${this.name}`
      });
    }

    // 2. Resolver Condição
    if ( usage.condition ) {
      chatContent += `<p><strong>Efeito/Condição:</strong> <span class="text-condition">${usage.condition.capitalize()}</span></p>`;
    }

    // 3. Aplicar updates de recursos ao ator
    if ( Object.keys(updates).length > 0 ) {
      await actor.update(updates);
    }

    // 4. Consumir quantidade
    if ( this.system.consumable ) {
      const qty = this.system.quantity || 0;
      if ( qty > 1 ) {
        await this.update({"system.quantity": qty - 1});
      } else {
        await this.delete();
        ui.notifications.info(`${this.name} foi totalmente consumido e removido do inventário.`);
      }
    }

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({actor}),
      content: `<div class="animus-chat-card">${chatContent}${this._getChatCardExtraContent()}</div>`
    });
  }

  /**
   * Gera o conteúdo extra (botões de teste e efeitos) para o cartão de chat
   */
  _getChatCardExtraContent() {
    let extraHtml = "";
    const system = this.system;

    // 1. Botão de Teste (Check / Resistência)
    if (system.check?.attribute) {
      const attr = system.check.attribute.toUpperCase();
      const dc = system.check.dc || system.check.difficulty || "10";
      extraHtml += `
        <div class="chat-section">
          <button class="chat-button roll-resistance" data-attr="${system.check.attribute}" data-dc="${dc}">
            <i class="fas fa-dice-d20"></i> Teste de ${attr} (CD ${dc})
          </button>
        </div>`;
    }

    // 2. Botão de Efeitos (Aplicação)
    const app = system.application;
    const hasSpecialActions = system.specialActions && system.specialActions.length > 0;
    
    if ((app && app.type !== "none") || hasSpecialActions) {
      extraHtml += `<div class="chat-section effects">`;
      
      if (app && app.type !== "none") {
        const label = app.type === "damage" ? "Dano" : (app.type === "heal" ? "Cura" : "Efeito");
        const icon = app.type === "damage" ? "fa-tint" : (app.type === "heal" ? "fa-heart" : "fa-magic");
        
        extraHtml += `
          <button class="chat-button apply-effect" data-type="${app.type}" data-formula="${app.formula}" data-condition="${app.condition || ''}">
            <i class="fas ${icon}"></i> Aplicar ${label} ${app.formula ? `(${app.formula})` : ""}
          </button>`;
      }

      if (hasSpecialActions) {
        system.specialActions.forEach(action => {
          extraHtml += `
            <button class="chat-button apply-effect" data-condition="${action}">
              <i class="fas fa-bolt"></i> Aplicar: ${action}
            </button>`;
        });
      }

      extraHtml += `</div>`;
    }

    return extraHtml ? `<div class="chat-footer-v3">${extraHtml}</div>` : "";
  }
}

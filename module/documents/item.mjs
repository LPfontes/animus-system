export class AnimusItem extends Item {
  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    this._prepareBonusAttributes();
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
   * Executa a lógica de uso do item
   */
  async use() {
    const usage = this.system.application;
    const actor = this.actor;
    
    if ( !actor ) return;

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
      content: `<div class="animus-chat-card">${chatContent}</div>`
    });
  }
}

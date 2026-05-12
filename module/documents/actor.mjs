export class AnimusActor extends Actor {

  /** @override */
  async _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);
    
    // Apenas o usuário que fez o update processa a automação para evitar duplicatas
    if (userId !== game.user.id) return;
    if (this.type !== "character") return;

    // Verificar se o HP mudou
    if (foundry.utils.hasProperty(changed, "system.status.hp.value")) {
      await this._checkHPStatus();
    }
  }

  /** @override */
  async _preUpdate(changed, options, user) {
    const ret = await super._preUpdate(changed, options, user);
    if (ret === false) return false;

    // Bloquear gastos excessivos de pontos de evolução (se não for editMode)
    const isCharacter = this.type === "character";
    const hasDistPoints = foundry.utils.hasProperty(changed, "system.details.advancement.distributedPoints");
    const editMode = options.editMode || (this.sheet?.editMode);

    if (isCharacter && hasDistPoints && !editMode) {
      const newDist = foundry.utils.mergeObject(
        this.system.details.advancement.distributedPoints,
        foundry.utils.getProperty(changed, "system.details.advancement.distributedPoints")
      );
      
      const level = changed.system?.details?.level || this.system.details.level;
      const availableTotal = (level - 1) * 3;
      const spent = (newDist.hp || 0) + (newDist.pe || 0) + (newDist.pa || 0);

      if (spent > availableTotal) {
        ui.notifications.warn(`Você não possui pontos de evolução suficientes (${spent}/${availableTotal}).`);
        return false;
      }
    }

    return true;
  }

  /**
   * Verifica se o personagem deve receber as condições Cansado ou Exausto com base no PV
   */
  async _checkHPStatus() {
    const hp = this.system.status.hp;
    const ratio = hp.value / hp.max;
    
    // Exausto: Perdeu 90% ou mais (HP <= 10% do Max)
    const shouldBeExausto = ratio <= 0.1 && hp.value > 0;
    // Cansado: Perdeu 50% ou mais (HP <= 50% do Max), mas não chegou a Exausto
    const shouldBeCansado = ratio <= 0.5 && !shouldBeExausto && hp.value > 0;
    
    const cansadoItem = this.items.find(i => i.name === "Cansado" && i.type === "condition");
    const exaustoItem = this.items.find(i => i.name === "Exausto (nível)" && i.type === "condition");

    // Gerenciar Cansado
    if (shouldBeCansado && !cansadoItem) {
      await this._applyConditionFromCompendium("Cansado");
      ui.notifications.warn(`${this.name} está Cansado (PV abaixo de 50%).`);
    } else if (!shouldBeCansado && cansadoItem) {
      await cansadoItem.delete();
    }

    // Gerenciar Exausto
    if (shouldBeExausto && !exaustoItem) {
      await this._applyConditionFromCompendium("Exausto (nível)");
      ui.notifications.error(`${this.name} está EXAUSTO (PV abaixo de 10%)!`);
    } else if (!shouldBeExausto && exaustoItem) {
      await exaustoItem.delete();
    }
  }

  /**
   * Busca um item de condição no compêndio e aplica ao ator
   */
  async _applyConditionFromCompendium(name) {
    const pack = game.packs.get("animus.condicoes");
    if (!pack) return;
    
    // Garantir que o índice está carregado
    if (!pack.indexed) await pack.getIndex();
    
    const entry = pack.index.find(e => e.name === name);
    if (!entry) return;
    
    const item = await pack.getDocument(entry._id);
    const itemData = item.toObject();
    
    return this.createEmbeddedDocuments("Item", [itemData]);
  }

  /**
   * Realiza um Descanso Curto (10-30 min)
   */
  async shortRest() {
    if (this.type !== "character") return;
    
    const details = this.system.details;
    const shortRests = details.shortRests || 0;
    if (shortRests >= 2) {
      ui.notifications.warn("Você já atingiu o limite de 2 descansos curtos antes de um descanso longo.");
      return;
    }

    const status = this.system.status;
    const updates = {};
    
    // PE: Recupera 2 x Nível
    const peRecov = (details.level || 1) * 2;
    updates["system.status.pe.value"] = Math.min(status.pe.max, status.pe.value + peRecov);
    
    // Proteção: Recupera metade do máximo (se o valor atual for maior que 0)
    // Se a armadura zerou, precisa de reparos primeiro.
    if (status.prot.value > 0) {
      const protMax = status.prot.max;
      const protRecov = Math.floor(protMax / 2);
      updates["system.status.prot.value"] = Math.min(protMax, status.prot.value + protRecov);
    }
    
    // Incrementar contador
    updates["system.details.shortRests"] = shortRests + 1;
    
    await this.update(updates);
    ui.notifications.info(`${this.name} realizou um descanso curto. Recuperou PE e restaurou Proteção.`);
  }

  /**
   * Realiza um Descanso Longo (8h)
   */
  async longRest() {
    if (this.type !== "character") return;
    
    const status = this.system.status;
    const updates = {
      "system.status.hp.value": status.hp.max,
      "system.status.pe.value": status.pe.max,
      "system.status.pa.value": status.pa.max,
      "system.details.shortRests": 0
    };
    
    // Proteção completa se houver armadura
    updates["system.status.prot.value"] = status.prot.max;
    
    await this.update(updates);
    ui.notifications.info(`${this.name} realizou um descanso longo. Todos os recursos foram restaurados.`);
  }

  /**
   * Consome um recurso do ator (HP, PE ou PA)
   * @param {string} type - 'hp', 'pe' ou 'pa'
   * @param {number} amount - quantidade a ser subtraída
   * @returns {Promise<boolean>} - true se o recurso foi consumido, false se não havia o suficiente
   */
  async consumeResource(type, amount) {
    if (amount <= 0) return true;
    
    const current = foundry.utils.getProperty(this.system.status, `${type}.value`) || 0;
    if (current < amount) {
      const label = type === "pa" ? "PA" : type.toUpperCase();
      ui.notifications.warn(`Você não possui ${label} suficiente (${current}/${amount}).`);
      return false;
    }
    
    await this.update({ [`system.status.${type}.value`]: current - amount });
    return true;
  }

  /**
   * Calcula o custo adicional por repetição de ação no turno.
   * @param {string} actionId - Identificador da ação (nome ou ID)
   * @returns {number} - Custo adicional (0 ou 1)
   */
  getActionRepeatCost(actionId) {
    // Apenas em combate
    if (!game.combat?.active) return 0;
    
    const turnActions = this.getFlag("animus", "turnActions") || [];
    return turnActions.includes(actionId) ? 1 : 0;
  }

  /**
   * Registra o uso de uma ação no turno atual.
   * @param {string} actionId - Identificador da ação
   */
  async recordTurnAction(actionId) {
    if (!game.combat?.active) return;
    
    const turnActions = this.getFlag("animus", "turnActions") || [];
    if (!turnActions.includes(actionId)) {
      const newActions = [...turnActions, actionId];
      await this.setFlag("animus", "turnActions", newActions);
    }
  }
}

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;
import { AnimusRoll } from "../../dice.mjs";

export class AnimusNPCSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  constructor(options = {}) {
    super(options);
    this.isEditing = false;
  }

  get actor() {
    return this.document;
  }

  static DEFAULT_OPTIONS = {
    classes: ["animus", "sheet", "npc"],
    position: { width: 800, height: 900 },
    actions: {
      toggleMode: AnimusNPCSheet.prototype._onToggleMode,
      rollAttack: AnimusNPCSheet.prototype._onRollAttack,
      rollAttribute: AnimusNPCSheet.prototype._onRollAttribute,
      rollAbility: AnimusNPCSheet.prototype._onRollAbility,
      addSkill: AnimusNPCSheet.prototype._onAddSkill,
      deleteSkill: AnimusNPCSheet.prototype._onDeleteSkill,
      addAbility: AnimusNPCSheet.prototype._onAddAbility,
      deleteAbility: AnimusNPCSheet.prototype._onDeleteAbility,
      rollAbilityTest: AnimusNPCSheet.prototype._onRollAbilityTest,
      rollAbilityFormula: AnimusNPCSheet.prototype._onRollAbilityFormula,
      triggerSpecialAction: AnimusNPCSheet.prototype._onTriggerSpecialAction,
      addTurnPattern: AnimusNPCSheet.prototype._onAddTurnPattern,
      deleteTurnPattern: AnimusNPCSheet.prototype._onDeleteTurnPattern,
      toggleCollapse: AnimusNPCSheet.prototype._onToggleCollapse
    },
    form: {
      handler: AnimusNPCSheet.#onSubmit,
      submitOnChange: true,
      closeOnSubmit: false
    }
  };

  static PARTS = {
    body: { template: "systems/animus/templates/actor/npc-sheet.hbs" }
  };

  async _prepareContext(options) {
    const context = {
      actor: this.document,
      system: this.document.system,
      config: CONFIG.ANIMUS,
      isEditing: this.isEditing,
      isGM: game.user.isGM,
      owner: this.document.isOwner
    };

    // Preparar labels das perícias
    context.skills = context.system.skills.map(s => ({
      ...s,
      label: CONFIG.ANIMUS.skills[s.key]?.label || s.key,
      rankLabel: ["", "Amador", "Profissional", "Mestre"][s.rank]
    }));

    // Cores de raridade para habilidades
    context.rarityColors = {
      comum: "#a0a0a0",
      incomum: "#2e7d32",
      raro: "#7b1fa2",
      mistico: "#ff8f00",
      lendario: "#c62828"
    };

    return context;
  }

  _onToggleMode(event, target) {
    this.isEditing = !this.isEditing;
    this.render();
  }

  async _onRollAttribute(event, target) {
    const attrKey = target.dataset.attr;
    const attr = this.actor.system.attributes[attrKey];
    if (!attr) return;

    // Usar o pool de dados de ataque do NPC (ex: 3d6)
    const diceMatch = this.actor.system.attack.formula.match(/^(\d+)d6/);
    const poolSize = diceMatch ? parseInt(diceMatch[1]) : 2;

    await AnimusRoll.rollTest({
      poolSize: poolSize,
      attributeValue: attr.value,
      label: `Teste de ${attrKey.toUpperCase()}`,
      speaker: this.actor
    });
  }

  async _onRollAttack(event, target) {
    const system = this.actor.system;
    const formula = system.attack.formula;
    const attrKey = system.attack.attribute;
    const attrBonus = system.attributes[attrKey]?.value || 0;
    const baseBonus = system.attack.baseBonus || 0;
    const totalBonus = attrBonus + baseBonus;
    
    // Aptidão do ataque (baseado no ND/Classificação)
    const aptitudeLevels = { none: 0, amador: 1, profissional: 2, mestre: 3, "sem apt.": 0 };
    const poolBonus = aptitudeLevels[system.attack.aptitude?.toLowerCase()] || 0;
    
    // Parsear pool de dados (ex: "4d6")
    const diceMatch = formula.match(/^(\d+)d6/);
    const poolSize = diceMatch ? parseInt(diceMatch[1]) : 2;

    await AnimusRoll.rollTest({
      poolSize: poolSize,
      attributeValue: totalBonus,
      label: `Ataque: ${system.attack.label}`,
      speaker: this.actor,
      hitTable: system.damageTable
    });
  }

  async _onRollAbility(event, target) {
    const index = target.dataset.index;
    const ability = this.actor.system.abilities[index];
    if (!ability) return;

    // Criar mensagem de chat para a habilidade
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="animus-chat-card">
          <div class="chat-header" style="border-left: 4px solid ${this._getRarityColor(ability.rarity)}">
            <h3>${ability.name}</h3>
            <div class="chat-tags">
              ${ability.frequency ? `<span class="tag">${ability.frequency}</span>` : ""}
              ${ability.paCost ? `<span class="tag cost">${ability.paCost} PA</span>` : ""}
            </div>
          </div>
          <div class="chat-body">
            ${ability.description}
          </div>
        </div>
      `
    });
  }

  async _onRollAbilityTest(event, target) {
    const index = target.dataset.index;
    const ability = this.actor.system.abilities[index];
    if (!ability || !ability.check.attribute) return;

    const attrKey = ability.check.attribute;
    const attr = this.actor.system.attributes[attrKey];
    const difficulty = ability.check.difficulty || "10";
    
    // Usar o pool de dados de ataque do NPC (ex: 3d6)
    const diceMatch = this.actor.system.attack.formula.match(/^(\d+)d6/);
    const poolSize = diceMatch ? parseInt(diceMatch[1]) : 2;

    await AnimusRoll.rollTest({
      poolSize: poolSize,
      attributeValue: attr.value,
      label: `Teste de ${attrKey.toUpperCase()}: ${ability.name}`,
      speaker: this.actor,
      difficulty: difficulty
    });
  }

  async _onRollAbilityFormula(event, target) {
    const index = target.dataset.index;
    const ability = this.actor.system.abilities[index];
    if (!ability || !ability.formula) return;

    const roll = await new Roll(ability.formula).evaluate();
    
    return roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `Habilidade: ${ability.name}`
    });
  }

  _getRarityColor(rarity) {
    const colors = {
      comum: "#a0a0a0",
      incomum: "#2e7d32",
      raro: "#7b1fa2",
      mistico: "#ff8f00",
      lendario: "#c62828"
    };
    return colors[rarity] || colors.comum;
  }

  async _onAddSkill(event, target) {
    const skills = [...this.actor.system.skills, { key: "luta", rank: 1 }];
    await this.actor.update({ "system.skills": skills });
  }

  async _onDeleteSkill(event, target) {
    const index = parseInt(target.dataset.index);
    const skills = this.actor.system.skills.filter((_, i) => i !== index);
    await this.actor.update({ "system.skills": skills });
  }

  async _onAddAbility(event, target) {
    const abilities = [...this.actor.system.abilities, { name: "Nova Habilidade", rarity: "comum", description: "" }];
    await this.actor.update({ "system.abilities": abilities });
  }

  async _onDeleteAbility(event, target) {
    const index = parseInt(target.dataset.index);
    const abilities = this.actor.system.abilities.filter((_, i) => i !== index);
    await this.actor.update({ "system.abilities": abilities });
  }

  async _onAddTurnPattern(event, target) {
    const patterns = [...this.actor.system.turnPatterns, { label: "Novo Turno", description: "", totalPA: 0 }];
    await this.actor.update({ "system.turnPatterns": patterns });
  }

  async _onDeleteTurnPattern(event, target) {
    const index = parseInt(target.dataset.index);
    const patterns = this.actor.system.turnPatterns.filter((_, i) => i !== index);
    await this.actor.update({ "system.turnPatterns": patterns });
  }

  async _onToggleCollapse(event, target) {
    const abilityItem = target.closest(".ability-npc-item");
    const turnCard = target.closest(".turn-card");

    if (abilityItem) {
      const index = parseInt(target.closest("[data-index]")?.dataset.index);
      if (isNaN(index)) {
        // Find index by searching in the each loop context if possible, 
        // but easier to just add data-index to the header or parent.
        // Looking at the template, the ability loop has index 'i'.
      }
      
      // Let's re-verify the template to see where data-index is.
      // I'll add data-index to the container in a follow-up if needed, 
      // but let's try to find it.
    }

    // Actually, it's easier to just toggle the class in the DOM for immediate feedback,
    // and then update the data for persistence.
    const container = target.closest(".ability-npc-item, .turn-card");
    if (!container) return;

    container.classList.toggle("collapsed");

    // Persistence logic
    const index = parseInt(container.querySelector("[data-index]")?.dataset.index || container.dataset.index);
    if (container.classList.contains("ability-npc-item")) {
      const abilities = [...this.actor.system.abilities];
      if (abilities[index]) {
        abilities[index].collapsed = container.classList.contains("collapsed");
        await this.actor.update({ "system.abilities": abilities });
      }
    } else if (container.classList.contains("turn-card")) {
      const patterns = [...this.actor.system.turnPatterns];
      if (patterns[index]) {
        patterns[index].collapsed = container.classList.contains("collapsed");
        await this.actor.update({ "system.turnPatterns": patterns });
      }
    }
  }

  async _onDrop(event) {
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData('text/plain'));
    } catch (err) {
      return false;
    }
    
    if (data.type !== "Item") return super._onDrop(event);

    const item = await Item.fromDropData(data);
    if (!item) return;

    if (item.type === "talent") {
      const abilities = [...this.actor.system.abilities];
      abilities.push({
        name: item.name,
        rarity: "comum",
        talentCost: item.system.cost || 0,
        bonuses: item.system.bonuses || {},
        check: item.system.check || {},
        specialActions: item.system.specialActions || [],
        formula: item.system.formula || "",
        description: item.system.description
      });
      await this.actor.update({ "system.abilities": abilities });
      ui.notifications.info(`Talento "${item.name}" adicionado às habilidades.`);
      return;
    }

    return super._onDrop(event);
  }

  static async #onSubmit(event, form, formData) {
    const updateData = foundry.utils.expandObject(formData.object);
    await this.document.update(updateData);
  }
}

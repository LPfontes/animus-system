const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;
import { AnimusRoll } from "../../dice.mjs";

export class AnimusActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["animus", "sheet", "actor"],
    position: {
      width: 900,
      height: 800
    },
    actions: {
      editItem: AnimusActorSheet.#onEditItem,
      deleteItem: AnimusActorSheet.#onDeleteItem,
      updateAbility: this.prototype._onUpdateAbility,
      rollSkill: this.prototype._onRollSkill
    },
    form: {
      handler: AnimusActorSheet.#onSubmit,
      submitOnChange: true,
      closeOnSubmit: false
    },
    tabs: [
      { navSelector: ".side-tabs", contentSelector: ".sheet-body", initial: "attributes", label: "ANIMUS.Attributes" }
    ]
  };

  /** @override */
  tabGroups = {
    primary: "attributes"
  };

  /** @override */
  static PARTS = {
    body: { template: "systems/animus/templates/actor/actor-sheet.hbs" }
  };

  /** @override */
  async _prepareContext(options) {
    const context = {
      actor: this.document,
      system: this.document.system,
      config: CONFIG.ANIMUS,
      owner: this.document.isOwner,
      editable: this.isEditable,
      tabs: this._getTabs(options)
    };

    // Categorizar itens
    const items = this.document.items;
    const weapons = [];
    const talents = [];
    const properties = [];
    const actions = [];
    const checks = [];
    const gear = [];

    for (let i of items) {
      const itemData = i.toObject();
      itemData.id = i.id;
      itemData.img = i.img;

      if (i.type === "weapon") {
        itemData.calculatedDamage = i.system.damageTable;
        weapons.push(itemData);
      }
      else if (i.type === "talent") talents.push(itemData);
      else if (i.type === "property") properties.push(itemData);
      else if (i.type === "action") actions.push(itemData);
      else if (i.type === "check") checks.push(itemData);
      else gear.push(itemData);
    }

    context.weapons = weapons;
    context.talents = talents;
    context.properties = properties;
    context.actions = actions;
    context.checks = checks;
    context.items = gear;

    // Group skills by attribute (Unified Style)
    const system = this.actor.system;
    const categories = [
      { title: 'FÍSICOS', attrs: ['pot', 'hab'] },
      { title: 'MENTAIS', attrs: ['cog', 'per'] },
      { title: 'PESSOAIS', attrs: ['pre', 'ani'] }
    ];

    context.unifiedAbilities = categories.map(cat => ({
      title: cat.title,
      attributes: cat.attrs.map(attrKey => ({
        key: attrKey,
        label: CONFIG.ANIMUS.attributes[attrKey],
        value: system.attributes[attrKey].value,
        skills: Object.entries(CONFIG.ANIMUS.skills)
          .filter(([_, s]) => s.attr === attrKey)
          .map(([sKey, s]) => ({
            key: sKey,
            label: s.label,
            value: system.skills[sKey].value,
            active: system.skills[sKey].value > 0
          }))
      }))
    }));

    return context;
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);

    // Adiciona listener para troca de abas
    const nav = this.element.querySelector(".side-tabs");
    if (nav) {
      nav.querySelectorAll(".item").forEach(item => {
        item.addEventListener("click", event => {
          const tab = event.currentTarget.dataset.tab;
          if (tab) {
            this.tabGroups.primary = tab;
            this.render();
          }
        });
      });
    }
  }

  /**
   * Handle updating attributes or skills via dots/boxes
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  async _onUpdateAbility(event, target) {
    const { ability, value } = target.dataset;
    const newValue = parseInt(value);
    const currentValue = foundry.utils.getProperty(this.actor.system, `${ability}.value`);

    // Toggle logic: if clicking the current value, reduce by 1 (or to 0)
    const finalValue = currentValue === newValue ? newValue - 1 : newValue;

    await this.actor.update({
      [`system.${ability}.value`]: Math.max(0, finalValue)
    });
  }

  /**
   * Handle rolling a skill
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  async _onRollSkill(event, target) {
    const skillKey = target.dataset.skill;
    const skillData = CONFIG.ANIMUS.skills[skillKey];
    const skill = this.actor.system.skills[skillKey];
    
    // Puxar o atributo pai diretamente da config
    const attrKey = skillData.attr;
    const attr = this.actor.system.attributes[attrKey];

    const label = game.i18n.localize(skillData.label);
    
    // Lógica Animus: Pool = 2 + nível de perícia
    const poolSize = 2 + (skill.value || 0);

    // Detectar Vantagem/Desvantagem por teclas (exemplo)
    let advantage = null;
    if (event.shiftKey) advantage = "advantage";
    if (event.altKey || event.ctrlKey) advantage = "disadvantage";

    await AnimusRoll.rollTest({
      poolSize: poolSize,
      attributeValue: attr.value || 0,
      label: `Teste de ${label}`,
      advantage: advantage,
      speaker: this.actor
    });
  }

  /**
   * Helper para gerenciar o estado das abas no V2
   */
  _getTabs(options) {
    const tabs = {
      attributes: { id: "attributes", group: "primary", label: "ANIMUS.Profile" },
      combat: { id: "combat", group: "primary", label: "ANIMUS.Combat" },
      inventory: { id: "inventory", group: "primary", label: "ANIMUS.Inventory" },
      description: { id: "description", group: "primary", label: "ANIMUS.Biography" }
    };

    // Usa o tabGroups nativo do ApplicationV2
    const activeTab = this.tabGroups?.primary || "attributes";

    for (const v of Object.values(tabs)) {
      v.active = activeTab === v.id;
      v.cssClass = v.active ? "active" : "";
    }
    return tabs;
  }

  /**
   * Handler para submissão do formulário
   */
  static async #onSubmit(event, form, formData) {
    const updateData = foundry.utils.expandObject(formData.object);
    await this.document.update(updateData);
  }

  static async #onEditItem(event) {
    const li = event.currentTarget.closest(".item-row");
    const item = this.document.items.get(li.dataset.itemId);
    item.sheet.render(true);
  }

  static async #onDeleteItem(event) {
    const li = event.currentTarget.closest(".item-row");
    const item = this.document.items.get(li.dataset.itemId);
    item.delete();
  }
}

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;
import { AnimusRoll } from "../../dice.mjs";

export class AnimusActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["animus", "sheet", "actor"],
    position: {
      width: 1000,
      height: 950
    },
    actions: {
      editItem: AnimusActorSheet.#onEditItem,
      deleteItem: AnimusActorSheet.#onDeleteItem,
      updateAbility: this.prototype._onUpdateAbility,
      rollSkill: this.prototype._onRollSkill,
      updatePA: this.prototype._onUpdatePA,
      editImage: this.prototype._onEditImage
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
    navigation: { template: "systems/animus/templates/actor/actor-navigation.hbs" },
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
      tabs: this._getTabs(options),
      hpPercent: Math.min(100, Math.max(0, (this.actor.system.status.hp.value / (this.actor.system.status.hp.max || 1)) * 100)),
      pePercent: Math.min(100, Math.max(0, (this.actor.system.status.pe.value / (this.actor.system.status.pe.max || 1)) * 100)),
      paPips: Array.from({length: this.actor.system.status.pa.max || 0}, (_, i) => ({
        filled: i < this.actor.system.status.pa.value
      }))
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

    const html = this.element;

    // Garantir que as barras estejam corretas após cada renderização
    this._updateBars();

    // Listeners para atualização em tempo real das barras ao digitar
    let saveTimeout;
    html.querySelectorAll('.stat-input-overlay').forEach(input => {
      input.addEventListener('input', (ev) => {
        const val = parseInt(ev.target.value) || 0;
        const name = ev.target.name;
        const maxPath = name.replace('.value', '.max');
        const max = foundry.utils.getProperty(this.actor, maxPath) || 1;
        const percent = Math.min(100, Math.max(0, (val / max) * 100));

        const type = name.includes('.hp.') ? 'hp' : 'pe';
        const bar = html.querySelector(`.bar-fill.${type}`);
        if (bar) bar.style.width = `${percent}%`;

        // Forçar salvamento automático após 1s de inatividade
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(async () => {
          await this.actor.update({ [name]: val });
        }, 1000);
      });
    });

    // Adiciona listener para troca de abas (suporte manual adicional)
    const nav = html.querySelector(".side-tabs");
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
   * Handle updating PA value via pips
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  async _onUpdatePA(event, target) {
    const newValue = parseInt(target.dataset.value);
    const currentValue = this.actor.system.status.pa.value;
    const finalValue = currentValue === newValue ? newValue - 1 : newValue;
    await this.actor.update({ "system.status.pa.value": Math.max(0, finalValue) });
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
   * Handle editing the actor's image
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  async _onEditImage(event, target) {
    const attr = target.dataset.edit || "img";
    const current = foundry.utils.getProperty(this.document, attr);
    const fp = new FilePicker({
      type: "image",
      current: current,
      callback: path => {
        this.document.update({ [attr]: path });
      },
      top: this.position.top + 40,
      left: this.position.left + 10
    });
    return fp.browse();
  }

  /**
   * Update the status bars visually
   */
  _updateBars() {
    if (!this.element) return;
    const html = this.element;
    const hp = this.actor.system.status.hp;
    const pe = this.actor.system.status.pe;

    const hpPercent = Math.min(100, Math.max(0, (hp.value / (hp.max || 1)) * 100));
    const pePercent = Math.min(100, Math.max(0, (pe.value / (pe.max || 1)) * 100));

    // Update HP
    const hpBar = html.querySelector('.bar-fill.hp');
    const hpGhost = html.querySelector('.bar-ghost.hp');
    if (hpBar) hpBar.style.width = `${hpPercent}%`;
    if (hpGhost) hpGhost.style.width = `${hpPercent}%`;

    // Update PE
    const peBar = html.querySelector('.bar-fill.pe');
    const peGhost = html.querySelector('.bar-ghost.pe');
    if (peBar) peBar.style.width = `${pePercent}%`;
    if (peGhost) peGhost.style.width = `${pePercent}%`;
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

const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class AnimusItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["animus", "sheet", "item"],
    position: {
      width: 800,
      height: 800
    },
    actions: {
      arrayAdd: AnimusItemSheet.#onArrayAdd,
      arrayDelete: AnimusItemSheet.#onArrayDelete,
      rollDamage: AnimusItemSheet.#onRollDamage,
      rollAttack: AnimusItemSheet.#onRollAttack,
      reqAdd: AnimusItemSheet.#onReqAdd,
      reqDelete: AnimusItemSheet.#onReqDelete,
      toggleMode: AnimusItemSheet.#onToggleMode
    },
    form: {
      handler: AnimusItemSheet.#onSubmit,
      submitOnChange: true,
      closeOnSubmit: false
    }
  };

  /** @override */
  static PARTS = {
    body: { template: "systems/animus/templates/item/item-sheet.hbs" }
  };

  isEditing = false;

  /** @override */
  async _prepareContext(options) {
    const context = {
      item: this.document,
      system: this.document.system,
      config: CONFIG.ANIMUS,
      owner: this.document.isOwner,
      editable: this.isEditable,
      isEditing: this.isEditing,
      talentNames: {}
    };

    // Resolve nomes de talentos para os IDs nos requisitos
    const talents = this.document.system.requirements?.talents || {};
    const talentIds = Object.values(talents);
    if (talentIds.length) {
      for (const id of talentIds) {
        if (!id) continue;
        const talent = await this.#getTalentFromPacks(id);
        if (talent) context.talentNames[id] = talent.name;
      }
    }

    // Resolve nomes de propriedades para as armas
    const properties = this.document.system.properties || [];
    context.propertyNames = {};
    if (properties.length) {
      for (const id of properties) {
        if (!id) continue;
        const property = await this.#getPropertyFromPacks(id);
        if (property) context.propertyNames[id] = property.name;
      }
    }

    return context;
  }

  async #getTalentFromPacks(id) {
    const packs = game.packs.filter(p => p.metadata.type === "Item");
    for (const pack of packs) {
      const index = await pack.getIndex();
      const entry = index.get(id);
      if (entry) return entry;
    }
    return null;
  }

  async #getPropertyFromPacks(id) {
    const packs = game.packs.filter(p => p.metadata.type === "Item");
    for (const pack of packs) {
      const index = await pack.getIndex();
      const entry = index.get(id);
      if (entry) return entry;
    }
    return null;
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
  }

  /**
   * Handler para submissão do formulário
   */
  static async #onSubmit(event, form, formData) {
    const updateData = foundry.utils.expandObject(formData.object);
    await this.document.update(updateData);
  }

  static async #onRollDamage(event, target) {
    const ac = target.dataset.ac;
    const item = this.document;
    const actor = item.actor;

    const damageData = item.system.damage[ac];
    const base = damageData.base || 0;
    const mult = damageData.mult || 0;

    let totalDamage = base;
    let attrLabel = "N/A";

    if (actor) {
      const attrKey = CONFIG.ANIMUS.attributesEnum[item.system.attribute].toLowerCase();
      const attrValue = actor.system.attributes[attrKey]?.value || 0;
      totalDamage = base + (mult * attrValue);
      attrLabel = game.i18n.localize(CONFIG.ANIMUS.attributes[attrKey]);
    }

    const flavor = `<b>${item.name}</b> - Dano (${ac.toUpperCase()})<br>
                    <span style="font-size: 0.8em;">Base: ${base} + (Mult: ${mult} x ${attrLabel})</span>`;

    const roll = await new Roll(`${totalDamage}`).evaluate();
    return roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      flavor: flavor
    });
  }

  static async #onRollAttack(event, target) {
    const item = this.document;
    const actor = item.actor;
    if (!actor) return ui.notifications.warn("Este item precisa estar em um personagem para ser rolado.");

    const { AnimusRoll } = await import("../../dice.mjs");
    const attrKey = CONFIG.ANIMUS.attributesEnum[item.system.attribute].toLowerCase();
    const attrValue = actor.system.attributes[attrKey]?.value || 0;

    return AnimusRoll.rollTest({
      poolSize: 2,
      attributeValue: attrValue,
      label: `Ataque: ${item.name}`,
      speaker: actor
    });
  }

  static async #onArrayAdd(event, target) {
    const field = target.dataset.field;
    const array = foundry.utils.getProperty(this.document.system, field) || [];
    const newArray = [...array, ""];
    await this.document.update({ [`system.${field}`]: newArray });
  }

  static async #onArrayDelete(event, target) {
    const field = target.dataset.field;
    const index = parseInt(target.dataset.index);
    const array = foundry.utils.getProperty(this.document.system, field) || [];
    const newArray = array.filter((_, i) => i !== index);
    await this.document.update({ [`system.${field}`]: newArray });
  }

  static async #onReqAdd(event, target) {
    const type = target.dataset.type; // attributes, skills, talents
    const path = `system.requirements.${type}`;
    const array = foundry.utils.getProperty(this.document, path) || [];

    if (type === "talents") {
      const name = await new Promise(resolve => {
        new Dialog({
          title: "Novo Requisito de Talento",
          content: `<div class="form-group"><label>Nome do Talento</label><input type="text" id="talent-name" placeholder="Ex: Ação Refinada I"></div>`,
          buttons: {
            ok: { label: "Adicionar", callback: (html) => resolve(html.find("#talent-name").val()) },
            cancel: { label: "Cancelar", callback: () => resolve(null) }
          },
          default: "ok"
        }).render(true);
      });
      if (!name) return;
      return this.document.update({ [`${path}.${name}`]: "" });
    }

    let newItem;
    if (type === "attributes") newItem = { key: "pot", value: 1 };
    else if (type === "skills") newItem = { key: "atletismo", rank: 1 };

    const newArray = [...array, newItem];
    await this.document.update({ [path]: newArray });
  }

  static async #onReqDelete(event, target) {
    const type = target.dataset.type;
    const index = target.dataset.index;
    const path = `system.requirements.${type}`;

    if (type === "talents") {
      return this.document.update({ [`${path}.-=${index}`]: null });
    }

    const array = foundry.utils.getProperty(this.document, path) || [];
    const newArray = array.filter((_, i) => i !== parseInt(index));
    await this.document.update({ [path]: newArray });
  }

  static #onToggleMode(event, target) {
    this.isEditing = !this.isEditing;
    this.render();
  }
}

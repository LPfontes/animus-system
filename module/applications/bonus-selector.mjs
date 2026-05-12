const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Application for selecting attribute bonuses from Ascendancy or Element items.
 */
export class AnimusBonusSelector extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this.item = options.item;
    this.actor = options.item.actor;
  }

  static get DEFAULT_OPTIONS() {
    return foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
      tag: "form",
      classes: ["animus", "bonus-selector"],
      position: {
        width: 800,
        height: "auto"
      },
      window: {
        title: "SELECIONAR BÔNUS",
        resizable: false,
        minimizable: false
      },
      actions: {
        submit: AnimusBonusSelector.prototype._onSubmit
      }
    });
  }

  static PARTS = {
    body: { template: "systems/animus/templates/apps/bonus-selector.hbs" }
  };

  /** @override */
  async _prepareContext(options) {
    const bonus = this.item.system.bonus;
    const availableAttributes = bonus.attributes || [];

    // Map attributes to labels using system config and localization
    const options_list = availableAttributes.map(attr => ({
      key: attr,
      label: game.i18n.localize(CONFIG.ANIMUS.attributes[attr]?.label || attr) || attr.toUpperCase(),
      selected: bonus.selectedAttribute === attr
    }));

    return {
      itemName: this.item.name,
      itemImg: this.item.img,
      options: options_list,
      itemType: this.item.type === "ascendancy" ? "ASCENDÊNCIA" : "ELEMENTO"
    };
  }

  async _onSubmit(event, target) {
    const formData = new foundry.applications.ux.FormDataExtended(this.element).object;
    const selected = formData.selectedAttribute;

    if (!selected) {
      ui.notifications.warn("Por favor, selecione um atributo.");
      return;
    }

    await this.item.update({ "system.bonus.selectedAttribute": selected });
    ui.notifications.info(`Bônus de ${this.item.name} aplicado em ${selected.toUpperCase()}.`);
    this.close();
  }
}

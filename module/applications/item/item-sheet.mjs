const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class AnimusItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["animus", "sheet", "item"],
    position: {
      width: 520,
      height: 600
    },
    actions: {
      arrayAdd: AnimusItemSheet.#onArrayAdd,
      arrayDelete: AnimusItemSheet.#onArrayDelete
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

  /** @override */
  async _prepareContext(options) {
    return {
      item: this.document,
      system: this.document.system,
      config: CONFIG.ANIMUS,
      owner: this.document.isOwner,
      editable: this.isEditable
    };
  }

  /**
   * Handler para submissão do formulário
   */
  static async #onSubmit(event, form, formData) {
    const updateData = foundry.utils.expandObject(formData.object);
    await this.document.update(updateData);
  }

  static async #onArrayAdd(event) {
    const field = event.currentTarget.dataset.field;
    const array = foundry.utils.getProperty(this.document.system, field) || [];
    
    // Adiciona uma string vazia (ID) ou valor padrão
    const newArray = [...array, ""];
    await this.document.update({ [`system.${field}`]: newArray });
  }

  static async #onArrayDelete(event) {
    const field = event.currentTarget.dataset.field;
    const index = parseInt(event.currentTarget.dataset.index);
    const array = foundry.utils.getProperty(this.document.system, field) || [];
    
    const newArray = array.filter((_, i) => i !== index);
    await this.document.update({ [`system.${field}`]: newArray });
  }
}

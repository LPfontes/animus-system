const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Diálogo de Rolagem modernizado para ApplicationV2
 */
export class AnimusRollDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this.resolve = options.resolve;
    this.reject = options.reject;
    this.weapon = options.weapon;
  }

  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["animus", "roll-dialog", "glass-panel"],
    position: {
      width: 400,
      height: "auto"
    },
    window: {
      title: "OPÇÕES DE ROLAGEM",
      resizable: false,
      controls: []
    },
    form: {
      handler: AnimusRollDialog.#onSubmit,
      closeOnSubmit: true,
      submitOnChange: false
    }
  };

  static PARTS = {
    body: { template: "systems/animus/templates/apps/roll-dialog.hbs" }
  };

  /** @override */
  async _prepareContext(options) {
    return {
      weapon: this.weapon
    };
  }

  static async #onSubmit(event, form, formData) {
    const data = foundry.utils.expandObject(formData.object);
    this.resolve(data);
  }

  /**
   * Método estático para facilitar a chamada via await
   */
  static async awaitRoll(weapon) {
    return new Promise((resolve, reject) => {
      const dialog = new this({
        weapon,
        resolve,
        reject
      });
      dialog.render(true);
    });
  }
}

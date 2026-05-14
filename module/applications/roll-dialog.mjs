const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Diálogo de Rolagem modernizado para ApplicationV2
 */
export class AnimusRollDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this.resolve = options.resolve;
    this.reject = options.reject;
    this.data = options.data || {};
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
    const poolSize = this.data.poolSize || 2;
    return {
      ...this.data,
      dice: Array.from({ length: poolSize }, (_, i) => i),
      rollModes: CONFIG.Dice.rollModes
    };
  }

  static async #onSubmit(event, form, formData) {
    const data = foundry.utils.expandObject(formData.object);
    
    // Captura qual botão de submissão foi clicado para definir a vantagem
    const submitter = event.submitter;
    if (submitter && submitter.name === "advantage") {
      data.advantage = submitter.value;
    }

    this.resolve(data);
  }

  /**
   * Método estático para facilitar a chamada via await
   */
  static async awaitRoll(data = {}) {
    return new Promise((resolve, reject) => {
      const dialog = new this({
        data,
        resolve,
        reject
      });
      dialog.render(true);
    });
  }
}

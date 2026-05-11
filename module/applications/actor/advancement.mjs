const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Application for character leveling and stat distribution.
 */
export class AnimusAdvancement extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this.document = options.document;
  }

  get actor() {
    return this.document;
  }

  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["animus", "advancement-app"],
    position: {
      width: 600,
      height: "auto"
    },
    window: {
      title: "CENTRO DE EVOLUÇÃO",
      icon: "fas fa-level-up-alt",
      resizable: false
    },
    actions: {
      adjust: AnimusAdvancement.prototype._onAdjust,
      confirm: AnimusAdvancement.prototype._onConfirm
    },
    form: {
      handler: "_onSubmit",
      submitOnChange: true,
      closeOnSubmit: false
    }
  };

  static PARTS = {
    body: { template: "systems/animus/templates/apps/advancement.hbs" }
  };

  /** @override */
  async _prepareContext(options) {
    if (!this.actor) return {};
    const system = this.actor.system;
    const advancement = system.details.advancement;
    
    const stats = [
      { id: "hp", label: "PV", value: advancement.distributedPoints.hp || 0, bonus: (advancement.distributedPoints.hp || 0) * 1 },
      { id: "pe", label: "PE", value: advancement.distributedPoints.pe || 0, bonus: (advancement.distributedPoints.pe || 0) * 1 },
      { id: "ap", label: "AP", value: advancement.distributedPoints.ap || 0, bonus: (advancement.distributedPoints.ap || 0) * 1 }
    ];

    const oddLevels = [3, 5, 7, 9].filter(l => l <= system.details.level).map(l => ({
      level: l,
      selected: advancement.attributeBonuses[l] || ""
    }));

    const attributes = Object.entries(CONFIG.ANIMUS.attributes).map(([key, val]) => ({
      key,
      label: val.label
    }));

    return {
      actor: this.actor,
      system: system,
      stats: stats,
      pointsRemaining: this.actor.system.pointsRemaining || 0,
      oddLevels: oddLevels,
      attributes: attributes
    };
  }

  /**
   * Handle point distribution adjustment
   */
  async _onAdjust(event, target) {
    const { stat, delta } = target.dataset;
    const d = parseInt(delta);
    const current = this.actor.system.details.advancement.distributedPoints[stat] || 0;
    const available = this.actor.system.pointsRemaining || 0;

    if (d > 0 && available <= 0) return;
    if (d < 0 && current <= 0) return;

    await this.actor.update({
      [`system.details.advancement.distributedPoints.${stat}`]: current + d
    });
    this.render();
  }

  /**
   * Final form submission and closure
   */
  async _onConfirm(event, target) {
    // Pegar o formulário
    const form = this.element.querySelector("form") || this.element;
    const formData = new foundry.applications.ux.FormDataExtended(form);
    const data = formData.object;

    // Safety check for points
    const distributed = foundry.utils.expandObject(data).system?.details?.advancement?.distributedPoints || {};
    const totalSpent = (distributed.hp || 0) + (distributed.pe || 0) + (distributed.ap || 0);
    const totalAllowed = (this.actor.system.details.level - 1) * 3;

    if (totalSpent > totalAllowed) {
        ui.notifications.error("Distribuição de pontos excede o limite permitido!");
        return;
    }

    // Aplicar a atualização
    await this.actor.update(data);
    
    ui.notifications.info("Evolução confirmada com sucesso!");
    await this.close();
  }

  /**
   * Final form submission (from submitOnChange)
   */
  async _onSubmit(event, form, formData) {
    // Apenas atualiza o ator sem fechar
    await this.actor.update(formData.object);
    this.render();
  }
}

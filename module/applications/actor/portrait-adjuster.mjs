const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class AnimusPortraitAdjuster extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this.actor = options.actor;

    this.portraitData = foundry.utils.mergeObject({
      scale: 100,
      x: 50,
      y: 50
    }, this.actor.getFlag("animus", "portrait") || {});
  }

  static DEFAULT_OPTIONS = {
    tag: "div",
    classes: ["animus", "portrait-adjuster"],
    position: { width: 400, height: "auto" },
    window: { title: "AJUSTAR CORTE DO RETRATO", resizable: false },
    actions: {
      reset: AnimusPortraitAdjuster.prototype._onReset,
      submit: AnimusPortraitAdjuster.prototype._onSubmit
    }
  };

  static PARTS = {
    body: { template: "systems/animus/templates/apps/portrait-adjuster.hbs" }
  };

  /** @override */
  async _prepareContext(options) {
    return {
      img: this.actor.img,
      portrait: this.portraitData
    };
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    const html = this.element;
    const canvas = html.querySelector(".portrait-canvas");
    if (!canvas) return;

    // Apply initial visuals
    this._applyToCanvas(canvas);

    // --- Drag to pan ---
    let isDragging = false;
    let startX, startY, startPosX, startPosY;

    const onMouseDown = (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startPosX = this.portraitData.x;
      startPosY = this.portraitData.y;
      canvas.style.cursor = "grabbing";
      e.preventDefault();
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;

      // background-position: moving 1px in the container = (1/W * 100) percentage points
      // But the *moveable* range is scale-dependent: at 200% zoom, the image is 2× bigger,
      // so there's (scale-100)% of overflow in each direction.
      // We map container px → percentage points of that overflow range.
      const overflow = this.portraitData.scale - 100; // at 100% there's 0 overflow
      if (overflow <= 0) return; // can't pan when not zoomed in

      // How many % of overflow does 1px of mouse movement equal?
      const pxToPercent = (100 / canvas.clientWidth) * (100 / overflow);
      const dx = (e.clientX - startX) * pxToPercent;
      const dy = (e.clientY - startY) * pxToPercent;

      // Moving mouse right → pull image left → decrease x% (image shifts left)
      this.portraitData.x = Math.max(0, Math.min(100, startPosX - dx));
      this.portraitData.y = Math.max(0, Math.min(100, startPosY - dy));

      this._applyToCanvas(canvas);
      this._syncControls(html);
    };

    const onMouseUp = () => {
      isDragging = false;
      canvas.style.cursor = "grab";
    };

    this._onMouseMove = onMouseMove;
    this._onMouseUp = onMouseUp;
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", this._onMouseMove);
    window.addEventListener("mouseup", this._onMouseUp);

    // --- Scroll to zoom ---
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -5 : 5; // ±5% per scroll step
      this.portraitData.scale = Math.max(100, Math.min(500, this.portraitData.scale + delta));
      this._applyToCanvas(canvas);
      this._syncControls(html);
    }, { passive: false });

    // --- Slider inputs ---
    html.querySelectorAll("input[data-crop]").forEach(input => {
      input.addEventListener("input", () => {
        const key = input.dataset.crop;
        this.portraitData[key] = parseFloat(input.value);
        this._applyToCanvas(canvas);
        this._syncControls(html);
      });
    });
  }

  /**
   * Apply background-image / size / position to the canvas div.
   */
  _applyToCanvas(canvas) {
    canvas.style.backgroundImage = `url("${this.actor.img}")`;
    canvas.style.backgroundSize = `${this.portraitData.scale}%`;
    canvas.style.backgroundPosition = `${this.portraitData.x}% ${this.portraitData.y}%`;
    canvas.style.backgroundRepeat = "no-repeat";
  }

  /**
   * Sync all UI controls to current portraitData values.
   */
  _syncControls(html) {
    const scaleInput = html.querySelector('[data-crop="scale"]');
    const xInput = html.querySelector('[data-crop="x"]');
    const yInput = html.querySelector('[data-crop="y"]');
    const display = html.querySelector(".value-display");

    if (scaleInput) scaleInput.value = this.portraitData.scale;
    if (xInput) xInput.value = Math.round(this.portraitData.x);
    if (yInput) yInput.value = Math.round(this.portraitData.y);
    if (display) display.innerText = `${this.portraitData.scale}%`;
  }

  /** @override */
  async close(options = {}) {
    window.removeEventListener("mousemove", this._onMouseMove);
    window.removeEventListener("mouseup", this._onMouseUp);
    return super.close(options);
  }

  async _onReset(event, target) {
    this.portraitData = { scale: 100, x: 50, y: 50 };
    this.render();
  }

  async _onSubmit(event, target) {
    await this.actor.setFlag("animus", "portrait", this.portraitData);
    ui.notifications.info("Ajustes de retrato salvos.");
    this.close();
  }
}

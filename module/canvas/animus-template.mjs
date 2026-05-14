export default class AnimusTemplate extends foundry.canvas.placeables.MeasuredTemplate {

  #moveTime = 0;
  #hoveredToken;
  #initialLayer;
  #sheetMinimized = false;
  #events;

  /**
   * Fábrica para criar o template baseado em um ataque elemental
   */
  static fromElemental(actor, elementItem, category, tier) {
    const scene = canvas.scene;
    if (!scene) return null;

    // Mapa de tamanhos (em metros) do Animus
    const sizes = { 
      small: 3, medium: 6, large: 12, 
      curto: 6, medio: 9, longo: 12,
      base: 3, "3m": 1.5, "6m": 3, "9m": 4.5, "12m": 6,
      personal: 0
    };
    const distance = sizes[tier] ?? 3;

    const templateData = {
      user: game.user.id,
      distance: distance,
      direction: 0,
      x: 0,
      y: 0,
      fillColor: game.user.color,
      flags: { animus: { 
        element: elementItem.name,
        dimensions: {
            size: distance,
            adjustedSize: category === "burst" // burst ajusta pelo tamanho do token
        }
      } }
    };

    switch (category) {
      case "burst":
        templateData.t = "circle";
        break;
      case "cone":
        templateData.t = "cone";
        templateData.angle = 60; // Ângulo padrão do Animus
        break;
      case "line":
        templateData.t = "ray";
        templateData.width = canvas.dimensions.distance; // Largura padrão
        break;
      default:
        templateData.t = "circle";
        break;
    }

    const cls = CONFIG.MeasuredTemplate.documentClass;
    const template = new cls(templateData, { parent: scene });
    const object = new this(template);
    
    object.actorSheet = actor?.sheet || null;
    return object;
  }

  /* -------------------------------------------- */

  async drawPreview() {
    const initialLayer = canvas.activeLayer;

    // Desenha o template e muda pra camada de templates
    this.draw();
    this.layer.activate();
    this.layer.preview.addChild(this);

    // Ativa interatividade
    return this.activatePreviewListeners(initialLayer);
  }

  /* -------------------------------------------- */

  activatePreviewListeners(initialLayer) {
    return new Promise((resolve, reject) => {
      this.#initialLayer = initialLayer;
      this.#events = {
        cancel: this._onCancelPlacement.bind(this),
        confirm: this._onConfirmPlacement.bind(this),
        move: this._onMovePlacement.bind(this),
        resolve,
        reject,
        rotate: this._onRotatePlacement.bind(this)
      };

      // Ativa listeners de controle
      canvas.stage.on("mousemove", this.#events.move);
      canvas.stage.on("mouseup", this.#events.confirm);
      canvas.app.view.oncontextmenu = this.#events.cancel;
      canvas.app.view.onwheel = this.#events.rotate;
    });
  }

  /* -------------------------------------------- */

  async _finishPlacement(event) {
    if ( game.release.generation < 14 ) this.layer._onDragLeftCancel(event);
    else this.layer.clearPreviewContainer();
    
    canvas.stage.off("mousemove", this.#events.move);
    canvas.stage.off("mouseup", this.#events.confirm);
    canvas.app.view.oncontextmenu = null;
    canvas.app.view.onwheel = null;
    
    if ( this.#hoveredToken ) {
      this.#hoveredToken._onHoverOut(event);
      this.#hoveredToken = null;
    }
    
    this.#initialLayer.activate();
  }

  /* -------------------------------------------- */

  _onMovePlacement(event) {
    event.stopPropagation();
    const now = Date.now(); 
    if ( now - this.#moveTime <= 20 ) return; // Throttle de 20ms
    
    const center = event.data.getLocalPosition(this.layer);
    const updates = this.getSnappedPosition(center);

    // Ajusta o tamanho se for aura (burst) e estiver sobre um token
    const baseDistance = this.document.flags.animus?.dimensions?.size;
    if ( this.document.flags.animus?.dimensions?.adjustedSize && baseDistance ) {
      const rectangle = new PIXI.Rectangle(center.x, center.y, 1, 1);
      const hoveredToken = canvas.tokens.quadtree.getObjects(rectangle, {
        collisionTest: ({ t }) => t.visible && !t.document.isSecret }).first();
        
      if ( hoveredToken && (hoveredToken !== this.#hoveredToken) ) {
        this.#hoveredToken = hoveredToken;
        this.#hoveredToken._onHoverIn(event);
        const size = Math.max(hoveredToken.document.width, hoveredToken.document.height);
        updates.distance = baseDistance + (size * canvas.grid.distance / 2);
      } else if ( !hoveredToken && this.#hoveredToken ) {
        this.#hoveredToken._onHoverOut(event);
        this.#hoveredToken = null;
        updates.distance = baseDistance;
      }
    }

    this.document.updateSource(updates);
    this.refresh();
    this.#moveTime = now;
  }

  /* -------------------------------------------- */

  _onRotatePlacement(event) {
    if ( this.document.t === "rect" || this.document.t === "circle" ) return;
    if ( event.ctrlKey ) event.preventDefault(); // Evita dar zoom na página
    event.stopPropagation();
    
    const delta = canvas.grid.type > CONST.GRID_TYPES.SQUARE ? 30 : 15;
    const snap = event.shiftKey ? delta : 5;
    const update = {direction: this.document.direction + (snap * Math.sign(event.deltaY))};
    
    this.document.updateSource(update);
    this.refresh();
  }

  /* -------------------------------------------- */

  async _onConfirmPlacement(event) {
    await this._finishPlacement(event);
    const destination = canvas.templates.getSnappedPoint({ x: this.document.x, y: this.document.y });
    this.document.updateSource(destination);
    
    const createdDocs = await canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [this.document.toObject()]);
    
    // Auto-marcar (target) os tokens que estão dentro do template
    if (createdDocs.length > 0) {
      const templateDoc = createdDocs[0];
      setTimeout(() => {
        const templateObj = canvas.templates.get(templateDoc.id);
        if (!templateObj || !templateObj.shape) return;
        
        const targets = [];
        for (const token of canvas.tokens.placeables) {
          if (!token.visible) continue;
          
          // Verifica se o centro do token está dentro do shape do template
          const center = token.center;
          const isInside = templateObj.shape.contains(center.x - templateObj.x, center.y - templateObj.y);
          
          if (isInside) {
            targets.push(token.id);
          }
        }
        
        // Atualiza os alvos do jogador (Compatível com V13+)
        if (targets.length > 0) {
          game.user.targets.clear();
          for ( let id of targets ) {
            const token = canvas.tokens.get(id);
            if ( token ) token.setTarget(true, { releaseOthers: false, groupSelection: true });
          }
        }
      }, 100); // pequeno delay para garantir que o Foundry terminou de desenhar o template no mapa
    }

    this.#events.resolve(createdDocs);
  }

  /* -------------------------------------------- */

  async _onCancelPlacement(event) {
    await this._finishPlacement(event);
    this.#events.reject();
  }
}

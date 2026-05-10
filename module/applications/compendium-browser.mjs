const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class AnimusCompendiumBrowser extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this.type = options.type || "talent";
    this.callback = options.callback || null;
  }

  static DEFAULT_OPTIONS = {
    classes: ["animus", "compendium-browser"],
    tag: "div",
    position: {
      width: 600,
      height: 600
    },
    actions: {
      selectItem: AnimusCompendiumBrowser.#onSelectItem
    }
  };

  /** @override */
  static PARTS = {
    body: { template: "systems/animus/templates/apps/compendium-browser.hbs" }
  };

  /** @override */
  async _prepareContext(options) {
    const items = [];

    // Buscar em todos os compêndios do sistema
    for (const pack of game.packs) {
      if (pack.metadata.type !== "Item") continue;

      const index = await pack.getIndex({ fields: ["type", "img", "system"] });
      const filtered = index.filter(i => i.type === this.type);

      for (let i of filtered) {
        items.push({
          id: i._id,
          name: i.name,
          img: i.img,
          uuid: i.uuid,
          pack: pack.collection
        });
      }
    }

    return {
      items: items.sort((a, b) => a.name.localeCompare(b.name)),
      type: this.type,
      title: `Selecionar ${this.type.charAt(0).toUpperCase() + this.type.slice(1)}`
    };
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    const html = this.element;

    const searchInput = html.querySelector('.search-bar input');
    if (searchInput) {
      searchInput.addEventListener('input', (ev) => {
        const query = ev.target.value.toLowerCase();
        html.querySelectorAll('.browser-item').forEach(item => {
          const name = item.querySelector('.item-name').textContent.toLowerCase();
          item.style.display = name.includes(query) ? 'flex' : 'none';
        });
      });
    }
  }

  static async #onSelectItem(event, target) {
    const uuid = target.dataset.uuid;
    const item = await fromUuid(uuid);
    if (this.callback) this.callback(item);
    this.close();
  }
}

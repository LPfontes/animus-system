const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class AnimusCompendiumBrowser extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this.actor = options.actor;
    this.packId = options.packId || "animus.itens";
    this.searchQuery = "";
    this.activeTab = "weapon"; // "weapon" ou "secondary"
    this.categoryFilter = "all";
    this.damageTypeFilter = "all";
    this.expandedItems = new Set();
  }

  static DEFAULT_OPTIONS = {
    id: "animus-compendium-browser",
    classes: ["animus", "application", "compendium-browser", "v2"],
    title: "Arsenal Animus",
    tag: "div",
    window: {
      contentTag: "section",
      resizable: true,
      minimizable: true
    },
    actions: {
      addItem: AnimusCompendiumBrowser._onAddItem,
      toggleExpand: AnimusCompendiumBrowser._onToggleExpand,
      setTab: AnimusCompendiumBrowser._onSetTab,
      setFilter: AnimusCompendiumBrowser._onSetFilter,
      setDamageFilter: AnimusCompendiumBrowser._onSetDamageFilter
    }
  };

  static PARTS = {
    body: {
      template: "systems/animus/templates/apps/compendium-browser.hbs"
    }
  };

  /** @override */
  async _prepareContext(options) {
    const pack = game.packs.get(this.packId);
    if (!pack) return { items: [], activeTab: this.activeTab, searchQuery: this.searchQuery };

    let items = await pack.getDocuments();
    
    // 1. Filtrar por Tipo (Aba)
    if (this.activeTab === "weapon") {
      items = items.filter(i => i.type === "weapon");
    } else if (this.activeTab === "equipment") {
      items = items.filter(i => ["armor", "shield"].includes(i.type));
    } else if (this.activeTab === "secondary") {
      items = items.filter(i => i.type === "secondary");
    }

    // 2. Filtro de busca
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q));
    }

    // 3. Mapear dados e estado de expansão
    const finalItems = items.sort((a, b) => a.name.localeCompare(b.name)).map(i => {
      const itemData = i.toObject();
      itemData.id = i.id;
      itemData.expanded = this.expandedItems.has(i.id);
      
      // Sanitização de Dano para o Browser
      if (i.type === "weapon") {
        const sys = i.system;
        
        // Preparar tabela completa para expansão (usando dados derivados se existirem, ou calculando)
        itemData.damageTable = i.system.damageTable || {
            ac1: typeof sys.damage?.ac1 === 'object' ? `${sys.damage.ac1.base} + ${sys.damage.ac1.mult}x` : sys.damage?.ac1,
            ac2: typeof sys.damage?.ac2 === 'object' ? `${sys.damage.ac2.base} + ${sys.damage.ac2.mult}x` : sys.damage?.ac2,
            ac3: typeof sys.damage?.ac3 === 'object' ? `${sys.damage.ac3.base} + ${sys.damage.ac3.mult}x` : sys.damage?.ac3,
            ac4: typeof sys.damage?.ac4 === 'object' ? `${sys.damage.ac4.base} + ${sys.damage.ac4.mult}x` : sys.damage?.ac4
        };

        itemData.displayDamage = `${itemData.damageTable.ac1} / ${itemData.damageTable.ac4}`;
        
        const weaponTypes = CONFIG.ANIMUS?.weaponTypes || {};
        itemData.displayCategory = weaponTypes[sys.type] ? game.i18n.localize(weaponTypes[sys.type]) : "Arma";
      } else {
        const armorTypes = CONFIG.ANIMUS?.armorTypes || {};
        const sys = i.system;
        if (i.type === "armor" && armorTypes[sys.type]) {
          itemData.displayCategory = game.i18n.localize(armorTypes[sys.type]);
        } else {
          itemData.displayCategory = game.i18n.localize(`ITEM.Type${i.type.capitalize()}`);
        }
      }

      return itemData;
    });

    // 4. Filtrar por Categoria e Tipo de Dano / Tipo de Armadura
    let filteredItems = finalItems;
    if (this.activeTab === "weapon") {
      if (this.categoryFilter !== "all") {
        filteredItems = filteredItems.filter(i => i.system.category === this.categoryFilter);
      }
      if (this.damageTypeFilter !== "all") {
        filteredItems = filteredItems.filter(i => i.system.damageType === this.damageTypeFilter);
      }
    } else if (this.activeTab === "equipment") {
      // Aba de Equipamento (Armaduras)
      if (this.damageTypeFilter !== "all") {
        filteredItems = filteredItems.filter(i => i.system.type === this.damageTypeFilter);
      }
    } else if (this.activeTab === "secondary") {
      // Aba de Secundários (Filtro por Categoria)
      if (this.damageTypeFilter !== "all") {
        filteredItems = filteredItems.filter(i => (i.system.subCategory || i.system.category) === this.damageTypeFilter);
      }
    }

    return {
      items: filteredItems,
      activeTab: this.activeTab,
      searchQuery: this.searchQuery,
      categoryFilter: this.categoryFilter,
      damageTypeFilter: this.damageTypeFilter,
      config: CONFIG.ANIMUS
    };
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    const html = this.element;

    const search = html.querySelector('.search-input');
    if (search) {
      search.focus();
      search.setSelectionRange(search.value.length, search.value.length);
      
      search.addEventListener('input', (ev) => {
        this.searchQuery = ev.target.value;
        this.render({ parts: ['body'] });
      });
    }
  }

  // --- Ações ---

  static _onToggleExpand(event, target) {
    const id = target.dataset.id;
    if (this.expandedItems.has(id)) this.expandedItems.delete(id);
    else this.expandedItems.add(id);
    this.render({ parts: ['body'] });
  }

  static _onSetTab(event, target) {
    this.activeTab = target.dataset.tab;
    this.expandedItems.clear();
    this.categoryFilter = "all";
    this.damageTypeFilter = "all";
    this.render({ parts: ['body'] });
  }

  static _onSetFilter(event, target) {
    this.categoryFilter = target.value;
    this.render({ parts: ['body'] });
  }

  static _onSetDamageFilter(event, target) {
    this.damageTypeFilter = target.dataset.type;
    this.render({ parts: ['body'] });
  }

  /**
   * Action: Adicionar item à ficha
   */
  static async _onAddItem(event, target) {
    event.stopPropagation(); // Não expandir ao clicar no botão de adicionar
    const itemId = target.dataset.id;
    const pack = game.packs.get(this.packId);
    if (!pack) return;

    const item = await pack.getDocument(itemId);
    if (!item) return;

    const itemData = item.toObject();
    
    if (this.actor) {
      await this.actor.createEmbeddedDocuments("Item", [itemData]);
      ui.notifications.info(`${item.name} adicionado à ficha.`);
    }
  }
}

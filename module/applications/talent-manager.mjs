const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class AnimusTalentManager extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this.actor = options.actor;
    this.filters = {
      search: "",
      category: "all",
      availableOnly: false
    };
  }

  static get DEFAULT_OPTIONS() {
    return foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
      tag: "div",
      classes: ["animus", "talent-manager"],
      position: {
        width: 800,
        height: 800
      },
      window: {
        title: "GESTÃO DE TALENTOS",
        resizable: true
      },
      actions: {
        addTalent: AnimusTalentManager.prototype._onAddTalent,
        filterCategory: AnimusTalentManager.prototype._onFilterCategory,
        toggleAvailable: AnimusTalentManager.prototype._onToggleAvailable
      }
    });
  }

  static PARTS = {
    body: { template: "systems/animus/templates/apps/talent-manager.hbs" }
  };

  /** @override */
  async _prepareContext(options) {
    const talents = [];
    const categories = new Set();
    const talentMap = new Map();

    // 1. Fetch all talent items and build a lookup map
    const packs = game.packs.filter(p => p.metadata.type === "Item");
    for (const pack of packs) {
      const index = await pack.getIndex({ fields: ["type", "img", "system.subCategory", "system.description", "system.requirements"] });
      for (const entry of index) {
        if (entry.type === "talent") {
          talentMap.set(entry._id, entry);
        }
      }
    }
    this.talentMap = talentMap;

    // 2. Prepare the display list
    for (const [id, i] of talentMap) {
      const category = foundry.utils.getProperty(i, "system.subCategory") || "Geral";
      categories.add(category);

      const owned = this.actor.items.some(it => {
        const sourceId = it._stats?.compendiumSource || it.flags?.core?.sourceId || it.getFlag("animus", "sourceId") || "";
        return sourceId.includes(id) || it.name === i.name;
      });
      const check = await this.checkRequirements(i);

      talents.push({
        name: i.name,
        img: i.img,
        uuid: i.uuid,
        category: category,
        description: foundry.utils.getProperty(i, "system.description") || "",
        owned: owned,
        metRequirements: check.met,
        requirementErrors: check.errors
      });
    }

    const finalTalents = talents.sort((a, b) => a.name.localeCompare(b.name));

    // Preparar dados das categorias para os filtros (Config + Dinâmicas)
    const categoriesData = Object.entries(CONFIG.ANIMUS.talentCategories).map(([id, data]) => ({
      id,
      label: data.label,
      icon: data.icon
    }));

    // Adicionar categorias que existem nos itens mas não no config (como 'Geral' se não estiver lá)
    for (const cat of categories) {
      if (!CONFIG.ANIMUS.talentCategories[cat]) {
        categoriesData.push({
          id: cat,
          label: cat,
          icon: "fas fa-tag"
        });
      }
    }

    return {
      actor: this.actor,
      talents: finalTalents,
      categories: categoriesData,
      filters: this.filters
    };
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    const html = this.element;
    const searchInput = html.querySelector('.search-bar input');
    if (searchInput) {
      searchInput.addEventListener('input', (ev) => {
        this.filters.search = ev.target.value.toLowerCase();
        this.applyFilters();
      });
    }

    this.applyFilters();
  }
  _onFilterCategory(event, target) {
    const btn = target.closest("[data-category]");
    if (!btn) return;
    this.filters.category = btn.dataset.category;

    const buttons = this.element.querySelectorAll('.category-btn');
    buttons.forEach(b => b.classList.toggle('active', b.dataset.category === this.filters.category));

    this.applyFilters();
  }

  _onToggleAvailable(event, target) {
    this.filters.availableOnly = target.checked;
    this.applyFilters();
  }

  applyFilters() {
    if (!this.element) return;
    const items = this.element.querySelectorAll('.talent-entry');

    items.forEach(item => {
      const name = (item.dataset.name || "").toLowerCase();
      const category = item.dataset.category;
      const isAvailable = item.dataset.metReqs === "true";
      const isOwned = item.dataset.owned === "true";

      const matchesSearch = name.includes(this.filters.search);
      const matchesCategory = this.filters.category === "all" || category === this.filters.category;
      const matchesAvailable = !this.filters.availableOnly || (isAvailable && !isOwned);

      item.style.display = (matchesSearch && matchesCategory && matchesAvailable) ? "flex" : "none";
    });
  }

  async checkRequirements(item) {
    const system = item.system;
    const reqs = system.requirements;
    if (!reqs) return { met: true };

    const errors = [];

    // 1. Check Talents (by ID)
    const talentReqs = reqs.talents || {};
    for (const [talentName, talentId] of Object.entries(talentReqs)) {
      // Check if actor has a talent with this ID or this name (fallback)
      const hasTalent = this.actor.items.some(i => {
        if (i.type !== "talent" && i.type !== "npcTalent") return false;
        const sourceId = i._stats?.compendiumSource || i.flags?.core?.sourceId || i.getFlag("animus", "sourceId") || "";
        return sourceId.includes(talentId) || i.id === talentId || i.name === talentName;
      });

      if (!hasTalent) {
        errors.push(`Requer talento: ${talentName}`);
      }
    }

    // 2. Check Attributes
    for (const attr of (reqs.attributes || [])) {
      const actorValue = this.actor.system.attributes[attr.key]?.value || 0;
      if (actorValue < attr.value) {
        const label = attr.key.toUpperCase();
        errors.push(`Requer ${label} ${attr.value}`);
      }
    }

    // 3. Check Skills
    for (const skill of (reqs.skills || [])) {
      const actorSkill = this.actor.system.skills[skill.key];
      if (!actorSkill || actorSkill.value < skill.rank) {
        // Human readable skill name from localization
        const skillConfig = CONFIG.ANIMUS.skills[skill.key];
        const label = skillConfig ? game.i18n.localize(skillConfig.label) : skill.key;
        errors.push(`Requer perícia ${label} Nível ${skill.rank}`);
      }
    }

    return {
      met: errors.length === 0,
      errors: errors
    };
  }

  async _onAddTalent(event, target) {
    const btn = target.closest("[data-uuid]");
    if (!btn) return;
    const uuid = btn.dataset.uuid;
    const item = await fromUuid(uuid);

    if (this.actor.items.some(i => {
      const sourceId = i._stats?.compendiumSource || i.flags?.core?.sourceId || i.getFlag("animus", "sourceId") || "";
      return sourceId.includes(item._id) || i.name === item.name;
    })) {
      ui.notifications.warn(`O personagem já possui o talento ${item.name}`);
      return;
    }

    // Verificar Limite de Talentos
    const talentPoints = this.actor.system.talentPoints;
    if (talentPoints.available <= 0) {
      ui.notifications.warn(`Limite de talentos atingido (${talentPoints.total}). Evolua de nível para desbloquear mais.`);
      return;
    }

    // Verificar Requisitos
    const check = await this.checkRequirements(item);
    if (!check.met) {
      check.errors.forEach(err => ui.notifications.warn(err));
      return;
    }

    const itemData = item.toObject();
    foundry.utils.setProperty(itemData, "flags.animus.sourceId", item._id);

    await this.actor.createEmbeddedDocuments("Item", [itemData]);
    ui.notifications.info(`Talento ${item.name} adicionado.`);

    btn.classList.add('owned');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-check"></i> Adquirido';
  }
}

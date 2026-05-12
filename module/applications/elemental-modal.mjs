const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const TALENT_IDS = {
  PROJECTILE: "60c29caa68d06941",
  AREA: "47d77d74010facef",
  RANGE: "92dcf6f9e94eaf6c",
  POTENCY: "7017cc3eb33702c5"
};

const ELEMENTAL_DATA = {
  single: {
    label: "Alvo Único",
    tiers: {
      personal: { label: "Pessoal (0m)", pe: 3, pa: 1 },
      curto: { label: "Curto (9m)", pe: 3, pa: 1, req: TALENT_IDS.PROJECTILE },
      medio: { label: "Médio (18m)", pe: 5, pa: 1, req: TALENT_IDS.RANGE },
      longo: { label: "Longo (36m)", pe: 8, pa: 1, req: TALENT_IDS.RANGE, obs: "Metal: +1 PE" }
    }
  },
  line: {
    label: "Linha",
    req: TALENT_IDS.AREA,
    tiers: {
      curto: { label: "Curto (3m)", pe: 1, pa: 3 },
      medio: { label: "Médio (6m)", pe: 3, pa: 3 },
      longo: { label: "Longo (12m)", pe: 6, pa: 3 }
    }
  },
  cone: {
    label: "Cone",
    req: TALENT_IDS.AREA,
    tiers: {
      curto: { label: "Curto (3m)", pe: 1, pa: 3 },
      medio: { label: "Médio (6m)", pe: 3, pa: 3 },
      longo: { label: "Longo (12m)", pe: 6, pa: 3 }
    }
  },
  burst: {
    label: "Explosão",
    req: TALENT_IDS.AREA,
    tiers: {
      small: { label: "Pequena (3m)", pe: 1, pa: 1 },
      medium: { label: "Média (6m)", pe: 3, pa: 1, obs: "Terra/Metal: +1 PE" },
      large: { label: "Grande (12m)", pe: 6, pa: 1, obs: "Terra/Metal: +2 PE" }
    }
  }
};

/**
 * Modal para configurar as variáveis de um Uso Elemental (Distância, Área, Tipo).
 */
export class AnimusElementalModal extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this.actor = options.actor;
    this.elementItem = options.element;
    this.resolve = null;

    // Cache de IDs e Nomes de talentos para busca resiliente
    this.talents = new Set();
    this.talentNames = new Set();

    for (const item of this.actor.items) {
      if (item.type !== "talent" && item.type !== "npcTalent") continue;
      
      // 1. Tenta pegar por UUID de origem (padrão Foundry V12+)
      const sourceId = item._stats?.compendiumSource || item.flags?.core?.sourceId || "";
      const animusSourceId = item.getFlag("animus", "sourceId") || "";
      
      if (sourceId) this.talents.add(sourceId.split(".").pop());
      if (animusSourceId) this.talents.add(animusSourceId);

      // 2. Fallback por nome (normalizado)
      this.talentNames.add(this._normalize(item.name));
    }
  }

  /**
   * Normaliza uma string removendo acentos e convertendo para minúsculo.
   */
  _normalize(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  static DEFAULT_OPTIONS = {
    tag: "div",
    classes: ["animus", "elemental-modal"],
    position: { width: 450, height: "auto" },
    window: {
      title: "Configurar Uso Elemental",
      resizable: false,
      minimizable: false
    },
    actions: {
      close: function () { this.close(); },
      confirm: AnimusElementalModal.prototype._onConfirm
    }
  };

  static PARTS = {
    body: { template: "systems/animus/templates/apps/elemental-modal.hbs" }
  };

  /**
   * Abre o modal e aguarda a configuração do usuário.
   */
  static async awaitConfig(actor, element) {
    return new Promise(resolve => {
      const modal = new AnimusElementalModal({ actor, element });
      modal.resolve = resolve;
      modal.render(true);
    });
  }

  /**
   * Verifica se o ator possui o talento por ID ou Nome.
   */
  _hasTalent(id) {
    if (this.talents.has(id)) return true;
    
    // Fallback por nomes conhecidos se o ID falhar
    const nameMap = {
      "60c29caa68d06941": "projetil elemental",
      "92dcf6f9e94eaf6c": "alcance elemental",
      "47d77d74010facef": "area elemental",
      "7017cc3eb33702c5": "potencia elemental"
    };
    
    const normalizedName = nameMap[id];
    return normalizedName ? this.talentNames.has(normalizedName) : false;
  }

  async _prepareContext(options) {
    const categories = {};
    for (const [key, data] of Object.entries(ELEMENTAL_DATA)) {
      const disabled = data.req && !this._hasTalent(data.req);
      categories[key] = {
        label: data.label,
        disabled: disabled
      };
    }

    return {
      actor: this.actor,
      element: this.elementItem,
      config: CONFIG.ANIMUS,
      categories: categories,
      hasPotencia: this._hasTalent(TALENT_IDS.POTENCY)
    };
  }

  _onRender(context, options) {
    const form = this.element.querySelector("form");
    const categorySelect = form.querySelector('select[name="category"]');

    // Listener para mudar os tiers disponíveis
    categorySelect.addEventListener("change", () => this._updateTiers());

    // Listeners para atualização de custo em tempo real
    form.querySelectorAll("select, input").forEach(el => {
      el.addEventListener("change", () => this._updateCosts());
    });

    this._updateTiers();
  }

  _updateTiers() {
    const category = this.element.querySelector('select[name="category"]').value;
    const tierSelect = this.element.querySelector('select[name="tier"]');
    const tiers = ELEMENTAL_DATA[category].tiers;

    let html = "";
    for (const [key, data] of Object.entries(tiers)) {
      const disabled = data.req && !this._hasTalent(data.req);
      html += `<option value="${key}" ${disabled ? 'disabled' : ''}>${data.label} ${disabled ? '🔒' : ''}</option>`;
    }
    tierSelect.innerHTML = html;

    this._updateCosts();
  }

  _updateCosts() {
    const formData = new foundry.applications.ux.FormDataExtended(this.element.querySelector("form")).object;
    const category = formData.category;
    const tierKey = formData.tier;
    const level = parseInt(formData.level);
    const tierData = ELEMENTAL_DATA[category].tiers[tierKey];

    if (!tierData) return;

    // Cálculo: Base do Nível + Adicional do Tier
    const levelBase = level * 3; // Nív 1 = 3, Nív 2 = 6, Nív 3 = 9
    let peCost = levelBase + tierData.pe;
    const paCost = tierData.pa;

    // Aplicar observações de elemento
    const elementName = this.elementItem.name.toLowerCase();
    if (elementName === "metal" && category === "single" && tierKey === "longo") peCost += 1;
    if ((elementName === "terra" || elementName === "metal") && category === "burst") {
      if (tierKey === "medium") peCost += 1;
      if (tierKey === "large") peCost += 2;
    }

    // Regra: Nível 3+ ganha -1 PE (mínimo 2 PE, a menos que já fosse menor)
    const actorLevel = this.actor.system.level || 1;
    let discountApplied = false;
    if (actorLevel >= 3 && peCost > 0) {
      const discounted = Math.max(2, peCost - 1);
      if (discounted < peCost) {
        peCost = discounted;
        discountApplied = true;
      }
    }

    // Atualizar UI
    const container = this.element;
    container.querySelector('.total-pe').textContent = `${peCost} PE`;
    container.querySelector('.total-pa').textContent = `${paCost} PA`;

    const obsEl = container.querySelector('.observation-line');
    let obsText = tierData.obs ? `* ${tierData.obs}` : "";
    if (discountApplied) obsText += (obsText ? " | " : "") + "Desconto de Nível 3+ aplicado (-1 PE)";
    obsEl.textContent = obsText;
  }

  async _onConfirm(event, target) {
    const form = this.element.querySelector("form");
    const data = new foundry.applications.ux.FormDataExtended(form).object;
    const tierData = ELEMENTAL_DATA[data.category].tiers[data.tier];
    const level = parseInt(data.level);

    // Re-calcular custo para o retorno
    const levelBase = level * 3;
    let peCost = levelBase + tierData.pe;
    const paCost = tierData.pa;
    const elementName = this.elementItem.name.toLowerCase();
    const actorLevel = this.actor.system.level || 1;

    if (elementName === "metal" && data.category === "single" && data.tier === "longo") peCost += 1;
    if ((elementName === "terra" || elementName === "metal") && data.category === "burst") {
      if (data.tier === "medium") peCost += 1;
      if (data.tier === "large") peCost += 2;
    }

    // Desconto de Nível 3+
    if (actorLevel >= 3 && peCost > 0) {
      peCost = Math.max(2, peCost - 1);
    }

    if (this.resolve) {
      this.resolve({
        usageType: data.usageType,
        category: data.category,
        tier: data.tier,
        level: level,
        peCost: peCost,
        paCost: paCost,
        label: `Nível ${level} - ${ELEMENTAL_DATA[data.category].label} (${tierData.label})`
      });
    }
    this.close();
  }

  /** @override */
  _onClose() {
    if (this.resolve) this.resolve(null);
    super._onClose();
  }
}

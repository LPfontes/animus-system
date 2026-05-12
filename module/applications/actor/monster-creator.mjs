const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ApplicationV2 } = foundry.applications.api;

/**
 * Regras de Identidade Inata por Tipo de Monstro
 */
const INNATE_IDENTITIES = {
  animal: {
    name: "Predador",
    description: "Iniciativa +2 em todos os combates. Ao atacar um alvo com condição Derrubado, causa +2 de dano fixo por acerto além do normal."
  },
  "morto-vivo": {
    name: "Impassível",
    description: "Imune a medo, charme, exaustão e condições mentais. Não precisa respirar, dormir ou se alimentar. Magia de cura causa metade do efeito; descanso não restaura PV. PV 20% maior que outros tipos."
  },
  "espírito": {
    name: "Etéreo",
    description: "Pode atravessar superfícies sólidas como ação de movimento (1 PA). Ataques físicos sem magia ou anima causam metade do dano. Não pode ser agarrado por meios físicos. PV 20% menor, compensado pela resistência física."
  },
  elemental: {
    name: "Corpo Elemental",
    description: "Imune ao próprio elemento (definido ao criar). Quem o ataca corpo a corpo sofre dano fixo = ANI em dano elemental automaticamente. Não pode ser envenenado ou sangrar. Maestrias de Tipo de Arma disponíveis."
  },
  "aberração": {
    name: "Lógica Alienígena",
    description: "Imune a Domínio Mental e leitura de pensamentos. Personagens que olharem diretamente fazem PER CD(6+nível) no início do turno ou ficam abalados por 1 rodada. Críticos contra Aberrações exigem CD extra de Compreensão."
  },
  humanoide: {
    name: "Adaptável",
    description: "Pode usar equipamentos, armaduras e armas como personagens jogadores. O dano e a defesa do equipamento somam normalmente ao perfil do monstro. Ganha 1 perícia Amador gratuita em qualquer área."
  }
};

/**
 * Limites de Perícia por Classificação e ND
 */
const SKILL_LIMITS = {
  comum: { 1: 1, 2: 5, 3: 99 }, // Rank: Min ND (99 = nunca)
  raro: { 1: 1, 2: 3, 3: 8 },
  místico: { 1: 1, 2: 1, 3: 5 }
};

/**
 * Perícias Recomendadas por Tipo
 */
const RECOMMENDED_SKILLS = {
  animal: ["atletismo", "luta", "percepcao", "sobrevivencia", "resistencia", "proeza"],
  "morto-vivo": ["luta", "resistencia", "proeza", "intimidacao", "atletismo", "aura"],
  "espírito": ["intuicao", "aura", "controle", "percepcao", "enganacao", "intimidacao"],
  elemental: ["controle", "elemento", "aura", "resistencia", "intimidacao", "atletismo"],
  "aberração": ["percepcao", "intuicao", "con_arcano", "aura", "compreensao", "enganacao"],
  humanoide: ["luta", "pontaria", "furtividade", "percepcao", "intimidacao", "persuasao", "resistencia", "acrobacia"]
};

const WEAPON_PRESETS = {
  cortante_leve: { label: "Cortante Leve", ac1: [2, 0], ac2: [3, 1], ac3: [4, 2], ac4: [5, 3] },
  cortante_medio: { label: "Cortante Médio", ac1: [3, 0], ac2: [4, 2], ac3: [6, 3], ac4: [8, 3] },
  contusa_leve: { label: "Contusa Leve", ac1: [1, 1], ac2: [2, 2], ac3: [3, 3], ac4: [4, 4] },
  contusa_medio: { label: "Contusa Médio", ac1: [2, 1], ac2: [3, 2], ac3: [5, 3], ac4: [6, 5] },
  perfurante_leve: { label: "Perfurante Leve", ac1: [1, 0], ac2: [2, 1], ac3: [3, 2], ac4: [5, 5] },
  perfurante_medio: { label: "Perfurante Médio", ac1: [2, 0], ac2: [3, 1], ac3: [4, 3], ac4: [7, 6] }
};

/**
 * Aplicativo para criação assistida de NPCs/Monstros seguindo as regras do sistema Animus.
 */
export class AnimusMonsterCreator extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this.step = 1;
    this.monsterData = {
      name: "Novo Monstro",
      nd: 1,
      classification: "comum",
      type: "humanoide",
      attributes: { pot: 0, hab: 0, cog: 0, per: 0, per: 0, pre: 0, ani: 0 },
      damage: {
        type: "Mordida",
        preset: "cortante_leve",
        attribute: "pot"
      },
      selectedSkills: {}, // { atletismo: 1, luta: 2 }
      selectedTalents: [],
      pe: 10
    };
  }

  static DEFAULT_OPTIONS = {
    id: "monster-creator",
    classes: ["animus", "monster-creator"],
    tag: "form",
    window: {
      title: "Criador de Monstros - Protocolo Animus",
      icon: "fas fa-dna",
      resizable: true
    },
    position: { width: 800, height: "auto" },
    actions: {
      nextStep: AnimusMonsterCreator.prototype._onNextStep,
      prevStep: AnimusMonsterCreator.prototype._onPrevStep,
      createMonster: AnimusMonsterCreator.prototype._onCreateMonster,
      updateBase: AnimusMonsterCreator.prototype._onUpdateBase,
      toggleTalent: AnimusMonsterCreator.prototype._onToggleTalent,
      toggleSkill: AnimusMonsterCreator.prototype._onToggleSkill
    },
    form: {
      handler: AnimusMonsterCreator.#onSubmit,
      submitOnChange: false,
      closeOnSubmit: false
    }
  };

  static PARTS = {
    body: { template: "systems/animus/templates/apps/monster-creator.hbs" }
  };

  async _prepareContext(options) {
    const suggestions = this._calculateSuggestions();

    // Buscar talentos disponíveis se estivermos no passo 5
    let availableTalents = [];
    if (this.step === 5) {
      availableTalents = await this._getAvailableTalents();
    }

    const context = {
      step: this.step,
      data: this.monsterData,
      config: CONFIG.ANIMUS,
      suggestions: suggestions,
      innate: INNATE_IDENTITIES[this.monsterData.type] || null,
      availableTalents: availableTalents,
      spentPoints: this._calculateSpentPoints(),
      skills: this._prepareSkillsContext(),
      damageTable: this._getDamageTablePreview(),
      weaponPresets: WEAPON_PRESETS
    };
    return context;
  }

  _prepareSkillsContext() {
    const recommended = RECOMMENDED_SKILLS[this.monsterData.type] || [];
    const skills = [];

    for (const [key, skill] of Object.entries(CONFIG.ANIMUS.skills)) {
      const currentRank = this.monsterData.selectedSkills[key] || 0;
      skills.push({
        key: key,
        label: game.i18n.localize(skill.label),
        rank: currentRank,
        isRecommended: recommended.includes(key)
      });
    }

    return skills.sort((a, b) => a.label.localeCompare(b.label));
  }

  _getDamageTablePreview() {
    const presetKey = this.monsterData.damage.preset;
    const attrKey = this.monsterData.damage.attribute;
    const attrVal = this.monsterData.attributes[attrKey] || 0;
    
    const preset = WEAPON_PRESETS[presetKey] || WEAPON_PRESETS.cortante_leve;
    
    const results = {};
    for (let i = 1; i <= 4; i++) {
      const [base, mult] = preset[`ac${i}`];
      results[`ac${i}`] = base + (mult * attrVal);
    }
    
    // ND 5+ usa tabela de 6 ACs
    if (nd >= 5) {
      results.ac5 = results.ac4 + (results.ac4 - results.ac3);
      results.ac6 = results.ac5 + (results.ac5 - results.ac4) + 2;
    } else {
      results.ac5 = 0;
      results.ac6 = 0;
    }
    
    return results;
  }

  /**
   * Busca todos os talentos disponíveis nos compêndios
   */
  async _getAvailableTalents() {
    const talents = [];
    const packs = game.packs.filter(p => p.metadata.type === "Item");
    const classification = this.monsterData.classification;

    for (const pack of packs) {
      const index = await pack.getIndex({ fields: ["type", "system.cost", "system.description", "system.subCategory", "folder"] });
      const packTalents = index.filter(i => i.type === "npcTalent");

      for (const t of packTalents) {
        // Místicos são exclusivos para criaturas de classificação Místico
        const isMysticTalent = t.folder === "fldbestmistic000";
        if (isMysticTalent && classification !== "místico") continue;

        const isSelected = this.monsterData.selectedTalents.some(s => s.uuid === t.uuid);
        talents.push({
          uuid: t.uuid,
          name: t.name,
          cost: t.system.cost || 0,
          category: t.system.subCategory || (isMysticTalent ? "Místico" : "Geral"),
          description: t.system.description,
          isSelected: isSelected
        });
      }
    }
    // Agrupar por custo
    const groups = talents.reduce((acc, t) => {
      const cost = t.cost || 0;
      if (!acc[cost]) acc[cost] = { cost, talents: [] };
      acc[cost].talents.push(t);
      return acc;
    }, {});

    const sortedGroups = Object.values(groups).sort((a, b) => a.cost - b.cost);
    for (const group of sortedGroups) {
      group.talents.sort((a, b) => a.name.localeCompare(b.name));
    }

    return sortedGroups;
  }

  _calculateSpentPoints() {
    return this.monsterData.selectedTalents.reduce((acc, t) => acc + (t.cost || 0), 0);
  }

  /**
   * Calcula estatísticas sugeridas baseadas em ND e Classificação
   */
  _calculateSuggestions() {
    const { nd, classification, type } = this.monsterData;

    // PV Base
    let hp = 10;
    if (classification === "comum") hp = (nd * 20) + 6;
    else if (classification === "raro") hp = (nd * 25) + 10;
    else if (classification === "místico") {
      hp = nd <= 6 ? (nd * 27) + 15 : (nd * 30) + 20;
    }

    // Modificadores de Tipo
    const typeKey = type.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (typeKey === "morto-vivo") hp = Math.floor(hp * 1.2);
    else if (typeKey === "espirito") hp = Math.floor(hp * 0.8);

    // PA
    const pa = 3 + Math.floor(nd / 3);

    // PE (Sugerido: ND * 5 + 5 para comuns, +10 para raros, +20 para místicos)
    const peBonus = classification === "místico" ? 20 : (classification === "raro" ? 10 : 5);
    const pe = (nd * 5) + peBonus;

    // Dados de Ataque
    let dice = "2d6";
    if (nd >= 4 && nd <= 5) dice = "3d6";
    else if (nd >= 6 && nd <= 7) dice = "4d6";
    else if (nd >= 8) dice = "5d6";

    // Bônus de Ataque (ND/3 + melhor atributo físico)
    const bestPhysical = Math.max(this.monsterData.attributes.pot || 0, this.monsterData.attributes.hab || 0);
    const atkBonus = Math.floor(nd / 3) + bestPhysical;

    // Pontos de Talento
    const multipliers = { comum: 4, raro: 6, místico: 8 };
    const talentPoints = nd * (multipliers[classification] || 4);

    return { hp, pa, pe, dice, atkBonus, talentPoints };
  }

  _onUpdateBase(event, target) {
    const formData = new foundry.applications.ux.FormDataExtended(this.element).object;
    const expanded = foundry.utils.expandObject(formData);
    foundry.utils.mergeObject(this.monsterData, expanded);
    this.render();
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);

    // Adicionar listeners para campos que precisam de re-render
    const renderTriggers = this.element.querySelectorAll('input[name="nd"], select[name="classification"], select[name="type"], select[name="damage.preset"], select[name="damage.attribute"]');
    for (const el of renderTriggers) {
      el.addEventListener("change", (ev) => this._onUpdateBase(ev, el));
    }
  }

  _onNextStep() {
    this._saveFormData();
    this.step++;
    this.render();
  }

  _onPrevStep() {
    this._saveFormData();
    this.step--;
    this.render();
  }

  _onToggleSkill(event, target) {
    const skill = target.dataset.skill;
    const rank = parseInt(target.dataset.rank);

    // Validar limites por ND e Classificação
    const { nd, classification } = this.monsterData;
    const minND = SKILL_LIMITS[classification][rank];

    if (rank > 0 && nd < minND) {
      const rankLabel = ["Nenhum", "Amador", "Profissional", "Mestre"][rank];
      ui.notifications.warn(`Nível ${rankLabel} só disponível a partir do ND ${minND} para criaturas ${classification}.`);
      return;
    }

    this.monsterData.selectedSkills[skill] = rank;
    this.render();
  }

  _onToggleTalent(event, target) {
    const uuid = target.dataset.uuid;
    const name = target.dataset.name;
    const cost = parseInt(target.dataset.cost);

    const index = this.monsterData.selectedTalents.findIndex(t => t.uuid === uuid);
    if (index > -1) {
      this.monsterData.selectedTalents.splice(index, 1);
    } else {
      const spent = this._calculateSpentPoints();
      const limit = this._calculateSuggestions().talentPoints;
      if (spent + cost > limit) {
        ui.notifications.warn(`Orçamento de talentos excedido (${spent + cost}/${limit})`);
        return;
      }
      this.monsterData.selectedTalents.push({ uuid, name, cost });
    }
    this.render();
  }

  _saveFormData() {
    const formData = new foundry.applications.ux.FormDataExtended(this.element).object;
    const expanded = foundry.utils.expandObject(formData);
    foundry.utils.mergeObject(this.monsterData, expanded);
  }

  async _onCreateMonster() {
    const suggestions = this._calculateSuggestions();

    // Mapear atributos para o formato do DataModel (valor -> {value: valor})
    const attributes = {};
    for (const [key, val] of Object.entries(this.monsterData.attributes)) {
      attributes[key] = { value: val };
    }

    // Mapear perícias
    const skills = [];
    for (const [key, rank] of Object.entries(this.monsterData.selectedSkills)) {
      if (rank > 0) skills.push({ key, rank });
    }

    // Calcular tabela de dano final (4 ou 6 ACs baseado no ND)
    const dt = this._getDamageTablePreview();
    const nd = this.monsterData.nd;

    const actorData = {
      name: this.monsterData.name,
      type: "npc",
      system: {
        nd: nd,
        classification: this.monsterData.classification,
        type: this.monsterData.type,
        status: {
          hp: { value: suggestions.hp, max: suggestions.hp },
          pe: { value: suggestions.pe, max: suggestions.pe },
          pa: { value: suggestions.pa, max: suggestions.pa, perRound: suggestions.pa }
        },
        attack: {
          formula: suggestions.dice,
          baseBonus: suggestions.atkBonus,
          label: "Ataque Primário",
          attribute: this.monsterData.damage.attribute
        },
        damageTable: {
          damageType: this.monsterData.damage.type,
          attribute: this.monsterData.damage.attribute,
          ac1: dt.ac1,
          ac2: dt.ac2,
          ac3: dt.ac3,
          ac4: dt.ac4,
          ac5: nd >= 5 ? dt.ac5 : 0,
          ac6: nd >= 5 ? dt.ac6 : 0
        },
        attributes: attributes,
        skills: skills
      }
    };

    const actor = await Actor.create(actorData);

    // Adicionar talentos selecionados
    if (this.monsterData.selectedTalents.length > 0) {
      const talentItems = [];
      for (const t of this.monsterData.selectedTalents) {
        const item = await fromUuid(t.uuid);
        if (item) {
          const itemData = item.toObject();
          // Converter para o formato simplificado de habilidade de NPC se necessário, 
          // ou apenas adicionar como item. NPCs no Animus parecem usar o array 'abilities'
          // Mas vamos adicionar como itens reais se o sistema permitir, 
          // ou mapear para 'system.abilities'
          talentItems.push(itemData);
        }
      }

      // No Animus, talentos de NPCs são convertidos para o array system.abilities
      const abilities = talentItems.map(item => ({
        name: item.name,
        rarity: "comum",
        talentCost: item.system.cost || 0,
        bonuses: item.system.bonuses || {},
        check: item.system.check || {},
        specialActions: item.system.specialActions || [],
        formula: item.system.formula || "",
        description: item.system.description
      }));

      await actor.update({ "system.abilities": abilities });
    }

    // Adicionar Identidade Inata como primeira habilidade
    const innate = INNATE_IDENTITIES[this.monsterData.type];
    if (innate) {
      const currentAbilities = actor.system.abilities || [];
      const innateAbility = {
        name: `${innate.name} (${this.monsterData.type.charAt(0).toUpperCase() + this.monsterData.type.slice(1)})`,
        rarity: "comum",
        talentCost: 0,
        description: innate.description,
        innate: true
      };
      await actor.update({ "system.abilities": [innateAbility, ...currentAbilities] });
    }

    actor.sheet.render(true);
    this.close();
  }

  static async #onSubmit(event, form, formData) {
    // Apenas para persistir os dados no objeto local entre re-renders
    const data = foundry.utils.expandObject(formData.object);
    foundry.utils.mergeObject(this.monsterData, data);
  }
}

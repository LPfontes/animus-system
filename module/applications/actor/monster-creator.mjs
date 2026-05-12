const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ApplicationV2 } = foundry.applications.api;

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
      attributes: { pot: 0, hab: 0, cog: 0, per: 0, pre: 0, ani: 0 },
      skills: [],
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
    position: { width: 600, height: "auto" },
    actions: {
      nextStep: AnimusMonsterCreator.prototype._onNextStep,
      prevStep: AnimusMonsterCreator.prototype._onPrevStep,
      createMonster: AnimusMonsterCreator.prototype._onCreateMonster,
      updateBase: AnimusMonsterCreator.prototype._onUpdateBase
    },
    form: {
      handler: AnimusMonsterCreator.#onSubmit,
      submitOnChange: true,
      closeOnSubmit: false
    }
  };

  static PARTS = {
    body: { template: "systems/animus/templates/apps/monster-creator.hbs" }
  };

  async _prepareContext(options) {
    const context = {
      step: this.step,
      data: this.monsterData,
      config: CONFIG.ANIMUS,
      suggestions: this._calculateSuggestions()
    };
    return context;
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

    // Bônus de Ataque
    const atkBonus = Math.floor(nd / 3);

    // Pontos de Talento
    const talentBudgets = { comum: 2, raro: 5, místico: 10 };
    const talentPoints = nd + (talentBudgets[classification] || 2);

    return { hp, pa, pe, dice, atkBonus, talentPoints };
  }

  _onUpdateBase(event, target) {
    const formData = new foundry.applications.ux.FormDataExtended(this.element).object;
    foundry.utils.mergeObject(this.monsterData, formData);
    this.render();
  }

  _onNextStep() {
    this.step++;
    this.render();
  }

  _onPrevStep() {
    this.step--;
    this.render();
  }

  async _onCreateMonster() {
    const suggestions = this._calculateSuggestions();
    
    const actorData = {
      name: this.monsterData.name,
      type: "npc",
      system: {
        nd: this.monsterData.nd,
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
          label: "Ataque Primário"
        },
        attributes: this.monsterData.attributes
      }
    };

    const actor = await Actor.create(actorData);
    actor.sheet.render(true);
    this.close();
  }

  static async #onSubmit(event, form, formData) {
    // Apenas para persistir os dados no objeto local entre re-renders
    const data = foundry.utils.expandObject(formData.object);
    foundry.utils.mergeObject(this.monsterData, data);
  }
}

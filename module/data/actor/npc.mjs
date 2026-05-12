import ANIMUS from "../../config.mjs";

export default class AnimusNPCData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      // Identidade e Classificação
      nd: new fields.NumberField({ initial: 1, min: 1, max: 10, integer: true }),
      classification: new fields.StringField({ initial: "comum", choices: ["comum", "raro", "místico"] }),
      type: new fields.StringField({ initial: "humanoide" }),
      tags: new fields.ArrayField(new fields.StringField(), { initial: [] }),
      quote: new fields.StringField({ initial: "" }),
      ecology: new fields.HTMLField({ initial: "" }),
      weaknesses: new fields.HTMLField({ initial: "" }),
      availableActions: new fields.HTMLField({ initial: "" }),
      loot: new fields.HTMLField({ initial: "" }),
      narratorNotes: new fields.HTMLField({ initial: "" }),

      // Recursos de Combate
      status: new fields.SchemaField({
        hp: new fields.SchemaField({
          value: new fields.NumberField({ initial: 10, integer: true, min: 0 }),
          max: new fields.NumberField({ initial: 10, integer: true, min: 1 })
        }),
        pe: new fields.SchemaField({
          value: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
          max: new fields.NumberField({ initial: 0, integer: true, min: 0 })
        }),
        pa: new fields.SchemaField({
          value: new fields.NumberField({ initial: 3, integer: true, min: 0 }),
          max: new fields.NumberField({ initial: 3, integer: true, min: 0 }),
          perRound: new fields.NumberField({ initial: 3, integer: true, min: 1 })
        }),
        prot: new fields.SchemaField({
          value: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
          max: new fields.NumberField({ initial: 0, integer: true, min: 0 })
        })
      }),

      // Atributos (Bônus fixos)
      attributes: new fields.SchemaField({
        pot: new fields.SchemaField({ value: new fields.NumberField({ initial: 0, integer: true }) }),
        hab: new fields.SchemaField({ value: new fields.NumberField({ initial: 0, integer: true }) }),
        cog: new fields.SchemaField({ value: new fields.NumberField({ initial: 0, integer: true }) }),
        per: new fields.SchemaField({ value: new fields.NumberField({ initial: 0, integer: true }) }),
        pre: new fields.SchemaField({ value: new fields.NumberField({ initial: 0, integer: true }) }),
        ani: new fields.SchemaField({ value: new fields.NumberField({ initial: 0, integer: true }) })
      }),

      // Perícias Atribuídas
      skills: new fields.ArrayField(new fields.SchemaField({
        key: new fields.StringField({ initial: "luta" }),
        rank: new fields.NumberField({ initial: 1, min: 1, max: 3 }) // 1: Amador, 2: Profissional, 3: Mestre
      }), { initial: [] }),

      // Dados de Ataque e Tabela de Dano
      attack: new fields.SchemaField({
        formula: new fields.StringField({ initial: "2d6" }),
        attribute: new fields.StringField({ initial: "pot" }),
        label: new fields.StringField({ initial: "Ataque" }),
        aptitude: new fields.StringField({ initial: "none" }) // none, amador, profissional, mestre
      }),

      damageTable: new fields.SchemaField({
        ac1: new fields.NumberField({ initial: 0, integer: true }),
        ac2: new fields.NumberField({ initial: 0, integer: true }),
        ac3: new fields.NumberField({ initial: 0, integer: true }),
        ac4: new fields.NumberField({ initial: 0, integer: true }),
        ac5: new fields.NumberField({ initial: 0, integer: true }),
        ac6: new fields.NumberField({ initial: 0, integer: true }), // Duplo 6
        damageType: new fields.StringField({ initial: "cortante" }),
        attribute: new fields.StringField({ initial: "pot" })
      }),

      // Turnos e Habilidades (Arrays simples para o NPC)
      abilities: new fields.ArrayField(new fields.SchemaField({
        name: new fields.StringField({ initial: "Nova Habilidade" }),
        rarity: new fields.StringField({ initial: "comum" }),
        frequency: new fields.StringField({ initial: "" }),
        paCost: new fields.NumberField({ initial: 0, integer: true }),
        peCost: new fields.NumberField({ initial: 0, integer: true }),
        talentCost: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
        bonuses: new fields.SchemaField({
          hp: new fields.NumberField({ initial: 0, integer: true }),
          pe: new fields.NumberField({ initial: 0, integer: true }),
          pa: new fields.NumberField({ initial: 0, integer: true }),
          damage: new fields.NumberField({ initial: 0, integer: true }),
          attributes: new fields.SchemaField({
            pot: new fields.NumberField({ initial: 0, integer: true }),
            hab: new fields.NumberField({ initial: 0, integer: true }),
            cog: new fields.NumberField({ initial: 0, integer: true }),
            per: new fields.NumberField({ initial: 0, integer: true }),
            pre: new fields.NumberField({ initial: 0, integer: true }),
            ani: new fields.NumberField({ initial: 0, integer: true })
          }),
          resistances: new fields.SchemaField({
            physical: new fields.NumberField({ initial: 0, integer: true }),
            elemental: new fields.NumberField({ initial: 0, integer: true }),
            mental: new fields.NumberField({ initial: 0, integer: true })
          })
        }),
        check: new fields.SchemaField({
          attribute: new fields.StringField({ initial: "" }),
          difficulty: new fields.StringField({ initial: "" })
        }),
        specialActions: new fields.ArrayField(new fields.StringField(), { initial: [] }),
        formula: new fields.StringField({ initial: "" }),
        description: new fields.HTMLField({ initial: "" })
      }), { initial: [] }),

      turnPatterns: new fields.ArrayField(new fields.SchemaField({
        label: new fields.StringField({ initial: "Turno Padrão" }),
        description: new fields.StringField({ initial: "" }),
        totalPA: new fields.NumberField({ initial: 0, integer: true })
      }), { initial: [] })
    };
  }

  /**
   * Tabelas de Escalonamento Automático
   */
  static SCALING = {
    attack: {
      "1-2": { comum: "2d6 (none)", raro: "2d6 (none)", mistico: "3d6 (amador)" },
      "3-4": { comum: "3d6 (amador)", raro: "3d6 (amador)", mistico: "4d6 (profissional)" },
      "5-6": { comum: "3d6 (amador)", raro: "4d6 (profissional)", mistico: "4d6 (profissional)" },
      "7-8": { comum: "4d6 (profissional)", raro: "4d6 (profissional)", mistico: "5d6 (mestre)" },
      "9-10": { comum: "5d6 (mestre)", raro: "5d6 (mestre)", mistico: "5d6 (mestre)" }
    },
    skills: {
      "1-2": { quantity: 2, comum: { amador: 2 }, raro: { amador: 2 }, mistico: { amador: 1, profissional: 1 } },
      "3-4": { quantity: 4, comum: { amador: 4 }, raro: { amador: 3, profissional: 1 }, mistico: { amador: 2, profissional: 2 } },
      "5-6": { quantity: 6, comum: { amador: 3, profissional: 3 }, raro: { amador: 4, profissional: 2 }, mistico: { amador: 3, profissional: 3 } },
      "7-8": { quantity: 8, comum: { amador: 4, profissional: 4 }, raro: { amador: 5, profissional: 3 }, mistico: { amador: 3, profissional: 4, mestre: 1 } },
      "9-10": { quantity: 10, comum: { amador: 5, profissional: 5 }, raro: { amador: 4, profissional: 4, mestre: 2 }, mistico: { amador: 3, profissional: 5, mestre: 2 } }
    },
    pa: {
      comum: 3,
      raro: 5,
      mistico: 7
    }
  };

  /**
   * Prepara os dados derivados do NPC
   */
  prepareDerivedData() {
    const nd = this.nd;
    const classification = this.classification;
    const scaling = this.constructor.SCALING;
    
    // 1. PV (Pontos de Vida) baseado em ND e Classificação
    let hpMax = 10;
    if (classification === "comum") {
      hpMax = (nd * 20) + 6;
    } else if (classification === "raro") {
      hpMax = (nd * 25) + 10;
    } else if (classification === "místico") {
      if (nd <= 6) hpMax = (nd * 27) + 15;
      else hpMax = (nd * 30) + 20;
    }

    // Modificadores de Identidade Inata (PV)
    const typeKey = this.type.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (typeKey === "morto-vivo") hpMax = Math.floor(hpMax * 1.2);
    else if (typeKey === "espirito") hpMax = Math.floor(hpMax * 0.8);

    this.status.hp.max = hpMax;

    // 2. PA (Pontos de Ação)
    const paBase = 3 + Math.floor(nd / 3);
    this.status.pa.max = paBase;
    this.status.pa.perRound = paBase;

    // 3. Orçamento de Pontos de Talento
    const multipliers = { comum: 4, raro: 6, místico: 8 };
    this.talentPointsTotal = nd * (multipliers[classification] || 4);
    this.talentPointsSpent = this.abilities.reduce((acc, a) => acc + (a.talentCost || 0), 0);

    // 4. Dados de Ataque (ND 1-3: 2d6, 4-5: 3d6, 6-7: 4d6, 8+: 5d6)
    let dice = "2d6";
    if (nd <= 3) dice = "2d6";
    else if (nd <= 5) dice = "3d6";
    else if (nd <= 7) dice = "4d6";
    else dice = "5d6";
    this.attack.formula = dice;

    // 4. Bônus de Ataque Base
    this.attack.baseBonus = Math.floor(nd / 3);

    // 5. Escalonamento de Perícias (Lookup nas tabelas de distribuição)
    const ndRange = this._getNDRange();
    this.skillLimits = scaling.skills[ndRange][classification] || scaling.skills[ndRange].comum;
    this.skillTotal = scaling.skills[ndRange].quantity;
    
    // 6. Aptidão de Ataque (Mantendo a lógica da tabela para determinar o nível de aptidão)
    const atkData = scaling.attack[ndRange][classification] || scaling.attack[ndRange].comum;
    const aptMatch = atkData.match(/\(([^)]+)\)/);
    this.attack.aptitude = aptMatch ? aptMatch[1] : "none";

    // 7. Aplicar Bônus de Habilidades (Talentos)
    this.status.resistances = { physical: 0, elemental: 0, mental: 0 };
    
    for (const ability of this.abilities) {
      const b = ability.bonuses;
      if (!b) continue;

      // Recursos
      this.status.hp.max += (b.hp || 0);
      this.status.pe.max += (b.pe || 0);
      this.status.pa.max += (b.pa || 0);
      this.status.pa.perRound += (b.pa || 0);

      // Atributos
      for (const [attr, val] of Object.entries(b.attributes || {})) {
        if (this.attributes[attr]) this.attributes[attr].value += val;
      }

      // Dano
      this.attack.baseBonus += (b.damage || 0);

      // Resistências
      if (b.resistances) {
        this.status.resistances.physical += (b.resistances.physical || 0);
        this.status.resistances.elemental += (b.resistances.elemental || 0);
        this.status.resistances.mental += (b.resistances.mental || 0);
      }
    }
  }

  /**
   * Helper para encontrar a faixa de ND
   */
  _getNDRange() {
    if (this.nd <= 2) return "1-2";
    if (this.nd <= 4) return "3-4";
    if (this.nd <= 6) return "5-6";
    if (this.nd <= 8) return "7-8";
    return "9-10";
  }
}

import ANIMUS from "../../config.mjs";

export default class AnimusCharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    
    const skillsSchema = {};
    for ( const key in ANIMUS.skills ) {
      skillsSchema[key] = new fields.SchemaField({
        value: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
        bonus: new fields.NumberField({ initial: 0, integer: true }),
        disadvantage: new fields.BooleanField({ initial: false })
      });
    }

    const attributesSchema = {};
    for ( const key in ANIMUS.attributes ) {
      attributesSchema[key] = new fields.SchemaField({
        value: new fields.NumberField({ initial: 0, integer: true, min: -2, max: 3 }),
        bonus: new fields.NumberField({ initial: 0, integer: true }),
        total: new fields.NumberField({ initial: 0, integer: true })
      });
    }

    return {
      attributes: new fields.SchemaField(attributesSchema),
      status: new fields.SchemaField({
        hp: new fields.SchemaField({
          value: new fields.NumberField({ initial: 10, integer: true }),
          max: new fields.NumberField({ initial: 10, integer: true })
        }),
        pe: new fields.SchemaField({
          value: new fields.NumberField({ initial: 10, integer: true }),
          max: new fields.NumberField({ initial: 10, integer: true })
        }),
        pa: new fields.SchemaField({
          value: new fields.NumberField({ initial: 3, integer: true }),
          max: new fields.NumberField({ initial: 3, integer: true }),
          debt: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
          penalty: new fields.NumberField({ initial: 0, integer: true, min: 0 })
        }),
        prot: new fields.SchemaField({ 
          value: new fields.NumberField({ initial: 0, integer: true }),
          max: new fields.NumberField({ initial: 0, integer: true })
        }) 
      }),
      details: new fields.SchemaField({
        ascendancy: new fields.StringField({ initial: "" }),
        element: new fields.StringField({ initial: "" }),
        level: new fields.NumberField({ initial: 1, integer: true, min: 1 }),
        biography: new fields.HTMLField({ initial: "" }),
        selectedFreeAttribute: new fields.StringField({ initial: "" }),
        actionCostPenalty: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
        advancement: new fields.SchemaField({
          distributedPoints: new fields.SchemaField({
            hp: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
            pe: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
            ap: new fields.NumberField({ initial: 0, integer: true, min: 0 })
          }),
          attributeBonuses: new fields.ObjectField({ initial: {} })
        }),
        shortRests: new fields.NumberField({ initial: 0, integer: true, min: 0, max: 2 })
      }),
      skills: new fields.SchemaField(skillsSchema)
    };
  }

  /** @override */
  prepareDerivedData() {
    const attributes = this.attributes;
    const status = this.status;
    const details = this.details;
    const level = details.level || 1;

    // 1. Inicializar Totais de Atributos
    for (let key in attributes) {
      attributes[key].total = attributes[key].value;
    }

    // 2. Aplicar Bônus de Origem e Evolução
    const items = this.parent.items;
    
    // Ascendência
    const ascendancy = items.find(i => i.type === "ascendancy");
    if (ascendancy) {
      const attrKey = ascendancy.system.bonus?.selectedAttribute?.toLowerCase();
      if (attrKey && attributes[attrKey]) attributes[attrKey].total += ascendancy.system.bonus.value;
    }

    // Elemento
    const element = items.find(i => i.type === "element");
    if (element) {
      const attrKey = element.system.bonus?.selectedAttribute?.toLowerCase();
      if (attrKey && attributes[attrKey]) attributes[attrKey].total += (element.system.bonus.value || 1);
    }

    // Ponto Livre e Níveis Ímpares
    const freeAttr = details.selectedFreeAttribute?.toLowerCase();
    if (freeAttr && attributes[freeAttr]) attributes[freeAttr].total += 1;

    const bonuses = details.advancement?.attributeBonuses || {};
    for (let [lvl, attrKey] of Object.entries(bonuses)) {
      if (parseInt(lvl) <= level && attributes[attrKey]) attributes[attrKey].total += 1;
    }

    // 3. Consolidar Totais com Limites (Hard Caps) e Bônus Temporários
    const caps = ANIMUS.LEVEL_CAPS[level] || ANIMUS.LEVEL_CAPS[1];
    for (let key in attributes) {
      attributes[key].total = Math.min(caps.attrCap, Math.max(-2, attributes[key].total + (attributes[key].bonus || 0)));
    }

    // 4. Calcular Proteção e Penalidades (Armadura, Escudo, Propriedades)
    let totalProt = 0;
    let skillPenalty = 0;
    let paPenalty = 0;
    let actionCostPenalty = 0;

    for (const item of items) {
      if (!item.system.equipped) continue;

      // Armaduras e Escudos
      if (["armor", "shield"].includes(item.type)) {
        totalProt += item.system.totalProtection || 0;
        skillPenalty += item.system.penalty || 0;
        paPenalty += item.system.paPenalty || 0;
        actionCostPenalty += (item.system.actionPenalty || 0);

        // Desvantagem em Furtividade para Armaduras Pesadas
        if (item.type === "armor" && item.system.type === "pesada") {
          if (this.skills.furtividade) this.skills.furtividade.disadvantage = true;
        }
      }
      // Propriedades
      else if (item.type === "property" && item.system.bonus?.defense) {
        totalProt += item.system.bonus.defense;
      }
    }
    status.prot.max = totalProt;
    details.actionCostPenalty = actionCostPenalty;

    // 5. Aplicar Bônus de Perícias (incluindo penalidades de equipamento)
    for (let key in this.skills) {
      const skill = this.skills[key];
      const config = ANIMUS.skills[key];
      skill.total = skill.value + (skill.bonus || 0);
      if (config && (config.attr === "pot" || config.attr === "hab")) {
        skill.total = Math.max(0, skill.total - skillPenalty);
      }
    }

    // 6. Cálculos de Status (HP, PE, PA)
    const autoBonus = level - 1;
    status.hp.max = 10 + autoBonus + (details.advancement?.distributedPoints?.hp || 0);
    status.pe.max = 10 + autoBonus + (details.advancement?.distributedPoints?.pe || 0);
    
    // PA: Base do nível - penalidades - dívida de PA
    status.pa.max = Math.max(0, caps.pa - paPenalty - (status.pa.penalty || 0));

    // 7. Cálculos de Pontos para a UI (Sincronização com Sheet)
    const totalStatPoints = autoBonus * 3;
    const spentStatPoints = (details.advancement?.distributedPoints?.hp || 0) + 
                           (details.advancement?.distributedPoints?.pe || 0) + 
                           (details.advancement?.distributedPoints?.ap || 0);
    
    this.pointsRemaining = totalStatPoints - spentStatPoints;

    // Pontos de Atributo (Ganhos por nível fixo)
    const totalAttrPoints = caps.attrPoints || 0;
    const spentAttrPoints = Object.values(attributes).reduce((acc, a) => acc + Math.max(0, a.value || 0), 0);
    this.attrPoints = {
      total: totalAttrPoints,
      available: Math.max(0, totalAttrPoints - spentAttrPoints)
    };

    // Pontos de Perícia (Base 4 + Pontos distribuídos)
    const totalSkillPoints = 4 + (details.advancement?.distributedPoints?.ap || 0);
    const spentSkillPoints = Object.values(this.skills).reduce((acc, s) => acc + (s.value || 0), 0);
    this.skillPoints = {
      total: totalSkillPoints,
      available: Math.max(0, totalSkillPoints - spentSkillPoints)
    };

    // Iniciativa
    this.iniciativa = attributes.per.total;
  }
}

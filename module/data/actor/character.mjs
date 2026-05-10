import ANIMUS from "../../config.mjs";

export default class AnimusCharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    
    const skillsSchema = {};
    for ( const key in ANIMUS.skills ) {
      skillsSchema[key] = new fields.SchemaField({
        value: new fields.NumberField({ initial: 0, integer: true, min: 0 })
      });
    }

    const attributesSchema = {};
    for ( const key in ANIMUS.attributes ) {
      attributesSchema[key] = new fields.SchemaField({
        value: new fields.NumberField({ initial: 0, integer: true, min: -2, max: 3 })
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
          debt: new fields.NumberField({ initial: 0, integer: true, min: 0 })
        }),
        prot: new fields.SchemaField({ 
          value: new fields.NumberField({ initial: 0, integer: true })
        }) 
      }),
      details: new fields.SchemaField({
        ascendancy: new fields.StringField({ initial: "" }),
        element: new fields.StringField({ initial: "" }),
        level: new fields.NumberField({ initial: 1, integer: true, min: 1 }),
        biography: new fields.HTMLField({ initial: "" }),
        selectedFreeAttribute: new fields.StringField({ initial: "" }),
        advancement: new fields.SchemaField({
          distributedPoints: new fields.SchemaField({
            hp: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
            pe: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
            pa: new fields.NumberField({ initial: 0, integer: true, min: 0 })
          }),
          attributeBonuses: new fields.ObjectField({ initial: {} })
        }),
        shortRests: new fields.NumberField({ initial: 0, integer: true, min: 0, max: 2 })
      }),
      skills: new fields.SchemaField(skillsSchema)
    };
  }

  prepareDerivedData() {
    const attributes = this.attributes;
    const status = this.status;
    const details = this.details;
    const level = details.level || 1;

    // 1. Aplicar bônus de ascendência (+1 em um dos atributos da lista)
    const ascendancy = this.parent.items.find(i => i.type === "ascendancy");
    if (ascendancy) {
      const bonus = ascendancy.system.bonus;
      const attrKey = bonus.selectedAttribute?.toLowerCase();
      if (attrKey && attributes[attrKey]) {
        attributes[attrKey].value += bonus.value;
      }
    }

    // 2. Aplicar bônus de elemento (+1 em um dos atributos da lista)
    const element = this.parent.items.find(i => i.type === "element");
    if (element) {
      const bonus = element.system.bonus;
      const attrKey = bonus.selectedAttribute?.toLowerCase();
      if (attrKey && attributes[attrKey]) {
        attributes[attrKey].value += (bonus.value || 1);
      }
    }

    // 3. Aplicar ponto livre de criação (+1 em qualquer atributo escolhido)
    const freeAttr = details.selectedFreeAttribute?.toLowerCase();
    if (freeAttr && attributes[freeAttr]) {
      attributes[freeAttr].value += 1;
    }

    // 4. Aplicar bônus de níveis ímpares
    for (const [lvl, attrKey] of Object.entries(details.advancement.attributeBonuses || {})) {
      const l = parseInt(lvl);
      if (l <= level && l > 1 && attributes[attrKey]) {
        attributes[attrKey].value += 1;
      }
    }

    // 5. Aplicar Limites (Hard Caps) baseados no nível
    const caps = ANIMUS.LEVEL_CAPS[level] || ANIMUS.LEVEL_CAPS[1];
    const maxAttr = caps.attrCap;
    for (let key in attributes) {
      attributes[key].value = Math.min(maxAttr, Math.max(-2, attributes[key].value));
    }

    // 6. Cálculos de Status (HP, PE, PA)
    const autoBonus = level - 1;
    status.hp.max = 10 + autoBonus + details.advancement.distributedPoints.hp;
    status.pe.max = 10 + autoBonus + details.advancement.distributedPoints.pe;
    status.pa.max = caps.pa + details.advancement.distributedPoints.pa;

    // 7. Cálculos de Pontos Disponíveis (para a UI)
    // Pontos de Status (ganhos por nível, usados em HP, PE, AP)
    const totalStatPoints = autoBonus * 3;
    const spentStatPoints = details.advancement.distributedPoints.hp + 
                           details.advancement.distributedPoints.pe + 
                           details.advancement.distributedPoints.pa;
    this.statPoints = {
      total: totalStatPoints,
      spent: spentStatPoints,
      available: totalStatPoints - spentStatPoints
    };

    // Pontos de Atributo (baseados na tabela LEVEL_CAPS)
    const totalAttrPoints = caps.attrPoints;
    const spentAttrPoints = Object.values(this.attributes).reduce((acc, a) => acc + (a.value > 0 ? a.value : 0), 0);
    // Nota: aqui a lógica de spentAttrPoints pode ser complexa se houver bônus de criação/ascendência.
    // Idealmente, contamos apenas o que o usuário distribuiu.
    this.attrPoints = {
      total: totalAttrPoints,
      available: totalAttrPoints - spentAttrPoints // Simplificado
    };

    // 7. Proteção Máxima (Soma de todas as armaduras equipadas) — dado derivado, não persistido
    const armaduras = this.parent.items.filter(i => i.type === "armor" && i.system.equipped);
    const protMax = armaduras.reduce((acc, i) => acc + (i.system.totalProtection || 0), 0);
    Object.defineProperty(status.prot, "max", { value: protMax, writable: true, configurable: true });

    // Iniciativa (adicionando como campo temporário para uso em rolagens)
    this.iniciativa = attributes.per.value;
  }
}

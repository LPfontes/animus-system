import ANIMUS from "../../config.mjs";
import AnimusItemData from "./base-item.mjs";

export default class AnimusWeaponData extends AnimusItemData {
  static defineSchema() {
    const fields = foundry.data.fields;
    const baseSchema = super.defineSchema();
    
    return {
      ...baseSchema,
      damage: new fields.SchemaField({
        ac1: new fields.SchemaField({
          base: new fields.NumberField({ initial: 2, integer: true, min: 0 }),
          mult: new fields.NumberField({ initial: 0, integer: true, min: 0 })
        }),
        ac2: new fields.SchemaField({
          base: new fields.NumberField({ initial: 3, integer: true, min: 0 }),
          mult: new fields.NumberField({ initial: 1, integer: true, min: 0 })
        }),
        ac3: new fields.SchemaField({
          base: new fields.NumberField({ initial: 4, integer: true, min: 0 }),
          mult: new fields.NumberField({ initial: 2, integer: true, min: 0 })
        }),
        ac4: new fields.SchemaField({
          base: new fields.NumberField({ initial: 5, integer: true, min: 0 }),
          mult: new fields.NumberField({ initial: 3, integer: true, min: 0 })
        })
      }),
      attribute: new fields.StringField({ initial: "pot", choices: Object.keys(ANIMUS.attributes) }),
      damageType: new fields.StringField({ initial: "cortante", choices: Object.keys(ANIMUS.damageTypes) }),
      category: new fields.StringField({ initial: "branca", choices: Object.keys(ANIMUS.weaponCategories) }),
      type: new fields.StringField({ initial: "cortante_leve", choices: Object.keys(ANIMUS.weaponTypes) }),
      range: new fields.NumberField({ initial: 0, integer: true, min: 0, max: 3 }),
      properties: new fields.ArrayField(new fields.StringField(), { initial: [] }),
      specialActions: new fields.ArrayField(new fields.StringField(), { initial: [] }),
      runeSlots: new fields.SchemaField({
        basic: new fields.NumberField({ initial: 2, integer: true, min: 0 }),
        reinforced: new fields.NumberField({ initial: 1, integer: true, min: 0 })
      })
    };
  }

  /**
   * Calcula os valores da tabela de dano com base no ator que possui o item.
   */
  get damageTable() {
    const actor = this.parent?.actor;
    if (!actor) return null;

    // Suporte para transição: se attribute for número, converte para string
    const attrKey = typeof this.attribute === "number" 
      ? (ANIMUS.attributesByIndex[this.attribute] || "pot")
      : this.attribute;
    
    const attrValue = actor.system.attributes[attrKey]?.value || 0;
    const table = {};

    for (let i = 1; i <= 4; i++) {
      const ac = this.damage[`ac${i}`];
      table[`ac${i}`] = ac.base + (ac.mult * attrValue);
    }

    return table;
  }

  /**
   * Retorna os itens de propriedade vinculados a esta arma.
   */
  get propertyItems() {
    return this.properties.map(id => {
      return game.items.get(id) || game.packs.get("animus.propriedades")?.index.get(id);
    }).filter(p => p);
  }

  static migrateData(source) {
    if (typeof source.attribute === "number") {
      source.attribute = ANIMUS.attributesByIndex[source.attribute] || "pot";
    }
    if (typeof source.damageType === "number") {
      source.damageType = ANIMUS.damageTypesByIndex[source.damageType] || "cortante";
    }
    if (typeof source.category === "number") {
      source.category = "branca"; 
    }
    if (typeof source.type === "number") {
      source.type = ANIMUS.weaponTypesByIndex[source.type] || "cortante_leve";
    }
    if (source.check) {
      if (typeof source.check.attribute === "number") {
        source.check.attribute = ANIMUS.attributesByIndex[source.check.attribute] || "pot";
      }
      if (typeof source.check.skill === "number") {
        source.check.skill = ANIMUS.skillsByIndex[source.check.skill] || "";
      }
    }
    return super.migrateData(source);
  }
}

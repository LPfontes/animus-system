import ANIMUS from "../../config.mjs";

export default class AnimusItemData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      description: new fields.HTMLField({ initial: "" }),
      effect: new fields.HTMLField({ initial: "" }),
      category: new fields.StringField({ initial: "", blank: true }),
      subCategory: new fields.StringField({ initial: "", blank: true }),
      consumable: new fields.BooleanField({ initial: false }),
      equipped: new fields.BooleanField({ initial: false }),
      
      // Dados para realização de testes (Checks)
      check: new fields.SchemaField({
        attribute: new fields.StringField({ initial: "pot", choices: Object.keys(ANIMUS.attributes) }),
        skill: new fields.StringField({ initial: "", choices: Object.keys(ANIMUS.skills), blank: true }),
        dc: new fields.NumberField({ initial: 0, integer: true }) // Dificuldade fixa
      }),

      // Dados para aplicação de efeitos (Resultados)
      application: new fields.SchemaField({
        type: new fields.StringField({ initial: "none" }), // none, damage, heal, condition
        formula: new fields.StringField({ initial: "" }),
        resource: new fields.StringField({ initial: "pv" }), // pv, pe
        damageType: new fields.NumberField({ initial: 0, integer: true }), 
        condition: new fields.StringField({ initial: "" }),
        onSuccess: new fields.StringField({ initial: "" })
      }),

      quantity: new fields.NumberField({ initial: 1, integer: true, min: 0 }),
      weight: new fields.StringField({ initial: "0" }),
      slots: new fields.NumberField({ initial: 1, integer: true, min: 0 }),
      price: new fields.StringField({ initial: "0" }),
      requirements: new fields.SchemaField({
        talents: new fields.ObjectField({ initial: {} }),
        attributes: new fields.ArrayField(new fields.SchemaField({
          key: new fields.StringField({ initial: "pot" }),
          value: new fields.NumberField({ initial: 1, integer: true, min: 1 })
        }), { initial: [] }),
        skills: new fields.ArrayField(new fields.SchemaField({
          key: new fields.StringField({ initial: "atletismo" }),
          rank: new fields.NumberField({ initial: 1, integer: true, min: 1 })
        }), { initial: [] }),
        description: new fields.StringField({ initial: "" })
      })
    };
  }

  static migrateData(source) {
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

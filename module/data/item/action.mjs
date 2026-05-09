import AnimusItemData from "./base-item.mjs";

export default class AnimusActionData extends AnimusItemData {
  static defineSchema() {
    const fields = foundry.data.fields;
    const baseSchema = super.defineSchema();
    
    return {
      ...baseSchema,
      cost: new fields.NumberField({ initial: 1, integer: true, min: 0 }), // Custo em PA
      peCost: new fields.NumberField({ initial: 0, integer: true, min: 0 }), // Custo em PE
      trigger: new fields.StringField({ initial: "" }),
      type: new fields.NumberField({ initial: 0, integer: true, min: 0, max: 2 }) // 0: Ataque, 1: Defesa, 2: Utilitária
    };
  }
}

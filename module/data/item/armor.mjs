import AnimusItemData from "./base-item.mjs";

export default class AnimusArmorData extends AnimusItemData {
  static defineSchema() {
    const fields = foundry.data.fields;
    const baseSchema = super.defineSchema();
    
    return {
      ...baseSchema,
      protection: new fields.NumberField({ initial: 1, integer: true, min: 0 }),
      penalty: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
      equipped: new fields.BooleanField({ initial: false })
    };
  }
}

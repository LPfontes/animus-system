import AnimusItemData from "./base-item.mjs";

export default class AnimusConditionData extends AnimusItemData {
  static defineSchema() {
    const fields = foundry.data.fields;
    const baseSchema = super.defineSchema();
    
    return {
      ...baseSchema,
      penalty: new fields.HTMLField({ initial: "" }),
      cause: new fields.HTMLField({ initial: "" }),
      removal: new fields.HTMLField({ initial: "" }),
      duration: new fields.StringField({ initial: "" })
    };
  }
}

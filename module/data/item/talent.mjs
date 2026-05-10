import AnimusItemData from "./base-item.mjs";

export default class AnimusTalentData extends AnimusItemData {
  static defineSchema() {
    const fields = foundry.data.fields;
    const baseSchema = super.defineSchema();

    return {
      ...baseSchema,
      cost: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
      type: new fields.NumberField({ initial: 0, integer: true, min: 0, max: 3 }),
      action: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
      trigger: new fields.StringField({ initial: "" }),
      specialActions: new fields.ArrayField(new fields.StringField(), { initial: [] }),
      subCategory: new fields.StringField({ initial: "" })
    };
  }
}

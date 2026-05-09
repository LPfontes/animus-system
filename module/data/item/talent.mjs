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
      requirements: new fields.SchemaField({
        talents: new fields.ArrayField(new fields.StringField(), { initial: [] }),
        attributes: new fields.ArrayField(new fields.SchemaField({
          key: new fields.StringField({ initial: "pot" }),
          value: new fields.NumberField({ initial: 1, integer: true, min: 1 })
        }), { initial: [] }),
        skills: new fields.ArrayField(new fields.SchemaField({
          key: new fields.StringField({ initial: "atletismo" }),
          rank: new fields.NumberField({ initial: 1, integer: true, min: 1 })
        }), { initial: [] })
      })
    };
  }
}

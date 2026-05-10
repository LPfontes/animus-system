import AnimusItemData from "./base-item.mjs";

export default class AnimusAscendancyData extends AnimusItemData {
  static defineSchema() {
    const fields = foundry.data.fields;
    const baseSchema = super.defineSchema();
    
    return {
      ...baseSchema,
      bonus: new fields.SchemaField({
        value: new fields.NumberField({ initial: 0, integer: true }),
        attributes: new fields.ArrayField(new fields.StringField()),
        selectedAttribute: new fields.StringField({ initial: "" })
      }),
      innateAbilities: new fields.ArrayField(new fields.SchemaField({
        name: new fields.StringField(),
        description: new fields.HTMLField(),
        mechanicalEffect: new fields.StringField()
      }))
    };
  }
}

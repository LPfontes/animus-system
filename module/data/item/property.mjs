import AnimusItemData from "./base-item.mjs";

export default class AnimusPropertyData extends AnimusItemData {
  static defineSchema() {
    const fields = foundry.data.fields;
    const baseSchema = super.defineSchema();

    return {
      ...baseSchema,
      type: new fields.NumberField({ initial: 0, integer: true, min: 0, max: 3 }),
      action: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
      specialActions: new fields.ArrayField(new fields.StringField(), { initial: [] }),
      
      // Bônus Numéricos
      bonus: new fields.SchemaField({
        damage: new fields.NumberField({ initial: 0, integer: true }),
        mult: new fields.NumberField({ initial: 0, integer: true }),
        defense: new fields.NumberField({ initial: 0, integer: true }),
        defenseMult: new fields.NumberField({ initial: 0, integer: true }),
        reach: new fields.NumberField({ initial: 0, min: 0, step: 1.5 }),
        ac: new fields.SchemaField({
          ac1: new fields.NumberField({ initial: 0, integer: true }),
          ac2: new fields.NumberField({ initial: 0, integer: true }),
          ac3: new fields.NumberField({ initial: 0, integer: true }),
          ac4: new fields.NumberField({ initial: 0, integer: true })
        })
      }),

      // Requisitos para poder usar a propriedade
      requirements: new fields.SchemaField({
        weaponTypes: new fields.ArrayField(new fields.StringField()),
        attributes: new fields.ArrayField(new fields.SchemaField({
          key: new fields.StringField(),
          value: new fields.NumberField()
        })),
        skills: new fields.ArrayField(new fields.SchemaField({
          key: new fields.StringField(),
          rank: new fields.NumberField()
        }))
      }),

      // Marcadores de mecânicas especiais
      flags: new fields.SchemaField({
        isLight: new fields.BooleanField({ initial: false }),
        isVersatile: new fields.BooleanField({ initial: false }),
        ignoreShields: new fields.BooleanField({ initial: false }),
        isSilent: new fields.BooleanField({ initial: false }),
        isThrown: new fields.BooleanField({ initial: false })
      })
    };
  }
}

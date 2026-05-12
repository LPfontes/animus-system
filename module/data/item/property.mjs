import AnimusItemData from "./base-item.mjs";

export default class AnimusPropertyData extends AnimusItemData {
  static defineSchema() {
    const fields = foundry.data.fields;
    const baseSchema = super.defineSchema();

    return {
      ...baseSchema,
      type: new fields.NumberField({ initial: 0, integer: true, min: 0, max: 3 }),
      subCategory: new fields.StringField({ initial: "" }),
      action: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
      specialActions: new fields.ArrayField(new fields.StringField(), { initial: [] }),
      
      // Bônus Numéricos
      bonus: new fields.SchemaField({
        damage: new fields.NumberField({ initial: 0, integer: true }),
        mult: new fields.NumberField({ initial: 0, integer: true }),
        defense: new fields.NumberField({ initial: 0, integer: true }),
        defenseMult: new fields.NumberField({ initial: 0, integer: true }),
        reach: new fields.NumberField({ initial: 0, min: 0, step: 1.5 }),
        
        // Sobrescrita de Atributo (ex: Trocar POT por HAB)
        attributeOverride: new fields.StringField({ initial: "", blank: true }),
        
        // Bônus de Multiplicador baseado em Atributos (ex: +1xHAB no mult)
        attrMult: new fields.SchemaField({
          pot: new fields.NumberField({ initial: 0, integer: true }),
          hab: new fields.NumberField({ initial: 0, integer: true }),
          cog: new fields.NumberField({ initial: 0, integer: true }),
          per: new fields.NumberField({ initial: 0, integer: true }),
          pre: new fields.NumberField({ initial: 0, integer: true }),
          ani: new fields.NumberField({ initial: 0, integer: true })
        }),

        ac: new fields.SchemaField({
          ac1: new fields.NumberField({ initial: 0, integer: true }),
          ac2: new fields.NumberField({ initial: 0, integer: true }),
          ac3: new fields.NumberField({ initial: 0, integer: true }),
          ac4: new fields.NumberField({ initial: 0, integer: true })
        })
      }),

      // Tipos de arma compatíveis com esta propriedade (complementa os requisitos do base)
      weaponTypes: new fields.ArrayField(new fields.StringField({ initial: "" }), { initial: [] }),

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

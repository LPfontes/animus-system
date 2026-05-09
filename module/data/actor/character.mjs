import ANIMUS from "../../config.mjs";

export default class AnimusCharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    
    const skillsSchema = {};
    for ( const key in ANIMUS.skills ) {
      skillsSchema[key] = new fields.SchemaField({
        value: new fields.NumberField({ initial: 0, integer: true, min: 0 })
      });
    }

    const attributesSchema = {};
    for ( const key in ANIMUS.attributes ) {
      attributesSchema[key] = new fields.SchemaField({
        value: new fields.NumberField({ initial: 0, integer: true, min: 0 })
      });
    }

    return {
      attributes: new fields.SchemaField(attributesSchema),
      status: new fields.SchemaField({
        hp: new fields.SchemaField({
          value: new fields.NumberField({ initial: 10, integer: true }),
          max: new fields.NumberField({ initial: 10, integer: true })
        }),
        pe: new fields.SchemaField({
          value: new fields.NumberField({ initial: 10, integer: true }),
          max: new fields.NumberField({ initial: 10, integer: true })
        }),
        pa: new fields.SchemaField({
          value: new fields.NumberField({ initial: 3, integer: true }),
          max: new fields.NumberField({ initial: 3, integer: true })
        }),
        prot: new fields.SchemaField({ value: new fields.NumberField({ initial: 0, integer: true }) })
      }),
      details: new fields.SchemaField({
        ascendancy: new fields.StringField({ initial: "" }),
        element: new fields.StringField({ initial: "" }),
        level: new fields.NumberField({ initial: 1, integer: true, min: 1 }),
        biography: new fields.HTMLField({ initial: "" })
      }),
      skills: new fields.SchemaField(skillsSchema)
    };
  }

  prepareDerivedData() {
    const attributes = this.attributes;
    const status = this.status;

    // Cálculo de HP Máximo: Base 10 + (POT * 5)
    status.hp.max = 10 + (attributes.pot.value * 5);

    // Cálculo de PE Máximo: Base 10 + (ANI * 5)
    status.pe.max = 10 + (attributes.ani.value * 5);

    // Defesa: Manual via input (valor base 0)
    // status.prot.value = 10 + attributes.hab.value;

    // Iniciativa (adicionando como campo temporário para uso em rolagens)
    this.iniciativa = attributes.per.value;
  }
}

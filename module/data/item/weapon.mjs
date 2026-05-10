import AnimusItemData from "./base-item.mjs";

export default class AnimusWeaponData extends AnimusItemData {
  static defineSchema() {
    const fields = foundry.data.fields;
    const baseSchema = super.defineSchema();
    
    return {
      ...baseSchema,
      damage: new fields.SchemaField({
        ac1: new fields.SchemaField({
          base: new fields.NumberField({ initial: 2, integer: true, min: 0 }),
          mult: new fields.NumberField({ initial: 0, integer: true, min: 0 })
        }),
        ac2: new fields.SchemaField({
          base: new fields.NumberField({ initial: 3, integer: true, min: 0 }),
          mult: new fields.NumberField({ initial: 1, integer: true, min: 0 })
        }),
        ac3: new fields.SchemaField({
          base: new fields.NumberField({ initial: 4, integer: true, min: 0 }),
          mult: new fields.NumberField({ initial: 2, integer: true, min: 0 })
        }),
        ac4: new fields.SchemaField({
          base: new fields.NumberField({ initial: 5, integer: true, min: 0 }),
          mult: new fields.NumberField({ initial: 3, integer: true, min: 0 })
        })
      }),
      attribute: new fields.NumberField({ initial: 0, integer: true, min: 0, max: 5 }),
      damageType: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
      type: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
      range: new fields.NumberField({ initial: 0, integer: true, min: 0, max: 3 }),
      properties: new fields.ArrayField(new fields.StringField(), { initial: [] }),
      specialActions: new fields.ArrayField(new fields.StringField(), { initial: [] }),
      runeSlots: new fields.SchemaField({
        basic: new fields.NumberField({ initial: 2, integer: true, min: 0 }),
        reinforced: new fields.NumberField({ initial: 1, integer: true, min: 0 })
      })
    };
  }

  /**
   * Calcula os valores da tabela de dano com base no ator que possui o item.
   */
  get damageTable() {
    const actor = this.parent?.actor;
    if (!actor) return null;

    const attrValue = actor.system.attributes[this.attribute]?.value || 0;
    const table = {};

    for (let i = 1; i <= 4; i++) {
      const ac = this.damage[`ac${i}`];
      table[`ac${i}`] = ac.base + (ac.mult * attrValue);
    }

    return table;
  }

  /**
   * Retorna os itens de propriedade vinculados a esta arma.
   */
  get propertyItems() {
    return this.properties.map(id => game.items.get(id) || game.packs.get("animus-system.propriedades")?.index.get(id)).filter(p => p);
  }
}

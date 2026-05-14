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
      specialization: new fields.StringField({ initial: "" }),
      requiresSpecialization: new fields.BooleanField({ initial: false }),
      specialActions: new fields.ArrayField(new fields.StringField(), { initial: [] }),
      grantedActions: new fields.ArrayField(new fields.SchemaField({
        id: new fields.StringField({ initial: () => foundry.utils.randomID() }),
        name: new fields.StringField({ initial: "" }),
        cost: new fields.NumberField({ initial: 1, integer: true, min: 0 }),
        peCost: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
        type: new fields.NumberField({ initial: 2, integer: true, min: 0, max: 2 }),
        description: new fields.StringField({ initial: "" })
      }), { initial: [] }),
      grantedItems: new fields.ArrayField(new fields.SchemaField({
        id: new fields.StringField({ initial: () => foundry.utils.randomID() }),
        name: new fields.StringField({ initial: "" }),
        img: new fields.FilePathField({ categories: ["IMAGE"], initial: "icons/svg/item-bag.svg" }),
        quantity: new fields.NumberField({ initial: 1, integer: true, min: 1 }),
        description: new fields.StringField({ initial: "" }),
        type: new fields.StringField({ initial: "item" }),
        consumable: new fields.BooleanField({ initial: false }),
        subCategory: new fields.StringField({ initial: "" }),
        price: new fields.StringField({ initial: "0 Đ" }),
        application: new fields.SchemaField({
          type: new fields.StringField({ initial: "" }),
          formula: new fields.StringField({ initial: "" }),
          resource: new fields.StringField({ initial: "" }),
          condition: new fields.StringField({ initial: "" })
        })
      }), { initial: [] }),
      subCategory: new fields.StringField({ initial: "" }),
      
      // Bônus Mecânicos
      bonuses: new fields.SchemaField({
        hp: new fields.NumberField({ initial: 0, integer: true }),
        pe: new fields.NumberField({ initial: 0, integer: true }),
        pa: new fields.NumberField({ initial: 0, integer: true }),
        damage: new fields.NumberField({ initial: 0, integer: true }),
        attributes: new fields.SchemaField({
          pot: new fields.NumberField({ initial: 0, integer: true }),
          hab: new fields.NumberField({ initial: 0, integer: true }),
          cog: new fields.NumberField({ initial: 0, integer: true }),
          per: new fields.NumberField({ initial: 0, integer: true }),
          pre: new fields.NumberField({ initial: 0, integer: true }),
          ani: new fields.NumberField({ initial: 0, integer: true })
        }),
        dr: new fields.NumberField({ initial: 0, integer: true }),
        resistances: new fields.SchemaField({
          physical: new fields.NumberField({ initial: 0, integer: true }),
          elemental: new fields.NumberField({ initial: 0, integer: true }),
          mental: new fields.NumberField({ initial: 0, integer: true })
        })
      }),

      // Definição de Testes
      check: new fields.SchemaField({
        attribute: new fields.StringField({ initial: "" }),
        difficulty: new fields.StringField({ initial: "" }) // Pode ser um número ou fórmula baseada em ND
      })
    };
  }
}

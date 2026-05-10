import AnimusItemData from "./base-item.mjs";

export default class AnimusArmorData extends AnimusItemData {
  static defineSchema() {
    const fields = foundry.data.fields;
    const baseSchema = super.defineSchema();
    
    return {
      ...baseSchema,
      base: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
      multPOT: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
      multHAB: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
      penalty: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
      equipped: new fields.BooleanField({ initial: false }),
      runeSlots: new fields.SchemaField({
        basic: new fields.NumberField({ initial: 2, integer: true, min: 0 }),
        reinforced: new fields.NumberField({ initial: 1, integer: true, min: 0 })
      })
    };
  }

  /**
   * Calcula o valor total de proteção: base + (multPOT × POT) + (multHAB × HAB).
   * Funciona tanto para armaduras quanto para escudos.
   */
  get totalProtection() {
    // Quando embutido num ator, this.parent é o próprio ator.
    const actor = this.parent instanceof Actor ? this.parent : this.parent?.parent;
    if (!actor) return this.base;

    const attrs = actor.system.attributes;
    const pot = attrs.pot?.value ?? 0;
    const hab = attrs.hab?.value ?? 0;

    return this.base + (this.multPOT * pot) + (this.multHAB * hab);
  }
}

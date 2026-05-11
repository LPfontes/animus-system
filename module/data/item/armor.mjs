import ANIMUS from "../../config.mjs";
import AnimusItemData from "./base-item.mjs";

export default class AnimusArmorData extends AnimusItemData {
  static defineSchema() {
    const fields = foundry.data.fields;
    const baseSchema = super.defineSchema();
    
    return {
      ...baseSchema,
      type: new fields.StringField({ initial: "none", choices: Object.keys(ANIMUS.armorTypes) }),
      base: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
      multPOT: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
      multHAB: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
      penalty: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
      paPenalty: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
      actionPenalty: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
      runeSlots: new fields.SchemaField({
        basic: new fields.NumberField({ initial: 2, integer: true, min: 0 }),
        reinforced: new fields.NumberField({ initial: 1, integer: true, min: 0 })
      })
    };
  }

  /**
   * Calcula o valor total de proteção: base + (multPOT × POT) + (multHAB × HAB).
   */
  get totalProtection() {
    const actor = this.parent instanceof Actor ? this.parent : this.parent?.parent;
    if (!actor) return this.base;

    const attrs = actor.system.attributes;
    const pot = attrs.pot?.total ?? 0;
    const hab = attrs.hab?.total ?? 0;

    return this.base + (this.multPOT * pot) + (this.multHAB * hab);
  }
}

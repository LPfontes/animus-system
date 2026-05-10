import AnimusItemData from "./base-item.mjs";

export default class AnimusElementData extends AnimusItemData {
  static defineSchema() {
    const fields = foundry.data.fields;
    const baseSchema = super.defineSchema();

    return {
      ...baseSchema,
      strength: new fields.StringField({ initial: "" }),
      weakness: new fields.StringField({ initial: "" }),
      bonus: new fields.SchemaField({
        value: new fields.NumberField({ initial: 1, integer: true }),
        attributes: new fields.ArrayField(new fields.StringField()),
        selectedAttribute: new fields.StringField({ initial: "" })
      }),
      range: new fields.StringField({ initial: "" }),
      rhythm: new fields.StringField({ initial: "" }),
      secondaryEffects: new fields.SchemaField({
        outOfCombat: new fields.StringField({ initial: "" }),
        inCombat: new fields.StringField({ initial: "" })
      }),
      philosophy: new fields.StringField({ initial: "" }),
      innateCharacteristic: new fields.StringField({ initial: "" }),
      damageTable: new fields.ObjectField(),
      healTable: new fields.ObjectField()
    };
  }

  /**
   * Retorna a tabela de dano com os valores de dano total já calculados,
   * usando o valor de ANI do ator que possui este elemento.
   * Formato: { '1': { pe, ac1, ac2, ac3, ac4 }, '2': {...}, '3': {...} }
   * Cada acX: { base, mult, total }
   */
  get resolvedDamageTable() {
    const table = this.damageTable;
    if (!table || typeof table !== "object") return null;

    // Obtém ANI do ator dono do item
    const actor = this.parent instanceof Actor ? this.parent : this.parent?.parent;
    const ani = actor?.system?.attributes?.ani?.value ?? 0;

    const resolved = {};
    for (const [tier, tierData] of Object.entries(table)) {
      resolved[tier] = { pe: tierData.pe };
      for (const ac of ["ac1", "ac2", "ac3", "ac4"]) {
        const entry = tierData[ac];
        if (!entry) continue;
        const base = entry.base ?? 0;
        const mult = entry.mult ?? 0;
        resolved[tier][ac] = {
          base,
          mult,
          total: base + (mult * ani),
          label: mult > 0 ? `${base} + ${mult}×ANI` : `${base}`
        };
      }
    }
    return resolved;
  }

  /**
   * Retorna a tabela de cura com valores resolvidos por ANI.
   * Estrutura: { '1': { pe, ac1, ac2, ac3, ac4 }, ... }
   * ac1=1 acerto, ac2=2 acertos, ac3=3 acertos, ac4=4 acertos (crítico)
   */
  get resolvedHealTable() {
    const table = this.healTable;
    if (!table || typeof table !== "object" || !Object.keys(table).length) return null;

    const actor = this.parent instanceof Actor ? this.parent : this.parent?.parent;
    const ani = actor?.system?.attributes?.ani?.value ?? 0;

    const resolved = {};
    for (const [tier, tierData] of Object.entries(table)) {
      resolved[tier] = { pe: tierData.pe };
      for (const ac of ["ac1", "ac2", "ac3", "ac4"]) {
        const entry = tierData[ac];
        if (!entry) continue;
        const base = entry.base ?? 0;
        const mult = entry.mult ?? 0;
        resolved[tier][ac] = {
          base,
          mult,
          total: base + (mult * ani),
          label: mult > 0 ? `${base} + ${mult}×ANI` : `${base}`
        };
      }
    }
    return resolved;
  }
}

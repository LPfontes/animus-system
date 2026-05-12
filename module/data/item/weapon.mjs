import ANIMUS from "../../config.mjs";
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
      attribute: new fields.StringField({ initial: "pot", choices: Object.keys(ANIMUS.attributes) }),
      damageType: new fields.StringField({ initial: "cortante", choices: Object.keys(ANIMUS.damageTypes) }),
      category: new fields.StringField({ initial: "branca", choices: Object.keys(ANIMUS.weaponCategories) }),
      type: new fields.StringField({ initial: "cortante_leve", choices: Object.keys(ANIMUS.weaponTypes) }),
      cost: new fields.NumberField({ initial: 1, integer: true, min: 0 }),
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

    const properties = this.propertyItems;
    
    // 1. Determinar o Atributo Base (checar overrides de propriedades)
    let attrKey = typeof this.attribute === "number" 
      ? (ANIMUS.attributesByIndex[this.attribute] || "pot")
      : this.attribute;
    
    for (const prop of properties) {
      if (!prop?.system?.bonus) continue;
      const override = prop.system.bonus.attributeOverride;
      if (override) {
        attrKey = override;
        break; // Prioriza o primeiro override encontrado
      }
    }

    const attrValue = actor.system.attributes[attrKey]?.value || 0;
    
    // 2. Coletar Bônus de Propriedades
    const attrMultBonuses = {}; 
    let flatMultBonus = 0;
    let flatDamageBonus = 0;

    for (const prop of properties) {
      const b = prop?.system?.bonus;
      if (!b) continue;

      flatMultBonus += (b.mult || 0);
      flatDamageBonus += (b.damage || 0);

      // Bônus específicos de atributos (ex: +1xPER no mult)
      if (b.attrMult) {
        for (const [a, val] of Object.entries(b.attrMult)) {
          if (val) {
            attrMultBonuses[a] = (attrMultBonuses[a] || 0) + val;
          }
        }
      }
    }

    const table = {};
    for (let i = 1; i <= 4; i++) {
      const ac = this.damage[`ac${i}`];
      
      // Cálculo: [Base + DanoFixo] + [(Mult + MultFixo) * AttrBase] + [Somatório(BônusAttr * Attr)]
      let damageValue = (parseInt(ac.base) || 0) + flatDamageBonus;
      
      // Contribuição do Atributo Base (incluindo bônus fixo no multiplicador)
      damageValue += (parseInt(ac.mult) || 0 + flatMultBonus) * attrValue;
      
      // Contribuições de outros Atributos (ex: +1xPER de Estratégica)
      for (const [a, factor] of Object.entries(attrMultBonuses)) {
        const val = actor.system.attributes[a]?.total || 0;
        damageValue += factor * val;
      }

      table[`ac${i}`] = damageValue;
    }

    return table;
  }

  /**
   * Verifica se a arma possui a propriedade Duas Mãos.
   */
  get hasTwoHands() {
    return this.properties.includes("v1hk2hjcjs000000");
  }

  /**
   * Retorna os itens de propriedade vinculados a esta arma.
   */
  get propertyItems() {
    const pack = game.packs.get("animus.itens");
    return this.properties.map(id => {
      const worldItem = game.items.get(id);
      if (worldItem) return worldItem;
      
      const indexEntry = pack?.index.get(id);
      if (indexEntry) return indexEntry;

      return null;
    }).filter(p => p);
  }

  static migrateData(source) {
    if (typeof source.attribute === "number") {
      source.attribute = ANIMUS.attributesByIndex[source.attribute] || "pot";
    }
    if (typeof source.damageType === "number") {
      source.damageType = ANIMUS.damageTypesByIndex[source.damageType] || "cortante";
    }
    if (typeof source.category === "number") {
      source.category = "branca"; 
    }
    if (typeof source.type === "number") {
      source.type = ANIMUS.weaponTypesByIndex[source.type] || "cortante_leve";
    }
    if (source.check) {
      if (typeof source.check.attribute === "number") {
        source.check.attribute = ANIMUS.attributesByIndex[source.check.attribute] || "pot";
      }
      if (typeof source.check.skill === "number") {
        source.check.skill = ANIMUS.skillsByIndex[source.check.skill] || "";
      }
    }

    // Migração de tabela de dano (String -> Objeto)
    if (source.damage) {
      for (let i = 1; i <= 4; i++) {
        const key = `ac${i}`;
        const val = source.damage[key];
        
        if (typeof val === "string") {
          // Regex para pegar base e multiplicador (ex: "3 + 1xPOT" ou "2")
          const match = val.match(/(\d+)(?:\s*\+\s*(\d+)x[A-Z]+)?/);
          if (match) {
            source.damage[key] = {
              base: parseInt(match[1]) || 0,
              mult: parseInt(match[2]) || 0
            };
          }
        }
      }
    }

    return super.migrateData(source);
  }
}

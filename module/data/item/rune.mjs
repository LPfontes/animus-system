import AnimusItemData from "./base-item.mjs";

export default class AnimusRuneData extends AnimusItemData {
  static defineSchema() {
    const fields = foundry.data.fields;
    const baseSchema = super.defineSchema();
    
    return {
      ...baseSchema,
      tier: new fields.StringField({ initial: "basic", choices: ["basic", "reinforced"] }),
      element: new fields.StringField({ initial: "trovao" }),
      category: new fields.StringField({ initial: "armor", choices: ["armor", "shield", "weapon"] })
    };
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    this.price = this.tier === "reinforced" ? "1200" : "600";
  }
}

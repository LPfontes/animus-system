import AnimusItemData from "./base-item.mjs";

export default class AnimusCheckData extends AnimusItemData {
  static defineSchema() {
    // Herda tudo de base-item.mjs (check, application, effect, description)
    return super.defineSchema();
  }
}

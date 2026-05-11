import AnimusCharacterData from "./actor/character.mjs";
import AnimusWeaponData from "./item/weapon.mjs";
import AnimusArmorData from "./item/armor.mjs";
import AnimusTalentData from "./item/talent.mjs";
import AnimusPropertyData from "./item/property.mjs";
import AnimusActionData from "./item/action.mjs";
import AnimusCheckData from "./item/check.mjs";
import AnimusItemData from "./item/base-item.mjs";

import AnimusAscendancyData from "./item/ascendancy.mjs";
import AnimusElementData from "./item/element.mjs";
import AnimusConditionData from "./item/condition.mjs";
import AnimusRuneData from "./item/rune.mjs";

export const actor = {
  character: AnimusCharacterData
};

export const item = {
  weapon: AnimusWeaponData,
  armor: AnimusArmorData,
  shield: AnimusArmorData,
  talent: AnimusTalentData,
  item: AnimusItemData,
  secondary: AnimusItemData,
  property: AnimusPropertyData,
  action: AnimusActionData,
  check: AnimusCheckData,
  ascendancy: AnimusAscendancyData,
  element: AnimusElementData,
  condition: AnimusConditionData,
  rune: AnimusRuneData
};

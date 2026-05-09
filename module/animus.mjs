import ANIMUS from "./config.mjs";
import { actor, item } from "./data/_module.mjs";
import { AnimusActor } from "./documents/actor.mjs";
import { AnimusItem } from "./documents/item.mjs";
import { AnimusActorSheet } from "./applications/actor/actor-sheet.mjs";
import { AnimusItemSheet } from "./applications/item/item-sheet.mjs";

Hooks.once("init", function() {
  console.log("Animus | Inicializando Sistema Animus RPG (V12+)");

  // Record Configuration Values
  CONFIG.ANIMUS = ANIMUS;
  CONFIG.Actor.documentClass = AnimusActor;
  CONFIG.Item.documentClass = AnimusItem;

  // Register Data Models
  CONFIG.Actor.dataModels = actor;
  CONFIG.Item.dataModels = item;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("animus", AnimusActorSheet, { 
    types: ["character"],
    makeDefault: true,
    label: "ANIMUS.SheetCharacter"
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("animus", AnimusItemSheet, { 
    makeDefault: true,
    label: "ANIMUS.SheetItem"
  });

  // Preload Handlebars templates
  preloadHandlebarsTemplates();

  // Register Handlebars Helpers
  Handlebars.registerHelper('list', function() {
    return Array.prototype.slice.call(arguments, 0, -1);
  });

  Handlebars.registerHelper('upper', function(str) {
    return str.toUpperCase();
  });

  Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
  });
});

async function preloadHandlebarsTemplates() {
  const paths = [
    // Actor partials
    "systems/animus/templates/actor/tabs/actor-attributes.hbs",
    "systems/animus/templates/actor/tabs/actor-skills.hbs",
    "systems/animus/templates/actor/tabs/actor-combat.hbs",
    "systems/animus/templates/actor/tabs/actor-inventory.hbs",
    "systems/animus/templates/actor/tabs/actor-biography.hbs",

    // Main sheets
    "systems/animus/templates/actor/actor-sheet.hbs",
    "systems/animus/templates/item/item-sheet.hbs"
  ];
  return loadTemplates(paths);
}

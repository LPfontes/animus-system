import ANIMUS from "./config.mjs";
import { actor, item } from "./data/_module.mjs";
import { AnimusActor } from "./documents/actor.mjs";
import { AnimusItem } from "./documents/item.mjs";
import { AnimusActorSheet } from "./applications/actor/actor-sheet.mjs";
import { AnimusNPCSheet } from "./applications/actor/npc-sheet.mjs";
import { AnimusItemSheet } from "./applications/item/item-sheet.mjs";
import { AnimusMonsterCreator } from "./applications/actor/monster-creator.mjs";

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

  Actors.registerSheet("animus", AnimusNPCSheet, { 
    types: ["npc"],
    makeDefault: true,
    label: "ANIMUS.SheetNPC"
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
    return str ? String(str).toUpperCase() : "";
  });

  Handlebars.registerHelper('lower', function(str) {
    return str ? String(str).toLowerCase() : "";
  });

  Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
  });

  Handlebars.registerHelper('gt', function(a, b) {
    return a > b;
  });

  Handlebars.registerHelper('add', function(a, b) {
    return a + b;
  });

  Handlebars.registerHelper('sub', function(a, b) {
    return a - b;
  });

  Handlebars.registerHelper('and', function() {
    const args = Array.prototype.slice.call(arguments, 0, -1);
    return args.every(Boolean);
  });

  Handlebars.registerHelper('or', function() {
    const args = Array.prototype.slice.call(arguments, 0, -1);
    return args.some(Boolean);
  });

  Handlebars.registerHelper('not', function(v) {
    return !v;
  });

  Handlebars.registerHelper('isNumber', function(v) {
    return !isNaN(parseFloat(v)) && isFinite(v);
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
    "systems/animus/templates/actor/npc-sheet.hbs",
    "systems/animus/templates/item/item-sheet.hbs",
    "systems/animus/templates/apps/compendium-browser.hbs",
    "systems/animus/templates/apps/talent-manager.hbs"
  ];
  return loadTemplates(paths);
}

/* -------------------------------------------- */
/*  Combat Hooks                                */
/* -------------------------------------------- */

/**
 * Reset PA at start of turn and apply debt from reactions
 */
Hooks.on("combatTurn", async (combat, updateData, updateOptions) => {
  const combatant = combat.combatant;
  const actor = combatant?.actor;
  if (!actor || actor.type !== "character") return;

  const pa = actor.system.status.pa;
  
  // Se houver dívida, subtrair do máximo. Caso contrário, resetar para o máximo.
  const debt = pa.debt || 0;
  const newPA = Math.max(0, pa.max - debt);
  
  await actor.update({
    "system.status.pa.value": newPA,
    "system.status.pa.debt": 0
  });

  // Resetar rastreio de ações repetidas no turno
  await actor.setFlag("animus", "turnActions", []);

  if (debt > 0) {
    ui.notifications.info(`${actor.name} iniciou o turno com ${newPA} PA (${debt} descontado por reações).`);
  }
});

/* -------------------------------------------- */
/*  Chat UI Hooks                               */
/* -------------------------------------------- */

Hooks.on("renderChatMessageHTML", (message, html, data) => {
  // Adicionar classe de estilo do sistema
  html.classList.add("animus");

  const btn = html.querySelector('.apply-damage-btn');
  if (btn) {
    btn.addEventListener('click', async (ev) => {
      ev.preventDefault();
      const damage = parseInt(btn.dataset.damage);
      const targeted = Array.from(game.user.targets);
      const selected = canvas.tokens.controlled;
      
      // Priorizar alvos marcados (retículo), senão usar tokens selecionados
      const finalTargets = targeted.length > 0 ? targeted : selected;

      if (finalTargets.length === 0) {
        return ui.notifications.warn("Selecione ou marque um alvo (T) para aplicar o dano.");
      }

      for (let token of finalTargets) {
        const actor = token.actor;
        if (!actor) continue;

        const hp = actor.system.status.hp;
        const prot = actor.system.status.prot;

        let remaining = damage;
        let currentProt = prot.value;
        let currentHP = hp.value;

        // 1. Descontar da Proteção primeiro
        let newProt = Math.max(0, currentProt - remaining);
        let absorbed = currentProt - newProt;
        remaining -= absorbed;

        // 2. Descontar da Vida o que sobrar
        let newHP = Math.max(0, currentHP - remaining);
        
        await actor.update({
          "system.status.prot.value": newProt,
          "system.status.hp.value": newHP
        });

        ui.notifications.info(`Aplicado ${damage} de dano a ${actor.name}. (Prot: -${absorbed}, PV: -${remaining})`);
      }
    });
  }
});

/* -------------------------------------------- */
/*  Sidebar Buttons                             */
/* -------------------------------------------- */

Hooks.on("renderActorDirectory", (app, html, data) => {
  if (!game.user.isGM) return;
  
  const footer = html[0].querySelector(".directory-footer") || html[0];
  const button = document.createElement("button");
  button.type = "button";
  button.classList.add("monster-creator-btn");
  button.innerHTML = '<i class="fas fa-dna"></i> Criador de Monstros';
  
  button.addEventListener("click", () => {
    new AnimusMonsterCreator().render(true);
  });
  
  // Inserir antes dos botões padrão se for no footer, ou no final se não achar
  const createEntity = footer.querySelector(".create-document") || footer.querySelector(".create-folder");
  if (createEntity) {
    createEntity.parentElement.insertBefore(button, createEntity);
  } else {
    footer.appendChild(button);
  }
});

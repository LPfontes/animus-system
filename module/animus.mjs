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
  // Garantir que temos o elemento raiz
  const root = html instanceof HTMLElement ? html : html[0];
  if (!root) return;

  // Adicionar classe de estilo do sistema
  root.classList.add("animus");

  // --- Botão: Aplicar Dano / Cura (gerado pelo AnimusRoll.rollTest) ---
  const btn = root.querySelector('.apply-damage-btn');
  if (btn) {
    btn.addEventListener('click', async (ev) => {
      ev.preventDefault();
      const amount = parseInt(btn.dataset.damage);
      if (btn.dataset.action === "applyHeal") {
        _applyHealToTokens(amount);
      } else {
        _applyDamageToTokens(amount);
      }
    });
  }

  // --- Botão: Aplicar Dano (Fórmula Direta) ---
  const dmgBtn = root.querySelector('.apply-damage');
  if (dmgBtn) {
    dmgBtn.addEventListener('click', async (ev) => {
      ev.preventDefault();
      const formula = dmgBtn.dataset.formula;
      const selected = canvas.tokens.controlled;
      if (selected.length === 0) return ui.notifications.warn("Selecione um token para aplicar o dano.");

      const roll = await new Roll(formula || "0").evaluate();
      await roll.toMessage({ 
        speaker: ChatMessage.getSpeaker(),
        flavor: `Rolar Efeito: ${formula}` 
      });
      
      _applyDamageToTokens(roll.total);
    });
  }

  // --- Botão: Teste de Resistência (Novo) ---
  const resBtn = root.querySelector('.roll-resistance');
  if (resBtn) {
    resBtn.addEventListener('click', async (ev) => {
      ev.preventDefault();
      const attr = resBtn.dataset.attr;
      const dc = parseInt(resBtn.dataset.dc);
      
      const selected = canvas.tokens.controlled;
      if (selected.length === 0) return ui.notifications.warn("Selecione um token para realizar o teste.");

      for (let token of selected) {
        const actor = token.actor;
        if (!actor) continue;
        const attrVal = actor.system.attributes[attr]?.value || 0;
        
        // Importar AnimusRoll dinamicamente se necessário, ou usar o global
        const { AnimusRoll } = await import("./dice.mjs");
        await AnimusRoll.rollTest({
          poolSize: 2, // Padrão para testes reativos
          attributeValue: attrVal,
          label: `Resistência: ${attr.toUpperCase()}`,
          speaker: actor,
          difficulty: dc
        });
      }
    });
  }

  // --- Botão: Aplicar Efeito Dinâmico (Novo) ---
  const effBtn = root.querySelector('.apply-effect');
  if (effBtn) {
    effBtn.addEventListener('click', async (ev) => {
      ev.preventDefault();
      const { type, formula, condition } = effBtn.dataset;
      
      const selected = canvas.tokens.controlled;
      if (selected.length === 0) return ui.notifications.warn("Selecione um token para aplicar o efeito.");

      if (type === "damage" || type === "heal") {
        const roll = await new Roll(formula || "0").evaluate();
        await roll.toMessage({ flavor: `Aplicando ${type === 'damage' ? 'Dano' : 'Cura'}` });
        
        if (type === "damage") _applyDamageToTokens(roll.total);
        else _applyHealToTokens(roll.total);
      } else if (condition) {
        for (let token of selected) {
          // Mapeamento de nomes em PT-BR para IDs nativos do Foundry
          const CONDITION_MAP = {
            "derrubar": "prone",
            "derrubado": "prone",
            "caido": "prone",
            "cego": "blind",
            "cegueira": "blind",
            "atordoado": "stun",
            "atordoar": "stun",
            "paralisado": "paralysis",
            "paralisia": "paralysis",
            "agarrado": "grappled",
            "apavorado": "fear",
            "medo": "fear",
            "invisivel": "invisible",
            "morto": "dead",
            "inconsciente": "unconscious",
            "envenenado": "poison",
            "queimando": "burning",
            "ignicao": "burning",
            "em ignicao": "burning",
            "sangrando": "bleeding",
            "sangramento": "bleeding",
            "imobilizado": "restrained",
            "desprevenido": "unprepared",
            "exausto": "exhaustion",
            "saturado": "saturated",
            "perturbado": "mental"
          };

          const cleanName = condition.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const effectId = CONDITION_MAP[cleanName] || cleanName;
          
          try {
            const hasEffect = token.actor.effects.some(e => e.getFlag("core", "statusId") === effectId);
            if (!hasEffect) {
              await token.actor.toggleStatusEffect(effectId, { active: true });
              ui.notifications.info(`Efeito "${condition}" aplicado a ${token.name}.`);
            } else {
              ui.notifications.warn(`${token.name} já possui o efeito "${condition}".`);
            }
          } catch (err) {
            console.error(`Animus | Falha ao aplicar efeito: ${effectId}`, err);
            ui.notifications.warn(`Não foi possível aplicar "${condition}" automaticamente. Aplique manualmente.`);
          }
        }
      }
    });
  }
});

/**
 * Helper para aplicar dano aos tokens selecionados ou alvos
 */
async function _applyDamageToTokens(damage) {
  const targeted = Array.from(game.user.targets);
  const selected = canvas.tokens.controlled;
  const finalTargets = targeted.length > 0 ? targeted : selected;

  if (finalTargets.length === 0) return ui.notifications.warn("Selecione ou marque um alvo (T).");

  for (let token of finalTargets) {
    const actor = token.actor;
    if (!actor) continue;

    const hp = actor.system.status.hp;
    const prot = actor.system.status.prot;

    let remaining = damage;
    let currentProt = prot.value;
    let currentHP = hp.value;

    let newProt = Math.max(0, currentProt - remaining);
    let absorbed = currentProt - newProt;
    remaining -= absorbed;

    let newHP = Math.max(0, currentHP - remaining);
    
    await actor.update({
      "system.status.prot.value": newProt,
      "system.status.hp.value": newHP
    });

    ui.notifications.info(`Dano: ${actor.name} perdeu ${damage} (Prot: -${absorbed}, PV: -${remaining})`);
  }
}

/**
 * Helper para aplicar cura aos tokens selecionados
 */
async function _applyHealToTokens(heal) {
  const selected = canvas.tokens.controlled;
  if (selected.length === 0) return ui.notifications.warn("Selecione um token para curar.");

  for (let token of selected) {
    const actor = token.actor;
    if (!actor) continue;

    const hp = actor.system.status.hp;
    const newHP = Math.min(hp.max, hp.value + heal);
    
    await actor.update({ "system.status.hp.value": newHP });
    ui.notifications.info(`${actor.name} recuperou ${heal} PV.`);
  }
}

/* -------------------------------------------- */
/*  Sidebar Buttons                             */
/* -------------------------------------------- */

Hooks.on("renderActorDirectory", (app, html, data) => {
  if (!game.user.isGM) return;
  
  // Garantir que temos o elemento raiz (lidar com jQuery ou HTMLElement)
  const root = html instanceof HTMLElement ? html : html[0];
  if (!root) return;

  const footer = root.querySelector(".directory-footer") || root;
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

Hooks.once("ready", async function() {
  const pack = game.packs.get("animus.itens");
  if (pack) {
    await pack.getIndex({
      fields: [
        "system.bonus",
        "system.price",
        "system.subCategory",
        "system.type",
        "system.description"
      ]
    });
    console.log("Animus | Índice do Compêndio atualizado com campos do sistema.");
  }
});

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;
import { AnimusRoll } from "../../dice.mjs";
import { AnimusCompendiumBrowser } from "../compendium-browser.mjs";
import { AnimusTalentManager } from "../talent-manager.mjs";
import { AnimusBonusSelector } from "../bonus-selector.mjs";
import { AnimusAdvancement } from "./advancement.mjs";
import { AnimusWeaponCreator } from "../weapon-creator.mjs";
import { AnimusRollDialog } from "../roll-dialog.mjs";

export class AnimusActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  constructor(options = {}) {
    super(options);
    this.editMode = false;
    this.filters = {
      talents: "all"
    };
  }

  get actor() {
    return this.document;
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["animus", "sheet", "actor"],
    position: {
      width: 1000,
      height: 950
    },
    actions: {
      updateAbility: AnimusActorSheet.prototype._onUpdateAbility,
      updatePA: AnimusActorSheet.prototype._onUpdatePA,
      updatePADebt: AnimusActorSheet.prototype._onUpdatePADebt,
      shortRest: AnimusActorSheet.prototype._onShortRest,
      longRest: AnimusActorSheet.prototype._onLongRest,
      rollSkill: AnimusActorSheet.prototype._onRollSkill,
      editImage: AnimusActorSheet.prototype._onEditImage,
      openBrowser: AnimusActorSheet.prototype._onOpenBrowser,
      deleteItem: AnimusActorSheet.prototype._onDeleteItem,
      editItem: AnimusActorSheet.prototype._onEditItem,
      openBonusSelector: AnimusActorSheet.prototype._onOpenBonusSelector,
      openTalentManager: AnimusActorSheet.prototype._onOpenTalentManager,
      toggleEditMode: AnimusActorSheet.prototype._onToggleEditMode,
      filterTalents: AnimusActorSheet.prototype._onFilterTalents,
      openAdvancement: AnimusActorSheet.prototype._onOpenAdvancement,
      openWeaponCreator: AnimusActorSheet.prototype._onOpenWeaponCreator,
      openWeaponBrowser: AnimusActorSheet.prototype._onOpenWeaponBrowser,
      rollWeapon: AnimusActorSheet.prototype._onRollWeapon,
      rollAttribute: AnimusActorSheet.prototype._onRollAttribute,
      toggleEquip: AnimusActorSheet.prototype._onToggleEquip,
      useItem: AnimusActorSheet.prototype._onUseItem,
      rollBasicAction: AnimusActorSheet.prototype._onRollBasicAction
    },
    form: {
      handler: AnimusActorSheet.#onSubmit,
      submitOnChange: true,
      closeOnSubmit: false
    },
    tabs: [
      { navSelector: ".side-tabs", contentSelector: ".sheet-body", initial: "attributes", label: "ANIMUS.Attributes" }
    ]
  };

  /** @override */
  tabGroups = {
    primary: "attributes"
  };

  /** @override */
  static PARTS = {
    navigation: { template: "systems/animus/templates/actor/actor-navigation.hbs" },
    body: { template: "systems/animus/templates/actor/actor-sheet.hbs" }
  };

  /** @override */
  async _prepareContext(options) {
    const system = this.document.system;
    const context = {
      actor: this.document,
      system: system,
      config: CONFIG.ANIMUS,
      editMode: this.editMode,
      owner: this.document.isOwner,
      editable: this.isEditable,
      tabs: this._getTabs(options),
      hpPercent: Math.min(100, Math.max(0, (system.status.hp.value / (system.status.hp.max || 1)) * 100)),
      pePercent: Math.min(100, Math.max(0, (system.status.pe.value / (system.status.pe.max || 1)) * 100)),
      paPips: Array.from({length: system.status.pa.max || 0}, (_, i) => ({
        filled: i < system.status.pa.value
      }))
    };

    // Categorizar itens
    const items = this.document.items;
    const weapons = [];
    const talents = [];
    const properties = [];
    const actions = [];
    const checks = [];

    let activeAscendancy = null;
    let activeElement = null;

    const gear = {
      armor: [],
      shield: [],
      secondary: [],
      other: []
    };

    for (let i of items) {
      const itemData = i.toObject();
      itemData.id = i.id;
      itemData.img = i.img;
      itemData.isEquipped = i.system.equipped;
      
      // Garantir que dados do sistema sejam mesclados corretamente
      itemData.system = {
        ...itemData.system,
        cost: i.system.cost ?? 1,
        range: i.system.range
      };

      if (i.type === "weapon") {
        itemData.calculatedDamage = i.system.damageTable;
        weapons.push(itemData);
      }
      else if (i.type === "talent") {
        const category = i.system.subCategory || "Geral";
        if (this.filters.talents === "all" || category === this.filters.talents) {
          talents.push(itemData);
        }
      }
      else if (i.type === "property") properties.push(itemData);
      else if (i.type === "action") actions.push(itemData);
      else if (i.type === "check") checks.push(itemData);
      else if (i.type === "ascendancy") activeAscendancy = itemData;
      else if (i.type === "element") {
        activeElement = itemData;
        activeElement.resolvedDamageTable = i.system.resolvedDamageTable;
        activeElement.resolvedHealTable = i.system.resolvedHealTable;
      }
      else if (i.type === "armor") gear.armor.push(itemData);
      else if (i.type === "shield") gear.shield.push(itemData);
      else if (i.type === "secondary") gear.secondary.push(itemData);
      else gear.other.push(itemData);
    }

    context.weapons = weapons;
    context.talents = talents;
    context.properties = properties;
    context.actions = actions;
    context.checks = checks;
    context.gear = gear;
    context.ascendancy = activeAscendancy;
    context.element = activeElement;

    // Group skills by attribute (Unified Style)
    const categories = [
      { title: 'FÍSICOS', attrs: ['pot', 'hab'] },
      { title: 'MENTAIS', attrs: ['cog', 'per'] },
      { title: 'PESSOAIS', attrs: ['pre', 'ani'] }
    ];

    context.unifiedAbilities = categories.map(cat => ({
      title: cat.title,
      attributes: cat.attrs.map(attrKey => ({
        key: attrKey,
        label: CONFIG.ANIMUS.attributes[attrKey].i18n,
        value: system.attributes[attrKey].value,
        skills: Object.entries(CONFIG.ANIMUS.skills)
          .filter(([_, s]) => s.attr === attrKey)
          .map(([sKey, s]) => ({
            key: sKey,
            label: s.label,
            value: system.skills[sKey].value,
            active: system.skills[sKey].value > 0
          }))
      }))
    }));

    // Evolução e Pontos (Usa os dados calculados no AnimusCharacterData)
    context.pointsRemaining = this.actor.system.pointsRemaining || 0;
    context.attrPoints = this.actor.system.attrPoints || { total: 0, available: 0 };
    context.skillPoints = this.actor.system.skillPoints || { total: 0, available: 0 };

    // Níveis Ímpares para Bônus de Atributo
    const level = system.details.level;
    context.oddLevels = [3, 5, 7, 9].filter(l => l <= level).map(l => ({
      level: l,
      selected: system.details.advancement.attributeBonuses[l] || ""
    }));

    // Verificar se há evolução pendente
    const hasUnspentPoints = context.pointsRemaining > 0 || context.attrPoints.available > 0 || context.skillPoints.available > 0;
    context.pendingAdvancement = (level > 1) && hasUnspentPoints;

    // Contadores para Criação
    context.skillCount = context.skillPoints.total - context.skillPoints.available;
    context.skillLimit = context.skillPoints.total;
    
    // Pontos de Atributo
    context.attrLimit = context.attrPoints.total;
    context.attrCount = context.attrPoints.total - context.attrPoints.available;

    // Dados para Filtros
    context.filters = this.filters;
    context.talentCategories = Object.entries(CONFIG.ANIMUS.talentCategories || {}).map(([id, data]) => ({
      id,
      ...data
    }));

    return context;
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);

    const html = this.element;

    // Garantir que as barras estejam corretas após cada renderização
    this._updateBars();

    // Listener para animação das barras e sincronização (com delay)
    let syncTimeout;
    html.addEventListener('input', (ev) => {
      if (!ev.target.classList.contains('stat-input-overlay') && !ev.target.classList.contains('stat-sync-input')) return;
      
      const input = ev.target;
      const val = Number(input.value) || 0;
      const path = input.dataset.path || input.name;
      
      // 1. Animação imediata das barras (Visual)
      const maxPath = path.replace('.value', '.max');
      const max = foundry.utils.getProperty(this.actor, maxPath) || 1;
      const percent = Math.min(100, Math.max(0, (val / max) * 100));

      const type = path.includes('.hp.') ? 'hp' : 'pe';
      const bar = html.querySelector(`.bar-fill.${type}`);
      if (bar) bar.style.width = `${percent}%`;

      // 2. Sincronização com delay (Dados)
      if (input.classList.contains('stat-sync-input')) {
        clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
          this.actor.update({ [path]: val });
        }, 1000); // 1 segundo de delay para evitar spam no banco enquanto digita
      }
    });

    // Adiciona listener para troca de abas (suporte manual adicional)
    const nav = html.querySelector(".side-tabs");
    if (nav) {
      nav.querySelectorAll(".item").forEach(item => {
        item.addEventListener("click", event => {
          const tab = event.currentTarget.dataset.tab;
          if (tab) {
            this.tabGroups.primary = tab;
            this.render();
          }
        });
      });
    }
    
    // Drag and Drop visual feedback
    html.querySelectorAll('.drop-zone').forEach(zone => {
      zone.addEventListener('dragover', (ev) => {
        ev.preventDefault();
        zone.classList.add('dragover');
      });
      zone.addEventListener('dragleave', (ev) => {
        zone.classList.remove('dragover');
      });
      zone.addEventListener('drop', (ev) => {
        zone.classList.remove('dragover');
      });
    });

    // Slots de Ascendência e Elemento clicáveis
    html.querySelectorAll('.item-slot').forEach(slot => {
      slot.addEventListener('click', (ev) => {
        // Se clicar em um controle (delete, bonus-edit), não abre o browser
        if (ev.target.closest('.slot-control')) return;

        const zone = ev.target.closest('.drop-zone');
        if (zone) {
          const type = zone.dataset.type;
          this._onOpenBrowser(ev, { dataset: { type } });
        }
      });
    });
  }

  /**
   * Handle updating attributes or skills via dots/boxes
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  async _onUpdateAbility(event, target) {
    const { ability, value } = target.dataset;
    const system = this.actor.system;
    const newValue = parseInt(value);
    const currentValue = foundry.utils.getProperty(this.actor._source.system, `${ability}.value`) || 0;
    const isAttribute = ability.startsWith("attributes.");
    const isSkill = ability.startsWith("skills.");

    // Toggle logic
    let finalValue = currentValue === newValue ? newValue - 1 : newValue;

    // Enforcement of Rules (if not in edit mode)
    if (!this.editMode) {
      const level = this.actor.system.details.level || 1;

      if (isAttribute) {
        // 1. Limite de pontos totais
        const totalAttrPoints = this.actor.system.attrPoints.total;
        const otherSpent = Object.entries(this.actor._source.system.attributes)
          .filter(([key, _]) => `attributes.${key}` !== ability)
          .reduce((acc, [_, a]) => acc + Math.max(0, a.value || 0), 0);
        
        if (otherSpent + Math.max(0, finalValue) > totalAttrPoints) {
          ui.notifications.warn(`Limite de pontos de atributo atingido (${totalAttrPoints}).`);
          return;
        }

        // 2. Limite por nível
        const caps = CONFIG.ANIMUS.LEVEL_CAPS[level] || CONFIG.ANIMUS.LEVEL_CAPS[1];
        const maxAttr = caps.attrCap;
        if (finalValue > maxAttr) {
          ui.notifications.warn(`Um personagem de nível ${level} pode ter no máximo +${maxAttr} base em um atributo.`);
          finalValue = maxAttr;
        }

        // 3. Um único atributo em +3
        if (level >= 5 && finalValue === 3) {
          const otherSourceAttrs = Object.entries(this.actor._source.system.attributes)
            .filter(([key, _]) => `attributes.${key}` !== ability);
          const alreadyHasThree = otherSourceAttrs.some(([_, data]) => data.value >= 3);
          if (alreadyHasThree) {
            ui.notifications.warn("Apenas um único atributo pode atingir +3 (o teto definitivo).");
            return;
          }
        }
      }

      if (isSkill) {
        // Regra Nível 1: Apenas Amador (1 ponto)
        if (level === 1 && finalValue > 1) {
          ui.notifications.warn("No nível 1, perícias podem atingir no máximo o nível Amador (1 ponto).");
          finalValue = 1;
        }

        // Limite de pontos de perícia dinâmico
        const totalSkillPoints = system.skillPoints?.total || 4;
        const otherSpent = (system.skillPoints?.spent || 0) - currentValue;

        if (otherSpent + finalValue > totalSkillPoints) {
          ui.notifications.warn(`Limite de pontos de perícia atingido (${totalSkillPoints}).`);
          return;
        }

        // Mestre (3) requer Foco em Perícia
        if (finalValue === 3) {
          const skillKey = ability.split(".")[1];
          const skillName = game.i18n.localize(CONFIG.ANIMUS.skills[skillKey].label);
          const hasFocus = this.actor.items.some(i => {
            const n = i.name.toLowerCase();
            return i.type === "talent" && n.includes("foco em perícia") && n.includes(skillName.toLowerCase());
          });
          if (!hasFocus) {
            ui.notifications.warn(`Requer talento "Foco em Perícia (${skillName})" para o nível Mestre.`);
            return;
          }
        }
      }
    }

    await this.actor.update({
      [`system.${ability}.value`]: Math.max(0, finalValue)
    });
  }

  /**
   * Toggles the editing mode to bypass level rules
   */
  async _onToggleEditMode(event, target) {
    this.editMode = !this.editMode;
    ui.notifications.info(`Modo de Edição Livre: ${this.editMode ? "ATIVADO" : "DESATIVADO"}`);
    this.render();
  }

  /**
   * Handle updating PA value via pips
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  async _onUpdatePA(event, target) {
    const newValue = parseInt(target.dataset.value);
    const currentValue = this.actor.system.status.pa.value;
    const finalValue = currentValue === newValue ? newValue - 1 : newValue;
    await this.actor.update({ "system.status.pa.value": Math.max(0, finalValue) });
  }

  /**
   * Gerencia a dívida de PA para reações defensivas
   */
  async _onUpdatePADebt(event, target) {
    const delta = parseInt(target.dataset.delta);
    const currentDebt = this.actor.system.status.pa.debt || 0;
    const newDebt = Math.max(0, currentDebt + delta);
    await this.actor.update({ "system.status.pa.debt": newDebt });
  }

  async _onShortRest(event, target) {
    return this.actor.shortRest();
  }

  async _onLongRest(event, target) {
    const confirm = await Dialog.confirm({
      title: "Confirmar Descanso Longo",
      content: "<p>Deseja realizar um descanso longo? Isso recuperará PV, PE, PA e resetará os descansos curtos.</p>",
      yes: () => true,
      no: () => false,
      defaultYes: false
    });
    if (confirm) return this.actor.longRest();
  }

  /**
   * Handle rolling a skill
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  async _onRollSkill(event, target) {
    const skillKey = target.dataset.skill;
    const skillData = CONFIG.ANIMUS.skills[skillKey];
    const skill = this.actor.system.skills[skillKey];

    // Puxar o atributo pai diretamente da config
    const attrKey = skillData.attr;
    const attr = this.actor.system.attributes[attrKey];

    const label = game.i18n.localize(skillData.label);

    // Lógica Animus: Pool = 2 + nível de perícia
    const poolSize = 2 + (skill.value || 0);

    // Detectar Vantagem/Desvantagem por teclas (exemplo)
    let advantage = null;
    if (event.shiftKey) advantage = "advantage";
    if (event.altKey || event.ctrlKey) advantage = "disadvantage";

    await AnimusRoll.rollTest({
      poolSize: poolSize,
      attributeValue: attr.value || 0,
      label: `Teste de ${label}`,
      advantage: advantage,
      speaker: this.actor
    });
  }

  /**
   * Rola um atributo
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  async _onRollAttribute(event, target) {
    const attrKey = target.dataset.attribute;
    const attr = this.actor.system.attributes[attrKey];
    const label = CONFIG.ANIMUS.attributes[attrKey].i18n;

    // Detectar Vantagem/Desvantagem
    let advantage = null;
    if (event.shiftKey) advantage = "advantage";
    if (event.altKey || event.ctrlKey) advantage = "disadvantage";

    await AnimusRoll.rollTest({
      poolSize: 2,
      attributeValue: attr.value || 0,
      label: `Teste de ${game.i18n.localize(label)}`,
      advantage: advantage,
      speaker: this.actor
    });
  }

  /**
   * Rola um ataque com uma arma
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  async _onRollWeapon(event, target) {
    const itemId = target.dataset.itemId || target.closest("[data-item-id]")?.dataset.itemId;
    const weapon = this.actor.items.get(itemId);
    if (!weapon) return;

    // Verificar custo de PA + Repetição
    const baseCost = weapon.system.cost || 1;
    const repeatCost = this.actor.getActionRepeatCost("Atacar");
    const paCost = baseCost + repeatCost;

    if (this.actor.system.status.pa.value < paCost) {
      const msg = repeatCost > 0 
        ? `Você não possui PA suficiente para repetir a ação Atacar (Custo total: ${paCost} PA).`
        : `Você não possui PA suficiente para atacar com ${weapon.name} (Custo: ${paCost} PA).`;
      return ui.notifications.warn(msg);
    }

    // Se estiver segurando Shift ou Alt, fazemos a rolagem rápida sem abrir o modal
    if (event.shiftKey || event.altKey || event.ctrlKey) {
      return this._executeWeaponRoll(weapon, {
        advantage: event.shiftKey ? "advantage" : (event.altKey || event.ctrlKey ? "disadvantage" : null),
        bonus: 0
      });
    }

    // Caso contrário, usamos o novo diálogo modernizado (ApplicationV2)
    const result = await AnimusRollDialog.awaitRoll(weapon);
    if (!result) return;

    return this._executeWeaponRoll(weapon, {
      advantage: result.advantage === "none" ? null : result.advantage,
      bonus: parseInt(result.bonus) || 0
    });
  }

  /**
   * Executa a lógica de rolagem final da arma
   * @private
   */
  async _executeWeaponRoll(weapon, options = {}) {
    // Consumir PA + Repetição
    const baseCost = weapon.system.cost || 1;
    const repeatCost = this.actor.getActionRepeatCost("Atacar");
    const paCost = baseCost + repeatCost;

    const consumed = await this.actor.consumeResource("pa", paCost);
    if (!consumed) return;

    // Registrar ação
    await this.actor.recordTurnAction("Atacar");

    const attrKey = (weapon.system.attribute || "pot").toLowerCase();
    const skillKey = attrKey === "hab" ? "pontaria" : "luta";
    
    const attr = this.actor.system.attributes[attrKey];
    const skill = this.actor.system.skills[skillKey];

    const poolSize = 2 + (skill?.value || 0);
    const totalBonus = (attr?.value || 0) + (options.bonus || 0);
    const hitTable = weapon.system.damageTable;

    await AnimusRoll.rollTest({
      poolSize: poolSize,
      attributeValue: totalBonus,
      label: `Ataque com ${weapon.name}`,
      hitTable: hitTable,
      advantage: options.advantage,
      speaker: this.actor
    });
  }

  /**
   * Handle editing the actor's image
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  async _onEditImage(event, target) {
    const attr = target.dataset.edit || "img";
    const current = foundry.utils.getProperty(this.document, attr);
    const fp = new FilePicker({
      type: "image",
      current: current,
      callback: path => {
        this.document.update({ [attr]: path });
      },
      top: this.position.top + 40,
      left: this.position.left + 10
    });
    return fp.browse();
  }

  /**
   * Abre o browser de compêndio para selecionar itens
   */
  async _onOpenBrowser(event, target) {
    const type = target.dataset.type;
    let packId = "animus.itens";
    let title = "Arsenal Animus";
    let activeTab = "weapon";

    if (type === "ascendancy") {
      packId = "animus.regras";
      title = "Seleção de Ascendência";
      activeTab = "ascendancy";
    } else if (type === "element") {
      packId = "animus.regras";
      title = "Seleção Elemental";
      activeTab = "element";
    }

    const browser = new AnimusCompendiumBrowser({
      actor: this.actor,
      packId: packId,
      activeTab: activeTab,
      window: { title: title },
      callback: async (item) => {
        // Se for ascendência ou elemento, substituir o existente
        if (item.type === "ascendancy" || item.type === "element") {
          const existing = this.actor.items.find(i => i.type === item.type);
          if (existing) {
            await existing.delete();
          }
          const [newItem] = await this.actor.createEmbeddedDocuments("Item", [item.toObject()]);
          
          // Abrir seletor de bônus automaticamente
          if (newItem) {
            const selector = new AnimusBonusSelector({ item: newItem });
            selector.render(true);
          }
          return newItem;
        }
        return this.actor.createEmbeddedDocuments("Item", [item.toObject()]);
      }
    });
    browser.render(true);
  }

  /**
   * Abre o seletor de bônus para um item específico
   */
  async _onOpenBonusSelector(event, target) {
    const itemId = target.dataset.itemId || target.closest("[data-item-id]")?.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;

    const selector = new AnimusBonusSelector({ item: item });
    selector.render(true);
  }

  /**
   * Abre o gerenciador de talentos
   */
  async _onOpenTalentManager(event, target) {
    if (!this.actor) return;
    const manager = new AnimusTalentManager({
      actor: this.actor
    });
    manager.render({ force: true });
  }

  /**
   * Filtra a lista de talentos na ficha
   */
  async _onFilterTalents(event, target) {
    const category = target.dataset.category;
    this.filters.talents = category;
    this.render();
  }

  /**
   * Abre o painel de evolução
   */
  async _onOpenAdvancement(event, target) {
    const manager = new AnimusAdvancement({
      document: this.actor
    });
    manager.render(true);
  }

  /**
   * Abre o navegador de itens filtrado para armas
   */
  async _onOpenWeaponBrowser(event, target) {
    new AnimusCompendiumBrowser({ 
      actor: this.actor,
      packId: "animus.itens"
    }).render(true);
  }

  /**
   * Abre o criador de armas customizadas
   */
  async _onOpenWeaponCreator(event, target) {
    const creator = new AnimusWeaponCreator({
      actor: this.actor
    });
    creator.render(true);
  }

  /**
   * Update the status bars visually
   */
  _updateBars() {
    if (!this.element) return;
    const html = this.element;
    const hp = this.actor.system.status.hp;
    const pe = this.actor.system.status.pe;

    const hpPercent = Math.min(100, Math.max(0, (hp.value / (hp.max || 1)) * 100));
    const pePercent = Math.min(100, Math.max(0, (pe.value / (pe.max || 1)) * 100));

    // Update HP
    const hpBar = html.querySelector('.bar-fill.hp');
    const hpGhost = html.querySelector('.bar-ghost.hp');
    if (hpBar) hpBar.style.width = `${hpPercent}%`;
    if (hpGhost) hpGhost.style.width = `${hpPercent}%`;

    // Update PE
    const peBar = html.querySelector('.bar-fill.pe');
    const peGhost = html.querySelector('.bar-ghost.pe');
    if (peBar) peBar.style.width = `${pePercent}%`;
    if (peGhost) peGhost.style.width = `${pePercent}%`;
  }

  /**
   * Helper para gerenciar o estado das abas no V2
   */
  _getTabs(options) {
    const tabs = {
      attributes: { id: "attributes", group: "primary", label: "ANIMUS.Profile" },
      combat: { id: "combat", group: "primary", label: "ANIMUS.Combat" },
      inventory: { id: "inventory", group: "primary", label: "ANIMUS.Inventory" },
      description: { id: "description", group: "primary", label: "ANIMUS.Biography" }
    };

    // Usa o tabGroups nativo do ApplicationV2
    const activeTab = this.tabGroups?.primary || "attributes";

    for (const v of Object.values(tabs)) {
      v.active = activeTab === v.id;
      v.cssClass = v.active ? "active" : "";
    }
    return tabs;
  }

  /**
   * Handler para submissão do formulário
   */
  static async #onSubmit(event, form, formData) {
    const updateData = foundry.utils.expandObject(formData.object);
    await this.document.update(updateData);
  }

  async _onEditItem(event, target) {
    const itemId = target.dataset.itemId || target.closest("[data-item-id]")?.dataset.itemId;
    const item = this.document.items.get(itemId);
    if (item) item.sheet.render(true);
  }

  async _onDeleteItem(event, target) {
    const itemId = target.dataset.itemId || target.closest("[data-item-id]")?.dataset.itemId;
    const item = this.document.items.get(itemId);
    if (item) item.delete();
  }

  /** @override */
  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);
    if (data.type !== "Item") return super._onDrop(event);

    const item = await Item.fromDropData(data);
    if (!item) return super._onDrop(event);

    // Se for ascendência ou elemento, substituir o existente
    if (item.type === "ascendancy" || item.type === "element") {
      const existing = this.actor.items.find(i => i.type === item.type);
      
      // Se for o mesmo item, não faz nada
      if (existing && existing.id === item.id) return;

      if (existing) {
        await existing.delete();
      }
      
      const [newItem] = await this.actor.createEmbeddedDocuments("Item", [item.toObject()]);
      
      // Abrir seletor de bônus automaticamente
      if (newItem) {
        const selector = new AnimusBonusSelector({ item: newItem });
        selector.render(true);
      }
      
      return newItem;
    }

    return super._onDrop(event);
  }

  /**
   * Toggle equipped state for an item
   */
  async _onToggleEquip(event, target) {
    const itemId = target.closest(".item-row").dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;

    const isEquipped = item.system.equipped;

    // Se for armadura ou escudo, desequipar outros do mesmo tipo
    if (!isEquipped && ["armor", "shield"].includes(item.type)) {
      const otherEquipped = this.actor.items.filter(i => i.type === item.type && i.system.equipped && i.id !== item.id);
      for (let o of otherEquipped) {
        await o.update({ "system.equipped": false });
      }
    }

    await item.update({ "system.equipped": !isEquipped });
    
    // Sincronizar Proteção (tanto ao equipar quanto desequipar)
    if (["armor", "shield"].includes(item.type)) {
      this.actor.prepareData(); 
      const newMax = this.actor.system.status.prot.max;
      const currentValue = this.actor.system.status.prot.value;
      
      // Se equipou, sobe para o máximo. Se desequipou, garante que não passe do novo máximo.
      const newValue = !isEquipped ? newMax : Math.min(currentValue, newMax);
      
      await this.actor.update({ "system.status.prot.value": newValue });
    }
    
    const label = !isEquipped ? "Equipado" : "Desequipado";
    ui.notifications.info(`${item.name} ${label}.`);
    this.render();
  }

  /**
   * Use a consumable item
   */
  async _onUseItem(event, target) {
    const itemId = target.closest(".item-row").dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;

    // Chamar a lógica de uso do item (definida na classe AnimusItem)
    return item.use();
  }
  
  /**
   * Roll a basic action (non-item)
   */
  async _onRollBasicAction(event, target) {
    const name = target.dataset.name;
    const action = CONFIG.ANIMUS.basicActions.find(a => a.name === name);
    if (!action) return;

    // Consumir PA + Repetição
    const repeatCost = this.actor.getActionRepeatCost(action.name);
    const paCost = (action.cost || 0) + repeatCost;

    const consumed = await this.actor.consumeResource("pa", paCost);
    if (!consumed) return;

    // Registrar ação
    await this.actor.recordTurnAction(action.name);

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="animus-chat-card">
          <div class="chat-header">
            <img src="${action.img}" class="chat-icon" />
            <h3>${action.name}</h3>
          </div>
          <div class="chat-body">
            <p><strong>Custo:</strong> ${action.cost} PA</p>
            <p>${action.description}</p>
          </div>
        </div>
      `
    });
  }
}

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Aplicativo para criação customizada de armas no sistema Animus.
 */
export class AnimusWeaponCreator extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this.actor = options.actor;
    this.selectedPropertyIds = new Set();
    this.mainPropertyId = "";
  }

  static DEFAULT_OPTIONS = {
    tag: "div",
    classes: ["animus", "weapon-creator"],
    position: {
      width: 600,
      height: 800
    },
    window: {
      title: "FORJA DE ARMAMENTOS",
      resizable: false
    },
    actions: {
      applyPreset: AnimusWeaponCreator.prototype._onApplyPreset,
      close: function () { this.close(); },
      submit: AnimusWeaponCreator.prototype._onSubmit
    },
    form: {
      handler: AnimusWeaponCreator.prototype._onSubmit,
      closeOnSubmit: true,
      submitOnChange: false
    }
  };

  static PARTS = {
    body: { template: "systems/animus/templates/apps/weapon-creator.hbs" }
  };

  /** @override */
  _onRender(context, options) {
    // Listener para presets
    const typeSelect = this.element.querySelector('select[name="system.type"]');
    if (typeSelect) {
      typeSelect.addEventListener("change", (ev) => {
        const val = ev.target.value;
        this._applyWeaponPreset(val);
        this._togglePropertyGroups(val);
      });
      this._togglePropertyGroups(typeSelect.value);
      this._applyWeaponPreset(typeSelect.value);
    }

    // Listener para Característica Principal
    const mainSelect = this.element.querySelector(".main-prop-select");
    if (mainSelect) {
      mainSelect.addEventListener("change", (ev) => {
        const id = ev.target.value;
        // Se a propriedade já estiver nas complementares, impede a seleção
        if (id && this.selectedPropertyIds.has(id)) {
          ui.notifications.warn("Esta característica já está selecionada nas Complementares.");
          ev.target.value = this.mainPropertyId || "";
          return;
        }
        this.mainPropertyId = id;
        
        // Automação de Atributo baseada na Característica Principal
        const prop = this._getPropertyById(id);
        if (prop) {
          const attrSelect = this.element.querySelector('select[name="system.attribute"]');
          if (attrSelect) {
            // APENAS Equilibrada troca o atributo base para HAB
            if (prop.name === "Equilibrada") attrSelect.value = "hab";
          }
        }

        this._updatePropertyPreview(ev.target);
        this._updateTotalPriceUI();
        this._updateDamagePreview();
      });
    }

    // Listener para Adicionar Complementares (Tabela 2)
    const addSelect = this.element.querySelector(".add-property-select");
    if (addSelect) {
      addSelect.addEventListener("change", (ev) => {
        this._onAddProperty(ev.target);
      });
    }

    // Listener para Remoção de Chips
    this.element.addEventListener("click", (ev) => {
      const removeBtn = ev.target.closest(".remove-prop-btn");
      if (removeBtn) {
        const id = removeBtn.dataset.id;
        this.selectedPropertyIds.delete(id);
        this._renderSelectedProperties();
      }
    });

    // Listener para qualquer input na tabela de dano
    this.element.addEventListener("input", (ev) => {
      const name = ev.target.name || "";
      if (name.includes("system.damage.") || name === "system.attribute") {
        this._updateDamagePreview();
      }
    });

    this._renderSelectedProperties();
    this._updateDamagePreview();
  }

  /**
   * Renderiza a lista de chips das propriedades selecionadas
   */
  _renderSelectedProperties() {
    const list = this.element.querySelector(".selected-chips-list");
    const counter = this.element.querySelector('.limit-counter[data-group="table2"]');
    if (!list) return;

    if (this.selectedPropertyIds.size === 0) {
      list.innerHTML = '<span class="empty-text">Nenhuma característica selecionada</span>';
    } else {
      let html = "";
      for (const id of this.selectedPropertyIds) {
        const prop = this._getPropertyById(id);
        if (!prop) continue;
        html += `
          <div class="selected-mod-item" data-id="${id}">
            <span>${prop.name}</span>
            <button type="button" class="remove-prop-btn" data-id="${id}">
              <i class="fas fa-times"></i>
            </button>
          </div>
        `;
      }
      list.innerHTML = html;
    }

    // Atualizar contador
    if (counter) {
      const count = this.selectedPropertyIds.size;
      counter.textContent = `${count}/3`;
      counter.classList.toggle("at-limit", count >= 3);
    }

    this._updateTotalPriceUI();
    this._updateDamagePreview();
  }

  /**
   * Busca dados de uma propriedade pelo ID nos dados do contexto
   */
  _getPropertyById(id) {
    const props = this.context.properties;
    for (const group in props) {
      const found = props[group].find(p => p.id === id);
      if (found) return found;
    }
    return null;
  }

  /**
   * Adiciona uma propriedade da Tabela 2
   */
  _onAddProperty(select) {
    const id = select.value;
    if (!id) return;

    if (id === this.mainPropertyId) {
      ui.notifications.warn("Esta característica já está selecionada como Principal.");
    } else if (this.selectedPropertyIds.has(id)) {
      ui.notifications.warn("Esta característica já foi selecionada.");
    } else if (this.selectedPropertyIds.size >= 3) {
      ui.notifications.warn("Você atingiu o limite de 3 características na Tabela 2.");
    } else {
      this.selectedPropertyIds.add(id);
      this._renderSelectedProperties();
    }

    select.value = ""; // Resetar seletor
  }

  /**
   * Atualiza a descrição de visualização
   */
  _updatePropertyPreview(select) {
    const group = select.closest(".property-dropdown-group");
    const descEl = group.querySelector(".property-desc-preview");
    if (!descEl) return;

    const option = select.options[select.selectedIndex];
    const desc = option.getAttribute("title") || "";
    descEl.textContent = desc;
    descEl.classList.toggle("active", !!desc);
  }

  /**
   * Gerencia a mudança em um seletor de propriedade
   */
  _onPropertyDropdownChange(select) {
    const type = select.dataset.type;
    const value = select.value;
    const group = select.closest(".property-dropdown-group");

    // 1. Atualizar descrição exibida
    const descEl = group.querySelector(".property-desc-preview");
    if (descEl) {
      const option = select.options[select.selectedIndex];
      const desc = option.getAttribute("title") || "";
      descEl.textContent = desc;
      descEl.classList.toggle("active", !!desc);
    }

    // 2. Evitar duplicatas na Tabela 2
    if (type === "Complementares") {
      const allT2 = Array.from(this.element.querySelectorAll('select[data-type="Complementares"]'));
      const otherValues = allT2.filter(s => s !== select).map(s => s.value).filter(v => v !== "");

      if (value !== "" && otherValues.includes(value)) {
        ui.notifications.warn("Você não pode selecionar a mesma característica modular mais de uma vez.");
        select.value = "";
        if (descEl) {
          descEl.textContent = "";
          descEl.classList.remove("active");
        }
      }
    }
  }



  /**
   * Mostra ou esconde grupos de propriedades baseados no tipo de arma
   */
  _togglePropertyGroups(type) {
    // Mecânicas (Distância)
    const isMechanical = type?.startsWith("distancia");
    // Fogo
    const isFirearm = type?.startsWith("fogo");


    const addSelect = this.element.querySelector(".add-property-select");
    if (!addSelect) return;

    const mechOptGroup = addSelect.querySelector('optgroup[data-group="Mecânicas"]');
    const fireOptGroup = addSelect.querySelector('optgroup[data-group="Fogo"]');

    if (mechOptGroup) mechOptGroup.style.display = isMechanical ? "" : "none";
    if (fireOptGroup) fireOptGroup.style.display = isFirearm ? "" : "none";

    // Limpar seleções incompatíveis
    const toRemove = [];
    for (const id of this.selectedPropertyIds) {
      const prop = this._getPropertyById(id);
      if (!prop) continue;

      // Se for mecânica mas a arma não é mecânica
      if (this.context.properties.Mecânicas.some(p => p.id === id) && !isMechanical) toRemove.push(id);
      // Se for de fogo mas a arma não é de fogo
      if (this.context.properties.Fogo.some(p => p.id === id) && !isFirearm) toRemove.push(id);
    }

    if (toRemove.length > 0) {
      toRemove.forEach(id => this.selectedPropertyIds.delete(id));
      this._renderSelectedProperties();
    }
  }

  /**
   * Aplica os valores de base do preset selecionado aos campos do formulário
   */
  _applyWeaponPreset(typeKey) {
    const weaponPresets = {
      cortante_leve: { attr: "pot", dmg: { ac1: [2, 0], ac2: [3, 1], ac3: [4, 2], ac4: [5, 3] }, range: 0, props: [], price: 5 },
      cortante_medio: { attr: "pot", dmg: { ac1: [3, 0], ac2: [4, 2], ac3: [6, 3], ac4: [8, 3] }, range: 0, props: [], price: 15 },
      contusa_leve: { attr: "pot", dmg: { ac1: [1, 1], ac2: [2, 2], ac3: [3, 3], ac4: [4, 4] }, range: 0, props: [], price: 0 },
      contusa_medio: { attr: "pot", dmg: { ac1: [2, 1], ac2: [3, 2], ac3: [5, 3], ac4: [6, 5] }, range: 0, props: [], price: 15 },
      perfurante_leve: { attr: "pot", dmg: { ac1: [1, 0], ac2: [2, 1], ac3: [3, 2], ac4: [5, 5] }, range: 0, props: [], price: 8 },
      perfurante_medio: { attr: "pot", dmg: { ac1: [2, 0], ac2: [3, 1], ac3: [4, 3], ac4: [7, 6] }, range: 0, props: [], price: 10 },
      distancia_leve: { // Distância Leve (Arcos/Bestas)
        attr: "hab", dmg: { ac1: [1, 1], ac2: [1, 2], ac3: [2, 3], ac4: [3, 4] }, range: 1, props: [], price: 15
      },
      distancia_media: { // Distância Médio (Arcos/Bestas)
        attr: "hab", dmg: { ac1: [1, 2], ac2: [2, 3], ac3: [3, 4], ac4: [5, 5] }, range: 2, props: [], price: 35
      },
      fogo_leve: { // Fogo Leve (Pistola) - Base + 2
        attr: "hab", dmg: { ac1: [3, 1], ac2: [3, 2], ac3: [4, 3], ac4: [5, 4] }, range: 1,
        props: ["5b5063ac4c0fb15f"], // Antecarga
        price: 200
      },
      fogo_media: { // Fogo Médio (Mosquete) - Base + 4
        attr: "hab", dmg: { ac1: [5, 2], ac2: [6, 3], ac3: [7, 4], ac4: [9, 5] }, range: 2,
        props: ["5b5063ac4c0fb15f"], // Antecarga
        price: 500
      }
    };

    const preset = weaponPresets[typeKey];
    if (!preset) return;

    this.basePrice = preset.price || 0;

    const form = this.element.querySelector("form");
    if (!form) return;

    // Atualizar Atributo
    form.querySelector('select[name="system.attribute"]').value = preset.attr;

    // Atualizar Alcance
    form.querySelector('select[name="system.range"]').value = preset.range;

    // Atualizar Tabela de Dano
    for (let i = 1; i <= 4; i++) {
      form.querySelector(`input[name="system.damage.ac${i}.base"]`).value = preset.dmg[`ac${i}`][0];
      form.querySelector(`input[name="system.damage.ac${i}.mult"]`).value = preset.dmg[`ac${i}`][1];
    }

    // Limpar seleções anteriores
    this.selectedPropertyIds.clear();
    this.mainPropertyId = "";

    if (preset.props) {
      preset.props.forEach(propId => {
        // Verificar se é principal ou complementar
        if (this.context.properties.Principais.some(p => p.id === propId)) {
          this.mainPropertyId = propId;
        } else {
          this.selectedPropertyIds.add(propId);
        }
      });
    }

    // Atualizar UI
    const mainSelect = form.querySelector(".main-prop-select");
    if (mainSelect) {
      mainSelect.value = this.mainPropertyId;
      this._updatePropertyPreview(mainSelect);
    }
    this._renderSelectedProperties();
    this._updateTotalPriceUI();
    this._updateDamagePreview();
  }

  /** @override */
  async _prepareContext(options) {
    // Buscar propriedades do compêndio
    const pack = game.packs.get("animus.itens");
    const properties = {
      Principais: [],
      Complementares: [],
      Mecânicas: [],
      Fogo: []
    };

    if (pack) {
      const docs = await pack.getDocuments();
      for (const d of docs) {
        // FILTRO CRÍTICO: Apenas itens do tipo 'property'
        if (d.type !== "property") continue;

        // Mapear subcategoria numérica para string (0: Mecânicas, 1: Fogo, 2: Principais, 3: Complementares)
        const subCatMap = {
          "0": "Mecânicas",
          "1": "Fogo",
          "2": "Principais",
          "3": "Complementares"
        };
        const subCat = subCatMap[String(d.system.subCategory)] || "Complementares";
        const prop = {
          id: d.id,
          name: d.name,
          img: d.img,
          type: d.system.type,
          desc: d.system.description?.replace(/<[^>]*>?/gm, ''),
          price: parseInt(d.system.price?.replace(/[^0-9]/g, '') || 0),
          bonus: d.system.bonus || {}
        };

        // Se a subcategoria for uma das que esperamos (Principais, Complementares, Mecânicas, Fogo)
        if (properties.hasOwnProperty(subCat)) {
          properties[subCat].push(prop);
        } else {
          // Se for uma propriedade mas sem subcategoria válida, vai para Complementares
          properties.Complementares.push(prop);
        }
      }

      // Ordenar alfabeticamente
      Object.values(properties).forEach(group => group.sort((a, b) => a.name.localeCompare(b.name)));
    }

    this.context = {
      actor: this.actor,
      config: CONFIG.ANIMUS,
      properties,
      defaultDamage: {
        ac1: { base: 2, mult: 0 },
        ac2: { base: 3, mult: 1 },
        ac3: { base: 4, mult: 2 },
        ac4: { base: 5, mult: 3 }
      }
    };

    return this.context;
  }

  /**
   * Processa a criação da arma no ator
   */
  async _onSubmit(event) {
    event.preventDefault();

    const form = this.element.querySelector("form");
    const formData = new foundry.applications.ux.FormDataExtended(form).object;
    const data = foundry.utils.expandObject(formData);

    // Mapeamento automático de Tipo de Arma -> Tipo de Dano (usando chaves string)
    const typeToDamage = {
      cortante_leve: "cortante",
      cortante_medio: "cortante",
      contusa_leve: "contuso",
      contusa_medio: "contuso",
      perfurante_leve: "perfurante",
      perfurante_medio: "perfurante",
      distancia_leve: "distancia",
      distancia_media: "distancia",
      fogo_leve: "fogo",
      fogo_media: "fogo"
    };
    data.system.damageType = typeToDamage[data.system.type] || "cortante";

    const itemData = {
      name: data.name || "Nova Arma",
      type: "weapon",
      img: data.img || "systems/animus/assets/system-icons/items/sword.svg",
      system: {
        ...data.system,
        properties: [
          ...(this.mainPropertyId ? [this.mainPropertyId] : []),
          ...Array.from(this.selectedPropertyIds)
        ],
        price: `${this._calculateTotalPrice()} Đ`
      }
    };

    // Criar o item no ator
    await this.actor.createEmbeddedDocuments("Item", [itemData]);
    ui.notifications.info(`A arma "${itemData.name}" foi forjada com sucesso!`);
    this.close();
  }

  /**
   * Calcula o valor total numérico
   */
  _calculateTotalPrice() {
    let total = this.basePrice || 0;
    if (this.mainPropertyId) {
      const prop = this._getPropertyById(this.mainPropertyId);
      if (prop) total += prop.price || 0;
    }
    for (const id of this.selectedPropertyIds) {
      const prop = this._getPropertyById(id);
      if (prop) total += prop.price || 0;
    }
    return total;
  }

  /**
   * Atualiza a exibição do preço total
   */
  _updateTotalPriceUI() {
    if (!this.element) return;
    const totalEl = this.element.querySelector(".total-price-value");
    if (!totalEl) return;
    totalEl.textContent = `${this._calculateTotalPrice()} Đ`;
  }

  /**
   * Atualiza os valores de dano final na interface
   */
  _updateDamagePreview() {
    if (!this.element) return;

    // 1. Coletar bônus de todas as propriedades selecionadas
    let damageBonus = 0;
    let multiplierBonus = 0;

    // Função auxiliar para somar bônus
    const addBonuses = (propId) => {
      if (!propId) return;
      const prop = this._getPropertyById(propId);
      if (!prop) return;
      
      if (prop.bonus?.damage) damageBonus += prop.bonus.damage;
      if (prop.bonus?.multiplier) multiplierBonus += prop.bonus.multiplier;
      
      // Bônus específicos de Características Principais
      if (prop.name === "Reforçada") multiplierBonus += 1; // +1x Atributo Base
      else if (prop.name === "Equilibrada") multiplierBonus += 1; // +1x HAB (já trocado)
      else if (prop.name === "Estratégica") multiplierBonus += 1; // +1x PER
      else if (prop.name === "Peculiar") multiplierBonus += 1; // +1x COG
    };

    addBonuses(this.mainPropertyId);
    this.selectedPropertyIds.forEach(id => addBonuses(id));

    // 2. Atualizar spans de total na matriz
    const form = this.element.querySelector("form");
    if (!form) return;

    for (let i = 1; i <= 4; i++) {
      const baseInput = form.querySelector(`input[name="system.damage.ac${i}.base"]`);
      const multInput = form.querySelector(`input[name="system.damage.ac${i}.mult"]`);
      const totalSpan = this.element.querySelector(`.ac-total[data-ac="ac${i}"]`);
      
      if (baseInput && totalSpan) {
        const base = parseInt(baseInput.value) || 0;
        const mult = parseInt(multInput?.value) || 0;
        
        // O TOTAL na matriz de criação exibe (Base + Bônus Fixo) 
        // e indica o multiplicador final entre parênteses para clareza
        const finalBase = base + damageBonus;
        const finalMult = mult + multiplierBonus;
        
        totalSpan.innerHTML = `${finalBase} <small>(+${finalMult}x)</small>`;
      }
    }

    // 3. Atualizar indicador de bônus ativo no rodapé da tabela
    const bonusIndicator = this.element.querySelector(".bonus-value");
    if (bonusIndicator) {
      const hasBonus = damageBonus > 0 || multiplierBonus > 0;
      let text = "";
      if (damageBonus > 0) text += `+${damageBonus} DANO`;
      
      if (multiplierBonus > 0) {
        const prop = this._getPropertyById(this.mainPropertyId);
        let multSuffix = "x MULT";
        if (prop?.name === "Estratégica") multSuffix = "x PER";
        else if (prop?.name === "Peculiar") multSuffix = "x COG";
        else if (prop?.name === "Equilibrada") multSuffix = "x HAB";
        
        text += (text ? " e " : "") + `+${multiplierBonus}${multSuffix}`;
      }
      
      bonusIndicator.textContent = hasBonus ? text + " ATIVOS" : "+0 DANO ATIVO";
      bonusIndicator.style.opacity = hasBonus ? "1" : "0.3";
      bonusIndicator.style.background = hasBonus ? "rgba(0, 210, 255, 0.15)" : "rgba(255, 255, 255, 0.05)";
    }
  }
}

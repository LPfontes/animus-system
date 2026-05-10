export class AnimusItem extends Item {
  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    this._prepareBonusAttributes();
  }

  /**
   * Se os atributos de bônus estiverem vazios (ex: importação legada), tenta extraí-los.
   */
  _prepareBonusAttributes() {
    if (!["ascendancy", "element"].includes(this.type)) return;
    
    const bonus = this.system.bonus;
    if (!bonus) return;

    // Se já tiver atributos, não faz nada
    if (Array.isArray(bonus.attributes) && bonus.attributes.length > 0) return;

    let attrs = [];
    // Normaliza o nome para comparação (remove acentos e espaços)
    const name = this.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    // Mapeamento manual para garantir consistência
    const elementMaps = {
      "fogo": ["hab", "pre"],
      "agua": ["cog", "ani"],
      "vento": ["hab", "per"],
      "terra": ["pot", "cog"],
      "madeira": ["pot", "ani"],
      "metal": ["pot", "per"],
      "trovao": ["per", "pre"]
    };

    if (this.type === "element" && elementMaps[name]) {
      attrs = elementMaps[name];
    } else if (this.type === "ascendancy") {
      // Ascendências geralmente permitem qualquer atributo (Padrão do Animus)
      attrs = ["pot", "hab", "cog", "per", "pre", "ani"];
    }

    if (attrs.length > 0) {
      // Definimos os atributos no dado derivado
      // Usamos defineProperty para garantir que o Foundry não bloqueie a alteração em dados derivados
      Object.defineProperty(bonus, "attributes", {
        value: attrs,
        writable: true,
        configurable: true
      });
    }
  }
}

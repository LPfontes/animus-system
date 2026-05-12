/**
 * Sistema de Rolagem Animus RPG
 * Mecânica central: 2d6 + conjunto (mantém os 2 maiores) + Atributo
 */
export class AnimusRoll {
  /**
   * Executa um teste de perícia ou atributo
   * @param {Object} params
   * @param {number} params.poolSize - Quantidade de dados a rolar (2 + nível de perícia)
   * @param {number} params.attributeValue - Valor do atributo a somar
   * @param {string} params.label - Nome do teste (ex: "Atletismo")
   * @param {Object} params.hitTable - Tabela de dano (ac1, ac2, ac3, ac4)
   * @param {string} params.advantage - 'advantage', 'disadvantage' ou null
   * @param {Actor} params.speaker - O ator que está rolando
   */
  static async rollTest({ poolSize = 2, attributeValue = 0, label = "", hitTable = null, advantage = null, speaker = null, healMode = false }) {
    // 1. Definir a fórmula usando a sintaxe nativa do Foundry (Keep Highest 2)
    const formula = `${poolSize}d6kh2 + ${attributeValue}`;
    const roll = await new Roll(formula).evaluate();

    // 2. Aplicar lógica Animus de Vantagem/Desvantagem nos dados mantidos
    const dice = roll.dice[0];
    const results = dice.results;
    
    // Encontrar o maior dado entre os ativos (mantidos pelo kh2)
    const activeResults = results.filter(r => r.active).sort((a, b) => b.result - a.result);
    
    if (activeResults.length > 0) {
      const highestDie = activeResults[0];

      if (advantage === "advantage" && highestDie.result < 4) {
        // Vantagem: se o maior dado for 1, 2 ou 3, ele é tratado como 4
        highestDie.result = 4;
      } else if (advantage === "disadvantage" && highestDie.result > 3) {
        // Desvantagem: se o maior dado for 4, 5 ou 6, ele é tratado como 3
        highestDie.result = 3;
      }
    }

    // 3. Recalcular o total do Roll explicitamente para garantir sincronia no Chat
    const diceTotal = results.reduce((acc, r) => acc + (r.active ? r.result : 0), 0);
    const numericBonus = roll.terms
      .filter(t => t instanceof foundry.dice.terms.NumericTerm)
      .reduce((acc, t) => acc + t.number, 0);
    
    // Sobrescreve o total interno para que o Foundry use o valor modificado
    roll._total = diceTotal + numericBonus;

    // 4. Verificar Crítico Natural
    const naturalSixes = results.filter(r => r.active && r.result === 6).length;
    const isNaturalCritical = naturalSixes >= 2;

    // 5. Calcular Nível de Acerto (AC) e Dano
    let hitResult = "";
    let damageValue = 0;
    const total = roll.total;

    if (hitTable) {
      if (isNaturalCritical || total >= 13) {
        hitResult = "AC 4 (CRÍTICO)";
        damageValue = hitTable.ac4 || 0;
      } else if (total >= 10) {
        hitResult = "AC 3";
        damageValue = hitTable.ac3 || 0;
      } else if (total >= 6) {
        hitResult = "AC 2";
        damageValue = hitTable.ac2 || 0;
      } else {
        hitResult = "AC 1";
        damageValue = hitTable.ac1 || 0;
      }
    }

    // 6. Enviar para o chat
    const targets = Array.from(game.user.targets);
    
    let flavor = `<div class="animus-roll-flavor">
      <div class="roll-label">${label}</div>`;
    
    if (targets.length > 0) {
      flavor += `<div class="target-list">`;
      for (let t of targets) {
        flavor += `
          <div class="target-item">
            <img src="${t.document.texture.src}" title="${t.name}" class="target-img"/>
            <span class="target-name">${t.name}</span>
          </div>`;
      }
      flavor += `</div>`;
    }

    if (advantage === "advantage") flavor += `<div class="roll-mod advantage">[Vantagem]</div>`;
    if (advantage === "disadvantage") flavor += `<div class="roll-mod disadvantage">[Desvantagem]</div>`;
    
    if (hitTable) {
      const isCrit = isNaturalCritical || total >= 13;
      const colorClass = isCrit ? "crit" : "hit";
      const valueLabel = healMode ? "Cura" : "Dano";
      const applyAction = healMode ? "applyHeal" : "applyDamage";
      const applyIcon  = healMode ? "fa-heart" : "fa-user-minus";
      const applyLabel = healMode ? "Aplicar Cura" : "Aplicar Dano";
      flavor += `
        <div class="hit-result-banner ${colorClass}">
          <span class="ac-label">${hitResult}</span>
          ${damageValue > 0 ? `<span class="damage-val">${valueLabel}: ${damageValue}</span>` : ""}
        </div>
        ${damageValue > 0 ? `
        <div class="chat-actions">
          <button class="apply-damage-btn" data-action="${applyAction}" data-damage="${damageValue}">
            <i class="fas ${applyIcon}"></i> ${applyLabel}
          </button>
        </div>` : ""}
      `;
    }

    if (isNaturalCritical) flavor += `<div class="crit-banner">CRÍTICO NATURAL!</div>`;
    flavor += `</div>`;

    return roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: speaker }),
      flavor: flavor,
      flags: { 
        "animus.isCritical": isNaturalCritical,
        "animus.hitResult": hitResult,
        "animus.damageValue": damageValue,
        "animus.targets": targets.map(t => t.id)
      }
    });
  }
}

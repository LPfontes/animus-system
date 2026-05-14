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
   * @param {number} params.bonus - Bônus numérico para o total da rolagem
   */
  static async rollTest({ poolSize = 2, attributeValue = 0, label = "", hitTable = null, advantage = null, speaker = null, healMode = false, bonusDamage = 0, bonus = 0 }) {
    // 1. Definir a fórmula usando a sintaxe nativa do Foundry (Keep Highest 2)
    const formula = `${poolSize}d6kh2 + ${attributeValue} + ${bonus}`;
    const roll = await new Roll(formula).evaluate();

    // 2. Aplicar lógica Animus de Vantagem/Desvantagem (Apenas no Total)
    const dice = roll.dice[0];
    const results = dice.results;
    let transformation = null;
    let rollAdjustment = 0;

    // Encontrar o maior dado entre os ativos (mantidos pelo kh2)
    const activeResults = results.filter(r => r.active).sort((a, b) => b.result - a.result);

    if (activeResults.length > 0) {
      const highestDie = activeResults[0];
      const originalResult = highestDie.result;

      if (advantage === "advantage" && originalResult < 4) {
        // Vantagem: o maior dado é tratado como 4 para o cálculo
        rollAdjustment = 4 - originalResult;
        transformation = { from: originalResult, to: 4 };
      } else if (advantage === "disadvantage" && originalResult > 3) {
        // Desvantagem: o maior dado é tratado como 3 para o cálculo
        rollAdjustment = 3 - originalResult;
        transformation = { from: originalResult, to: 3 };
      }
    }

    // 3. Recalcular o total do Roll explicitamente para garantir sincronia no Chat
    // Somamos os dados originais + bônus numéricos + ajuste de vantagem/desvantagem
    const diceTotal = results.reduce((acc, r) => acc + (r.active ? r.result : 0), 0);
    const numericBonus = roll.terms
      .filter(t => t instanceof foundry.dice.terms.NumericTerm)
      .reduce((acc, t) => acc + t.number, 0);

    // Sobrescreve o total interno com o ajuste aplicado
    roll._total = diceTotal + numericBonus + rollAdjustment;

    // 4. Verificar Crítico Natural
    const naturalSixes = results.filter(r => r.active && r.result === 6).length;
    const isNaturalCritical = naturalSixes >= 2;

    // 5. Calcular Nível de Acerto (AC) e Dano
    let hitResult = "";
    let damageValue = 0;
    const total = roll.total;

    if (hitTable) {
      const hasSixTiers = hitTable.ac6 !== undefined && hitTable.ac6 > 0;

      if (hasSixTiers) {
        // Nova Lógica (1-6) - Usada por Monstros ND 5+
        if (isNaturalCritical) {
          hitResult = "AC 6 (CRÍTICO)";
          damageValue = hitTable.ac6 || 0;
        } else if (total >= 10) {
          hitResult = "AC 5";
          damageValue = hitTable.ac5 || 0;
        } else if (total >= 8) {
          hitResult = "AC 4";
          damageValue = hitTable.ac4 || 0;
        } else if (total >= 6) {
          hitResult = "AC 3";
          damageValue = hitTable.ac3 || 0;
        } else if (total >= 4) {
          hitResult = "AC 2";
          damageValue = hitTable.ac2 || 0;
        } else {
          hitResult = "AC 1";
          damageValue = hitTable.ac1 || 0;
        }
      } else {
        // Lógica Padrão (1-4) - Usada por Armas e Monstros de ND baixo
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

      // Aplicar bônus de dano extra (de talentos, etc)
      if (damageValue > 0) damageValue += bonusDamage;
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

    if (advantage === "advantage") flavor += `<div class="roll-mod advantage">[Vantagem] <small>(Mínimo 4)</small></div>`;
    if (advantage === "disadvantage") flavor += `<div class="roll-mod disadvantage">[Desvantagem] <small>(Máximo 3)</small></div>`;

    if (transformation) {
      flavor += `<div class="roll-mod-detail transformation-applied">
        <i class="fas fa-magic"></i> Dado transformado: <strong>${transformation.from}</strong> <i class="fas fa-long-arrow-alt-right"></i> <strong>${transformation.to}</strong>
      </div>`;
    }

    if (hitTable) {
      const isCrit = isNaturalCritical || total >= 13;
      const colorClass = isCrit ? "crit" : "hit";
      const valueLabel = healMode ? "Cura" : "Dano";
      const applyAction = healMode ? "applyHeal" : "applyDamage";
      const applyIcon = healMode ? "fa-heart" : "fa-user-minus";
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

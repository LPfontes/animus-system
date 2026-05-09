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
   * @param {string} params.advantage - 'advantage', 'disadvantage' ou null
   * @param {Actor} params.speaker - O ator que está rolando
   */
  static async rollTest({ poolSize = 2, attributeValue = 0, label = "", advantage = null, speaker = null }) {
    // 1. Definir a fórmula usando a sintaxe nativa do Foundry (Keep Highest 2)
    const formula = `${poolSize}d6kh2 + ${attributeValue}`;
    const roll = await new Roll(formula).evaluate();

    // 2. Aplicar lógica Animus de Vantagem/Desvantagem nos dados rolados
    // No Foundry, kh2 já marca os 2 dados ativos com 'active: true'
    const dice = roll.dice[0];
    const results = dice.results;
    
    // Encontrar o maior dado entre os ativos
    const activeResults = results.filter(r => r.active).sort((a, b) => b.result - a.result);
    
    if (activeResults.length > 0) {
      const highestDie = activeResults[0];
      const isAdvantage = advantage === "advantage";
      const isDisadvantage = advantage === "disadvantage";

      if (isAdvantage && highestDie.result < 4) {
        // Vantagem: Piso 4 no maior dado
        highestDie.result = 4;
      } else if (isDisadvantage) {
        // Desvantagem: Teto 3 no maior dado (afeta todos se o maior for >= 3)
        // No Animus, desvantagem capar o maior em 3 significa que nenhum dado pode ser > 3
        results.forEach(r => {
          if (r.result > 3) r.result = 3;
        });
        // Após mudar os valores, precisamos garantir que o Foundry ainda está pegando os 2 maiores
        // mas como capamos tudo em 3, os maiores serão 3.
      }
    }

    // 3. Recalcular o total do Roll após as modificações manuais
    // O total é a soma dos dados ativos + modificadores numéricos
    const diceTotal = results.reduce((acc, r) => acc + (r.active ? r.result : 0), 0);
    const numericBonus = roll.terms.filter(t => t instanceof foundry.dice.terms.NumericTerm).reduce((acc, t) => acc + t.number, 0);
    roll._total = diceTotal + numericBonus;

    // 4. Verificar Crítico Natural (dois 6 originais antes da modificação?)
    // A regra diz "dois 6 naturais nos dados escolhidos".
    // Verificamos se há dois 6 nos resultados ativos.
    const naturalSixes = results.filter(r => r.active && r.result === 6).length;
    const isCritical = naturalSixes >= 2;

    // 5. Enviar para o chat usando o visual nativo do Foundry
    let flavor = `<b>${label}</b>`;
    if (advantage === "advantage") flavor += `<br><span style="color: #2ecc71; font-size: 0.8em;">[Vantagem]</span>`;
    if (advantage === "disadvantage") flavor += `<br><span style="color: #e74c3c; font-size: 0.8em;">[Desvantagem]</span>`;
    if (isCritical) flavor += `<br><strong style="color: #ffd700;">CRÍTICO NATURAL!</strong>`;

    return roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: speaker }),
      flavor: flavor,
      flags: { "animus.isCritical": isCritical }
    });
  }
}

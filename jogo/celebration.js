/* Plano de celebração de vitória (puro, testado em Node).
   Converte a faixa de prêmio (tier) em durações, quantidades e flags.
   A UI (game.js) apenas executa o plano. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TigerCelebration = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  // tier: { level, coins }. reduce: preferência de reduzir movimento.
  function plan(tier, { reduce = false, turbo = false, auto = false } = {}) {
    const lvl = tier.level;
    const countMs = reduce ? 600 : lvl >= 5 ? 4200 : lvl >= 4 ? 3400 : 2600;
    return {
      level: lvl,
      showOverlay: lvl >= 3,
      showRays: lvl >= 3 && !reduce,
      showMultiplier: lvl >= 4,
      countMs,
      boostMs: countMs + 1500, // música sobe um pouco além da contagem
      rainNow: lvl >= 3 ? tier.coins : 0,
      // ondas extras para níveis 4 e 5: [{ atMs, kind, n }]
      waves: lvl >= 4 ? [
        { atMs: 900, kind: 'rain', n: lvl >= 5 ? 60 : 30 },
        { atMs: 1800, kind: 'burst', n: lvl >= 5 ? 50 : 30 },
        ...(lvl >= 5 && !reduce ? [{ atMs: 2800, kind: 'burst', n: 40 }] : []),
      ] : [],
      // pausa após a contagem antes de fechar sozinho (toque também fecha)
      holdMs: reduce || turbo || auto ? 600 : 1500,
    };
  }

  // Multiplicador exibido: total / aposta (inteiro), só nos níveis que o mostram.
  function multiplierText(tier, total, bet) {
    return tier.level >= 4 && bet > 0 ? 'x' + Math.floor(total / bet) : '';
  }

  return { plan, multiplierText };
});

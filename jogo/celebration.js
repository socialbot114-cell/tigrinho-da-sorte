/* Plano de celebração de vitória (puro, testado em Node).
   Converte a faixa de prêmio (tier) em durações, quantidades e flags.
   A UI (game.js) apenas executa o plano. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TigerCelebration = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  // tier: { level, coins }. reduce: preferência de reduzir movimento.
  function plan(tier, { reduce = false, turbo = false, auto = false, config } = {}) {
    if (!config) throw new TypeError('celebration.plan exige celebrationConfig');
    const lvl = tier.level;
    const countMs = reduce ? config.REDUCED_COUNT_MS : lvl >= 5 ? config.SUPREME_COUNT_MS : lvl >= 4 ? config.MEGA_COUNT_MS : config.LARGE_COUNT_MS;
    // pausa após a contagem: curta em turbo/auto/movimento reduzido; por nível no normal
    const holdMs = reduce || turbo || auto ? config.FAST_HOLD_MS : lvl >= 5 ? config.SUPREME_HOLD_MS : lvl >= 4 ? config.MEGA_HOLD_MS : config.LARGE_HOLD_MS;
    return {
      level: lvl,
      showOverlay: lvl >= 3,
      showRays: lvl >= 3 && !reduce,
      showMultiplier: lvl >= 4,
      countMs,
      boostMs: countMs + config.BOOST_TAIL_MS, // música sobe um pouco além da contagem
      rainNow: lvl >= 3 ? tier.coins : 0,
      // ondas extras para níveis 4 e 5: [{ atMs, kind, n }]
      waves: lvl >= 4 ? [
        { atMs: config.SECOND_WAVE_MS, kind: 'rain', n: lvl >= 5 ? config.SUPREME_RAIN : config.MEGA_RAIN },
        { atMs: config.THIRD_WAVE_MS, kind: 'burst', n: lvl >= 5 ? config.SUPREME_BURST : config.MEGA_BURST },
        ...(lvl >= 5 && !reduce ? [{ atMs: config.FINAL_WAVE_MS, kind: 'burst', n: config.SUPREME_FINAL_BURST }] : []),
      ] : [],
      // pausa após a contagem antes de fechar sozinho (toque também fecha)
      holdMs,
      totalMs: countMs + holdMs, // duração até fechar sozinho (sem toque)
    };
  }

  // Multiplicador exibido: total / aposta (inteiro), só nos níveis que o mostram.
  function multiplierText(tier, total, bet) {
    return tier.level >= 4 && bet > 0 ? 'x' + Math.floor(total / bet) : '';
  }

  return { plan, multiplierText };
});

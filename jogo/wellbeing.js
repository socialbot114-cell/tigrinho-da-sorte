/* Bem-estar do jogador (Q3-10, Q3-11, Q3-12): limite de sessão, lembrete de pausa e autoexclusão local.
   Regras puras, sem DOM. Os prazos ficam no save e nunca são encurtados pela interface.
   Limite: a autoexclusão não pode ser cancelada antes do fim; só o tempo ou a limpeza do save liberam o jogo. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TigerWellbeing = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const SESSION_LIMITS = Object.freeze([0, 15, 30, 60]); // minutos; 0 = desligado (Q3-10)
  const EXCLUSIONS = Object.freeze({ '24h': 1, '7d': 7, '30d': 30 }); // dias (Q3-12)
  const PAUSE_MIN = 10; // pausa obrigatória ao atingir o limite de sessão
  const WARN_BEFORE_MIN = 2; // aviso antes do limite

  // Próximo valor do limite ao tocar no botão: 0 → 15 → 30 → 60 → 0.
  function nextLimit(current) {
    const i = SESSION_LIMITS.indexOf(current);
    return SESSION_LIMITS[(i + 1) % SESSION_LIMITS.length];
  }

  // Autoexclusão só cresce: o novo prazo vale se for maior que o atual.
  function exclusionUntil(current, now, choice, dayMs) {
    const days = EXCLUSIONS[choice];
    if (!days) return current || 0;
    return Math.max(current || 0, now + days * dayMs);
  }

  // Motivo do bloqueio no instante `now`, ou null. Autoexclusão tem prioridade sobre a pausa.
  function blockReason(wb, now) {
    if ((wb.excludeUntil || 0) > now) return 'exclusion';
    if ((wb.pauseUntil || 0) > now) return 'pause';
    return null;
  }

  // Situação da sessão a partir de quantos minutos jogou. 'warn' antes do limite; 'pause' ao atingi-lo.
  function sessionStatus(elapsedMin, limit) {
    if (!limit) return 'ok';
    if (elapsedMin >= limit) return 'pause';
    if (elapsedMin >= limit - WARN_BEFORE_MIN) return 'warn';
    return 'ok';
  }

  // Lembrete de pausa (Q3-11): dispara quando completa mais um intervalo de `every` minutos de sessão.
  function reminderDue(elapsedMin, lastMin, every) {
    return elapsedMin >= every && elapsedMin - lastMin >= every;
  }

  return { SESSION_LIMITS, EXCLUSIONS, PAUSE_MIN, WARN_BEFORE_MIN, nextLimit, exclusionUntil, blockReason, sessionStatus, reminderDue };
});

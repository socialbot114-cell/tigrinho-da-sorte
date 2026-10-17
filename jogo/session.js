/* Resumo da sessão (experiência): o que aconteceu nesta visita, sem metas de tempo e sem convite a continuar.
   Puro: recebe o instante atual e devolve números. Não grava nada no save (vale só enquanto a página estiver aberta).
   De propósito não mostra "maior prêmio", "melhor rodada" nem taxa de acerto: esses números incentivam caçar resultado. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TigerSession = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  function start(now) {
    return { startedAt: now, rounds: 0, prizeRounds: 0, newItems: [] };
  }

  // Conta a rodada. total > 0 significa que a rodada teve prêmio; o valor não é guardado.
  function recordRound(session, { total }) {
    session.rounds += 1;
    if (total > 0) session.prizeRounds += 1;
    return session;
  }

  // Itens da coleção desbloqueados nesta sessão, sem repetir.
  function recordItems(session, ids) {
    for (const id of ids) if (!session.newItems.includes(id)) session.newItems.push(id);
    return session;
  }

  function summarize(session, now) {
    const minutes = Math.max(0, Math.floor((now - session.startedAt) / 60000));
    return {
      minutes,
      rounds: session.rounds,
      prizeRounds: session.prizeRounds,
      newItems: [...session.newItems],
    };
  }

  return { start, recordRound, recordItems, summarize };
});

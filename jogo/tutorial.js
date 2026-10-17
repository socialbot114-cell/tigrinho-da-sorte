/* Tutorial de primeiro uso (Q3-01): quatro passos curtos, em torno de 60 segundos no total.
   Só lê o estado: nunca altera saldo, aposta, giros ou gera rodada. Conteúdo puro: guarda chaves de jogo/i18n/*.js. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TigerTutorial = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const STEPS = Object.freeze([
    { title: 'tut.1.title', text: 'tut.1.text' },
    { title: 'tut.2.title', text: 'tut.2.text' },
    { title: 'tut.3.title', text: 'tut.3.text' },
    { title: 'tut.4.title', text: 'tut.4.text' },
  ]);

  const isLast = (index) => index >= STEPS.length - 1;

  // Dicas contextuais (Q3-02): cada tipo aparece uma única vez e fica registrado em seen.tips do save.
  const TIPS = Object.freeze({
    respin: 'tip.respin',
    tiers: 'tip.tiers',
    firstSpin: 'tip.firstSpin',
  });

  return { STEPS, isLast, TIPS };
});

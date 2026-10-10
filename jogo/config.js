/* Tigrinho da Sorte — configuração centralizada.
   Inspirado em src/utils/config.ts do projeto groangroan/slot-game (MIT),
   adaptado para as regras/arte originais do Tigrinho (vanilla JS + SVG).
   Valores do Tigrinho têm precedência; nomes seguem o slot-game onde faz sentido. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TigerConfig = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  // Rolos: espelha reelsConfig do slot-game, com timings calibrados p/ DOM+CSS.
  const reelsConfig = {
    GRID_SIZE: 3,
    SYMBOL_SIZE: 112, // px máx. da célula (var --cell); referência Pixi usava 200
    SPIN_DURATION: 850, // ms base (slot-game: 3200 p/ Pixi; DOM usa transição CSS mais curta)
    REEL_OFFSET_TIME: 300, // ms extras por coluna (slot-game: 200)
    TURBO_SPIN_DURATION: 380,
    TURBO_OFFSET_TIME: 110,
    ANTICIPATION_EXTRA: 900, // ms extras no 3º rolo quando há wild nos 2 primeiros
    BLUR_PX: 1.4, // blur durante o giro (slot-game usa BlurFilter strength 7 no Pixi)
    FILLER_DIVISOR: 85, // filler = dur / 85 + c*2 (herdado do game.js original)
    SYMBOL_PREFIX: 's-', // prefixo dos <symbol> SVG inline (slot-game usa "sym")
  };

  // Apostas/saldo: valores do Tigrinho (fichas fictícias).
  const betConfig = {
    BETS: [5, 10, 25, 50, 100, 250, 500],
    DEFAULT_BET: 10,
    START_CHIPS: 10000,
    DAILY_BONUS: 2000,
    REFILL_CHIPS: 1500,
    // Referência slot-game: { BET: 2, BALANCE: 100, SYMBOL_VALUE: 1 }
    SYMBOL_VALUE: 1,
  };

  // Design/UI: espelha designConfig do slot-game.
  const designConfig = {
    ui: {
      height: 120,
      textStyle: { fill: '#fff', fontSize: 24, fontFamily: 'Arial' },
    },
    colors: {
      primary: '#7a0c14',
      secondary: '#ffd24a',
      accent: '#2a0408',
    },
    // Escala responsiva portada de helpers.calculateScale do slot-game,
    // mapeada para a largura da coluna do Tigrinho.
    scaleBreakpoints: [
      { minWidth: 1280, scale: 1.0 },
      { minWidth: 1024, scale: 0.85 },
      { minWidth: 480, scale: 0.75 },
      { minWidth: 0, scale: 0.5 },
    ],
  };

  // Vitória grande: tiers originais do Tigrinho (ratio total/aposta).
  const bigWinConfig = {
    TIERS: [
      { min: 60, name: 'VITÓRIA SUPREMA!', coins: 120 },
      { min: 25, name: 'MEGA VITÓRIA!', coins: 80 },
      { min: 10, name: 'GRANDE VITÓRIA!', coins: 50 },
    ],
  };

  function calculateScale(screenWidth) {
    // Portado de src/utils/helpers.ts do slot-game.
    if (screenWidth >= 1280) return 1.0;
    if (screenWidth >= 1024) return 0.85;
    if (screenWidth >= 480) return 0.75;
    return 0.5;
  }

  return { reelsConfig, betConfig, designConfig, bigWinConfig, calculateScale };
});

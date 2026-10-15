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
    MIN_FILLER: 4,
    REDUCED_MOTION_SCALE: 0.25,
    TICK_INTERVAL_MS: 70,
    HITSTOP_MS: 90,
    SETTLE_POP_MS: 450,
    SETTLE_OVERSHOOT: 0.06, // quique ao assentar, em fração da altura da célula (Q: feeling dos rolos)
    WIN_HOP_MS: 90, // atraso entre símbolos da mesma linha ao pularem em sequência
    WIN_LINE_HOLD_MS: 420,
    WIN_LINE_HOLD_REDUCED_MS: 150,
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

  function calculateScale(screenWidth) {
    // Portado de src/utils/helpers.ts do slot-game.
    if (screenWidth >= 1280) return 1.0;
    if (screenWidth >= 1024) return 0.85;
    if (screenWidth >= 480) return 0.75;
    return 0.5;
  }

  // Economia e tempos de jogo (Q1-09): nenhum número mágico no game.js.
  const gameConfig = {
    REMIND_EVERY_MIN: 30, // lembrete de pausa, sem contagem regressiva
    LEVEL_BONUS_BASE: 500,
    DAILY_STREAK_STEP: 500,
    DAILY_STREAK_DAYS: 7,
    COUNT_SOUND_STEPS: 14,
    WIN_COUNT_MS: 700,
    WIN_COUNT_REDUCED_MS: 200,
    POST_WIN_STEP_MS: 650,
    POST_WIN_STEP_REDUCED_MS: 100,
    POST_WIN_STEP_TURBO_MS: 250,
    AUTO_SPINS: 25,
    AUTO_DELAY_MS: 700,
    AUTO_TURBO_DELAY_MS: 250,
    RESPIN_PAUSE_MS: 700,
    RESPIN_PAUSE_REDUCED_MS: 100,
    OVERLAY_SKIP_CLOSE_MS: 150,
    HIGHLIGHT_CLEAR_MS: 2000,
    MACHINE_SWEEP_MS: 1000,
    BALANCE_POP_MS: 300,
    SESSION_MINUTE_MS: 60000,
    SESSION_REMINDER_TOAST_MS: 3500,
    DAY_MS: 86400000,
    TURBO_TOAST_MS: 900,
    BIG_SPEECH_MS: 3000,
    INTERRUPTED_TOAST_MS: 3000,
    BOOT_FADE_MS: 500,
    SPLASH_EXIT_MS: 350,
    IDLE_BUBBLE_DELAY_MS: 600,
    BOOT_IDLE_BUBBLE_MS: 3000,
    ORIENTATION_RETRY_MS: 60,
    SHORT_LANDSCAPE_HEIGHT: 500,
    TOAST_MS: 1800,
    HISTORY_LIMIT: 50, // rodadas guardadas no histórico local (Q3-09)
    LAYER_MS: 1800, // quanto tempo a camada de instrumentos do prêmio fica ativa (Q3-07)
    TIP_DELAY_MS: 1400, // a dica espera o aviso do respin/vitória sair da tela
    TIP_TOAST_MS: 3200,
    BUBBLE_MS: 2200,
    LEVEL_TOAST_MS: 2600,
    THEME_UNLOCK_TOAST_DELAY_MS: 2700,
    SPIN_INTRO_BUBBLE_MS: 800,
    XP_START: 100,
    XP_LEVEL_STEP: 80,
    MISSION_GROWTH_FACTOR: 2,
    WIN_RATIO_BIG: 10,
    WIN_RATIO_SOUND_SCALE: 4,
    WIN_STEP_BURST_BASE: 8,
    WIN_STEP_BURST_RATIO: 3,
    WIN_STEP_BURST_CAP: 40,
    WIN_BALANCE_COUNT_MS: 700,
    WIN_BALANCE_COUNT_REDUCED_MS: 200,
    WIN_DISPLAY_POP_SCALE: 1.15,
  };

  const celebrationConfig = {
    REDUCED_COUNT_MS: 600,
    // Q3-06: duração total = contagem + pausa. Meta: nível 3 < 2,5 s; nível 5 < 4 s.
    LARGE_COUNT_MS: 1400,
    MEGA_COUNT_MS: 2000,
    SUPREME_COUNT_MS: 2600,
    BOOST_TAIL_MS: 1500,
    LARGE_HOLD_MS: 900,
    MEGA_HOLD_MS: 1000,
    SUPREME_HOLD_MS: 1100,
    FAST_HOLD_MS: 600,
    MEGA_RAIN: 30,
    SUPREME_RAIN: 60,
    MEGA_BURST: 30,
    SUPREME_BURST: 50,
    SUPREME_FINAL_BURST: 40,
    SECOND_WAVE_MS: 900,
    THIRD_WAVE_MS: 1800,
    FINAL_WAVE_MS: 2800,
  };

  return { reelsConfig, betConfig, designConfig, gameConfig, celebrationConfig, calculateScale };
});

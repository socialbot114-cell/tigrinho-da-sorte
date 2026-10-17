/* Motor de regras do TIGRINHO — fichas fictícias, sem valor monetário.
   Puro (sem DOM) para ser testado em Node e usado no navegador. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./config.js').betConfig);
  else root.TigerEngine = factory(root.TigerConfig.betConfig);
})(typeof self !== 'undefined' ? self : this, function (betConfig) {
  // pay = multiplicador sobre a aposta da linha (aposta total / 5)
  const SYMBOLS = [
    { id: 'wild',    name: 'sym.wild',    weight: 4,  pay: 60 },
    { id: 'envelope',name: 'sym.envelope',     weight: 6,  pay: 25 },
    { id: 'ingot',   name: 'sym.ingot',      weight: 8,  pay: 15 },
    { id: 'bag',     name: 'sym.bag',weight: 11, pay: 9  },
    { id: 'orange',  name: 'sym.orange',    weight: 15, pay: 5  },
    { id: 'cracker', name: 'sym.cracker',       weight: 20, pay: 3  },
    { id: 'lantern', name: 'sym.lantern',     weight: 26, pay: 2  },
  ];
  const LINES = [[0,0,0],[1,1,1],[2,2,2],[0,1,2],[2,1,0]]; // linha de cada coluna
  const BETS = betConfig.BETS;
  const MAX_RESPINS = 3;
  const TOTAL_W = SYMBOLS.reduce((a, s) => a + s.weight, 0);
  const BY_ID = Object.fromEntries(SYMBOLS.map(s => [s.id, s]));

  function randomSymbol(rand) {
    let r = rand() * TOTAL_W;
    for (const s of SYMBOLS) { if ((r -= s.weight) < 0) return s.id; }
    return SYMBOLS[SYMBOLS.length - 1].id;
  }

  // grade[coluna][linha]; locked = conjunto "c,r" de curingas travados
  function spinGrid(rand, locked) {
    const g = [];
    for (let c = 0; c < 3; c++) {
      g.push([]);
      for (let r = 0; r < 3; r++) g[c].push(locked && locked.has(c + ',' + r) ? 'wild' : randomSymbol(rand));
    }
    return g;
  }

  function evaluate(grid, bet) {
    const lineBet = bet / 5, wins = [];
    LINES.forEach((line, i) => {
      const syms = line.map((row, c) => grid[c][row]);
      const base = syms.filter(s => s !== 'wild');
      let id = null;
      if (base.length === 0) id = 'wild';
      else if (base.every(s => s === base[0])) id = base[0];
      if (id) wins.push({ line: i, cells: line.map((row, c) => [c, row]), symbol: id,
                          wilds: syms.filter(s => s === 'wild').length, payout: BY_ID[id].pay * lineBet });
    });
    return { wins, total: wins.reduce((a, w) => a + w.payout, 0) };
  }

  // Uma rodada completa: giro inicial + até 3 respins gratuitos com curingas travados.
  function playRound(rand, bet) {
    const steps = []; let locked = new Set(), total = 0;
    for (let n = 0; n <= MAX_RESPINS; n++) {
      const grid = spinGrid(rand, locked), ev = evaluate(grid, bet);
      total += ev.total;
      steps.push({ grid, locked: [...locked], wins: ev.wins, payout: ev.total, respin: n > 0 });
      const wilds = new Set();
      grid.forEach((col, c) => col.forEach((s, r) => { if (s === 'wild') wilds.add(c + ',' + r); }));
      if (wilds.size === 0 || wilds.size === locked.size || wilds.size === 9 || n === MAX_RESPINS) break;
      locked = wilds;
    }
    return { steps, total, bet };
  }

  // Liquidação fictícia pura: validar antes de alterar estado ou iniciar animações.
  function settleRound(balance, bet, round) {
    if (!Number.isFinite(balance) || balance < 0) throw new RangeError('Saldo inválido');
    if (!BETS.includes(bet) || balance < bet) throw new RangeError('Aposta inválida ou saldo insuficiente');
    if (!round || !Number.isFinite(round.total) || round.total < 0 || round.bet !== bet) throw new TypeError('Resultado de rodada inválido');
    return Object.freeze({ before: balance, bet, payout: round.total, net: round.total - bet, balance: balance + round.total - bet });
  }

  // Tiers de celebração, pela razão total/aposta. Puro: a UI só apresenta.
  // level 0 = sem prêmio; 1 pequena; 2 média; 3 grande; 4 mega; 5 suprema.
  const PRIZE_TIERS = [
    { min: 60, level: 5, id: 'suprema', name: 'tier.suprema', coins: 120 },
    { min: 25, level: 4, id: 'mega', name: 'tier.mega', coins: 80 },
    { min: 10, level: 3, id: 'grande', name: 'tier.grande', coins: 50 },
    { min: 4, level: 2, id: 'media', name: 'tier.media', coins: 14 },
    { min: 0.0001, level: 1, id: 'pequena', name: '', coins: 0 },
  ];
  function prizeTier(ratio) {
    if (!(ratio > 0)) return { level: 0, id: 'nenhuma', name: '', coins: 0 };
    return PRIZE_TIERS.find((t) => ratio >= t.min);
  }

  // Cálculo puro; parâmetros econômicos vêm de config.betConfig/gameConfig.
  function dailyReward(streak, base, step, maxDays) {
    if (![base, step, maxDays].every(Number.isFinite) || base < 0 || step < 0 || maxDays < 1) {
      throw new TypeError('dailyReward exige base, step e maxDays válidos');
    }
    const d = Math.min(Math.max(1, Math.floor(streak || 1)), Math.floor(maxDays));
    return base + step * (d - 1);
  }
  // Sequência: se o último bônus foi ontem, soma; se foi hoje, mantém.
  // Folga (Q-experiência): se faltou só um dia (último bônus anteontem), a sequência não zera.
  // Sem folga, recomeça do dia 1.
  function nextStreak(lastDay, today, yesterday, streak, maxDays, twoDaysAgo) {
    if (!Number.isFinite(maxDays) || maxDays < 1) throw new TypeError('nextStreak exige maxDays válido');
    const cap = Math.floor(maxDays);
    if (lastDay === today) return Math.min(streak || 1, cap);
    if (lastDay === yesterday) return Math.min((streak || 0) + 1, cap);
    if (lastDay && lastDay === twoDaysAgo && (streak || 0) >= 2) return Math.min(streak, cap);
    return 1;
  }

  return { SYMBOLS, LINES, BETS, MAX_RESPINS, BY_ID, randomSymbol, spinGrid, evaluate, playRound, settleRound,
           PRIZE_TIERS, prizeTier, dailyReward, nextStreak };
});

/* Motor de regras do Tigrinho — fichas fictícias, sem valor monetário.
   Puro (sem DOM) para ser testado em Node e usado no navegador. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TigerEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  // pay = multiplicador sobre a aposta da linha (aposta total / 5)
  const SYMBOLS = [
    { id: 'wild',    name: 'Tigre',        weight: 4,  pay: 60 },
    { id: 'envelope',name: 'Envelope',     weight: 6,  pay: 25 },
    { id: 'ingot',   name: 'Lingote',      weight: 8,  pay: 15 },
    { id: 'bag',     name: 'Saco da Sorte',weight: 11, pay: 9  },
    { id: 'orange',  name: 'Tangerina',    weight: 15, pay: 5  },
    { id: 'cracker', name: 'Rojões',       weight: 20, pay: 3  },
    { id: 'lantern', name: 'Lanterna',     weight: 26, pay: 2  },
  ];
  const LINES = [[0,0,0],[1,1,1],[2,2,2],[0,1,2],[2,1,0]]; // linha de cada coluna
  const BETS = [5, 10, 25, 50, 100, 250, 500];
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

  return { SYMBOLS, LINES, BETS, MAX_RESPINS, BY_ID, randomSymbol, spinGrid, evaluate, playRound };
});

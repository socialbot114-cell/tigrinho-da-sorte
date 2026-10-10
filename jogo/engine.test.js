// node jogo/engine.test.js — valida regras, config e padrões portados do slot-game.
// Roda em Linux e macOS (CI). N overdridable: N=200000 npm test -- ou CI_FAST=1.
const E = require('./engine.js');
const C = require('./config.js');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const g = (a, b, c) => [[a[0], a[1], a[2]], [b[0], b[1], b[2]], [c[0], c[1], c[2]]];
let passed = 0;
const ok = (name, fn) => { fn(); passed++; console.log(`ok - ${name}`); };

// --- regras originais do Tigrinho (regressão) ---
ok('linha do meio 3 laranjas paga 100 em aposta 100', () => {
  assert.strictEqual(E.evaluate(g(['bag', 'orange', 'bag'], ['lantern', 'orange', 'bag'], ['bag', 'orange', 'cracker']), 100).total, 100);
});
ok('curinga substitui', () => {
  assert.strictEqual(E.evaluate(g(['bag', 'wild', 'bag'], ['lantern', 'orange', 'bag'], ['bag', 'orange', 'cracker']), 100).wins[0].symbol, 'orange');
});
ok('sem combinação paga 0', () => {
  assert.strictEqual(E.evaluate(g(['bag', 'orange', 'bag'], ['lantern', 'cracker', 'ingot'], ['envelope', 'bag', 'cracker']), 100).total, 0);
});
ok('nove curingas = 5 linhas x 60 x 20', () => {
  assert.strictEqual(E.evaluate(g(['wild', 'wild', 'wild'], ['wild', 'wild', 'wild'], ['wild', 'wild', 'wild']), 100).total, 6000);
});

// --- respin com curingas travados ---
ok('locked wild permanece no respin', () => {
  const locked = new Set(['0,0']);
  const grid = E.spinGrid(() => 0.999, locked);
  assert.strictEqual(grid[0][0], 'wild');
});
ok('playRound nunca passa de MAX_RESPINS+1 steps', () => {
  for (let i = 0; i < 2000; i++) {
    const r = E.playRound(Math.random, 100);
    assert(r.steps.length >= 1 && r.steps.length <= E.MAX_RESPINS + 1, 'steps fora do limite');
    assert.strictEqual(r.total, r.steps.reduce((a, s) => a + s.payout, 0));
  }
});
ok('playRound determinístico com rand fixo', () => {
  const r1 = E.playRound(() => 0.5, 50);
  const r2 = E.playRound(() => 0.5, 50);
  assert.deepStrictEqual(r1, r2);
});

// --- config central (portada de slot-game config.ts) ---
ok('config reels/bet/design presentes', () => {
  assert.strictEqual(C.reelsConfig.GRID_SIZE, 3);
  assert.strictEqual(C.reelsConfig.REEL_OFFSET_TIME, 300);
  assert.ok(C.reelsConfig.SPIN_DURATION > 0);
  assert.deepStrictEqual(C.betConfig.BETS, [5, 10, 25, 50, 100, 250, 500]);
  assert.strictEqual(C.betConfig.START_CHIPS, 10000);
  assert.strictEqual(C.designConfig.ui.height, 120);
});
ok('calculateScale espelha helpers do slot-game', () => {
  assert.strictEqual(C.calculateScale(1280), 1.0);
  assert.strictEqual(C.calculateScale(1024), 0.85);
  assert.strictEqual(C.calculateScale(480), 0.75);
  assert.strictEqual(C.calculateScale(320), 0.5);
});
ok('engine BETS confere com config', () => {
  assert.deepStrictEqual(E.BETS, C.betConfig.BETS);
});

// --- assets.json válido ---
ok('assets.json válido com 9 símbolos inline', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'assets.json'), 'utf8'));
  const syms = manifest.bundles.find((b) => b.name === 'tigre-symbols');
  assert(syms && syms.assets.length === 9, 'esperava 9 símbolos');
});

// --- RTP teórico (amostragem; limite 92–98%) ---
const N = process.env.CI_FAST ? 200000 : (process.argv.includes('--small') ? 200000 : 1000000);
let paid = 0;
for (let i = 0; i < N; i++) paid += E.playRound(Math.random, 100).total;
const rtp = paid / (N * 100);
console.log(`RTP ${(rtp * 100).toFixed(2)}% (N=${N})`);
assert(rtp > 0.92 && rtp < 0.98, `RTP fora do esperado: ${rtp}`);
passed++;
console.log(`OK - ${passed} checks passed`);

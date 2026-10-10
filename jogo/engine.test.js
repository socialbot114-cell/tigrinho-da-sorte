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
ok('assets.json válido com 11 símbolos inline', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'assets.json'), 'utf8'));
  const syms = manifest.bundles.find((b) => b.name === 'caramelo-symbols');
  assert(syms && syms.assets.length === 11, 'esperava 11 símbolos');
  const font = path.join(__dirname, 'fonts', 'Bangers-Regular.ttf');
  assert(fs.existsSync(font) && fs.existsSync(font.replace('Bangers-Regular.ttf', 'OFL.txt')), 'fonte/licença ausentes');
});

// --- tiers de prêmio e bônus diário (ciclo de recompensa) ---
ok('tiers de prêmio por razão', () => {
  assert.strictEqual(E.prizeTier(0).level, 0);
  assert.strictEqual(E.prizeTier(1).level, 1);
  assert.strictEqual(E.prizeTier(4).level, 2);
  assert.strictEqual(E.prizeTier(9.99).level, 2);
  assert.strictEqual(E.prizeTier(10).level, 3);
  assert.strictEqual(E.prizeTier(25).level, 4);
  assert.strictEqual(E.prizeTier(60).level, 5);
  assert.strictEqual(E.prizeTier(500).id, 'suprema');
});
ok('bônus diário cresce com a sequência e tem teto no 7º dia', () => {
  assert.strictEqual(E.dailyReward(1), 2000);
  assert.strictEqual(E.dailyReward(3), 3000);
  assert.strictEqual(E.dailyReward(7), 5000);
  assert.strictEqual(E.dailyReward(30), 5000);
});
ok('sequência: ontem soma, hoje mantém, pular dia recomeça', () => {
  assert.strictEqual(E.nextStreak('d1', 'd2', 'd1', 3), 4);
  assert.strictEqual(E.nextStreak('d2', 'd2', 'd1', 4), 4);
  assert.strictEqual(E.nextStreak('d0', 'd2', 'd1', 4), 1);
  assert.strictEqual(E.nextStreak('', 'd2', 'd1', 0), 1);
});

// --- save versionado (Q1-07) ---
const SAVE = require('./save.js');
function fakeStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), _m: m };
}
ok('save: sem nada salvo começa do zero com saldo inicial', () => {
  const s = SAVE.load(fakeStorage(), false, 10000);
  assert.strictEqual(s.balance, 10000);
  assert.strictEqual(s.v, 2);
});
ok('save: migra v1 para v2 e mantém progresso', () => {
  const v1 = { balance: 4321, bet: 25, xp: 7, level: 3, theme: 'jade', streak: 2, lastDaily: 'Mon', stats: { spins: 9, wins: 3, wilds: 1, bigs: 0, best: 300 }, m: { spins: { tier: 1, start: 20 } }, set: { music: false, sfx: true, vib: true, reduce: false } };
  const st = fakeStorage({ [SAVE.KEY_V1]: JSON.stringify(v1) });
  const s = SAVE.load(st, false, 10000);
  assert.strictEqual(s.balance, 4321); assert.strictEqual(s.bet, 25); assert.strictEqual(s.level, 3);
  assert.strictEqual(s.stats.best, 300); assert.strictEqual(s.m.spins.tier, 1); assert.strictEqual(s.set.music, false);
  SAVE.write(st, s);
  assert(st._m.has(SAVE.KEY_V2), 'escrita deve ir para v2');
  assert(st._m.has(SAVE.KEY_V1), 'v1 não é apagado (rollback)');
});
ok('save: JSON corrompido cai para padrão sem lançar erro', () => {
  const s = SAVE.load(fakeStorage({ [SAVE.KEY_V2]: '{quebrado' }), false, 10000);
  assert.strictEqual(s.balance, 10000);
});
ok('save: valores inválidos são saneados (aposta fora da lista, saldo negativo, tema desconhecido)', () => {
  const s = SAVE.migrate({ balance: -5, bet: 7, theme: 'xyz', level: 0, stats: { spins: 'x' } }, false, 10000);
  assert.strictEqual(s.balance, 10000);
  assert.strictEqual(s.bet, 10);
  assert.strictEqual(s.theme, 'red');
  assert.strictEqual(s.level, 1);
  assert.strictEqual(s.stats.spins, 0);
});
ok('save: preferência de reduzir movimento do sistema vale só se não houver escolha salva', () => {
  assert.strictEqual(SAVE.migrate({}, true, 10000).set.reduce, true);
  assert.strictEqual(SAVE.migrate({ set: { reduce: false } }, true, 10000).set.reduce, false);
});

// --- configuração de jogo (Q1-09) e hook de teste (Q1-08) ---
ok('gameConfig central tem economia e lembrete', () => {
  assert.strictEqual(C.gameConfig.START_CHIPS, 10000);
  assert.strictEqual(C.gameConfig.REFILL_CHIPS, 1500);
  assert.strictEqual(C.gameConfig.REMIND_EVERY_MIN, 30);
});
ok('game.js expõe o hook de teste só com ?test=1', () => {
  const src = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');
  assert(/TEST_MODE\) window\.__tigrinho/.test(src), 'window.__tigrinho sem gate');
  assert(/test=1/.test(src), 'gate ?test=1 ausente');
});

// --- HTML: ids obrigatórios da interface (tela inicial, rolos, HUD, mascote) ---
ok('index.html contém ids e símbolos obrigatórios', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  for (const id of ['splash', 'start', 'reels', 'spin', 'btnSound', 'boot', 'rotateHint', 'modal', 'bigwin', 'mascot', 'id="s-dog"', 'id="s-mascot"', 'id="s-portico"', 'Fichas fictícias', 'save.js', 'effects.js']) {
    assert(html.includes(id), 'index.html sem ' + id);
  }
  assert(!/tigre|tiger/i.test(html.replace(/TigerEngine|TigerConfig/g, '')), 'resto de nome antigo no HTML');
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

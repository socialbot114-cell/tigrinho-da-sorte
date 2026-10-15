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
ok('settleRound liquida prêmio e perda uma vez sem mutar entrada', () => {
  const winRound = { bet: 10, total: 35 }, lossRound = { bet: 10, total: 0 };
  const win = E.settleRound(100, 10, winRound), loss = E.settleRound(100, 10, lossRound);
  assert.deepStrictEqual(win, { before: 100, bet: 10, payout: 35, net: 25, balance: 125 });
  assert.deepStrictEqual(loss, { before: 100, bet: 10, payout: 0, net: -10, balance: 90 });
  assert.deepStrictEqual(winRound, { bet: 10, total: 35 });
  assert(Object.isFrozen(win));
});
ok('settleRound rejeita saldo, aposta e resultado inconsistentes', () => {
  assert.throws(() => E.settleRound(-1, 10, { bet: 10, total: 0 }), RangeError);
  assert.throws(() => E.settleRound(5, 10, { bet: 10, total: 0 }), RangeError);
  assert.throws(() => E.settleRound(50, 7, { bet: 7, total: 0 }), RangeError);
  assert.throws(() => E.settleRound(50, 10, { bet: 5, total: 1 }), TypeError);
  assert.throws(() => E.settleRound(50, 10, { bet: 10, total: NaN }), TypeError);
});

// --- config central (portada de slot-game config.ts) ---
ok('config reels/bet/design presentes', () => {
  assert.strictEqual(C.reelsConfig.GRID_SIZE, 3);
  assert.strictEqual(C.reelsConfig.REEL_OFFSET_TIME, 300);
  assert.strictEqual(C.reelsConfig.REDUCED_MOTION_SCALE, 0.25);
  assert.strictEqual(C.reelsConfig.MIN_FILLER, 4);
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
ok('assets.json válido com 15 símbolos e partes inline', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'assets.json'), 'utf8'));
  const syms = manifest.bundles.find((b) => b.name === 'caramelo-symbols');
  assert(syms && syms.assets.length === 15, 'esperava 15 símbolos e partes');
  const font = path.join(__dirname, 'fonts', 'Bangers-Regular.ttf');
  assert(fs.existsSync(font) && fs.existsSync(font.replace('Bangers-Regular.ttf', 'OFL.txt')), 'fonte/licença ausentes');
  assert(fs.existsSync(path.join(__dirname, 'icon.svg')) && fs.existsSync(path.join(__dirname, 'icon-512.png')), 'ícones PWA ausentes');
});

// --- Q2-08: ícone 1024 para a loja e para o manifesto (sem transparência) ---
ok('ícone 1024 é PNG RGB 1024x1024 e está no manifesto', () => {
  const png = fs.readFileSync(path.join(__dirname, 'icon-1024.png'));
  assert.strictEqual(png.readUInt32BE(16), 1024, 'largura');
  assert.strictEqual(png.readUInt32BE(20), 1024, 'altura');
  assert.strictEqual(png[25], 2, 'color type deve ser RGB (2), sem alfa');
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
  assert(manifest.icons.some((i) => i.src === 'icon-1024.png' && i.sizes === '1024x1024'), 'manifesto sem icon-1024.png');
  assert(!/rx="112"/.test(fs.readFileSync(path.join(__dirname, 'icon-1024.svg'), 'utf8')), 'variante 1024 ainda tem cantos arredondados');
});

// --- Q3-01/Q3-02: tutorial de primeiro uso e dicas vistas no save ---
const T = require('./tutorial.js');
ok('tutorial: quatro passos com título e texto; isLast só no último', () => {
  assert.strictEqual(T.STEPS.length, 4);
  assert(T.STEPS.every((s) => s.title && s.text), 'passo sem título ou texto');
  assert.strictEqual(T.isLast(2), false);
  assert.strictEqual(T.isLast(3), true);
});
ok('save: tutorial começa não visto e dicas são validadas e limitadas', () => {
  const S = require('./save.js');
  assert.strictEqual(S.defaults(false).seen.tutorial, false);
  const m = S.migrate({ seen: { tutorial: true, tips: ['respin', 'x'.repeat(50), 7] } }, false);
  assert.strictEqual(m.seen.tutorial, true);
  assert.deepStrictEqual(m.seen.tips, ['respin']);
});

// --- Q3-03: missões de rodízio (diárias e semanais) ---
const PR = require('./progression.js');
const SV = require('./save.js');
ok('rodízio: escolha determinística, três missões distintas por período', () => {
  const a = PR.pickRotation('daily', '2026-10-14'), b = PR.pickRotation('daily', '2026-10-14');
  assert.deepStrictEqual(a.map((m) => m.id), b.map((m) => m.id));
  assert.strictEqual(a.length, 3);
  assert.strictEqual(new Set(a.map((m) => m.id)).size, 3);
  assert(a.every((m) => m.targets.includes(m.goal)), 'meta fora das opções');
});
ok('rodízio: diárias renovam à meia-noite local e zeram o resgate; semana começa na segunda', () => {
  const s = SV.defaults(false);
  PR.refreshRotations(s, new Date(2026, 9, 13, 23, 59));
  assert.strictEqual(s.rot.daily.key, '2026-10-13');
  s.stats.spins = 14; s.rot.daily.claimed.push('d-spins');
  PR.refreshRotations(s, new Date(2026, 9, 14, 0, 0));
  assert.strictEqual(s.rot.daily.key, '2026-10-14');
  assert.strictEqual(s.rot.daily.start.spins, 14, 'partida deve ser o total atual');
  assert.deepStrictEqual(s.rot.daily.claimed, []);
  const monday = new Date(2026, 9, 12), sunday = new Date(2026, 9, 11);
  assert.strictEqual(PR.weekKey(monday), '2026-10-12');
  assert.strictEqual(PR.weekKey(sunday), '2026-10-05', 'domingo pertence à semana que começou na segunda anterior');
});
ok('rodízio: resgate paga uma vez e só depois de atingir a meta', () => {
  const s = SV.defaults(false), now = new Date(2026, 9, 14, 10);
  PR.refreshRotations(s, now);
  const m = PR.pickRotation('daily', s.rot.daily.key)[0];
  assert.strictEqual(PR.claimRotation(s, 'daily', m.id).reason, 'incomplete');
  s.stats[m.stat] = s.rot.daily.start[m.stat] + m.goal;
  const before = s.balance;
  const first = PR.claimRotation(s, 'daily', m.id);
  assert.deepStrictEqual([first.claimed, first.reward], [true, m.reward]);
  assert.strictEqual(s.balance, before + m.reward);
  assert.strictEqual(PR.claimRotation(s, 'daily', m.id).reason, 'claimed');
  assert.strictEqual(s.balance, before + m.reward, 'não pode pagar duas vezes');
});
ok('save: rodízio inválido é descartado e claimed é limitado', () => {
  const m = SV.migrate({ rot: { daily: { key: 'x'.repeat(20), start: { spins: -5 }, claimed: [1, 'd-spins'] } } }, false);
  assert.strictEqual(m.rot.daily.key, '');
  assert.strictEqual(m.rot.daily.start.spins, 0);
  assert.deepStrictEqual(m.rot.daily.claimed, ['d-spins']);
  assert.deepStrictEqual(Object.keys(m.rot), ['daily', 'weekly']);
});

// --- Experiência: resumo da sessão, cartão de vitória, missões de descoberta e metas da coleção ---
const SESS = require('./session.js');
const SHARE = require('./share-card.js');
ok('sessão: conta rodadas e rodadas com prêmio, sem valores nem comparação com a melhor rodada', () => {
  const s = SESS.start(1000000);
  SESS.recordRound(s, { total: 0 }); SESS.recordRound(s, { total: 250 }); SESS.recordRound(s, { total: 40 });
  SESS.recordItems(s, ['laco', 'laco', 'flor']);
  const sum = SESS.summarize(s, 1000000 + 125 * 60000);
  assert.deepStrictEqual(sum, { minutes: 125, rounds: 3, prizeRounds: 2, newItems: ['laco', 'flor'] });
  assert(!('bestWin' in sum) && !('winRate' in sum), 'não expõe melhor rodada nem taxa de acerto');
});
ok('cartão de vitória: partes dentro da moldura, em ordem e sem sobreposição', () => {
  const L = SHARE.layout();
  assert(L.title.y < L.mascot.y, 'título acima do mascote');
  assert(L.mascot.x >= 0 && L.mascot.x + L.mascot.w <= L.width, 'mascote dentro da largura');
  assert(L.mascot.y + L.mascot.h < L.amount.y - L.amount.size / 2, 'mascote não encosta no valor');
  assert(L.amount.y < L.caption.y && L.caption.y < L.subtitle.y && L.subtitle.y < L.footer.y, 'textos em ordem');
  assert(L.footer.y + L.footer.size / 2 < L.height - 28, 'rodapé dentro da moldura dourada');
  assert.deepStrictEqual([...SHARE.visibleCosmetics(['laco', 'oculos'])].sort(), ['cos-laco', 'cos-oculos']);
});
ok('missões de descoberta: turbo e troca de aposta entram no rodízio diário e contam nas estatísticas', () => {
  const PR2 = require('./progression.js');
  const SV2 = require('./save.js');
  const daily = PR2.ROTATION_POOLS.daily.map((m) => m.stat);
  assert(daily.includes('turbo') && daily.includes('betChanges'), 'faltam as missões de descoberta');
  const s = SV2.defaults(false);
  assert.deepStrictEqual([s.stats.turbo, s.stats.betChanges], [0, 0]);
  const migrated = SV2.migrate({ stats: { turbo: 4 } }, false);
  assert.strictEqual(migrated.stats.turbo, 4, 'o save antigo mantém o novo contador');
});
ok('coleção: cada item tem meta positiva e progresso que começa em zero (ou nível 1)', () => {
  const PR3 = require('./progression.js');
  const SV3 = require('./save.js');
  const fresh = SV3.defaults(false);
  for (const item of PR3.COSMETICS) {
    assert(item.goal > 0 && typeof item.value === 'function', `item ${item.id} sem meta`);
    assert(item.value(fresh) >= 0 && item.value(fresh) < item.goal || item.id === 'laco', `${item.id} começa desbloqueado`);
  }
});

// --- Q4-09: pt-BR e en com as mesmas chaves e parâmetros; cada chave usada existe e nenhuma sobra ---
ok('i18n: pt-BR e en têm as mesmas chaves e os mesmos parâmetros {nome}', () => {
  const pt = require('./i18n/pt-BR.js'), en = require('./i18n/en.js');
  assert.deepStrictEqual(Object.keys(en).sort(), Object.keys(pt).sort(), 'chaves diferentes entre idiomas');
  const params = (s) => (s.match(/\{\w+\}/g) || []).sort().join(',');
  for (const key of Object.keys(pt)) assert.strictEqual(params(en[key]), params(pt[key]), `parâmetros diferentes em ${key}`);
});
ok('i18n: toda chave usada no código existe no dicionário, e nenhuma chave sobra', () => {
  const pt = require('./i18n/pt-BR.js');
  const prefixes = [...new Set(Object.keys(pt).map((k) => k.split('.')[0]))];
  const files = fs.readdirSync(__dirname).filter((f) => f.endsWith('.js') && f !== 'engine.test.js').map((f) => path.join(__dirname, f));
  files.push(path.join(__dirname, 'index.html'));
  const used = new Set();
  const literal = new RegExp(`['"\`](?:${prefixes.join('|')})\\.[A-Za-z0-9.]+['"\`]`, 'g');
  const dataAttr = /data-i18n(?:-html|-aria|-title)?="([^"]+)"/g;
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(literal)) { const key = m[0].slice(1, -1); if (!/\.(js|html)$/.test(key)) used.add(key); }
    for (const m of src.matchAll(dataAttr)) used.add(m[1]);
  }
  assert.deepStrictEqual([...used].filter((k) => !(k in pt)), [], 'chaves usadas sem texto');
  assert.deepStrictEqual(Object.keys(pt).filter((k) => !used.has(k)), [], 'chaves sem uso');
});

// --- Q4-05: rascunho do PrivacyInfo declara que não há rastreamento nem coleta ---
ok('PrivacyInfo: declara que não há rastreamento nem dados coletados', () => {
  const x = fs.readFileSync(path.join(__dirname, '..', 'docs', 'ios', 'PrivacyInfo.xcprivacy'), 'utf8');
  assert(/<key>NSPrivacyTracking<\/key>\s*<false\/>/.test(x), 'rastreamento deve ser falso');
  assert(/<key>NSPrivacyCollectedDataTypes<\/key>\s*<array\/>/.test(x), 'não deve declarar coleta');
});

// --- Q4-10: métricas anônimas só com opt-in; sem endpoint nada sai do aparelho ---
const AN = require('./analytics.js');
ok('analytics: desligado não conta; ligado conta sem identificador; sem endpoint não envia', () => {
  const sent = [];
  const a = AN.create({ endpoint: null, send: (...args) => sent.push(args) });
  a.track('spin');
  assert.deepStrictEqual(a.snapshot(), {}, 'opt-out não conta');
  a.setEnabled(true);
  a.track('spin'); a.track('spin'); a.track('x'.repeat(40));
  assert.deepStrictEqual(a.snapshot(), { spin: 2 });
  a.flush(); // Promise de "nada enviado" (false); a checagem abaixo é síncrona
  assert.strictEqual(sent.length, 0, 'sem endpoint não há envio');
  a.setEnabled(false);
  assert.deepStrictEqual(a.snapshot(), {}, 'opt-out apaga os contadores');
});
ok('analytics: com endpoint e opt-in, envia só o agregado e zera depois', () => {
  const sent = [];
  const a = AN.create({ endpoint: 'https://exemplo.invalido/m', send: (url, payload) => { sent.push([url, payload]); } });
  a.setEnabled(true); a.track('spin');
  a.flush();
  assert.deepStrictEqual(sent, [['https://exemplo.invalido/m', { spin: 1 }]]);
  assert.deepStrictEqual(a.snapshot(), {}, 'depois do envio o agregado zera');
});

// --- Q4-06: háptica (plugin do Capacitor tem prioridade; web usa navigator.vibrate) ---
const H = require('./haptics.js');
ok('háptica: plugin tem prioridade, web usa navigator, preferência desligada não vibra', () => {
  const calls = [];
  const cap = { Plugins: { Haptics: { impact: (o) => calls.push(o) } } };
  const nav = { vibrate: (p) => calls.push(['web', p]) };
  assert.strictEqual(H.create({ cap, nav }).pulse([60, 40], true), 'plugin');
  assert.deepStrictEqual(calls, [{ style: 'MEDIUM' }]);
  assert.strictEqual(H.create({ nav }).pulse(12, true), 'web');
  assert.deepStrictEqual(calls[1], ['web', 12]);
  assert.strictEqual(H.create({ nav }).pulse(12, false), 'off');
  assert.strictEqual(calls.length, 2, 'desligado não pode disparar nada');
  assert.strictEqual(H.create({}).pulse(12, true), 'none');
});

// --- Q3-10 a Q3-12: bem-estar (limite de sessão, lembrete e autoexclusão que não encurta) ---
const WB = require('./wellbeing.js');
ok('bem-estar: limite cicla 0→15→30→60→0; autoexclusão só cresce', () => {
  assert.deepStrictEqual([0, 15, 30, 60].map((l) => WB.nextLimit(l)), [15, 30, 60, 0]);
  const DAY = 86400000, now = 1_000_000;
  const a = WB.exclusionUntil(0, now, '7d', DAY);
  assert.strictEqual(a, now + 7 * DAY);
  assert.strictEqual(WB.exclusionUntil(a, now, '24h', DAY), a, 'não pode encurtar');
  assert.strictEqual(WB.exclusionUntil(0, now, '30d', DAY), now + 30 * DAY);
  assert.strictEqual(WB.exclusionUntil(a, now, 'nada', DAY), a, 'opção inválida não muda nada');
});
ok('bem-estar: bloqueio por autoexclusão tem prioridade e some depois do prazo', () => {
  assert.strictEqual(WB.blockReason({ excludeUntil: 200, pauseUntil: 300 }, 100), 'exclusion');
  assert.strictEqual(WB.blockReason({ excludeUntil: 0, pauseUntil: 300 }, 100), 'pause');
  assert.strictEqual(WB.blockReason({ excludeUntil: 0, pauseUntil: 0 }, 100), null);
  assert.strictEqual(WB.blockReason({ excludeUntil: 200, pauseUntil: 0 }, 200), null, 'no instante do prazo já libera');
});
ok('bem-estar: sessão avisa 2 min antes e pausa ao atingir o limite; sem limite nunca pausa', () => {
  assert.strictEqual(WB.sessionStatus(10, 15), 'ok');
  assert.strictEqual(WB.sessionStatus(13, 15), 'warn');
  assert.strictEqual(WB.sessionStatus(15, 15), 'pause');
  assert.strictEqual(WB.sessionStatus(500, 0), 'ok');
});
ok('bem-estar: lembrete dispara a cada intervalo completo de sessão, sem repetir', () => {
  assert.strictEqual(WB.reminderDue(29.9, 0, 30), false);
  assert.strictEqual(WB.reminderDue(30, 0, 30), true);
  assert.strictEqual(WB.reminderDue(30.5, 30, 30), false, 'já lembrou nesse intervalo');
  assert.strictEqual(WB.reminderDue(60, 30, 30), true);
});
ok('save: bem-estar começa zerado e limite inválido vira desligado', () => {
  const S = require('./save.js');
  assert.deepStrictEqual(S.defaults(false).wb, { limit: 0, excludeUntil: 0, pauseUntil: 0 });
  assert.strictEqual(S.migrate({ wb: { limit: 45 } }, false).wb.limit, 0);
  assert.strictEqual(S.migrate({ wb: { limit: 30, excludeUntil: -5 } }, false).wb.excludeUntil, 0);
  assert.strictEqual(S.migrate({ wb: { limit: 30 } }, false).wb.limit, 30);
});

// --- Q3-09: histórico local limitado a 50 rodadas ---
ok('histórico: mantém só as 50 rodadas mais recentes e o save descarta entradas inválidas', () => {
  const s = SV.defaults(false);
  for (let i = 0; i < 53; i++) PR.recordRound(s, { t: i + 1, bet: 10, total: i % 2 ? 0 : 20 }, 50);
  assert.strictEqual(s.hist.length, 50);
  assert.strictEqual(s.hist[0].t, 4, 'a mais antiga deve sair');
  assert.strictEqual(s.hist[49].t, 53);
  const m = SV.migrate({ hist: [{ t: 1, bet: 5, total: 0 }, { t: 'x', bet: 5, total: 0 }, null] }, false);
  assert.deepStrictEqual(m.hist, [{ t: 1, bet: 5, total: 0 }]);
});

// --- Q3-08: volumes independentes no save (0 a 10) ---
ok('save: volumes de música e efeitos ficam entre 0 e 10 e usam 10 como padrão', () => {
  const S = require('./save.js');
  assert.strictEqual(S.defaults(false).set.musicVol, 10);
  assert.strictEqual(S.migrate({ set: { musicVol: 4, sfxVol: 99 } }, false).set.musicVol, 4);
  assert.strictEqual(S.migrate({ set: { musicVol: 4, sfxVol: 99 } }, false).set.sfxVol, 10);
  assert.strictEqual(S.migrate({ set: { musicVol: -1 } }, false).set.musicVol, 10);
});

// --- Q3-04: coleção do mascote (itens concedidos uma vez, pelos marcos) ---
ok('coleção: itens são concedidos só quando o marco é cumprido e não se repetem', () => {
  const s = SV.defaults(false);
  s.level = 2; s.stats.spins = 100;
  assert.deepStrictEqual(PR.grantCosmetics(s).map((i) => i.id).sort(), ['laco', 'oculos']);
  assert.deepStrictEqual(PR.grantCosmetics(s), []);
  assert.deepStrictEqual([...s.cos].sort(), ['laco', 'oculos']);
  assert.strictEqual(PR.COSMETICS.length, 6);
  assert.strictEqual(new Set(PR.COSMETICS.map((c) => c.id)).size, 6, 'ids repetidos');
});

// --- Q2-10: parallax (deslocamento puro) e preferência tilt no save ---
const P = require('./parallax.js');
ok('parallax: repouso dá deslocamento zero e inclinação fica limitada a ±1', () => {
  const rest = { beta: 45, gamma: 0 };
  assert.deepStrictEqual(P.offsetFor({ beta: 45, gamma: 0 }, rest), { x: 0, y: 0 });
  assert.strictEqual(P.offsetFor({ beta: 45, gamma: 15 }, rest).x, 0.5);
  assert.strictEqual(P.offsetFor({ beta: 45, gamma: 900 }, rest).x, 1);
  assert.strictEqual(P.offsetFor({ beta: -200, gamma: 0 }, rest).y, -1);
});
ok('save: tilt começa desligado e valor inválido é descartado', () => {
  const S = require('./save.js');
  assert.strictEqual(S.defaults(false).set.tilt, false);
  assert.strictEqual(S.migrate({ set: { tilt: 'sim' } }, false).set.tilt, false);
  assert.strictEqual(S.migrate({ set: { tilt: true } }, false).set.tilt, true);
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
  const { DAILY_BONUS } = C.betConfig, { DAILY_STREAK_STEP, DAILY_STREAK_DAYS } = C.gameConfig;
  assert.strictEqual(E.dailyReward(1, DAILY_BONUS, DAILY_STREAK_STEP, DAILY_STREAK_DAYS), 2000);
  assert.strictEqual(E.dailyReward(3, DAILY_BONUS, DAILY_STREAK_STEP, DAILY_STREAK_DAYS), 3000);
  assert.strictEqual(E.dailyReward(7, DAILY_BONUS, DAILY_STREAK_STEP, DAILY_STREAK_DAYS), 5000);
  assert.strictEqual(E.dailyReward(30, DAILY_BONUS, DAILY_STREAK_STEP, DAILY_STREAK_DAYS), 5000);
});
ok('sequência: ontem soma, hoje mantém, pular dia recomeça', () => {
  const cap = C.gameConfig.DAILY_STREAK_DAYS;
  assert.strictEqual(E.nextStreak('d1', 'd2', 'd1', 3, cap), 4);
  assert.strictEqual(E.nextStreak('d2', 'd2', 'd1', 4, cap), 4);
  assert.strictEqual(E.nextStreak('d0', 'd2', 'd1', 4, cap), 1);
  assert.strictEqual(E.nextStreak('', 'd2', 'd1', 0, cap), 1);
  assert.strictEqual(E.nextStreak('d6', 'd7', 'd6', 7, cap), cap);
assert.strictEqual(E.nextStreak('d0', 'd2', 'd1', 4, cap, 'd0'), 4, 'folga: faltou um dia e a sequência fica');
assert.strictEqual(E.nextStreak('d0', 'd2', 'd1', 1, cap, 'd0'), 1, 'sem sequência, a folga não se aplica');
assert.strictEqual(E.nextStreak('d-3', 'd2', 'd1', 4, cap, 'd0'), 1, 'faltaram mais dias: recomeça');
});

// --- save versionado (Q1-07) ---
const SAVE = require('./save.js');
const PROG = require('./progression.js');
function fakeStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), _m: m };
}
ok('save: sem nada salvo começa do zero com saldo inicial', () => {
  const s = SAVE.load(fakeStorage(), false);
  assert.strictEqual(s.balance, C.betConfig.START_CHIPS);
  assert.strictEqual(s.v, 2);
});
ok('save: migra v1 para v2 e mantém progresso', () => {
  const v1 = { balance: 4321, bet: 25, xp: 7, level: 3, theme: 'jade', streak: 2, lastDaily: 'Mon', stats: { spins: 9, wins: 3, wilds: 1, bigs: 0, best: 300 }, m: { spins: { tier: 1, start: 20 } }, set: { music: false, sfx: true, vib: true, reduce: false } };
  const st = fakeStorage({ [SAVE.KEY_V1]: JSON.stringify(v1) });
  const s = SAVE.load(st, false);
  assert.strictEqual(s.balance, 4321); assert.strictEqual(s.bet, 25); assert.strictEqual(s.level, 3);
  assert.strictEqual(s.stats.best, 300); assert.strictEqual(s.m.spins.tier, 1); assert.strictEqual(s.set.music, false);
  SAVE.write(st, s);
  assert(st._m.has(SAVE.KEY_V2), 'escrita deve ir para v2');
  assert(st._m.has(SAVE.KEY_V1), 'v1 não é apagado (rollback)');
});
ok('save: JSON corrompido cai para padrão sem lançar erro', () => {
  const s = SAVE.load(fakeStorage({ [SAVE.KEY_V2]: '{quebrado' }), false);
  assert.strictEqual(s.balance, C.betConfig.START_CHIPS);
});
ok('save: valores inválidos são saneados (aposta fora da lista, saldo negativo, tema desconhecido)', () => {
  const s = SAVE.migrate({ balance: -5, bet: 7, theme: 'xyz', level: 0, stats: { spins: 'x' } }, false);
  assert.strictEqual(s.balance, C.betConfig.START_CHIPS);
  assert.strictEqual(s.bet, C.betConfig.DEFAULT_BET);
  assert.strictEqual(s.theme, 'red');
  assert.strictEqual(s.level, 1);
  assert.strictEqual(s.stats.spins, 0);
});
ok('save: preferência de reduzir movimento do sistema vale só se não houver escolha salva', () => {
  assert.strictEqual(SAVE.migrate({}, true).set.reduce, true);
  assert.strictEqual(SAVE.migrate({ set: { reduce: false } }, true).set.reduce, false);
});
ok('save: valores extremos são limitados antes de entrarem na progressão', () => {
  const s = SAVE.migrate({ balance: Number.MAX_VALUE, xp: Number.MAX_VALUE, level: Number.MAX_VALUE, streak: 99, stats: { spins: Number.MAX_VALUE }, m: { spins: { tier: 1000, start: Number.MAX_VALUE } } }, false);
  assert.strictEqual(s.balance, C.betConfig.START_CHIPS);
  assert.strictEqual(s.xp, 0);
  assert.strictEqual(s.level, 1);
  assert.strictEqual(s.streak, 0);
  assert.strictEqual(s.stats.spins, 0);
  assert.strictEqual(s.m.spins.tier, 0);
});

// --- configuração de jogo (Q1-09) e hook de teste (Q1-08) ---
ok('gameConfig central tem economia e lembrete', () => {
  assert.strictEqual(C.betConfig.START_CHIPS, 10000);
  assert.strictEqual(C.betConfig.DEFAULT_BET, 10);
  assert.strictEqual(C.betConfig.REFILL_CHIPS, 1500);
  assert.strictEqual(C.gameConfig.REMIND_EVERY_MIN, 30);
  assert.strictEqual(C.gameConfig.LEVEL_BONUS_BASE, 500);
  assert.strictEqual(C.gameConfig.AUTO_SPINS, 25);
  assert.strictEqual(C.reelsConfig.TICK_INTERVAL_MS, 70);
  assert.strictEqual(C.reelsConfig.HITSTOP_MS, 90);
  assert.strictEqual(C.celebrationConfig.SUPREME_COUNT_MS, 2600);
});
ok('progression: XP sobe níveis, premia e informa desbloqueios', () => {
  const state = { xp: 90, level: 1, balance: 1000 };
  const ups = PROG.addXp(state, 20, C.gameConfig);
  assert.deepStrictEqual(ups, [{ level: 2, bonus: 1000, theme: null }]);
  assert.strictEqual(state.xp, 10);
  assert.strictEqual(state.level, 2);
  assert.strictEqual(state.balance, 2000);
});
ok('progression: missão incompleta não resgata; missão completa liquida uma vez', () => {
  const state = { balance: 10, stats: { spins: 20, wins: 0, wilds: 0, bigs: 0 }, m: { spins: { tier: 0, start: 0 }, wins: { tier: 0, start: 0 }, wilds: { tier: 0, start: 0 }, bigs: { tier: 0, start: 0 } } };
  assert.strictEqual(PROG.claimMission(state, 'wins', C.gameConfig.MISSION_GROWTH_FACTOR).claimed, false);
  const result = PROG.claimMission(state, 'spins', C.gameConfig.MISSION_GROWTH_FACTOR);
  assert.strictEqual(result.claimed, true);
  assert.strictEqual(result.reward, 500);
  assert.strictEqual(state.balance, 510);
  assert.strictEqual(PROG.claimMission(state, 'spins', C.gameConfig.MISSION_GROWTH_FACTOR).claimed, false);
});
ok('game.js expõe o hook de teste só com ?test=1', () => {
  const src = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');
  assert(/TEST_MODE\) window\.__tigrinho/.test(src), 'window.__tigrinho sem gate');
  assert(/test=1/.test(src), 'gate ?test=1 ausente');
});

// --- módulos de rolos e celebração (Q1-06) ---
const RL = require('./reels.js');
const CEL = require('./celebration.js');
ok('cada símbolo tem um material de apresentação próprio', () => {
  assert.deepStrictEqual(RL.SYMBOL_MATERIALS, {
    wild: 'wild', envelope: 'paper', ingot: 'metal', bag: 'fabric',
    orange: 'fruit', cracker: 'enamel', lantern: 'glass',
  });
  assert.strictEqual(new Set(Object.values(RL.SYMBOL_MATERIALS)).size, 7);
});
ok('parada do rolo: com quique passa do alvo e volta; sem quique nunca passa', () => {
  const withBounce = RL.settleKeyframes({ startY: -500, cruiseY: -110, overshootPx: 6 });
  const last = withBounce[withBounce.length - 1];
  assert.deepStrictEqual([last.transform, last.offset], ['translateY(0)', 1], 'deve assentar no alvo');
  assert(withBounce.some((f) => f.transform === 'translateY(6px)'), 'falta o quique');
  const offsets = withBounce.map((f) => f.offset);
  assert.deepStrictEqual(offsets, [...offsets].sort((a, b) => a - b), 'offsets fora de ordem');
  const flat = RL.settleKeyframes({ startY: -500, cruiseY: -110 });
  assert.strictEqual(flat.length, 3);
  const values = flat.map((f) => Number(f.transform.match(/translateY\((-?[\d.]+)/)[1]));
  assert(values.every((v) => v <= 0), 'sem quique o rolo não pode passar do alvo');
});
ok('stepPlan: anticipação só no 3º rolo com wild nos dois primeiros', () => {
  const rc = C.reelsConfig;
  const p = RL.stepPlan(rc, { turbo: false, reduce: false, grid: [['wild', 'a', 'b'], ['c', 'd', 'e'], ['f', 'g', 'h']] });
  assert.strictEqual(p.cols[2].antic, true);
  assert.strictEqual(p.cols[0].antic, false);
  assert.strictEqual(p.hitstop, true);
  const q = RL.stepPlan(rc, { turbo: false, reduce: false, grid: [['a', 'a', 'a'], ['a', 'a', 'a'], ['a', 'a', 'a']] });
  assert.strictEqual(q.cols.some((c) => c.antic), false);
  assert.strictEqual(q.hitstop, false);
});
ok('stepPlan: colunas são mais tardias da esquerda para a direita; reduzir movimento encurta', () => {
  const rc = C.reelsConfig, g = [['a', 'a', 'a'], ['a', 'a', 'a'], ['a', 'a', 'a']];
  const p = RL.stepPlan(rc, { turbo: false, reduce: false, grid: g });
  assert(p.cols[0].dur < p.cols[1].dur && p.cols[1].dur < p.cols[2].dur);
  const r = RL.stepPlan(rc, { turbo: false, reduce: true, grid: g });
  assert(r.cols[0].dur < p.cols[0].dur);
  const t = RL.stepPlan(rc, { turbo: true, reduce: false, grid: g });
  assert(t.cols[0].dur < p.cols[0].dur);
});
ok('celebração: nível 1-2 sem overlay; 3 com raios; 4-5 com multiplicador', () => {
  const options = { config: C.celebrationConfig };
  assert.strictEqual(CEL.plan({ level: 2, coins: 14 }, options).showOverlay, false);
  assert.strictEqual(CEL.plan({ level: 3, coins: 50 }, options).showOverlay, true);
  assert.strictEqual(CEL.plan({ level: 3, coins: 50 }, options).showMultiplier, false);
  assert.strictEqual(CEL.plan({ level: 4, coins: 80 }, options).showMultiplier, true);
  assert.strictEqual(CEL.plan({ level: 3, coins: 50 }, { ...options, reduce: true }).showRays, false);
});
ok('celebração: duração cresce por nível e reduzir movimento encurta a contagem', () => {
  const d = (l) => CEL.plan({ level: l, coins: 0 }, { config: C.celebrationConfig }).countMs;
  assert(d(3) < d(4) && d(4) < d(5));
  assert.strictEqual(CEL.plan({ level: 5, coins: 0 }, { config: C.celebrationConfig, reduce: true }).countMs, 600);
  assert(CEL.plan({ level: 4, coins: 0 }, { config: C.celebrationConfig }).waves.length > 0);
  assert.strictEqual(CEL.plan({ level: 3, coins: 0 }, { config: C.celebrationConfig }).waves.length, 0);
});
ok('celebração (Q3-06): nível 3 fecha sozinho em menos de 2,5 s e nível 5 em menos de 4 s', () => {
  const at = (l) => CEL.plan({ level: l, coins: 0 }, { config: C.celebrationConfig }).totalMs;
  assert(at(3) < 2500, `nível 3 leva ${at(3)} ms`);
  assert(at(5) < 4000, `nível 5 leva ${at(5)} ms`);
  assert(at(3) < at(4) && at(4) < at(5), 'duração deve crescer por nível');
  const fast = CEL.plan({ level: 5, coins: 0 }, { config: C.celebrationConfig, turbo: true }).totalMs;
  assert(fast < at(5), 'turbo encurta a pausa');
});
ok('celebração: multiplicador é total/aposta inteiro', () => {
  assert.strictEqual(CEL.multiplierText({ level: 4 }, 250, 10), 'x25');
  assert.strictEqual(CEL.multiplierText({ level: 3 }, 250, 10), '');
  assert.strictEqual(CEL.multiplierText({ level: 4 }, 250, 0), '');
});

// --- HTML: ids obrigatórios da interface (tela inicial, rolos, HUD, mascote) ---
ok('index.html contém ids e símbolos obrigatórios', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  for (const id of ['splash', 'start', 'reels', 'spin', 'btnSound', 'boot', 'rotateHint', 'modal', 'bigwin', 'mascot', 'id="machineCrown"', 'FESTIVAL DO CARAMELO', 'id="s-dog"', 'id="s-dog-ear-l"', 'id="s-dog-ear-r"', 'id="s-dog-face"', 'id="s-dog-collar"', 'id="s-mascot"', 'id="s-portico"', 'id="i-menu"', 'id="i-plus"', 'id="i-minus"', 'id="i-bolt"', 'id="i-sound-on"', 'id="i-sound-off"', 'aria-label="Saldo de fichas fictícias"', 'FICHAS', 'Fichas fictícias', 'save.js', 'progression.js', 'effects.js', 'reels.js', 'celebration.js', 'game-ui.js', 'game-menus.js', 'game-round-controller.js']) {
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

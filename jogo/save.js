/* Persistência do TIGRINHO: save versionado com migração.
   v1 (chave tigrinho.save.v1) é lido uma vez e migrado; a escrita vai sempre para v2.
   A chave v1 não é apagada, para permitir voltar a uma versão anterior. Puro (sem DOM). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./config.js').betConfig);
  else root.TigerSave = factory(root.TigerConfig.betConfig);
})(typeof self !== 'undefined' ? self : this, function (betConfig) {
  const KEY_V1 = 'tigrinho.save.v1';
  const KEY_V2 = 'tigrinho.save.v2';
  const VERSION = 2;
  const MISSION_IDS = ['spins', 'wins', 'wilds', 'bigs'];
  const THEMES = ['red', 'jade', 'noite'];
  const ROTATION_KINDS = ['daily', 'weekly'];
  const ROTATION_STATS = ['spins', 'wins', 'wilds', 'bigs', 'turbo', 'betChanges'];
  const rotationDefaults = () => Object.fromEntries(ROTATION_KINDS.map((kind) => [kind, {
    key: '', start: Object.fromEntries(ROTATION_STATS.map((k) => [k, 0])), claimed: [],
  }]));

  function defaults(reduce) {
    return {
      v: VERSION,
      balance: betConfig.START_CHIPS,
      bet: betConfig.DEFAULT_BET, xp: 0, level: 1, theme: 'red', lastDaily: '', streak: 0,
      stats: { spins: 0, wins: 0, wilds: 0, bigs: 0, best: 0, turbo: 0, betChanges: 0 },
      m: Object.fromEntries(MISSION_IDS.map((id) => [id, { tier: 0, start: 0 }])),
      set: { music: true, sfx: true, vib: true, reduce: !!reduce, tilt: false, musicVol: 10, sfxVol: 10, analytics: false, lang: 'pt-BR' },
      seen: { tutorial: false, tips: [] },
      rot: rotationDefaults(),
      cos: [], // itens da coleção do mascote já desbloqueados (Q3-04)
      hist: [], // últimas rodadas: { t, bet, total } (Q3-09)
      wb: { limit: 0, excludeUntil: 0, pauseUntil: 0 }, // bem-estar (Q3-10 a Q3-12)
    };
  }

  const num = (x, d, min = -Infinity, max = Number.MAX_SAFE_INTEGER) =>
    (typeof x === 'number' && Number.isFinite(x) && x >= min && x <= max ? x : d);
  const bool = (x, d) => (typeof x === 'boolean' ? x : d);

  // Normaliza um save (de qualquer versão) para o formato atual, descartando campos inválidos.
  function migrate(raw, reduce) {
    const base = defaults(reduce);
    if (!raw || typeof raw !== 'object') return base;
    const s = { ...base };
    s.balance = num(raw.balance, base.balance, 0, 1_000_000_000);
    s.bet = betConfig.BETS.includes(raw.bet) ? raw.bet : base.bet;
    s.xp = num(raw.xp, 0, 0, 1_000_000_000);
    s.level = num(raw.level, 1, 1, 1_000_000);
    s.theme = THEMES.includes(raw.theme) ? raw.theme : 'red';
    s.lastDaily = typeof raw.lastDaily === 'string' ? raw.lastDaily : '';
    s.streak = num(raw.streak, 0, 0, 7);
    const st = raw.stats || {};
    for (const k of Object.keys(base.stats)) s.stats[k] = num(st[k], 0, 0, 1_000_000_000);
    for (const id of MISSION_IDS) {
      const m = (raw.m && raw.m[id]) || {};
      s.m[id] = { tier: num(m.tier, 0, 0, 50), start: num(m.start, 0, 0, 1_000_000_000) };
    }
    const set = raw.set || {};
    s.set = {
      music: bool(set.music, true), sfx: bool(set.sfx, true), vib: bool(set.vib, true),
      reduce: bool(set.reduce, !!reduce),
      tilt: bool(set.tilt, false),
      musicVol: num(set.musicVol, 10, 0, 10), sfxVol: num(set.sfxVol, 10, 0, 10), // 0 a 10 (Q3-08)
      analytics: bool(set.analytics, false), // métricas anônimas: opt-in (Q4-10)
      lang: ['pt-BR', 'en'].includes(set.lang) ? set.lang : 'pt-BR', // idioma da interface (Q4-09)
    };
    const seen = raw.seen || {};
    s.seen = {
      tutorial: bool(seen.tutorial, false),
      // dicas já mostradas (Q3-02): só ids curtos e textuais, no máximo 20
      tips: Array.isArray(seen.tips) ? seen.tips.filter((t) => typeof t === 'string' && t.length <= 40).slice(0, 20) : [],
    };
    // Rodízios (Q3-03): chave do período, estatísticas de partida e missões já resgatadas.
    const rotIn = raw.rot || {};
    s.rot = {};
    for (const kind of ROTATION_KINDS) {
      const r = rotIn[kind] || {};
      const st = r.start || {};
      s.rot[kind] = {
        key: typeof r.key === 'string' && r.key.length <= 12 ? r.key : '',
        start: Object.fromEntries(ROTATION_STATS.map((k) => [k, num(st[k], 0, 0, 1_000_000_000)])),
        claimed: Array.isArray(r.claimed) ? r.claimed.filter((id) => typeof id === 'string' && id.length <= 20).slice(0, 10) : [],
      };
    }
    // Histórico (Q3-09): só entradas válidas, no máximo 50 (as mais recentes).
    s.hist = Array.isArray(raw.hist)
      ? raw.hist.filter((e) => e && num(e.t, -1, 0) >= 0 && num(e.bet, -1, 0) >= 0 && num(e.total, -1, 0) >= 0)
        .slice(-50).map((e) => ({ t: e.t, bet: e.bet, total: e.total }))
      : [];
    // Bem-estar: limite só nos valores permitidos; prazos são instantes (ms) não negativos.
    const wbIn = raw.wb || {};
    s.wb = {
      limit: [0, 15, 30, 60].includes(wbIn.limit) ? wbIn.limit : 0,
      excludeUntil: num(wbIn.excludeUntil, 0, 0, 4e12),
      pauseUntil: num(wbIn.pauseUntil, 0, 0, 4e12),
    };
    s.cos = Array.isArray(raw.cos) ? raw.cos.filter((id) => typeof id === 'string' && id.length <= 20).slice(0, 20) : [];
    s.v = VERSION;
    return s;
  }

  // Lê o save atual; se não houver v2, tenta v1; se estiver corrompido, começa do zero.
  function load(storage, reduce) {
    const read = (k) => { try { return storage.getItem(k); } catch (e) { return null; } };
    const raw2 = read(KEY_V2);
    if (raw2) { try { return migrate(JSON.parse(raw2), reduce); } catch (e) { /* corrompido: cai para v1 */ } }
    const raw1 = read(KEY_V1);
    if (raw1) { try { return migrate(JSON.parse(raw1), reduce); } catch (e) { /* corrompido */ } }
    return defaults(reduce);
  }

  function write(storage, state) {
    try { storage.setItem(KEY_V2, JSON.stringify({ ...state, v: VERSION })); return true; } catch (e) { return false; }
  }

  return { KEY_V1, KEY_V2, VERSION, defaults, migrate, load, write };
});

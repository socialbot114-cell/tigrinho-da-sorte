/* Persistência do TIGRINHO: save versionado com migração.
   v1 (chave tigrinho.save.v1) é lido uma vez e migrado; a escrita vai sempre para v2.
   A chave v1 não é apagada, para permitir voltar a uma versão anterior. Puro (sem DOM). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TigerSave = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const KEY_V1 = 'tigrinho.save.v1';
  const KEY_V2 = 'tigrinho.save.v2';
  const VERSION = 2;
  const MISSION_IDS = ['spins', 'wins', 'wilds', 'bigs'];
  const BETS = [5, 10, 25, 50, 100, 250, 500];
  const THEMES = ['red', 'jade', 'noite'];

  function defaults(reduce, startChips) {
    return {
      v: VERSION,
      balance: startChips == null ? 10000 : startChips,
      bet: 10, xp: 0, level: 1, theme: 'red', lastDaily: '', streak: 0,
      stats: { spins: 0, wins: 0, wilds: 0, bigs: 0, best: 0 },
      m: Object.fromEntries(MISSION_IDS.map((id) => [id, { tier: 0, start: 0 }])),
      set: { music: true, sfx: true, vib: true, reduce: !!reduce },
    };
  }

  const num = (x, d, min = -Infinity) => (typeof x === 'number' && isFinite(x) && x >= min ? x : d);
  const bool = (x, d) => (typeof x === 'boolean' ? x : d);

  // Normaliza um save (de qualquer versão) para o formato atual, descartando campos inválidos.
  function migrate(raw, reduce, startChips) {
    const base = defaults(reduce, startChips);
    if (!raw || typeof raw !== 'object') return base;
    const s = { ...base };
    s.balance = num(raw.balance, base.balance, 0);
    s.bet = BETS.includes(raw.bet) ? raw.bet : base.bet;
    s.xp = num(raw.xp, 0, 0);
    s.level = num(raw.level, 1, 1);
    s.theme = THEMES.includes(raw.theme) ? raw.theme : 'red';
    s.lastDaily = typeof raw.lastDaily === 'string' ? raw.lastDaily : '';
    s.streak = num(raw.streak, 0, 0);
    const st = raw.stats || {};
    for (const k of Object.keys(base.stats)) s.stats[k] = num(st[k], 0, 0);
    for (const id of MISSION_IDS) {
      const m = (raw.m && raw.m[id]) || {};
      s.m[id] = { tier: num(m.tier, 0, 0), start: num(m.start, 0, 0) };
    }
    const set = raw.set || {};
    s.set = {
      music: bool(set.music, true), sfx: bool(set.sfx, true), vib: bool(set.vib, true),
      reduce: bool(set.reduce, !!reduce),
    };
    s.v = VERSION;
    return s;
  }

  // Lê o save atual; se não houver v2, tenta v1; se estiver corrompido, começa do zero.
  function load(storage, reduce, startChips) {
    const read = (k) => { try { return storage.getItem(k); } catch (e) { return null; } };
    const raw2 = read(KEY_V2);
    if (raw2) { try { return migrate(JSON.parse(raw2), reduce, startChips); } catch (e) { /* corrompido: cai para v1 */ } }
    const raw1 = read(KEY_V1);
    if (raw1) { try { return migrate(JSON.parse(raw1), reduce, startChips); } catch (e) { /* corrompido */ } }
    return defaults(reduce, startChips);
  }

  function write(storage, state) {
    try { storage.setItem(KEY_V2, JSON.stringify({ ...state, v: VERSION })); return true; } catch (e) { return false; }
  }

  return { KEY_V1, KEY_V2, VERSION, defaults, migrate, load, write };
});

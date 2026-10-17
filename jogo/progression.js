/* Regras puras de progressão: missões (em faixas, diárias e semanais), temas e níveis.
   Mutação explícita do state; sem DOM, áudio, storage ou aleatoriedade.
   A escolha das missões de rodízio é determinística pela data (mesmo dia, mesmas missões). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TigerProgression = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const MISSIONS = Object.freeze([
    { id: 'spins', base: 20, stat: 'spins', reward: 500, text: 'mission.spins' },
    { id: 'wins', base: 8, stat: 'wins', reward: 600, text: 'mission.wins' },
    { id: 'wilds', base: 3, stat: 'wilds', reward: 800, text: 'mission.wilds' },
    { id: 'bigs', base: 1, stat: 'bigs', reward: 1500, text: 'mission.bigs' },
  ]);
  const THEMES = Object.freeze([
    { id: 'red', name: 'theme.red', lvl: 1 },
    { id: 'jade', name: 'theme.jade', lvl: 3 },
    { id: 'noite', name: 'theme.noite', lvl: 6 },
  ]);
  const byId = Object.fromEntries(MISSIONS.map((m) => [m.id, m]));

  // Missões de rodízio (Q3-03). Cada período escolhe PICK missões do pool e uma meta entre as opções.
  // Diárias renovam à meia-noite local; semanais, na segunda-feira à meia-noite local.
  const ROTATION_POOLS = Object.freeze({
    daily: Object.freeze([
      { id: 'd-spins', stat: 'spins', targets: [5, 8, 12], reward: 300, text: 'mission.spins' },
      { id: 'd-wins', stat: 'wins', targets: [2, 3, 4], reward: 400, text: 'mission.wins' },
      { id: 'd-wilds', stat: 'wilds', targets: [1, 2], reward: 500, text: 'rot.daily.wilds' },
      { id: 'd-bigs', stat: 'bigs', targets: [1], reward: 800, text: 'mission.bigs' },
      { id: 'd-turbo', stat: 'turbo', targets: [2, 3], reward: 350, text: 'rot.daily.turbo' },
      { id: 'd-bet', stat: 'betChanges', targets: [2, 3], reward: 350, text: 'rot.daily.bet' },
    ]),
    weekly: Object.freeze([
      { id: 'w-spins', stat: 'spins', targets: [40, 60], reward: 1500, text: 'rot.weekly.spins' },
      { id: 'w-wins', stat: 'wins', targets: [15, 20], reward: 2000, text: 'rot.weekly.wins' },
      { id: 'w-wilds', stat: 'wilds', targets: [4, 6], reward: 2500, text: 'rot.weekly.wilds' },
      { id: 'w-bigs', stat: 'bigs', targets: [2, 3], reward: 4000, text: 'rot.weekly.bigs' },
    ]),
  });
  const ROTATION_PICK = 3;
  const ROTATION_STATS = ['spins', 'wins', 'wilds', 'bigs', 'turbo', 'betChanges'];

  function xpNeeded(level, config) {
    return config.XP_START + (Math.max(1, level) - 1) * config.XP_LEVEL_STEP;
  }

  function missionTarget(state, mission, growthFactor) {
    return mission.base * Math.pow(growthFactor, state.m[mission.id].tier);
  }

  function missionProgress(state, mission) {
    return Math.max(0, state.stats[mission.stat] - state.m[mission.id].start);
  }

  function missionReward(state, mission) {
    return mission.reward * (state.m[mission.id].tier + 1);
  }

  // Retorna os níveis ganhos para a UI decidir como apresentá-los.
  function addXp(state, amount, config) {
    state.xp += amount;
    const levels = [];
    while (state.xp >= xpNeeded(state.level, config)) {
      state.xp -= xpNeeded(state.level, config);
      state.level++;
      const bonus = config.LEVEL_BONUS_BASE * state.level;
      state.balance += bonus;
      levels.push({ level: state.level, bonus, theme: THEMES.find((t) => t.lvl === state.level) || null });
    }
    return levels;
  }

  // Uma missão só pode ser resgatada quando o alvo foi atingido. Atualiza a progressão uma vez.
  function claimMission(state, id, growthFactor) {
    const mission = byId[id];
    if (!mission) return { claimed: false, reward: 0, reason: 'unknown-mission' };
    const target = missionTarget(state, mission, growthFactor);
    if (missionProgress(state, mission) < target) return { claimed: false, reward: 0, reason: 'incomplete' };
    const reward = missionReward(state, mission);
    state.balance += reward;
    state.m[id].tier++;
    state.m[id].start = state.stats[mission.stat];
    return { claimed: true, reward, mission };
  }

  // ----- Rodízio: diárias e semanais -----

  const pad = (n) => String(n).padStart(2, '0');
  const dayKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  // Chave da semana = data da segunda-feira local que a começa.
  function weekKey(date) {
    const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return dayKey(monday);
  }

  // Hash FNV-1a de 32 bits: estável entre execuções e navegadores.
  function hash(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  // Escolhe as missões do período pela ordem do hash da chave; a meta também vem do hash.
  function pickRotation(kind, key) {
    return ROTATION_POOLS[kind]
      .slice()
      .sort((a, b) => hash(key + a.id) - hash(key + b.id))
      .slice(0, ROTATION_PICK)
      .map((m) => ({ ...m, goal: m.targets[hash(key + m.id + '#') % m.targets.length] }));
  }

  const statsSnapshot = (stats) => Object.fromEntries(ROTATION_STATS.map((k) => [k, stats[k] || 0]));

  // Renova cada rodízio quando a chave do período muda. Dentro do período, não mexe em nada.
  function refreshRotations(state, now) {
    const keys = { daily: dayKey(now), weekly: weekKey(now) };
    for (const kind of ['daily', 'weekly']) {
      if (state.rot[kind].key !== keys[kind]) {
        state.rot[kind] = { key: keys[kind], start: statsSnapshot(state.stats), claimed: [] };
      }
    }
    return state.rot;
  }

  // Estado de cada missão do período, pronto para a UI. Requer refreshRotations antes.
  function rotationView(state, kind) {
    const rot = state.rot[kind];
    return pickRotation(kind, rot.key).map((m) => {
      const progress = Math.min(Math.max(0, state.stats[m.stat] - rot.start[m.stat]), m.goal);
      const claimed = rot.claimed.includes(m.id);
      return { id: m.id, kind, text: m.text, goal: m.goal, progress, reward: m.reward, claimed, ready: !claimed && progress >= m.goal };
    });
  }

  function claimRotation(state, kind, id) {
    const view = rotationView(state, kind).find((m) => m.id === id);
    if (!view) return { claimed: false, reward: 0, reason: 'unknown-mission' };
    if (view.claimed) return { claimed: false, reward: 0, reason: 'claimed' };
    if (!view.ready) return { claimed: false, reward: 0, reason: 'incomplete' };
    state.balance += view.reward;
    state.rot[kind].claimed.push(id);
    return { claimed: true, reward: view.reward };
  }

  // ----- Histórico local (Q3-09): só as últimas rodadas, sem comparação com a "melhor rodada" -----
  // Guarda data, aposta e total. Mantém no máximo `limit` entradas, descartando as mais antigas.
  function recordRound(state, entry, limit) {
    state.hist.push({ t: entry.t, bet: entry.bet, total: entry.total });
    if (state.hist.length > limit) state.hist.splice(0, state.hist.length - limit);
    return state.hist;
  }

  // ----- Coleção do mascote (Q3-04): itens desbloqueados por marcos e guardados no save (state.cos) -----
  // Cada item tem um valor atual (value) e uma meta (goal). O progresso aparece na tela da coleção.
  const cosmetic = (id, name, how, goal, value) => ({ id, name, how, goal, value, unlocked: (s) => value(s) >= goal });
  const COSMETICS = Object.freeze([
    cosmetic('laco', 'cos.laco.name', 'cos.laco.how', 2, (s) => s.level),
    cosmetic('flor', 'cos.flor.name', 'cos.flor.how', 4, (s) => s.level),
    cosmetic('guizos', 'cos.guizos.name', 'cos.guizos.how', 3, (s) => s.rot.weekly.claimed.length),
    cosmetic('oculos', 'cos.oculos.name', 'cos.oculos.how', 100, (s) => s.stats.spins),
    cosmetic('estrela', 'cos.estrela.name', 'cos.estrela.how', 3, (s) => s.stats.bigs),
    cosmetic('lanterna', 'cos.lanterna.name', 'cos.lanterna.how', 10, (s) => s.stats.wilds),
  ]);

  // Marca como desbloqueados os itens cujas condições já foram cumpridas. Retorna só os novos (para aviso).
  function grantCosmetics(state) {
    const fresh = COSMETICS.filter((c) => !state.cos.includes(c.id) && c.unlocked(state));
    for (const c of fresh) state.cos.push(c.id);
    return fresh;
  }

  return {
    recordRound,
    COSMETICS, grantCosmetics,
    MISSIONS, THEMES, ROTATION_POOLS, ROTATION_PICK,
    xpNeeded, missionTarget, missionProgress, missionReward, addXp, claimMission,
    dayKey, weekKey, hash, pickRotation, refreshRotations, rotationView, claimRotation,
  };
});

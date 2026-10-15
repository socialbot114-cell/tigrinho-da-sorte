/* Entry point do TIGRINHO: compõe módulos locais e liga eventos da tela.
   Sem bundler; os scripts locais em index.html preservam a execução offline. */
(() => {
  const E = TigerEngine, CFG = TigerConfig;
  const PR = TigerProgression, $ = (id) => document.getElementById(id);
  const RC = CFG.reelsConfig, BC = CFG.betConfig, GC = CFG.gameConfig, CC = CFG.celebrationConfig;
  const TEST_MODE = /[?&]test=1\b/.test(location.search);
  const format = (n) => Math.round(n).toLocaleString(TigerI18n.locale());
  const reduceDefault = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let state = TigerSave.load(localStorage, reduceDefault);
  TigerI18n.setLang(state.set.lang); // idioma salvo vale antes de qualquer texto aparecer (Q4-09)
  TigerI18n.applyTo(document);
  const save = () => TigerSave.write(localStorage, state);
  save(); // persiste imediatamente qualquer migração de save

  const app = $('app'), frame = document.querySelector('.frame'), mascot = $('mascot');
  // Tela inicial usa uma cópia do mascote, para mostrar a mesma coleção (Q3-04).
  const splashDog = $('splashDog');
  splashDog.innerHTML = mascot.innerHTML;
  const winbar = $('winbar'), winAmount = $('winamt'), winLabel = $('winlabel'), skipButton = $('skipWin'), spinButton = $('spin');
  document.documentElement.style.setProperty('--settle-duration', RC.SETTLE_POP_MS + 'ms');
  const UI = TigerGameUI.create({
    elements: {
      app, mascot, spin: spinButton, balance: $('balance'), bet: $('bet'), lvl: $('lvl'), xpbar: $('xpbar'),
      bubble: $('bubble'), toast: $('toast'), auto: $('auto'), betUp: $('betUp'), betDown: $('betDown'), turbo: $('turbo'),
    },
    getState: () => state,
    progression: PR,
    gameConfig: GC,
    format,
  });
  const sym = (id) => `<svg viewBox="0 0 100 100"><use href="#s-${id}"/></svg>`;
  const reels = TigerReels.create($('reels'), {
    sym,
    randomSymbol: () => E.randomSymbol(Math.random),
    config: RC,
    initial: [['lantern', 'orange', 'bag'], ['cracker', 'ingot', 'envelope'], ['orange', 'lantern', 'cracker']],
  });
  const effects = TigerFx.create($('fx'), () => state.set.reduce);
  const Parallax = TigerParallax.create({ scene: $('cenario'), reduced: () => state.set.reduce });
  const Analytics = TigerAnalytics.create(); // sem endpoint: nada sai do aparelho (Q4-10)
  let session = TigerSession.start(Date.now()); // resumo desta visita; não vai para o save
  Analytics.setEnabled(state.set.analytics);
  let viewport = { width: 0, height: 0 };

  // Reação às opções de movimento. Roda dentro do clique no menu (requisito do iOS para o sensor).
  function onSettingChange(key, on) {
    if (key === 'analytics') { Analytics.setEnabled(on); return; } // opt-in (Q4-10)
    if (key === 'reduce' && on) Parallax.disable();
    if (key !== 'tilt') return;
    if (!on) { Parallax.disable(); return; }
    if (state.set.reduce) {
      state.set.tilt = false; save();
      UI.toast(TigerI18n.t('toast.tiltNeedsMotion'), GC.TOAST_MS);
      Menus.settings();
      return;
    }
    Parallax.enable().then((ok) => {
      if (ok) return;
      state.set.tilt = false; save();
      UI.toast(TigerI18n.t('toast.tiltDenied'), GC.TOAST_MS);
      if ($('modalTitle') && $('modalTitle').textContent === TigerI18n.t('settings.title')) Menus.settings();
    });
  }

  function orient() {
    const landscape = innerWidth > innerHeight;
    app.dataset.orient = landscape ? 'landscape' : 'portrait';
    const hint = $('rotateHint');
    if (hint) hint.hidden = !(innerHeight < GC.SHORT_LANDSCAPE_HEIGHT && landscape);
    try {
      if (!orient.locked && document.fullscreenElement && screen.orientation && screen.orientation.lock) {
        orient.locked = true;
        screen.orientation.lock('portrait').catch(() => {});
      }
    } catch (error) { /* orientação é opcional no navegador */ }
  }

  function resize() {
    viewport = { width: innerWidth, height: innerHeight };
    effects.setSize(viewport.width, viewport.height);
    orient();
  }
  addEventListener('resize', resize);
  addEventListener('orientationchange', () => setTimeout(resize, GC.ORIENTATION_RETRY_MS));
  resize();
  effects.start();

  function shake() {
    if (state.set.reduce) return;
    frame.classList.remove('shake'); void frame.offsetWidth; frame.classList.add('shake');
  }
  const Haptics = TigerHaptics.browser(); // plugin do Capacitor no iOS; navigator.vibrate na web (Q4-06)
  function vibrate(pattern) { Haptics.pulse(pattern, state.set.vib); }
  function setShown(value) { UI.setBalance(value); }
  function updateMissionsDot() {
    PR.refreshRotations(state, new Date());
    checkCosmetics();
    const ready = PR.MISSIONS.some((mission) => PR.missionProgress(state, mission) >= PR.missionTarget(state, mission, GC.MISSION_GROWTH_FACTOR))
      || ['daily', 'weekly'].some((kind) => PR.rotationView(state, kind).some((m) => m.ready));
    $('btnMenu').classList.toggle('has-ready', ready);
    $('btnMenu').setAttribute('aria-label', ready ? TigerI18n.t('hud.menuReady') : TigerI18n.t('hud.menu'));
  }
  // Coleção do mascote (Q3-04): avisa itens novos e reflete a coleção no mascote do jogo.
  function checkCosmetics() {
    const fresh = PR.grantCosmetics(state);
    session = TigerSession.recordItems(session, fresh.map((item) => item.id));
    if (fresh.length) { save(); UI.toast(TigerI18n.t('toast.cosmetic', { names: fresh.map((item) => TigerI18n.t(item.name)).join(', ') }), GC.TOAST_MS); }
    mascot.dataset.cos = state.cos.join(' ');
    splashDog.dataset.cos = mascot.dataset.cos;
  }
  function addXp(amount) {
    const levelUps = PR.addXp(state, amount, GC);
    for (const item of levelUps) {
      effects.burst(30); Sound.levelup(); UI.mood('proud'); UI.toast(TigerI18n.t('toast.level', { level: item.level, bonus: format(item.bonus) }), GC.LEVEL_TOAST_MS);
      if (item.theme) setTimeout(() => UI.toast(TigerI18n.t('toast.theme', { name: TigerI18n.t(item.theme.name) }), GC.LEVEL_TOAST_MS), GC.THEME_UNLOCK_TOAST_DELAY_MS);
    }
  }

  const Menus = TigerMenus.create({
    getState: () => state,
    setState: (next) => { state = next; },
    fresh: () => TigerSave.defaults(reduceDefault),
    progression: PR, gameConfig: GC, engine: E, ui: UI, sound: Sound, save, setShown, format, sym,
    burst: (...args) => effects.burst(...args), rain: (n) => effects.rain(n),
    refillChips: BC.REFILL_CHIPS, dailyBonus: BC.DAILY_BONUS,
    dailyStep: GC.DAILY_STREAK_STEP, dailyDays: GC.DAILY_STREAK_DAYS,
    onSetting: onSettingChange,
    onProgress: () => updateMissionsDot(),
    onWellbeing: () => refreshBlock(),
    onLanguage: () => applyLanguage(),
    onFeel: (value) => { Analytics.track('feel_' + value); },
    getSession: () => TigerSession.summarize(session, Date.now()),
  });

  // Dica contextual uma única vez por tipo (Q3-02). Espera o aviso da rodada sair antes de aparecer.
  // Se outro aviso (ex.: um toast de ação do jogador) estiver na tela, a dica espera ele sair em vez de substituí-lo.
  function tip(id) {
    const text = TigerTutorial.TIPS[id];
    if (!text || state.seen.tips.includes(id)) return;
    state.seen.tips.push(id); save();
    const show = () => {
      if ($('toast').classList.contains('show')) return setTimeout(show, GC.TIP_DELAY_MS);
      UI.toast('💡 ' + TigerI18n.t(text), GC.TIP_TOAST_MS);
    };
    setTimeout(show, GC.TIP_DELAY_MS);
  }

  // Cartão de vitória (experiência): imagem com o Caramelo e o momento, sem valor em dinheiro.
  // O mascote vai para a imagem sem CSS, então sai sem os acessórios não desbloqueados e sem as partes que dependem de CSS.
  let lastWin = null;
  function mascotMarkup(shown) {
    const clone = mascot.cloneNode(true);
    clone.querySelectorAll('.cos').forEach((el) => { if (!shown.has([...el.classList].find((c) => c.startsWith('cos-')))) el.remove(); });
    TigerShareCard.CSS_ONLY.forEach((cls) => clone.querySelectorAll('.' + cls).forEach((el) => el.remove()));
    return clone.innerHTML;
  }
  // Definições do SVG (gradientes e símbolos) para a imagem, sem as partes que só o CSS da página controla.
  function cardDefs() {
    const defs = document.querySelector('svg[width="0"][height="0"]').cloneNode(true);
    TigerShareCard.CSS_ONLY.forEach((cls) => defs.querySelectorAll('.' + cls).forEach((el) => el.remove()));
    return defs.innerHTML;
  }
  function showShare(tier, total, bet) { lastWin = { tier, total, bet }; $('shareWin').hidden = false; }
  async function shareLast() {
    if (!lastWin) return;
    const t = (key, params) => TigerI18n.t(key, params);
    try {
      const blob = await TigerShareCard.build({
        title: t(lastWin.tier.name), amount: '+' + format(lastWin.total), caption: t('share.caption'),
        subtitle: t('share.subtitle'), footer: t('share.footer'),
        mascotSvg: mascotMarkup, defsSvg: cardDefs(), unlocked: state.cos,
      });
      const result = await TigerShareCard.share(blob, { fileName: 'tigrinho-vitoria.png', title: t('share.title'), text: t('share.text') });
      if (result !== 'cancelled') Analytics.track('share_' + result);
    } catch (error) { UI.toast(TigerI18n.t('share.failed'), GC.TOAST_MS); }
  }
  $('shareWin').onclick = () => shareLast();

  let Round;
  // Bem-estar (Q3-10 a Q3-12): sessão, lembrete de pausa e bloqueio. Regras em wellbeing.js.
  let sessionStart = Date.now(), lastReminder = 0, warned = false;
  const blockBox = $('bloqueio');
  const shortTime = (t, options) => new Date(t).toLocaleString(TigerI18n.locale(), options);
  function refreshBlock(at = Date.now()) {
    const reason = TigerWellbeing.blockReason(state.wb, at);
    if (!reason) { blockBox.hidden = true; return; }
    if (reason === 'exclusion') {
      $('bloqueioTitle').textContent = TigerI18n.t('block.exclusionTitle');
      $('bloqueioText').textContent = TigerI18n.t('block.exclusionText', { date: shortTime(state.wb.excludeUntil, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) });
    } else {
      $('bloqueioTitle').textContent = TigerI18n.t('block.pauseTitle');
      $('bloqueioText').textContent = TigerI18n.t('block.pauseText', { time: shortTime(state.wb.pauseUntil, { hour: '2-digit', minute: '2-digit' }) }) + ' ' + TigerI18n.t('block.pauseSummary', { rounds: session.rounds });
    }
    blockBox.hidden = false;
  }
  function tickSession(at = Date.now()) {
    if (state.wb.pauseUntil && state.wb.pauseUntil <= at) { state.wb.pauseUntil = 0; save(); sessionStart = at; lastReminder = 0; warned = false; }
    const blocked = !!TigerWellbeing.blockReason(state.wb, at);
    const elapsed = (at - sessionStart) / GC.SESSION_MINUTE_MS;
    const status = TigerWellbeing.sessionStatus(elapsed, state.wb.limit);
    if (status === 'pause' && !blocked) { state.wb.pauseUntil = at + TigerWellbeing.PAUSE_MIN * GC.SESSION_MINUTE_MS; save(); }
    else if (status === 'warn' && !warned && !blocked) {
      warned = true; UI.toast(TigerI18n.t('toast.warnBreak', { min: TigerWellbeing.WARN_BEFORE_MIN }), GC.SESSION_REMINDER_TOAST_MS);
    }
    if (!blocked && Round && !Round.busy && TigerWellbeing.reminderDue(elapsed, lastReminder, GC.REMIND_EVERY_MIN)) {
      lastReminder = Math.floor(elapsed);
      UI.toast(TigerI18n.t('toast.reminder', { min: lastReminder }), GC.SESSION_REMINDER_TOAST_MS);
    }
    refreshBlock(at);
  }
  setInterval(() => tickSession(), GC.SESSION_MINUTE_MS);
  tickSession();

  Round = TigerRoundController.create({
    engine: E, random: Math.random, reels, stepPlan: TigerReels.stepPlan, reelConfig: RC, gameConfig: GC, celebrationConfig: CC, celebration: TigerCelebration,
    canSpin: () => $('modal').hidden && $('bigwin').hidden && $('splash').hidden && $('bloqueio').hidden,
    getState: () => state, ui: UI, sound: Sound, effects,
    frame, mascot, winAmount, winbar, winLabel, skipButton,
    getSize: () => viewport, save, addXp, updateMissionsDot,
    refill: () => Menus.refill(), format, shake, vibrate, tip,
    onRoundStart: () => { PR.refreshRotations(state, new Date()); $('shareWin').hidden = true; },
    onWinTier: (tier, total, bet) => showShare(tier, total, bet),
    onRound: (entry) => { PR.recordRound(state, entry, GC.HISTORY_LIMIT); session = TigerSession.recordRound(session, entry); Analytics.track('spin'); },
  });

  // Troca de idioma (Q4-09): textos estáticos, rótulos dinâmicos e o botão de som são redesenhados na hora.
  function applyLanguage() {
    TigerI18n.applyTo(document);
    UI.updateHud();
    paintSound();
    updateMissionsDot();
    refreshBlock();
  }

  $('btnMenu').onclick = () => { Sound.init(); Sound.click(); Menus.menu(); };
  const btnSound = $('btnSound');
  const paintSound = () => {
    if (!btnSound) return;
    const enabled = state.set.music || state.set.sfx;
    btnSound.setAttribute('aria-label', enabled ? TigerI18n.t('sound.disable') : TigerI18n.t('sound.enable'));
    btnSound.innerHTML = `<svg aria-hidden="true"><use href="#${enabled ? 'i-sound-on' : 'i-sound-off'}"/></svg>`;
  };
  if (btnSound) btnSound.onclick = () => {
    Sound.init(); const enabled = !(state.set.music || state.set.sfx);
    state.set.music = enabled; state.set.sfx = enabled;
    Sound.setMusic(enabled); Sound.setSfx(enabled); save(); paintSound(); Sound.click();
  };
  $('betUp').onclick = () => {
    if (Round.busy) return;
    const index = E.BETS.indexOf(state.bet);
    const previousBet = state.bet; state.bet = E.BETS[Math.min(E.BETS.length - 1, index + 1)];
    if (state.bet !== previousBet) state.stats.betChanges++; // missão de descoberta
    Sound.init(); Sound.click(); UI.updateHud(); save();
  };
  $('betDown').onclick = () => {
    if (Round.busy) return;
    const index = E.BETS.indexOf(state.bet);
    const previousBet = state.bet; state.bet = E.BETS[Math.max(0, index - 1)];
    if (state.bet !== previousBet) state.stats.betChanges++; // missão de descoberta
    Sound.init(); Sound.click(); UI.updateHud(); save();
  };
  spinButton.onclick = () => Round.spin();
  $('auto').onclick = () => Round.toggleAuto();
  $('turbo').onclick = () => Round.toggleTurbo();
  winbar.addEventListener('pointerdown', () => Round.skipCount());
  skipButton.onclick = (event) => { event.stopPropagation(); Round.skipCount(); };
  addEventListener('keydown', (event) => {
    if ((event.code === 'Space' || event.code === 'Enter') && $('modal').hidden && $('bigwin').hidden && $('splash').hidden === true) {
      event.preventDefault(); Round.spin();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { Sound.suspend(); effects.stop(); }
    else { Sound.resume(); effects.start(); }
  });
  mascot.addEventListener('pointerdown', () => UI.say('idle'));

  Sound.setMusicVolume(state.set.musicVol / 10); Sound.setSfxVolume(state.set.sfxVol / 10);
  Sound.setMusic(state.set.music); Sound.setSfx(state.set.sfx);
  setShown(state.balance); UI.updateHud(); updateMissionsDot(); UI.mood('idle'); paintSound(); orient();

  // Parallax (Q2-10): sem sensor, a opção não se aplica. Com permissão pedida pelo iOS, espera o próximo clique.
  if (!Parallax.hasSensor()) state.set.tilt = false;
  else if (state.set.tilt && !state.set.reduce) {
    if (Parallax.needsPermission()) addEventListener('click', () => Parallax.enable(), { once: true });
    else Parallax.enable();
  }
  const boot = $('boot');
  requestAnimationFrame(() => requestAnimationFrame(() => { if (boot) { boot.classList.add('hide'); setTimeout(() => boot.remove(), GC.BOOT_FADE_MS); } }));
  setTimeout(() => UI.say('idle', GC.BOOT_IDLE_BUBBLE_MS), GC.IDLE_BUBBLE_DELAY_MS);

  // Gestor de PWA: o primeiro toque começa o jogo e libera o áudio sem overlay no arranque.
  const splash = $('splash'), startButton = $('start');
  let splashClosing = false;
  const hideSplash = () => {
    if (!splash || splash.hidden || splashClosing) return;
    splashClosing = true;
    startButton.disabled = true;
    splash.classList.add('out');
    setTimeout(() => { splash.hidden = true; firstRun(); }, GC.SPLASH_EXIT_MS);
  };
  // Primeiro uso mostra o tutorial antes do bônus diário. Em ?test=1 só aparece com ?tutorial=1,
  // para os testes de fluxo normal não precisarem fechá-lo.
  const TUTORIAL_TEST = /[?&]tutorial=1\b/.test(location.search);
  function firstRun() {
    if (!state.seen.tutorial && (!TEST_MODE || TUTORIAL_TEST)) Menus.tutorial(() => { tip('firstSpin'); Menus.daily(); });
    else Menus.daily();
  }
  if (startButton) {
    startButton.onclick = () => { Sound.init(); Sound.click(); hideSplash(); };
    startButton.focus({ preventScroll: true });
  } else Menus.daily();
  addEventListener('pointerdown', () => Sound.init(), { once: true });

  // Test hook só é incluído com ?test=1; nunca faz parte do fluxo normal offline.
  if (TEST_MODE) window.__tigrinho = {
    S: state, spin: Round.spin, E,
    preview: Round.preview,
    toggleAuto: Round.toggleAuto,
    autoLeft: () => Round.autoLeft,
    highlightSequence: (wins, onReveal) => reels.highlightSequence(wins, GC.WIN_LINE_HOLD_MS, GC.WIN_LINE_HOLD_REDUCED_MS, state.set.reduce, () => false, onReveal),
    highlightLine: () => reels.highlight([{ cells: [[0, 0], [1, 0], [2, 0]] }]),
    lockWild: () => reels.setLocks(['1,1']),
    effectsRunning: () => effects.isRunning(),
    tiltOn: () => Parallax.isOn(),
    shareCard: () => shareLast(),
    showShareFor: (ratio) => showShare(E.prizeTier(ratio), ratio * state.bet, state.bet),
    mood: (value) => UI.mood(value),
    session: () => TigerSession.summarize(session, Date.now()),
    tip,
    wbTick: (at) => tickSession(at),
    sound: Sound,
    blockOn: () => !blockBox.hidden,
    setTilt: (on) => onSettingChange('tilt', on),
    failNextAnimation: Round.failNextAnimation,
  };
})();

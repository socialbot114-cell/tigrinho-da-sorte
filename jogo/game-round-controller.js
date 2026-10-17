/* Orquestra as rodadas do TIGRINHO. Regras ficam no engine; DOM e áudio entram por adapters. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TigerRoundController = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  function create({ engine, random = Math.random, canSpin = () => true, reels, stepPlan, reelConfig, gameConfig, celebrationConfig, celebration, getState, ui, sound, effects, frame, mascot, winAmount, winbar, winLabel, skipButton, getSize, save, addXp, updateMissionsDot, refill, format, shake, vibrate, tip = () => {}, onRoundStart = () => {}, onRound = () => {}, onWinTier = () => {} }) {
    let busy = false, turbo = false, autoLeft = 0, shown = getState().balance, skipNow = false, failNext = false;
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const $ = (id) => document.getElementById(id);
    const countTo = (el, from, to, duration, callback, withSound = false) =>
      ui.countTo(el, from, to, duration, callback, withSound ? (n) => sound.coin(n) : null, () => skipNow);
    const setShown = (value) => { shown = value; ui.setBalance(value); };
    const setAuto = () => {
      const button = $('auto');
      button.classList.toggle('on', autoLeft > 0);
      button.textContent = autoLeft > 0 ? autoLeft : TigerI18n.t('auto.label');
    };

    function impact(level) {
      if (level >= 2) shake();
      vibrate(level >= 3 ? [40, 30, 40] : level === 2 ? 22 : 10);
      if (level >= 1) {
        const { width, height } = getSize();
        effects.burst(6 + level * 4, width / 2, height * .45, .5 + level * .15);
      }
    }

    async function animateStep(step) {
      const state = getState();
      const plan = stepPlan(reelConfig, { turbo, reduce: state.set.reduce, grid: step.grid });
      let tickTimer = null, completed = false;
      const anticipationTimers = [];
      try {
        if (failNext) { failNext = false; throw new Error('Interrupção de animação simulada pelo teste'); }
        const spins = reels.reels.map(async (reel, column) => {
          const col = plan.cols[column];
          if (col.antic) anticipationTimers.push(setTimeout(() => { reel.el.classList.add('anticipate'); sound.anticipation(); }, col.anticAt));
          const overshootPx = state.set.reduce ? 0 : reels.cellH() * reelConfig.SETTLE_OVERSHOOT;
          await reels.spinReel(column, step.grid[column], col.dur, col.filler, reelConfig.BLUR_PX, overshootPx);
          reel.el.classList.remove('anticipate');
          reels.setCell(column, step.grid[column]); sound.stop(column); vibrate(8);
        });
        tickTimer = setInterval(() => sound.tick(), reelConfig.TICK_INTERVAL_MS);
        await Promise.all(spins);
        if (plan.hitstop) { impact(1); await sleep(reelConfig.HITSTOP_MS); }
        completed = true;
      } finally {
        if (tickTimer !== null) clearInterval(tickTimer);
        anticipationTimers.forEach(clearTimeout);
        reels.reels.forEach((reel) => reel.el.classList.remove('anticipate'));
        if (!completed) {
          reels.cancelSpins();
          step.grid.forEach((column, index) => reels.setCell(index, column));
        }
      }
    }

    function clearHighlightSoon(hadWin) {
      if (hadWin) setTimeout(() => { if (!busy) reels.clearHighlight(); }, gameConfig.HIGHLIGHT_CLEAR_MS);
    }

    function sweepMachine() {
      if (getState().set.reduce) return;
      const machine = $('machine'); machine.classList.remove('sweep'); void machine.offsetWidth;
      machine.classList.add('sweep'); setTimeout(() => machine.classList.remove('sweep'), gameConfig.MACHINE_SWEEP_MS);
    }

    const coinRain = (n) => effects.rain(Math.max(4, Math.min(24, n)));

    async function bigWin(total, tier) {
      const state = getState(), plan = celebration.plan(tier, { reduce: state.set.reduce, turbo, auto: autoLeft > 0, config: celebrationConfig });
      const overlay = $('bigwin');
      let done = false, finishClose;
      let holdTimer = null, clickTimer = null;
      const waveTimers = [];
      const closed = new Promise((resolve) => { finishClose = resolve; });
      const close = () => {
        if (done) return;
        done = true;
        if (holdTimer !== null) clearTimeout(holdTimer);
        if (clickTimer !== null) clearTimeout(clickTimer);
        finishClose();
      };
      try {
        overlay.hidden = false; overlay.dataset.lvl = tier.level;
        $('bwTitle').textContent = TigerI18n.t(tier.name); $('bwAmt').textContent = '0';
        $('bwHint').textContent = TigerI18n.t('bigwin.skip');
        $('bwMult').textContent = celebration.multiplierText(tier, total, state.bet);
        sound.big(); sound.gong(); sound.boost(plan.boostMs, tier.level); frame.classList.add('glow');
        ui.mood('cheer'); mascot.classList.add('big'); shake(); vibrate([60, 40, 60, 40, 120]);
        if (plan.rainNow) coinRain(plan.rainNow);
        const { width, height } = getSize(); effects.burst(40, width / 2, height * .45, 1.3);
        for (const wave of plan.waves) waveTimers.push(setTimeout(() => {
          if (overlay.hidden) return;
          if (wave.kind === 'rain') coinRain(wave.n);
          else { const size = getSize(); effects.burst(wave.n, size.width / 2, size.height * .45, 1.6); }
        }, wave.atMs));
        overlay.onclick = () => {
          if (done) return;
          skipNow = true; $('bwAmt').textContent = format(total); clickTimer = setTimeout(close, gameConfig.OVERLAY_SKIP_CLOSE_MS);
        };
        await countTo($('bwAmt'), 0, total, plan.countMs, (value) => { if (!done) $('bwAmt').textContent = format(value); }, true);
        if (!done) {
          const size = getSize(); effects.burst(30, size.width / 2, size.height * .45);
          holdTimer = setTimeout(close, plan.holdMs);
          await closed;
        }
      } finally {
        if (holdTimer !== null) clearTimeout(holdTimer);
        if (clickTimer !== null) clearTimeout(clickTimer);
        waveTimers.forEach(clearTimeout);
        overlay.hidden = true; overlay.removeAttribute('data-lvl'); overlay.onclick = null;
        frame.classList.remove('glow'); mascot.classList.remove('big'); skipNow = false;
      }
    }

    async function spin() {
      if (busy) return;
      if (!canSpin()) { autoLeft = 0; setAuto(); return; }
      onRoundStart(); // renova rodízios antes de a rodada mexer nas estatísticas (virada do dia)
      sound.init();
      const state = getState();
      if (state.balance < state.bet) {
        const affordable = [...engine.BETS].reverse().find((bet) => bet <= state.balance);
        if (affordable) { state.bet = affordable; ui.updateHud(); ui.toast(TigerI18n.t('toast.betAdjusted')); }
        else return refill();
      }
      busy = true;
      let continueAuto = false;
      let settled = false, persisted = true;
      try {
        ui.setSpinDisabled(true); ui.mood('spinning'); reels.clearHighlight(); reels.setLocks([]);
        winbar.classList.remove('flash', 'hit'); winbar.closest('.stage')?.classList.remove('lit'); winLabel.textContent = TigerI18n.t('win.spinning'); winAmount.textContent = '0';
        const bet = state.bet, round = engine.playRound(random, bet);
        const settlement = engine.settleRound(state.balance, bet, round);
        // Liquida e persiste antes de animar: a animação nunca determina o resultado.
        state.balance = settlement.balance; state.stats.spins++; if (round.total > 0) state.stats.wins++;
        onRound({ t: Date.now(), bet, total: round.total });
        state.stats.wilds += round.steps.reduce((sum, st) => sum + st.grid.flat().filter((symbol) => symbol === 'wild').length - st.locked.length, 0);
        state.stats.best = Math.max(state.stats.best, round.total);
        const ratio = round.total / bet; if (ratio >= 10) state.stats.bigs++;
        settled = true;
        persisted = save();
        if (!persisted) ui.toast(TigerI18n.t('toast.saveFailed'), gameConfig.INTERRUPTED_TOAST_MS);
        const before = settlement.before - bet;
        setShown(before); vibrate(12); sound.click(); sound.spin(); ui.say('idle', 800);

        let credited = 0; skipNow = false;
        for (const [index, step] of round.steps.entries()) {
          if (step.respin) {
            ui.toast(TigerI18n.t('toast.respin', { index, max: engine.MAX_RESPINS }), 1300); sound.lock(); ui.say('wild', 1400);
            ui.mood('surprised'); reels.setLocks(step.locked); tip('respin');
            await sleep(state.set.reduce ? gameConfig.RESPIN_PAUSE_REDUCED_MS : gameConfig.RESPIN_PAUSE_MS); ui.mood('spinning');
          }
          await animateStep(step);
          const wilds = step.grid.flat().filter((symbol) => symbol === 'wild').length;
          if (step.payout > 0) {
          const prize = engine.prizeTier(step.payout / bet);
            skipButton.hidden = false;
            try {
              await reels.highlightSequence(step.wins, gameConfig.WIN_LINE_HOLD_MS, gameConfig.WIN_LINE_HOLD_REDUCED_MS, state.set.reduce, () => skipNow,
                (index, total) => { if (total > 1) winLabel.textContent = TigerI18n.t('win.line', { index, total }); });
              ui.mood('cheer'); mascot.classList.add('happy'); sound.win(Math.min(4, prize.level)); impact(prize.level);
              winLabel.textContent = step.respin ? TigerI18n.t('win.respin') : (prize.level >= 2 ? TigerI18n.t(prize.name) : TigerI18n.t('win.generic'));
              winbar.classList.add('flash', 'hit'); winbar.closest('.stage')?.classList.add('lit'); // painel e palco acendem até o próximo giro
              const size = getSize(); effects.burst(Math.min(gameConfig.WIN_STEP_BURST_CAP, gameConfig.WIN_STEP_BURST_BASE + step.payout / bet * gameConfig.WIN_STEP_BURST_RATIO), size.width / 2, size.height * .45, .8);
              if (prize.level >= 2) { coinRain(prize.coins); sweepMachine(); }
              const from = credited, to = credited + step.payout; credited = to;
              const countMs = state.set.reduce ? gameConfig.WIN_COUNT_REDUCED_MS : gameConfig.WIN_COUNT_MS;
              const balanceCountMs = state.set.reduce ? gameConfig.WIN_BALANCE_COUNT_REDUCED_MS : gameConfig.WIN_BALANCE_COUNT_MS;
              await Promise.all([
                countTo(winAmount, from, to, countMs, (value) => { winAmount.textContent = format(value); }, true),
                countTo($('balance'), shown, before + to, balanceCountMs, (value) => { $('balance').textContent = format(value); }),
              ]);
              shown = before + to; $('balance').parentElement.classList.add('pop'); setTimeout(() => $('balance').parentElement.classList.remove('pop'), gameConfig.BALANCE_POP_MS);
              skipNow = false;
              const pauseMs = state.set.reduce ? gameConfig.POST_WIN_STEP_REDUCED_MS : turbo ? gameConfig.POST_WIN_STEP_TURBO_MS : gameConfig.POST_WIN_STEP_MS;
              await sleep(pauseMs);
            } finally { skipButton.hidden = true; }
          } else if (wilds && !step.respin) sound.lock();
        }
        mascot.classList.remove('happy'); skipNow = false;
        const totalTier = engine.prizeTier(ratio);
        if (totalTier.level >= 2) onWinTier(totalTier, round.total, bet); // cartão de vitória (experiência)
        if (totalTier.level >= 1) tip('tiers');
        if (totalTier.level >= 3) { ui.say('big', gameConfig.BIG_SPEECH_MS); await bigWin(round.total, totalTier); }
        else if (totalTier.level >= 1) { ui.say('win'); sound.layer(totalTier.level, gameConfig.LAYER_MS); }
        else { winLabel.textContent = TigerI18n.t('win.tryAgain'); ui.say('lose'); }
        if (round.total > 0) { winLabel.textContent = TigerI18n.t('win.total'); winAmount.textContent = format(round.total); }
        addXp(10 + Math.min(40, Math.round(ratio * 2)));
        setShown(state.balance); ui.updateHud(); persisted = save(); clearHighlightSoon(round.total > 0);
        if (!persisted) ui.toast(TigerI18n.t('toast.saveFailed'), gameConfig.INTERRUPTED_TOAST_MS);
        continueAuto = true;
      } catch (error) {
        console.error(settled ? 'A apresentação da rodada falhou.' : 'A rodada não pôde ser iniciada.', error);
        autoLeft = 0; setAuto();
        if (settled) persisted = save();
        const message = !settled
          ? TigerI18n.t('toast.startFailed')
          : persisted
            ? TigerI18n.t('toast.interruptedSaved')
            : TigerI18n.t('toast.interruptedUnsaved');
        ui.toast(message, gameConfig.INTERRUPTED_TOAST_MS);
        reels.clearHighlight(); reels.setLocks([]); setShown(state.balance); ui.updateHud();
      } finally {
        mascot.classList.remove('happy', 'big'); frame.classList.remove('glow', 'shake');
        reels.setLocks([]); skipButton.hidden = true;
        ui.mood('idle'); busy = false; ui.setSpinDisabled(false); updateMissionsDot();
        if (continueAuto && autoLeft > 0) {
          autoLeft--; setAuto();
          if (autoLeft > 0 && state.balance >= state.bet) setTimeout(() => !busy && spin(), turbo ? gameConfig.AUTO_TURBO_DELAY_MS : gameConfig.AUTO_DELAY_MS);
          else if (state.balance < state.bet) { autoLeft = 0; setAuto(); }
        }
      }
    }

    function toggleAuto() {
      sound.init();
      if (autoLeft > 0) { autoLeft = 0; setAuto(); return; }
      if (!canSpin()) return;
      autoLeft = gameConfig.AUTO_SPINS; setAuto(); if (!busy) spin();
    }
    function toggleTurbo() {
      turbo = !turbo; $('turbo').classList.toggle('on', turbo); sound.click();
      if (turbo) { getState().stats.turbo++; save(); } // missão de descoberta: usar o turbo
      ui.toast(turbo ? TigerI18n.t('toast.turboOn') : TigerI18n.t('toast.turboOff'), gameConfig.TURBO_TOAST_MS);
    }
    function skipCount() { if (busy) skipNow = true; }
    function failNextAnimation() { failNext = true; }
    const preview = (ratio) => { const tier = engine.prizeTier(ratio); return tier.level >= 3 ? bigWin(ratio * 10, tier) : null; };

    return {
      spin, toggleAuto, toggleTurbo, skipCount, failNextAnimation, preview,
      get busy() { return busy; }, get turbo() { return turbo; }, get autoLeft() { return autoLeft; },
    };
  }

  return { create };
});

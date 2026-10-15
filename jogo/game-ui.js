/* Apresentação de estado do TIGRINHO: HUD, feedbacks e controles acessíveis.
   Não decide regras nem persiste estado; recebe state e dependências por contrato. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TigerGameUI = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  // Falas do mascote guardam chaves de jogo/i18n/*.js; o texto sai no idioma atual.
  const PHRASES = {
    idle: ['phrase.idle.1', 'phrase.idle.2', 'phrase.idle.3', 'phrase.idle.4'],
    win: ['phrase.win.1', 'phrase.win.2', 'phrase.win.3', 'phrase.win.4'],
    big: ['phrase.big.1', 'phrase.big.2', 'phrase.big.3'],
    lose: ['phrase.lose.1', 'phrase.lose.2', 'phrase.lose.3'],
    wild: ['phrase.wild.1', 'phrase.wild.2'],
  };

  function create({ elements, getState, progression, gameConfig, format }) {
    const toastTimers = new WeakMap();
    let phraseTimer = null;
    const $ = (id) => elements[id];

    function setBalance(value) {
      $('balance').textContent = format(value);
    }

    function updateHud() {
      const state = getState();
      $('bet').textContent = format(state.bet);
      $('lvl').textContent = state.level;
      $('xpbar').style.width = Math.min(100, (state.xp / progression.xpNeeded(state.level, gameConfig)) * 100) + '%';
      $('app').dataset.theme = state.theme;
      $('app').classList.toggle('reduce', state.set.reduce);
    }

    function setSpinDisabled(disabled) {
      for (const id of ['spin', 'auto', 'betUp', 'betDown', 'turbo']) {
        const button = $(id);
        button.disabled = !!disabled;
        if (disabled) button.setAttribute('aria-disabled', 'true');
        else button.removeAttribute('aria-disabled');
      }
      $('spin').classList.toggle('busy', !!disabled);
    }

    function toast(message, duration = gameConfig.TOAST_MS) {
      const el = $('toast');
      const oldTimer = toastTimers.get(el);
      if (oldTimer) clearTimeout(oldTimer);
      el.textContent = message;
      el.classList.add('show');
      toastTimers.set(el, setTimeout(() => el.classList.remove('show'), duration));
    }

    function say(kind, duration = gameConfig.BUBBLE_MS) {
      const phrases = PHRASES[kind] || PHRASES.idle;
      $('bubble').textContent = TigerI18n.t(phrases[Math.floor(Math.random() * phrases.length)]);
      $('bubble').classList.add('show');
      clearTimeout(phraseTimer);
      phraseTimer = setTimeout(() => $('bubble').classList.remove('show'), duration);
    }

    function mood(value) {
      $('mascot').setAttribute('class', 'mascot ' + value);
    }

    // skipRequested é fornecido pelo controller; o callback recebe a posição final uma vez.
    function countTo(el, from, to, duration, callback, sound, skipRequested = () => false) {
      return new Promise((resolve) => {
        const start = performance.now();
        let lastSoundStep = -1;
        const frame = (time) => {
          if (skipRequested()) {
            callback(to, 1);
            resolve();
            return;
          }
          const progress = Math.min(1, (time - start) / duration);
          const value = from + (to - from) * (1 - Math.pow(1 - progress, 3));
          callback(value, progress);
          const soundStep = Math.floor(progress * gameConfig.COUNT_SOUND_STEPS);
          if (sound && soundStep !== lastSoundStep) {
            lastSoundStep = soundStep;
            sound(soundStep);
          }
          if (progress < 1) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });
    }

    return { setBalance, updateHud, setSpinDisabled, toast, say, mood, countTo };
  }

  return { create };
});

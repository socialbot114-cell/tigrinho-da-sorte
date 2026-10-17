/* Menus e modais do TIGRINHO. Recebe estado/ações; regras de progressão ficam em progression.js.
   Textos vêm de TigerI18n (jogo/i18n/*.js): este arquivo só guarda chaves. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TigerMenus = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  function create({ getState, setState, fresh, progression, gameConfig, engine, ui, sound, save, setShown, format, sym, burst, rain, refillChips, dailyBonus, dailyStep, dailyDays, onSetting = () => {}, onProgress = () => {}, onWellbeing = () => {}, onLanguage = () => {}, onFeel = () => {}, getSession = () => ({ minutes: 0, rounds: 0, prizeRounds: 0, newItems: [] }) }) {
    const $ = (id) => document.getElementById(id);
    const WB = TigerWellbeing;
    const T = (key, params) => TigerI18n.t(key, params);
    let previousFocus = null;
    const modalEl = $('modal'), card = $('modalCard');

    function closeModal() {
      if (modalEl.hidden) return;
      modalEl.hidden = true;
      if (previousFocus && previousFocus.isConnected && previousFocus.focus) previousFocus.focus({ preventScroll: true });
      previousFocus = null;
    }

    function modal(html, onMount) {
      if (modalEl.hidden) previousFocus = document.activeElement;
      card.innerHTML = html;
      card.setAttribute('role', 'dialog');
      card.setAttribute('aria-modal', 'true');
      card.setAttribute('aria-labelledby', 'modalTitle');
      card.setAttribute('tabindex', '-1');
      modalEl.hidden = false;
      card.querySelectorAll('[data-close]').forEach((button) => { button.onclick = closeModal; });
      if (onMount) onMount(card);
      const first = card.querySelector('button:not(:disabled), [href], input, select, textarea');
      (first || card).focus({ preventScroll: true });
    }

    modalEl.addEventListener('keydown', (event) => {
      if (modalEl.hidden) return;
      if (event.key === 'Escape') { event.preventDefault(); closeModal(); return; }
      if (event.key !== 'Tab') return;
      const items = [...card.querySelectorAll('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')];
      if (!items.length) { event.preventDefault(); card.focus(); return; }
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });

    function refill() {
      modal(`<svg class="dog-big" viewBox="0 0 160 190" aria-hidden="true"><use href="#s-mascot"/></svg><h2 id="modalTitle">${T('refill.title')}</h2><p>${T('refill.text', { amount: format(refillChips) })}</p><button class="btn" id="getRefill">${T('refill.button')}</button>`,
        (c) => { c.querySelector('#getRefill').onclick = () => { const state = getState(); state.balance += refillChips; setShown(state.balance); save(); burst(40); closeModal(); ui.toast(T('toast.refill', { amount: format(refillChips) })); }; });
    }

    function daily() {
      const state = getState();
      const today = new Date().toDateString(); if (state.lastDaily === today) return;
      const yesterday = new Date(Date.now() - gameConfig.DAY_MS).toDateString();
      const twoDaysAgo = new Date(Date.now() - 2 * gameConfig.DAY_MS).toDateString();
      const streak = engine.nextStreak(state.lastDaily, today, yesterday, state.streak, dailyDays, twoDaysAgo);
      const reward = engine.dailyReward(streak, dailyBonus, dailyStep, dailyDays);
      const dots = Array.from({ length: dailyDays }, (_, i) => `<span class="${i < streak ? 'on' : ''}"></span>`).join('');
      const tail = streak >= dailyDays ? T('daily.max') : T('daily.next');
      modal(`<svg class="dog-big" viewBox="0 0 160 190" aria-hidden="true"><use href="#s-mascot"/></svg><h2 id="modalTitle">${T('daily.title')}</h2><p>${T('daily.day', { streak })}${tail}</p><div class="days">${dots}</div><p style="font-size:30px;color:#ffd24a">${T('daily.reward', { amount: format(reward) })}</p><button class="btn" id="getDaily">${T('daily.button')}</button>`,
        (c) => { c.querySelector('#getDaily').onclick = () => { sound.init(); sound.big(); state.lastDaily = today; state.streak = streak; state.balance += reward; setShown(state.balance); save(); rain(40); closeModal(); }; });
    }

    // Tutorial (Q3-01): só leitura. Não mexe em saldo, aposta nem gira. "Pular" fica visível em todos os passos.
    function tutorial(done) {
      const steps = TigerTutorial.STEPS;
      let index = 0;
      const finish = () => {
        const state = getState();
        state.seen.tutorial = true; save();
        closeModal();
        if (done) done();
      };
      const show = () => {
        const step = steps[index], last = TigerTutorial.isLast(index);
        const dots = steps.map((_, i) => `<span class="${i <= index ? 'on' : ''}"></span>`).join('');
        modal(`<svg class="dog-big" viewBox="0 0 160 190" aria-hidden="true"><use href="#s-mascot"/></svg><h2 id="modalTitle">${T(step.title)}</h2><p>${T(step.text)}</p><div class="days" aria-label="${T('tut.progress', { n: index + 1, total: steps.length })}">${dots}</div><button class="btn" id="tutNext">${last ? T('tut.start') : T('tut.next')}</button><button class="btn alt" id="tutSkip">${T('tut.skip')}</button>`,
          (c) => {
            c.querySelector('#tutNext').onclick = () => { if (last) finish(); else { index++; show(); } };
            c.querySelector('#tutSkip').onclick = finish;
          });
      };
      show();
    }

    // Menu em três grupos (experiência): Jogar, Progresso e Mais. Os botões continuam os mesmos.
    function menu() {
      const group = (key) => `<p class="menu-group">${T(key)}</p>`;
      const btn = (action, key) => `<button class="btn alt" data-a="${action}">${T(key)}</button>`;
      modal(`<h2 id="modalTitle">${T('menu.title')}</h2>${group('menu.group.play')}${btn('pay', 'menu.prizes')}${btn('mis', 'menu.missions')}${btn('thm', 'menu.themes')}${group('menu.group.progress')}${btn('sess', 'menu.session')}${btn('col', 'menu.collection')}${btn('hist', 'menu.history')}${group('menu.group.more')}${btn('set', 'menu.settings')}${btn('how', 'menu.how')}${btn('about', 'menu.about')}<button class="btn" data-close>${T('menu.back')}</button>`,
        (c) => c.querySelectorAll('[data-a]').forEach((button) => {
          button.onclick = () => ({ pay: paytable, mis: missions, thm: themes, sess: sessionView, set: settings, col: collection, hist: history, how: tutorial, about }[button.dataset.a]());
        }));
    }

    const back = `<button class="btn alt" id="back">${T('nav.back')}</button>`;
    const wireBack = (c) => { c.querySelector('#back').onclick = menu; };

    function paytable() {
      const state = getState(), lineBet = state.bet / 5;
      modal(`<h2 id="modalTitle">${T('prizes.title')}</h2><p>${T('prizes.intro')}</p>
        ${engine.SYMBOLS.map((symbol) => `<div class="row"><span class="l">${sym(symbol.id)}${T(symbol.name)}</span><b>${format(symbol.pay * lineBet)}</b></div>`).join('')}
        <p>${T('prizes.respin', { max: engine.MAX_RESPINS })}</p><p style="opacity:.7;font-size:12px">${T('prizes.note')}</p>${back}`, wireBack);
    }

    // Rodízio (Q3-03): diárias e semanais. Renovam sozinhas; não há contagem regressiva na tela.
    const ROTATION_LABEL = { daily: ['rot.today', 'rot.renewDaily'], weekly: ['rot.week', 'rot.renewWeekly'] };
    function rotationHtml(state) {
      return Object.keys(ROTATION_LABEL).map((kind) => {
        const [title, renew] = ROTATION_LABEL[kind];
        const rows = progression.rotationView(state, kind).map((m) => `<div class="mission"><div>${T(m.text, { n: m.goal })}</div><div class="bar"><i style="width:${(m.progress / m.goal) * 100}%"></i></div><div style="display:flex;justify-content:space-between;align-items:center"><span>${m.progress}/${m.goal} • 🪙 ${format(m.reward)}</span>${m.claimed ? `<span>${T('rot.claimed')}</span>` : `<button data-r="${kind}:${m.id}" ${m.ready ? '' : 'disabled'}>${T('mission.claim')}</button>`}</div></div>`).join('');
        return `<p style="text-align:left;margin:10px 0 2px;color:#ffe9a0;font-size:13px"><b>${T(title)}</b> · ${T(renew)}</p>${rows}`;
      }).join('');
    }

    function missions() {
      const state = getState();
      progression.refreshRotations(state, new Date());
      modal(`<h2 id="modalTitle">${T('missions.title')}</h2>${rotationHtml(state)}<p style="text-align:left;margin:14px 0 2px;color:#ffe9a0;font-size:13px"><b>${T('missions.longTerm')}</b></p>${progression.MISSIONS.map((mission) => {
        const progress = Math.min(progression.missionProgress(state, mission), progression.missionTarget(state, mission, gameConfig.MISSION_GROWTH_FACTOR));
        const goal = progression.missionTarget(state, mission, gameConfig.MISSION_GROWTH_FACTOR), ready = progress >= goal;
        return `<div class="mission"><div>${T(mission.text, { n: goal })}</div><div class="bar"><i style="width:${(progress / goal) * 100}%"></i></div><div style="display:flex;justify-content:space-between;align-items:center"><span>${progress}/${goal} • 🪙 ${format(progression.missionReward(state, mission))}</span><button data-m="${mission.id}" ${ready ? '' : 'disabled'}>${T('mission.claim')}</button></div></div>`;
      }).join('')}${back}`,
      (c) => {
        wireBack(c);
        c.querySelectorAll('[data-r]').forEach((button) => { button.onclick = () => {
          const [kind, id] = button.dataset.r.split(':');
          const result = progression.claimRotation(getState(), kind, id);
          if (!result.claimed) return;
          const stateNow = getState(); setShown(stateNow.balance); save(); onProgress(); sound.levelup(); burst(30); missions();
        }; });
        c.querySelectorAll('[data-m]').forEach((button) => { button.onclick = () => {
          const result = progression.claimMission(getState(), button.dataset.m, gameConfig.MISSION_GROWTH_FACTOR);
          if (!result.claimed) return;
          const stateNow = getState(); setShown(stateNow.balance); save(); onProgress(); sound.levelup(); burst(30); missions();
        }; });
      });
    }

    function themes() {
      const state = getState();
      modal(`<h2 id="modalTitle">${T('themes.title')}</h2>${progression.THEMES.map((theme) => `<div class="row"><span>${T(theme.name)}${state.theme === theme.id ? ' ✅' : ''}</span>${state.level >= theme.lvl ? `<button class="btn" style="width:auto;margin:0;padding:6px 14px" data-t="${theme.id}">${T('themes.use')}</button>` : `<span>${T('themes.locked', { lvl: theme.lvl })}</span>`}</div>`).join('')}${back}`,
        (c) => { wireBack(c); c.querySelectorAll('[data-t]').forEach((button) => { button.onclick = () => { getState().theme = button.dataset.t; ui.updateHud(); save(); themes(); }; }); });
    }

    // Histórico (Q3-09): últimas rodadas, só neste aparelho. Sem "melhor rodada" nem sugestão de aposta maior.
    function history() {
      const state = getState();
      const when = (t) => new Date(t).toLocaleString(TigerI18n.locale(), { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      const rows = [...state.hist].reverse().map((e) => `<div class="row"><span>${when(e.t)}</span><span>${T('history.bet', { amount: format(e.bet) })}</span><b>${e.total > 0 ? '+' + format(e.total) : '0'}</b></div>`).join('')
        || `<p>${T('history.empty')}</p>`;
      modal(`<h2 id="modalTitle">${T('history.title')}</h2><p style="font-size:12px;opacity:.8">${T('history.note', { limit: gameConfig.HISTORY_LIMIT })}</p>${rows}${back}`, wireBack);
    }

    // Resumo da sessão (experiência): minutos, rodadas e itens novos. Sem metas e sem convite a continuar.
    const FEEL = { good: '😊', ok: '😐', bad: '🙁' };
    const FEEL_LABEL = { good: 'feel.good', ok: 'feel.ok', bad: 'feel.bad' };
    function sessionView() {
      const s = getSession();
      modal(`<h2 id="modalTitle">${T('session.title')}</h2><p>${T('session.minutes', { min: s.minutes })}</p><div class="row"><span>${T('session.rounds')}</span><b>${s.rounds}</b></div><div class="row"><span>${T('session.prizes')}</span><b>${s.prizeRounds}</b></div><div class="row"><span>${T('session.items')}</span><b>${s.newItems.length}</b></div><p style="margin-top:14px">${T('session.feelAsk')}</p><div class="feel">${Object.keys(FEEL).map((v) => `<button class="btn alt feel-btn" data-feel="${v}" aria-label="${T(FEEL_LABEL[v])}">${FEEL[v]}</button>`).join('')}</div>${back}`,
        (c) => {
          wireBack(c);
          c.querySelectorAll('[data-feel]').forEach((button) => { button.onclick = () => {
            onFeel(button.dataset.feel); ui.toast(T('session.thanks'));
            c.querySelectorAll('[data-feel]').forEach((b) => b.classList.toggle('on', b === button));
          }; });
        });
    }

    // Coleção do mascote (Q3-04): itens desbloqueados ficam para sempre; os bloqueados mostram o progresso.
    function collection() {
      const state = getState();
      modal(`<h2 id="modalTitle">${T('collection.title')}</h2><p>${T('collection.note')}</p>${progression.COSMETICS.map((item) => {
        const owned = state.cos.includes(item.id);
        const value = Math.min(item.value(state), item.goal);
        const progress = owned ? '' : `<small style="display:block;margin-top:4px">${T('collection.progress', { value, goal: item.goal })}</small>`;
        return `<div class="row"><span class="l">${owned ? '✅' : '🔒'}&nbsp;<span>${T(item.name)}<br><small style="opacity:.8">${owned ? T('collection.owned') : T(item.how)}</small>${progress}</span></span></div>`;
      }).join('')}${back}`, wireBack);
    }

    // Autoexclusão (Q3-12): escolha, confirmação e prazo que não encurta. Sem botão de cancelar.
    const EXCLUSION_LABEL = { '24h': 'exclusion.24h', '7d': 'exclusion.7d', '30d': 'exclusion.30d' };
    const untilText = (t) => new Date(t).toLocaleString(TigerI18n.locale(), { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    function exclusion() {
      const state = getState();
      const active = state.wb.excludeUntil > Date.now();
      const options = Object.keys(WB.EXCLUSIONS).map((k) => `<button class="btn alt" data-ex="${k}">${T(EXCLUSION_LABEL[k])}</button>`).join('');
      modal(`<h2 id="modalTitle">${T('exclusion.title')}</h2><p>${T('exclusion.intro')}</p>${active ? `<p>${T('exclusion.active', { date: untilText(state.wb.excludeUntil) })}</p>` : options}${back}`,
        (c) => { wireBack(c); c.querySelectorAll('[data-ex]').forEach((b) => { b.onclick = () => confirmExclusion(b.dataset.ex); }); });
    }
    function confirmExclusion(choice) {
      modal(`<h2 id="modalTitle">${T('exclusion.confirmTitle')}</h2><p>${T('exclusion.confirmText', { label: T(EXCLUSION_LABEL[choice]) })}</p><button class="btn" id="exConfirm">${T('exclusion.confirm')}</button><button class="btn alt" id="exBack">${T('nav.backArrow')}</button>`,
        (c) => {
          c.querySelector('#exBack').onclick = exclusion;
          c.querySelector('#exConfirm').onclick = () => {
            const state = getState();
            state.wb.excludeUntil = WB.exclusionUntil(state.wb.excludeUntil, Date.now(), choice, gameConfig.DAY_MS);
            save(); onWellbeing('exclusion'); closeModal();
          };
        });
    }

    function settings() {
      const state = getState();
      const volume = (key, label) => `<div class="row"><label for="vol-${key}">${label}</label><input id="vol-${key}" type="range" min="0" max="10" step="1" value="${state.set[key]}" data-vol="${key}" aria-valuetext="${state.set[key] * 10}%"></div>`;
      const option = (key, label) => `<div class="row"><span>${label}</span><button class="btn ${state.set[key] ? '' : 'alt'}" style="width:auto;margin:0;padding:6px 16px" data-s="${key}" aria-pressed="${state.set[key]}">${state.set[key] ? T('settings.on') : T('settings.off')}</button></div>`;
      const limitText = state.wb.limit ? T('settings.minutes', { min: state.wb.limit }) : T('settings.off');
      const language = `<div class="row"><span>${T('settings.language')}</span><button class="btn alt" style="width:auto;margin:0;padding:6px 14px" data-lang="${TigerI18n.lang()}">${T('lang.name')}</button></div>`;
      modal(`<h2 id="modalTitle">${T('settings.title')}</h2>${language}${option('music', T('settings.music'))}${option('sfx', T('settings.sfx'))}${option('vib', T('settings.vib'))}${option('reduce', T('settings.reduce'))}${option('tilt', T('settings.tilt'))}${option('analytics', T('settings.analytics'))}${volume('musicVol', T('settings.musicVolume'))}${volume('sfxVol', T('settings.sfxVolume'))}<div class="row"><span>${T('settings.sessionLimit')}</span><button class="btn alt" style="width:auto;margin:0;padding:6px 14px" data-wb="limit">${limitText}</button></div><div class="row"><span>${T('settings.exclusion')}</span><button class="btn alt" style="width:auto;margin:0;padding:6px 14px" data-wb="exclude" ${state.wb.excludeUntil > Date.now() ? 'disabled' : ''}>${state.wb.excludeUntil > Date.now() ? T('settings.exclusionActive') : T('settings.open')}</button></div><button class="btn alt" id="reset" style="margin-top:18px">${T('settings.reset')}</button>${back}`,
        (c) => {
          wireBack(c);
          c.querySelectorAll('[data-s]').forEach((button) => { button.onclick = () => {
            const key = button.dataset.s, current = getState(); current.set[key] = !current.set[key];
            if (key === 'music') sound.setMusic(current.set[key]);
            if (key === 'sfx') sound.setSfx(current.set[key]);
            ui.updateHud(); save();
            onSetting(key, current.set[key]); // chamado dentro do clique: permite pedir permissão de movimento no iOS
            settings();
          }; });
          // Idioma (Q4-09): troca os textos e salva a escolha.
          c.querySelector('[data-lang]').onclick = () => {
            const next = TigerI18n.lang() === 'pt-BR' ? 'en' : 'pt-BR';
            TigerI18n.setLang(next); getState().set.lang = next; save(); onLanguage(); settings();
          };
          // Volume ao vivo (Q3-08): cada controle ajusta só a sua parte e salva no save.
          c.querySelectorAll('[data-vol]').forEach((input) => { input.oninput = () => {
            const key = input.dataset.vol, current = getState(), value = Number(input.value);
            current.set[key] = value; input.setAttribute('aria-valuetext', `${value * 10}%`);
            if (key === 'musicVol') sound.setMusicVolume(value / 10); else sound.setSfxVolume(value / 10);
            save();
          }; });
          // Limite de sessão (Q3-10) e autoexclusão (Q3-12).
          c.querySelectorAll('[data-wb]').forEach((button) => { button.onclick = () => {
            if (button.dataset.wb === 'limit') {
              const current = getState();
              current.wb.limit = WB.nextLimit(current.wb.limit); save(); onWellbeing('limit'); settings();
            } else exclusion();
          }; });
          c.querySelector('#reset').onclick = () => {
            // A autoexclusão sobrevive a "Apagar progresso": não pode ser desfeita pela interface.
            if (window.confirm(T('settings.resetConfirm'))) {
              const keptExclusion = getState().wb.excludeUntil, next = fresh();
              next.wb.excludeUntil = keptExclusion; setState(next); save(); location.reload();
            }
          };
        });
    }

    function about() {
      modal(`<h2 id="modalTitle">TIGRINHO</h2><p>${T('about.p1')}</p><p>${T('about.p2')}</p><p>${T('about.p3')}</p>${back}`, wireBack);
    }

    return { modal, closeModal, menu, daily, refill, paytable, missions, themes, settings, about, tutorial, collection, history };
  }

  return { create };
});

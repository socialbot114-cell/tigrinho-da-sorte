/* TIGRINHO — interface, animações, progressão. Fichas fictícias.
   Enriquecido com padrões do groangroan/slot-game (MIT): timings, blur,
   bounce, disableSpin e auto-stop de vitória. Ver THIRD_PARTY_NOTICES.md. */
(() => {
  const E = TigerEngine;
  const CFG = (typeof TigerConfig !== 'undefined') ? TigerConfig : null;
  const RC = CFG ? CFG.reelsConfig : { SPIN_DURATION: 850, REEL_OFFSET_TIME: 300, TURBO_SPIN_DURATION: 380, TURBO_OFFSET_TIME: 110, ANTICIPATION_EXTRA: 900, BLUR_PX: 1.4, FILLER_DIVISOR: 85 };
  const $ = (id) => document.getElementById(id);
  const KEY = 'tigrinho.save.v1';
  const START_CHIPS = 10000, REFILL = 1500;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const fmt = (n) => Math.round(n).toLocaleString('pt-BR');

  // ---------- estado salvo ----------
  const MISSIONS = [
    { id: 'spins', base: 20, stat: 'spins', reward: 500, text: (n) => `Gire ${n} vezes` },
    { id: 'wins', base: 8, stat: 'wins', reward: 600, text: (n) => `Ganhe ${n} rodadas` },
    { id: 'wilds', base: 3, stat: 'wilds', reward: 800, text: (n) => `Acerte ${n} Caramelos WILD` },
    { id: 'bigs', base: 1, stat: 'bigs', reward: 1500, text: (n) => `Consiga ${n} vitória(s) grande(s)` },
  ];
  const THEMES = [{ id: 'red', name: 'Festival Vermelho', lvl: 1 }, { id: 'jade', name: 'Jardim de Jade', lvl: 3 }, { id: 'noite', name: 'Noite de Lanternas', lvl: 6 }];
  const fresh = () => ({
    balance: START_CHIPS, bet: 10, xp: 0, level: 1, theme: 'red', lastDaily: '', streak: 0,
    stats: { spins: 0, wins: 0, wilds: 0, bigs: 0, best: 0 },
    m: Object.fromEntries(MISSIONS.map((x) => [x.id, { tier: 0, start: 0 }])),
    set: { music: true, sfx: true, vib: true, reduce: matchMedia('(prefers-reduced-motion: reduce)').matches },
  });
  let S;
  try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { S = fresh(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

  // ---------- DOM ----------
  const app = $('app'), reelsEl = $('reels'), frame = document.querySelector('.frame'), mascot = $('mascot'),
        bubble = $('bubble'), spinBtn = $('spin'), balEl = $('balance'), winAmt = $('winamt'), winbar = $('winbar'), winLabel = $('winlabel');
  const sym = (id) => `<svg viewBox="0 0 100 100"><use href="#s-${id}"/></svg>`;
  let busy = false, turbo = false, autoLeft = 0, shown = S.balance, skipBig = false;
  const vib = (p) => { if (S.set.vib && navigator.vibrate) try { navigator.vibrate(p); } catch (e) {} };

  // ---------- rolos ----------
  let grid = [['lantern', 'orange', 'bag'], ['cracker', 'ingot', 'envelope'], ['orange', 'lantern', 'cracker']];
  const reels = [0, 1, 2].map((c) => {
    const el = document.createElement('div'); el.className = 'reel';
    const strip = document.createElement('div'); strip.className = 'strip'; el.appendChild(strip);
    reelsEl.appendChild(el); return { el, strip };
  });
  const H = () => reels[0].el.clientHeight / 3;
  function paintStatic(c) { reels[c].strip.style.transition = 'none'; reels[c].strip.style.transform = 'translateY(0)'; reels[c].strip.innerHTML = grid[c].map((s) => `<div class="cell">${sym(s)}</div>`).join(''); }
  [0, 1, 2].forEach(paintStatic);

  function spinReel(c, finals, dur, filler) {
    return new Promise((res) => {
      const { strip } = reels[c], h = H(), cur = grid[c];
      const mid = Array.from({ length: filler }, () => E.randomSymbol(Math.random));
      strip.style.transition = 'none';
      strip.innerHTML = [...finals, ...mid, ...cur].map((s) => `<div class="cell">${sym(s)}</div>`).join('');
      strip.style.transform = `translateY(${-(filler + 3) * h}px)`;
      // Blur durante o giro — espelha Reels.animateReel (Pixi BlurFilter) do slot-game.
      strip.style.filter = `blur(${RC.BLUR_PX}px)`;
      void strip.offsetHeight;
      // Curva com leve overshoot (bounce de assentamento, cf. GameSymbol.bounce).
      strip.style.transition = `transform ${dur}ms cubic-bezier(.22,.8,.28,1.06)`;
      strip.style.transform = 'translateY(0)';
      setTimeout(() => {
        strip.style.filter = '';
        // Bounce de assentamento: marca as 3 células visíveis com .pop (CSS win-settle).
        try {
          const cells = strip.children;
          for (let i = 0; i < Math.min(3, cells.length); i++) {
            cells[i].classList.add('pop');
            setTimeout(() => cells[i] && cells[i].classList.remove('pop'), 450);
          }
        } catch (e) {}
        res();
      }, dur);
    });
  }
  const motionScale = () => (S.set.reduce ? .25 : 1);

  // Padrão disableSpin portado de SpinButton.setEnabled do slot-game:
  // desabilita giro/aposta/auto durante o spin (alpha + bloqueio de clique).
  function disableSpin(spinning) {
    const disabled = !!spinning;
    for (const id of ['spin', 'auto', 'betUp', 'betDown', 'turbo']) {
      const b = $(id);
      if (!b) continue;
      if (disabled) { b.setAttribute('aria-disabled', 'true'); b.style.opacity = '.55'; }
      else { b.removeAttribute('aria-disabled'); b.style.opacity = ''; }
    }
    spinBtn.classList.toggle('busy', disabled);
  }

  async function animateStep(step, spinsMask) {
    const base = (turbo ? RC.TURBO_SPIN_DURATION : RC.SPIN_DURATION) * motionScale();
    const gap = (turbo ? RC.TURBO_OFFSET_TIME : RC.REEL_OFFSET_TIME) * motionScale();
    const wildFirstTwo = step.grid[0].includes('wild') || step.grid[1].includes('wild');
    const ps = reels.map(async (r, c) => {
      const antic = c === 2 && wildFirstTwo && !turbo && !S.set.reduce;
      const dur = base + c * gap + (antic ? RC.ANTICIPATION_EXTRA : 0), filler = Math.max(4, Math.round(dur / RC.FILLER_DIVISOR) + c * 2);
      if (antic) setTimeout(() => { r.el.classList.add('anticipate'); Sound.anticipation(); }, base + gap);
      await spinReel(c, step.grid[c], dur, filler);
      r.el.classList.remove('anticipate');
      grid[c] = step.grid[c].slice(); paintStatic(c); Sound.stop(c); vib(8);
    });
    // ticks durante o giro
    const tk = setInterval(() => Sound.tick(), 70); await Promise.all(ps); clearInterval(tk);
    // hitstop: pausa curta quando um curinga cai, antes de revelar o prêmio
    if (step.grid.flat().includes('wild') && !S.set.reduce) { impact(1); await sleep(90); }
  }
  // impacto proporcional ao tier: vibração, tremor e faíscas
  function impact(level) {
    if (level >= 2) shake();
    vib(level >= 3 ? [40, 30, 40] : level === 2 ? 22 : 10);
    if (level >= 1) burst(6 + level * 4, W / 2, Hh * .45, .5 + level * .15);
  }

  // ---------- efeitos ----------
  const fx = $('fx'), g = fx.getContext('2d'); let parts = [], petals = [], W = 0, Hh = 0;
  function resize() { const d = Math.min(devicePixelRatio || 1, 2); fx.width = innerWidth * d; fx.height = innerHeight * d; g.setTransform(d, 0, 0, d, 0, 0); W = innerWidth; Hh = innerHeight; orient(); }
  // Orientação: retrato é o modo principal; paisagem usa layout adaptativo (CSS)
  // + dica discreta em ecrãs curtos. Tenta travar em retrato quando instalado (PWA).
  function orient() {
    const land = innerWidth > innerHeight;
    const short = innerHeight < 500 && land;
    app.dataset.orient = land ? 'landscape' : 'portrait';
    const hint = $('rotateHint');
    if (hint) hint.hidden = !short;
    try {
      if (!orient._locked && document.fullscreenElement && screen.orientation && screen.orientation.lock) {
        orient._locked = true; screen.orientation.lock('portrait').catch(() => {});
      }
    } catch (e) {}
  }
  addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 60)); resize();
  for (let i = 0; i < 16; i++) petals.push({ x: Math.random() * 500, y: Math.random() * 900, v: .3 + Math.random() * .6, s: 4 + Math.random() * 5, p: Math.random() * 6 });
  const coinImg = (() => { const c = document.createElement('canvas'); c.width = c.height = 48; const x = c.getContext('2d');
    const gr = x.createRadialGradient(18, 16, 3, 24, 24, 22); gr.addColorStop(0, '#fff6b0'); gr.addColorStop(.6, '#ffc83a'); gr.addColorStop(1, '#b8740a');
    x.fillStyle = gr; x.beginPath(); x.arc(24, 24, 22, 0, 7); x.fill(); x.strokeStyle = '#8a5a00'; x.lineWidth = 3; x.stroke();
    x.fillStyle = '#a86a00'; x.fillRect(18, 18, 12, 12); return c; })();
  function burst(n, x = W / 2, y = Hh * .4, power = 1) {
    n = S.set.reduce ? Math.min(n, 8) : n;
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = (4 + Math.random() * 9) * power;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6 * power, r: Math.random() * 6, vr: .2 + Math.random() * .3, s: 14 + Math.random() * 14, life: 160 + Math.random() * 60 }); }
  }
  function rain(n) { n = S.set.reduce ? Math.min(n, 10) : n;
    for (let i = 0; i < n; i++) setTimeout(() => parts.push({ x: Math.random() * W, y: -30, vx: (Math.random() - .5) * 2, vy: 2 + Math.random() * 4, r: Math.random() * 6, vr: .2 + Math.random() * .3, s: 16 + Math.random() * 14, life: 400, rain: 1 }), i * 25); }
  function loop() {
    g.clearRect(0, 0, W, Hh);
    if (!S.set.reduce) for (const p of petals) { p.y += p.v; p.x += Math.sin((p.y + p.p * 40) / 40) * .6; p.p += .02; if (p.y > Hh + 10) { p.y = -10; p.x = Math.random() * W; }
      g.fillStyle = 'rgba(255,170,190,.55)'; g.beginPath(); g.ellipse(p.x, p.y, p.s, p.s * .55, p.p, 0, 7); g.fill(); }
    parts = parts.filter((p) => p.life-- > 0 && p.y < Hh + 40);
    for (const p of parts) { p.vy += p.rain ? .06 : .35; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      g.save(); g.translate(p.x, p.y); g.scale(Math.abs(Math.cos(p.r)) * .9 + .1, 1); g.drawImage(coinImg, -p.s / 2, -p.s / 2, p.s, p.s); g.restore(); }
    requestAnimationFrame(loop);
  }
  loop();
  function shake() { if (S.set.reduce) return; frame.classList.remove('shake'); void frame.offsetWidth; frame.classList.add('shake'); }

  // ---------- UI helpers ----------
  function setShown(v) { shown = v; balEl.textContent = fmt(v); }
  let skipNow = false; // toque na barra de vitória pula a contagem
  function countTo(el, from, to, ms, cb, snd) {
    return new Promise((res) => { const t0 = performance.now(); let last = -1;
      (function f(t) { if (skipNow) { cb(to, 1); res(); return; } const k = Math.min(1, (t - t0) / ms), v = from + (to - from) * (1 - Math.pow(1 - k, 3)); cb(v, k);
        const n = Math.floor(k * 14); if (snd && n !== last) { last = n; Sound.coin(n); } k < 1 ? requestAnimationFrame(f) : res(); })(t0); });
  }
  function toast(msg, ms = 1800) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), ms); }
  const PHRASES = { idle: ['Vamos girar!', 'Hoje é meu dia de sorte!', 'Bora, campeão(ã)!', 'Toque em GIRAR!'], win: ['Isso aí!', 'Ganhamos!', 'Que giro lindo!', 'Rugiu a sorte!'], big: ['INCRÍVEL!', 'RUUUGIIIU!', 'Eu sabia!!'], lose: ['Quase! De novo!', 'Vai vir!', 'A próxima é nossa!'], wild: ['Caramelo em campo!', 'Respin!']};
  function say(kind, ms = 2200) { const a = PHRASES[kind]; bubble.textContent = a[Math.floor(Math.random() * a.length)]; bubble.classList.add('show'); clearTimeout(say._h); say._h = setTimeout(() => bubble.classList.remove('show'), ms); }
  function mood(m) { mascot.setAttribute('class', 'mascot ' + m); }
  function updateHud() {
    $('bet').textContent = fmt(S.bet); $('lvl').textContent = S.level;
    $('xpbar').style.width = Math.min(100, (S.xp / xpNeed()) * 100) + '%';
    app.dataset.theme = S.theme; app.classList.toggle('reduce', S.set.reduce);
  }
  const xpNeed = () => 100 + (S.level - 1) * 80;
  function addXp(n) {
    S.xp += n;
    while (S.xp >= xpNeed()) { S.xp -= xpNeed(); S.level++; const bonus = 500 * S.level; S.balance += bonus; setShown(shown + bonus);
      Sound.levelup(); burst(30); toast(`⭐ Nível ${S.level}! +${fmt(bonus)} fichas`, 2600); const th = THEMES.find((t) => t.lvl === S.level); if (th) setTimeout(() => toast(`🎨 Novo tema: ${th.name}`, 2600), 2700); }
  }

  // ---------- linhas vencedoras ----------
  function drawLines(wins) {
    const fx_ = $('linefx'), fr = fx_.getBoundingClientRect(); fx_.innerHTML = '';
    if (!wins.length) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('width', fr.width); svg.setAttribute('height', fr.height);
    wins.forEach((w) => { const pts = w.cells.map(([c, r]) => { const b = reels[c].el.getBoundingClientRect(), h = b.height / 3; return `${b.left - fr.left + b.width / 2},${b.top - fr.top + h * r + h / 2}`; }).join(' ');
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'polyline'); p.setAttribute('points', pts);
      p.setAttribute('style', 'fill:none;stroke:#fff7c0;stroke-width:5;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 6px #ff9a1a);stroke-dasharray:10 8'); svg.appendChild(p); });
    fx_.appendChild(svg);
  }
  function highlight(wins) {
    document.querySelectorAll('.cell.win').forEach((e) => e.classList.remove('win'));
    wins.forEach((w) => w.cells.forEach(([c, r]) => reels[c].strip.children[r] && reels[c].strip.children[r].classList.add('win')));
    drawLines(wins);
  }
  const clearHighlight = () => { highlight([]); };
  function setLocks(locked) {
    reels.forEach((r) => r.el.querySelectorAll('.lock').forEach((l) => l.remove()));
    locked.forEach((k) => { const [c, r] = k.split(',').map(Number), d = document.createElement('div'); d.className = 'lock'; d.style.top = `calc(var(--cell) * ${r})`; d.innerHTML = sym('wild'); reels[c].el.appendChild(d); });
  }

  // ---------- vitória grande ----------
  function bigWin(total, tier) {
    return new Promise(async (res) => {
      const ov = $('bigwin'); ov.hidden = false; ov.dataset.lvl = tier.level; $('bwTitle').textContent = tier.name; $('bwAmt').textContent = '0';
      // multiplicador em destaque nos níveis 4 e 5 (total / aposta); vazio nos demais
      const mult = tier.level >= 4 ? 'x' + Math.floor(total / S.bet) : '';
      $('bwMult').textContent = mult;
      const dur = S.set.reduce ? 600 : tier.level >= 5 ? 4200 : tier.level >= 4 ? 3400 : 2600;
      Sound.big(); Sound.gong(); Sound.boost(dur + 1500); frame.classList.add('glow'); mascot.classList.add('big'); mood('cheer'); mascot.classList.add('big'); shake(); vib([60, 40, 60, 40, 120]); rain(tier.coins); burst(40, W / 2, Hh * .45, 1.3);
      if (tier.level >= 4) { setTimeout(() => rain(tier.level >= 5 ? 60 : 30), 900); setTimeout(() => burst(tier.level >= 5 ? 50 : 30, W / 2, Hh * .4, 1.5), 1800); }
      if (tier.level >= 5 && !S.set.reduce) setTimeout(() => { if (!ov.hidden) burst(40, W / 2, Hh * .55, 1.8); }, 2800);
      let done = false; const close = () => { done = true; ov.hidden = true; ov.removeAttribute('data-lvl'); ov.onclick = null; frame.classList.remove('glow'); mascot.classList.remove('big'); skipNow = false; res(); };
      ov.onclick = () => { if (!done) { $('bwAmt').textContent = fmt(total); setTimeout(close, 150); } };
      await countTo($('bwAmt'), 0, total, dur, (v) => { if (!done) $('bwAmt').textContent = fmt(v); }, true);
      if (!done) { burst(30, W / 2, Hh * .45); await sleep(S.set.reduce || turbo || autoLeft ? 600 : 1500); if (!done) close(); }
    });
  }

  // ---------- rodada ----------
  async function spin() {
    if (busy) return; Sound.init();
    if (S.balance < S.bet) {
      const aff = [...E.BETS].reverse().find((b) => b <= S.balance);
      if (aff) { S.bet = aff; updateHud(); toast('Aposta ajustada ao seu saldo'); } else return refill();
    }
    busy = true; disableSpin(true); mood('spinning'); clearHighlight(); setLocks([]);
    winbar.classList.remove('flash'); winLabel.textContent = 'Girando…'; winAmt.textContent = '0';
    const bet = S.bet, round = E.playRound(Math.random, bet);
    // débito e crédito exatamente uma vez, salvos antes da animação
    S.balance += round.total - bet; S.stats.spins++; if (round.total > 0) S.stats.wins++;
    S.stats.wilds += round.steps.reduce((a, st) => a + st.grid.flat().filter((s) => s === 'wild').length - st.locked.length, 0);
    S.stats.best = Math.max(S.stats.best, round.total); const ratio = round.total / bet; if (ratio >= 10) S.stats.bigs++;
    const before = S.balance - round.total; setShown(before); vib(12); Sound.click(); Sound.spin(); say('idle', 800);

    let credited = 0; skipNow = false;
    for (const [i, st] of round.steps.entries()) {
      if (st.respin) { toast(`🐶 RESPIN ${i}/${E.MAX_RESPINS}`, 1300); Sound.lock(); say('wild', 1400); mood('cheer'); setLocks(st.locked); await sleep(S.set.reduce ? 100 : 700); mood('spinning'); }
      await animateStep(st);
      const wilds = st.grid.flat().filter((s) => s === 'wild').length;
      if (st.payout > 0) {
        const stTier = E.prizeTier(st.payout / bet);
        highlight(st.wins); mood('cheer'); mascot.classList.add('happy'); Sound.win(Math.min(4, stTier.level)); impact(stTier.level);
        winLabel.textContent = st.respin ? 'Vitória no respin!' : (stTier.level >= 2 ? stTier.name : 'VITÓRIA!'); winbar.classList.add('flash');
        burst(Math.min(40, 8 + st.payout / bet * 3), W / 2, Hh * .45, .8);
        if (stTier.level >= 2) { coinRain(stTier.coins); sweepMachine(); }
        const a = credited, b = credited + st.payout; credited = b;
        await Promise.all([countTo(winAmt, a, b, S.set.reduce ? 200 : 700, (v) => { winAmt.textContent = fmt(v); }, true), countTo(balEl, shown, before + b, S.set.reduce ? 200 : 700, (v) => { balEl.textContent = fmt(v); })]);
        shown = before + b; $('balance').parentElement.classList.add('pop'); setTimeout(() => $('balance').parentElement.classList.remove('pop'), 300);
        await sleep(S.set.reduce ? 100 : turbo ? 250 : 650);
      } else if (wilds && st.respin === false) { Sound.lock(); }
    }
    mascot.classList.remove('happy'); skipNow = false;
    const tier = E.prizeTier(ratio);
    if (tier.level >= 3) { say('big', 3000); await bigWin(round.total, tier); }
    else if (tier.level >= 1) { say('win'); }
    else { winLabel.textContent = 'Tente de novo!'; say('lose'); }
    if (round.total > 0) { winLabel.textContent = 'Total ganho'; winAmt.textContent = fmt(round.total); }
    addXp(10 + Math.min(40, Math.round(ratio * 2)));
    setShown(S.balance); updateHud(); save(); clearHighlightSoon(round.total > 0);
    mood('idle'); busy = false; disableSpin(false); updateMissionsDot();
    if (autoLeft > 0) { autoLeft--; setAuto(); if (autoLeft > 0 && S.balance >= S.bet) setTimeout(() => !busy && spin(), turbo ? 250 : 700); else if (S.balance < S.bet) { autoLeft = 0; setAuto(); } }
  }
  function sweepMachine() { if (S.set.reduce) return; const m = $('machine'); m.classList.remove('sweep'); void m.offsetWidth; m.classList.add('sweep'); setTimeout(() => m.classList.remove('sweep'), 1000); }
  function coinRain(n) { rain(Math.max(4, Math.min(24, n))); }
  function clearHighlightSoon(had) { if (had) setTimeout(() => { if (!busy) clearHighlight(); }, 2000); }

  // ---------- controles ----------
  function setAuto() { const b = $('auto'); b.classList.toggle('on', autoLeft > 0); b.textContent = autoLeft > 0 ? autoLeft : 'AUTO'; }
  spinBtn.onclick = () => spin();
  winbar.addEventListener('pointerdown', () => { skipNow = true; });
  $('betUp').onclick = () => { if (busy) return; const i = E.BETS.indexOf(S.bet); S.bet = E.BETS[Math.min(E.BETS.length - 1, i + 1)]; Sound.init(); Sound.click(); updateHud(); save(); };
  $('betDown').onclick = () => { if (busy) return; const i = E.BETS.indexOf(S.bet); S.bet = E.BETS[Math.max(0, i - 1)]; Sound.init(); Sound.click(); updateHud(); save(); };
  $('auto').onclick = () => { Sound.init(); if (autoLeft > 0) { autoLeft = 0; setAuto(); return; } autoLeft = 25; setAuto(); if (!busy) spin(); };
  $('turbo').onclick = () => { turbo = !turbo; $('turbo').classList.toggle('on', turbo); Sound.click(); toast(turbo ? '⚡ Turbo ligado' : 'Turbo desligado', 900); };
  addEventListener('keydown', (e) => { if ((e.code === 'Space' || e.code === 'Enter') && $('modal').hidden && $('bigwin').hidden && (!$('splash') || $('splash').hidden)) { e.preventDefault(); spin(); } });
  document.addEventListener('visibilitychange', () => document.hidden ? Sound.suspend() : Sound.resume());
  mascot.addEventListener('pointerdown', () => { say('idle'); });

  // ---------- modais ----------
  function modal(html, onMount) { const m = $('modal'); $('modalCard').innerHTML = html; m.hidden = false; $('modalCard').querySelectorAll('[data-close]').forEach((b) => (b.onclick = () => { m.hidden = true; Sound.click(); })); onMount && onMount($('modalCard')); }
  const closeModal = () => { $('modal').hidden = true; };
  function refill() {
    Sound.init(); Sound.levelup(); busy = false; disableSpin(false);
    modal(`<svg class="dog-big" viewBox="0 0 160 190"><use href="#s-mascot"/></svg><h2>O Caramelo te ajuda!</h2><p>Suas fichas acabaram, mas aqui o jogo nunca para.<br>Ganhe <b>${fmt(REFILL)} fichas</b> de presente!</p><button class="btn" id="getRefill">Pegar fichas grátis</button>`,
      (c) => c.querySelector('#getRefill').onclick = () => { S.balance += REFILL; setShown(S.balance); save(); burst(40, W / 2, Hh / 2); closeModal(); toast('🎁 +' + fmt(REFILL) + ' fichas'); });
  }
  function daily() {
    const today = new Date().toDateString(); if (S.lastDaily === today) return;
    const yest = new Date(Date.now() - 864e5).toDateString();
    const streak = E.nextStreak(S.lastDaily, today, yest, S.streak), reward = E.dailyReward(streak);
    const dots = Array.from({ length: 7 }, (_, i) => `<span class="${i < streak ? 'on' : ''}"></span>`).join('');
    modal(`<svg class="dog-big" viewBox="0 0 160 190"><use href="#s-mascot"/></svg><h2>Bônus diário!</h2><p>Dia <b>${streak}</b> de sequência${streak >= 7 ? ' — prêmio máximo!' : '. Volte amanhã para subir o prêmio.'}</p><div class="days">${dots}</div><p style="font-size:30px;color:#ffd24a"><b>+${fmt(reward)}</b> fichas</p><button class="btn" id="getDaily">Pegar!</button>`,
      (c) => c.querySelector('#getDaily').onclick = () => { Sound.init(); Sound.big(); S.lastDaily = today; S.streak = streak; S.balance += reward; setShown(S.balance); save(); rain(40); closeModal(); });
  }
  // Lembrete de tempo de jogo (não é pressão nem contagem regressiva): a cada 30 min, sugere pausa.
  const sessionStart = Date.now(); let lastRemind = 0;
  setInterval(() => {
    const mins = Math.floor((Date.now() - sessionStart) / 60000);
    if (mins >= 30 && mins - lastRemind >= 30 && !busy) { lastRemind = mins; toast(`🐶 Você joga há ${mins} min. Que tal uma pausa?`, 3500); }
  }, 60000);
  function menu() {
    modal(`<h2>Menu</h2><button class="btn alt" data-a="pay">🏮 Tabela de prêmios</button><button class="btn alt" data-a="mis">🎯 Missões</button><button class="btn alt" data-a="thm">🎨 Temas</button><button class="btn alt" data-a="set">⚙️ Configurações</button><button class="btn alt" data-a="about">ℹ️ Sobre o jogo</button><button class="btn" data-close>Voltar ao jogo</button>`,
      (c) => c.querySelectorAll('[data-a]').forEach((b) => (b.onclick = () => ({ pay: paytable, mis: missions, thm: themes, set: settings, about }[b.dataset.a]())))); }
  const back = '<button class="btn alt" id="back">← Menu</button>';
  const wireBack = (c) => (c.querySelector('#back').onclick = menu);
  function paytable() {
    const lb = S.bet / 5;
    modal(`<h2>Tabela de prêmios</h2><p>3 símbolos iguais em uma das <b>5 linhas</b>. O <b>Caramelo WILD</b> substitui qualquer símbolo.</p>
      ${E.SYMBOLS.map((s) => `<div class="row"><span class="l">${sym(s.id)}${s.name}</span><b>${fmt(s.pay * lb)}</b></div>`).join('')}
      <p>🐶 <b>Respin:</b> se um Caramelo WILD aparecer, ele trava e você ganha giros grátis (até ${E.MAX_RESPINS}) enquanto novos Caramelos caírem!</p><p style="opacity:.7;font-size:12px">Valores para a aposta atual. Retorno teórico ≈ 95%. Fichas fictícias.</p>${back}`, wireBack); }
  const stat = (m) => S.stats[m.stat] - S.m[m.id].start;
  const target = (m) => m.base * Math.pow(2, S.m[m.id].tier);
  const reward = (m) => m.reward * (S.m[m.id].tier + 1);
  function missions() {
    modal(`<h2>Missões</h2>${MISSIONS.map((m) => { const p = Math.min(stat(m), target(m)), ok = p >= target(m);
      return `<div class="mission"><div>${m.text(target(m))}</div><div class="bar"><i style="width:${(p / target(m)) * 100}%"></i></div><div style="display:flex;justify-content:space-between;align-items:center"><span>${p}/${target(m)} • 🪙 ${fmt(reward(m))}</span><button data-m="${m.id}" ${ok ? '' : 'disabled'}>Resgatar</button></div></div>`; }).join('')}${back}`,
      (c) => { wireBack(c); c.querySelectorAll('[data-m]').forEach((b) => (b.onclick = () => { const m = MISSIONS.find((x) => x.id === b.dataset.m); S.balance += reward(m); setShown(S.balance); S.m[m.id].tier++; S.m[m.id].start = S.stats[m.stat]; save(); Sound.levelup(); burst(30, W / 2, Hh / 2); missions(); updateMissionsDot(); })); }); }
  function updateMissionsDot() { const any = MISSIONS.some((m) => stat(m) >= target(m)); $('btnMenu').textContent = any ? '☰•' : '☰'; $('btnMenu').style.color = any ? '#7aff9a' : ''; }
  function themes() {
    modal(`<h2>Temas</h2>${THEMES.map((t) => `<div class="row"><span>${t.name}${S.theme === t.id ? ' ✅' : ''}</span>${S.level >= t.lvl ? `<button class="btn" style="width:auto;margin:0;padding:6px 14px" data-t="${t.id}">Usar</button>` : `<span>🔒 Nv ${t.lvl}</span>`}</div>`).join('')}${back}`,
      (c) => { wireBack(c); c.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { S.theme = b.dataset.t; updateHud(); save(); themes(); })); }); }
  function settings() {
    const o = (k, l) => `<div class="row"><span>${l}</span><button class="btn ${S.set[k] ? '' : 'alt'}" style="width:auto;margin:0;padding:6px 16px" data-s="${k}">${S.set[k] ? 'Ligado' : 'Desligado'}</button></div>`;
    modal(`<h2>Configurações</h2>${o('music', '🎵 Música')}${o('sfx', '🔊 Efeitos sonoros')}${o('vib', '📳 Vibração')}${o('reduce', '🧘 Reduzir movimento')}<button class="btn alt" id="reset" style="margin-top:18px">Apagar progresso</button>${back}`,
      (c) => { wireBack(c);
        c.querySelectorAll('[data-s]').forEach((b) => (b.onclick = () => { const k = b.dataset.s; S.set[k] = !S.set[k]; if (k === 'music') Sound.setMusic(S.set[k]); if (k === 'sfx') Sound.setSfx(S.set[k]); updateHud(); save(); settings(); }));
        c.querySelector('#reset').onclick = () => { if (confirm('Apagar todo o progresso e recomeçar?')) { S = fresh(); save(); location.reload(); } }; }); }
  function about() { modal(`<h2>TIGRINHO</h2><p>Jogo de entretenimento <b>gratuito</b> com fichas <b>fictícias</b>. Elas não têm valor em dinheiro, não podem ser compradas, trocadas, sacadas ou transferidas.</p><p>Este jogo não oferece chances de ganhar dinheiro real. Se jogar de verdade (com dinheiro) está te fazendo mal, procure ajuda: <b>CVV 188</b>.</p><p>Fichas acabaram? O Caramelo te dá mais de graça. 🐶</p>${back}`, wireBack); }
  $('btnMenu').onclick = () => { Sound.init(); Sound.click(); menu(); };
  // Botão rápido de som — espelha SoundToggleButton do slot-game (mute/unmute).
  const btnSound = $('btnSound');
  const paintSound = () => { if (btnSound) btnSound.textContent = (S.set.music || S.set.sfx) ? '🔊' : '🔇'; };
  if (btnSound) btnSound.onclick = () => {
    Sound.init();
    const on = !(S.set.music || S.set.sfx);
    S.set.music = on; S.set.sfx = on;
    Sound.setMusic(on); Sound.setSfx(on); save(); paintSound(); Sound.click();
  };

  // ---------- início ----------
  Sound.setMusic(S.set.music); Sound.setSfx(S.set.sfx);
  setShown(S.balance); updateHud(); updateMissionsDot(); mood('idle'); paintSound(); orient();
  const boot = $('boot');
  requestAnimationFrame(() => requestAnimationFrame(() => { if (boot) { boot.classList.add('hide'); setTimeout(() => boot.remove(), 500); } }));
  setTimeout(() => say('idle', 3000), 600);
  // Tela inicial: o bônus diário só aparece depois de "Começar" (também libera o áudio,
  // exigência dos navegadores e do Safari iOS).
  const splash = $('splash'), startBtn = $('start');
  const hideSplash = () => { if (!splash || splash.hidden) return; splash.classList.add('out'); setTimeout(() => { splash.hidden = true; daily(); }, 350); };
  if (startBtn) { startBtn.onclick = () => { Sound.init(); Sound.click(); hideSplash(); }; startBtn.focus({ preventScroll: true }); }
  else daily();
  addEventListener('pointerdown', () => Sound.init(), { once: true });
  // prévia de celebração (testes e prints): preview(razão) mostra a faixa de prêmio correspondente
  window.__tigrinho = { S, spin, E, preview: (r) => { const t = E.prizeTier(r); return t.level >= 3 ? bigWin(r * 10, t) : null; } };
})();

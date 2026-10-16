/* Rolos do TIGRINHO: DOM, giro, travas (WILD) e linhas vencedoras.
   O cálculo de tempos (stepPlan) é puro e testado em Node; o resto manipula o DOM.
   Não conhece o saldo nem a aposta. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TigerReels = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const NS = 'http://www.w3.org/2000/svg';
  const SYMBOL_MATERIALS = Object.freeze({
    wild: 'wild', envelope: 'paper', ingot: 'metal', bag: 'fabric',
    orange: 'fruit', cracker: 'enamel', lantern: 'glass',
  });

  // Tempos de uma rodada de giro. Pura: recebe a configuração e devolve números.
  // rc: reelsConfig (SPIN_DURATION, REEL_OFFSET_TIME, TURBO_*, ANTICIPATION_EXTRA, FILLER_DIVISOR).
  // Retorna uma entrada por coluna + se deve haver hitstop (curinga em qualquer coluna).
  function stepPlan(rc, { turbo, reduce, grid }) {
    const scale = reduce ? rc.REDUCED_MOTION_SCALE : 1;
    const base = (turbo ? rc.TURBO_SPIN_DURATION : rc.SPIN_DURATION) * scale;
    const gap = (turbo ? rc.TURBO_OFFSET_TIME : rc.REEL_OFFSET_TIME) * scale;
    const wildFirstTwo = grid[0].includes('wild') || grid[1].includes('wild');
    const cols = [0, 1, 2].map((c) => {
      const antic = c === 2 && wildFirstTwo && !turbo && !reduce;
      const dur = base + c * gap + (antic ? rc.ANTICIPATION_EXTRA : 0);
      const filler = Math.max(rc.MIN_FILLER, Math.round(dur / rc.FILLER_DIVISOR) + c * 2);
      return { dur, filler, antic, anticAt: base + gap };
    });
    const hitstop = grid.flat().includes('wild') && !reduce;
    return { cols, hitstop };
  }

  // Quadros-chave de um giro. No WAAPI, o easing de uma keyframe vale para o trecho que COMEÇA nela
  // (a easing da última keyframe nunca é usada). Por isso a desaceleração fica na keyframe de cruzeiro.
  // Acelera, cruza em velocidade quase constante, desacelera até o alvo e, se houver quique, afunda um pouco e volta.
  // Pura: devolve dados para o Element.animate e é testada em Node.
  function settleKeyframes({ startY, cruiseY, overshootPx = 0 }) {
    const accelerate = 'cubic-bezier(.48,0,.82,.18)';
    const decelerate = 'cubic-bezier(.2,.7,.3,1)';
    const bounce = 'cubic-bezier(.33,0,.67,1)';
    const frames = [
      { transform: `translateY(${startY}px)`, offset: 0, easing: accelerate },
      { transform: `translateY(${cruiseY}px)`, offset: .7, easing: decelerate },
    ];
    if (!overshootPx) return [...frames, { transform: 'translateY(0)', offset: 1 }];
    return [
      ...frames,
      { transform: 'translateY(0)', offset: .9, easing: bounce },
      { transform: `translateY(${overshootPx}px)`, offset: .95, easing: bounce },
      { transform: 'translateY(0)', offset: 1 },
    ];
  }

  function create(container, { sym, randomSymbol, initial, config }) {
    const grid = initial.map((col) => col.slice());
    const activeSpins = new Map();
    const reels = [0, 1, 2].map(() => {
      const el = document.createElement('div'); el.className = 'reel';
      const strip = document.createElement('div'); strip.className = 'strip'; el.appendChild(strip);
      container.appendChild(el); return { el, strip };
    });
    const cellHtml = (s) => `<div class="cell material-${SYMBOL_MATERIALS[s] || 'unknown'}" data-symbol="${s}">${sym(s)}</div>`;
    const cellH = () => reels[0].el.clientHeight / 3;

    function paintStatic(c) {
      const { strip } = reels[c];
      strip.style.transition = 'none'; strip.style.transform = 'translateY(0)';
      strip.innerHTML = grid[c].map(cellHtml).join('');
    }
    [0, 1, 2].forEach(paintStatic);

    // Gira uma coluna até as células finais. Blur durante o giro; bounce ao assentar.
    // overshootPx: quique ao assentar (0 com movimento reduzido).
    function spinReel(c, finals, dur, filler, blurPx, overshootPx = 0) {
      return new Promise((resolve, reject) => {
        const { strip } = reels[c], h = cellH(), cur = grid[c];
        const mid = Array.from({ length: filler }, () => randomSymbol());
        strip.style.transition = 'none';
        strip.innerHTML = [...finals, ...mid, ...cur].map(cellHtml).join('');
        const startY = -(filler + 3) * h, cruiseY = startY * .22;
        strip.style.transform = `translateY(${startY}px)`;
        strip.style.filter = `blur(${blurPx}px)`;
        void strip.offsetHeight;
        const token = {};
        const finish = (error) => {
          if (activeSpins.get(c) !== token) return;
          activeSpins.delete(c);
          strip.style.filter = '';
          strip.style.transition = 'none';
          strip.style.transform = 'translateY(0)';
          if (error) { reject(error); return; }
          const cells = strip.children;
          for (let i = 0; i < Math.min(3, cells.length); i++) {
            cells[i].classList.add('pop');
            setTimeout(() => cells[i] && cells[i].classList.remove('pop'), config.SETTLE_POP_MS);
          }
          resolve();
        };
        let animation;
        if (typeof strip.animate === 'function') {
          animation = strip.animate(settleKeyframes({ startY, cruiseY, overshootPx }), { duration: dur, fill: 'forwards' });
          token.cancel = () => { animation.cancel(); finish(new Error('Giro cancelado')); };
          activeSpins.set(c, token);
          animation.finished.then(() => { animation.cancel(); finish(); }, finish);
        } else {
          let fallbackTimer;
          token.cancel = () => { clearTimeout(fallbackTimer); finish(new Error('Giro cancelado')); };
          activeSpins.set(c, token);
          strip.style.transition = `transform ${dur}ms cubic-bezier(.16,.82,.24,1)`;
          strip.style.transform = `translateY(${cruiseY}px)`;
          void strip.offsetHeight;
          requestAnimationFrame(() => { strip.style.transitionDuration = `${dur * .3}ms`; strip.style.transform = 'translateY(0)'; });
          fallbackTimer = setTimeout(() => finish(), dur);
        }
      });
    }

    function cancelSpins() {
      for (const [column, token] of activeSpins) {
        token.cancel();
        const { strip } = reels[column];
        strip.style.filter = ''; strip.style.transition = 'none'; strip.style.transform = 'translateY(0)';
      }
    }

    function highlightSequence(wins, holdMs, reducedHoldMs, reduce, shouldSkip = () => false, onReveal = () => {}) {
      return (async () => {
        if (!wins.length) { highlight([]); return 0; }
        let revealed = 0;
        for (const [index, win] of wins.entries()) {
          highlight([win]);
          revealed++;
          onReveal(index + 1, wins.length);
          if (wins.length === 1) break;
          const duration = reduce ? reducedHoldMs : holdMs;
          const start = performance.now();
          while (!shouldSkip() && performance.now() - start < duration) {
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }
          if (shouldSkip()) break;
        }
        highlight(wins);
        return revealed;
      })();
    }

    function setLocks(locked, cellVar = 'var(--cell-h)') {
      reels.forEach((r) => r.el.querySelectorAll('.lock').forEach((l) => l.remove()));
      locked.forEach((k) => {
        const [c, r] = k.split(',').map(Number);
        const d = document.createElement('div'); d.className = 'lock lock--wild';
        d.setAttribute('role', 'img'); d.setAttribute('aria-label', TigerI18n.t('reels.lockedWild'));
        d.style.top = `calc(${cellVar} * ${r})`; d.innerHTML = sym('wild');
        reels[c].el.appendChild(d);
      });
    }

    // Cada símbolo da linha recebe um atraso (--hop) para pular em sequência, da esquerda para a direita.
    function highlight(wins) {
      document.querySelectorAll('.cell.win').forEach((e) => { e.classList.remove('win'); e.style.removeProperty('--hop'); });
      wins.forEach((w) => w.cells.forEach(([c, r], i) => {
        const cell = reels[c].strip.children[r];
        if (!cell) return;
        cell.classList.add('win');
        cell.style.setProperty('--hop', `${i * config.WIN_HOP_MS}ms`);
      }));
      drawLines(wins);
    }

    function drawLines(wins) {
      const fx = document.getElementById('linefx'), fr = fx.getBoundingClientRect(); fx.innerHTML = '';
      if (!wins.length) return;
      const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('width', fr.width); svg.setAttribute('height', fr.height);
      // Duas camadas por linha: a base se desenha (line-base) e um brilho percorre por cima (line-flow). Estilo no CSS.
      const lines = [];
      wins.forEach((w) => {
        const pts = w.cells.map(([c, r]) => {
          const b = reels[c].el.getBoundingClientRect(), h = b.height / 3;
          return `${b.left - fr.left + b.width / 2},${b.top - fr.top + h * r + h / 2}`;
        }).join(' ');
        for (const kind of ['line-base', 'line-flow']) {
          const p = document.createElementNS(NS, 'polyline');
          p.setAttribute('points', pts); p.setAttribute('class', kind);
          svg.appendChild(p); lines.push(p);
        }
      });
      fx.appendChild(svg);
      // pathLength não escala o tracejado no Chromium: o traço usa o comprimento real da linha, em px.
      // getTotalLength só funciona depois de o SVG estar no documento.
      lines.forEach((p) => p.style.setProperty('--len', Math.ceil(p.getTotalLength())));
    }

    return {
      reels, grid, cellH, paintStatic, spinReel, cancelSpins, setLocks, highlight, highlightSequence,
      clearHighlight: () => highlight([]),
      setCell(c, syms) { grid[c] = syms.slice(); paintStatic(c); },
    };
  }

  return { create, stepPlan, settleKeyframes, SYMBOL_MATERIALS };
});

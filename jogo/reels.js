/* Rolos do TIGRINHO: DOM, giro, travas (WILD) e linhas vencedoras.
   O cálculo de tempos (stepPlan) é puro e testado em Node; o resto manipula o DOM.
   Não conhece o saldo nem a aposta. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TigerReels = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const NS = 'http://www.w3.org/2000/svg';

  // Tempos de uma rodada de giro. Pura: recebe a configuração e devolve números.
  // rc: reelsConfig (SPIN_DURATION, REEL_OFFSET_TIME, TURBO_*, ANTICIPATION_EXTRA, FILLER_DIVISOR).
  // Retorna uma entrada por coluna + se deve haver hitstop (curinga em qualquer coluna).
  function stepPlan(rc, { turbo, reduce, grid }) {
    const scale = reduce ? 0.25 : 1;
    const base = (turbo ? rc.TURBO_SPIN_DURATION : rc.SPIN_DURATION) * scale;
    const gap = (turbo ? rc.TURBO_OFFSET_TIME : rc.REEL_OFFSET_TIME) * scale;
    const wildFirstTwo = grid[0].includes('wild') || grid[1].includes('wild');
    const cols = [0, 1, 2].map((c) => {
      const antic = c === 2 && wildFirstTwo && !turbo && !reduce;
      const dur = base + c * gap + (antic ? rc.ANTICIPATION_EXTRA : 0);
      const filler = Math.max(4, Math.round(dur / rc.FILLER_DIVISOR) + c * 2);
      return { dur, filler, antic, anticAt: base + gap };
    });
    const hitstop = grid.flat().includes('wild') && !reduce;
    return { cols, hitstop };
  }

  function create(container, { sym, randomSymbol, initial }) {
    const grid = initial.map((col) => col.slice());
    const reels = [0, 1, 2].map(() => {
      const el = document.createElement('div'); el.className = 'reel';
      const strip = document.createElement('div'); strip.className = 'strip'; el.appendChild(strip);
      container.appendChild(el); return { el, strip };
    });
    const cellHtml = (s) => `<div class="cell">${sym(s)}</div>`;
    const cellH = () => reels[0].el.clientHeight / 3;

    function paintStatic(c) {
      const { strip } = reels[c];
      strip.style.transition = 'none'; strip.style.transform = 'translateY(0)';
      strip.innerHTML = grid[c].map(cellHtml).join('');
    }
    [0, 1, 2].forEach(paintStatic);

    // Gira uma coluna até as células finais. Blur durante o giro; bounce ao assentar.
    function spinReel(c, finals, dur, filler, blurPx) {
      return new Promise((res) => {
        const { strip } = reels[c], h = cellH(), cur = grid[c];
        const mid = Array.from({ length: filler }, () => randomSymbol());
        strip.style.transition = 'none';
        strip.innerHTML = [...finals, ...mid, ...cur].map(cellHtml).join('');
        strip.style.transform = `translateY(${-(filler + 3) * h}px)`;
        strip.style.filter = `blur(${blurPx}px)`;
        void strip.offsetHeight;
        strip.style.transition = `transform ${dur}ms cubic-bezier(.22,.8,.28,1.06)`;
        strip.style.transform = 'translateY(0)';
        setTimeout(() => {
          strip.style.filter = '';
          const cells = strip.children;
          for (let i = 0; i < Math.min(3, cells.length); i++) {
            cells[i].classList.add('pop');
            setTimeout(() => cells[i] && cells[i].classList.remove('pop'), 450);
          }
          res();
        }, dur);
      });
    }

    function setLocks(locked, cellVar = 'var(--cell)') {
      reels.forEach((r) => r.el.querySelectorAll('.lock').forEach((l) => l.remove()));
      locked.forEach((k) => {
        const [c, r] = k.split(',').map(Number);
        const d = document.createElement('div'); d.className = 'lock';
        d.style.top = `calc(${cellVar} * ${r})`; d.innerHTML = sym('wild');
        reels[c].el.appendChild(d);
      });
    }

    function highlight(wins) {
      document.querySelectorAll('.cell.win').forEach((e) => e.classList.remove('win'));
      wins.forEach((w) => w.cells.forEach(([c, r]) => reels[c].strip.children[r] && reels[c].strip.children[r].classList.add('win')));
      drawLines(wins);
    }

    function drawLines(wins) {
      const fx = document.getElementById('linefx'), fr = fx.getBoundingClientRect(); fx.innerHTML = '';
      if (!wins.length) return;
      const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('width', fr.width); svg.setAttribute('height', fr.height);
      wins.forEach((w) => {
        const pts = w.cells.map(([c, r]) => {
          const b = reels[c].el.getBoundingClientRect(), h = b.height / 3;
          return `${b.left - fr.left + b.width / 2},${b.top - fr.top + h * r + h / 2}`;
        }).join(' ');
        const p = document.createElementNS(NS, 'polyline'); p.setAttribute('points', pts);
        p.setAttribute('style', 'fill:none;stroke:#fff7c0;stroke-width:5;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 6px #ff9a1a);stroke-dasharray:10 8');
        svg.appendChild(p);
      });
      fx.appendChild(svg);
    }

    return {
      reels, grid, cellH, paintStatic, spinReel, setLocks, highlight,
      clearHighlight: () => highlight([]),
      setCell(c, syms) { grid[c] = syms.slice(); paintStatic(c); },
    };
  }

  return { create, stepPlan };
});

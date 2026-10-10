/* Motor de partículas do TIGRINHO (canvas 2D): moedas, chuva e pétalas.
   Recebe o canvas e uma função que diz se o modo "reduzir movimento" está ativo.
   Não conhece o estado do jogo. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TigerFx = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  function create(canvas, reduced) {
    const g = canvas.getContext('2d');
    let parts = [], petals = [], W = 0, H = 0;
    const isReduced = () => !!(reduced && reduced());

    const coinImg = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 48; const x = c.getContext('2d');
      const gr = x.createRadialGradient(18, 16, 3, 24, 24, 22);
      gr.addColorStop(0, '#fff6b0'); gr.addColorStop(.6, '#ffc83a'); gr.addColorStop(1, '#b8740a');
      x.fillStyle = gr; x.beginPath(); x.arc(24, 24, 22, 0, 7); x.fill();
      x.strokeStyle = '#8a5a00'; x.lineWidth = 3; x.stroke();
      x.fillStyle = '#a86a00'; x.fillRect(18, 18, 12, 12);
      return c;
    })();

    for (let i = 0; i < 16; i++) petals.push({ x: Math.random() * 500, y: Math.random() * 900, v: .3 + Math.random() * .6, s: 4 + Math.random() * 5, p: Math.random() * 6 });

    function setSize(w, h) {
      const d = Math.min(devicePixelRatio || 1, 2);
      canvas.width = w * d; canvas.height = h * d; g.setTransform(d, 0, 0, d, 0, 0);
      W = w; H = h;
    }

    function burst(n, x = W / 2, y = H * .4, power = 1) {
      n = isReduced() ? Math.min(n, 8) : n;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = (4 + Math.random() * 9) * power;
        parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6 * power, r: Math.random() * 6, vr: .2 + Math.random() * .3, s: 14 + Math.random() * 14, life: 160 + Math.random() * 60 });
      }
    }

    function rain(n) {
      n = isReduced() ? Math.min(n, 10) : n;
      for (let i = 0; i < n; i++) setTimeout(() => parts.push({ x: Math.random() * W, y: -30, vx: (Math.random() - .5) * 2, vy: 2 + Math.random() * 4, r: Math.random() * 6, vr: .2 + Math.random() * .3, s: 16 + Math.random() * 14, life: 400, rain: 1 }), i * 25);
    }

    function frame() {
      g.clearRect(0, 0, W, H);
      if (!isReduced()) for (const p of petals) {
        p.y += p.v; p.x += Math.sin((p.y + p.p * 40) / 40) * .6; p.p += .02;
        if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; }
        g.fillStyle = 'rgba(255,170,190,.55)'; g.beginPath(); g.ellipse(p.x, p.y, p.s, p.s * .55, p.p, 0, 7); g.fill();
      }
      parts = parts.filter((p) => p.life-- > 0 && p.y < H + 40);
      for (const p of parts) {
        p.vy += p.rain ? .06 : .35; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        g.save(); g.translate(p.x, p.y); g.scale(Math.abs(Math.cos(p.r)) * .9 + .1, 1);
        g.drawImage(coinImg, -p.s / 2, -p.s / 2, p.s, p.s); g.restore();
      }
      requestAnimationFrame(frame);
    }

    return { setSize, burst, rain, start: frame, count: () => parts.length };
  }

  return { create };
});

/* Parallax leve do cenário (Q2-10): inclina o aparelho e as três camadas deslizam em profundidades diferentes.
   Desligado por padrão. Em iOS, a permissão de movimento só é pedida dentro de um clique do usuário.
   Em redução de movimento nunca liga. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TigerParallax = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const RANGE_DEG = 30; // inclinação (graus) em relação ao repouso que chega ao deslocamento máximo
  const SMOOTHING = 0.12; // fração do caminho percorrida por quadro (suaviza os sensores ruidosos)
  const MIN_STEP = 0.0005; // abaixo disso não mexe no DOM

  const clamp = (v) => Math.max(-1, Math.min(1, v));

  // Deslocamento normalizado (-1..1) de uma leitura em relação à posição de repouso.
  // Função pura: testada em Node.
  function offsetFor(reading, rest) {
    return {
      x: clamp((reading.gamma - rest.gamma) / RANGE_DEG),
      y: clamp((reading.beta - rest.beta) / RANGE_DEG),
    };
  }

  function create({ scene, win = window, doc = document, reduced = () => false }) {
    let listening = false, rest = null, raf = 0;
    let target = { x: 0, y: 0 }, current = { x: 0, y: 0 };
    const hasSensor = () => !!win.DeviceOrientationEvent;
    const needsPermission = () => !!win.DeviceOrientationEvent && typeof win.DeviceOrientationEvent.requestPermission === 'function';

    function onOrientation(event) {
      if (event.beta == null || event.gamma == null) return;
      if (!rest) rest = { beta: event.beta, gamma: event.gamma }; // a postura do primeiro toque vira a neutra
      target = offsetFor(event, rest);
      if (!raf) raf = win.requestAnimationFrame(frame);
    }

    function frame() {
      raf = 0;
      if (!listening || doc.hidden) return;
      const nx = current.x + (target.x - current.x) * SMOOTHING;
      const ny = current.y + (target.y - current.y) * SMOOTHING;
      if (Math.abs(nx - current.x) > MIN_STEP || Math.abs(ny - current.y) > MIN_STEP) {
        current = { x: nx, y: ny };
        scene.style.setProperty('--px', current.x.toFixed(3));
        scene.style.setProperty('--py', current.y.toFixed(3));
        raf = win.requestAnimationFrame(frame); // ainda se movendo: continua
      }
    }

    function onVisibility() {
      if (!doc.hidden && listening && !raf) raf = win.requestAnimationFrame(frame);
    }

    function start() {
      if (listening) return;
      listening = true; rest = null;
      win.addEventListener('deviceorientation', onOrientation);
      doc.addEventListener('visibilitychange', onVisibility);
      scene.classList.add('tilt');
    }

    function stop() {
      if (listening) {
        win.removeEventListener('deviceorientation', onOrientation);
        doc.removeEventListener('visibilitychange', onVisibility);
      }
      listening = false; rest = null;
      if (raf) win.cancelAnimationFrame(raf);
      raf = 0; target = { x: 0, y: 0 }; current = { x: 0, y: 0 };
      scene.classList.remove('tilt');
      scene.style.removeProperty('--px');
      scene.style.removeProperty('--py');
    }

    // Chamar a partir de um clique. Retorna Promise<boolean>: true se o parallax ficou ligado.
    // A chamada a requestPermission acontece antes de qualquer await, para continuar dentro do gesto.
    function enable() {
      if (!hasSensor() || reduced()) return Promise.resolve(false);
      if (!needsPermission()) { start(); return Promise.resolve(true); }
      return win.DeviceOrientationEvent.requestPermission()
        .then((result) => { if (result === 'granted') { start(); return true; } return false; })
        .catch(() => false);
    }

    return {
      enable,
      disable: stop,
      isOn: () => listening,
      hasSensor,
      needsPermission,
    };
  }

  return { create, offsetFor, RANGE_DEG };
});

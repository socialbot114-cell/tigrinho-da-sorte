/* Háptica (Q4-06). No app iOS (Capacitor) usa o plugin Haptics; na web, navigator.vibrate.
   O plugin ainda não existe no projeto (depende do Q4-04): hoje a via web é a que roda.
   As dependências entram por parâmetro, então o módulo é testável em Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TigerHaptics = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  function create({ nav, cap } = {}) {
    const plugin = () => (cap && cap.Plugins && cap.Plugins.Haptics) || null;

    // Retorna a via usada: 'plugin', 'web', 'off' (preferência desligada) ou 'none' (sem suporte).
    function pulse(pattern, enabled = true) {
      if (!enabled) return 'off';
      const haptics = plugin();
      if (haptics && typeof haptics.impact === 'function') {
        // O plugin não toca padrões: uma batida média representa o pulso.
        try { haptics.impact({ style: 'MEDIUM' }); return 'plugin'; } catch (error) { return 'none'; }
      }
      if (nav && typeof nav.vibrate === 'function') {
        try { nav.vibrate(pattern); return 'web'; } catch (error) { return 'none'; }
      }
      return 'none';
    }

    return { pulse };
  }

  // Ligação padrão no navegador; no Node os objetos ficam indefinidos e a via é 'none'.
  const browser = () => create({
    nav: typeof navigator !== 'undefined' ? navigator : undefined,
    cap: typeof window !== 'undefined' ? window.Capacitor : undefined,
  });

  return { create, browser };
});

/* Métricas agregadas (Q4-10): só com opt-in, desligadas por padrão e sem identificador individual.
   Os contadores ficam em memória. Sem endpoint configurado (definido só depois do gate jurídico e da
   decisão de publicação, Q4-13), nada sai do aparelho. Com opt-out, nenhuma requisição é feita. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TigerAnalytics = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  function create({ endpoint = null, send = null } = {}) {
    let enabled = false, counts = {};
    return {
      setEnabled(on) { enabled = !!on; if (!enabled) counts = {}; },
      isEnabled: () => enabled,
      // Só conta com opt-in e com nomes curtos e textuais. Nunca recebe dados pessoais.
      track(name) {
        if (!enabled || typeof name !== 'string' || name.length > 32) return;
        counts[name] = (counts[name] || 0) + 1;
      },
      snapshot: () => ({ ...counts }),
      // Envia só com opt-in e endpoint. Retorna false quando nada saiu do aparelho.
      flush() {
        if (!enabled || !endpoint || !send) return Promise.resolve(false);
        const payload = { ...counts };
        counts = {};
        return Promise.resolve(send(endpoint, payload)).then(() => true, () => false);
      },
    };
  }
  return { create };
});

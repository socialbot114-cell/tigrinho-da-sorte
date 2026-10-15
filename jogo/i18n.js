/* Idioma da interface (Q4-09). O código só usa chaves; os textos ficam em jogo/i18n/*.js.
   pt-BR é a referência: se uma chave faltar em outro idioma, cai no português. Chave sem texto vira a própria chave,
   e o teste de paridade aponta a falta antes de chegar ao jogador. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./i18n/pt-BR.js'), require('./i18n/en.js'));
  else root.TigerI18n = factory(root.TigerI18nPtBR, root.TigerI18nEn);
})(typeof self !== 'undefined' ? self : this, function (ptBR, en) {
  const DICTS = Object.freeze({ 'pt-BR': ptBR, en });
  const LANGS = Object.freeze(['pt-BR', 'en']);
  let current = 'pt-BR';

  const isLang = (value) => LANGS.includes(value);
  function setLang(value) { if (isLang(value)) current = value; return current; }
  const lang = () => current;

  // Texto da chave com {parametros} preenchidos. Parâmetro ausente fica como {nome}, para não sumir em silêncio.
  function t(key, params = {}) {
    const text = DICTS[current][key] ?? ptBR[key] ?? key;
    return text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
  }

  // Locale para números e datas, no mesmo idioma dos textos.
  const locale = () => (current === 'en' ? 'en-US' : 'pt-BR');

  // Aplica os textos do HTML estático: data-i18n (texto), data-i18n-html (marcação confiável do próprio dicionário),
  // data-i18n-aria e data-i18n-title (atributos).
  function applyTo(scope) {
    scope.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    scope.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    scope.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    scope.querySelectorAll('[data-i18n-title]').forEach((el) => { el.setAttribute('title', t(el.dataset.i18nTitle)); });
    if (scope.documentElement) scope.documentElement.lang = current;
  }

  return { LANGS, isLang, setLang, lang, t, locale, applyTo, DICTS };
});

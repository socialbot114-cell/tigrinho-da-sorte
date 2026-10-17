// ESLint (Q1-12): regras recomendadas + globais do navegador e do Node para testes.
const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  { ignores: ['vendor/**', 'node_modules/**', 'playwright-report/**', 'test-results/**', 'ui-screens/**'] },
  js.configs.recommended,
  {
    files: ['jogo/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.browser, ...globals.node, TigerEngine: 'readonly', TigerConfig: 'readonly', TigerSave: 'readonly', TigerProgression: 'readonly', TigerFx: 'readonly', TigerParallax: 'readonly', TigerTutorial: 'readonly', TigerWellbeing: 'readonly', TigerHaptics: 'readonly', TigerAnalytics: 'readonly', TigerI18n: 'readonly', TigerSession: 'readonly', TigerShareCard: 'readonly', TigerI18nPtBR: 'readonly', TigerI18nEn: 'readonly', TigerReels: 'readonly', TigerCelebration: 'readonly', TigerGameUI: 'readonly', TigerMenus: 'readonly', TigerRoundController: 'readonly', Sound: 'readonly' },
    },
    rules: { 'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none', varsIgnorePattern: '^_' }], 'no-empty': ['error', { allowEmptyCatch: true }] },
  },
  {
    // audio.js define Sound para os demais módulos (usado em game.js), então não é 'não usado'
    files: ['jogo/audio.js'],
    rules: { 'no-redeclare': 'off', 'no-unused-vars': 'off' },
  },
  {
    files: ['jogo/*.test.js', 'jogo/engine.test.js', 'tests/**/*.js', 'playwright.config.js', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: { ...globals.node, ...globals.browser } },
    rules: { 'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none', varsIgnorePattern: '^_' }] },
  },
];

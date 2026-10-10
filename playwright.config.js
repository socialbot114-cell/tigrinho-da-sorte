// Testes de UI do TIGRINHO (Playwright). Rodar: npm run test:ui
const { defineConfig, devices } = require('@playwright/test');
const PORT = 8123;

module.exports = defineConfig({
  testDir: 'tests/ui',
  timeout: 45000,
  expect: { timeout: 10000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  outputDir: 'test-results',
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: 'retain-on-failure', // animações contínuas tornam os alvos instáveis para o Playwright
    reducedMotion: 'reduce' },
  webServer: {
    command: `python3 -m http.server ${PORT} --bind 127.0.0.1 --directory jogo`,
    url: `http://127.0.0.1:${PORT}/index.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 20000,
  },
  projects: [
    { name: 'iphone-retrato', use: { ...devices['iPhone 13'], browserName: 'chromium', defaultBrowserType: 'chromium' } },
    { name: 'iphone-paisagem', use: { ...devices['iPhone 13 landscape'], browserName: 'chromium' } },
  ],
});

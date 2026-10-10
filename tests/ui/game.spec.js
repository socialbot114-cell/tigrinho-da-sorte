// Fluxo principal do TIGRINHO em viewport de iPhone. Fichas fictícias.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const SHOTS = path.join(__dirname, '..', '..', 'ui-screens');
fs.mkdirSync(SHOTS, { recursive: true });
const shot = (page, name, info) => page.screenshot({ path: path.join(SHOTS, `${info.project.name}-${name}.png`) });

// Fecha overlays que podem bloquear os cliques (bônus diário, vitória grande).
async function clearOverlays(page) {
  for (let i = 0; i < 6; i++) {
    const daily = page.locator('#getDaily');
    if (await daily.isVisible().catch(() => false)) { await daily.click(); continue; }
    const big = page.locator('#bigwin');
    if (await big.isVisible().catch(() => false)) { await big.click(); await page.waitForTimeout(200); continue; }
    break;
  }
}

async function startGame(page) {
  await page.goto('/index.html');
  await expect(page.locator('#splash .logo')).toHaveText('TIGRINHO');
  await page.locator('#start').click();
  await expect(page.locator('#splash')).toBeHidden({ timeout: 5000 });
}

async function waitSpinDone(page) {
  await expect(page.locator('#spin')).not.toHaveAttribute('aria-disabled', 'true', { timeout: 20000 });
}

test('tela inicial mostra logo e aviso de fichas fictícias', async ({ page }, info) => {
  await page.goto('/index.html');
  await expect(page.locator('#splash .logo')).toHaveText('TIGRINHO');
  await expect(page.locator('#splash .fine')).toContainText('Fichas fictícias');
  await expect(page.locator('#start')).toBeVisible();
  await page.waitForTimeout(600);
  await shot(page, '00-splash', info);
});

test('começar leva à máquina, bônus diário abre e fecha', async ({ page }, info) => {
  await startGame(page);
  await expect(page.locator('#getDaily')).toBeVisible({ timeout: 5000 });
  await shot(page, '01-bonus-diario', info);
  await page.locator('#getDaily').click();
  await expect(page.locator('#modal')).toBeHidden();
  await expect(page.locator('#balance')).toHaveText('12.000');
  await shot(page, '02-jogo', info);
});

test('girar muda estado e conta a rodada', async ({ page }, info) => {
  await startGame(page);
  await clearOverlays(page);
  await page.locator('#spin').click();
  await waitSpinDone(page);
  await clearOverlays(page);
  const spins = await page.evaluate(() => window.__tigrinho.S.stats.spins);
  expect(spins).toBe(1);
  await shot(page, '03-depois-do-giro', info);
});

test('saldo persiste após recarregar', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  await page.locator('#spin').click();
  await waitSpinDone(page);
  await clearOverlays(page);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('tigrinho.save.v1')).balance);
  await page.reload();
  await page.locator('#start').click();
  await clearOverlays(page);
  await expect(page.locator('#balance')).toHaveText(saved.toLocaleString('pt-BR'));
});

test('menu abre tabela de prêmios e volta', async ({ page }, info) => {
  await startGame(page);
  await clearOverlays(page);
  await page.locator('#btnMenu').click();
  await page.locator('[data-a="pay"]').click();
  await expect(page.locator('#modalCard h2')).toHaveText('Tabela de prêmios');
  await expect(page.locator('#modalCard')).toContainText('Caramelo');
  await shot(page, '04-tabela-de-premios', info);
  await page.locator('#back').click();
  await expect(page.locator('[data-a="pay"]')).toBeVisible();
  await page.locator('[data-close]').last().click();
  await expect(page.locator('#modal')).toBeHidden();
});

test('barra de aposta ajusta valores', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  await expect(page.locator('#bet')).toHaveText('10');
  await page.locator('#betUp').click();
  await expect(page.locator('#bet')).toHaveText('25');
  await page.locator('#betDown').click();
  await page.locator('#betDown').click();
  await expect(page.locator('#bet')).toHaveText('5');
});

test('nenhum erro de console na sessão', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await startGame(page);
  await clearOverlays(page);
  await page.locator('#spin').click();
  await waitSpinDone(page);
  expect(errors).toEqual([]);
});

test('bônus diário mostra dia da sequência e 7 marcadores', async ({ page }, info) => {
  await page.goto('/index.html');
  await page.locator('#start').click();
  await expect(page.locator('#getDaily')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('#modalCard')).toContainText('Dia 1 de sequência');
  await expect(page.locator('#modalCard .days span')).toHaveCount(7);
  await expect(page.locator('#modalCard .days span.on')).toHaveCount(1);
  await expect(page.locator('#modalCard')).toContainText('+2.000');
  await shot(page, '01b-bonus-sequencia', info);
});

test('faixas de prêmio: pequena, média, grande, mega e suprema', async ({ page }) => {
  await startGame(page);
  const levels = await page.evaluate(() => {
    const E = window.__tigrinho.E;
    return [0, 1, 4, 10, 25, 60].map((r) => E.prizeTier(r).level);
  });
  expect(levels).toEqual([0, 1, 2, 3, 4, 5]);
});

test('bônus diário mantém sequência ao coletar hoje e o botão aparece uma vez', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('#start').click();
  await page.locator('#getDaily').click();
  await expect(page.locator('#modal')).toBeHidden();
  await page.reload();
  await page.locator('#start').click();
  await expect(page.locator('#getDaily')).toHaveCount(0);
  const streak = await page.evaluate(() => JSON.parse(localStorage.getItem('tigrinho.save.v1')).streak);
  expect(streak).toBe(1);
});

test.describe('com movimento', () => {
  test.use({ reducedMotion: 'no-preference' });
  test('celebração de vitória grande (mega) aparece, mostra print e fecha', async ({ page }, info) => {
    await page.goto('/index.html');
    await page.evaluate(() => document.getElementById('start').click()); // botão pulsa: clique direto
    await page.waitForTimeout(900);
    await page.evaluate(() => { const b = document.getElementById('getDaily'); if (b) b.click(); });
    await page.waitForTimeout(400);
    await page.evaluate(() => { window.__tigrinho.preview(25); });
    await expect(page.locator('#bigwin')).toBeVisible();
    await expect(page.locator('#bwTitle')).toHaveText('MEGA VITÓRIA!');
    await page.waitForTimeout(1800);
    await shot(page, '06-mega-vitoria', info);
    await page.evaluate(() => document.getElementById('bigwin').click()); // overlay anima sem parar: clique direto
    await expect(page.locator('#bigwin')).toBeHidden();
  });

  test('nível 3 mostra raios sem multiplicador; nível 4 mostra multiplicador', async ({ page }) => {
    await page.goto('/index.html');
    await page.evaluate(() => document.getElementById('start').click());
    await page.waitForTimeout(900);
    await page.evaluate(() => { const b = document.getElementById('getDaily'); if (b) b.click(); });
    await page.waitForTimeout(300);
    await page.evaluate(() => { window.__tigrinho.preview(10); });
    await expect(page.locator('#bigwin')).toHaveAttribute('data-lvl', '3');
    await expect(page.locator('#bigwin .bw-rays')).toBeVisible();
    await expect(page.locator('#bwMult')).toBeEmpty();
    await page.evaluate(() => document.getElementById('bigwin').click());
    await expect(page.locator('#bigwin')).toBeHidden();
    await page.evaluate(() => { window.__tigrinho.preview(25); });
    await expect(page.locator('#bigwin')).toHaveAttribute('data-lvl', '4');
    await expect(page.locator('#bwMult')).toHaveText('x25');
    await page.evaluate(() => document.getElementById('bigwin').click());
    await expect(page.locator('#bigwin')).toBeHidden();
  });
});

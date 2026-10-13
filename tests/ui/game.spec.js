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
  await page.goto('/index.html?test=1');
  await expect(page.locator('#splash .logo')).toHaveText('TIGRINHO');
  await page.locator('#start').click();
  await expect(page.locator('#splash')).toBeHidden({ timeout: 5000 });
}

async function waitSpinDone(page) {
  await expect(page.locator('#spin')).not.toHaveAttribute('aria-disabled', 'true', { timeout: 20000 });
}

test('tela inicial mostra logo e aviso de fichas fictícias', async ({ page }, info) => {
  await page.goto('/index.html?test=1');
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
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('tigrinho.save.v2')).balance);
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

test('símbolos mostram materiais próprios, destaque vencedor e WILD travado', async ({ page }, info) => {
  await startGame(page);
  await clearOverlays(page);
  const materials = await page.locator('#reels .cell').evaluateAll((cells) => [...new Set(cells.map((c) => [...c.classList].find((x) => x.startsWith('material-'))))].sort());
  expect(materials).toEqual(['material-enamel', 'material-fabric', 'material-fruit', 'material-glass', 'material-metal', 'material-paper']);

  await page.evaluate(() => window.__tigrinho.highlightLine());
  const winners = page.locator('#reels .cell.win');
  await expect(winners).toHaveCount(3);
  const winBg = await winners.first().evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(winBg).toContain('radial-gradient');
  const winBgs = await winners.evaluateAll((cells) => cells.map((el) => getComputedStyle(el).backgroundImage));
  expect(new Set(winBgs).size).toBe(3);

  await page.evaluate(() => window.__tigrinho.lockWild());
  const locked = page.locator('.lock--wild');
  await expect(locked).toHaveCount(1);
  await expect(locked).toHaveAttribute('aria-label', 'Caramelo WILD travado');
  const border = await locked.evaluate((el) => getComputedStyle(el).borderTopWidth);
  expect(border).toBe('2px');
  await shot(page, '05-simbolos-estados', info);
});

test('folha visual mostra os 7 símbolos normais/vencedores e o WILD travado', async ({ page }, info) => {
  await startGame(page);
  await clearOverlays(page);
  const symbols = ['wild', 'envelope', 'ingot', 'bag', 'orange', 'cracker', 'lantern'];
  await page.evaluate((ids) => {
    const materials = window.TigerReels.SYMBOL_MATERIALS;
    const labels = { wild: 'Caramelo WILD', envelope: 'Envelope', ingot: 'Lingote', bag: 'Saco', orange: 'Tangerina', cracker: 'Rojões', lantern: 'Lanterna' };
    const rows = ids.map((id) => {
      const cell = (state) => `<div class="preview"><div class="cell material-${materials[id]} ${state}" data-symbol="${id}"><svg viewBox="0 0 100 100"><use href="#s-${id}"/></svg></div></div>`;
      const locked = id === 'wild' ? '<div class="preview"><div class="lock lock--wild"><svg viewBox="0 0 100 100"><use href="#s-wild"/></svg></div></div>' : '<div class="preview empty">—</div>';
      return `<div class="symbol-row"><b>${labels[id]}</b>${cell('')}${cell('win')}${locked}</div>`;
    }).join('');
    document.body.insertAdjacentHTML('beforeend', `<style id="symbol-proof-style">
      #symbolProof{position:fixed;inset:0;z-index:999;background:radial-gradient(ellipse at 50% 0,#94172a,#26040a 76%);color:#fff;padding:16px 12px;overflow:auto;font:600 13px system-ui}
      #symbolProof h2{text-align:center;color:#ffe27a;font:36px Bangers,Impact,sans-serif;letter-spacing:1px;margin:0 0 10px}
      .symbol-head,.symbol-row{display:grid;grid-template-columns:75px repeat(3,minmax(58px,1fr));gap:5px;align-items:center;text-align:center}
      .symbol-head{color:#ffe7a0;font-size:11px;margin-bottom:5px}.symbol-row{min-height:63px;border-top:1px solid #ffd24a33}
      .symbol-row>b{text-align:left;color:#ffe7a0;font-size:11px}
      #symbolProof .preview{position:relative;width:58px;height:58px;margin:auto;border-radius:10px;background:linear-gradient(#fff1ce,#e8c879);box-shadow:inset 0 0 0 1px #fff7,inset 0 0 8px #6a3b0066;display:flex;align-items:center;justify-content:center;overflow:hidden}
      #symbolProof .cell{width:58px;height:58px;border-radius:10px}
      #symbolProof .cell svg{width:88%;height:88%;filter:none}
      #symbolProof .cell::before{left:22%;right:22%;bottom:3%;height:12%}
      #symbolProof .cell::after{left:27%;top:9%;width:25%;height:14%}
      #symbolProof .lock{inset:0;height:58px;border-radius:10px}
      #symbolProof .lock svg{width:92%;height:92%;filter:none}
      #symbolProof .empty{background:#0002;color:#ffd24a66;font-size:20px}
    </style><section id="symbolProof"><h2>Materiais e estados</h2><div class="symbol-head"><span>SÍMBOLO</span><span>NORMAL</span><span>VENCEDOR</span><span>WILD TRAVADO</span></div>${rows}</section>`);
  }, symbols);
  await expect(page.locator('#symbolProof .symbol-row')).toHaveCount(7);
  await expect(page.locator('#symbolProof .cell:not(.win)')).toHaveCount(7);
  await expect(page.locator('#symbolProof .cell.win')).toHaveCount(7);
  await expect(page.locator('#symbolProof .lock--wild')).toHaveCount(1);
  await page.screenshot({ path: path.join(SHOTS, `${info.project.name}-symbol-atlas.png`) });
});

test('bônus diário mostra dia da sequência e 7 marcadores', async ({ page }, info) => {
  await page.goto('/index.html?test=1');
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
  await page.goto('/index.html?test=1');
  await page.locator('#start').click();
  await page.locator('#getDaily').click();
  await expect(page.locator('#modal')).toBeHidden();
  await page.reload();
  await page.locator('#start').click();
  await expect(page.locator('#getDaily')).toHaveCount(0);
  const streak = await page.evaluate(() => JSON.parse(localStorage.getItem('tigrinho.save.v2')).streak);
  expect(streak).toBe(1);
});

test.describe('com movimento', () => {
  test.use({ reducedMotion: 'no-preference' });
  test('peças do mascote animam separadamente nos estados de giro, vitória e grande vitória', async ({ page }, info) => {
    await page.goto('/index.html?test=1');
    await page.evaluate(() => document.getElementById('start').click());
    await page.waitForTimeout(400);
    await page.evaluate(() => { const daily = document.getElementById('getDaily'); if (daily) daily.click(); });
    await expect(page.locator('#splash')).toBeHidden();
    const mascot = page.locator('#mascot');
    await expect(mascot.locator('.dog-ear-l')).toBeAttached();
    await expect(mascot.locator('.dog-ear-r')).toBeAttached();
    await expect(mascot.locator('.dog-head')).toBeAttached();
    await expect(mascot.locator('.dog-collar')).toBeAttached();
    for (const [state, selector, animation] of [
      ['spinning', '.dog-head', 'headtilt'],
      ['cheer', '.dog-ear-l', 'earflop'],
      ['big', '.dog-ear-r', 'earflop'],
    ]) {
      await mascot.evaluate((el, name) => { el.setAttribute('class', `mascot ${name}`); }, state);
      const name = await mascot.locator(selector).evaluate((el) => getComputedStyle(el).animationName);
      expect(name).toBe(animation);
      await page.screenshot({
        path: path.join(SHOTS, `${info.project.name}-mascote-${state}.png`),
        style: '#fx { display: none !important } #bubble { visibility: hidden !important }',
      });
    }
  });

  test('celebração de vitória grande (mega) aparece, mostra print e fecha', async ({ page }, info) => {
    await page.goto('/index.html?test=1');
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
    await page.goto('/index.html?test=1');
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

test('hook de teste não existe em produção (sem ?test=1)', async ({ page }) => {
  await page.goto('/index.html');
  expect(await page.evaluate(() => typeof window.__tigrinho)).toBe('undefined');
});

test('save v1 é migrado para v2 ao abrir o jogo', async ({ page }) => {
  await page.goto('/index.html');
  // o primeiro acesso já gravou um v2 padrão; simula um usuário que só tinha o v1
  await page.evaluate(() => { localStorage.removeItem('tigrinho.save.v2'); localStorage.setItem('tigrinho.save.v1', JSON.stringify({ balance: 4321, bet: 25, streak: 2, stats: { spins: 5 } })); });
  await page.reload();
  await page.locator('#start').click();
  await expect(page.locator('#balance')).toHaveText('4.321');
  const v2 = await page.evaluate(() => JSON.parse(localStorage.getItem('tigrinho.save.v2')));
  expect(v2.v).toBe(2);
  expect(v2.bet).toBe(25);
  expect(await page.evaluate(() => localStorage.getItem('tigrinho.save.v1') !== null)).toBe(true);
});

// --- Q1-11: limites de aposta ---
test('aposta respeita mínimo e máximo', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  await page.evaluate(() => { window.__tigrinho.S.bet = 500; document.getElementById('betUp').click(); });
  await expect(page.locator('#bet')).toHaveText('500');
  await page.evaluate(() => { window.__tigrinho.S.bet = 5; document.getElementById('betDown').click(); });
  await expect(page.locator('#bet')).toHaveText('5');
});

test('saldo menor que a aposta ajusta a aposta automaticamente ao girar', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  await page.evaluate(() => { const S = window.__tigrinho.S; S.balance = 30; S.bet = 500; });
  await page.locator('#spin').click();
  await waitSpinDone(page);
  await clearOverlays(page);
  const bet = await page.evaluate(() => window.__tigrinho.S.bet);
  expect(bet).toBeLessThanOrEqual(30);
  expect(bet).toBeGreaterThan(0);
});

test('saldo zerado abre o presente de fichas (sem girar)', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  await page.evaluate(() => { const S = window.__tigrinho.S; S.balance = 0; S.bet = 5; });
  await page.locator('#spin').click();
  await expect(page.locator('#modalCard')).toContainText('O Caramelo te ajuda');
  await page.locator('#getRefill').click();
  await expect(page.locator('#modal')).toBeHidden();
  expect(await page.evaluate(() => window.__tigrinho.S.balance)).toBe(1500);
});

// --- Q1-10: baselines visuais (fonte e animações fixas; partículas mascaradas) ---
const VISUAL = { animations: 'disabled', maxDiffPixelRatio: 0.03, mask: [] };
test('baseline visual: logo da tela inicial', async ({ page }) => {
  await page.goto('/index.html?test=1');
  await expect(page.locator('#splash')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('#splash .logo')).toHaveScreenshot('splash-logo.png', VISUAL);
});

test('splash mantém a arte, chamada, botão e aviso em viewport', async ({ page }) => {
  await page.goto('/index.html?test=1');
  const splash = page.locator('#splash');
  await expect(splash.locator('.splash-dog')).toBeVisible();
  await expect(splash.locator('.tag')).toContainText('Caramelo da Sorte');
  await expect(splash.locator('#start')).toBeVisible();
  await expect(splash.locator('.fine')).toContainText('sem prêmios reais');
  const box = await splash.boundingBox();
  expect(box.width).toBeGreaterThan(300);
  expect(box.height).toBeGreaterThan(300);
});
test('baseline visual: máquina parada', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  await page.evaluate(() => {
    document.getElementById('winbar').style.display = 'none';
    document.getElementById('bubble').style.display = 'none';
  });
  await page.evaluate(() => document.fonts.ready);
  // Recorta a máquina/símbolos para que a comparação não dependa das fontes do HUD.
  await expect(page.locator('#machine')).toHaveScreenshot('maquina.png', VISUAL);
});

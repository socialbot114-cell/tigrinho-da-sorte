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

test('modal anuncia diálogo, move foco para dentro e Escape devolve o foco', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  await page.locator('#btnMenu').click();
  const card = page.locator('#modalCard');
  await expect(card).toHaveAttribute('role', 'dialog');
  await expect(card).toHaveAttribute('aria-modal', 'true');
  expect(await card.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('#modal')).toBeHidden();
  await expect(page.locator('#btnMenu')).toBeFocused();
});

test('loop de partículas pausa em aba oculta e reinicia ao voltar', async ({ page }) => {
  await page.goto('/index.html?test=1');
  const states = await page.evaluate(() => {
    const initial = window.__tigrinho.effectsRunning();
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    const hidden = window.__tigrinho.effectsRunning();
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
    return { initial, hidden, visibleAgain: window.__tigrinho.effectsRunning() };
  });
  expect(states).toEqual({ initial: true, hidden: false, visibleAgain: true });
});

test('foco retorna ao acionador depois de fechar menu por Escape', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  const menuButton = page.locator('#btnMenu');
  await menuButton.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#modalCard')).toHaveAttribute('aria-modal', 'true');
  await page.keyboard.press('Escape');
  await expect(page.locator('#modal')).toBeHidden();
  await expect(menuButton).toBeFocused();
});

test('AUTO para ao abrir menu e não inicia giro atrás do modal', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  await page.evaluate(() => window.__tigrinho.toggleAuto());
  await waitSpinDone(page);
  await page.locator('#btnMenu').click();
  await expect(page.locator('#modal')).toBeVisible();
  await page.waitForTimeout(950);
  expect(await page.evaluate(() => window.__tigrinho.S.stats.spins)).toBe(1);
  expect(await page.evaluate(() => window.__tigrinho.autoLeft())).toBe(0);
});

test('toques repetidos em Começar abrem e concedem apenas um bônus diário', async ({ page }) => {
  await page.goto('/index.html?test=1');
  await page.evaluate(() => {
    const start = document.getElementById('start');
    start.click(); start.click(); start.click();
  });
  await expect(page.locator('#splash')).toBeHidden();
  await expect(page.locator('#getDaily')).toBeVisible();
  await expect(page.locator('#modalCard h2')).toHaveCount(1);
  await page.locator('#getDaily').click();
  await expect(page.locator('#modal')).toBeHidden();
  const result = await page.evaluate(() => JSON.parse(localStorage.getItem('tigrinho.save.v2')));
  expect(result.balance).toBe(12000);
  expect(result.streak).toBe(1);
});

test('storage indisponível é reportado sem quebrar a rodada em memória', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  await page.evaluate(() => {
    Storage.prototype.setItem = function () { throw new DOMException('Storage disabled', 'QuotaExceededError'); };
  });
  await page.locator('#spin').click();
  await waitSpinDone(page);
  await expect(page.locator('#toast')).toHaveText(/gravar o progresso/i);
  expect(await page.evaluate(() => window.__tigrinho.S.stats.spins)).toBe(1);
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

test('controles usam ícones SVG e o som comunica o estado acessível', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  await expect(page.locator('#btnMenu use')).toHaveAttribute('href', '#i-menu');
  await expect(page.locator('#betDown use')).toHaveAttribute('href', '#i-minus');
  await expect(page.locator('#betUp use')).toHaveAttribute('href', '#i-plus');
  await expect(page.locator('#turbo use')).toHaveAttribute('href', '#i-bolt');
  await expect(page.locator('#btnSound')).toHaveAttribute('aria-label', 'Desativar som');
  await page.locator('#btnSound').click();
  await expect(page.locator('#btnSound')).toHaveAttribute('aria-label', 'Ativar som');
  await expect(page.locator('#btnSound use')).toHaveAttribute('href', '#i-sound-off');
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

test('vitórias com várias linhas revelam cada linha e terminam com o conjunto completo', async ({ page }, info) => {
  await startGame(page);
  await clearOverlays(page);
  const observed = await page.evaluate(async () => {
    const reveals = [];
    const winCount = await window.__tigrinho.highlightSequence([
      { cells: [[0, 0], [1, 0], [2, 0]] },
      { cells: [[0, 2], [1, 2], [2, 2]] },
    ], (index, total) => reveals.push(`${index}/${total}`));
    return { reveals, winCount, finalCells: document.querySelectorAll('#reels .cell.win').length };
  });
  expect(observed.reveals).toEqual(['1/2', '2/2']);
  expect(observed.winCount).toBe(2);
  expect(observed.finalCells).toBe(6);
  await shot(page, '07-linhas-sequenciais', info);
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

test('sequência diária permanece limitada a 7 dias no save', async ({ page }) => {
  await page.goto('/index.html?test=1');
  await page.evaluate(() => {
    const key = 'tigrinho.save.v2', save = JSON.parse(localStorage.getItem(key));
    save.lastDaily = new Date(Date.now() - window.TigerConfig.gameConfig.DAY_MS).toDateString();
    save.streak = 7;
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.reload();
  await page.locator('#start').click();
  await expect(page.locator('#modalCard')).toContainText('Dia 7 de sequência — prêmio máximo!');
  await expect(page.locator('#modalCard')).toContainText('+5.000');
  await page.locator('#getDaily').click();
  const streak = await page.evaluate(() => JSON.parse(localStorage.getItem('tigrinho.save.v2')).streak);
  expect(streak).toBe(7);
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

// --- Q3-01: tutorial de primeiro uso (só leitura: saldo, aposta e giros não mudam) ---
test('tutorial de primeiro uso percorre os quatro passos sem mexer em saldo, aposta ou giros', async ({ page }) => {
  await page.goto('/index.html?test=1&tutorial=1');
  await page.evaluate(() => document.getElementById('start').click());
  await expect(page.locator('#modalCard h2')).toHaveText('Oi, eu sou o Caramelo!');
  const read = () => page.evaluate(() => ({ balance: window.__tigrinho.S.balance, bet: window.__tigrinho.S.bet, spins: window.__tigrinho.S.stats.spins }));
  const before = await read();
  for (let i = 0; i < 3; i++) {
    await expect(page.locator('#tutSkip')).toBeVisible(); // "Pular" visível em todo passo
    await page.locator('#tutNext').click();
  }
  await expect(page.locator('#modalCard h2')).toHaveText('O Caramelo WILD');
  await page.locator('#tutNext').click(); // último passo: fecha e segue para o bônus diário
  await expect(page.locator('#modalCard h2')).toHaveText('Bônus diário!');
  expect(await read()).toEqual(before);
  expect(await page.evaluate(() => window.__tigrinho.S.seen.tutorial)).toBe(true);
});

test('pular tutorial marca como visto e não volta na abertura seguinte', async ({ page }) => {
  await page.goto('/index.html?test=1&tutorial=1');
  await page.evaluate(() => document.getElementById('start').click());
  await expect(page.locator('#tutSkip')).toBeVisible();
  await page.locator('#tutSkip').click();
  await expect(page.locator('#modalCard h2')).toHaveText('Bônus diário!');
  await page.reload();
  await page.evaluate(() => document.getElementById('start').click());
  await expect(page.locator('#modalCard h2')).toHaveText('Bônus diário!');
});

// --- Q3-02: dica contextual aparece uma única vez por tipo e fica registrada no save ---
test('dica de respin aparece uma vez e fica registrada no save', async ({ page }) => {
  await page.goto('/index.html?test=1');
  await page.evaluate(() => document.getElementById('start').click());
  await expect(page.locator('#splash')).toBeHidden();
  await page.evaluate(() => { const b = document.getElementById('getDaily'); if (b) b.click(); });
  await page.evaluate(() => window.__tigrinho.tip('respin'));
  await expect(page.locator('#toast')).toHaveText(/Caramelo WILD travado/, { timeout: 5000 });
  await expect.poll(() => page.evaluate(() => window.__tigrinho.S.seen.tips)).toEqual(['respin']);
  // segunda vez: nada acontece e a lista não repete o tipo
  await page.evaluate(() => window.__tigrinho.tip('respin'));
  await page.waitForTimeout(1800);
  expect(await page.evaluate(() => window.__tigrinho.S.seen.tips)).toEqual(['respin']);
});

// --- Q3-03: missões de rodízio aparecem no menu e pagam uma única vez ---
test('missões diárias e semanais aparecem e resgatam uma única vez', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  await page.locator('#btnMenu').click();
  await page.locator('[data-a="mis"]').click();
  await expect(page.locator('#modalCard')).toContainText('Hoje');
  await expect(page.locator('#modalCard')).toContainText('Esta semana');
  await expect(page.locator('#modalCard [data-r]')).toHaveCount(6);
  const target = await page.evaluate(() => {
    const PR = window.TigerProgression, s = window.__tigrinho.S;
    PR.refreshRotations(s, new Date());
    const m = PR.pickRotation('daily', s.rot.daily.key)[0];
    s.stats[m.stat] = s.rot.daily.start[m.stat] + m.goal; // cumpre a meta sem girar
    return { id: m.id, reward: m.reward };
  });
  await page.keyboard.press('Escape');
  await page.locator('#btnMenu').click();
  await page.locator('[data-a="mis"]').click();
  const before = await page.evaluate(() => window.__tigrinho.S.balance);
  await page.locator(`[data-r="daily:${target.id}"]`).click();
  await expect(page.locator(`[data-r="daily:${target.id}"]`)).toHaveCount(0); // vira "Resgatada"
  expect(await page.evaluate(() => window.__tigrinho.S.balance)).toBe(before + target.reward);
  expect(await page.evaluate(() => window.__tigrinho.S.rot.daily.claimed)).toEqual([target.id]);
});

// --- Q3-04: coleção mostra o status de cada item e o mascote exibe só os desbloqueados ---
test('coleção do mascote mostra status e o mascote exibe só os itens desbloqueados', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  await page.evaluate(() => { window.__tigrinho.S.cos = ['laco', 'oculos']; window.__tigrinho.S.level = 2; });
  await page.evaluate(() => document.getElementById('mascot').dataset.cos = 'laco oculos');
  await expect(page.locator('#mascot .cos-laco')).toBeVisible();
  await expect(page.locator('#mascot .cos-oculos')).toBeVisible();
  await expect(page.locator('#mascot .cos-flor')).toBeHidden();
  await page.locator('#btnMenu').click();
  await page.locator('[data-a="col"]').click();
  await expect(page.locator('#modalCard')).toContainText('✅');
  await expect(page.locator('#modalCard')).toContainText('🔒');
  await expect(page.locator('#modalCard')).toContainText('Chegue ao nível 4');
});

// --- Q3-06: "pular" aparece assim que a celebração abre, em todos os níveis com overlay ---
test.describe('celebração com pular', () => {
  test.use({ reducedMotion: 'no-preference' });
  test('dica de pular está visível logo ao abrir, nos níveis 3, 4 e 5', async ({ page }) => {
    await page.goto('/index.html?test=1');
    await page.evaluate(() => document.getElementById('start').click());
    await page.evaluate(() => { const b = document.getElementById('getDaily'); if (b) b.click(); });
    await expect(page.locator('#splash')).toBeHidden();
    for (const [ratio, level] of [[10, '3'], [25, '4'], [60, '5']]) {
      await page.evaluate((r) => { window.__tigrinho.preview(r); }, ratio); // sem retornar: a promessa só resolve no fim da celebração
      await expect(page.locator('#bigwin')).toBeVisible();
      await expect(page.locator('#bigwin')).toHaveAttribute('data-lvl', level);
      await expect(page.locator('#bwHint')).toBeVisible();
      await expect(page.locator('#bwHint')).toHaveText('toque para pular');
      await page.evaluate(() => document.getElementById('bigwin').click());
      await expect(page.locator('#bigwin')).toBeHidden();
    }
  });
});

// --- Q4-10: nenhuma requisição sai do próprio servidor, com métricas desligadas ou ligadas ---
test('sessão não faz requisição para fora do próprio servidor, com ou sem métricas', async ({ page }) => {
  const external = [];
  page.on('request', (r) => { if (!r.url().startsWith('http://127.0.0.1')) external.push(r.url()); });
  await startGame(page);
  await clearOverlays(page);
  await page.locator('#spin').click();
  await waitSpinDone(page);
  await page.locator('#btnMenu').click();
  await page.locator('[data-a="set"]').click();
  await page.locator('[data-s="analytics"]').click(); // opt-in
  await page.locator('[data-s="analytics"]').click(); // volta para opt-out
  expect(external).toEqual([]);
});

// --- Q3-10 a Q3-12: limite de sessão, lembrete e autoexclusão de fato bloqueiam o giro ---
test('limite de sessão pausa o jogo: não gira com clique nem com Espaço, e Escape não fecha', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  await page.locator('#btnMenu').click();
  await page.locator('[data-a="set"]').click();
  await page.locator('[data-wb="limit"]').click();
  await expect(page.locator('[data-wb="limit"]')).toHaveText('15 min');
  await page.keyboard.press('Escape');
  await expect(page.locator('#modal')).toBeHidden();
  const start = await page.evaluate(() => Date.now() + 15 * 60000);
  await page.evaluate((at) => window.__tigrinho.wbTick(at), start);
  await expect(page.locator('#bloqueio')).toBeVisible();
  await expect(page.locator('#bloqueioTitle')).toHaveText('Pausa obrigatória');
  const spins = await page.evaluate(() => window.__tigrinho.S.stats.spins);
  await page.locator('#spin').click({ force: true });
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__tigrinho.S.stats.spins)).toBe(spins);
  await page.keyboard.press('Escape');
  await expect(page.locator('#bloqueio')).toBeVisible();
  await page.evaluate((at) => window.__tigrinho.wbTick(at), start + 11 * 60000); // passou a pausa de 10 min
  await expect(page.locator('#bloqueio')).toBeHidden();
});

test('autoexclusão bloqueia até o prazo e continua valendo depois de recarregar', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  await page.locator('#btnMenu').click();
  await page.locator('[data-a="set"]').click();
  await page.locator('[data-wb="exclude"]').click();
  await page.locator('[data-ex="24h"]').click();
  await page.locator('#exConfirm').click();
  await expect(page.locator('#bloqueioTitle')).toHaveText('Autoexclusão ativa');
  await expect(page.locator('#bloqueio')).toBeVisible();
  await page.reload();
  await page.evaluate(() => document.getElementById('start').click());
  await expect(page.locator('#bloqueio')).toBeVisible();
  expect(await page.evaluate(() => window.__tigrinho.S.wb.excludeUntil)).toBeGreaterThan(Date.now());
});

test('lembrete de pausa aparece ao completar 30 min de sessão', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  await page.evaluate(() => window.__tigrinho.wbTick(Date.now() + 30 * 60000));
  await expect(page.locator('#toast')).toHaveText(/Você joga há 3\d min/);
});

// --- Q3-09: histórico mostra as rodadas reais, sem comparação com a melhor rodada ---
test('histórico lista as rodadas e não compara com a melhor', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  for (let i = 0; i < 2; i++) {
    await page.locator('#spin').click();
    await waitSpinDone(page);
    await clearOverlays(page);
  }
  await page.locator('#btnMenu').click();
  await page.locator('[data-a="hist"]').click();
  await expect(page.locator('#modalCard .row')).toHaveCount(2);
  await expect(page.locator('#modalCard')).not.toContainText(/melhor/i);
});

// --- Polimento: símbolos da vitória pulam em sequência, a linha se desenha, acessórios acompanham a cabeça ---
test('vitória: símbolos pulam em sequência e a linha usa as duas camadas (reduzido: estática)', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  await page.evaluate(() => window.__tigrinho.highlightLine());
  const hops = await page.locator('#reels .cell.win').evaluateAll((cells) => cells.map((c) => c.style.getPropertyValue('--hop')));
  expect(hops).toEqual(['0ms', '90ms', '180ms']);
  await expect(page.locator('#linefx polyline.line-base')).toHaveCount(1);
  await expect(page.locator('#linefx polyline.line-flow')).toHaveCount(1);
  // movimento reduzido: o brilho some e a base já aparece inteira
  expect(await page.locator('#linefx polyline.line-flow').evaluate((el) => getComputedStyle(el).display)).toBe('none');
  expect(await page.locator('#linefx polyline.line-base').evaluate((el) => getComputedStyle(el).strokeDashoffset)).toBe('0px');
});

test.describe('com movimento (polimento)', () => {
  test.use({ reducedMotion: 'no-preference' });
  test('linha se desenha, brilho percorre e acessórios da cabeça giram com o mascote', async ({ page }) => {
    await page.goto('/index.html?test=1');
    await page.evaluate(() => document.getElementById('start').click());
    await expect(page.locator('#splash')).toBeHidden();
    await page.evaluate(() => { const b = document.getElementById('getDaily'); if (b) b.click(); });
    await clearOverlays(page);
    await page.evaluate(() => window.__tigrinho.highlightLine());
    expect(await page.locator('#reels .cell.win svg').first().evaluate((el) => getComputedStyle(el).animationName)).toContain('winhop');
    expect(await page.locator('#linefx polyline.line-base').evaluate((el) => getComputedStyle(el).animationName)).toBe('linedraw');
    expect(await page.locator('#linefx polyline.line-flow').evaluate((el) => getComputedStyle(el).animationName)).toBe('lineflow');
    await page.evaluate(() => document.getElementById('mascot').setAttribute('class', 'mascot spinning'));
    expect(await page.locator('#mascot .cos-head').first().evaluate((el) => getComputedStyle(el).animationName)).toBe('headtilt');
  });
});

test('tela inicial mostra a coleção salva do mascote', async ({ page }) => {
  await page.goto('/index.html?test=1');
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('tigrinho.save.v2')); s.cos = ['laco', 'oculos']; localStorage.setItem('tigrinho.save.v2', JSON.stringify(s)); });
  await page.reload();
  await expect(page.locator('#splashDog')).toHaveAttribute('data-cos', 'laco oculos');
  await expect(page.locator('#splashDog .cos-laco')).toBeVisible();
  await expect(page.locator('#splashDog .cos-flor')).toBeHidden();
});

test('paisagem: o rótulo AUTO cabe no botão e não encosta no turbo', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone-paisagem', 'o problema é só na paisagem curta');
  await startGame(page);
  await clearOverlays(page);
  const auto = await page.locator('#auto').boundingBox(), turbo = await page.locator('#turbo').boundingBox();
  expect(auto.x + auto.width).toBeLessThanOrEqual(turbo.x);
  expect(await page.locator('#auto').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
});

// --- Experiência: menu em grupos, resumo da sessão, cartão de vitória, missões de descoberta e qualidade ---
test('menu organiza as opções em três grupos', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  await page.locator('#btnMenu').click();
  await expect(page.locator('#modalCard .menu-group')).toHaveCount(3);
  await expect(page.locator('#modalCard .menu-group').first()).toHaveText('Jogar');
});

test('minha sessão mostra rodadas e avaliação, e agradece o retorno', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  for (let i = 0; i < 2; i++) {
    await page.locator('#spin').click();
    await waitSpinDone(page);
    await clearOverlays(page);
  }
  await page.locator('#btnMenu').click();
  await page.locator('[data-a="sess"]').click();
  await expect(page.locator('#modalTitle')).toHaveText('Minha sessão');
  expect((await page.evaluate(() => window.__tigrinho.session())).rounds).toBe(2);
  await expect(page.locator('#modalCard .row').first()).toContainText('Rodadas');
  await page.locator('[data-feel="good"]').click();
  await expect(page.locator('#toast')).toHaveText(/Obrigado/);
  await expect(page.locator('[data-feel="good"]')).toHaveClass(/on/);
});

test('cartão de vitória gera uma imagem PNG para compartilhar', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  await page.evaluate(() => window.__tigrinho.showShareFor(25));
  await expect(page.locator('#shareWin')).toBeVisible();
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#shareWin').click()]);
  expect(download.suggestedFilename()).toBe('tigrinho-vitoria.png');
});

test('missões de descoberta contam o turbo e a troca de aposta', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  await page.locator('#turbo').click();
  await page.locator('#betUp').click();
  expect(await page.evaluate(() => window.__tigrinho.S.stats.turbo)).toBe(1);
  expect(await page.evaluate(() => window.__tigrinho.S.stats.betChanges)).toBe(1);
});

test('coleção mostra o progresso dos itens bloqueados', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  await page.locator('#btnMenu').click();
  await page.locator('[data-a="col"]').click();
  await expect(page.locator('#modalCard')).toContainText('0/100');
});

test('depois do tutorial, uma dica lembra que o ritmo é de quem joga', async ({ page }) => {
  await page.goto('/index.html?test=1&tutorial=1');
  await page.evaluate(() => document.getElementById('start').click());
  await page.locator('#tutSkip').click();
  await expect(page.locator('#toast')).toHaveText(/Você decide o ritmo/, { timeout: 5000 });
});

test('pausa obrigatória mostra o resumo de rodadas da sessão', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  await page.locator('#spin').click();
  await waitSpinDone(page);
  await clearOverlays(page);
  await page.evaluate(() => { window.__tigrinho.S.wb.limit = 15; });
  await page.evaluate(() => window.__tigrinho.wbTick(Date.now() + 16 * 60000));
  await expect(page.locator('#bloqueio')).toBeVisible();
  await expect(page.locator('#bloqueioText')).toContainText('Rodadas nesta sessão: 1');
});

test('qualidade: todo botão visível tem alvo de toque de 24 px e nome acessível', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  const small = await page.locator('#app button:visible').evaluateAll((els) => els
    .map((el) => { const b = el.getBoundingClientRect(); return { id: el.id || el.className, w: Math.round(b.width), h: Math.round(b.height) }; })
    .filter((b) => b.w < 24 || b.h < 24));
  expect(small).toEqual([]);
  const unnamed = await page.locator('#app button:visible').evaluateAll((els) => els
    .filter((el) => !el.getAttribute('aria-label') && !el.textContent.trim()).map((el) => el.id || el.className));
  expect(unnamed).toEqual([]);
});

test.describe('reações do mascote', () => {
  test.use({ reducedMotion: 'no-preference' });
  test('mascote reage: surpresa no respin e orgulho na subida de nível', async ({ page }) => {
    await page.goto('/index.html?test=1');
    await page.evaluate(() => document.getElementById('start').click());
    await page.locator('#splash').waitFor({ state: 'hidden' });
    await clearOverlays(page);
    await page.evaluate(() => window.__tigrinho.mood('surprised'));
    await expect(page.locator('#mascot')).toHaveClass(/surprised/);
    expect(await page.locator('#mascot .dog-head').evaluate((el) => getComputedStyle(el).animationName)).toBe('surprise');
    await page.evaluate(() => window.__tigrinho.mood('proud'));
    expect(await page.locator('#mascot').evaluate((el) => getComputedStyle(el).animationName)).toBe('proud');
  });
});

test('bônus diário dá folga de um dia: a sequência de 3 dias não zera', async ({ page }) => {
  await page.goto('/index.html?test=1');
  await page.evaluate(() => {
    const key = 'tigrinho.save.v2', save = JSON.parse(localStorage.getItem(key));
    save.lastDaily = new Date(Date.now() - 2 * window.TigerConfig.gameConfig.DAY_MS).toDateString();
    save.streak = 3;
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.reload();
  await page.evaluate(() => document.getElementById('start').click());
  await expect(page.locator('#modalCard')).toContainText('Dia 3 de sequência');
});

// --- Estética: halo da máquina, palco aceso na vitória e painel de ganho em destaque ---
test('halo dourado respira atrás da máquina e para com redução de movimento', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  expect(await page.locator('.stage').evaluate((el) => getComputedStyle(el, '::before').animationName)).toBe('none');
});

test.describe('halo com movimento permitido', () => {
  test.use({ reducedMotion: 'no-preference' });
  test('halo dourado respira atrás da máquina', async ({ page }) => {
    await page.goto('/index.html?test=1');
    await page.evaluate(() => document.getElementById('start').click());
    await page.locator('#splash').waitFor({ state: 'hidden' });
    await page.evaluate(() => { const b = document.getElementById('getDaily'); if (b) b.click(); });
    expect(await page.locator('.stage').evaluate((el) => getComputedStyle(el, '::before').animationName)).toBe('halo');
  });
});

test('palco aceso e painel de ganho ficam dourados quando a vitória está na tela', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  const base = await page.locator('.stage').evaluate((el) => getComputedStyle(el, '::before').backgroundImage);
  await page.evaluate(() => document.querySelector('.stage').classList.add('lit'));
  const lit = await page.locator('.stage').evaluate((el) => getComputedStyle(el, '::before').backgroundImage);
  expect(lit).toContain('255, 226, 122');
  expect(lit).not.toBe(base);
  const idleBorder = await page.locator('#winbar').evaluate((el) => getComputedStyle(el).borderTopColor);
  await page.evaluate(() => document.getElementById('winbar').classList.add('hit'));
  await expect.poll(() => page.locator('#winbar').evaluate((el) => getComputedStyle(el).borderTopColor)).toBe('rgb(255, 226, 122)');
  expect(idleBorder).not.toBe('rgb(255, 226, 122)');
});

// --- Estética: grande vitória com tipografia da marca e botão GIRAR com reflexo de esmalte ---
test.describe('estética da máquina', () => {
  test.use({ reducedMotion: 'no-preference' }); // a grande vitória fecha sozinha com redução de movimento
  test('grande vitória usa a tipografia da marca e uma placa de luz atrás do título', async ({ page }) => {
    await page.goto('/index.html?test=1');
    await page.evaluate(() => document.getElementById('start').click());
    await page.waitForTimeout(900);
    await page.evaluate(() => { const b = document.getElementById('getDaily'); if (b) b.click(); });
    await page.waitForTimeout(400);
    await page.evaluate(() => { window.__tigrinho.preview(25); });
    await expect(page.locator('#bigwin')).toBeVisible();
    expect(await page.locator('#bwTitle').evaluate((el) => getComputedStyle(el).fontFamily)).toContain('Bangers');
    expect(await page.locator('#bwTitle').evaluate((el) => getComputedStyle(el, '::before').content)).not.toBe('none');
  });
});

test('botão GIRAR tem reflexo de esmalte e anel interno', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  expect(await page.locator('#spin').evaluate((el) => getComputedStyle(el, '::before').content)).not.toBe('none');
  expect(await page.locator('#spin').evaluate((el) => getComputedStyle(el, '::after').borderTopWidth)).toBe('1px');
});

// --- Mascote: tamanho legível na tela de jogo (retrato); a linha dos rolos não pode espremê-lo ---
test('mascote mantém tamanho legível na tela de jogo, em retrato', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone-retrato', 'na paisagem o mascote tem outro layout');
  await startGame(page);
  await clearOverlays(page);
  const height = await page.locator('#mascot').evaluate((el) => el.getBoundingClientRect().height);
  expect(height).toBeGreaterThanOrEqual(90);
});

// --- Acessibilidade: a barra de nível anuncia o progresso e acompanha a largura visível ---
test('barra de nível é um progressbar e o valor anunciado bate com a largura', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  const xp = page.locator('#xp');
  await expect(xp).toHaveAttribute('role', 'progressbar');
  await expect(xp).toHaveAttribute('aria-label', 'Progresso do nível');
  await page.locator('#spin').click();
  await waitSpinDone(page);
  await clearOverlays(page);
  const shown = await page.locator('#xpbar').evaluate((el) => parseFloat(el.style.width) || 0);
  expect(Number(await xp.getAttribute('aria-valuenow'))).toBe(shown);
});

// --- Q2-07: moldura com lâmpadas no aro (lados e base); a espessura do aro acompanha a orientação ---
test('moldura tem lâmpadas nos lados e na base, e o aro acompanha a orientação', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  const frame = page.locator('.frame');
  const landscape = await page.evaluate(() => innerWidth > innerHeight);
  expect(await frame.evaluate((el) => getComputedStyle(el).getPropertyValue('--rim').trim())).toBe(landscape ? '6px' : '10px');
  const bulbs = await frame.evaluate((el) => getComputedStyle(el, '::before').backgroundImage);
  expect(bulbs.match(/radial-gradient/g)?.length).toBe(3);
});

// --- Q4-09: idioma inglês troca rótulos e atributos de acessibilidade, e a escolha fica salva ---
test('idioma inglês troca os textos e fica salvo depois de recarregar', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  await page.locator('#btnMenu').click();
  await page.locator('[data-a="set"]').click();
  await page.locator('[data-lang]').click();
  await expect(page.locator('#modalTitle')).toHaveText('Settings');
  await page.keyboard.press('Escape');
  await expect(page.locator('#spin span')).toHaveText('SPIN');
  await expect(page.locator('#betDown')).toHaveAttribute('aria-label', 'Decrease bet');
  await expect(page.locator('#bet')).toHaveText('10');
  expect(await page.evaluate(() => document.documentElement.lang)).toBe('en');
  await page.reload();
  await expect(page.locator('#splash .fine')).toContainText('Fictitious chips');
  await page.evaluate(() => document.getElementById('start').click());
  await expect(page.locator('#spin span')).toHaveText('SPIN');
  await expect(page.locator('#winlabel')).toHaveText('Last win');
});

// --- Q3-07: camadas de instrumentos seguem o nível do prêmio e voltam à base ---
test('camadas de instrumentos seguem o nível do prêmio e voltam à base', async ({ page }) => {
  await startGame(page);
  await page.evaluate(() => window.__tigrinho.sound.layer(4, 300));
  expect(await page.evaluate(() => window.__tigrinho.sound.layerLevel())).toBe(4);
  await expect.poll(() => page.evaluate(() => window.__tigrinho.sound.layerLevel()), { timeout: 2000 }).toBe(0);
});

// --- Q3-08: volumes de música e efeitos são independentes e persistidos no save ---
test('volumes de música e efeitos são independentes e ficam salvos', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  await page.locator('#btnMenu').click();
  await page.locator('[data-a="set"]').click();
  await page.locator('#vol-musicVol').fill('3');
  await page.locator('#vol-sfxVol').fill('7');
  expect(await page.evaluate(() => ({ music: window.__tigrinho.S.set.musicVol, sfx: window.__tigrinho.S.set.sfxVol, audio: window.__tigrinho.sound.volumes() })))
    .toEqual({ music: 3, sfx: 7, audio: { music: 0.3, sfx: 0.7 } });
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('tigrinho.save.v2')).set.musicVol)).toBe(3);
  await page.reload();
  await page.evaluate(() => document.getElementById('start').click());
  await clearOverlays(page);
  await page.locator('#btnMenu').click();
  await page.locator('[data-a="set"]').click();
  await expect(page.locator('#vol-musicVol')).toHaveValue('3');
  await expect(page.locator('#vol-sfxVol')).toHaveValue('7');
});

// --- Q2-11: contraste WCAG AA dos textos do HUD em cada tema (cores lidas do DOM real) ---
test('temas: textos do HUD passam WCAG AA em vermelho, jade e noite', async ({ page }) => {
  await page.goto('/index.html?test=1');
  const samples = await page.evaluate(() => {
    const app = document.getElementById('app');
    const read = (sel) => { const cs = getComputedStyle(document.querySelector(sel)); return { color: cs.color, opacity: parseFloat(cs.opacity) }; };
    return ['red', 'jade', 'noite'].map((theme) => {
      app.dataset.theme = theme;
      const cs = getComputedStyle(app);
      return {
        theme,
        bg1: cs.getPropertyValue('--bg1').trim(), bg2: cs.getPropertyValue('--bg2').trim(),
        nivel: read('.levelbox b'), aposta: read('.betbox small'), legal: read('.legal'), valor: read('.betbox b'),
      };
    });
  });
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = (rgb) => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
  const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
  const blend = (fg, bg, a) => fg.map((c, i) => c * a + bg[i] * (1 - a));
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const rgba = (s) => { const m = s.match(/[\d.]+/g).map(Number); return { rgb: m.slice(0, 3), a: m.length > 3 ? m[3] : 1 }; };
  for (const s of samples) {
    // Pior caso do fundo: o mais claro entre bg1 e bg2, com a camada de raios (#ffd24a a 7%) por cima.
    const stops = [hex(s.bg1), hex(s.bg2)];
    const worst = blend([255, 210, 74], stops.sort((a, b) => lum(b) - lum(a))[0], 0.07);
    const checks = [
      ['nível', s.nivel, 4.5], ['aposta', s.aposta, 4.5], ['rodapé', s.legal, 4.5], ['valor', s.valor, 3.0],
    ];
    for (const [name, { color, opacity }, min] of checks) {
      const c = rgba(color);
      const effective = blend(c.rgb, worst, c.a * opacity);
      expect(ratio(effective, worst), `${s.theme} · ${name}`).toBeGreaterThanOrEqual(min);
    }
  }
});

// --- Q2-10: parallax com inclinação (só com movimento permitido; evento de sensor simulado) ---
test.describe('inclinação do cenário', () => {
  test.use({ reducedMotion: 'no-preference' });
  // iOS expõe requestPermission; o Chromium também. Sem stub a resposta é 'prompt', e o jogo corretamente não liga.
  const grantMotion = (page, answer) => page.addInitScript((value) => {
    if (window.DeviceOrientationEvent) window.DeviceOrientationEvent.requestPermission = () => Promise.resolve(value);
  }, answer);

  test('sem permissão de movimento, o parallax não liga e avisa', async ({ page }) => {
    await grantMotion(page, 'denied');
    await page.goto('/index.html?test=1');
    await page.evaluate(() => document.getElementById('start').click());
    await expect(page.locator('#splash')).toBeHidden();
    await page.evaluate(() => { const b = document.getElementById('getDaily'); if (b) b.click(); });
    await clearOverlays(page);
    await page.locator('#btnMenu').click();
    await page.locator('[data-a="set"]').click();
    await page.locator('[data-s="tilt"]').click();
    await expect(page.locator('#toast')).toHaveText(/não liberou o sensor/);
    expect(await page.evaluate(() => window.__tigrinho.tiltOn())).toBe(false);
    expect(await page.evaluate(() => window.__tigrinho.S.set.tilt)).toBe(false);
  });

  test('liga pelo menu, responde à inclinação e desliga com redução de movimento', async ({ page }) => {
    await grantMotion(page, 'granted');
    await page.goto('/index.html?test=1');
    await page.evaluate(() => document.getElementById('start').click());
    await expect(page.locator('#splash')).toBeHidden();
    await page.evaluate(() => { const b = document.getElementById('getDaily'); if (b) b.click(); });
    await clearOverlays(page);
    await page.locator('#btnMenu').click();
    await page.locator('[data-a="set"]').click();
    await page.locator('[data-s="tilt"]').click();
    expect(await page.evaluate(() => window.__tigrinho.tiltOn())).toBe(true);
    await expect(page.locator('#cenario')).toHaveClass(/tilt/);
    await page.evaluate(() => {
      window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { beta: 45, gamma: 0 })); // repouso
      window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { beta: 45, gamma: 15 }));
    });
    await expect.poll(() => page.evaluate(() => parseFloat(document.getElementById('cenario').style.getPropertyValue('--px')))).toBeGreaterThan(0.3);
    await page.locator('[data-s="reduce"]').click();
    expect(await page.evaluate(() => window.__tigrinho.tiltOn())).toBe(false);
    await expect(page.locator('#cenario')).not.toHaveClass(/tilt/);
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

test('falha simulada na animação mantém o resultado salvo e libera novo giro', async ({ page }) => {
  await startGame(page);
  await clearOverlays(page);
  await page.evaluate(() => window.__tigrinho.failNextAnimation());
  await page.locator('#spin').click();
  await expect(page.locator('#spin')).not.toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('#toast')).toContainText('Seu resultado foi salvo');
  const afterFailure = await page.evaluate(() => ({
    state: window.__tigrinho.S,
    save: JSON.parse(localStorage.getItem('tigrinho.save.v2')),
  }));
  expect(afterFailure.state.stats.spins).toBe(1);
  expect(afterFailure.save.stats.spins).toBe(1);
  expect(afterFailure.save.balance).toBe(afterFailure.state.balance);

  await page.locator('#spin').click();
  await waitSpinDone(page);
  await clearOverlays(page);
  expect(await page.evaluate(() => window.__tigrinho.S.stats.spins)).toBe(2);
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
    const style = document.createElement('style');
    const cell = innerWidth > innerHeight ? 72 : 100;
    style.textContent = `:root { --cell: ${cell}px !important } #fx, #mascot, #bubble, #toast, #winbar { display: none !important }`;
    document.head.appendChild(style);
  });
  await page.evaluate(() => document.fonts.ready);
  // Recorte em pixels inteiros: a posição do aro pode cair em fração de pixel e o elemento inteiro mudaria de altura entre máquinas.
  const box = await page.locator('.frame').boundingBox();
  const x = Math.floor(box.x), y = Math.floor(box.y);
  const clip = { x, y, width: Math.ceil(box.x + box.width) - x, height: Math.ceil(box.y + box.height) - y };
  // Tamanho de célula fixo só na captura; compara arte/rolos sem HUD, texto ou canvas.
  const png = await page.screenshot({ clip, animations: 'disabled' });
  expect(png).toMatchSnapshot('maquina.png', { maxDiffPixelRatio: VISUAL.maxDiffPixelRatio });
});

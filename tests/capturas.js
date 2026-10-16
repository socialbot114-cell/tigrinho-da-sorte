// Gera as capturas da loja (docs/loja/capturas, 6,5" e 5,5") e a folha de poses do Caramelo (docs/prints/14-poses-mascote.png).
// Rodar: node tests/capturas.js  (sobe um servidor estático próprio em porta livre; não precisa de servidor externo).
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const ROOT = path.join(__dirname, '..', 'jogo');
const LOJA = path.join(__dirname, '..', 'docs', 'loja', 'capturas');
const PRINTS = path.join(__dirname, '..', 'docs', 'prints');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.txt': 'text/plain' };

// Tamanhos reais das lojas: 1284×2778 (6,5") e 1242×2208 (5,5"), a 3× de densidade.
const TELAS = [
  { tag: '6.5', viewport: { width: 428, height: 926 } },
  { tag: '5.5', viewport: { width: 414, height: 736 } },
];

function servir() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]);
      const file = path.join(ROOT, rel === '/' ? 'index.html' : rel);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

async function abrirJogo(browser, viewport, motion, base) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 3, reducedMotion: motion, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(base + '/index.html?test=1');
  return { ctx, page };
}

async function entrarNoJogo(page) {
  await page.evaluate(() => document.getElementById('start').click());
  await page.waitForTimeout(900);
  await page.evaluate(() => { const b = document.getElementById('getDaily'); if (b) b.click(); });
  await page.waitForTimeout(600);
}

async function capturasDaLoja(browser, base) {
  fs.mkdirSync(LOJA, { recursive: true });
  for (const { tag, viewport } of TELAS) {
    // Início: a tela de abertura, com o botão Começar.
    {
      const { ctx, page } = await abrirJogo(browser, viewport, 'reduce', base);
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(LOJA, `${tag}-1-inicio.png`) });
      await ctx.close();
    }
    // Máquina: a tela de jogo com o bônus diário fechado.
    {
      const { ctx, page } = await abrirJogo(browser, viewport, 'reduce', base);
      await entrarNoJogo(page);
      await page.screenshot({ path: path.join(LOJA, `${tag}-2-maquina.png`) });
      await ctx.close();
    }
    // Vitória grande: a sobreposição com movimento ligado, capturada logo depois do aviso.
    {
      const { ctx, page } = await abrirJogo(browser, viewport, 'no-preference', base);
      await entrarNoJogo(page);
      await page.evaluate(() => window.__tigrinho.preview(25));
      await page.waitForTimeout(450);
      await page.screenshot({ path: path.join(LOJA, `${tag}-3-vitoria-grande.png`) });
      await ctx.close();
    }
    console.log('loja', tag, 'ok');
  }
}

// Poses do Caramelo: cada animação é pausada no meio do ciclo, para a folha mostrar um quadro estável de cada pose.
const POSES = [
  { classe: '', titulo: 'Repouso' },
  { classe: 'spinning', titulo: 'Giro: cabeça inclinada' },
  { classe: 'cheer', titulo: 'Vitória: orelhas e braços' },
  { classe: 'big', titulo: 'Grande vitória: pulo' },
];

async function folhaDePoses(browser, base) {
  fs.mkdirSync(PRINTS, { recursive: true });
  const { ctx, page } = await abrirJogo(browser, { width: 390, height: 664 }, 'no-preference', base);
  await entrarNoJogo(page);
  // Só para a captura: o mascote sai da tela de jogo, fica ampliado numa camada transparente e sem o cenário atrás.
  // O jogo não muda; a página de captura é descartada depois.
  await page.evaluate(() => {
    document.getElementById('app').style.display = 'none';
    document.getElementById('splash').style.display = 'none';
    document.getElementById('fx').style.display = 'none';
    const wrap = document.createElement('div');
    wrap.id = 'pose-wrap';
    wrap.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:transparent;z-index:99999';
    document.body.appendChild(wrap);
    wrap.appendChild(document.getElementById('mascot'));
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';
  });
  await page.addStyleTag({ content: '#mascot{position:relative!important;left:0!important;bottom:auto!important;height:420px!important;width:auto!important}' });
  const imagens = [];
  for (const pose of POSES) {
    await page.evaluate((classe) => {
      const m = document.getElementById('mascot');
      m.setAttribute('class', classe ? `mascot ${classe}` : 'mascot');
      m.getAnimations({ subtree: true }).forEach((a) => { a.pause(); a.currentTime = a.effect.getComputedTiming().duration / 2; });
    }, pose.classe);
    await page.waitForTimeout(80);
    // Recorte central com fundo transparente: o pulo da grande vitória sobe, então a área é generosa.
    const buf = await page.screenshot({ omitBackground: true, clip: { x: 40, y: 20, width: 310, height: 624 } });
    imagens.push({ titulo: pose.titulo, src: 'data:image/png;base64,' + buf.toString('base64') });
  }
  await ctx.close();

  const sheet = await browser.newContext({ viewport: { width: 1100, height: 540 }, deviceScaleFactor: 1 });
  const p = await sheet.newPage();
  const fonte = fs.readFileSync(path.join(ROOT, 'fonts', 'Bangers-Regular.ttf')).toString('base64');
  const celulas = imagens.map((i) => `<figure><img src="${i.src}" alt="${i.titulo}"><figcaption>${i.titulo}</figcaption></figure>`).join('');
  await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face{font-family:Bangers;src:url(data:font/ttf;base64,${fonte}) format("truetype")}
    body{margin:0;background:#2a0408;color:#ffe89a;font:600 15px system-ui,sans-serif;padding:28px 32px;box-sizing:border-box;width:1100px;height:540px}
    h1{font:400 34px Bangers,Impact,sans-serif;letter-spacing:1px;margin:0 0 6px;color:#ffd24a}
    p{margin:0 0 18px;color:#f6ead7;font-weight:400}
    .grade{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
    figure{margin:0;background:radial-gradient(circle at 50% 35%,#7a0c14,#2a0408);border:1px solid #6b3d0a;border-radius:16px;padding:12px 8px 10px;text-align:center}
    img{height:330px;width:auto;max-width:100%;display:block;margin:0 auto}
    figcaption{margin-top:8px}
  </style></head><body><h1>Poses do Caramelo</h1><p>Quadro de cada pose, pausado no meio da animação. Para aprovação visual (Q2-03).</p><div class="grade">${celulas}</div></body></html>`);
  await p.screenshot({ path: path.join(PRINTS, '14-poses-mascote.png') });
  await sheet.close();
  console.log('poses ok');
}

(async () => {
  const srv = await servir();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch();
  try {
    await capturasDaLoja(browser, base);
    await folhaDePoses(browser, base);
  } finally {
    await browser.close();
    srv.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });

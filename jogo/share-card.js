/* Cartão de vitória para compartilhar (experiência). Mostra o momento com o Caramelo, sem valor em dinheiro.
   layout() é puro e testado em Node: calcula onde cada parte fica, dentro da moldura.
   build() e share() só rodam no navegador: desenham num canvas e usam a folha de compartilhamento do aparelho. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TigerShareCard = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const W = 1080, H = 1350; // formato 4:5, bom para feed

  // Posições (x, y, largura, altura) das partes do cartão. Pura.
  function layout() {
    const mascot = { w: 580, h: 687 };
    return {
      width: W,
      height: H,
      title: { x: W / 2, y: 180, size: 132 },
      mascot: { x: (W - mascot.w) / 2, y: 250, w: mascot.w, h: mascot.h },
      amount: { x: W / 2, y: 1040, size: 150 },
      caption: { x: W / 2, y: 1120, size: 40 },
      subtitle: { x: W / 2, y: 1200, size: 46 },
      footer: { x: W / 2, y: 1278, size: 30 },
    };
  }

  // Quais partes da coleção aparecem na imagem: só as desbloqueadas (CSS não vale dentro da imagem).
  function visibleCosmetics(unlockedIds) {
    return new Set((unlockedIds || []).map((id) => `cos-${id}`));
  }

  // Nomes de classe que só fazem sentido com CSS da página: removidos do desenho da imagem.
  const CSS_ONLY = ['mouth-open', 'lid'];

  function build({ title, amount, caption, subtitle, footer, mascotSvg, defsSvg, unlocked, font = 'Bangers' }) {
    const L = layout();
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const g = canvas.getContext('2d');

    // Fundo: degradê de festa e raios suaves, com moldura dourada.
    const bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#8a1020'); bg.addColorStop(1, '#2a0408');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.save(); g.translate(W / 2, 560); g.globalAlpha = 0.1; g.fillStyle = '#ffd24a';
    for (let i = 0; i < 24; i++) { g.rotate(Math.PI / 12); g.beginPath(); g.moveTo(0, 0); g.lineTo(60, 1400); g.lineTo(-60, 1400); g.closePath(); g.fill(); }
    g.restore();
    g.strokeStyle = '#ffd24a'; g.lineWidth = 16; g.strokeRect(28, 28, W - 56, H - 56);

    const text = (value, x, y, size, color, stroke) => {
      g.font = `${size}px ${font}, Impact, "Arial Black", sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      if (stroke) { g.lineWidth = Math.round(size / 14); g.strokeStyle = stroke; g.strokeText(value, x, y); }
      g.fillStyle = color; g.fillText(value, x, y);
    };
    text(title, L.title.x, L.title.y, L.title.size, '#ffe27a', '#5a0610');

    // Mascote: desenhado a partir do próprio SVG do jogo, sem os acessórios que não foram desbloqueados.
    const shown = visibleCosmetics(unlocked);
    const svgText = `<svg xmlns="http://www.w3.org/2000/svg" width="${L.mascot.w}" height="${L.mascot.h}" viewBox="0 0 160 190"><defs>${defsSvg}</defs>${mascotSvg(shown)}</svg>`;
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        g.drawImage(img, L.mascot.x, L.mascot.y, L.mascot.w, L.mascot.h);
        text(amount, L.amount.x, L.amount.y, L.amount.size, '#ffd24a', '#5a0610');
        text(caption, L.caption.x, L.caption.y, L.caption.size, '#fff3b0');
        text(subtitle, L.subtitle.x, L.subtitle.y, L.subtitle.size, '#ffe9a0', '#5a0610');
        text(footer, L.footer.x, L.footer.y, L.footer.size, 'rgba(255,243,176,.75)');
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('sem imagem'))), 'image/png');
      };
      img.onerror = () => reject(new Error('mascote não carregou'));
      img.src = url;
    });
  }

  // Entrega o arquivo pela folha de compartilhamento; sem suporte, baixa a imagem.
  async function share(blob, { fileName, title, text }) {
    const file = new File([blob], fileName, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title, text }); return 'shared'; }
      catch (error) { if (error && error.name === 'AbortError') return 'cancelled'; }
    }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = fileName;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    return 'downloaded';
  }

  return { layout, visibleCosmetics, CSS_ONLY, build, share };
});

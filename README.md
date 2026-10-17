# TIGRINHO

Caça-níquel casual com **fichas fictícias**. Sem depósito, sem saque, sem prêmios em dinheiro, sem anúncios e sem compras.
Mascote: o **Caramelo da Sorte**, um cachorro caramelo original. Arte e sons 100% próprios (SVG + WebAudio). Roda offline, sem backend.

## Estrutura

- `jogo/`: o jogo (vanilla JS, sem build):
  - `engine.js`: motor de regras puro, testável em Node.
  - `game.js`: entry point offline; compõe os módulos e conecta eventos.
  - `reels.js`, `celebration.js`: rolos e plano de celebração.
  - `save.js`, `effects.js`: persistência versionada e partículas.
  - `progression.js`, `game-ui.js`, `game-menus.js`: regras puras de progresso, HUD/feedback e modais.
  - `game-round-controller.js`: liquidação da rodada, animações, celebrações e controles.
  - `config.js`: configuração central de economia, rolos, animações e celebrações.
  - `audio.js`: música e efeitos sintetizados.
  - `index.html`, `style.css`, `manifest.json`, `assets.json`, ícone vetorial/PNG local e `fonts/` (Bangers, licença OFL).
  - `engine.test.js`: `npm test` (regras, config, HTML, RTP ≈ 95%).
- `tests/ui/`: testes de UI com Playwright em viewport de iPhone (retrato e paisagem).
- `blender/`: modelo procedural do cachorro (`cachorro.py`) para renderizar poses no Mac.
- `vendor/slot-game/`: referência do projeto groangroan/slot-game (MIT). Ver `THIRD_PARTY_NOTICES.md`.
- `refs-locais/`: imagens de referência de terceiros, **ignoradas pelo git**.
- `docs/`: planos e roadmap.
- `.github/workflows/`: `ci.yml` (Linux + macOS), `ci-macos.yml` e `ui.yml` (Playwright).

## Jogar

```bash
npm test          # motor e HTML
npm run lint
npm run serve     # http://localhost:8000
npm run test:ui   # Playwright (instala o Chromium uma vez: npx playwright install chromium)
```

Espaço ou Enter gira. No iPhone: Safari → Compartilhar → Adicionar à Tela de Início.

## Créditos

Ver `THIRD_PARTY_NOTICES.md`. Fonte Bangers (SIL OFL) em `jogo/fonts/OFL.txt`. Licença MIT do slot-game em `vendor/slot-game/LICENSE`.

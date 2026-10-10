# Tigrinho da Sorte

Caça-níquel casual com **fichas fictícias** (sem valor, sem depósito, sem saque, sem anúncios, sem compras).
Arte e sons 100% originais (SVG + WebAudio). Funciona offline abrindo `jogo/index.html`.

## Estrutura

- `jogo/` — jogo atual (vanilla JS):
  - `engine.js` — motor de regras puro (testável em Node).
  - `game.js` — interface, animações, progressão (usa `config.js`).
  - `config.js` — configuração central (`reels/bet/design/bigwin`, portado de `slot-game/src/utils/config.ts`).
  - `assets.json` — manifest de assets (inspirado em `slot-game/src/utils/asset-manifest.ts`).
  - `audio.js` — música/efeitos sintetizados (WebAudio).
  - `index.html`, `style.css`, `manifest.json`
  - `engine.test.js` — `npm test` (RTP ≈ 95%).
- `vendor/slot-game/` — cópia de referência do projeto https://github.com/groangroan/slot-game (MIT, PixiJS+TS). Ver `THIRD_PARTY_NOTICES.md`.
- `docs/` — plano iOS + roadmap de enriquecimento.
- `.github/workflows/` — CI (Linux + **macOS**) com `npm test` + `npm run lint`.

## Jogar

```bash
npm test
npm run lint
npm run serve
# abrir http://localhost:8000
```

No iPhone: Safari → Compartilhar → Adicionar à Tela de Início. Espaço/Enter gira.

## Enriquecimento a partir do slot-game (híbrido)

Portado o máximo útil sem trocar o motor/arte do Tigrinho:
- `REEL_OFFSET_TIME`, blur no giro, bounce/ease, pulse de vitória com auto-stop 2s.
- Padrão `disableSpin(bool)` para evitar duplo-toque.
- Botão rápido de som (`#btnSound`, espelha `SoundToggleButton`).
- `calculateScale` responsivo e manifest de assets.
- Regras/pagamento do slot-game **não** substituem as do Tigrinho (5 linhas, wild+respin, 7 símbolos ponderados).

## Créditos

Ver `THIRD_PARTY_NOTICES.md`. Licença MIT do slot-game preservada em `vendor/slot-game/LICENSE`.

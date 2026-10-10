# Roadmap de enriquecimento (slot-game → Tigrinho)

Estratégia: **híbrida**. Mantém motor/arte do Tigrinho; porta o máximo útil do `groangroan/slot-game` (MIT).

## Feito (v1.1.0)
- [x] `jogo/config.js` a partir de `slot-game/src/utils/config.ts`.
- [x] `jogo/assets.json` a partir de `asset-manifest.ts`.
- [x] `calculateScale` portado de `helpers.ts`.
- [x] Timings `SPIN/OFFSET/TURBO/ANTICIPATION` + blur + filler parametrizados em `game.js`.
- [x] Bounce de assentamento (`.cell.pop`, cf. `GameSymbol.bounce`).
- [x] Pulse de vitória + auto-stop 2s (cf. `startWinAnimation`).
- [x] Padrão `disableSpin(bool)` (cf. `SpinButton.setEnabled`).
- [x] Botão `#btnSound` (cf. `SoundToggleButton`) + `muteAll/unmuteAll` em `audio.js`.
- [x] `vendor/slot-game/` cópia integral de referência + `THIRD_PARTY_NOTICES.md`.
- [x] `npm test` ampliado (regressão, respin, config, assets, RTP) + `npm run lint`.
- [x] CI Linux+macOS (`.github/workflows/ci.yml`) + CI macOS full (`ci-macos.yml`).

## Não portar (decisão consciente)
- `checkWin` de 3 linhas horizontais + `winAmount += spin.length` — inferior às 5 linhas + `pay*lineBet` do Tigrinho.
- Símbolos `sym1-4` uniformes — inferiores aos 7 ponderados com RTP ~95%.
- `mp3` como substituto — manter WebAudio sintetizado offline-first.

## Próximos (quando autorizado)
1. `pixi-prototipo/`: Vite+TS com `App/Reels/GameSymbol` re-tematizados para o tigre (usa `vendor/` como base).
2. Testes de UI (Playwright) para giro, vitória e persistência `localStorage`.
3. Capacitor iOS (ver `docs/plano-tigrinho-ios.md`): `npx cap add ios` em Mac + Xcode.
4. Screenshots automáticos no CI macOS para App Store.

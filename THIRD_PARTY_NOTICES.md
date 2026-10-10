# Avisos de terceiros

## groangroan/slot-game (MIT) — referência e inspiração
- Origem: https://github.com/groangroan/slot-game
- Licença: MIT — Copyright (c) 2025 Goran Krneta (cópia integral em `vendor/slot-game/LICENSE`).
- O que foi copiado/adaptado para `jogo/`:
  - `src/utils/config.ts` → `jogo/config.js` (estrutura `reelsConfig/betConfig/designConfig`, valores do Tigrinho preservados).
  - `src/utils/asset-manifest.ts` → `jogo/assets.json` (inventário de bundles, símbolos SVG inline).
  - `src/utils/helpers.ts:calculateScale` → `TigerConfig.calculateScale` em `jogo/config.js`.
  - `src/game/Reels.ts:animateReel` (fast/slow + `REEL_OFFSET_TIME` + blur) → `jogo/game.js:spinReel/animateStep`.
  - `src/game/GameSymbol.ts:bounce/setWinning` (ease + pulse + auto-stop 2s) → `jogo/game.js` + `jogo/style.css:.cell.win`.
  - `src/ui/SpinButton.ts:setEnabled` → padrão `disableSpin(bool)` em `jogo/game.js`.
  - `src/ui/SoundToggleButton.ts` → botão `#btnSound` em `jogo/index.html` ligado a `Sound.setMusic/setSfx`.
  - `src/ui/GameUI.ts` → layout BET/WIN/BALANCE documentado em `jogo/assets.json`.
- O que NÃO foi copiado como substituto: símbolos `sym1-4`, tabela de pagamento uniforme, sons `mp3` e `checkWin` de 3 linhas — o Tigrinho mantém 7 símbolos, 5 linhas, wild+respin, arte SVG e áudio WebAudio originais.
- Atribuição preservada conforme exigência da MIT: aviso de copyright acima + `LICENSE` original em `vendor/`.

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

## v2.0 — TIGRINHO (MVP web offline)
- [x] Renomeado para TIGRINHO; mascote trocado para o Caramelo da Sorte (cachorro caramelo original).
- [x] Imagens de referência de terceiros movidas para `refs-locais/` (ignorado pelo git); duplicado `Tigrinho-da-Sorte.html` removido (continua no histórico).
- [x] Tela inicial com logo (Bangers, OFL), botão Começar e aviso de fichas fictícias. Bônus diário só depois de começar.
- [x] Cenário com pórtico, lanternas e moldura dourada; paisagem curta reorganizada em faixa horizontal.
- [x] `blender/cachorro.py` (modelo procedural). Não executado no Linux: sem Blender no ambiente.
- [x] Testes de UI com Playwright (`tests/ui/`, `npm run test:ui`) e workflow `ui.yml` com screenshots.
- [ ] Renderizar PNGs do cachorro no Mac e trocar o SVG quando aprovado.
- [ ] Multiplicador x10 em respins (fora do MVP; exige novos testes do motor).
- [ ] Empacotamento iOS (Capacitor), quando a conta Apple estiver em uso.

## v2.1 — premium e recompensas (parcial)
- [x] Tiers de prêmio no motor (`prizeTier`): pequena, média (BOA!), grande, mega, suprema. Testados.
- [x] Coreografia por tier: impacto (tremor, vibração, faíscas), chuva de moedas, moldura brilhando, mascote pulando em vitória grande.
- [x] Hitstop curto quando curinga cai, antes de revelar o prêmio.
- [x] Toque na barra de vitória pula a contagem. Vitórias mega e suprema têm contagem mais longa.
- [x] Áudio por camadas: `Sound.win(nível)` e `Sound.boost()` sobe a música em grandes vitórias.
- [x] Bônus diário com sequência (dia 1 = 2.000, +500 por dia, teto em 7 dias = 5.000). Testado.
- [x] Lembrete de tempo de jogo a cada 30 min, com sugestão de pausa (sem contagem regressiva).
- [x] Toast deslocado para acima dos controles, sem cobrir o balão do mascote.
- [ ] Arte premium (fase A): símbolos ainda são SVG planos; acabamento metálico e poses extras ficaram para a próxima iteração.
- [ ] Multiplicador x10 e eventos: fora desta versão.

## v2.2 (parcial)
- [x] Símbolos: sombra de contato e reflexo especular em cada célula (CSS, sem filtros pesados).
- [x] Rolos: bisel interno e faixa de reflexo vertical.
- [x] Moldura: bisel superior, base escura, lâmpadas nos cantos que piscam.
- [x] Reflexo varrendo a máquina em vitória de nível 2+ (`sweepMachine`).
- [x] Mascote com poses por estado: girando (braço em movimento), cheer (braço acenando), big (pulo com os dois braços).
- [x] Nível 3 com raios girando atrás da celebração; níveis 4-5 com multiplicador (xN) e chuva em duas ondas.
- [ ] Screenshots de referência com toHaveScreenshot e medição de frames.

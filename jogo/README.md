# TIGRINHO

Caça-níquel casual com **fichas fictícias** (sem valor, sem depósito, sem saque, sem anúncios, sem compras).
Mascote: Caramelo da Sorte (cachorro caramelo original). Arte e sons 100% próprios (SVG + WebAudio). Nenhum asset das imagens de referência foi usado.

## Jogar
Abra `index.html` no navegador (ou `python3 -m http.server` nesta pasta). No iPhone: Safari → Compartilhar → Adicionar à Tela de Início.
Espaço/Enter também gira.

## O que tem
- Máquina 3×3, 5 linhas, Caramelo WILD, **respin** com curingas travados (até 3), antecipação no 3º rolo
- Animações de rolos com ricochete, linhas vencedoras, chuva de moedas, tremor, mascote reativo
- Vitória Grande / Mega / Suprema (≥10x / 25x / 60x) com contagem de fichas
- Música oriental procedural + efeitos; vibração; modo reduzir movimento
- Níveis, 4 missões, 3 temas desbloqueáveis, bônus diário, recarga grátis ilimitada
- Progresso salvo localmente (`localStorage`); fichas debitadas/creditadas uma vez por rodada antes da animação

## Regras e retorno
`engine.js` é puro e testável: `npm test` na raiz (RTP ≈ 95%, hit ≈ 40%). Resultado sempre sorteio honesto, sem manipulação de “quase”.

## Orientação de tela
Retrato é o modo principal (`manifest: portrait-primary`, `data-orient` atualizado em JS).
Paisagem ≥700px usa layout adaptativo (mascote + rolos lado a lado, controlos compactos);
paisagem curta (<500px altura) usa faixa horizontal com a máquina ao centro e a dica de rodar some sozinha. `#boot` cobre o arranque.

## Cachorro no Blender
Modelo procedural em `../blender/cachorro.py`. Rode `./blender/render.sh` no Mac com Blender
instalado. Saídas em `renders/`. O SVG inline (`#s-dog`, `#s-mascot`) é a arte do jogo até os PNGs serem validados.

## Config e assets (inspirado no slot-game MIT)
- `config.js` — `reelsConfig/betConfig/designConfig/bigWinConfig + calculateScale` (portado de `slot-game/src/utils/config.ts` + `helpers.ts`).
- `assets.json` — manifest dos 9 símbolos SVG inline + UI + som (inspirado em `asset-manifest.ts`).
- Padrões portados: `REEL_OFFSET_TIME`, blur no giro, bounce `.cell.pop`, pulse `.cell.win` com auto-stop 2s, `disableSpin(bool)`, botão `#btnSound` (`SoundToggleButton`).
- Referência integral em `../vendor/slot-game/` + créditos em `../THIRD_PARTY_NOTICES.md`.

## iOS (adiado)
Empacotamento com Capacitor fica para depois do MVP web — ver `../docs/plano-tigrinho-ios.md`.

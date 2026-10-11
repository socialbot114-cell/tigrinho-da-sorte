# Changelog

Formato simples por versão. Datas em ISO. Fichas são fictícias, sem valor em dinheiro.

## 2.2.1 — 2026-10-10 (em desenvolvimento)
- Pipeline do Caramelo documentado: SVG original como arte principal; Blender opcional para renders após validação em Mac/iPhone.
- Componentes reutilizáveis da cabeça separados (orelhas esquerda/direita, face, coleira) e disponíveis como elementos animáveis na tela.
- Poses de giro, vitória e grande vitória aplicadas em partes do mascote; testes verificam as animações CSS.
- Prints de giro, vitória e grande vitória em `docs/prints/07–09`.
- Verificação atual: 28 checks unitários e 21 testes Playwright por perfil (retrato/paisagem).

## 2.2.0 — 2026-10-10 (branch `v2.2`)
- Mascote: poses por estado (girando, acenando, pulo em vitória grande).
- Símbolos com sombra de contato e reflexo; moldura com bisel e lâmpadas; reflexo varrendo a máquina em prêmios de nível 2+.
- Celebrações por nível: nível 3 com raios; níveis 4 e 5 com multiplicador (xN) e chuva em duas ondas.
- Módulos: `reels.js` (rolos e tempos), `celebration.js` (plano da celebração), `save.js` (persistência), `effects.js` (partículas).
- Save v2 (`tigrinho.save.v2`) com migração do v1; o v1 é preservado.
- Hook de teste `window.__tigrinho` só com `?test=1`.
- Testes: unitários (28 checks), Playwright em retrato e paisagem (20 testes por perfil), baselines visuais do logo da tela inicial e da máquina.
- ESLint substitui `node --check` no lint.

## 2.1.0
- Tiers de prêmio no motor (pequena, média, grande, mega, suprema).
- Coreografia por tier, hitstop no curinga, pulo da contagem ao tocar.
- Bônus diário com sequência de 7 dias (2.000 a 5.000 fichas).
- Lembrete de pausa a cada 30 min.

## 2.0.0 — TIGRINHO
- Renomeado de "Tigrinho da Sorte" para TIGRINHO; mascote trocado para o Caramelo da Sorte (cachorro caramelo, SVG).
- Tela inicial com fonte Bangers (SIL OFL).
- Testes de UI com Playwright e workflow `ui.yml`.
- Imagens de terceiros movidas para `refs-locais/` (fora do repositório).

## 1.1.0
- Organização do projeto, motor de regras (5 linhas, WILD com respin, 7 símbolos ponderados, RTP ≈ 95%).
- Porte de padrões do slot-game (MIT): timings, blur, bounce, disableSpin, botão de som.
- CI Linux e macOS.

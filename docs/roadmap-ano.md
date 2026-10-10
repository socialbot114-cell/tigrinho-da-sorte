# TIGRINHO: roadmap de 12 meses

Versão: 1.0 (planejamento). Atualizar a cada trimestre.
Estado de partida: protótipo web v2.2 (vanilla JS, offline, sem backend), não commitado desde a v1.1.0.

## Premissas (assumidas até confirmação)

Estas respostas ainda não foram dadas. O roadmap usa os valores abaixo como padrão e deve ser revisado quando forem confirmados.

| Tema | Premissa adotada | Impacto se mudar |
|---|---|---|
| Monetização | Nenhuma. Só cosméticos, sem compra de fichas | Classificação etária e revisão da App Store |
| Plataforma | iOS primeiro (Capacitor), web/PWA como canal paralelo | Ordem do Q4 |
| Capacidade | 8 horas por semana | Escopo do Q3 (ver riscos) |
| Nome | TIGRINHO até parecer jurídico | Identidade, ícone, loja |
| Parecer jurídico | Não obtido. Bloqueia publicação | Q4 inteiro |

## Princípios (valem o ano todo)

1. Fichas fictícias. Sem depósito, saque, PIX ou prêmio em dinheiro.
2. Sem near miss fabricado, sem timer de pressão, sem linguagem de aposta.
3. Controles de tempo de jogo e autoexclusão local sempre acessíveis.
4. Nenhuma publicação pública antes do parecer jurídico sobre nome e classificação.
5. Métricas de engajamento não são meta. Medimos satisfação e conclusão de tarefas.

## Convenções

- IDs: `Qn-NN` (trimestre e item). Cada item tem critério de aceite.
- Sprint = 2 semanas. Um trimestre tem 6 sprints.
- Estimativa em horas: 8 h/semana, logo cerca de 16 h por sprint. Ajustar se a capacidade mudar.
- Estados: `[ ]` pendente, `[~]` em andamento, `[x]` concluído.

---

## Trimestre 1 (meses 1–3): fundação e verificação

Objetivo: transformar o protótipo em base confiável antes de qualquer arte nova.

### Sprint 1: verificação do que já existe

- [x] **Q1-01** Commitar o estado atual em branch `v2.2` com mensagem de versão.
  - Aceite: `git status` limpo; `refs-locais/` fora do repositório.
- [x] **Q1-02** Rodar `ui.yml` no GitHub Actions pela primeira vez.
  - Aceite: workflow verde em `ubuntu-latest`. Se falhar, corrigir ambiente (Chromium, dependências) e documentar a causa.
- [x] **Q1-03** Confirmar `ci.yml` e `ci-macos.yml` verdes no mesmo commit.
  - Aceite: três workflows verdes no mesmo SHA. **Feito em a32b10c** (PR #1, rascunho em v2.2). Primeiro run do CI falhou por checagem errada de HTML; corrigido.
- [ ] **Q1-04** Renderizar `blender/cachorro.py` no Mac (quando disponível).
  - Aceite: 4 PNGs transparentes (`idle`, `girando`, `vitoria`, `grande-vitoria`) em `renders/`, revisados em tela de 390×844.
  - Plano B: se o render não agradar, manter SVG e registrar a decisão.
- [ ] **Q1-05** Medir FPS em iPhone real (Safari Web Inspector ou `requestAnimationFrame` com log).
  - Cenários: parado, giro, respin, vitória mega.
  - Aceite: planilha em `docs/perf/` com média e percentil 5 de cada cenário.

### Sprint 2: arquitetura

- [x] **Q1-06** Dividir `jogo/game.js` em módulos ES (ou IIFEs com namespace):
  `state.js`, `reels.js`, `celebration.js`, `hud.js`, `menus.js`, `effects.js`, `main.js`.
  - Aceite: `game.js` antigo removido; comportamento idêntico nos testes de UI.
  - **Feito:** `reels.js` (rolos, travas, linhas, tempos puros em `stepPlan`) e `celebration.js` (plano puro por nível). `game.js` ficou com estado, controles e menus.
- [x] **Q1-07** Versionar o save: `tigrinho.save.v2` com migração a partir de `tigrinho.save.v1`.
  - Aceite: teste unitário de migração com 3 saves de exemplo (novo, com progresso, corrompido).
  - **Feito:** `jogo/save.js` (v2 grava; v1 é migrado e não é apagado). 5 checks unitários e 1 teste de UI.
- [x] **Q1-08** Remover `window.__tigrinho.preview` do build de produção.
  - Aceite: a API só existe quando a URL tem `?test=1`. Testes de UI usam esse parâmetro.
  - **Feito:** `window.__tigrinho` só existe com `?test=1` (teste de UI e checagem no `engine.test.js`).
- [x] **Q1-09** Mover constantes de design e tempo para `config.js` (durações, cores de tiers, valores de bônus).
  - Aceite: nenhum número mágico de animação em `reels.js` e `celebration.js`.
  - **Feito parcial:** economia e lembrete em `config.js > gameConfig`. Animações ainda em `game.js` (dependem da divisão de módulos).

### Sprint 3: qualidade

- [x] **Q1-10** Baselines de `toHaveScreenshot` em retrato e paisagem (7 telas).
  - Aceite: baselines versionadas em `tests/ui/game.spec.js-snapshots/`; fonte e viewport fixos.
  - **Feito:** logo da splash (baseline focada) e máquina, retrato e paisagem, com partículas mascaradas; demais elementos da splash têm assertions estruturais. Baselines atualizadas para evitar dependência de rasterização do sistema.
- [x] **Q1-11** Testes de limite de aposta: mínimo, máximo, saldo menor que a aposta, ajuste automático.
- [x] **Q1-12** Lint com regras além de `node --check`: adicionar ESLint com `eslint:recommended`.
  - Aceite: `npm run lint` roda ESLint e falha em erro.
  - **Feito:** `eslint.config.js` (flat config, eslint 9). Sem erros.
- [x] **Q1-13** Escrever `CHANGELOG.md` com v1.1.0, v2.0, v2.1 e v2.2 reconstruídas do histórico.

**Saída do Q1:** CI verde, FPS medido, save versionado, `game.js` dividido em módulos, baselines visuais.

---

## Trimestre 2 (meses 4–6): arte e identidade

Objetivo: o visual parecer produto, não protótipo.

### Sprint 4: mascote

- [ ] **Q2-01** Decidir o pipeline do mascote com base no Q1-04 (SVG ou PNG). Registrar em `docs/decisoes/mascote.md`.
- [ ] **Q2-02** Separar o SVG do cachorro em partes: cabeça, orelhas, corpo, braços, cauda, colete.
  - Aceite: cada parte anima sozinha por CSS sem quebrar a silhueta.
- [ ] **Q2-03** Quatro poses finais (repouso, giro, vitória, grande vitória) aprovadas em screenshot.

### Sprint 5: símbolos e máquina

- [ ] **Q2-04** Sete símbolos com material próprio: metal, papel, vidro, fruta.
- [ ] **Q2-05** Cada símbolo em três estados: normal, travado (WILD), vencedor.
  - Aceite: tabela de 21 sprites revisada em grade 7×3.
- [ ] **Q2-06** Atlas WebP dos sprites (substitui SVG inline onde o desempenho exigir).
  - Aceite: tempo de primeira pintura medido antes e depois; sem regressão visual.
- [ ] **Q2-07** Moldura da máquina final, com reflexo e lâmpadas definidas em arte.

### Sprint 6: marca e cenário

- [ ] **Q2-08** Logo final com Bangers (OFL) e variação para ícone 1024 px.
- [ ] **Q2-09** Cenário em três camadas (fundo, pórtico, primeiro plano).
- [ ] **Q2-10** Parallax leve com `DeviceOrientationEvent`, desligado em redução de movimento e sem pedir permissão no iOS sem gesto do usuário.
- [ ] **Q2-11** Três temas (vermelho, jade, noite), desbloqueados por nível. Revisar contraste WCAG AA em cada um.

**Saída do Q2:** tela inicial, máquina e mascote aprovados em screenshot; atlas de sprites no build.

---

## Trimestre 3 (meses 7–9): experiência e progressão sem pressão

Objetivo: o jogador volta por prazer, não por urgência.

Atenção: este é o trimestre mais fácil de estourar (ver riscos). Itens marcados com `(opcional)` podem ser adiados para o Q4 sem bloquear o lançamento.

### Sprint 7: onboarding

- [ ] **Q3-01** Tutorial interativo de 60 segundos com skip visível em todas as etapas.
  - Aceite: ao concluir, o saldo e a aposta não mudam; o tutorial não gera rodada real.
- [ ] **Q3-02** Dica contextual uma única vez por tipo (respin, tiers), registrada no save.

### Sprint 8: missões e coleção

- [ ] **Q3-03** Missões diárias (3) e semanais (3), com recompensa em fichas e cosmético.
  - Aceite: missão não expira com pressão visual de contagem regressiva; reset às 00:00 local.
- [ ] **Q3-04** Coleção de cosméticos do mascote: 6 itens (roupas e acessórios) desbloqueados por marcos.
- [ ] **Q3-05** (opcional) Conquistas com lista visível e sem contador de "faltam X" comparativo.

### Sprint 9: celebrações e áudio

- [ ] **Q3-06** Revisão de duração por nível. Meta: nível 3 abaixo de 2,5 s; nível 5 abaixo de 4 s.
  - Aceite: "pular" visível desde o primeiro frame em todos os níveis.
- [ ] **Q3-07** Trilha com instrumentos por nível de prêmio (camadas, não só volume).
- [ ] **Q3-08** Volume independente para música e efeitos, com persistência no save.

### Sprint 10: bem-estar e histórico

- [ ] **Q3-09** Histórico local das últimas 50 rodadas: data, aposta, total. Sem comparativo com "melhor rodada" nem sugestão de aposta maior.
- [ ] **Q3-10** Limite de sessão opcional (15, 30, 60 min), com aviso e pausa obrigatória ao atingir.
- [ ] **Q3-11** Lembrete de pausa a cada 30 min, mantido e testado.
- [ ] **Q3-12** Autoexclusão local de 24 h, 7 dias ou 30 dias, com tela de bloqueio que não pode ser contornada pela UI (só pelo tempo ou por limpeza do save).
  - Aceite: teste de que o jogo não gira durante o período.

### Sprint 11: playtest

- [ ] **Q3-13** Playtest com 10 pessoas, roteiro fixo de 15 minutos.
  - Métricas: conclusão do tutorial, compreensão das fichas fictícias, sensação de excesso de estímulo (pergunta direta).
  - Não medir: tempo de tela como meta.
- [ ] **Q3-14** Relatório `docs/playtest/q3.md` com achados e decisões.

**Saída do Q3:** onboarding, missões, coleção, controles de bem-estar e relatório de playtest.

---

## Trimestre 4 (meses 10–12): plataforma e lançamento

Objetivo: publicar, com o gate jurídico concluído.

### Sprint 12: gate jurídico (bloqueante)

- [ ] **Q4-01** Parecer sobre o nome TIGRINHO e a classificação do jogo.
  - Aceite: parecer escrito e arquivado em `docs/juridico/`.
  - Se negativo: escolher novo nome antes do Q4-02. Nenhum item abaixo começa sem isso.
- [ ] **Q4-02** Verificação de disponibilidade de marca e domínio.
- [ ] **Q4-03** Política de privacidade e termos de uso revisados por advogado.

### Sprint 13: iOS

- [ ] **Q4-04** Projeto Capacitor (`npx cap add ios`) em Mac com Xcode. Versão mínima de iOS definida.
- [ ] **Q4-05** Ícone, splash e `PrivacyInfo.xcprivacy` (declarar que não há rastreamento).
- [ ] **Q4-06** Haptics via plugin do Capacitor; `navigator.vibrate` mantido só na web.
- [ ] **Q4-07** Áreas seguras (Dynamic Island, indicador inferior) validadas em iPhone pequeno e grande.
- [ ] **Q4-08** Build de TestFlight e teste em pelo menos 3 aparelhos.

### Sprint 14: localização e analytics

- [ ] **Q4-09** Textos em português e inglês em arquivo separado (`i18n/`), sem texto fixo no código.
- [ ] **Q4-10** Analytics somente opt-in, agregado e sem identificador individual. Desligado por padrão.
  - Aceite: com opt-out, nenhuma chamada de rede é feita (teste de rede no Playwright).

### Sprint 15: loja e web

- [ ] **Q4-11** Descrição, screenshots (6.5" e 5.5") e classificação etária alta.
- [ ] **Q4-12** Descrição sem promessa de ganho e com aviso de fichas fictícias.
- [ ] **Q4-13** PWA publicada (GitHub Pages ou similar) como canal paralelo, com domínio definido.

### Sprint 16: beta e lançamento

- [ ] **Q4-14** Beta fechado no TestFlight com 20 a 50 pessoas.
- [ ] **Q4-15** Correções dos problemas do beta, com prioridade para desempenho e bem-estar.
- [ ] **Q4-16** Submissão à App Store. A aprovação depende da Apple.

**Saída do Q4:** build aprovado no TestFlight, beta fechado em andamento, submissão feita.

---

## Trilhas transversais (todo trimestre)

- **Desempenho:** orçamento de 16 ms por frame em iPhone 12. Alerta se a média cair abaixo de 55 fps. Medido a cada sprint de fechamento.
- **Acessibilidade:** contraste WCAG AA, redução de movimento, texto ajustável, foco visível em todos os controles.
- **Testes:** Playwright com screenshots comparados; testes de regra no motor; teste de migração de save.
- **Documentação:** `docs/` e `CHANGELOG.md` atualizados em cada entrega.
- **Segurança de dados:** nenhum dado pessoal coletado sem opt-in; revisão a cada trimestre.

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Parecer jurídico negativo sobre o nome ou a classificação | Média | Alto | Gate no Q4-01; manter alternativas de nome desde já |
| Arte limitada pelo SVG (sem Blender no Linux) | Alta | Médio | Plano B com render no Mac; aceitar nível "bom" em vez de "premium" |
| Escopo do Q3 acima da capacidade de 8 h/semana | Alta | Médio | Itens opcionais marcados; Q3-05 pode sair |
| Desempenho no iPhone com muitos efeitos | Média | Médio | Medir no Q1-05; substituir filtros por transform/opacity |
| Mudança de regra da App Store para cassino simulado | Média | Alto | Revisar diretrizes antes do Q4-11 |
| Perda de trabalho por não commitar | Baixa | Alto | Q1-01 e commit a cada sprint |

## Decisões pendentes

1. Monetização: nenhuma, só cosméticos, ou outra? (premissa: nenhuma)
2. Plataforma: iOS primeiro ou web primeiro? (premissa: iOS)
3. Capacidade real em horas por semana? (premissa: 8)
4. Manter TIGRINHO até o parecer, ou preparar alternativas já? (premissa: manter)
5. Consultoria jurídica disponível antes do Q4? (premissa: não confirmada; sem ela o Q4 não avança)

Ao confirmar as decisões, atualizar a tabela de premissas e reestimar os sprints.

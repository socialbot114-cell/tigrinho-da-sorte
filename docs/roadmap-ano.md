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
  - **Bloqueado:** precisa de Blender em Mac; SVG adotado como arte principal em `docs/decisoes/mascote.md`.
- [ ] **Q1-05** Medir FPS em iPhone real (Safari Web Inspector ou `requestAnimationFrame` com log).
  - Cenários: parado, giro, respin, vitória mega.
  - Aceite: planilha em `docs/perf/` com média e percentil 5 de cada cenário.
  - **Bloqueado:** precisa de iPhone real e Safari Web Inspector; testes Chromium são apenas smoke funcional, não substituem essa medição.

### Sprint 2: arquitetura

- [x] **Q1-06** Dividir `jogo/game.js` em módulos locais sem build:
  `save.js`, `progression.js`, `reels.js`, `celebration.js`, `game-ui.js`, `game-menus.js`, `game-round-controller.js`, `effects.js`; `game.js` é o entry point.
  - Aceite: responsabilidades separadas sem regressão nos testes de UI.
  - **Feito:** regras de progressão são puras; o controller injeta motor, UI, áudio e efeitos; menus/HUD ficam fora do entry point.
- [x] **Q1-07** Versionar o save: `tigrinho.save.v2` com migração a partir de `tigrinho.save.v1`.
  - Aceite: teste unitário de migração com 3 saves de exemplo (novo, com progresso, corrompido).
  - **Feito:** `jogo/save.js` (v2 grava; v1 é migrado e preservado). Validação limita saldo, XP, nível, streak, estatísticas e tiers de missão; streak diário é limitado a 7 antes de persistir.
- [x] **Q1-08** Remover `window.__tigrinho.preview` do build de produção.
  - Aceite: a API só existe quando a URL tem `?test=1`. Testes de UI usam esse parâmetro.
  - **Feito:** `window.__tigrinho` só existe com `?test=1` (teste de UI e checagem no `engine.test.js`).
- [x] **Q1-09** Mover constantes de design e tempo para `config.js` (durações, cores de tiers, valores de bônus).
  - Aceite: nenhum número mágico de animação em `reels.js` e `celebration.js`.
  - **Feito:** tempos de rolos, hitstop, auto, progressão, áudio de contagem, sessão e celebração centralizados em `config.js`; CSS guarda propriedades visuais.

### Sprint 3: qualidade

- [x] **Q1-10** Baselines de `toHaveScreenshot` em retrato e paisagem (7 telas).
  - Aceite: baselines versionadas em `tests/ui/game.spec.js-snapshots/`; fonte e viewport fixos.
  - **Feito:** logo da splash (baseline focada) e máquina, retrato e paisagem; efeitos transitórios são ocultados, sem mascarar a arte. Baselines atualizadas para evitar dependência de rasterização do sistema.
- [x] **Q1-11** Testes de limite de aposta: mínimo, máximo, saldo menor que a aposta, ajuste automático.
- [x] **Q1-12** Lint com regras além de `node --check`: adicionar ESLint com `eslint:recommended`.
  - Aceite: `npm run lint` roda ESLint e falha em erro.
  - **Feito:** `eslint.config.js` (flat config, eslint 9). Sem erros.
- [x] **Q1-13** Escrever `CHANGELOG.md` com v1.1.0, v2.0, v2.1 e v2.2 reconstruídas do histórico.

**Saída do Q1:** CI verde, save versionado, `game.js` dividido em módulos locais e baselines visuais. FPS em iPhone real segue bloqueado até acesso ao aparelho.

---

## Trimestre 2 (meses 4–6): arte e identidade

Objetivo: o visual parecer produto, não protótipo.

### Sprint 4: mascote

- [x] **Q2-01** Decidir o pipeline do mascote com base no Q1-04 (SVG ou PNG). Registrar em `docs/decisoes/mascote.md`.
- [x] **Q2-02** Separar o SVG do cachorro em partes: cabeça, orelhas, corpo, braços, cauda, colete.
  - Aceite: cada parte anima sozinha por CSS sem quebrar a silhueta.
- [~] **Q2-03** Quatro poses finais (repouso, giro, vitória, grande vitória) aprovadas em screenshot.
  - **Implementado:** repouso, cabeça inclinada no giro, orelhas/braços na vitória e pulo/orelhas na grande vitória. CSS testado com movimento habilitado; aprovação visual final continua pendente.

### Sprint 5: símbolos e máquina

- [x] **Q2-04** Sete símbolos com material próprio: metal, papel, vidro, fruta.
  - **Feito:** metal/foil (lingote), papel esmaltado (envelope), tecido bordado (saco), fruta polida (tangerina), esmalte (rojões), vidro luminoso (lanterna) e ouro/mascote (Caramelo WILD). Arte em SVG local.
- [x] **Q2-05** Estados de apresentação: normal e vencedor para os sete símbolos; estado travado especial para Caramelo WILD.
  - **Feito:** classes CSS por material, aura de vitória tonal e moldura dourada do WILD travado. Atlas 7×3 (normal/vencedor/lock aplicável) em `docs/prints/10-simbolos-estados.png`; a coluna lock só se aplica ao WILD pelas regras do jogo.
- [ ] **Q2-06** Atlas WebP dos sprites (substitui SVG inline onde o desempenho exigir).
  - Aceite: tempo de primeira pintura medido antes e depois; sem regressão visual.
  - **Bloqueado:** primeiro medir desempenho em iPhone real (Q1-05); sem evidência de gargalo, manter SVG vetorial offline.
- [~] **Q2-07** Moldura da máquina final, com reflexo e lâmpadas definidas em arte.
  - **Parcial:** adicionado cabeçalho “Festival do Caramelo” e acabamento dourado; lâmpadas correndo pelos lados e pela base do aro, sulco fino em volta da janela dos rolos e espessura do aro por orientação (teste de UI). Falta a revisão final da arte, que é decisão de design.

### Sprint 6: marca e cenário

- [~] **Q2-08** Logo final com Bangers (OFL) e variação para ícone 1024 px.
  - **Parcial:** ícone SVG, PNG 512 e variante 1024 (`jogo/icon-1024.png`, quadrada, sem transparência e sem cantos arredondados), ligados ao manifesto PWA e cobertos por teste. Falta revisão do ícone em aparelho e aprovação visual.
- [x] **Q2-09** Cenário em três camadas (fundo, pórtico, primeiro plano).
  - **Feito:** `.cenario` com `camada-fundo` (raios e vinheta), `camada-portico` (arco e lanternas) e `camada-frente` (brilho e bokeh). Camadas não capturam toque, ficam abaixo do palco e dos controles e usam só gradiente e `transform` (sem `filter`). Movimento reduzido desliga tudo, inclusive os raios. Verificado em Chromium no viewport do iPhone 13, retrato e paisagem: nenhum alvo de toque bloqueado.
- [~] **Q2-10** Parallax leve com `DeviceOrientationEvent`, desligado em redução de movimento e sem pedir permissão no iOS sem gesto do usuário.
  - **Parcial:** `jogo/parallax.js` desloca as três camadas (profundidades 4, 8 e 12 px). Liga só pela opção "Profundidade ao inclinar" no menu, desligada por padrão. A permissão é pedida dentro do clique; sem permissão concedida, não liga e avisa. Redução de movimento desliga tudo. Testes: deslocamento puro (Node) e fluxo do menu com permissão concedida, negada e redução (Playwright). **Falta** validar o fluxo de permissão em iPhone real.
- [x] **Q2-11** Três temas (vermelho, jade, noite), desbloqueados por nível. Revisar contraste WCAG AA em cada um.
  - **Feito:** desbloqueio por nível já existia em `progression.js` (jade no nível 3, noite no nível 6). A revisão de contraste reprovou o jade (textos dourados e brancos pequenos entre 3,2:1 e 4,1:1) e o rodapé do vermelho (4,4:1). Ajustes: jade com fundo `#0a442f` (mesma matiz, mais fundo) e rodapé com opacidade 70%. Teste em Playwright lê as cores do DOM real nos três temas e aplica a fórmula WCAG, nos dois viewports.

**Saída do Q2:** tela inicial, máquina e mascote aprovados em screenshot; atlas de sprites no build.

---

## Trimestre 3 (meses 7–9): experiência e progressão sem pressão

Objetivo: o jogador volta por prazer, não por urgência.

Atenção: este é o trimestre mais fácil de estourar (ver riscos). Itens marcados com `(opcional)` podem ser adiados para o Q4 sem bloquear o lançamento.

### Sprint 7: onboarding

- [x] **Q3-01** Tutorial interativo de 60 segundos com skip visível em todas as etapas.
  - Aceite: ao concluir, o saldo e a aposta não mudam; o tutorial não gera rodada real.
  - **Feito:** quatro passos (`jogo/tutorial.js`) em modal, com "Pular tutorial" em todos. Aparece no primeiro uso, antes do bônus diário, e pode ser reaberto em Menu > Como jogar. Teste confere saldo, aposta e giros antes e depois. **Limitação:** a tecla Escape fecha o tutorial sem marcá-lo como visto, então ele volta na próxima abertura.
- [x] **Q3-02** Dica contextual uma única vez por tipo (respin, tiers), registrada no save.
  - **Feito:** dicas `respin` e `tiers` em `TIPS`, gravadas em `seen.tips` do save v2 e mostradas com atraso para não disputar o aviso da rodada. Teste confirma que o tipo não se repete.

### Sprint 8: missões e coleção

- [x] **Q3-03** Missões diárias (3) e semanais (3), com recompensa em fichas e cosmético.
  - Aceite: missão não expira com pressão visual de contagem regressiva; reset às 00:00 local.
  - **Feito:** três diárias e três semanais por período, escolhidas de um pool pela data (`progression.js`). Diárias renovam à meia-noite local; semanais, na segunda. Recompensa em fichas em todas; cosmético pelo item "Guizos dourados", que vem de resgatar as três semanais. Sem contagem regressiva na tela. Decisão tomada: as missões em faixas continuam ao lado das novas.
- [x] **Q3-04** Coleção de cosméticos do mascote: 6 itens (roupas e acessórios) desbloqueados por marcos.
  - **Feito:** laço (nível 2), flor no ouvido (nível 4), guizos (semana completa de missões semanais), óculos (100 giros), estrela (3 vitórias grandes) e lanterna da coleira (10 WILD). Acessórios em SVG próprio no mascote do jogo; estado em `cos` do save. Tela "🎀 Coleção" no menu. **Limite:** o splash usa o mascote sem acessórios, e os acessórios não acompanham a inclinação da cabeça na animação de giro.
- [ ] **Q3-05** (opcional) Conquistas com lista visível e sem contador de "faltam X" comparativo.

### Sprint 9: celebrações e áudio

- [x] **Q3-06** Revisão de duração por nível. Meta: nível 3 abaixo de 2,5 s; nível 5 abaixo de 4 s.
  - Aceite: "pular" visível desde o primeiro frame em todos os níveis.
  - **Feito:** duração medida como contagem mais pausa (até fechar sozinho). Nível 3: 1,4 s + 0,9 s = 2,3 s. Nível 4: 2,0 s + 1,0 s = 3,0 s. Nível 5: 2,6 s + 1,1 s = 3,7 s (antes: 4,1 s, 4,9 s e 5,7 s). Teste de unidade trava as metas. "Toque para pular" é escrito antes da contagem começar, e o teste de interface confere sua visibilidade nos três níveis. **Nota:** o overlay ainda tem fade de entrada de 0,3 s, então a dica também aparece com esse fade.
- [x] **Q3-07** Trilha com instrumentos por nível de prêmio (camadas, não só volume).
  - **Feito:** a base da música continua igual. Cada nível de prêmio acrescenta uma camada por 1,8 s (vitória de nível 1 e 2) ou pelo tempo da celebração (nível 3 em diante): sinos (2), tambor grave (3), cordas (4) e brilho agudo (5). Teste confere a camada ativa e o retorno à base.
- [x] **Q3-08** Volume independente para música e efeitos, com persistência no save.
  - **Feito:** dois controles deslizantes (0 a 10) em Configurações, aplicados ao vivo e salvos em `set.musicVol` e `set.sfxVol`. O botão de som continua ligando e desligando os dois juntos.

### Sprint 10: bem-estar e histórico

- [x] **Q3-09** Histórico local das últimas 50 rodadas: data, aposta, total. Sem comparativo com "melhor rodada" nem sugestão de aposta maior.
  - **Feito:** `state.hist` no save v2 (limite 50, validado na migração), registrado no mesmo ponto em que as estatísticas são atualizadas. Tela "🧾 Histórico" no menu, com data, aposta e total. Teste confere o limite e a tela com rodadas reais.
- [x] **Q3-10** Limite de sessão opcional (15, 30, 60 min), com aviso e pausa obrigatória ao atingir.
  - **Feito:** desligado por padrão, em Configurações (ciclo 15 → 30 → 60 → desligado). Aviso 2 min antes. Ao atingir o limite, pausa de 10 min gravada no save, então recarregar não a encerra. A sessão recomeça depois da pausa.
- [x] **Q3-11** Lembrete de pausa a cada 30 min, mantido e testado.
  - **Feito:** a regra de intervalo saiu para `wellbeing.js` (testada em Node). Teste de interface confere o aviso aos 30 min. O lembrete não aparece durante bloqueio nem durante uma rodada.
- [x] **Q3-12** Autoexclusão local de 24 h, 7 dias ou 30 dias, com tela de bloqueio que não pode ser contornada pela UI (só pelo tempo ou por limpeza do save).
  - Aceite: teste de que o jogo não gira durante o período.
  - **Feito:** o prazo só cresce e não há botão de cancelar. A tela de bloqueio não tem botão de fechar nem Escape, e a rodada recusa giro com clique, Espaço ou automático. O prazo sobrevive a recarregar, e "Apagar progresso" o preserva (na prática, esse botão fica inacessível enquanto o bloqueio está ativo). **Limite conhecido:** quem editar o `localStorage` pelo navegador consegue limpar o save; o roadmap aceita isso como saída.

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
- [~] **Q4-05** Ícone, splash e `PrivacyInfo.xcprivacy` (declarar que não há rastreamento).
  - **Parcial:** ícone 1024 pronto (`jogo/icon-1024.png`). `docs/ios/PrivacyInfo.xcprivacy` escrito e validado como plist, declarando que não há rastreamento nem coleta. **Falta:** splash do iOS e a inclusão do arquivo no projeto Xcode (Q4-04).
- [~] **Q4-06** Haptics via plugin do Capacitor; `navigator.vibrate` mantido só na web.
  - **Parcial:** `jogo/haptics.js` escolhe a via (plugin do Capacitor, depois `navigator.vibrate`, ou nenhuma) e respeita a preferência de vibração. Testado com dependências falsas. **Falta:** o plugin de verdade, que depende de Q4-04.
- [ ] **Q4-07** Áreas seguras (Dynamic Island, indicador inferior) validadas em iPhone pequeno e grande.
- [ ] **Q4-08** Build de TestFlight e teste em pelo menos 3 aparelhos.

### Sprint 14: localização e analytics

- [x] **Q4-09** Textos em português e inglês em arquivo separado (`i18n/`), sem texto fixo no código.
  - **Feito:** textos em `jogo/i18n/pt-BR.js` e `jogo/i18n/en.js`, com `jogo/i18n.js` para trocar o idioma. O código usa só chaves; módulos puros (engine, progressão, tutorial) guardam chaves e a interface traduz na exibição. Escolha de idioma em Configurações, salva em `set.lang`; padrão pt-BR. Teste confere que os dois idiomas têm as mesmas chaves e parâmetros, que toda chave usada existe e que nenhuma sobra. **Fora do alcance:** mensagens de erro para desenvolvedor (console e exceções internas) continuam em português; o jogador não as vê.
- [x] **Q4-10** Analytics somente opt-in, agregado e sem identificador individual. Desligado por padrão.
  - **Feito:** `jogo/analytics.js` com contadores em memória, sem identificador. Opção "📊 Estatísticas anônimas" em Configurações, desligada por padrão. Sem endpoint configurado, nada sai do aparelho; o endpoint depende da decisão de publicação (Q4-13). Teste de Playwright confere que nenhuma requisição sai do servidor local, com opt-out ou opt-in.
  - Aceite: com opt-out, nenhuma chamada de rede é feita (teste de rede no Playwright).

### Sprint 15: loja e web

- [~] **Q4-11** Descrição, screenshots (6.5" e 5.5") e classificação etária alta.
  - **Parcial:** rascunho em `docs/loja/descricao.md`; capturas 6,5" (1284×2778) e 5,5" (1242×2208) em `docs/loja/capturas/` (início, máquina e vitória grande). **Falta:** confirmar a classificação 18+ com o parecer jurídico e revisar as capturas em aparelho.
- [x] **Q4-12** Descrição sem promessa de ganho e com aviso de fichas fictícias.
  - **Feito no rascunho:** o texto diz que as fichas são fictícias e que o jogo não garante ganhos. Revisar contra as diretrizes atuais antes do envio.
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

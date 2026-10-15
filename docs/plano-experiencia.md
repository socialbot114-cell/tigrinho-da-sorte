# TIGRINHO: plano de experiência (divertido, claro e compartilhável)

Este plano complementa o [roadmap](roadmap-ano.md) e o [plano de execução](plano-execucao-12-meses.md). Ele trata de encanto, fluxo, rotinas e qualidade, sem mecânicas de compulsão.

## Princípios que valem para este plano

1. **Divertir, não prender.** O sucesso é a pessoa sair satisfeita. Tempo de tela não é meta (roadmap, princípio 5).
2. **Nada de quase-vitória fabricada, pressão de tempo, penalidade por parar ou convite para continuar** (roadmap, princípios 2 e 3).
3. **Sem dinheiro real.** Fichas fictícias em toda a experiência, inclusive no que é compartilhado.
4. **Medir satisfação e conclusão.** A pergunta é "foi bom?", não "quanto tempo ficou?".

Pedidos que contrariam esses princípios (aumentar tempo de jogo com gatilhos de compulsão ou tornar o jogo viral pela pressão) não entram no plano. A decisão de mudar esses princípios é do dono do projeto, com revisão jurídica e de bem-estar.

## Itens e status

| ID | Item | Status | Como ficou | Verificado por |
|---|---|---|---|---|
| E-01 | Cartão de vitória compartilhável | Feito | Botão 📤 ao lado da última vitória (nível 2 ou mais). Imagem 1080×1350 com o Caramelo, o momento e o aviso "fichas fictícias". Usa a folha de compartilhamento do aparelho ou baixa o PNG. | Teste de download; teste de layout (partes dentro da moldura); inspeção visual |
| E-02 | Reações do mascote | Parcial | Surpresa no respin e orgulho na subida de nível. Carinho após derrota ficou de fora: a derrota não deve ser lida como quase-vitória. | Teste de animação (surprise, proud) |
| E-03 | Acabamento de toque | Não feito | Os botões já têm estado pressionado. Sem mudança nesta rodada. | — |
| E-04 | Resumo de sessão | Feito | "✨ Minha sessão" no menu: minutos, rodadas, rodadas com prêmio e itens novos. Na pausa obrigatória, o resumo mostra as rodadas da sessão. Sem "melhor rodada", sem taxa de acerto. | Teste unitário (não expõe bestWin nem winRate); teste de interface |
| E-05 | Menu em três grupos | Feito | Jogar (tabela, missões, temas), Progresso (sessão, coleção, histórico) e Mais (configurações, como jogar, sobre). | Teste de interface (três grupos) |
| E-06 | Dica da primeira rodada | Feito | Depois do tutorial: "Toque em GIRAR quando quiser. Você decide o ritmo." | Teste de interface |
| E-07 | Avaliação da sessão | Feito | Três respostas (😊 😐 🙁) na tela de sessão. Conta em `feel_*` só com opt-in das métricas (sem endpoint, nada sai do aparelho). | Teste de interface (agradecimento e seleção) |
| E-08 | Bônus diário sem punição | Feito | Faltar um dia não zera a sequência (folga). Sem folga, recomeça como antes. | Teste unitário das três situações; teste de interface (dia 3 mantido) |
| E-09 | Missões de descoberta | Feito | Duas novas no rodízio diário: usar o turbo e mudar a aposta. Contadores no save. | Teste unitário; teste de interface (contadores) |
| E-10 | Coleção com progresso | Feito | Itens bloqueados mostram X/Y (ex.: 37/100 giros). | Teste de interface (0/100) |
| E-11 | Compartilhamento sem pressão | Feito | Só quando a pessoa toca o botão. Sem recompensa por indicação e sem convite obrigatório. | Teste de download |
| E-12 | Medição sem tempo como meta | Feito | Métricas: satisfação (E-07) e conclusão de tarefas. Nenhuma métrica de tempo de tela. | Revisão do código e dos textos |
| E-13 | Auditoria de qualidade | Feito | Alvos de toque, contraste, nomes acessíveis, animações, DOM, tamanho e tradução. Achados corrigidos (ver abaixo). | Testes de qualidade e auditoria em `docs/` |

## Revisão de princípios (achado da auditoria)

- A derrota dizia "Quase! De novo!" e "A próxima é nossa!". O "quase" enquadra a derrota como quase-vitória. Troquei por falas neutras: "Tudo bem, faz parte do jogo.", "Você decide quando girar de novo." e "Sem pressa, o Caramelo espera.".
- Nenhum texto novo tem linguagem de urgência (verificado nos dicionários e no código novo).
- Nenhum efeito novo depende do resultado para parecer quase-ganho.

## Qualidade: antes e depois

| Medida | Antes | Depois |
|---|---|---|
| Checks unitários | 59 | 63 |
| Testes de interface passando | 107 (+1 pulado) | 127 (+1 pulado) |
| Lint | ok | ok |
| Linhas (JS, CSS, HTML) | 3.813 | 4.129 |
| Tamanho dos arquivos do jogo | 222 KB | 240 KB |
| Chaves de tradução (pt-BR e en) | 198 | 224 |
| Menor alvo de toque (retrato) | 42 px | 43 px |
| Botões abaixo de 44 px (retrato) | 6 de 7 | 4 de 7 |
| Botões abaixo de 24 px (mínimo WCAG 2.2 AA) | 0 | 0 |
| Menor alvo de toque (paisagem curta) | 34 px | 34 px |
| Animações em execução na tela de jogo (parado) | 14 | 14 |
| Nós do DOM na tela de jogo | 531 | 534 |

Contraste dos textos novos (pior caso medido sobre o fundo do cartão): de 7,5:1 a 15,8:1, contra 4,5:1 exigido.

## O que não é medido aqui

- **Satisfação real** depende de playtest com pessoas (Q3-13, bloqueado). Os números acima mostram qualidade técnica, não diversão.
- **Desempenho em aparelho** (FPS, bateria) depende de iPhone real (Q1-05, bloqueado). O carregamento medido no Chromium não representa o aparelho.
- **Alvos de toque na paisagem curta** ficam em 34 px. Atendem o mínimo de 24 px, mas não os 44 px recomendados; o espaço vertical é o limite.

## Decisões tomadas

- A folga do bônus diário vale para um dia só. Não existe folga acumulada.
- O resumo da sessão não é guardado no save: vale só enquanto a página estiver aberta.
- O cartão de vitória mostra só os acessórios desbloqueados e não mostra saldo nem histórico.
- A avaliação da sessão só vira métrica se a pessoa aceitar as métricas anônimas.

# TIGRINHO: plano de execução de 12 meses

Este documento organiza a execução do [roadmap](roadmap-ano.md). O roadmap define os itens e os critérios de aceite; aqui ficam a ordem, o que foi feito localmente e o que depende de algo externo. Atualizar a cada sprint.

## Regras de execução

1. Cada item local termina com: código, teste automatizado quando a regra for pura, atualização do `roadmap-ano.md` (estado e nota "Feito") e linha no `CHANGELOG.md`.
2. Nada é commitado nem publicado sem pedido explícito. O histórico de commits fica a cargo do dono do projeto.
3. Nenhum item "feito" sem verificação. Quando a verificação exige aparelho, o item fica parcial e a pendência é registrada.
4. Nenhum dado de playtest, aprovação jurídica ou medição de FPS é inventado. Esses itens ficam bloqueados até existir o dado real.
5. Premissas do roadmap valem até confirmação (monetização nenhuma, iOS primeiro, 8 h/semana, nome TIGRINHO).

## Situação por item

Legenda: **Feito** · **Parcial** (falta aparelho ou decisão) · **Bloqueado** (com a entrada que falta) · **Adiado** (opcional).

| Item | Situação | Observação / o que falta |
|---|---|---|
| Q1-01 a Q1-03, Q1-06 a Q1-13 | Feito | — |
| Q1-04 render Blender | Bloqueado | Mac com Blender. SVG adotado como arte principal. |
| Q1-05 FPS no iPhone | Bloqueado | iPhone real e Safari Web Inspector. Bloqueia Q2-06. |
| Q2-01, Q2-02, Q2-04, Q2-05, Q2-09 | Feito | — |
| Q2-03 poses do mascote | Parcial | Falta aprovação visual humana. |
| Q2-06 atlas WebP | Bloqueado | Depende de Q1-05 (sem gargalo medido, mantém SVG). |
| Q2-07 moldura final | Parcial | Falta revisão de arte humana e iPhone real. |
| Q2-08 ícone 1024 | Parcial | Variante 1024 pronta, sem transparência. Falta revisão em aparelho. |
| Q2-10 parallax | Parcial | Feito no Chromium. Falta validar o fluxo de permissão no iPhone real. |
| Q2-11 três temas e contraste | Feito | Jade e rodapé ajustados para WCAG AA. |
| Q3-01 tutorial | Feito | Limitação: Escape fecha sem marcar como visto. |
| Q3-02 dicas contextuais | Feito | Respin e faixas de prêmio. |
| Q3-03 missões diárias e semanais | Feito | Cosmético pelo item "Guizos dourados". |
| Q3-04 coleção de cosméticos | Feito | Splash sem acessórios; acessórios não acompanham a cabeça no giro. |
| Q3-05 conquistas (opcional) | Adiado | Opcional no roadmap; fora desta etapa. |
| Q3-06 durações por nível | Feito | Nível 3: 2,3 s; nível 5: 3,7 s. |
| Q3-07 trilha por nível | Feito | Camadas de sinos, tambor, cordas e brilho. |
| Q3-08 volumes independentes | Feito | Controles 0 a 10, salvos no save. |
| Q3-09 histórico de 50 rodadas | Feito | Sem comparação com a melhor rodada. |
| Q3-10 limite de sessão | Feito | Aviso 2 min antes; pausa de 10 min. |
| Q3-11 lembrete de pausa | Feito | Agora testado. |
| Q3-12 autoexclusão | Feito | Sem cancelamento; limite conhecido: limpeza do save pelo navegador. |
| Q3-13 playtest com 10 pessoas | Bloqueado | Pessoas reais e roteiro aplicado. |
| Q3-14 relatório de playtest | Bloqueado | Depende de Q3-13. |
| Q4-01 a Q4-03 jurídico | Bloqueado | Parecer de advogado. Bloqueia todo o Q4 publicável. |
| Q4-04 Capacitor iOS | Bloqueado | Mac com Xcode. |
| Q4-05 ícone, splash, PrivacyInfo | Parcial | Ícone 1024 e PrivacyInfo prontos. Falta splash e inclusão no Xcode. |
| Q4-06 haptics | Parcial | Adaptador pronto com as duas vias. Plugin depende de Q4-04. |
| Q4-07 e Q4-08 iPhone e TestFlight | Bloqueado | Aparelhos e conta Apple. |
| Q4-09 textos pt e en em `i18n/` | Feito | Textos em `jogo/i18n/`, escolha de idioma em Configurações. Mensagens de erro para desenvolvedor seguem em português. |
| Q4-10 analytics opt-in | Feito | Sem endpoint: nada sai do aparelho. |
| Q4-11 descrição e capturas | Parcial | Capturas 6,5" e 5,5" prontas. Falta classificação confirmada (jurídico). |
| Q4-12 textos sem promessa de ganho | Feito | Rascunho em `docs/loja/descricao.md`; revisar antes do envio. |
| Q4-13 PWA publicada | Bloqueado | Publicação pública só depois do gate jurídico e com domínio definido. |
| Q4-14 a Q4-16 beta e submissão | Bloqueado | TestFlight e aprovação da Apple. |

## Decisões

Tomadas nesta etapa, para não travar a execução. Podem ser revistas.

- **Missões (Q3-03):** as missões em faixas continuam; diárias e semanais entram ao lado.
- **Parallax (Q2-10):** desligado por padrão. A permissão de movimento é pedida só dentro do clique.
- **Métricas (Q4-10):** desligadas por padrão e sem endpoint até a decisão de publicação.
- **Duração da celebração (Q3-06):** medida como contagem mais pausa, até fechar sozinho.
- **Autoexclusão (Q3-12):** "Apagar progresso" não desfaz o prazo. A tela de bloqueio não tem botão de fechar.

## Decisões que o dono ainda precisa tomar

- **Linguagem de aposta:** o princípio 2 proíbe "linguagem de aposta", mas a interface ainda mostra "APOSTA" e "GIRAR". Não mudo sem decisão.
- **Classificação etária (Q4-11):** 18+ no rascunho, a confirmar com o parecer jurídico.
- **Endpoint de métricas (Q4-10):** só se houver backend e decisão de publicação.

## Riscos ativos

| Risco | Efeito | Mitigação |
|---|---|---|
| Parecer jurídico pendente | Q4 publicável travado | Nada público antes do parecer. |
| Sem iPhone e sem Mac | FPS, safe areas, permissão de movimento e haptics não validados em aparelho | Itens marcados como parciais; não declarar como concluídos. |
| Capacidade de 8 h/semana | Q3 e Q4 podem estourar | Itens opcionais ficam fora; ordem segue dependências. |
| Autoexclusão contornável pelo navegador | Quem limpa o `localStorage` libera o jogo | Limite conhecido, aceito pelo roadmap. |

## Log de execução

Itens concluídos nesta etapa, na ordem em que foram feitos. Verificação final: **56 checks unitários** e **98 testes Playwright** (49 por viewport), lint limpo.

1. Q2-08: variante 1024 sem transparência, no manifesto, com teste.
2. Q2-10: parallax com permissão no clique, desligado em redução de movimento.
3. Q2-11: contraste WCAG dos três temas. Ajustes no jade e no rodapé.
4. Q3-01 e Q3-02: tutorial de primeiro uso e dicas contextuais.
5. Q3-03 e Q3-04: missões diárias e semanais, e coleção de seis acessórios no mascote.
6. Q3-06: durações das celebrações por nível.
7. Q3-07 e Q3-08: camadas de instrumentos e volumes independentes.
8. Q3-09: histórico das últimas 50 rodadas.
9. Q3-10, Q3-11 e Q3-12: limite de sessão, lembrete e autoexclusão.
10. Q4-05 e Q4-06: PrivacyInfo e adaptador de háptica (parciais).
11. Q4-10: métricas anônimas com opt-in.
12. Q4-11 e Q4-12: textos e capturas da loja (parciais).

13. Q4-09: textos em `jogo/i18n/` (pt-BR e en), escolha de idioma em Configurações e teste de paridade de chaves.

Itens que ficaram de fora, com motivo: Q3-05 (opcional), Q3-13 e Q3-14 (exigem pessoas), Q4-01 a Q4-04 e Q4-07 a Q4-08 (exigem advogado, Mac e aparelhos), Q4-13 a Q4-16 (publicação e Apple).

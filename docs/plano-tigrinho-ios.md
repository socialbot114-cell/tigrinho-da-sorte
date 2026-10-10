# Plano de desenvolvimento — Tigrinho Online para iPhone

> Status: planejamento. Nenhuma implementação autorizada nesta etapa.
> Data: 3 de outubro de 2026.
> Nome de trabalho: Tigrinho Online.

## 1. Objetivo

Construir um jogo casual nativo para iPhone, com rolos, mascote original, fichas fictícias e progressão visual. Publicar na App Store após validar uma versão pequena, bonita e completa em aparelhos reais.

O diferencial será a qualidade do personagem, das animações, da experiência de uso e dos objetivos de progressão.

### Decisões confirmadas

- Plataforma: iPhone, com distribuição nativa pela App Store.
- Economia: dinheiro/fichas fictícias, sem valor monetário, conversão, depósito ou saque.
- Identidade: mascote, símbolos e arte originais.
- Etapa atual: documentar o plano; não escrever código agora.

### Propostas ainda sujeitas a confirmação

- Interface em retrato.
- Máquina de três colunas por três linhas e cinco linhas de combinação.
- Primeira versão individual, com progresso local.
- Sem anúncios e sem compras na primeira versão.
- Arte 2D ilustrada.
- Recursos sociais e sincronização em uma fase posterior.

## 2. Referências analisadas

### Pasta local

Local: `/home/richard/Documentos/play store/tigrinho`.

| Arquivo | Uso como referência |
| --- | --- |
| `images.jpeg` | Rolos, símbolos especiais e apresentação de recompensa |
| `Tigrinho.webp` | Mascote, composição dos rolos e ambientação |
| `Fortune-Tiger-ou-Jogo-do-Tigrinho.webp` | Atmosfera, cores e composição promocional |
| `epoca-jogo-tigrinho.avif` | Arquivo identificado; conteúdo visual não confirmado na análise |

A pasta contém quatro imagens, sem código, projeto iOS, regras documentadas ou assets separados para um jogo. As imagens orientam a atmosfera visual, mas não serão tratadas como assets autorizados para publicação.

### Repositório externo

Referência: https://github.com/justFiveDev/Casino-Game-Gallery

- O código visível inclui React, TypeScript, PixiJS e dependências de Laravel 10.
- Os arquivos examinados mostram principalmente um hub de jogos e componentes de interface.
- Não foi confirmado um motor completo de slot ou multiplayer correspondente às funcionalidades anunciadas no README.
- A árvore pública não contém a pasta `app/` referenciada pelo autoload do Composer, reforçando que a distribuição é incompleta.
- O README apresenta o material como prévia comercial e restringe redistribuição e uso comercial sem autorização.
- Não foi encontrado um arquivo `LICENSE` na árvore pública.

Conclusão: usar como referência conceitual, sem depender dessa distribuição para construir o aplicativo e sem copiar código ou assets sem autorização.

## 3. Conceito do produto

Um tigre carismático apresenta um jogo de rolos com desafios curtos. O jogador gira, completa combinações, recebe fichas fictícias e avança em missões que desbloqueiam itens visuais.

### Ciclo principal

Entrar → entender → girar → visualizar resultado → avançar em um objetivo → salvar progresso.

### Identidade visual

- Tigre com silhueta, roupa, expressões e personalidade próprias.
- Paleta proposta: dourado, vermelho e verde-jade, com contraste adequado.
- Símbolos originais ligados ao universo do personagem: frutas, amuletos, instrumentos e objetos festivos.
- Cenário desenhado para retrato, sem recortar simplesmente as referências horizontais.
- Reações para estados neutros, giro e recompensas de diferentes intensidades.

“Tigrinho Online” permanece como nome de trabalho. Verificar disponibilidade e possíveis conflitos de marca antes de fechar o nome público.

## 4. Escopo do MVP

| Área | Entrega proposta |
| --- | --- |
| Entrada | Abertura curta e tutorial interativo |
| Jogo | Uma máquina de 3 × 3 |
| Regras | Cinco linhas de combinação, tabela de recompensas e um símbolo especial |
| Controles | Girar, ajustar custo em fichas, consultar regras e configurações |
| Resultado | Destaque das combinações, contagem de recompensa e reação do mascote |
| Progressão | Pequeno conjunto de missões e desbloqueios cosméticos |
| Persistência | Fichas, progresso e preferências salvos localmente |
| Acessibilidade | Redução de movimento, controles de som/vibração e textos legíveis |
| Idioma | Português do Brasil |
| Distribuição | TestFlight e posterior submissão à App Store |

As regras são propostas para um jogo original, não uma reprodução confirmada das regras de Fortune Tiger.

### Fichas e continuidade

- Mostrar claramente que as fichas são fictícias e não possuem valor monetário.
- Não permitir depósito, PIX, saque, transferência monetária ou prêmios em dinheiro.
- Propor reposição gratuita de fichas, acessível no jogo.
- Evitar bloqueio permanente por falta de fichas.
- Não depender de pagamento, espera ou anúncio para o jogador continuar na versão inicial.
- Definir a quantidade inicial e as condições de reposição na especificação da economia.

### Fora do MVP proposto

- Multiplayer em tempo real.
- Backend próprio, conta obrigatória e saldo compartilhado.
- Loja, anúncios e compra de fichas.
- Várias máquinas, eventos remotos e torneios.
- Ranking baseado apenas em ganhos aleatórios.

## 5. Experiência de uso no iPhone

### Organização da tela

| Região | Conteúdo |
| --- | --- |
| Topo | Fichas, missão atual e configurações |
| Superior | Mascote e reações |
| Centro | Grade de rolos 3 × 3 |
| Abaixo dos rolos | Combinação e recompensa da rodada |
| Base | Custo em fichas, botão Girar e acesso às regras |

### Diretrizes

- Permitir interação confortável com uma mão.
- Botão principal grande, próximo ao polegar.
- Respeitar áreas seguras, Dynamic Island e indicador inferior.
- Dar resposta visual imediata aos toques.
- Comunicar o resultado mesmo com áudio desligado.
- Manter celebrações proporcionais à recompensa.
- Evitar pressão artificial para continuar jogando.
- Disponibilizar redução de movimento e controle de áudio/vibração.
- Garantir leitura e interação em iPhones de tamanhos diferentes.
- Mirar 60 fps nos aparelhos definidos para suporte e medir em dispositivo real.

## 6. Arquitetura proposta

| Componente | Tecnologia proposta | Finalidade |
| --- | --- | --- |
| Telas e navegação | SwiftUI | Interface nativa e configurações |
| Rolos e efeitos | SpriteKit | Sprites, animações e partículas 2D |
| Motor de regras | Módulo independente em Swift | Gerar e avaliar resultados sem depender da cena |
| Persistência | Camada local, tecnologia a definir | Salvar fichas, progresso e preferências |
| Serviços sociais futuros | Avaliar Game Center | Conquistas e recursos sociais compatíveis |
| Backend | Adiado até definir necessidade | Validar dados compartilhados quando necessário |

### Responsabilidades

1. A interface recebe a intenção do jogador.
2. O controlador valida se a rodada pode começar.
3. O motor determina o resultado e calcula a recompensa.
4. A persistência registra uma rodada recuperável e sua situação financeira fictícia.
5. A cena apresenta o resultado com animação, áudio e vibração.
6. A rodada é concluída uma única vez e a interface retorna ao estado pronto.

O motor determina o resultado; a animação apenas o apresenta. Quedas de frames e interrupções não podem alterar a recompensa.

### Estados da rodada

Pronto → Validando fichas → Resultado gerado → Animando → Recompensa aplicada → Pronto.

Cada rodada deverá ter identificação e liquidação única. Definir uma estratégia de persistência consistente para impedir débito/crédito duplicado e permitir recuperar a rodada após o aplicativo ser fechado.

### Limites da versão local

Progresso local é suficiente para uma experiência individual. Caso sejam adicionados rankings competitivos, saldo compartilhado ou eventos remotos, definir quais dados serão validados por servidor e como conflitos serão resolvidos.

Não assumir que integrar Game Center resolve automaticamente sincronização de todo o progresso.

## 7. Regras e economia

Antes da arte final, produzir uma especificação com:

- Lista de símbolos e probabilidades.
- Modelo de sorteio e composição dos rolos.
- Linhas válidas e direção de avaliação.
- Comportamento do símbolo especial.
- Tabela de recompensas e tratamento de combinações simultâneas.
- Valores permitidos de custo em fichas.
- Saldo inicial e reposição gratuita.
- Requisitos e recompensas das missões.
- Condições dos desbloqueios cosméticos.

### Simulações necessárias

- Frequência de resultados premiados.
- Distribuição das recompensas pequenas e grandes.
- Evolução média do saldo e casos extremos.
- Tempo estimado para completar missões.
- Possibilidade de ficar sem fichas e funcionamento da reposição.

Não definir probabilidades apenas por percepção visual. Manter parâmetros concentrados em dados configuráveis e regras documentadas, com resultados verificáveis.

## 8. Produção de assets

Preparar uma lista de entregáveis antes de encomendar ou criar a arte:

- Mascote original e conjunto inicial de expressões/poses.
- Símbolos separados com fundos transparentes.
- Moldura dos rolos e cenário em camadas.
- Botões e elementos de interface.
- Efeitos de recompensa.
- Sons de interface, giro e resultado; trilha opcional.
- Ícone e materiais de apresentação para a App Store.
- Registro de origem e licença dos materiais utilizados.

Recomendação inicial: 2D ilustrado bem acabado, com animação por partes, para reduzir custo e facilitar iteração. Confirmar esse estilo antes da produção final.

## 9. Marcos e critérios de conclusão

### Marco 1 — Especificação fechada

**Entregas:** regras, economia, mapa de telas, estilo visual e decisão sobre online.

**Critério:** todas as ações do jogador e estados da rodada documentados, sem decisões essenciais transferidas para a implementação.

### Marco 2 — Protótipo jogável

**Entregas futuras:** projeto iOS, arte provisória, grade, giro, avaliação das combinações e fichas.

**Critério:** jogar várias rodadas, fechar e reabrir o app sem saldo inconsistente nem rodada cobrada duas vezes.

### Marco 3 — Versão visual completa

**Entregas:** mascote, símbolos, cenário, animações, áudio, tutorial e telas finais.

**Critério:** ciclo completo, interface legível e utilizável em iPhones pequenos e grandes.

### Marco 4 — Progressão e acabamento

**Entregas:** missões, cosméticos, reposição de fichas e acessibilidade.

**Critério:** objetivos além de girar, continuidade gratuita e preferências respeitadas durante todo o jogo.

### Marco 5 — TestFlight

**Entregas:** build de testes e correções de problemas observados em aparelhos reais.

**Critério:** regras, persistência, interrupções, desempenho e primeira experiência validados.

### Marco 6 — App Store

**Entregas:** ícone, screenshots, descrição, informações de privacidade, classificação etária e build de submissão.

**Critério:** aplicativo e materiais prontos para revisão. A aprovação e o prazo de revisão dependem da Apple.

Não definir prazo fechado antes de confirmar acesso ao ambiente iOS, escopo online, regras e produção de arte.

## 10. Verificações essenciais

- Combinações e cálculo correto de recompensas.
- Débito e crédito exatamente uma vez por rodada.
- Toques repetidos durante giro ou celebração.
- Saldo insuficiente e reposição gratuita.
- Encerramento do app em cada estado da rodada.
- Recuperação de progresso e preferências.
- Retorno após bloqueio de tela ou interrupção de áudio.
- Layout em tamanhos de tela diferentes.
- Redução de movimento e uso sem som.
- Desempenho e consumo de recursos em aparelhos reais.

Priorizar testes automatizados para regras e consistência de estado; usar testes em dispositivo para interface, áudio e desempenho.

## 11. Ambiente e publicação

- O ambiente atual é Linux.
- Compilação nativa, simulador iOS, assinatura e envio exigem acesso a macOS com Xcode.
- Testes finais exigem iPhone físico.
- TestFlight e App Store exigem participação no Apple Developer Program.
- Definir versão mínima do iOS e aparelhos suportados antes de escolher detalhes de persistência e APIs.
- Verificar requisitos vigentes da App Store, classificação e privacidade quando o produto estiver especificado.

Este plano descreve um jogo com fichas fictícias; não depende de uma interpretação de que todas as modalidades de aposta sejam proibidas no Brasil.

## 12. Evolução online

O significado de “online” permanece pendente. A App Store distribui o aplicativo, mas isso não transforma uma experiência local em jogo conectado.

Ordem proposta, caso recursos conectados sejam desejados:

1. Conquistas e identidade social via serviços compatíveis.
2. Sincronização de progresso entre aparelhos, com resolução de conflitos.
3. Desafios sociais com critérios claros.
4. Eventos e conteúdo remoto, com versionamento das regras.
5. Multiplayer somente se surgir uma mecânica que justifique a infraestrutura.

Para ranking, preferir métricas de desafios e progressão adequadas ao jogo, em vez de premiar apenas sorte ou volume ilimitado de giros.

## 13. Decisões pendentes

- [ ] Definir o que “online” significa na primeira versão.
- [ ] Confirmar versão inicial sem anúncios e sem compras.
- [ ] Confirmar acesso a Mac, Xcode, iPhone e conta Apple Developer.
- [ ] Escolher estilo 2D ilustrado ou aparência 3D pré-renderizada.
- [ ] Confirmar grade 3 × 3, linhas e símbolo especial.
- [ ] Aprovar regras, probabilidades, recompensas e reposição de fichas.
- [ ] Definir missões e primeiro conjunto de cosméticos.
- [ ] Definir versão mínima do iOS e dispositivos de referência.
- [ ] Verificar nome público e fechar identidade visual.

## 14. Próximo passo quando a implementação for autorizada

Fechar as decisões do Marco 1 e construir um protótipo nativo em retrato, com uma máquina funcional, fichas fictícias, regras verificadas e progresso salvo.

Validar esse protótipo antes de investir na produção completa de arte e em serviços online. Até nova autorização, manter o trabalho restrito ao planejamento.

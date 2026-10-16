# Changelog

Formato simples por versão. Datas em ISO. Fichas são fictícias, sem valor em dinheiro.

## 2.2.2 — 2026-10-13 (em desenvolvimento)
- `game.js` virou entry point fino; criados `progression.js`, `game-ui.js`, `game-menus.js` e `game-round-controller.js`.
- Configuração única para lista de apostas e bônus diário; save valida limites de valores antes de aceitar estado persistido.
- Giro liquida e salva antes da animação; `try/finally` libera controles em falhas; animações interrompidas deixam a grade no resultado sorteado.
- Sequência diária mantém o teto de 7 dias também no save; configs compartilhadas removem cópias de apostas, bônus e tempos de apresentação.
- Celebração grande sem executor async dentro de Promise; timers são limpos e o pulo conclui a contagem.
- Modais têm semântica de diálogo, foco inicial/trap, Escape e restauração de foco.
- Efeitos de canvas pausam quando a aba fica oculta.
- Teste de interrupção simula falha de animação e confirma save/recuperação; testes verificam foco/teclado dos modais e pausa/resume de partículas.
- Tempos de rolos, hitstop, auto, progressão, contagem, sessão e celebração centralizados em `config.js`.
- Consolida esteira de spin em três etapas (aceleração/cruzeiro/parada), cancela animações no cancelamento e mantém Wild travado estável durante respin.
- Vitória com múltiplas linhas é apresentada em sequência, com botão Pular explícito.
- Controles trocam caracteres/emoji por ícones SVG locais; HUD de saldo e faixa de prêmio ganharam hierarquia visual.
- Cenário em três camadas (Q2-09): fundo com raios e vinheta, pórtico com arco e lanternas, primeiro plano com brilho dourado e bokeh; todas decorativas, sem captar toque e abaixo do palco e dos controles.
- Ícone 1024 para a loja (Q2-08): `jogo/icon-1024.png` quadrado, RGB, sem transparência e sem cantos arredondados; entra no manifesto PWA. Teste verifica tamanho, ausência de alfa e presença no manifesto.
- Parallax com inclinação (Q2-10): `jogo/parallax.js`, opção "Profundidade ao inclinar" no menu (desligada por padrão). Permissão de movimento pedida só dentro do clique; negada ou com redução de movimento, fica desligada e avisa. Preferência `set.tilt` no save v2.
- Contraste dos temas (Q2-11): jade com fundo mais escuro (`#0a442f`) e rodapé legal a 70% de opacidade, para atingir WCAG AA (4,5:1 em texto pequeno) nos três temas. Teste de contraste lê as cores do DOM em cada tema.
- Tutorial de primeiro uso (Q3-01): quatro passos em modal, com "Pular" em todos; só lê o estado (saldo, aposta e giros não mudam). Reabrível em Menu > Como jogar.
- Dicas contextuais (Q3-02): respin e faixas de prêmio aparecem uma vez cada; registradas em `seen.tips` do save v2.
- Missões de rodízio (Q3-03): três diárias (renovam à meia-noite local) e três semanais (renovam na segunda), escolhidas pela data; resgate paga uma vez. Estado em `rot` do save v2. Resgatar as três semanais dá o item "Guizos dourados".
- Coleção do mascote (Q3-04): seis acessórios em SVG próprio (laço, flor, guizos, óculos, estrela e lanterna), desbloqueados por marcos e guardados em `cos` do save. Tela "🎀 Coleção" no menu.
- Duração das celebrações (Q3-06): contagem e pausa por nível. Nível 3 fecha em 2,3 s e nível 5 em 3,7 s (antes, 4,1 s e 5,7 s). Teste de unidade trava as metas.
- Camadas de instrumentos por prêmio (Q3-07): sinos, tambor, cordas e brilho agudo entram conforme o nível do prêmio, sobre a base da música.
- Volumes independentes (Q3-08): música e efeitos com controle de 0 a 10 em Configurações, salvos em `set.musicVol` e `set.sfxVol`.
- Histórico local (Q3-09): últimas 50 rodadas com data, aposta e total, em "🧾 Histórico" no menu. Guardado em `hist` do save v2.
- Bem-estar (Q3-10 a Q3-12): limite de sessão opcional (15, 30 ou 60 min) com aviso e pausa de 10 min; lembrete a cada 30 min agora testado; autoexclusão de 24 h, 7 dias ou 30 dias, sem cancelamento, com tela de bloqueio que recusa giros. Estado em `wb` do save v2; regras em `wellbeing.js`.
- Háptica (Q4-06, parcial): `haptics.js` escolhe plugin do Capacitor, `navigator.vibrate` ou nenhuma via. O plugin depende do Q4-04.
- Métricas anônimas (Q4-10): `analytics.js` com opt-in, desligadas por padrão, sem identificador e sem envio sem endpoint. Teste de rede confere que nenhuma requisição sai do servidor local.
- PrivacyInfo (Q4-05, parcial): rascunho em `docs/ios/PrivacyInfo.xcprivacy` declarando que não há rastreamento nem coleta.
- Loja (Q4-11 e Q4-12, parcial): textos em `docs/loja/descricao.md` (fichas fictícias, sem promessa de ganho) e capturas 6,5" e 5,5" em `docs/loja/capturas/`.
- Idioma (Q4-09): interface em português (padrão) e inglês, escolhida em Configurações e salva em `set.lang`. Textos em `jogo/i18n/`. Teste confere paridade e uso das chaves.
- Polimento de rolos e vitória (etapa 1): parada com desaceleração e quique de 6% da célula (antes, o rolo parava com velocidade constante); símbolos da linha pulam em sequência; a linha se desenha e um brilho percorre por cima; o terceiro rolo treme na antecipação.
- Polimento do mascote e da paisagem: acessórios da cabeça giram com a cabeça; tela inicial mostra a coleção; no celular deitado, o AUTO vira pílula e deixa de encostar no turbo.
- Moeda autoral: o símbolo de fichas ganha medalhão vermelho com o 福, borda serrilhada e reflexo; as moedas que caem usam o mesmo miolo. Moldura com reflexo metálico diagonal e faixa do título com brilho de esmalte.
- Estética da máquina: halo dourado que respira atrás dos rolos (só opacidade e escala; para com redução de movimento); ao mostrar uma vitória, o palco fica mais dourado e o painel de ganho acende até o próximo giro. Sem prazo e sem contagem regressiva.
- Estética da grande vitória e do GIRAR: título em Bangers sobre uma placa vermelha de luz, que separa o texto dos raios; valor com brilho dourado; botão GIRAR com reflexo de esmalte no topo e anel interno, sem mudar a cor nem o tamanho do botão. Testes conferem a fonte, a placa e o reflexo.
- Correção: a dica contextual não substitui mais um aviso que o jogador acabou de disparar; ela espera o aviso sair da tela. A dica continua marcada como vista, então não repete.
- Moldura (Q2-07, parcial): lâmpadas correm pelos lados e pela base do aro (antes, só nos cantos); tracejado trocado por um sulco fino em volta da janela dos rolos; espessura do aro acompanha a orientação. Linha de base visual da máquina atualizada.
- Acessibilidade: a barra de nível é um `progressbar` com rótulo traduzido e valor atual (leitores de tela anunciam o progresso); teste confere papel, rótulo e valor contra a largura visível.
- Splash do iOS (Q4-05, parcial): arte 2732×2732 RGB em `docs/ios/splash/Splash-2732.png`, só com logo e mascote, sem botão; teste de formato. Falta incluir no projeto Xcode (Q4-04).
- Mascote voltou a ter tamanho legível na tela de jogo: a linha do mascote tinha sido espremida pelo aumento da máquina e ficou com 63 px de altura (antes, 127 px na base). Agora tem 101 px e avança sobre a borda superior do aro, sem mudar os rolos. Teste com piso de 90 px no retrato.
- Layout estável entre máquinas: cabeçalho com 60 px e rodapé legal com 36 px fixos. Antes, a altura dependia da fonte do sistema e podia deslocar o palco em meio pixel, e o teste visual da máquina falhou no runner do GitHub (360 px contra 359 px). O teste visual agora compara um recorte em pixels inteiros.
- Experiência (plano em `docs/plano-experiencia.md`): cartão de vitória para compartilhar (PNG com o Caramelo, sem valor em dinheiro); resumo de sessão ("Minha sessão") com avaliação 😊 😐 🙁; menu em três grupos; dica após o tutorial; reações do mascote (surpresa no respin, orgulho ao subir de nível).
- Rotinas: bônus diário com folga de um dia (a sequência não zera); missões de descoberta (usar o turbo, mudar a aposta); coleção mostra progresso (X/Y); pausa obrigatória mostra as rodadas da sessão.
- Revisão de princípios: derrota sem enquadramento de quase-vitória ("Quase!" saiu das falas).
- Qualidade: 64 checks unitários e 142 testes de interface passando (2 pulados: o teste de AUTO só roda em paisagem e o de tamanho do mascote só em retrato); testes de alvo de toque (24 px) e de nome acessível em todo botão visível.
- Redesenho do Caramelo: orelhas com volume e sombra interna, cabeça com brilho e focinho com reflexo, corpo em pera com barriga, colete com costura, patas sem marcas de rosto, cauda com ponta de pelo, sino liso na coleira (um só medalhão com 福) e piscar suave. O mesmo corpo vale para o mascote do jogo e para os modais; a cauda foi recuada para não ser cortada pelo balanço.
- Cabeçalho decorativo da moldura e ícone vetorial local + PNG 512 para PWA; ligados ao manifesto, favicon e apple-touch.
- Prints da moldura/HUD em retrato e paisagem, linhas vencedoras sequenciais e ícone PWA em `docs/prints/03`, `05–06`, `11` e `13`.
- Prints atualizados: máquina, mega vitória e paisagem; adicionados prints de linhas sequenciais e HUD/ícones em `docs/prints/11–12`.
- Verificação: ESLint; 34 checks de motor (RTP 1M) e 66 testes Playwright (33 por viewport retrato/paisagem).

## 2.2.1 — 2026-10-10 (em desenvolvimento)
- Pipeline do Caramelo documentado: SVG original como arte principal; Blender opcional para renders após validação em Mac/iPhone.
- Componentes reutilizáveis da cabeça separados (orelhas esquerda/direita, face, coleira) e disponíveis como elementos animáveis na tela.
- Poses de giro, vitória e grande vitória aplicadas em partes do mascote; testes verificam as animações CSS.
- Sete materiais distintos em SVG; estados vencedores tonalizados por material e Caramelo WILD travado com moldura dourada.
- Atlas visual de 7 símbolos e estados em `docs/prints/10-simbolos-estados.png`.
- Prints de giro, vitória e grande vitória em `docs/prints/07–09`.
- Verificação atual: 29 checks unitários e 23 testes Playwright por perfil (retrato/paisagem).

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

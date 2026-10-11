# Decisão de pipeline do mascote

Data: 2026-10-10
Estado: adotado para o MVP; pode ser revisto depois do teste em iPhone real.

## Decisão

Usar **SVG original e local como arte principal do jogo**. Manter Blender como ferramenta opcional para produzir renderizações PNG de apresentação ou para substituir partes específicas se um teste comparativo justificar a troca.

## Motivos

- O jogo funciona offline e não depende de carregamento de rede.
- SVG mantém nitidez em diferentes tamanhos e permite animar peças com CSS.
- O mascote atual e os símbolos já são desenhos próprios embutidos no HTML.
- O Blender não está instalado no ambiente Linux; o script `blender/cachorro.py` ainda precisa ser renderizado e validado em Mac.
- PNG só deve entrar na tela principal após comparação visual e medição de desempenho em aparelho real.

## Critérios para reconsiderar

1. Renderizar as quatro poses do Blender em fundo transparente.
2. Comparar os renders e o SVG no layout de 390×844 e em iPhone real.
3. Confirmar legibilidade, peso total dos arquivos, tempo de carregamento offline e estabilidade visual.
4. Aprovar a mudança em revisão; manter fallback SVG até os testes passarem.

## Partes do SVG

O mascote de jogo é composto por cabeça, orelhas esquerda/direita, coleira, tronco/colete, braços e cauda. As peças reutilizáveis da cabeça também formam o símbolo Caramelo WILD.

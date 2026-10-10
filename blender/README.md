# Cachorro caramelo no Blender

Mascote do TIGRINHO, modelado proceduralmente em `cachorro.py`.

## Como gerar (Mac com Blender 3.6+ ou 4.x)

```bash
./blender/render.sh
# ou direto:
blender --background --python blender/cachorro.py -- --out renders
```

Saídas em `renders/`:

- `cachorro-idle.png`, `cachorro-girando.png`, `cachorro-vitoria.png`, `cachorro-grande-vitoria.png` (PNG transparente, 1024px)
- `cachorro.glb` (referência)

> O script não foi executado no ambiente Linux de desenvolvimento, pois o Blender não estava instalado. O jogo usa o SVG `#s-mascot` como arte definitiva até os PNGs serem gerados e validados.

## Pipeline até o jogo

1. Ajustar o modelo em `cachorro.py` (proporções, cores, poses).
2. Renderizar, otimizar (`oxipng` ou WebP) e colocar em `jogo/assets/`.
3. Registrar em `jogo/assets.json`.
4. Trocar o SVG pelo PNG só depois de comparar na tela de 390×844.

## Convenções

- Unidade: metros; cachorro ~2.6 m de altura na cena.
- Origem no chão, frente = -Y (câmera olha de frente).
- Nomes em PT com `.L/.R` para espelho.

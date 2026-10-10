# Tigre no Blender

O mascote final do jogo será modelado no **Blender** (este repo ainda não tem Blender instalado no Linux — rode no Mac).

## Como gerar

```bash
./blender/render.sh
# ou direto:
blender --background --python blender/tigre.py -- --out renders
```

Saídas em `renders/`: `tigre-idle.png`, `tigre-rosto.png`, `tigre.glb`.

## Direção de arte (resumo)

- Tigre cartoon, pelo `#F28A16`, focinho/barriga creme, colete vermelho festival + medalhão dourado.
- Listras poucas e simétricas (3 na testa, 2 em cada bochecha).
- Olhos grandes com brilho branco, blush rosa, nariz rosa.
- Silhueta legível em 96px (ícone) e 1024px (splash).
- Poses a modelar depois do idle: `giro` (balanço), `cheer` (pulo + braço erguido), `big` (rugido).

## Pipeline até o jogo

1. Modelar/ajustar no Blender com o script como base (`blender/tigre.py`).
2. Renderizar PNG com fundo transparente.
3. Otimizar (`pngquant`/`oxipng`) e colocar em `jogo/assets/` com entrada em `jogo/assets.json`.
4. Manter o SVG atual como fallback offline até o PNG final entrar.

## Convenções

- Unidade: metros; tigre ~2.6m de altura total na cena.
- Origem no chão (patas em z≈0), frente = +Y.
- Nomes em PT com `.L/.R` para espelho.

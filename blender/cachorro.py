#!/usr/bin/env python3
"""Cachorro caramelo do TIGRINHO — modelo procedural para Blender 3.6+/4.x.

Uso (no Mac, com Blender instalado):
    blender --background --python blender/cachorro.py -- --out renders

Gera, em renders/ (PNG com fundo transparente, 1024px):
    cachorro-idle.png          pose de repouso
    cachorro-girando.png       braço apoiado, cauda em movimento
    cachorro-vitoria.png       braço direito erguido com envelope
    cachorro-grande-vitoria.png  pulo com braços abertos
    cachorro.glb               export para referência

Direção de arte:
- pelo caramelo (#C46F2E), focinho creme, orelhas caídas mais escuras;
- colete vermelho festival com medalhão dourado e coleira;
- olhos grandes com brilho, bochechas rosadas, nariz preto.

Este script NÃO foi executado no ambiente de desenvolvimento Linux (sem Blender).
Os símbolos do jogo usam o SVG `#s-mascot` de jogo/index.html até os PNGs serem renderizados.
"""
import argparse
import math
import os
import sys

try:
    import bpy
except ImportError:
    print("Rode dentro do Blender: blender --background --python blender/cachorro.py")
    sys.exit(1)


def mat(name, base, metallic=0.0, roughness=0.6):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*base, 1.0)
    b.inputs["Metallic"].default_value = metallic
    b.inputs["Roughness"].default_value = roughness
    return m


FUR = mat("Caramelo", (0.77, 0.44, 0.18))
EAR = mat("OrelhaEscura", (0.37, 0.17, 0.05))
CREAM = mat("Focinho", (0.97, 0.90, 0.77))
VEST = mat("Colete", (0.72, 0.06, 0.09))
GOLD = mat("Ouro", (1.0, 0.78, 0.22), metallic=0.7, roughness=0.35)
BLACK = mat("Preto", (0.05, 0.03, 0.02), roughness=0.25)
PINK = mat("Bochecha", (1.0, 0.48, 0.54))


def add(kind, loc, scale=(1, 1, 1), rot=(0, 0, 0), material=None, name=None):
    if kind == "sphere":
        bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, location=loc)
    elif kind == "cylinder":
        bpy.ops.mesh.primitive_cylinder_add(vertices=24, location=loc)
    else:
        raise ValueError(kind)
    o = bpy.context.active_object
    o.scale = scale
    o.rotation_euler = rot
    if material:
        o.data.materials.append(material)
    if name:
        o.name = name
    return o


def clear():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def build():
    clear()
    parts = {}
    # corpo sentado
    add("sphere", (0, 0, 1.0), (0.9, 0.75, 1.0), material=FUR, name="corpo")
    add("sphere", (0, -0.45, 1.0), (0.55, 0.4, 0.7), material=CREAM, name="peito")
    # colete vermelho
    add("sphere", (0, -0.55, 1.05), (0.82, 0.5, 0.82), material=VEST, name="colete")
    add("sphere", (0, -0.98, 1.1), (0.14, 0.05, 0.14), material=GOLD, name="medalhao")
    # patas dianteiras
    for x, n in ((-0.38, "pata.L"), (0.38, "pata.R")):
        add("sphere", (x, -0.62, 0.12), (0.22, 0.2, 0.14), material=FUR, name=n)
    # braços (pivôs para as poses)
    parts["braco.L"] = add("sphere", (-0.7, -0.2, 1.05), (0.16, 0.16, 0.42), rot=(0.3, 0, 0.3), material=FUR, name="braco.L")
    parts["braco.R"] = add("sphere", (0.7, -0.2, 1.05), (0.16, 0.16, 0.42), rot=(0.3, 0, -0.3), material=FUR, name="braco.R")
    # cauda
    parts["cauda"] = add("cylinder", (0.8, 0.5, 1.2), (0.08, 0.08, 0.4), rot=(0.9, 0, -0.6), material=FUR, name="cauda")
    # cabeça
    head = (0, -0.1, 2.25)
    add("sphere", head, (0.82, 0.78, 0.76), material=FUR, name="cabeca")
    for x, n in ((-0.58, "orelha.L"), (0.58, "orelha.R")):
        add("sphere", (x, -0.05, 2.3), (0.26, 0.14, 0.5), rot=(0, 0.2 * (1 if x > 0 else -1), 0), material=EAR, name=n)
    add("sphere", (0, -0.62, 2.12), (0.46, 0.32, 0.36), material=CREAM, name="focinho")
    add("sphere", (0, -0.9, 2.26), (0.1, 0.07, 0.07), material=BLACK, name="nariz")
    for x, n in ((-0.3, "olho.L"), (0.3, "olho.R")):
        add("sphere", (x, -0.72, 2.36), (0.1, 0.06, 0.12), material=BLACK, name=n)
        add("sphere", (x + 0.03, -0.77, 2.4), (0.025, 0.02, 0.025), material=GOLD, name=n + ".brilho")
    for x, n in ((-0.5, "bochecha.L"), (0.5, "bochecha.R")):
        add("sphere", (x, -0.7, 2.14), (0.1, 0.03, 0.08), material=PINK, name=n)
    return parts


def lights_camera():
    bpy.ops.object.light_add(type="SUN", location=(3, -4, 6))
    bpy.context.active_object.data.energy = 3.5
    bpy.ops.object.light_add(type="AREA", location=(-3, -3, 3))
    bpy.context.active_object.data.energy = 300
    bpy.ops.object.camera_add(location=(0, -7.5, 2.4), rotation=(math.radians(84), 0, 0))
    cam = bpy.context.active_object
    bpy.context.scene.camera = cam
    return cam


def render(out_dir, name, res=1024):
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE"
    sc.render.resolution_x = res
    sc.render.resolution_y = res
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.render.filepath = os.path.join(out_dir, name)
    bpy.ops.render.render(write_still=True)


POSES = {
    "idle": {},
    "girando": {"braco.R": (-0.6, 0, -0.3), "cauda": (0.6, 0, -0.9)},
    "vitoria": {"braco.R": (2.6, 0, -0.2)},
    "grande-vitoria": {"braco.L": (2.6, 0, 0.2), "braco.R": (2.6, 0, -0.2)},
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="renders")
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    args, _ = ap.parse_known_args(argv)
    os.makedirs(args.out, exist_ok=True)
    for pose, rots in POSES.items():
        parts = build()
        for name, rot in rots.items():
            if name in parts:
                parts[name].rotation_euler = rot
        lights_camera()
        render(args.out, f"cachorro-{pose}.png")
    bpy.ops.export_scene.gltf(filepath=os.path.join(args.out, "cachorro.glb"))
    print("OK:", args.out)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Tigre do Tigrinho da Sorte — modelo procedural para Blender 3.6+/4.x.

Uso (com Blender instalado, ex. no Mac com Xcode):
    blender --background --python blender/tigre.py -- --out renders
    ./blender/render.sh

Gera:
    renders/tigre-idle.png   (corpo inteiro, fundo transparente, 1024px)
    renders/tigre-rosto.png  (close do rosto p/ símbolo WILD)
    renders/tigre.glb        (export p/ referência)

Direção de arte (ver docs/tigre-blender.md):
- tigre cartoon carismático, pelo laranja #F28A16, focinho creme, colete
  vermelho festival com dourado, chapéu mini-lanterna.
- Listras simples e simétricas; olhos grandes com brilho; bochechas rosadas.
"""
import argparse
import math
import os
import sys

try:
    import bpy
except ImportError:
    print(" rode dentro do Blender: blender --background --python blender/tigre.py")
    sys.exit(1)


# ---------------- materiais ----------------

def mat(name, base, metallic=0.0, roughness=0.6, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*base, alpha)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if alpha < 1.0:
        m.blend_method = "BLEND"
    return m


FUR = mat("Fur", (0.95, 0.52, 0.10))
CREAM = mat("Cream", (1.0, 0.95, 0.86))
DARK = mat("Stripe", (0.23, 0.08, 0.02))
RED = mat("Vest", (0.78, 0.06, 0.12))
GOLD = mat("Gold", (1.0, 0.78, 0.22), metallic=0.7, roughness=0.35)
PINK = mat("Blush", (1.0, 0.48, 0.54))
BLACK = mat("Eye", (0.05, 0.03, 0.02), roughness=0.25)
WHITE = mat("Shine", (1.0, 1.0, 1.0), roughness=0.2)


def prim(kind, name, loc, scale=(1, 1, 1), material=None, rot=(0, 0, 0)):
    if kind == "sphere":
        bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, location=loc)
    elif kind == "cube":
        bpy.ops.mesh.primitive_cube_add(location=loc)
    elif kind == "cylinder":
        bpy.ops.mesh.primitive_cylinder_add(location=loc)
    elif kind == "cone":
        bpy.ops.mesh.primitive_cone_add(location=loc)
    elif kind == "torus":
        bpy.ops.mesh.primitive_torus_add(location=loc)
    else:
        raise ValueError(kind)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    o.rotation_euler = rot
    if material:
        o.data.materials.append(material)
    bpy.ops.object.shade_smooth()
    return o


def mirror_x(obj, name):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.duplicate()
    dup = bpy.context.active_object
    dup.name = name
    dup.location.x *= -1
    dup.scale.x *= -1
    return dup


# ---------------- cena ----------------

def clear():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for coll in (bpy.data.meshes, bpy.data.materials):
        for x in list(coll):
            if x.users == 0 and x.name not in ("Dots Stroke",):
                pass  # mantém simples; não remove os nossos


def build_tiger():
    root = bpy.data.objects.new("Tigre", None)
    bpy.context.collection.objects.link(root)

    body = prim("sphere", "Corpo", (0, 0, 1.0), (1.05, 0.85, 1.15), FUR)
    belly = prim("sphere", "Barriga", (0, 0.55, 0.95), (0.62, 0.35, 0.78), CREAM)
    head = prim("sphere", "Cabeca", (0, 0, 2.55), (1.0, 0.9, 0.92), FUR)
    muzzle = prim("sphere", "Focinho", (0, 0.62, 2.35), (0.5, 0.32, 0.38), CREAM)

    ear_l = prim("sphere", "Orelha.L", (0.62, 0, 3.25), (0.28, 0.18, 0.3), FUR)
    ear_in = prim("sphere", "OrelhaIn.L", (0.60, 0.08, 3.24), (0.14, 0.09, 0.15), PINK)
    mirror_x(ear_l, "Orelha.R")
    mirror_x(ear_in, "OrelhaIn.R")

    # listras da testa + bochechas (achatadas, simétricas)
    stripes = [
        ((0, 0.55, 3.25), (0.10, 0.28, 0.22)),
        ((-0.30, 0.48, 3.18), (0.08, 0.24, 0.18)),
        ((0.30, 0.48, 3.18), (0.08, 0.24, 0.18)),
        ((-0.85, 0.25, 2.45), (0.28, 0.10, 0.12)),
        ((0.85, 0.25, 2.45), (0.28, 0.10, 0.12)),
    ]
    for i, (loc, sc) in enumerate(stripes):
        prim("cube", f"Listra.{i:02d}", loc, sc, DARK, rot=(0.2, 0, 0.15 * (1 if loc[0] >= 0 else -1)))

    # olhos + brilho
    eye_l = prim("sphere", "Olho.L", (-0.36, 0.72, 2.72), (0.16, 0.10, 0.18), BLACK)
    shine_l = prim("sphere", "Brilho.L", (-0.32, 0.80, 2.78), (0.045, 0.03, 0.045), WHITE)
    mirror_x(eye_l, "Olho.R")
    mirror_x(shine_l, "Brilho.R")

    # focinho: nariz + boca
    prim("cone", "Nariz", (0, 0.86, 2.42), (0.12, 0.12, 0.10), PINK, rot=(math.pi / 2, 0, 0))
    blush_l = prim("sphere", "Blush.L", (-0.55, 0.55, 2.30), (0.14, 0.08, 0.10), PINK)
    mirror_x(blush_l, "Blush.R")

    # colete festival + medalhão
    vest = prim("torus", "Colete", (0, 0, 1.35), (1, 1, 1), RED)
    vest.scale = (0.95, 0.80, 0.55)
    medal = prim("cylinder", "Medalhao", (0, 0.78, 1.45), (0.22, 0.22, 0.06), GOLD)
    medal.rotation_euler = (math.pi / 2, 0, 0)

    # patas e rabo
    prim("sphere", "Pata.L", (-0.55, 0, 0.15), (0.32, 0.42, 0.22), FUR)
    pata_r = prim("sphere", "Pata.R", (0.55, 0, 0.15), (0.32, 0.42, 0.22), FUR)
    tail = prim("cylinder", "Rabo", (0.95, -0.55, 1.1), (0.14, 0.14, 0.9), FUR)
    tail.rotation_euler = (0.5, 0, -0.5)

    for o in bpy.context.scene.objects:
        if o.name.startswith(("Corpo", "Cabeca", "Pata", "Orelha", "Olho", "Focinho", "Colete", "Rabo", "Barriga", "Listra", "Nariz", "Blush", "Brilho", "Medalhao", "OrelhaIn")):
            o.parent = root
    return root


def lights_camera():
    bpy.ops.object.light_add(type="SUN", location=(4, -4, 8))
    sun = bpy.context.active_object
    sun.data.energy = 4.0
    bpy.ops.object.light_add(type="SUN", location=(-5, -2, 4))
    fill = bpy.context.active_object
    fill.data.energy = 1.2
    bpy.ops.object.camera_add(location=(0, -7.5, 2.6))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.pi / 2 - 0.32, 0, 0)
    bpy.context.scene.camera = cam
    return cam


def render_setup(out_dir, name="tigre-idle.png", res=1024):
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE"
    sc.render.resolution_x = res
    sc.render.resolution_y = res
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.render.filepath = os.path.join(out_dir, name)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="renders")
    args, _ = ap.parse_known_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else ([], []))
    if isinstance(args, list):
        out = "renders"
    else:
        out = args.out
    os.makedirs(out, exist_ok=True)

    clear()
    build_tiger()
    cam = lights_camera()

    render_setup(out, "tigre-idle.png")
    bpy.ops.render.render(write_still=True)

    # close do rosto p/ símbolo WILD
    cam.location = (0, -3.4, 2.7)
    cam.rotation_euler = (math.pi / 2 - 0.12, 0, 0)
    render_setup(out, "tigre-rosto.png")
    bpy.ops.render.render(write_still=True)

    glb = os.path.join(out, "tigre.glb")
    bpy.ops.export_scene.gltf(filepath=glb, export_format="GLB", use_selection=False)
    print("OK:", out)


if __name__ == "__main__":
    main()

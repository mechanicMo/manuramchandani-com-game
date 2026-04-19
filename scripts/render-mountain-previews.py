"""
Render preview images of mountain.glb from multiple angles.
Run with: blender -b -P render-mountain-previews.py
"""
import bpy
import os
import math
import sys

SCRIPT_DIR = "/Users/mohitramchandani/Code/web/manuramchandani-com/scripts"
GLB_PATH = os.path.join(SCRIPT_DIR, "mountain.glb")
OUT_DIR = os.path.join(SCRIPT_DIR, "previews")
os.makedirs(OUT_DIR, exist_ok=True)

# === Clear scene ===
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for block in list(bpy.data.meshes):
    bpy.data.meshes.remove(block)
for block in list(bpy.data.materials):
    bpy.data.materials.remove(block)
for block in list(bpy.data.textures):
    bpy.data.textures.remove(block)
for block in list(bpy.data.images):
    bpy.data.images.remove(block)

# === Import GLB ===
if not os.path.exists(GLB_PATH):
    print(f"ERROR: {GLB_PATH} not found")
    sys.exit(1)

bpy.ops.import_scene.gltf(filepath=GLB_PATH)
print(f"Imported {GLB_PATH}")
print(f"Objects after import: {len(bpy.data.objects)}")

# === Compute bounding box of all mesh objects ===
min_co = [float('inf')] * 3
max_co = [float('-inf')] * 3
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        for v in obj.bound_box:
            world_v = obj.matrix_world @ type(obj.location)(v)
            for i in range(3):
                min_co[i] = min(min_co[i], world_v[i])
                max_co[i] = max(max_co[i], world_v[i])
center = [(a + b) / 2 for a, b in zip(min_co, max_co)]
size = [b - a for a, b in zip(min_co, max_co)]
print(f"Bounding box min: {min_co}")
print(f"Bounding box max: {max_co}")
print(f"Center: {center}")
print(f"Size: {size}")

# === Add lighting (simple 3-point) ===
bpy.ops.object.light_add(type='SUN', location=(20, 20, 50))
sun = bpy.context.object
sun.data.energy = 3.0
sun.rotation_euler = (math.radians(45), 0, math.radians(45))

bpy.ops.object.light_add(type='SUN', location=(-20, 20, 30))
fill = bpy.context.object
fill.data.energy = 1.0
fill.data.color = (0.7, 0.8, 1.0)

# === World / sky ===
world = bpy.data.worlds['World']
world.use_nodes = True
bg = world.node_tree.nodes['Background']
bg.inputs['Color'].default_value = (0.7, 0.8, 0.9, 1.0)
bg.inputs['Strength'].default_value = 1.0

# === Render settings ===
scene = bpy.context.scene
scene.render.resolution_x = 1024
scene.render.resolution_y = 768
scene.render.film_transparent = False
scene.render.image_settings.file_format = 'PNG'

# Use Eevee for fast rendering (Blender 5 uses EEVEE_NEXT)
try:
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
except:
    try:
        scene.render.engine = 'BLENDER_EEVEE'
    except:
        pass

# === Add camera ===
bpy.ops.object.camera_add()
cam = bpy.context.object
scene.camera = cam
cam.data.lens = 35  # wider angle for whole-mountain framing

# === Helper: position camera, point at center, render ===
def render_view(name, cam_pos, target=None):
    if target is None:
        target = center
    cam.location = cam_pos
    # Point camera at target
    direction = [target[i] - cam_pos[i] for i in range(3)]
    # Calculate euler rotation from direction vector
    import mathutils
    dir_vec = mathutils.Vector(direction)
    rot_quat = dir_vec.to_track_quat('-Z', 'Y')
    cam.rotation_euler = rot_quat.to_euler()
    out_path = os.path.join(OUT_DIR, f"{name}.png")
    scene.render.filepath = out_path
    bpy.ops.render.render(write_still=True)
    print(f"Rendered {out_path}")

# === Render 4 views ===
# Max dimension for camera distance calculation
max_dim = max(size)
cam_distance = max_dim * 1.8

# Isometric (3/4 view from front-right)
render_view("01-iso",
    cam_pos=[center[0] + cam_distance * 0.7,
             center[1] - cam_distance * 0.7,
             center[2] + cam_distance * 0.5])

# Front view (looking north, from +Y direction back at origin)
render_view("02-front",
    cam_pos=[center[0], center[1] - cam_distance, center[2] + max_dim * 0.1])

# Side view (from +X)
render_view("03-side",
    cam_pos=[center[0] + cam_distance, center[1], center[2] + max_dim * 0.1])

# Top-down
render_view("04-top",
    cam_pos=[center[0], center[1], center[2] + cam_distance])

# Back view (to see cave on north face, if cave is there)
render_view("05-back-northface",
    cam_pos=[center[0], center[1] + cam_distance, center[2] + max_dim * 0.1])

# Close-up of cave area (assuming cave is around y=24 on north face)
# "North" in our coords = +Y direction
render_view("06-cave-closeup",
    cam_pos=[center[0] + 30, center[1] + 30, 28],
    target=[center[0], center[1] + 5, 24])

print("")
print("=" * 60)
print("DONE. Preview images in:")
print(OUT_DIR)
print("=" * 60)

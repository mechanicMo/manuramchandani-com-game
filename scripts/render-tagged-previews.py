"""
Render tagged preview images of mountain.tagged.glb, one per tag group.
Highlighted meshes in designated color, everything else in dark grey.
Run with: blender -b -P render-tagged-previews.py
"""
import bpy
import os
import math
import sys

SCRIPT_DIR = "/Users/mohitramchandani/Code/web/manuramchandani-com/scripts"
GLB_PATH = os.path.join(SCRIPT_DIR, "..", "public", "models", "mountain.tagged.glb")
OUT_DIR = os.path.join(SCRIPT_DIR, "previews")
os.makedirs(OUT_DIR, exist_ok=True)

# === Tag groups: (tag_prefix, mesh_names_to_highlight, highlight_color_rgba, output_filename) ===
TAG_GROUPS = [
    ("walk_", ["walk_base", "walk_ledges", "walk_summit"], (0.0, 1.0, 0.0, 1.0), "tagged-walk.png"),
    ("climb_", ["climb_face_a"], (1.0, 0.0, 0.0, 1.0), "tagged-climb.png"),
    ("snow_", ["snow_descent"], (0.0, 0.7, 1.0, 1.0), "tagged-snow.png"),
    ("cave_", ["cave_interior"], (1.0, 0.9, 0.0, 1.0), "tagged-cave.png"),
    ("boulder_", [], (1.0, 0.5, 0.0, 1.0), "tagged-boulders.png"),
]

# Dark grey for non-highlighted meshes
DARK_GREY_COLOR = (0.1, 0.1, 0.1, 1.0)

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

# === Import tagged GLB ===
if not os.path.exists(GLB_PATH):
    print(f"ERROR: {GLB_PATH} not found")
    sys.exit(1)

bpy.ops.import_scene.gltf(filepath=GLB_PATH)
print(f"Imported {GLB_PATH}")
print(f"Objects after import: {len(bpy.data.objects)}")

# List all mesh objects and their names for debugging
mesh_objects = [obj for obj in bpy.data.objects if obj.type == 'MESH']
print(f"Mesh objects in scene: {[obj.name for obj in mesh_objects]}")

# === Compute bounding box of all mesh objects ===
min_co = [float('inf')] * 3
max_co = [float('-inf')] * 3
for obj in mesh_objects:
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

# === No scene lights — emission-only rendering for flat/shadeless tag colors ===
# World background is still slightly lit for visual reference
world = bpy.data.worlds['World']
world.use_nodes = True
bg = world.node_tree.nodes['Background']
bg.inputs['Color'].default_value = (0.7, 0.75, 0.8, 1.0)
bg.inputs['Strength'].default_value = 0.5

# === Render settings ===
scene = bpy.context.scene
scene.render.resolution_x = 1024
scene.render.resolution_y = 768
scene.render.film_transparent = False
scene.render.image_settings.file_format = 'PNG'

# Use Eevee — Emission materials look flat regardless of engine and Eevee is fast
try:
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
except Exception:
    try:
        scene.render.engine = 'BLENDER_EEVEE'
    except Exception:
        scene.render.engine = 'CYCLES'

# === Add camera ===
bpy.ops.object.camera_add()
cam = bpy.context.object
scene.camera = cam
cam.data.lens = 35  # wider angle for whole-mountain framing

# === Helper: make flat/shadeless material using Emission shader ===
# Emission gives us pure color regardless of lighting — ideal for tag validation renders
def make_solid_material(name, color_rgba):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nt = mat.node_tree
    # Clear default nodes and build Emission -> Output
    for node in list(nt.nodes):
        nt.nodes.remove(node)
    emission = nt.nodes.new(type='ShaderNodeEmission')
    emission.inputs['Color'].default_value = color_rgba
    emission.inputs['Strength'].default_value = 10.0
    output = nt.nodes.new(type='ShaderNodeOutputMaterial')
    nt.links.new(emission.outputs['Emission'], output.inputs['Surface'])
    return mat

# === Helper: apply material to mesh ===
def apply_material_to_mesh(mesh_obj, material):
    # Ensure material slot exists
    while len(mesh_obj.data.materials) < 1:
        mesh_obj.data.materials.append(None)
    # Assign material to first slot
    mesh_obj.data.materials[0] = material

# === Helper: position camera and render ===
def render_iso_view(name, cam_pos):
    target = center
    cam.location = cam_pos
    # Point camera at target
    direction = [target[i] - cam_pos[i] for i in range(3)]
    # Calculate euler rotation from direction vector
    import mathutils
    dir_vec = mathutils.Vector(direction)
    rot_quat = dir_vec.to_track_quat('-Z', 'Y')
    cam.rotation_euler = rot_quat.to_euler()
    out_path = os.path.join(OUT_DIR, name)
    scene.render.filepath = out_path
    bpy.ops.render.render(write_still=True)
    print(f"Rendered {out_path}")

# === Compute camera positions (iso + top-down + back) for multi-angle validation ===
max_dim = max(size)
cam_distance = max_dim * 1.8
iso_cam_pos = [center[0] + cam_distance * 0.7,
               center[1] - cam_distance * 0.7,
               center[2] + cam_distance * 0.5]
# Top-down camera — shows walk (horizontal) surfaces clearly
top_cam_pos = [center[0], center[1], center[2] + cam_distance]
# Back camera — shows rock face + cave opening from other side
back_cam_pos = [center[0] - cam_distance * 0.7,
                center[1] + cam_distance * 0.7,
                center[2] + cam_distance * 0.3]

# === Render one image per tag group ===
for tag_prefix, highlight_names, highlight_color, output_filename in TAG_GROUPS:
    # Check if this tag group has any meshes to highlight
    has_matching_meshes = False
    for obj in mesh_objects:
        if any(obj.name == name for name in highlight_names):
            has_matching_meshes = True
            break

    # For walk_, also check by prefix (all walk_* variants)
    if tag_prefix == "walk_":
        for obj in mesh_objects:
            if obj.name.startswith("walk_"):
                has_matching_meshes = True
                break

    # For boulder_, also check by prefix (in case naming changes)
    if tag_prefix == "boulder_":
        for obj in mesh_objects:
            if obj.name.startswith("boulder_"):
                has_matching_meshes = True
                break

    if not has_matching_meshes:
        print(f"No {tag_prefix}* meshes found, skipping {output_filename}")
        continue

    # Create materials with timestamp to ensure uniqueness
    import time
    mat_suffix = str(int(time.time() * 1000000) % 1000000)
    highlight_mat = make_solid_material(f"mat_highlight_{tag_prefix}_{mat_suffix}", highlight_color)
    dark_grey_mat = make_solid_material(f"mat_dark_grey_{tag_prefix}_{mat_suffix}", DARK_GREY_COLOR)

    print(f"Rendering {output_filename}...")

    # Assign materials to all mesh objects
    highlighted = []
    greyed = []
    for obj in mesh_objects:
        # Determine if this mesh should be highlighted
        should_highlight = any(obj.name == name for name in highlight_names)

        # Also match by prefix for walk_ (all three walk_* variants)
        if tag_prefix == "walk_" and obj.name.startswith("walk_"):
            should_highlight = True

        # Assign appropriate material
        if should_highlight:
            apply_material_to_mesh(obj, highlight_mat)
            highlighted.append(obj.name)
        else:
            apply_material_to_mesh(obj, dark_grey_mat)
            greyed.append(obj.name)

    print(f"  highlighted: {highlighted}")
    print(f"  greyed: {greyed}")

    # Force scene update before render so material changes take effect
    bpy.context.view_layer.update()

    # Render from 3 angles: iso, top-down, back
    base_name = output_filename.replace(".png", "")
    render_iso_view(f"{base_name}-iso.png", iso_cam_pos)
    render_iso_view(f"{base_name}-top.png", top_cam_pos)
    render_iso_view(f"{base_name}-back.png", back_cam_pos)

print("")
print("=" * 60)
print("DONE. Tagged preview images in:")
print(OUT_DIR)
print("=" * 60)

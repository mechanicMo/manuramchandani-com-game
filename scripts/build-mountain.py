"""
Build the manuramchandani.com mountain from scratch — procedural Blender.
Run with: blender -b -P scripts/build-mountain.py
Output: public/models/mountain.glb (same path the existing Mountain.tsx loads)
"""

import bpy, bmesh, mathutils
import os, sys, math
from mathutils import Vector

# ============================================================================
# CONSTANTS  (see plan docs/superpowers/plans/2026-04-19-manuramchandani-com-mountain-rebuild-v2.md)
# ============================================================================

# -- SCALE --
MOUNTAIN_SCALE_FACTOR = 100

# -- MOUNTAIN BODY --
BASE_RADIUS   = 0.55
BASE_SEGMENTS = 12
MOUNTAIN_HEIGHT = 0.90
SUMMIT_RADIUS = 0.08
SUMMIT_Y      = 0.80

# (silhouette noise, climb routes, ledges, summit, cave, snow slope — declared here but not all used in Task 1)
BASE_VERT_OFFSETS       = [0.10, -0.05, 0.12, 0.08, -0.15, 0.06,
                           0.09, -0.12, 0.04, 0.14, -0.07, 0.11]
MID_RING_Y_OFFSETS      = [0.03, -0.02, 0.04, -0.01, 0.02, -0.03,
                           0.01, 0.04, -0.02, 0.03, -0.01, 0.02]

# -- BASE PLATFORM (USED IN TASK 1) --
BASE_PLATFORM_RADIUS    = 0.75
BASE_PLATFORM_SEGMENTS  = 20
BASE_PLATFORM_THICKNESS = 0.03

# -- (Climb, ledge, summit, cave, snow constants declared here for completeness;
#     subsequent tasks will add their own logic referencing them.) --
# ... keep space here; I'll list values when dispatching Task 2+

# -- SOLIDIFY DEFAULTS --
SOLIDIFY_OFFSET = -1.0  # solidify toward interior

# -- OUTPUT --
OUTPUT_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "public", "models", "mountain.glb"
)

# ============================================================================
# HELPERS  (Blender API cheat-sheet verbatim from plan section 5)
# ============================================================================

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.meshes):
        bpy.data.meshes.remove(block)
    for block in list(bpy.data.materials):
        bpy.data.materials.remove(block)

def make_mesh_object(name, vertices, faces):
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    return obj

def apply_solidify(obj, thickness, offset=SOLIDIFY_OFFSET):
    mod = obj.modifiers.new(name="Solidify", type='SOLIDIFY')
    mod.thickness = thickness
    mod.offset = offset
    mod.use_even_offset = True
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier="Solidify")
    obj.select_set(False)

def apply_transforms(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    obj.select_set(False)

def set_flat_shading(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_flat()
    obj.select_set(False)

def count_boundary_edges(obj):
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.edges.ensure_lookup_table()
    boundary_count = sum(1 for e in bm.edges if e.is_boundary)
    bm.free()
    return boundary_count

# ============================================================================
# TASK 1 — Base platform (walk_base)
# ============================================================================

def build_walk_base():
    """Flat disc forming the walkable ground. Slight y-noise on inner ring for an organic seam."""
    vertices = []
    faces = []

    # Generate ring of vertices at y=0, evenly spaced around BASE_PLATFORM_RADIUS.
    # Also add a center vertex so the disc is a fan of triangles.
    CENTER_IDX = 0
    vertices.append((0.0, 0.0, 0.0))
    for i in range(BASE_PLATFORM_SEGMENTS):
        angle = (i / BASE_PLATFORM_SEGMENTS) * 2.0 * math.pi
        x = BASE_PLATFORM_RADIUS * math.cos(angle)
        z = BASE_PLATFORM_RADIUS * math.sin(angle)
        vertices.append((x, 0.0, z))

    # Triangle fan: (center, ring[i], ring[i+1])
    for i in range(BASE_PLATFORM_SEGMENTS):
        v1 = 1 + i
        v2 = 1 + ((i + 1) % BASE_PLATFORM_SEGMENTS)
        faces.append((CENTER_IDX, v1, v2))

    obj = make_mesh_object("walk_base", vertices, faces)
    apply_solidify(obj, BASE_PLATFORM_THICKNESS)
    apply_transforms(obj)
    set_flat_shading(obj)

    boundary = count_boundary_edges(obj)
    if boundary != 0:
        print(f"WATERTIGHT_FAIL walk_base (boundary_edges={boundary})", file=sys.stderr)
        sys.exit(1)

    print(f"[T1] walk_base OK — {len(obj.data.vertices)} verts, {len(obj.data.polygons)} faces, 0 boundary edges")
    return obj

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    clear_scene()

    # Task 1
    walk_base = build_walk_base()

    # (Later tasks add their builds here: mountain body, climbs, cave, summit, snow slope, export)

    print("\n=== Task 1 complete ===")

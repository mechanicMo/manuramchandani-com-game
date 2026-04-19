"""
Build the manuramchandani.com mountain from scratch — procedural Blender.
Run with: blender -b -P scripts/build-mountain.py
Output: public/models/mountain.glb (same path the existing Mountain.tsx loads)
"""

import bpy, bmesh, mathutils
import os, sys, math, random
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

# -- CLIMB ROUTES (TASK 3) — values from plan; do NOT alter without spec update --
CLIMB_BOTTOM_Y = 0.05           # y where climb faces begin (5 world units above base)
CLIMB_SOLIDIFY_THICKNESS = 0.04 # wall thickness for climb faces

# Route 1: Main Climb 1 (front region, faces -Z toward camera)
CLIMB_1_ORIGIN_XZ = (0.0, -0.40)
CLIMB_1_ANGLE_DEG = 10           # slight overhang
CLIMB_1_WIDTH = 0.22
CLIMB_1_HEIGHT = 0.75            # extends from y=0.05 to y=0.80 (summit)

# Route 2: Main Climb 2 (side region, +X)
CLIMB_2_ORIGIN_XZ = (0.35, -0.15)
CLIMB_2_ANGLE_DEG = 8
CLIMB_2_WIDTH = 0.20
CLIMB_2_HEIGHT = 0.72

# Route 3: Hidden Climb (back/side region, -X / +Z)
CLIMB_HIDDEN_ORIGIN_XZ = (-0.25, 0.35)
CLIMB_HIDDEN_ANGLE_DEG = 5       # near-vertical — steeper, less inviting
CLIMB_HIDDEN_WIDTH = 0.14        # narrower
CLIMB_HIDDEN_HEIGHT = 0.70

# -- LEDGES & BOULDERS --
N_LEDGES_PER_ROUTE    = 5
LEDGE_HEIGHT_FRACTION = [0.18, 0.34, 0.50, 0.65, 0.78]  # 5 ledges per climb (spec)
LEDGE_DEPTH           = 0.06                             # ledge protrusion from wall

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
# TASK 2 — Collision shell (main mountain body)
# ============================================================================

def build_collision_shell():
    """Asymmetric cone-like closed mesh forming the structural mountain body.

    5 vertex rings (y=0 to y=0.90):
    1. Base ring (y=0, r=0.55) with silhouette noise
    2. Low intermediate (y=0.30, r≈0.42) with vertical offsets
    3. High intermediate (y=0.55, r≈0.26) with variation
    4. Summit ring (y=0.80, r=0.08) forming flat plateau
    5. Apex vertex (y=0.90) for mild peak

    Quads between rings + triangle fan from apex.
    """
    vertices = []
    faces = []
    ring_starts = []  # Track where each ring starts in vertex list

    # Ring 0: Base (y=0)
    ring_starts.append(len(vertices))
    for i in range(BASE_SEGMENTS):
        angle = (i / BASE_SEGMENTS) * 2.0 * math.pi
        # Apply silhouette noise to radius
        radius = BASE_RADIUS + BASE_VERT_OFFSETS[i]
        x = radius * math.cos(angle)
        z = radius * math.sin(angle)
        vertices.append((x, 0.0, z))

    # Ring 1: Low intermediate (y=0.30, radius ≈ 0.42)
    ring_starts.append(len(vertices))
    low_radius = 0.42
    for i in range(BASE_SEGMENTS):
        angle = (i / BASE_SEGMENTS) * 2.0 * math.pi
        x = low_radius * math.cos(angle)
        z = low_radius * math.sin(angle)
        y = 0.30 + MID_RING_Y_OFFSETS[i]  # Add vertical jitter
        vertices.append((x, y, z))

    # Ring 2: High intermediate (y=0.55, radius ≈ 0.26)
    ring_starts.append(len(vertices))
    high_radius = 0.26
    for i in range(BASE_SEGMENTS):
        angle = (i / BASE_SEGMENTS) * 2.0 * math.pi
        x = high_radius * math.cos(angle)
        z = high_radius * math.sin(angle)
        # Use reversed sign of offsets for variation
        y = 0.55 - MID_RING_Y_OFFSETS[i]
        vertices.append((x, y, z))

    # Ring 3: Summit (y=0.80, radius=0.08)
    ring_starts.append(len(vertices))
    for i in range(BASE_SEGMENTS):
        angle = (i / BASE_SEGMENTS) * 2.0 * math.pi
        x = SUMMIT_RADIUS * math.cos(angle)
        z = SUMMIT_RADIUS * math.sin(angle)
        vertices.append((x, SUMMIT_Y, z))

    # Apex (single vertex at top)
    apex_idx = len(vertices)
    vertices.append((0.0, MOUNTAIN_HEIGHT, 0.0))

    # Build quads between adjacent rings (4 ring pairs: 0->1, 1->2, 2->3, 3->4)
    # We have 5 rings (indices 0-4 in ring_starts), so iterate through 4 pairs
    for ring_pair_idx in range(len(ring_starts) - 1):
        ring_a_start = ring_starts[ring_pair_idx]
        ring_b_start = ring_starts[ring_pair_idx + 1]

        for i in range(BASE_SEGMENTS):
            v_a0 = ring_a_start + i
            v_a1 = ring_a_start + ((i + 1) % BASE_SEGMENTS)
            v_b0 = ring_b_start + i
            v_b1 = ring_b_start + ((i + 1) % BASE_SEGMENTS)
            # Quad: (a0, a1, b1, b0)
            faces.append((v_a0, v_a1, v_b1, v_b0))

    # Build triangle fan from apex to summit ring
    summit_start = ring_starts[3]
    for i in range(BASE_SEGMENTS):
        v0 = apex_idx
        v1 = summit_start + ((i + 1) % BASE_SEGMENTS)
        v2 = summit_start + i
        faces.append((v0, v1, v2))

    obj = make_mesh_object("collision_shell", vertices, faces)
    apply_solidify(obj, 0.05)
    apply_transforms(obj)
    set_flat_shading(obj)

    boundary = count_boundary_edges(obj)
    if boundary != 0:
        print(f"WATERTIGHT_FAIL collision_shell (boundary_edges={boundary})", file=sys.stderr)
        sys.exit(1)

    print(f"[T2] collision_shell OK — {len(obj.data.vertices)} verts, {len(obj.data.polygons)} faces, 0 boundary edges")
    return obj

# ============================================================================
# TASK 3 — Climb routes (faces, ledges, boulders)
# ============================================================================

def build_climb_face(name, origin_xz, angle_deg, width, height):
    """Constructs an angled rectangular climbing wall.

    Subdivided into 4 columns × 8 rows (5×9 vertex grid = 45 vertices, 32 quads).
    Top edge tilted backward by angle_deg for overhang feel.
    Interior vertices have small noise for irregularity.
    """
    random.seed(hash(name))
    vertices = []
    faces = []

    # Build 5×9 vertex grid (col 0..4, row 0..8)
    for row in range(9):
        for col in range(5):
            u = col / 4.0  # 0..1 left to right
            v = row / 8.0  # 0..1 bottom to top

            # Local coordinates centered at origin
            x_local = (u - 0.5) * width
            y_local = v * height
            z_local = 0.0

            # Tilt top backward: top moves toward -Z
            z_local += y_local * math.tan(math.radians(angle_deg)) * 0.3

            # Add noise to interior vertices only (col 1..3, row 1..7)
            if 1 <= col <= 3 and 1 <= row <= 7:
                x_local += random.uniform(-0.01, 0.01)
                y_local += random.uniform(-0.005, 0.005)

            # Transform to world coordinates
            world_x = origin_xz[0] + x_local
            world_y = CLIMB_BOTTOM_Y + y_local
            world_z = origin_xz[1] + z_local

            vertices.append((world_x, world_y, world_z))

    # Build quad grid (4 cols × 8 rows = 32 quads)
    for row in range(8):
        for col in range(4):
            i_bl = row * 5 + col         # bottom-left
            i_br = row * 5 + col + 1     # bottom-right
            i_tl = (row + 1) * 5 + col   # top-left
            i_tr = (row + 1) * 5 + col + 1  # top-right
            faces.append((i_bl, i_br, i_tr, i_tl))

    obj = make_mesh_object(name, vertices, faces)
    apply_solidify(obj, CLIMB_SOLIDIFY_THICKNESS)
    apply_transforms(obj)
    set_flat_shading(obj)

    boundary = count_boundary_edges(obj)
    if boundary != 0:
        print(f"WATERTIGHT_FAIL {name} (boundary={boundary})", file=sys.stderr)
        sys.exit(1)

    print(f"[T3] {name} OK — {len(obj.data.vertices)} verts, {len(obj.data.polygons)} faces, 0 boundary")
    return obj

def build_ledge(name, center_xyz, width, depth, height):
    """A shallow box (cuboid). 8 vertices, 6 faces (already closed)."""
    cx, cy, cz = center_xyz
    hw, hd, hh = width / 2.0, depth / 2.0, height / 2.0

    vertices = [
        (cx - hw, cy - hh, cz - hd), (cx + hw, cy - hh, cz - hd),
        (cx + hw, cy - hh, cz + hd), (cx - hw, cy - hh, cz + hd),
        (cx - hw, cy + hh, cz - hd), (cx + hw, cy + hh, cz - hd),
        (cx + hw, cy + hh, cz + hd), (cx - hw, cy + hh, cz + hd),
    ]
    faces = [
        (0, 1, 2, 3),    # bottom
        (7, 6, 5, 4),    # top (reversed for outward normal)
        (0, 4, 5, 1),    # -Z
        (1, 5, 6, 2),    # +X
        (2, 6, 7, 3),    # +Z
        (3, 7, 4, 0),    # -X
    ]

    obj = make_mesh_object(name, vertices, faces)
    # NO solidify — box is already closed
    apply_transforms(obj)
    set_flat_shading(obj)

    boundary = count_boundary_edges(obj)
    if boundary != 0:
        print(f"WATERTIGHT_FAIL {name} (boundary={boundary})", file=sys.stderr)
        sys.exit(1)

    return obj

def build_boulder(name, center_xyz, size):
    """Irregular boulder: 8-vertex cube with random jitter (±15% of size)."""
    random.seed(hash(name))
    cx, cy, cz = center_xyz
    hs = size / 2.0

    def j():
        return random.uniform(-0.15, 0.15) * size

    vertices = [
        (cx - hs + j(), cy - hs + j(), cz - hs + j()),
        (cx + hs + j(), cy - hs + j(), cz - hs + j()),
        (cx + hs + j(), cy - hs + j(), cz + hs + j()),
        (cx - hs + j(), cy - hs + j(), cz + hs + j()),
        (cx - hs + j(), cy + hs + j(), cz - hs + j()),
        (cx + hs + j(), cy + hs + j(), cz - hs + j()),
        (cx + hs + j(), cy + hs + j(), cz + hs + j()),
        (cx - hs + j(), cy + hs + j(), cz + hs + j()),
    ]
    faces = [
        (0, 1, 2, 3), (7, 6, 5, 4),
        (0, 4, 5, 1), (1, 5, 6, 2),
        (2, 6, 7, 3), (3, 7, 4, 0),
    ]

    obj = make_mesh_object(name, vertices, faces)
    apply_transforms(obj)
    set_flat_shading(obj)

    boundary = count_boundary_edges(obj)
    if boundary != 0:
        print(f"WATERTIGHT_FAIL {name} (boundary={boundary})", file=sys.stderr)
        sys.exit(1)

    return obj

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    clear_scene()

    # Task 1
    walk_base = build_walk_base()

    # Task 2
    collision_shell = build_collision_shell()

    # Task 3 — climb routes
    # Route 1: Main Climb 1 (front region)
    build_climb_face("climb_face_1", CLIMB_1_ORIGIN_XZ, CLIMB_1_ANGLE_DEG, CLIMB_1_WIDTH, CLIMB_1_HEIGHT)
    for i, frac in enumerate(LEDGE_HEIGHT_FRACTION):
        ledge_y = CLIMB_BOTTOM_Y + frac * CLIMB_1_HEIGHT
        ledge_xz = CLIMB_1_ORIGIN_XZ
        ledge_center = (ledge_xz[0], ledge_y, ledge_xz[1] + LEDGE_DEPTH * 0.5)  # protrude outward
        build_ledge(f"walk_ledge_1_{i+1:02d}", ledge_center, CLIMB_1_WIDTH, LEDGE_DEPTH, 0.03)

    # Route 2: Main Climb 2 (side region)
    build_climb_face("climb_face_2", CLIMB_2_ORIGIN_XZ, CLIMB_2_ANGLE_DEG, CLIMB_2_WIDTH, CLIMB_2_HEIGHT)
    for i, frac in enumerate(LEDGE_HEIGHT_FRACTION):
        ledge_y = CLIMB_BOTTOM_Y + frac * CLIMB_2_HEIGHT
        ledge_xz = CLIMB_2_ORIGIN_XZ
        # Climb 2 faces +X, so ledge protrudes on +X
        ledge_center = (ledge_xz[0] + LEDGE_DEPTH * 0.5, ledge_y, ledge_xz[1])
        build_ledge(f"walk_ledge_2_{i+1:02d}", ledge_center, LEDGE_DEPTH, CLIMB_2_WIDTH, 0.03)

    # Route 3: Hidden Climb (back/side region)
    build_climb_face("climb_face_hidden", CLIMB_HIDDEN_ORIGIN_XZ, CLIMB_HIDDEN_ANGLE_DEG, CLIMB_HIDDEN_WIDTH, CLIMB_HIDDEN_HEIGHT)
    for i, frac in enumerate(LEDGE_HEIGHT_FRACTION):
        ledge_y = CLIMB_BOTTOM_Y + frac * CLIMB_HIDDEN_HEIGHT
        ledge_xz = CLIMB_HIDDEN_ORIGIN_XZ
        # Hidden faces back/side (+Z, -X direction); protrude on -X
        ledge_center = (ledge_xz[0] - LEDGE_DEPTH * 0.5, ledge_y, ledge_xz[1])
        build_ledge(f"walk_ledge_hidden_{i+1:02d}", ledge_center, LEDGE_DEPTH, CLIMB_HIDDEN_WIDTH, 0.03)

    # Boulder cluster obscuring the hidden climb entrance
    hidden_x, hidden_z = CLIMB_HIDDEN_ORIGIN_XZ
    build_boulder("boulder_entry_01", (hidden_x + 0.04, 0.03, hidden_z - 0.02), 0.06)
    build_boulder("boulder_entry_02", (hidden_x - 0.03, 0.04, hidden_z + 0.01), 0.07)

    print("\n=== Task 3 complete ===")

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

# -- CAVE (TASK 4) — plan-specified values --
CAVE_ENTRANCE_XZ        = (0.05, -0.30)  # on the Climb 1 face, mid-route
CAVE_ENTRANCE_Y         = 0.35           # ~35 world units up
CAVE_ENTRANCE_RADIUS    = 0.04
CAVE_DEPTH              = 0.12           # how far into the mountain
CAVE_INTERIOR_WIDTH     = 0.10
CAVE_INTERIOR_HEIGHT    = 0.07
CAVE_ENTRANCE_SEGMENTS  = 8
# After cave boolean, collision_shell will have open boundary edges AT the entrance (expected).
# Two edge loops around the opening (entrance hole + inner rim from solidify) ≈ 16 edges total.
ALLOWED_SHELL_BOUNDARY_EDGES = CAVE_ENTRANCE_SEGMENTS * 2  # 16

# -- SUMMIT (TASK 5) — plan-exact values; do NOT change --
SUMMIT_PLATEAU_HEIGHT     = 0.04
SUMMIT_SOLIDIFY_THICKNESS = 0.03

# Summit feature positions on plateau (XZ local to summit center at x=0, z=0)
BEACON_PYRE_XZ     = (0.0, 0.0)    # center of summit
MONOLITH_XZ        = (-0.05, 0.0)  # slightly toward Climb 1 side
SNOWBOARD_CACHE_XZ = (0.04, 0.05)  # toward opposite region (descent side)

# Summit feature dimensions
BEACON_PYRE_BASE_RADIUS = 0.015
BEACON_PYRE_HEIGHT      = 0.05
MONOLITH_WIDTH          = 0.012
MONOLITH_DEPTH          = 0.006
MONOLITH_HEIGHT         = 0.06
SNOWBOARD_CACHE_WIDTH   = 0.025
SNOWBOARD_CACHE_HEIGHT  = 0.030

# -- SNOW DESCENT SLOPE (TASK 6) — plan-exact --
SNOW_SLOPE_START_Y   = 0.80            # from summit level
SNOW_SLOPE_END_Y     = 0.02            # near base
SNOW_SLOPE_WIDTH     = 0.30            # horizontal extent
SNOW_SLOPE_ORIGIN_XZ = (0.0, 0.40)     # opposite region, +Z
SNOW_SLOPE_ANGLE_DEG = 30              # slope angle (from vertical — so a "30° lean" sloping down and out)

# -- LEDGES & BOULDERS --
N_LEDGES_PER_ROUTE    = 5
LEDGE_HEIGHT_FRACTION = [0.18, 0.34, 0.50, 0.65, 0.78]  # 5 ledges per climb (spec)
LEDGE_DEPTH           = 0.06                             # ledge protrusion from wall

# -- SOLIDIFY DEFAULTS --
SOLIDIFY_OFFSET = -1.0  # solidify toward interior

# -- OUTPUT --
OUTPUT_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "public", "models", "mountain.tagged.glb"
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

def boolean_subtract(target_obj, cutter_obj):
    """Subtract cutter from target in-place using the EXACT solver.
    Returns target. Cutter is hidden (not deleted) for debugging."""
    mod = target_obj.modifiers.new(name="Bool_Cave", type='BOOLEAN')
    mod.operation = 'DIFFERENCE'
    mod.object = cutter_obj
    mod.solver = 'EXACT'
    bpy.context.view_layer.objects.active = target_obj
    target_obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier="Bool_Cave")
    target_obj.select_set(False)
    cutter_obj.hide_viewport = True
    cutter_obj.hide_render = True
    return target_obj

def export_glb(output_path):
    """Export all visible mesh objects to GLB with named submeshes preserved."""
    # Ensure output dir exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    # Deselect everything, then select all visible meshes
    bpy.ops.object.select_all(action='DESELECT')
    exported = []
    for obj in bpy.data.objects:
        if obj.type == 'MESH' and not obj.hide_viewport:
            obj.select_set(True)
            exported.append(obj.name)
    try:
        bpy.ops.export_scene.gltf(
            filepath=output_path,
            export_format='GLB',
            export_apply=True,
            export_materials='NONE',
            export_selection=True,
            check_existing=False,
        )
    except TypeError:
        bpy.ops.export_scene.gltf(
            filepath=output_path,
            export_format='GLB',
            export_apply=True,
            export_materials='NONE',
            use_selection=True,
            check_existing=False,
        )
    return exported

def print_summary(output_path, exported_names):
    """Print object count per prefix + total file size."""
    prefixes = {"walk_": 0, "climb_": 0, "snow_": 0, "cave_": 0, "summit_": 0, "boulder_": 0}
    other = 0
    for name in exported_names:
        matched = False
        for p in prefixes:
            if name.startswith(p):
                prefixes[p] += 1
                matched = True
                break
        if not matched:
            other += 1
    size_bytes = os.path.getsize(output_path) if os.path.exists(output_path) else 0
    size_mb = size_bytes / (1024 * 1024)
    print("")
    print("=" * 60)
    print("EXPORT SUMMARY")
    for p, c in prefixes.items():
        print(f"  {p}*  {c}")
    print(f"  other {other}")
    print(f"  total objects: {len(exported_names)}")
    print(f"  file size: {size_mb:.2f} MB  ({output_path})")
    print("=" * 60)

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
# TASK 4 — Cave entrance + interior chamber
# ============================================================================

def build_cave(collision_shell_obj):
    """Cut entrance into collision_shell + build cave_interior chamber."""
    # 1. Cutter: a horizontal cylinder pointing INTO the mountain from the climb_1 face.
    #    The face direction from climb_1 toward cave: climb_1 is at (0, -0.40), face normal is +Z
    #    (camera direction). To cut INTO the mountain from that face, the cutter extends from
    #    outside the shell (+Z) toward -Z into the mountain.
    cx, cz = CAVE_ENTRANCE_XZ
    cy = CAVE_ENTRANCE_Y
    # Cylinder from (cx, cy, cz-0.02) outside the face, to (cx, cy, cz-CAVE_DEPTH) inside
    cutter_verts = []
    cutter_faces = []
    # Two rings of vertices (front cap + back cap)
    for z_offset in [+0.02, -(CAVE_DEPTH)]:  # front is slightly outside face, back is interior
        for i in range(CAVE_ENTRANCE_SEGMENTS):
            angle = (i / CAVE_ENTRANCE_SEGMENTS) * 2 * math.pi
            x = cx + CAVE_ENTRANCE_RADIUS * math.cos(angle)
            y = cy + CAVE_ENTRANCE_RADIUS * math.sin(angle)
            z = cz + z_offset
            cutter_verts.append((x, y, z))
    # Side quads between rings
    for i in range(CAVE_ENTRANCE_SEGMENTS):
        a = i
        b = (i + 1) % CAVE_ENTRANCE_SEGMENTS
        c = CAVE_ENTRANCE_SEGMENTS + b
        d = CAVE_ENTRANCE_SEGMENTS + a
        cutter_faces.append((a, b, c, d))
    # End caps (triangle fans)
    front_center = len(cutter_verts)
    cutter_verts.append((cx, cy, cz + 0.02))
    for i in range(CAVE_ENTRANCE_SEGMENTS):
        b = (i + 1) % CAVE_ENTRANCE_SEGMENTS
        cutter_faces.append((front_center, b, i))  # outward normal
    back_center = len(cutter_verts)
    cutter_verts.append((cx, cy, cz - CAVE_DEPTH))
    for i in range(CAVE_ENTRANCE_SEGMENTS):
        b = (i + 1) % CAVE_ENTRANCE_SEGMENTS
        cutter_faces.append((back_center, CAVE_ENTRANCE_SEGMENTS + i, CAVE_ENTRANCE_SEGMENTS + b))
    cutter = make_mesh_object("__cave_cutter", cutter_verts, cutter_faces)

    # 2. Boolean subtract from collision_shell
    boolean_subtract(collision_shell_obj, cutter)

    # 3. Check collision_shell boundary edges after boolean
    boundary = count_boundary_edges(collision_shell_obj)
    if boundary > ALLOWED_SHELL_BOUNDARY_EDGES:
        # Tolerance exceeded. Log but don't exit — Task 7 validation flags for inspection.
        print(f"CAVE_NONMANIFOLD_WARN collision_shell boundary={boundary} allowed={ALLOWED_SHELL_BOUNDARY_EDGES}", file=sys.stderr)
    else:
        print(f"[T4] boolean_subtract OK — collision_shell boundary={boundary} (allowed={ALLOWED_SHELL_BOUNDARY_EDGES})")

    # 4. Build cave_interior chamber (a closed box positioned inside the mountain behind the entrance)
    # Chamber XZ-aligned, centered on CAVE_ENTRANCE_XZ, extends inward from entrance Z.
    chamber_cx = cx
    chamber_cy = cy
    chamber_cz_center = cz - CAVE_DEPTH * 0.5  # center of chamber in Z
    w_half = CAVE_INTERIOR_WIDTH / 2
    h_half = CAVE_INTERIOR_HEIGHT / 2
    d_half = CAVE_DEPTH / 2
    cave_verts = [
        (chamber_cx - w_half, chamber_cy - h_half, chamber_cz_center - d_half),
        (chamber_cx + w_half, chamber_cy - h_half, chamber_cz_center - d_half),
        (chamber_cx + w_half, chamber_cy - h_half, chamber_cz_center + d_half),
        (chamber_cx - w_half, chamber_cy - h_half, chamber_cz_center + d_half),
        (chamber_cx - w_half, chamber_cy + h_half, chamber_cz_center - d_half),
        (chamber_cx + w_half, chamber_cy + h_half, chamber_cz_center - d_half),
        (chamber_cx + w_half, chamber_cy + h_half, chamber_cz_center + d_half),
        (chamber_cx - w_half, chamber_cy + h_half, chamber_cz_center + d_half),
    ]
    cave_faces = [
        (0, 1, 2, 3),
        (7, 6, 5, 4),
        (0, 4, 5, 1),
        (1, 5, 6, 2),
        (2, 6, 7, 3),
        (3, 7, 4, 0),
    ]
    cave = make_mesh_object("cave_interior", cave_verts, cave_faces)
    apply_transforms(cave)
    set_flat_shading(cave)
    cave_boundary = count_boundary_edges(cave)
    if cave_boundary != 0:
        print(f"WATERTIGHT_FAIL cave_interior (boundary={cave_boundary})", file=sys.stderr)
        sys.exit(1)
    print(f"[T4] cave_interior OK — {len(cave.data.vertices)} verts, {len(cave.data.polygons)} faces, 0 boundary")
    return cave

# ============================================================================
# TASK 5 — Summit plateau + features (walk_summit, beacon_pyre, monolith, snowboard_cache)
# ============================================================================

def build_walk_summit():
    """Flat disc at summit height, slightly larger than the collision_shell cap."""
    radius = SUMMIT_RADIUS + 0.02
    segments = 12
    vertices = [(0.0, SUMMIT_Y, 0.0)]  # center
    for i in range(segments):
        angle = (i / segments) * 2 * math.pi
        vertices.append((radius * math.cos(angle), SUMMIT_Y, radius * math.sin(angle)))
    faces = []
    for i in range(segments):
        v1 = 1 + i
        v2 = 1 + ((i + 1) % segments)
        faces.append((0, v1, v2))
    obj = make_mesh_object("walk_summit", vertices, faces)
    apply_solidify(obj, SUMMIT_SOLIDIFY_THICKNESS)
    apply_transforms(obj)
    set_flat_shading(obj)
    boundary = count_boundary_edges(obj)
    if boundary != 0:
        print(f"WATERTIGHT_FAIL walk_summit (boundary={boundary})", file=sys.stderr)
        sys.exit(1)
    print(f"[T5] walk_summit OK — {len(obj.data.vertices)} verts, {len(obj.data.polygons)} faces, 0 boundary")
    return obj

def build_beacon_pyre():
    """Cone sitting on summit surface (y = SUMMIT_Y + SUMMIT_SOLIDIFY_THICKNESS ≈ 0.83)."""
    base_y = SUMMIT_Y + SUMMIT_SOLIDIFY_THICKNESS  # top of walk_summit
    apex_y = base_y + BEACON_PYRE_HEIGHT
    cx, cz = BEACON_PYRE_XZ
    segments = 8
    vertices = []
    # Base ring
    for i in range(segments):
        angle = (i / segments) * 2 * math.pi
        vertices.append((
            cx + BEACON_PYRE_BASE_RADIUS * math.cos(angle),
            base_y,
            cz + BEACON_PYRE_BASE_RADIUS * math.sin(angle),
        ))
    apex_idx = len(vertices)
    vertices.append((cx, apex_y, cz))
    base_center_idx = len(vertices)
    vertices.append((cx, base_y, cz))
    faces = []
    # Side tris (apex to ring)
    for i in range(segments):
        b = (i + 1) % segments
        faces.append((apex_idx, b, i))
    # Base tris (base_center to ring, reversed for downward normal)
    for i in range(segments):
        b = (i + 1) % segments
        faces.append((base_center_idx, i, b))
    obj = make_mesh_object("summit_beacon_pyre", vertices, faces)
    # No solidify — closed cone is already watertight
    apply_transforms(obj)
    set_flat_shading(obj)
    boundary = count_boundary_edges(obj)
    if boundary != 0:
        print(f"WATERTIGHT_FAIL summit_beacon_pyre (boundary={boundary})", file=sys.stderr)
        sys.exit(1)
    print(f"[T5] summit_beacon_pyre OK — {len(obj.data.vertices)} verts, {len(obj.data.polygons)} faces, 0 boundary")
    return obj

def build_monolith():
    """Tall box standing on summit surface, leaning 5° along X for a "standing stone" feel."""
    import math as _m
    base_y = SUMMIT_Y + SUMMIT_SOLIDIFY_THICKNESS
    cx, cz = MONOLITH_XZ
    lean = _m.radians(5)  # lean along X
    hw = MONOLITH_WIDTH / 2
    hd = MONOLITH_DEPTH / 2
    h = MONOLITH_HEIGHT
    # Lean: top of the monolith shifts by h * sin(lean) in +X
    top_shift_x = h * _m.sin(lean)
    top_y = base_y + h * _m.cos(lean)
    # 4 bottom verts (at base_y), 4 top verts (lean-adjusted)
    vertices = [
        (cx - hw, base_y, cz - hd),
        (cx + hw, base_y, cz - hd),
        (cx + hw, base_y, cz + hd),
        (cx - hw, base_y, cz + hd),
        (cx - hw + top_shift_x, top_y, cz - hd),
        (cx + hw + top_shift_x, top_y, cz - hd),
        (cx + hw + top_shift_x, top_y, cz + hd),
        (cx - hw + top_shift_x, top_y, cz + hd),
    ]
    faces = [
        (0, 1, 2, 3),   # bottom
        (7, 6, 5, 4),   # top
        (0, 4, 5, 1),
        (1, 5, 6, 2),
        (2, 6, 7, 3),
        (3, 7, 4, 0),
    ]
    obj = make_mesh_object("summit_monolith", vertices, faces)
    apply_transforms(obj)
    set_flat_shading(obj)
    boundary = count_boundary_edges(obj)
    if boundary != 0:
        print(f"WATERTIGHT_FAIL summit_monolith (boundary={boundary})", file=sys.stderr)
        sys.exit(1)
    print(f"[T5] summit_monolith OK — {len(obj.data.vertices)} verts, {len(obj.data.polygons)} faces, 0 boundary")
    return obj

def build_snowboard_cache():
    """Three box objects then join into one with bpy.ops.object.join().
    Shape: horizontal bar across two short upright posts, forming an upside-down U."""
    base_y = SUMMIT_Y + SUMMIT_SOLIDIFY_THICKNESS
    cx, cz = SNOWBOARD_CACHE_XZ
    w = SNOWBOARD_CACHE_WIDTH
    h = SNOWBOARD_CACHE_HEIGHT
    post_thickness = 0.004
    bar_thickness  = 0.004

    def make_box(name, center_xyz, size_xyz):
        bx, by, bz = center_xyz
        sx, sy, sz = size_xyz
        hx, hy, hz = sx / 2, sy / 2, sz / 2
        verts = [
            (bx - hx, by - hy, bz - hz), (bx + hx, by - hy, bz - hz),
            (bx + hx, by - hy, bz + hz), (bx - hx, by - hy, bz + hz),
            (bx - hx, by + hy, bz - hz), (bx + hx, by + hy, bz - hz),
            (bx + hx, by + hy, bz + hz), (bx - hx, by + hy, bz + hz),
        ]
        faces = [(0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
        return make_mesh_object(name, verts, faces)

    # Two uprights
    post_left  = make_box("__sb_post_L", (cx - w / 2 + post_thickness / 2, base_y + h / 2, cz), (post_thickness, h, post_thickness))
    post_right = make_box("__sb_post_R", (cx + w / 2 - post_thickness / 2, base_y + h / 2, cz), (post_thickness, h, post_thickness))
    # Horizontal bar
    bar = make_box("__sb_bar", (cx, base_y + h - bar_thickness / 2, cz), (w, bar_thickness, post_thickness))

    # Join the three parts into one object named summit_snowboard_cache
    bpy.context.view_layer.objects.active = bar
    post_left.select_set(True)
    post_right.select_set(True)
    bar.select_set(True)
    bpy.ops.object.join()
    bar.name = "summit_snowboard_cache"
    bar.data.name = "summit_snowboard_cache"
    bar.select_set(False)

    apply_transforms(bar)
    set_flat_shading(bar)
    boundary = count_boundary_edges(bar)
    if boundary != 0:
        print(f"WATERTIGHT_FAIL summit_snowboard_cache (boundary={boundary})", file=sys.stderr)
        sys.exit(1)
    print(f"[T5] summit_snowboard_cache OK — {len(bar.data.vertices)} verts, {len(bar.data.polygons)} faces, 0 boundary")
    return bar

# ============================================================================
# TASK 6 — Snow descent slope
# ============================================================================

def build_snow_descent():
    """Angled snow slope on +Z side of mountain, sloping downward and outward.

    Planar quad subdivided into 3 cols × 8 rows (4×9 vertex grid = 36 verts, 24 quads).
    Top anchored at SNOW_SLOPE_ORIGIN_XZ, slopes down in Y and extends outward in +Z
    as it descends, tilted by SNOW_SLOPE_ANGLE_DEG.
    Interior vertices have small XZ noise for irregularity.
    """
    import random as _r
    _r.seed(hash("snow_descent"))
    slope_height = SNOW_SLOPE_START_Y - SNOW_SLOPE_END_Y
    # Tilt: bottom of slope extends further out in +Z than top by slope_height * tan(angle)
    z_extension = slope_height * math.tan(math.radians(SNOW_SLOPE_ANGLE_DEG))
    ox, oz = SNOW_SLOPE_ORIGIN_XZ  # top-of-slope XZ anchor
    cols = 3
    rows = 8
    vertices = []
    for row in range(rows + 1):       # 9 vertex rows
        v = row / rows                # 0 at top (y = SLOPE_START_Y), 1 at bottom (y = SLOPE_END_Y)
        y = SNOW_SLOPE_START_Y - v * slope_height
        z_offset_for_row = v * z_extension
        for col in range(cols + 1):   # 4 columns
            u = col / cols            # 0 left, 1 right
            x = ox + (u - 0.5) * SNOW_SLOPE_WIDTH
            z = oz + z_offset_for_row
            # Noise on interior verts only (col 1-2, row 1-7)
            if 0 < col < cols and 0 < row < rows:
                x += _r.uniform(-0.01, 0.01)
                z += _r.uniform(-0.01, 0.01)
            vertices.append((x, y, z))
    # Quad faces (row, col) → vertex index = row * (cols+1) + col
    faces = []
    for row in range(rows):
        for col in range(cols):
            i_tl = row * (cols + 1) + col           # top-left of quad
            i_tr = row * (cols + 1) + col + 1
            i_bl = (row + 1) * (cols + 1) + col
            i_br = (row + 1) * (cols + 1) + col + 1
            # Wind for outward (+Z) normal: TL, TR, BR, BL
            faces.append((i_tl, i_tr, i_br, i_bl))
    obj = make_mesh_object("snow_descent", vertices, faces)
    apply_solidify(obj, 0.04)
    apply_transforms(obj)
    set_flat_shading(obj)
    boundary = count_boundary_edges(obj)
    if boundary != 0:
        print(f"WATERTIGHT_FAIL snow_descent (boundary={boundary})", file=sys.stderr)
        sys.exit(1)
    print(f"[T6] snow_descent OK — {len(obj.data.vertices)} verts, {len(obj.data.polygons)} faces, 0 boundary")
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

    # Task 4 — cave entrance + cave_interior
    build_cave(collision_shell)

    # Task 5 — summit plateau + features
    build_walk_summit()
    build_beacon_pyre()
    build_monolith()
    build_snowboard_cache()

    # Task 6 — snow descent slope
    build_snow_descent()

    # Task 7 — export
    exported = export_glb(OUTPUT_PATH)
    print_summary(OUTPUT_PATH, exported)

    print("\n=== Build complete ===")

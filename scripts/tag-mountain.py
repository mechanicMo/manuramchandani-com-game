"""
Mountain Mesh Tagger for manuramchandani.com

This script imports mountain.glb, classifies faces by geometry analysis,
separates the mesh into named submeshes (walk_, climb_, snow_, cave_, boulder_),
and exports to mountain.tagged.glb.

Run with: blender -b -P scripts/tag-mountain.py
"""

import bpy
import bmesh
import mathutils
import os
import sys
from mathutils import Vector

# ===== CONSTANTS =====

SCRIPT_DIR = "/Users/mohitramchandani/Code/web/manuramchandani-com/scripts"
INPUT_GLB = os.path.join(SCRIPT_DIR, "mountain.glb")
OUTPUT_DIR = "/Users/mohitramchandani/Code/web/manuramchandani-com/public/models"
OUTPUT_GLB = os.path.join(OUTPUT_DIR, "mountain.tagged.glb")

# Create output directory if it doesn't exist
os.makedirs(OUTPUT_DIR, exist_ok=True)

CAVE_AABB = {
    "x_min": -0.05,
    "x_max": 0.15,
    "y_min": 0.22,
    "y_max": 0.32,
    "z_min": -0.15,
    "z_max": 0.05,
}

BOULDER_AABB_FALLBACK = {
    "x_min": -0.15,
    "x_max": 0.05,
    "y_min": 0.0,
    "y_max": 0.05,
    "z_min": -0.05,
    "z_max": 0.15,
}

# Y_UP will be determined at runtime based on vertical axis detection
Y_UP_DEFAULT = Vector((0.0, 1.0, 0.0))

# TAG_OVERRIDES: faces with centroid in AABB get forced tag
# Format: (y_min, y_max, x_min, x_max, z_min, z_max): "tag_name"
TAG_OVERRIDES = {
    # Example: (0.13, 0.15, -0.30, -0.20, -0.05, 0.05): "walk",
}

# ===== UTILITY FUNCTIONS =====

def log_progress(msg):
    """Print progress message."""
    print(f"[TAGGER] {msg}")

def clear_scene():
    """Clear all objects from the Blender scene."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.meshes):
        bpy.data.meshes.remove(block)
    for block in list(bpy.data.materials):
        bpy.data.materials.remove(block)

def aabb_contains_point(aabb, point):
    """Check if a point is inside an AABB."""
    return (
        aabb["x_min"] <= point.x <= aabb["x_max"]
        and aabb["y_min"] <= point.y <= aabb["y_max"]
        and aabb["z_min"] <= point.z <= aabb["z_max"]
    )

def expand_aabb(aabb, factor=1.2):
    """Expand AABB extents by a factor."""
    x_mid = (aabb["x_min"] + aabb["x_max"]) / 2
    y_mid = (aabb["y_min"] + aabb["y_max"]) / 2
    z_mid = (aabb["z_min"] + aabb["z_max"]) / 2

    x_extent = (aabb["x_max"] - aabb["x_min"]) / 2 * factor
    y_extent = (aabb["y_max"] - aabb["y_min"]) / 2 * factor
    z_extent = (aabb["z_max"] - aabb["z_min"]) / 2 * factor

    return {
        "x_min": x_mid - x_extent,
        "x_max": x_mid + x_extent,
        "y_min": y_mid - y_extent,
        "y_max": y_mid + y_extent,
        "z_min": z_mid - z_extent,
        "z_max": z_mid + z_extent,
    }

def compute_face_world_normal(bm_face, obj_matrix):
    """Compute world-space normal of a bmesh face."""
    local_normal = bm_face.normal
    # Transform normal to world space (rotate, don't translate)
    world_normal = obj_matrix.to_3x3() @ local_normal
    world_normal.normalize()
    return world_normal

def compute_face_world_centroid(bm_face, obj_matrix):
    """Compute world-space centroid of a bmesh face."""
    local_centroid = sum((v.co for v in bm_face.verts), Vector()) / len(bm_face.verts)
    world_centroid = obj_matrix @ local_centroid
    return world_centroid

def classify_face(bm_face, obj_matrix, cave_aabb, tag_overrides, mountain_max_y=None, vertical_axis='Y'):
    """
    Classify a face and return its tag.

    Priority:
    1. Check TAG_OVERRIDES
    2. Check CAVE_AABB
    3. Check dot(normal, Y_UP) > 0.6 -> walk (sub-classified by vertical position)
    4. Check normal.x < -0.1 -> snow
    5. Check abs(dot(normal, Y_UP)) < 0.3 AND normal.x > 0 -> climb
    6. Else -> collision_shell

    Walk sub-classification (if mountain_max_y provided):
      - vertical_pos < 0.1 * mountain_max_y -> walk_base
      - vertical_pos > 0.85 * mountain_max_y -> walk_summit
      - else -> walk_ledges

    vertical_axis: 'X', 'Y', or 'Z' - which coordinate is the vertical (height) axis
    """
    world_centroid = compute_face_world_centroid(bm_face, obj_matrix)

    # Check TAG_OVERRIDES first
    for (y_min, y_max, x_min, x_max, z_min, z_max), tag in tag_overrides.items():
        if (
            x_min <= world_centroid.x <= x_max
            and y_min <= world_centroid.y <= y_max
            and z_min <= world_centroid.z <= z_max
        ):
            return tag

    # Check CAVE_AABB
    if aabb_contains_point(cave_aabb, world_centroid):
        return "cave"

    # Compute world-space normal
    world_normal = compute_face_world_normal(bm_face, obj_matrix)

    # Define Y_UP based on vertical axis
    if vertical_axis == 'Y':
        y_up = Vector((0.0, 1.0, 0.0))
        vertical_pos = world_centroid.y
    elif vertical_axis == 'Z':
        y_up = Vector((0.0, 0.0, 1.0))
        vertical_pos = world_centroid.z
    else:  # 'X'
        y_up = Vector((1.0, 0.0, 0.0))
        vertical_pos = world_centroid.x

    # Check walk condition
    dot_y = world_normal.dot(y_up)
    if dot_y > 0.6:
        # Sub-classify walk by vertical position
        if mountain_max_y is not None:
            base_threshold = mountain_max_y * 0.1
            summit_threshold = mountain_max_y * 0.85
            if vertical_pos < base_threshold:
                return "walk_base"
            elif vertical_pos > summit_threshold:
                return "walk_summit"
            else:
                return "walk_ledges"
        else:
            return "walk"

    # Check snow condition
    if world_normal.x < -0.1:
        return "snow"

    # Check climb condition
    if abs(dot_y) < 0.3 and world_normal.x > 0:
        return "climb"

    # Default fallback
    return "collision_shell"

def get_mesh_volume(mesh):
    """Estimate mesh volume using bounding box (rough approximation)."""
    if not mesh.vertices:
        return 0.0

    xs = [v.co.x for v in mesh.vertices]
    ys = [v.co.y for v in mesh.vertices]
    zs = [v.co.z for v in mesh.vertices]

    dx = max(xs) - min(xs)
    dy = max(ys) - min(ys)
    dz = max(zs) - min(zs)

    return dx * dy * dz

def get_mesh_centroid(mesh):
    """Get approximate centroid of mesh."""
    if not mesh.vertices:
        return Vector((0, 0, 0))

    avg = sum((v.co for v in mesh.vertices), Vector()) / len(mesh.vertices)
    return avg

# ===== MAIN WORKFLOW =====

def main():
    log_progress("=" * 60)
    log_progress("MOUNTAIN TAGGER START")
    log_progress("=" * 60)

    # Step 1: Clear scene
    log_progress("Clearing scene...")
    clear_scene()

    # Step 2: Import GLB
    log_progress(f"Importing {INPUT_GLB}...")
    if not os.path.exists(INPUT_GLB):
        log_progress(f"ERROR: {INPUT_GLB} not found")
        sys.exit(1)

    bpy.ops.import_scene.gltf(filepath=INPUT_GLB)
    log_progress(f"Imported. Objects in scene: {len(bpy.data.objects)}")

    # Find the main mesh object (geometry_0)
    mesh_obj = None
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            mesh_obj = obj
            break

    if mesh_obj is None:
        log_progress("ERROR: No mesh object found in GLB")
        sys.exit(1)

    log_progress(f"Found mesh object: {mesh_obj.name}")

    # Step 3: Apply transforms
    log_progress("Applying object transforms...")
    bpy.context.view_layer.objects.active = mesh_obj
    mesh_obj.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    log_progress("Transforms applied")

    # Step 4: Use full imported mesh as main body (no loose-part separation).
    # TRELLIS-generated GLBs have hundreds of disconnected micro-fragments; separating
    # them causes the "main body" to be a small sliver. Tag the whole mesh instead.
    main_body = mesh_obj
    main_body_volume = get_mesh_volume(main_body.data)
    log_progress(f"Main body: {main_body.name}, volume={main_body_volume:.4f}")

    # Lock axes: Blender's glTF importer defaults to +Y Up and does NOT convert to Z-up,
    # so the vertical axis is Y. Do not auto-detect — the mesh's longest extent is not
    # necessarily its height for a rotated/weirdly-bounded asset.
    vertical_axis = 'Y'
    verts = main_body.data.vertices
    mountain_max_y = max([v.co.y for v in verts]) if verts else 0.0
    log_progress(f"Vertical axis (locked): Y. Mountain max Y: {mountain_max_y:.4f}")

    # No pre-qualified boulders; boulder detection falls back to AABB-only (see Step 7)
    qualified_boulders = []

    # Step 5: Tag faces on main body
    log_progress("Tagging faces on main body...")

    # Open bmesh directly from mesh data (no mode switching)
    bm = bmesh.new()
    bm.from_mesh(main_body.data)

    # Store face tags in a custom layer
    bm.faces.ensure_lookup_table()
    tag_layer = bm.faces.layers.string.new("tag")

    cave_aabb = CAVE_AABB.copy()
    faces_by_tag = {
        "walk_base": [],
        "walk_ledges": [],
        "walk_summit": [],
        "climb": [],
        "snow": [],
        "cave": [],
        "collision_shell": [],
    }

    for face in bm.faces:
        tag = classify_face(face, main_body.matrix_world, cave_aabb, TAG_OVERRIDES, mountain_max_y, vertical_axis)
        face[tag_layer] = tag.encode('utf-8')
        if tag not in faces_by_tag:
            faces_by_tag[tag] = []
        faces_by_tag[tag].append(face)

    log_progress(f"Face tags: walk_base={len(faces_by_tag.get('walk_base', []))}, "
                 f"walk_ledges={len(faces_by_tag.get('walk_ledges', []))}, "
                 f"walk_summit={len(faces_by_tag.get('walk_summit', []))}, "
                 f"climb={len(faces_by_tag['climb'])}, "
                 f"snow={len(faces_by_tag['snow'])}, "
                 f"cave={len(faces_by_tag['cave'])}, "
                 f"collision_shell={len(faces_by_tag['collision_shell'])}")

    # Check if cave detection failed
    if len(faces_by_tag['cave']) == 0:
        log_progress("WARNING: No faces in cave AABB. Expanding by 20% and retrying...")
        cave_aabb = expand_aabb(CAVE_AABB, 1.2)

        for face in bm.faces:
            current_tag = face[tag_layer].decode('utf-8')
            if current_tag != 'cave':
                world_centroid = compute_face_world_centroid(face, main_body.matrix_world)
                if aabb_contains_point(cave_aabb, world_centroid):
                    face[tag_layer] = b'cave'
                    faces_by_tag['cave'].append(face)

        if len(faces_by_tag['cave']) == 0:
            log_progress("CAVE_DETECTION_FAILED: No faces found even after expansion")
        else:
            log_progress(f"Expanded AABB found {len(faces_by_tag['cave'])} cave faces")

    bm.to_mesh(main_body.data)
    bm.free()

    log_progress("Face tagging complete")

    # Step 6: Separate by tag (including walk sub-tags)
    log_progress("Separating mesh by face tags...")
    tagged_objects = {}

    # Process all tags including walk sub-tags
    tags_to_process = ["walk_base", "walk_ledges", "walk_summit", "climb", "snow", "cave", "collision_shell"]

    for tag in tags_to_process:
        # Load the current mesh data
        bm = bmesh.new()
        bm.from_mesh(main_body.data)
        bm.faces.ensure_lookup_table()
        tag_layer = bm.faces.layers.string["tag"]

        # Deselect all
        for face in bm.faces:
            face.select = False

        # Select faces with this tag
        selected_count = 0
        for face in bm.faces:
            if face[tag_layer].decode('utf-8') == tag:
                face.select = True
                selected_count += 1

        if selected_count == 0:
            log_progress(f"Tag {tag}: 0 faces, skipping")
            bm.free()
            continue

        bm.to_mesh(main_body.data)
        bm.free()

        # Enter edit mode, separate, exit edit mode
        bpy.context.view_layer.objects.active = main_body
        main_body.select_set(True)

        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='DESELECT')
        bpy.ops.object.mode_set(mode='OBJECT')

        # Re-read mesh to set selection properly
        bm = bmesh.new()
        bm.from_mesh(main_body.data)
        bm.faces.ensure_lookup_table()
        tag_layer = bm.faces.layers.string["tag"]

        for face in bm.faces:
            face.select = (face[tag_layer].decode('utf-8') == tag)

        bm.to_mesh(main_body.data)
        bm.free()

        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.object.mode_set(mode='OBJECT')

        # Now separate in edit mode
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.separate(type='SELECTED')
        bpy.ops.object.mode_set(mode='OBJECT')

        # Find the new object created by separation
        new_objs = [obj for obj in bpy.data.objects if obj.type == 'MESH' and obj.name.startswith('geometry_')]
        if len(new_objs) > 1:
            # The newly created object should be the last one selected
            new_obj = bpy.context.selected_objects[-1] if bpy.context.selected_objects else new_objs[-1]
            if new_obj != main_body:
                tagged_objects[tag] = [new_obj]
                log_progress(f"Separated {tag}: {new_obj.name} ({selected_count} faces)")

    # Deselect all for cleanliness
    bpy.ops.object.select_all(action='DESELECT')

    # Walk clustering is now done at face level during tagging; just rename the separated objects
    log_progress("Renaming walk objects...")
    walk_renamed = []
    for cluster in ["base", "ledges", "summit"]:
        tag = f"walk_{cluster}"
        objs = tagged_objects.get(tag, [])
        for i, obj in enumerate(objs):
            new_name = f"walk_{cluster}" if len(objs) == 1 else f"walk_{cluster}_{i+1}"
            obj.name = new_name
            walk_renamed.append(obj)
            log_progress(f"Renamed walk object to {new_name}")

    # Step 6b: Process climb_ faces for route clustering (by X centroid)
    log_progress("Clustering climb faces...")
    climb_objects = tagged_objects.get("climb", [])
    climb_left = []
    climb_right = []

    for obj in climb_objects:
        if obj.data.vertices:
            centroid = sum((v.co for v in obj.data.vertices), Vector()) / len(obj.data.vertices)
            log_progress(f"Climb object {obj.name}: centroid.x={centroid.x:.4f}")
            if centroid.x < 0:
                climb_left.append(obj)
            else:
                climb_right.append(obj)

    log_progress(f"Climb clustering: left={len(climb_left)}, right={len(climb_right)}")

    # Rename climb objects
    climb_renamed = []
    # Route A = left (negative X)
    for i, obj in enumerate(climb_left):
        new_name = "climb_face_a" if len(climb_left) == 1 else f"climb_face_a_{i+1}"
        obj.name = new_name
        climb_renamed.append(obj)
        log_progress(f"Renamed climb object to {new_name}")

    # Route B = right (positive X), but only if we have two routes
    for i, obj in enumerate(climb_right):
        if len(climb_left) > 0:
            new_name = "climb_face_b" if len(climb_right) == 1 else f"climb_face_b_{i+1}"
        else:
            new_name = "climb_face_a" if len(climb_right) == 1 else f"climb_face_a_{i+1}"
        obj.name = new_name
        climb_renamed.append(obj)
        log_progress(f"Renamed climb object to {new_name}")

    # Step 6c: Rename snow, cave, collision_shell
    for tag in ["snow", "cave", "collision_shell"]:
        objects = tagged_objects.get(tag, [])
        for i, obj in enumerate(objects):
            if tag == "collision_shell":
                obj.name = "collision_shell"
            else:
                new_name = f"{tag}_interior" if tag == "cave" else f"{tag}_descent"
                obj.name = new_name

    log_progress(f"Renamed walk/climb/snow/cave objects")

    # Step 7: Boulder detection via AABB fallback (no loose-part separation was done)
    log_progress("Boulder detection via AABB fallback...")
    boulder_candidates = []

    bm = bmesh.new()
    bm.from_mesh(main_body.data)

    selected_boulder_faces = 0
    for face in bm.faces:
        centroid = compute_face_world_centroid(face, main_body.matrix_world)
        if aabb_contains_point(BOULDER_AABB_FALLBACK, centroid):
            face.select = True
            selected_boulder_faces += 1

    bm.to_mesh(main_body.data)
    bm.free()

    if selected_boulder_faces > 0:
        bpy.context.view_layer.objects.active = main_body
        main_body.select_set(True)
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.separate(type='SELECTED')
        bpy.ops.object.mode_set(mode='OBJECT')
        new_objs = [obj for obj in bpy.data.objects if obj.type == 'MESH' and obj != main_body and obj not in walk_renamed and obj not in climb_renamed]
        if new_objs:
            boulder_obj = new_objs[-1]
            boulder_candidates.append(boulder_obj)
            log_progress(f"AABB boulder created: {boulder_obj.name} ({selected_boulder_faces} faces)")
    else:
        log_progress("No faces in BOULDER_AABB_FALLBACK (0 selected)")
        log_progress("NO_BOULDERS_DETECTED: boulders will be added as separate assets in E5")

    boulder_candidates.sort(key=lambda obj: get_mesh_centroid(obj.data).x)
    for i, obj in enumerate(boulder_candidates):
        obj.name = f"boulder_auto_{i+1:02d}"
        log_progress(f"Renamed boulder to {obj.name}")

    log_progress(f"Boulder count: {len(boulder_candidates)}")

    # Step 8: No Y translation in tagger.
    # Blender's glTF exporter rewrites Y as -Z, so `obj.location.y -= X` here ends up
    # as a Z translation in the output GLB (wrong axis). Grounding is handled at
    # runtime in Mountain.tsx via bounding-box computation on the loaded scene.
    log_progress("Skipping Y-grounding translation (handled at runtime in Mountain.tsx).")

    # Step 9: Export to GLB
    log_progress(f"Exporting to {OUTPUT_GLB}...")

    # Select all mesh objects
    bpy.ops.object.select_all(action='DESELECT')
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            obj.select_set(True)

    try:
        # Try with export_selection parameter (Blender 5.x)
        bpy.ops.export_scene.gltf(
            filepath=OUTPUT_GLB,
            export_format='GLB',
            export_apply=True,
            export_materials='NONE',
            export_selection=False,
            check_existing=False,
        )
    except TypeError:
        # Fallback: try with use_selection parameter
        try:
            bpy.ops.export_scene.gltf(
                filepath=OUTPUT_GLB,
                export_format='GLB',
                export_apply=True,
                export_materials='NONE',
                use_selection=False,
                check_existing=False,
            )
        except Exception as e:
            log_progress(f"ERROR: Export failed with both export_selection and use_selection: {e}")
            sys.exit(1)
    except Exception as e:
        log_progress(f"ERROR: Export failed: {e}")
        sys.exit(1)

    if not os.path.exists(OUTPUT_GLB):
        log_progress(f"ERROR: Export did not create file at {OUTPUT_GLB}")
        sys.exit(1)

    file_size_mb = os.path.getsize(OUTPUT_GLB) / (1024 * 1024)
    log_progress(f"✓ Exported to {OUTPUT_GLB} ({file_size_mb:.2f} MB)")

    # Step 10: Print summary
    log_progress("")
    log_progress("=" * 60)
    log_progress("FINAL OBJECT LIST:")
    log_progress("=" * 60)

    object_list = {}
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            # Extract prefix
            parts = obj.name.split('_')
            if len(parts) >= 1:
                prefix = parts[0]
                if prefix not in object_list:
                    object_list[prefix] = []
                object_list[prefix].append(obj.name)

    for prefix in sorted(object_list.keys()):
        names = sorted(object_list[prefix])
        log_progress(f"{prefix}:")
        for name in names:
            log_progress(f"  - {name}")

    log_progress("")
    log_progress("=" * 60)
    log_progress("MOUNTAIN TAGGER COMPLETE")
    log_progress(f"Output file size: {file_size_mb:.2f} MB")
    log_progress("=" * 60)

if __name__ == "__main__":
    main()

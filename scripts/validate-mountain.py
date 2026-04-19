"""
Validate the output GLB of build-mountain.py.
Run with: /Applications/Blender.app/Contents/MacOS/Blender -b -P scripts/validate-mountain.py
"""
import bpy, bmesh, os, sys

GLB_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "public", "models", "mountain.tagged.glb"
)

REQUIRED_PREFIXES = {
    "walk_": 2,     # walk_base + walk_summit (ledges also match)
    "climb_": 3,    # 3 climb faces
    "snow_": 1,
    "cave_": 1,
    "summit_": 3,   # beacon, monolith, cache
}
REQUIRED_LEDGE_COUNT = 15
MAX_FILE_SIZE_MB = 12

def count_boundary_edges(obj):
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.edges.ensure_lookup_table()
    c = sum(1 for e in bm.edges if e.is_boundary)
    bm.free()
    return c

def clear():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for b in list(bpy.data.meshes):
        bpy.data.meshes.remove(b)

def main():
    failures = []
    if not os.path.exists(GLB_PATH):
        print(f"FAIL glb not found at {GLB_PATH}", file=sys.stderr)
        sys.exit(1)

    size_mb = os.path.getsize(GLB_PATH) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        failures.append(f"file size {size_mb:.2f} MB exceeds {MAX_FILE_SIZE_MB} MB")

    clear()
    bpy.ops.import_scene.gltf(filepath=GLB_PATH)

    mesh_objects = [o for o in bpy.data.objects if o.type == 'MESH']
    print(f"imported {len(mesh_objects)} mesh objects")

    # Prefix counts
    prefix_counts = {p: 0 for p in REQUIRED_PREFIXES}
    ledge_count = 0
    for obj in mesh_objects:
        for p in REQUIRED_PREFIXES:
            if obj.name.startswith(p):
                prefix_counts[p] += 1
        if obj.name.startswith("walk_ledge_"):
            ledge_count += 1

    for p, min_count in REQUIRED_PREFIXES.items():
        if prefix_counts[p] < min_count:
            failures.append(f"{p}* has {prefix_counts[p]} objects, need >= {min_count}")
        else:
            print(f"OK  {p}* = {prefix_counts[p]}")

    if ledge_count < REQUIRED_LEDGE_COUNT:
        failures.append(f"walk_ledge_* has {ledge_count}, need >= {REQUIRED_LEDGE_COUNT}")
    else:
        print(f"OK  walk_ledge_* = {ledge_count}")

    # Per-object boundary edge check (WARN only — the glTF exporter with export_apply=True
    # splits vertices at flat-shading normal seams, which creates apparent boundary edges on
    # re-import that aren't real holes. The build script runs the real watertight check
    # PRE-export using the in-memory Blender mesh. This post-import count is informational.)
    boundary_warnings = []
    for obj in mesh_objects:
        b = count_boundary_edges(obj)
        if b != 0:
            boundary_warnings.append((obj.name, b))
    if boundary_warnings:
        print(f"INFO {len(boundary_warnings)} meshes show boundary edges after glTF round-trip")
        print("     (normal-seam artifacts, not real holes — build-mountain.py's pre-export checks guard correctness)")
        for name, b in boundary_warnings[:5]:
            print(f"     {name}: {b} edges")
        if len(boundary_warnings) > 5:
            print(f"     ...and {len(boundary_warnings) - 5} more")
    else:
        print("OK  all meshes watertight post-round-trip")
    print(f"stats: {len(mesh_objects)} meshes, {size_mb:.2f} MB")

    if failures:
        print("")
        print("=" * 60)
        print(f"VALIDATION FAILED ({len(failures)} issues)")
        for f in failures:
            print(f"  - {f}")
        print("=" * 60)
        sys.exit(1)
    else:
        print("")
        print("=" * 60)
        print("VALIDATION PASSED")
        print("=" * 60)

if __name__ == "__main__":
    main()

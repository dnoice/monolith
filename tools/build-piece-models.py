"""
✒ Metadata
    - Title: Piece Models Builder (MONOLITH Edition - v1.0)
    - File Name: build-piece-models.py
    - Relative Path: tools/build-piece-models.py
    - Artifact Type: python
    - Version: 1.0.1
    - Date: 10/30/2026
    - Update: Friday, October 30, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.0.1 (10/30/2026) [dendogg + Anthropic - Claude Opus 5.5] — Header
      only: records that the page's pieces have moved on from these models
      (the knight's bowed blocks, obsidian's softer clearcoat) and that the
      drift guard now stops a rebuild until parts() and WORLD follow.
    - 1.0.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release, for Dennis's request to have the game's 3D chess pieces as
      .blend files: builds the six pieces in Blender from the numbers the
      page builds them with, in marble and obsidian, as one file per piece
      and a file of the whole set.

✒ Description:
    The page draws its 3D pieces in code (js/scene/board.js): five are a
    side profile turned on a lathe, the knight a turned base with six
    blocks for its head. This Blender script builds the same pieces as
    .blend files: the profiles, read from board.js at run time, through
    three.js's own spline sampling (SplineCurve.getPoints at six points a
    knot, uniform Catmull-Rom, the ends pulled onto the axis) and a Screw
    modifier of the lathe's 40 steps; the boxes and spheres at the sizes
    and places parts() writes out, checked against board.js's own lines
    before anything is built, so a change there stops the build rather
    than drifting from it. The marble and obsidian materials copy the
    numbers of js/scene/materials.js and js/scene/worlds.js by hand
    (nothing checks them), with a "world" value in each that moves every
    number between the cathedral (0) and MONOLITH (1).

✒ Key Features:
    - Files, organised as Dennis's pillar files are:
        - piece-pawn.blend … piece-king.blend: one piece in both woods, a
          collection for each (piece-pawn-marble, piece-pawn-obsidian)
          holding a root empty named for it and its parts as children, and
          a review collection: the pillar files' room, lights, mirror floor
          and a camera, at the pieces' scale. Rendered with Cycles.
        - pieces.blend: all twelve, a square apart, pawn to king, marble in
          front, and nothing else.
    - Every model collection carries a glTF for MONOLITH exporter that
      writes piece-{name}-{wood}.glb beside the .blend, as if the piece
      stood at the origin, modifiers applied.
    - Editable: the turned part is its profile, a line of vertices, under
      a live Screw modifier; the parts that repeat (merlons, pearls, ears)
      share one mesh each, and both woods share every mesh, the wood being
      set on the object.
    - The names are the page's: {piece}-{wood}-body, -base (the knight's
      turned part), -merlon-01 … -06, -pearl-01 … -06, -finial,
      -cross-upright, -cross-arm, -neck, -head, -muzzle, -ear-01, -ear-02,
      -mane.
    - Axes: the page's Y-up becomes Blender's Z-up; a piece faces Blender's
      -Y, as the page's black pieces face +Z (the page turns the white ones
      half round).
    - Nothing of this machine in the files: the render output is beside
      the .blend (//), and the File Browser's remembered folder is blanked
      the way assets/models/MANIFEST.md describes.
    - A file already in the folder is kept, not overwritten, unless
      --force is given: it may hold work done on it since (Blender never
      writes the same bytes twice, so a rebuilt file cannot be told from an
      edited one by comparing them).

✒ Usage Instructions:
    Run with Blender 5.2 or newer from the project folder:
        blender --background --python tools/build-piece-models.py -- [out-folder] [--force] [pawn knight … set]
    The folder defaults to assets/models/; the names default to all six and
    the set. Blender's Python module (pip install bpy) runs it the same
    way:
        python tools/build-piece-models.py -- assets/models
    Then open a piece and export it with its collection's exporter
    (Properties › Collection › Exporters › glTF for MONOLITH › Export).

✒ Other Important Information:
    - Dependencies: Blender 5.2 (bpy, bmesh, mathutils, the bundled glTF
      add-on); js/scene/board.js, whose PROFILES, lathe() and buildPiece()
      it reads; nothing else.
    - The page does not load these files: it still builds its pieces in
      code. They are sources for work in Blender and for a page that one
      day loads its pieces as models.
    - Checked against three.js r147 when written (10/24/2026): every
      exported piece's vertices matched the page's own, built by
      board.js's own lines, to 1.5e-7.
    - Known gap (10/30/2026): the page's pieces have moved on from these
      models, and the script has not followed. The page's knight draws its
      neck, head, muzzle, ears and mane as block() shapes, boxes whose
      faces bow out (a superellipsoid, n = 4, in the same bounds), where
      parts() builds plain boxes; obsidian's clearcoat is 0.22 rough on
      the page and 0.08 here (WORLD's coat_rough). The drift guard in
      read_board() no longer finds the knight's five BoxGeometry lines in
      board.js, so any run, even of the pawn alone, stops with "update
      parts()" before it builds anything; in assets/models/,
      piece-knight.blend and pieces.blend still hold the box knight, and
      the built files the 0.08 coat.
    - Compatible platforms: Windows, macOS and Linux, wherever Blender 5.2
      runs.
---------
"""
import bpy, bmesh, sys, os, re, json, math, hashlib, tempfile, shutil
from mathutils import Vector, Matrix, Euler
from bpy_extras.object_utils import world_to_camera_view

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOARD = os.path.join(REPO, 'js', 'scene', 'board.js')
NAMES = [('p', 'pawn'), ('n', 'knight'), ('b', 'bishop'), ('r', 'rook'), ('q', 'queen'), ('k', 'king')]
WOODS = ('marble', 'obsidian')   # the page's white and black

# ---------- the pieces, from js/scene/board.js ----------
def read_board():
    t = open(BOARD, encoding='utf-8').read()
    base = json.loads(re.search(r'const BASE = (\[.*?\]);', t).group(1))
    prof = {k: base + json.loads(re.search(rf'\b{k}: BASE\.concat\((\[.*?\])\)', t).group(1)) for k in ('p', 'r', 'b', 'q', 'k', 'nBase')}
    segs = int(re.search(r'function lathe\(points, segs = (\d+)\)', t).group(1))
    mul = int(re.search(r'curve\.getPoints\(points\.length \* (\d+)\)', t).group(1))
    # the parts below are written out from buildPiece(); stop if board.js no longer says the same
    want = ['BoxGeometry(0.11, 0.14, 0.11)', 'SphereGeometry(0.05, 10, 10)', 'SphereGeometry(0.07, 12, 12)',
            'BoxGeometry(0.06, 0.3, 0.06)', 'BoxGeometry(0.2, 0.06, 0.06)', 'BoxGeometry(0.26, 0.52, 0.22)',
            'BoxGeometry(0.24, 0.24, 0.46)', 'BoxGeometry(0.18, 0.14, 0.16)', 'BoxGeometry(0.06, 0.14, 0.07)',
            'BoxGeometry(0.08, 0.5, 0.14)', 'neck.position.set(0, 0.6, -0.02); neck.rotation.x = -0.32',
            'head.position.set(0, 0.86, 0.1); head.rotation.x = 0.18', 'muz.position.set(0, 0.76, 0.36); muz.rotation.x = 0.3',
            'e1.position.set(-0.07, 1.03, -0.02); e1.rotation.x = -0.3', 'e2.position.set(0.07, 1.03, -0.02); e2.rotation.x = -0.3',
            'mane.position.set(0, 0.6, -0.2); mane.rotation.x = -0.32', 'Math.cos(a) * 0.21, 0.91, Math.sin(a) * 0.21); m.rotation.y = -a',
            "part('finial', GEO.finial).position.y = 1.12", 'Math.cos(a) * 0.19, 1.29, Math.sin(a) * 0.19',
            "part('finial', GEO.finial).position.y = 1.38", 'GEO.crossV).position.y = 1.55', 'GEO.crossH).position.y = 1.6']
    gone = [w for w in want if w not in t]
    if gone: sys.exit('build-piece-models: js/scene/board.js has changed where the parts are written out; update parts(): ' + '; '.join(gone))
    return prof, segs, mul

def _cr(t, p0, p1, p2, p3):   # three.js Interpolations.CatmullRom
    v0 = (p2 - p0) * 0.5; v1 = (p3 - p1) * 0.5; t2 = t * t; t3 = t * t2
    return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1

def lathe_profile(pts, mul):
    """three.js SplineCurve(pts).getPoints(len * mul), then lathe()'s clean-up: the ends on the axis."""
    n = len(pts); div = n * mul; out = []
    for d in range(div + 1):
        p = (n - 1) * d / div; i = math.floor(p); w = p - i
        p0 = pts[i if i == 0 else i - 1]; p1 = pts[i]; p2 = pts[n - 1 if i > n - 2 else i + 1]; p3 = pts[n - 1 if i > n - 3 else i + 2]
        out.append([_cr(w, p0[0], p1[0], p2[0], p3[0]), _cr(w, p0[1], p1[1], p2[1], p3[1])])
    out[0][0] = 0; out[-1][0] = 0
    for q in out: q[0] = max(q[0], 0)
    return out

def parts(kind):
    """buildPiece()'s parts in the page's terms: (name, box or sphere, size, position, rotation x/y)."""
    P = []
    if kind == 'r':
        for i in range(6):
            a = i * math.pi / 3
            P.append((f'merlon-{i + 1:02d}', 'box', (0.11, 0.14, 0.11), (math.cos(a) * 0.21, 0.91, math.sin(a) * 0.21), (0, -a)))
    if kind == 'b': P.append(('finial', 'sphere', (0.07, 12, 12), (0, 1.12, 0), (0, 0)))
    if kind == 'q':
        for i in range(6):
            a = i * math.pi / 3
            P.append((f'pearl-{i + 1:02d}', 'sphere', (0.05, 10, 10), (math.cos(a) * 0.19, 1.29, math.sin(a) * 0.19), (0, 0)))
        P.append(('finial', 'sphere', (0.07, 12, 12), (0, 1.38, 0), (0, 0)))
    if kind == 'k':
        P += [('cross-upright', 'box', (0.06, 0.3, 0.06), (0, 1.55, 0), (0, 0)), ('cross-arm', 'box', (0.2, 0.06, 0.06), (0, 1.6, 0), (0, 0))]
    if kind == 'n':
        P += [('neck', 'box', (0.26, 0.52, 0.22), (0, 0.6, -0.02), (-0.32, 0)), ('head', 'box', (0.24, 0.24, 0.46), (0, 0.86, 0.1), (0.18, 0)),
              ('muzzle', 'box', (0.18, 0.14, 0.16), (0, 0.76, 0.36), (0.3, 0)), ('ear-01', 'box', (0.06, 0.14, 0.07), (-0.07, 1.03, -0.02), (-0.3, 0)),
              ('ear-02', 'box', (0.06, 0.14, 0.07), (0.07, 1.03, -0.02), (-0.3, 0)), ('mane', 'box', (0.08, 0.5, 0.14), (0, 0.6, -0.2), (-0.32, 0))]
    return P

def t2b(v):   # the page's (x, y, z), Y up  ->  Blender's (x, -z, y), Z up
    return Vector((v[0], -v[2], v[1]))

# ---------- the materials, from js/scene/materials.js and js/scene/worlds.js ----------
def lin(h):   # three.js r147, in its legacy colour mode, reads a hex colour as linear values
    return ((h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255, 1.0)

def srgb(h):  # a colour the page converts first (lin() in js/scene/renderer.js)
    c = lambda v: v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    return (c((h >> 16 & 255) / 255), c((h >> 8 & 255) / 255), c((h & 255) / 255), 1.0)

WORLD = {   # WORLD.cathedral / WORLD.monolith: colour, roughness, clearcoat; and what stays the same
    'marble': {'cathedral': (0xe9e4da, 0.36, 0.45), 'monolith': (0xece8ef, 0.34, 0.42), 'coat_rough': 0.3, 'metal': 0.0},
    'obsidian': {'cathedral': (0x15121a, 0.14, 1.0), 'monolith': (0x0f1318, 0.22, 0.7), 'coat_rough': 0.08, 'metal': 0.08},
}

def material(wood):
    W = WORLD[wood]; mat = bpy.data.materials.new(f'material-{wood}'); nt = mat.node_tree; nt.nodes.clear()
    def node(kind, name, loc, label=None):
        n = nt.nodes.new(kind); n.name = name; n.label = label or name.replace('-', ' '); n.location = loc; return n
    def mix(name, a, b, loc, colour=False):
        m = node('ShaderNodeMix', name, loc); m.data_type = 'RGBA' if colour else 'FLOAT'
        nt.links.new(world.outputs[0], m.inputs['Factor'])
        if colour: m.inputs[6].default_value = a; m.inputs[7].default_value = b
        else: m.inputs['A'].default_value = a; m.inputs['B'].default_value = b
        return m
    def math_(name, op, loc, b=None):
        m = node('ShaderNodeMath', name, loc); m.operation = op
        if b is not None: m.inputs[1].default_value = b
        return m
    out = node('ShaderNodeOutputMaterial', 'material-output', (900, 0))
    bsdf = node('ShaderNodeBsdfPrincipled', f'{wood}-surface', (560, 0)); nt.links.new(bsdf.outputs[0], out.inputs['Surface'])
    world = node('ShaderNodeValue', 'world', (-900, 220), 'World: 0 cathedral, 1 MONOLITH'); world.outputs[0].default_value = 0.0
    C, M = W['cathedral'], W['monolith']
    col = mix(f'{wood}-colour', lin(C[0]), lin(M[0]), (-600, 260), colour=True)
    nt.links.new(mix(f'{wood}-roughness', C[1], M[1], (-600, 40)).outputs[0], bsdf.inputs['Roughness'])
    nt.links.new(mix(f'{wood}-clearcoat', C[2], M[2], (-600, -120)).outputs[0], bsdf.inputs['Coat Weight'])
    bsdf.inputs['Coat Roughness'].default_value = W['coat_rough']; bsdf.inputs['Metallic'].default_value = W['metal']; bsdf.inputs['IOR'].default_value = 1.5
    facing = node('ShaderNodeLayerWeight', 'edge-facing', (-900, -320), 'Facing: 0 face on, 1 at the edge'); facing.inputs['Blend'].default_value = 0.5
    if wood == 'marble':
        # the page's form shading: darker toward the silhouette, and in a contact shadow near the base
        p = math_('edge-power', 'POWER', (-600, -320), 2.0); nt.links.new(facing.outputs['Facing'], p.inputs[0])
        k = math_('edge-scale', 'MULTIPLY', (-380, -380), 0.42); nt.links.new(mix('edge-strength', 0.5, 0.9, (-600, -500)).outputs[0], k.inputs[0])
        amt = math_('edge-amount', 'MULTIPLY', (-200, -330)); nt.links.new(k.outputs[0], amt.inputs[0]); nt.links.new(p.outputs[0], amt.inputs[1])
        keep = math_('edge-keep', 'SUBTRACT', (-20, -330)); keep.inputs[0].default_value = 1.0; nt.links.new(amt.outputs[0], keep.inputs[1])
        geo = node('ShaderNodeNewGeometry', 'surface-point', (-900, -700))
        sep = node('ShaderNodeSeparateXYZ', 'surface-height', (-700, -700)); nt.links.new(geo.outputs['Position'], sep.inputs[0])
        rng = node('ShaderNodeMapRange', 'contact-shade', (-420, -720)); rng.interpolation_type = 'SMOOTHSTEP'; rng.clamp = True
        nt.links.new(sep.outputs['Z'], rng.inputs['Value']); rng.inputs['From Min'].default_value = 0.0; rng.inputs['From Max'].default_value = 0.3
        nt.links.new(mix('contact-strength', 0.86, 0.76, (-700, -880)).outputs[0], rng.inputs['To Min']); rng.inputs['To Max'].default_value = 1.0
        shade = math_('form-shade', 'MULTIPLY', (160, -420)); nt.links.new(keep.outputs[0], shade.inputs[0]); nt.links.new(rng.outputs['Result'], shade.inputs[1])
        grey = node('ShaderNodeCombineColor', 'form-shade-colour', (330, -200))
        for i in range(3): nt.links.new(shade.outputs[0], grey.inputs[i])
        tint = node('ShaderNodeMix', 'marble-shaded', (330, 200)); tint.data_type = 'RGBA'; tint.blend_type = 'MULTIPLY'; tint.inputs['Factor'].default_value = 1.0
        nt.links.new(col.outputs[2], tint.inputs[6]); nt.links.new(grey.outputs[0], tint.inputs[7]); nt.links.new(tint.outputs[2], bsdf.inputs['Base Color'])
    else:
        nt.links.new(col.outputs[2], bsdf.inputs['Base Color'])
        # MONOLITH's steel rim, an edge light that keeps the black pieces readable on its dark stage
        p = math_('rim-power', 'POWER', (-600, -320), 2.6); nt.links.new(facing.outputs['Facing'], p.inputs[0])
        amt = math_('rim-amount', 'MULTIPLY', (-380, -320)); nt.links.new(p.outputs[0], amt.inputs[0]); nt.links.new(world.outputs[0], amt.inputs[1])
        k = math_('rim-strength', 'MULTIPLY', (-200, -320), 1.2); nt.links.new(amt.outputs[0], k.inputs[0])
        bsdf.inputs['Emission Color'].default_value = srgb(0xabb5c3); nt.links.new(k.outputs[0], bsdf.inputs['Emission Strength'])
    return mat

# ---------- building ----------
def reset(name):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene; sc.name = name; sc.unit_settings.system = 'METRIC'; sc.unit_settings.scale_length = 1.0
    sc.render.filepath = '//'
    return sc

def collection(name, parent=None):
    c = bpy.data.collections.new(name); (parent or bpy.context.scene.collection).children.link(c); return c

def layer_of(coll, l=None):
    l = l or bpy.context.view_layer.layer_collection
    if l.collection == coll: return l
    for ch in l.children:
        r = layer_of(coll, ch)
        if r: return r

def exporter(coll, glb):
    """The glTF exporter Dennis's pillar files carry, set the same way."""
    bpy.context.view_layer.active_layer_collection = layer_of(coll)
    with bpy.context.temp_override(collection=coll):
        bpy.ops.collection.exporter_add(name='IO_FH_gltf2')
    e = coll.exporters[-1]; e.name = 'glTF for MONOLITH'; p = e.export_properties
    p.filepath = f'//{glb}'; p.export_format = 'GLB'; p.export_apply = True; p.at_collection_center = True

def profile_mesh(name, profile):
    """The turned part's profile as a line of vertices in Blender's XZ plane, at the page's phi 0
    (its +Z, Blender's -Y); the Screw modifier turns it as three.js's LatheGeometry does."""
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    vs = [bm.verts.new((0.0, -x, y)) for x, y in profile]
    for a, b in zip(vs, vs[1:]): bm.edges.new((a, b))
    bm.to_mesh(me); bm.free(); return me

def box_mesh(name, size):   # BoxGeometry(x, y, z), in Blender's axes (x, z, y)
    me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts: v.co = Vector((v.co.x * size[0], v.co.y * size[2], v.co.z * size[1]))
    bm.to_mesh(me); bm.free(); return me

def sphere_mesh(name, r, wseg, hseg):   # SphereGeometry(r, w, h): smooth, its poles on the axis
    me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=wseg, v_segments=hseg, radius=r)
    # three.js starts its rings on -X; Blender's may sit half a step round from there
    step = math.tau / wseg
    off = min(((math.atan2(v.co.y, v.co.x) - math.pi) % step for v in bm.verts if math.hypot(v.co.x, v.co.y) > r * 0.1), key=lambda d: min(d, step - d))
    if min(off, step - off) > 1e-6: bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(-off, 3, 'Z'))
    for f in bm.faces: f.smooth = True
    bm.to_mesh(me); bm.free(); return me

def shared(kind, name, pname):
    return pname.rsplit('-', 1)[0] if pname[-2:].isdigit() else pname   # merlons, pearls and ears share one mesh each

def meshes(kind, name):
    turned = 'base' if kind == 'n' else 'body'
    M = {turned: profile_mesh(f'piece-{name}-{turned}', lathe_profile(PROF['nBase' if kind == 'n' else kind], MUL))}
    for pname, shape, size, pos, rot in parts(kind):
        s = shared(kind, name, pname)
        if s not in M: M[s] = box_mesh(f'piece-{name}-{s}', size) if shape == 'box' else sphere_mesh(f'piece-{name}-{s}', *size)
    return M

def outward(obj):
    dg = bpy.context.evaluated_depsgraph_get(); me = obj.evaluated_get(dg).to_mesh(); score = 0.0
    for p in me.polygons:
        r = Vector((p.center.x, p.center.y, 0))
        if r.length > 1e-3: score += p.normal.dot(r.normalized()) * p.area
    obj.evaluated_get(dg).to_mesh_clear(); return score > 0

def piece(kind, name, wood, coll, mats, M, at):
    root_name = f'piece-{name}-{wood}'
    root = bpy.data.objects.new(root_name, None); root.empty_display_type = 'PLAIN_AXES'; root.empty_display_size = 0.25
    root.location = at; coll.objects.link(root); coll.instance_offset = at
    def part(pname, mesh, pos=(0, 0, 0), rot=(0, 0)):
        o = bpy.data.objects.new(f'{root_name}-{pname}', mesh); coll.objects.link(o); o.parent = root
        o.location = t2b(pos); o.rotation_euler = Euler((rot[0], 0.0, rot[1]))   # the page's X turn is Blender's X; its Y turn, Blender's Z
        if not o.data.materials: o.data.materials.append(None)                  # one slot on the shared mesh
        o.material_slots[0].link = 'OBJECT'; o.material_slots[0].material = mats[wood]
        return o
    turned = 'base' if kind == 'n' else 'body'
    t = part(turned, M[turned]); m = t.modifiers.new('lathe', 'SCREW')
    m.axis = 'Z'; m.angle = math.tau; m.steps = SEGS; m.render_steps = SEGS; m.screw_offset = 0
    m.use_merge_vertices = True; m.merge_threshold = 1e-5; m.use_smooth_shade = True; m.use_normal_calculate = True
    if not outward(t): m.use_normal_flip = True
    assert outward(t), f'{root_name}: faces point inward'
    for pname, shape, size, pos, rot in parts(kind): part(pname, M[shared(kind, name, pname)], pos, rot)
    return [root] + list(root.children)

def frame_views(objs):
    """Every 3D view opens on the pieces, and Layout and Shading show their materials."""
    lo = Vector((1e9,) * 3); hi = -lo; dg = bpy.context.evaluated_depsgraph_get()
    for o in objs:
        if o.type == 'MESH':
            for c in o.evaluated_get(dg).bound_box:
                w = o.matrix_world @ Vector(c); lo = Vector(map(min, lo, w)); hi = Vector(map(max, hi, w))
    for s in bpy.data.screens:
        for ar in s.areas:
            if ar.type != 'VIEW_3D': continue
            sp = ar.spaces[0]; r = sp.region_3d
            r.view_location = (lo + hi) / 2; r.view_distance = (hi - lo).length * 1.25; r.view_perspective = 'PERSP'
            r.view_rotation = Euler((math.radians(72), 0, math.radians(-24))).to_quaternion(); sp.clip_start = 0.01; sp.clip_end = 200
            if s.name in ('Layout', 'Shading'): sp.shading.type = 'MATERIAL'
    return lo, hi

RIG = 0.16   # a king with its cross is 1.7 high, a column 10.4: the pillar files' rig at about a sixth
def review(lo, hi, cam_name):
    rv = collection('review'); sc = bpy.context.scene; s = RIG; soft = (0.7913, 0.8388, 0.9131, 1.0)
    def plane(name, size):
        me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5)
        for v in bm.verts: v.co.x *= size[0]; v.co.y *= size[1]
        bm.to_mesh(me); bm.free(); return me
    def panel(name, size, loc, rot):
        o = bpy.data.objects.new(name, plane(name, size)); rv.objects.link(o); o.location = loc; o.rotation_euler = rot; o.visible_camera = False
        m = bpy.data.materials.new(name); nt = m.node_tree; nt.nodes.clear()
        e = nt.nodes.new('ShaderNodeEmission'); e.inputs['Color'].default_value = soft; e.inputs['Strength'].default_value = 3.2
        nt.links.new(e.outputs[0], nt.nodes.new('ShaderNodeOutputMaterial').inputs[0]); o.data.materials.append(m)
    panel('env-softbox', (24 * s, 24 * s), (0, 0, 31.6 * s), (math.pi, 0, 0))
    panel('env-strip-left', (3.2 * s, 48 * s), (-31.6 * s, 0, 4 * s), (0, math.pi / 2, 0))
    panel('env-strip-right', (3.2 * s, 48 * s), (31.6 * s, 0, 4 * s), (0, -math.pi / 2, 0))
    panel('env-strip-back', (48 * s, 2.4 * s), (0, 31.6 * s, 8 * s), (math.pi / 2, 0, 0))
    floor = bpy.data.objects.new('floor-mirror', plane('floor-mirror', (60 * s, 60 * s))); rv.objects.link(floor)
    fm = bpy.data.materials.new('mirror-floor-dark'); b = fm.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (0.00335, 0.00402, 0.00518, 1.0); b.inputs['Roughness'].default_value = 0.14; floor.data.materials.append(fm)
    for name, loc, rot, energy, colour, size in (('light-key', (6, -12, 12.9), (0.993, 0, 0.464), 6500, (1.0, 0.815, 0.578), 1.222),
                                                 ('light-rim.L', (-8, 7, 6.24), (1.425, 0, -2.29), 3500, (0.578, 0.651, 0.791), 0.995),
                                                 ('light-rim.R', (8, 7, 6.24), (1.425, 0, 2.29), 3500, (0.578, 0.651, 0.791), 0.995)):
        L = bpy.data.lights.new(name, 'SPOT'); L.energy = energy * s * s; L.color = colour; L.spot_size = size; L.spot_blend = 0.6; L.shadow_soft_size = 0.4 * s
        o = bpy.data.objects.new(name, L); rv.objects.link(o); o.location = Vector(loc) * s; o.rotation_euler = rot   # light falls off with distance squared
    w = bpy.data.worlds.new('world-monolith-room'); w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.003677, 0.004777, 0.006512, 1.0); sc.world = w
    # the camera: the pillar files' angle, from the front left and a little above, drawn back until the pieces fit
    cd = bpy.data.cameras.new(cam_name); cd.lens = 44.78; cd.clip_start = 0.05; cd.clip_end = 60
    cam = bpy.data.objects.new(cam_name, cd); rv.objects.link(cam); sc.camera = cam
    sc.render.resolution_x, sc.render.resolution_y = 1440, 1080
    centre = (lo + hi) / 2; d = Vector((-10.252, -21.986, 2.2)).normalized(); cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    corners = [Vector((x, y, z)) for x in (lo.x, hi.x) for y in (lo.y, hi.y) for z in (lo.z, hi.z)]; dist = 2.0
    for _ in range(60):
        cam.location = centre + d * dist; bpy.context.view_layer.update()
        span = max(max(abs(p.x - 0.5), abs(p.y - 0.5)) for p in (world_to_camera_view(sc, cam, c) for c in corners))
        if abs(span - 0.40) < 0.004: break
        dist *= span / 0.40
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 64; sc.view_settings.view_transform = 'AgX'

def clean_and_save(path):
    """The File Browser keeps the last folder it showed; fill the field, then clear it, so no part of
    a path stays in the file (assets/models/MANIFEST.md, Editing a model)."""
    for screen in bpy.data.screens:
        for area in screen.areas:
            for space in area.spaces:
                if space.type == 'FILE_BROWSER' and space.params:
                    space.params.directory = b'.' * 1281; space.params.directory = b''
    bpy.ops.wm.save_as_mainfile(filepath=path, compress=True, relative_remap=True)

def deliver(built, final, force):
    """Into the folder, unless a file is already there and --force was not given."""
    if os.path.exists(final) and not force:
        print('kept (already in the folder; --force replaces it)', final); return
    shutil.copy(built, final); print('wrote', final, os.path.getsize(final), 'bytes, SHA-256', hashlib.sha256(open(final, 'rb').read()).hexdigest())

def build_piece(kind, name, tmp):
    reset(f'piece-{name}'); mats = {w: material(w) for w in WOODS}; M = meshes(kind, name); grp = collection(f'piece-{name}'); objs = []
    for i, wood in enumerate(WOODS):
        c = collection(f'piece-{name}-{wood}', grp); objs += piece(kind, name, wood, c, mats, M, Vector(((i - 0.5) * 0.9, 0, 0)))
        exporter(c, f'piece-{name}-{wood}.glb')
    lo, hi = frame_views(objs); review(lo, hi, f'cam-piece-{name}')
    p = os.path.join(tmp, f'piece-{name}.blend'); clean_and_save(p); return p

def build_set(tmp):
    sc = reset('pieces'); sc.render.engine = 'BLENDER_EEVEE'; mats = {w: material(w) for w in WOODS}; objs = []
    for col, (kind, name) in enumerate(NAMES):
        M = meshes(kind, name); grp = collection(f'piece-{name}')
        for row, wood in enumerate(WOODS):   # a row of each wood, a square apart, pawn to king
            c = collection(f'piece-{name}-{wood}', grp); objs += piece(kind, name, wood, c, mats, M, Vector(((col - 2.5) * 1.0, row * 1.0, 0)))
            exporter(c, f'piece-{name}-{wood}.glb')
    frame_views(objs)
    p = os.path.join(tmp, 'pieces.blend'); clean_and_save(p); return p

if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    force = '--force' in args; args = [a for a in args if a != '--force']
    out = os.path.abspath(args[0]) if args and not args[0] in dict(NAMES).values() and args[0] != 'set' else os.path.join(REPO, 'assets', 'models')
    only = [a for a in args if a in dict(NAMES).values() or a == 'set'] or [n for _, n in NAMES] + ['set']
    PROF, SEGS, MUL = read_board(); os.makedirs(out, exist_ok=True)
    tmp = tempfile.mkdtemp(prefix='piece-models-')
    try:
        for kind, name in NAMES:
            if name in only: deliver(build_piece(kind, name, tmp), os.path.join(out, f'piece-{name}.blend'), force)
        if 'set' in only: deliver(build_set(tmp), os.path.join(out, 'pieces.blend'), force)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

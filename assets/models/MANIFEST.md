<!--
✒ Metadata
    - Title: Models Manifest (MONOLITH Edition - v1.4)
    - File Name: MANIFEST.md
    - Relative Path: assets/models/MANIFEST.md
    - Artifact Type: docs
    - Version: 1.4.0
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.4.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Dennis
      asked for the game's 3D chess pieces as .blend files: a new section,
      The pieces, and rows for piece-pawn.blend … piece-king.blend and
      pieces.blend, built by tools/build-piece-models.py from
      js/scene/board.js's own numbers and checked against the page's
      geometry. The page still builds its pieces in code and loads none of
      them.
    - 1.3.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Dennis
      asked for every asset under assets/, so this folder and everything in
      it moved from models/ to assets/models/; the page fetches from there.
      Nothing in the files changed, and each .blend's exporter still writes
      its .glb beside it (its path is relative to the .blend).
    - 1.2.5 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project, as Dennis chose: the exporter in every .blend, the
      Rook's and pillars.blend's included, is glTF for MONOLITH now, and the
      .blend rows carry the new sizes and hashes. Nothing else in the files
      changed: each opens with the same objects, meshes and materials, and
      its exporter writes the same .glb.
    - 1.2.4 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — Dennis's
      idea, a pillar that looks like one of the pieces: the Rook, the
      game's own rook drawn up into a column and built as one solid. Its
      two files have rows, `pillars.blend` now holds all ten, and the Rook
      joins The pillars and Solid geometry; no style uses it yet. The
      build script now blanks the remembered folder itself, so the files
      it writes arrive clean.
    - 1.2.3 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — Dennis
      asked for his Windows username out of the .blend files before the
      public release. Blender kept it in one place, the folder the Shading
      workspace's File Browser last showed; that folder is blanked in all
      ten files and their rows carry the new sizes and hashes. The models
      are unchanged: each file opens in Blender 5.2 with the same objects,
      meshes and materials and exports the same .glb. Editing a model has
      the step that keeps a re-saved file clean.
    - 1.2.2 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: a model that fails to load is fetched
      again the next time its style is chosen.
    - 1.2.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — Dennis
      had the pillars swapped in: Wizard's Chess 2.9.0 loads them
      (js/scene/pillars.js), so Loading them says how it does and which
      model stands where in each style, in place of "Not wired yet", and
      the cyan glow's bloom is checked.
    - 1.2.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — Two
      more columns, the Solomonic and the Prism, built as Dennis asked as
      solid geometry: each one watertight mesh. A new section gives every
      model's measured solidity, the first seven included, and how to edit
      a fused model.
    - 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — As
      Dennis asked: a .blend of each model now sits beside its .glb, and
      four round columns join the three monoliths, two classic and two
      modern. New sections say how to edit a model and re-export it, and
      how a column goes into a side slot.
    - 1.0.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — Created
      with the three MONOLITH pillars Dennis asked for in Blender.

✒ Description:
    Inventory of the models the page can load at run time, each as a .glb
    with the .blend it was exported from, and what the loading step needs
    to know: which file fits which slot, how each is placed, what its nodes
    and materials are, and what stays as the fallback; and of the game's
    3D pieces as .blend files, which the page does not load.

✒ Key Features:
    - One row per file with its origin, size, triangle count and SHA-256,
      so a later sweep can confirm a file is the one built.
    - The slot each monolith fills, and how a column, built for the centre
      slot, is scaled into the side slots.
    - How to change a model in its .blend and export it again with the
      exporter it carries.
    - The materials by name, matched to MONOLITH's own, and what glTF
      cannot carry.
    - The fallback rule: the built monoliths stay.
    - The 3D pieces: how their files are organised, named and built, and
      how they match the game's own.
    - Each model's measured solidity: meshes, shells, open edges and faces
      passing through each other.

✒ Other Important Information:
    - Dependencies: none; this file is documentation.
    - Compatible platforms: any Markdown renderer; the .blend files open in
      Blender 4.2 or newer (saved by 5.2.2 LTS).
    - The models are built in the Blender workspace, job 2026-011
      (projects/blender/collab/designs/2026-011_wizards-chess-monoliths/),
      whose 03-source/monoliths_build.py writes them to its 05-delivery/
      and copies them here. A rebuild never replaces a file here that was
      changed after it was delivered; it lists it as kept instead.
    - The pieces are built by tools/build-piece-models.py in the project
      itself, from js/scene/board.js, and keep any file already here.
    - Living record: adding or changing rows does not bump this header's
      version; new sections do.
---------
-->

# Manifest — assets/models/

The models the page can load at run time, each a .glb with the .blend it
was exported from. They are generated files: the Blender workspace's job
2026-011 builds them with `03-source/monoliths_build.py` and copies them
here. Change a model in its .blend (see Editing a model) or in that script.

| File | Kind | Origin | License | Notes |
| ---- | ---- | ------ | ------- | ----- |
| `monolith-stele.glb` | export | generated: Blender job 2026-011, `monoliths_build.py` 1.2.0, through `monolith-stele.blend`'s exporter | own work | MONOLITH's centre slot, `01-centre`. 3.4 × 10.4 × 1.16, 1,720 triangles, 38,104 bytes. SHA-256 `5e05d065b27add65f4b4c999fd9cd56c4fa8f9815ceb07919ebee9906c2fe1ac` |
| `monolith-stele.blend` | blend | generated: Blender job 2026-011, `monoliths_build.py` 1.2.0 | own work | The stele alone, cuts and bevels live; exports the .glb above. 101,192 bytes. SHA-256 `eb7109649b35f3f9a94dbb08da7d65c44ac81df181f4871ef13a270539147260` |
| `monolith-rift.glb` | export | generated: Blender job 2026-011, `monoliths_build.py` 1.2.0, through `monolith-rift.blend`'s exporter | own work | The left slot, `02-left`. 2.6 × 8.6 × 0.90, 716 triangles, 16,428 bytes. SHA-256 `db6619fa4d42fc4fbdf035a8f3fbcfeabc7103c43c5624d2b9b2435a3194c01e` |
| `monolith-rift.blend` | blend | generated: Blender job 2026-011, `monoliths_build.py` 1.2.0 | own work | The rift alone; exports the .glb above. 99,744 bytes. SHA-256 `d1a843ad5bed113fc7e5528d2fa569cff95f1d4a2d6524305b3be1c09ef77450` |
| `monolith-spire.glb` | export | generated: Blender job 2026-011, `monoliths_build.py` 1.2.0, through `monolith-spire.blend`'s exporter | own work | The right slot, `03-right`. 2.8 × 9.4 × 0.95, 1,144 triangles, 24,452 bytes. SHA-256 `5ee1f3039e803ff2968195c4f5dac6f9a556c5b1cf2dda94da3a36647c222e4e` |
| `monolith-spire.blend` | blend | generated: Blender job 2026-011, `monoliths_build.py` 1.2.0 | own work | The spire alone; exports the .glb above. 98,726 bytes. SHA-256 `3c4f98ea2d92a1f2bbb13897754b21a3b05802d169bf3acd9e2a64734003fd76` |
| `column-doric.glb` | export | generated: Blender job 2026-011, `monoliths_build.py` 1.2.0, through `column-doric.blend`'s exporter | own work | Classic, for any slot (see Columns in the side slots). 3.4 × 10.4, 4,316 triangles, 95,104 bytes. SHA-256 `7faff9f395b05a8b9d43a25400c4a5699d45b699e6975bb69c31375b0f9e2ad9` |
| `column-doric.blend` | blend | generated: Blender job 2026-011, `monoliths_build.py` 1.2.0 | own work | The Doric column alone; exports the .glb above. 121,710 bytes. SHA-256 `ea64c72412df8d3c79958f722bca29f0c3358c3502fcde245c33cedb6d39bf52` |
| `column-tuscan.glb` | export | generated: Blender job 2026-011, `monoliths_build.py` 1.2.0, through `column-tuscan.blend`'s exporter | own work | Classic. 3.4 × 10.4, 3,890 triangles, 72,572 bytes. SHA-256 `92b428f0eedaecb3d679d0ec41d009de3ae87a773a01677760d214c8061fab80` |
| `column-tuscan.blend` | blend | generated: Blender job 2026-011, `monoliths_build.py` 1.2.0 | own work | The Tuscan column alone; exports the .glb above. 116,574 bytes. SHA-256 `6f890f8a482c81b1b4e1ce9e1edd0c99dd8df1d6009e97885f1856421e9f9204` |
| `column-halo.glb` | export | generated: Blender job 2026-011, `monoliths_build.py` 1.2.0, through `column-halo.blend`'s exporter | own work | Modern. 3.24 × 10.4, 2,672 triangles, 65,460 bytes. SHA-256 `56768753052721cae5f4fd1d1675a999170840a3b3d537622b4ed32b9a7914ba` |
| `column-halo.blend` | blend | generated: Blender job 2026-011, `monoliths_build.py` 1.2.0 | own work | The Halo column alone; exports the .glb above. 107,678 bytes. SHA-256 `9f37cc53ea14224c05c30c9161fe7c31909aabf7176ba76334189f543ecb349f` |
| `column-fin.glb` | export | generated: Blender job 2026-011, `monoliths_build.py` 1.2.0, through `column-fin.blend`'s exporter | own work | Modern. 3.24 × 10.4, 2,820 triangles, 64,212 bytes. SHA-256 `13a0ef569966900c8ecbd523b4dbbc2ab8ed3208505701daf7e7da362fdeb0c5` |
| `column-fin.blend` | blend | generated: Blender job 2026-011, `monoliths_build.py` 1.2.0 | own work | The Fin column alone; exports the .glb above. 105,194 bytes. SHA-256 `ae055047f5474e8e03add807b1e868af897b51cd2980fb1d218f070b6c7df945` |
| `column-solomonic.glb` | export | generated: Blender job 2026-011, `monoliths_build.py` 1.4.0, through `column-solomonic.blend`'s exporter | own work | Classic, one watertight mesh. 3.4 × 10.4, 5,312 triangles, 111,600 bytes. SHA-256 `b71e782e56ce42feed58abc4f6a0f664062ce392ac4d283e6a18d54af4bae82b` |
| `column-solomonic.blend` | blend | generated: Blender job 2026-011, `monoliths_build.py` 1.4.0 | own work | The Solomonic column alone, one fused mesh with a live bevel; exports the .glb above. 155,440 bytes. SHA-256 `9f56d3e162805bf8f96216d2043f1983f35c86b7447f0d31f9fc2fc181effec5` |
| `column-prism.glb` | export | generated: Blender job 2026-011, `monoliths_build.py` 1.4.0, through `column-prism.blend`'s exporter | own work | Modern, one watertight mesh. 3.22 × 2.88 × 10.4, 1,460 triangles, 45,256 bytes. SHA-256 `316be9d914c710df70acf48f20785f67a219cd7d1fa92ad405d145b4a9fc7e42` |
| `column-prism.blend` | blend | generated: Blender job 2026-011, `monoliths_build.py` 1.4.0 | own work | The Prism column alone, one fused mesh with a live bevel; exports the .glb above. 109,699 bytes. SHA-256 `314892e453aa4b73ec060c41f44ff161c63b2e6fd490171a03ae3a3866d469d2` |
| `column-rook.glb` | export | generated: Blender job 2026-011, `monoliths_build.py` 1.5.0, through `column-rook.blend`'s exporter | own work | The game's rook as a pillar, one watertight mesh. 3.4 × 10.4, 4,160 triangles, 86,088 bytes. SHA-256 `b89af77e95ef94e02cd4094e7f5344654a34344839f81c22f0fd243f140d5753` |
| `column-rook.blend` | blend | generated: Blender job 2026-011, `monoliths_build.py` 1.5.0 | own work | The Rook alone, one fused mesh with a live bevel; exports the .glb above. 137,662 bytes. SHA-256 `3b7db7524febd48c4b9e7b6014d4b4da37709dc9fd8c9d3f3b784c63c43efc17` |
| `pillars.blend` | blend | generated: Blender job 2026-011, `monoliths_build.py` 1.5.0 | own work | All ten models side by side, 5 apart, and nothing else: no lights, cameras, floor, room or world. Each model's collection has its own exporter, which writes the same .glb as the model's own file. 252,469 bytes. SHA-256 `692f948fc175d4d46aa8356fac2336688a84a4e39962c1c78b5b98368d008252` |
| `piece-pawn.blend` | blend | generated: `tools/build-piece-models.py` 1.0.0, from `js/scene/board.js` | own work | The game's pawn, in marble and obsidian, with the review room; exports `piece-pawn-marble.glb` and `piece-pawn-obsidian.glb` when asked (none are kept here). 0.72 × 0.81, 6,640 triangles a wood. 103,903 bytes. SHA-256 `d09ea539a3ec74287bf87c17c4f173be76fabf053d2f56670da3779e72ae0753` |
| `piece-knight.blend` | blend | generated: `tools/build-piece-models.py` 1.0.0, from `js/scene/board.js` | own work | The game's knight, in marble and obsidian, with the review room; exports `piece-knight-marble.glb` and `piece-knight-obsidian.glb` when asked (none are kept here). 0.72 × 1.11 × 0.82, 4,300 triangles a wood. 105,649 bytes. SHA-256 `0a423307fe8f37d8436339e2d813df5a228349c3f92701fd3cdb3b3cbf18aa39` |
| `piece-bishop.blend` | blend | generated: `tools/build-piece-models.py` 1.0.0, from `js/scene/board.js` | own work | The game's bishop, in marble and obsidian, with the review room; exports `piece-bishop-marble.glb` and `piece-bishop-obsidian.glb` when asked (none are kept here). 0.72 × 1.19, 6,904 triangles a wood. 107,646 bytes. SHA-256 `c8fff33a8d7ce8339cfd962ed7402add658f4b728488c7a709856de964c2113f` |
| `piece-rook.blend` | blend | generated: `tools/build-piece-models.py` 1.0.0, from `js/scene/board.js` | own work | The game's rook, in marble and obsidian, with the review room; exports `piece-rook-marble.glb` and `piece-rook-obsidian.glb` when asked (none are kept here). 0.72 × 0.98, 5,692 triangles a wood. 104,952 bytes. SHA-256 `31897c0e2d8c878f10d957b5d2626b4782d575d3da16390bd8da196e2c85fa6c` |
| `piece-queen.blend` | blend | generated: `tools/build-piece-models.py` 1.0.0, from `js/scene/board.js` | own work | The game's queen, in marble and obsidian, with the review room; exports `piece-queen-marble.glb` and `piece-queen-obsidian.glb` when asked (none are kept here). 0.72 × 1.45, 7,084 triangles a wood. 110,650 bytes. SHA-256 `f9ce1210b913acbdb7d628f9d7017b5887ee17967b770629adf2a97058987ff2` |
| `piece-king.blend` | blend | generated: `tools/build-piece-models.py` 1.0.0, from `js/scene/board.js` | own work | The game's king, in marble and obsidian, with the review room; exports `piece-king-marble.glb` and `piece-king-obsidian.glb` when asked (none are kept here). 0.72 × 1.70, 6,664 triangles a wood. 104,779 bytes. SHA-256 `5074cf06c867b662b09d8261588b6f5b170bd0cdb4c2e3be1374a953b75c7436` |
| `pieces.blend` | blend | generated: `tools/build-piece-models.py` 1.0.0, from `js/scene/board.js` | own work | All twelve pieces a square apart, pawn to king, marble in front, and nothing else; each piece's collection has its own exporter, which writes the same .glb as the piece's own file. 115,514 bytes. SHA-256 `e05c965843ba232b970a086a6a7b3f4ee52d5353efdb799ae6801d5f16895d10` |

Sizes are width × height × depth in board squares (a column's width is its
widest part, its plinth or foot); steel trim stands 0.04 proud of the
monoliths. Every height includes the 0.15 the game sinks its pillars into
the floor.

## The pillars

The monoliths, one per slot, each at its slot's exact size:

- **Stele** — a slab with two nested panels set into its front, a steel
  frame in the outer one, a small cyan slot above the inner one, a crown
  stepped in two steel tiers and a steel foot band.
- **Rift** — two blades split by a vertical slit, the right one stepped
  lower, a cyan seam glowing deep in the slit, steel caps and a steel foot
  band.
- **Spire** — a tapering slab with three flutes down its front, a hipped
  crown, a steel collar where the crown begins, a steel tip and a steel
  foot band.

The columns, round, each built at the centre slot's size:

- **Doric** (classic) — a shaft of twenty flutes with entasis on a square
  plinth, two steel annulets at its neck, a cushion echinus and a square
  abacus.
- **Tuscan** (classic) — a smooth shaft with entasis on a torus base and a
  square plinth, a steel fillet and astragal, a small echinus and a thin
  abacus.
- **Halo** (modern) — a smooth drum tapering to its crown, on a round
  steel foot, broken a little above mid-height by a recessed cyan band
  between steel rings.
- **Fin** (modern) — twelve tapering blades round a slim core, the core
  lit cyan at its foot between the blades, under a steel collar.
- **Solomonic** (classic) — a four-strand barley-twist shaft making two
  full turns as it tapers, on a torus base and a square plinth, under a
  steel astragal, a cushion echinus and a square abacus.
- **Prism** (modern) — a hexagonal shaft, its corners chamfered, turning
  one facet as it rises, so it meets its steel foot and collar square;
  the chamfers are cyan, six lit lines spiralling up. A low chamfered
  pyramid crowns it.
- **Rook** — the board's own rook as a pillar: the game's rook profile
  (`js/scene/board.js`), turned by the same spline, its rolled steel base
  and its turret at the piece's proportions 4.76 times over and its body
  drawn up; a steel collar under the turret, and six merlons, one to the
  front, round a sunken top, each 30° wide as the piece's are.

From the game's camera the pillars show mostly below the middle: the low
orbit sees about the lower 70 % of the centre one, and only the farthest,
lowest pose (distance 20, phi 1.35) shows one nearly whole. The modern
columns' glow sits where those poses see it.

## Loading them

Wired in 2.9.0 (10/23/2026): `js/scene/pillars.js` loads these in three
styles, chosen in Settings (MONOLITH pillars) or the palette (`:pillars
monoliths`, `classic`, `modern`). Each puts three different designs on the
three places, the newest in the centre:

| Style | `01-centre` | `02-left` | `03-right` |
| ----- | ----------- | --------- | ---------- |
| Monoliths | `monolith-stele` | `monolith-rift` | `monolith-spire` |
| Classic | `column-solomonic` | `column-doric` | `column-tuscan` |
| Modern | `column-prism` | `column-halo` | `column-fin` |

The Rook (`column-rook`) is in no style yet. As a column it goes into any
slot the same way, scaled into the side slots.

It follows this placement:

| Slot (sets.js) | x, z, rotation.y | Slot height | Monolith | Column scale |
| -------------- | ---------------- | ----------- | -------- | ------------ |
| `01-centre` | 0, −16, 0 | 10.4 | `monolith-stele.glb` | 1 |
| `02-left` | −10.5, −11.5, 0.55 | 8.6 | `monolith-rift.glb` | 0.827 (8.6 ÷ 10.4) |
| `03-right` | 11, −10.5, −0.5 | 9.4 | `monolith-spire.glb` | 0.904 (9.4 ÷ 10.4) |

- **Loader:** three.js r147's GLTFLoader. No Draco, so no DRACOLoader.
- **The .blend files are not for the page:** load only the .glb files.
- **Monoliths at scale 1.** One unit is one board square, and each is
  built at its slot's width and height, with the depth the built monoliths
  use (a third of the width, never under 0.9).
- **Placement:** the origin is the bottom centre. Put the loaded scene at
  (x, floorY − 0.15 × scale, z) with rotation.y and the scale from the
  table (scale 1 for a monolith), or add it to the slot's
  `monolith-{slot}` group, already at (x, floorY, z) and turned, at
  y = −0.15 × scale. The bottom then stands in the floor as the built bases
  do, and the top is where the built cap's top is.
- **Facing:** the front faces +Z, toward the board, the side the built
  monoliths' face panel is on. The columns are round; only their square
  plinths and abacuses have a facing.
- **Nodes:** one root per file, named for it (`monolith-stele`,
  `column-doric`), with its meshes as children and no transform on any
  node.
- **Shadows:** the files carry none of three's flags; set `castShadow` and
  `receiveShadow` on every mesh, as `mesh(…, true, true)` does for the
  built ones.

### Columns in the side slots

Each column is built for the centre slot (10.4 tall, 3.4 at its widest).
Scaled evenly by the table's factor it takes a side slot's height; its
bevels, 0.05 everywhere, are still 0.041 at 0.827, above the 0.04 the 2.2.1
note asks for. Scaled, a column is 2.81 wide on the left and 3.07 on the
right, a little wider than the boxes there (2.6 and 2.8). A set can be one
column three times or a mix; the review renders show Doric with Tuscan,
Halo with Fin, and the Rook in all three.

### Materials

| Name | What it is | In the game |
| ---- | ---------- | ----------- |
| `graphite-satin` | The bodies. Base colour 0x1c2129 as written, metalness 0.55, roughness 0.42, clearcoat 0.25 at 0.35 | MO_MAT.monolith's values. Keep it, or put MO_MAT.monolith on these meshes by name. glTF has no envMapIntensity: set 1.2 if it is kept |
| `brushed-steel` | The trim. 0xabb5c3 as sRGB (the game's `lin()`), metalness 1, roughness 0.32 | The steel is modelled, so these meshes need no `steelEdged()` shader, which is written for unit boxes |
| `cyan-glow` | The stele's slot, the rift's seam, Halo's band, Fin's core light and the Prism's chamfer lines. Emissive 0x2cc8d8 as sRGB at strength 1 | INK.cyan. In the page (2.9.0, High tier) it reads as a lit band and stays under the bloom threshold (0.95), so it does not bloom |

- **Colours:** with r147's legacy colour handling the page takes
  `new THREE.Color(0x1c2129)` as linear, and GLTFLoader reads a file's
  colour factors as linear, so `graphite-satin` loads equal to
  MO_MAT.monolith's colour.
- **Clearcoat:** `graphite-satin` uses KHR_materials_clearcoat (used, not
  required), which r147's GLTFLoader reads into a MeshPhysicalMaterial.
- **Sides:** every material is single-sided. The Solomonic, the Prism and
  the Rook are each one closed solid; on the Doric, Tuscan, Halo and Fin,
  a turned part's end that sits against another part is open, covered and
  never seen (see Solid geometry).

### Fallback

The built monoliths stay. Build them as now, and swap a slot's built parts
for its model only once that file has loaded; a file that fails to load
(GLTFLoader's onError) leaves the built monolith standing, and is fetched
again the next time its style is chosen.

## Solid geometry

Measured on 10/23/2026 by `monoliths_build.py --audit` from each model's
.blend, as the game will see it: every mesh, modifiers applied, joined in
the root's space. One closed solid means one shell, no open or
non-manifold edges, no faces wound against their neighbours, no doubled
points, and no face passing through another.

| Model | Meshes | Shells | Open edges | Crossing faces | Doubled points | One closed solid |
| ----- | ------ | ------ | ---------- | -------------- | -------------- | ---------------- |
| `monolith-stele` | 4 | 10 | 0 | 167 | 94 | no |
| `monolith-rift` | 3 | 5 | 0 | 95 | 0 | no |
| `monolith-spire` | 2 | 4 | 0 | 114 | 12 | no |
| `column-doric` | 6 | 7 | 336 | 606 | 0 | no |
| `column-tuscan` | 7 | 8 | 432 | 316 | 96 | no |
| `column-halo` | 3 | 8 | 384 | 240 | 0 | no |
| `column-fin` | 4 | 17 | 192 | 780 | 0 | no |
| `column-solomonic` | 1 | 1 | 0 | 0 | 0 | yes |
| `column-prism` | 1 | 1 | 0 | 0 | 0 | yes |
| `column-rook` | 1 | 1 | 0 | 0 | 0 | yes |

The first seven are assemblies: closed or nearly closed parts that overlap
where they meet, so their surfaces cross inside one another. Nothing of
that shows from outside, and they render correctly, but they are not one
solid. The Solomonic and the Prism are built from closed parts fused by an
exact Boolean union into one mesh, and the Rook's crown is cut from its
turned body by an exact Boolean difference; each is checked before and
after its bevel, and its build stops if either check fails.

## The pieces

The game's 3D chess pieces are kept here as .blend files (10/24/2026). The page still builds its
pieces in code (`js/scene/board.js`) and loads none of these; they are for work in Blender, and for
a page that one day loads its pieces as models. `tools/build-piece-models.py` builds them from that
file's own numbers, read from it each time it runs, so they match the game: checked against
three.js r147 running `board.js`'s own lines, every exported piece's vertices sit within 1.5e-7 of
the page's.

- **Six pieces, two woods.** Each `piece-{name}.blend` holds the piece twice, in marble (the page's
  white) and obsidian (its black), each in its own collection (`piece-pawn-marble`,
  `piece-pawn-obsidian`) under `piece-pawn`: a root empty named for the collection, its parts as
  children, and a glTF for MONOLITH exporter set as the pillars' are (as if at the origin,
  modifiers applied). Both woods share every mesh; the wood is set on each object.
- **The parts keep the page's names:** `-body` (the turned part; the knight's is `-base`, as on the
  page), `-merlon-01` … `-06`, `-pearl-01` … `-06`, `-finial`, `-cross-upright`, `-cross-arm`,
  `-neck`, `-head`, `-muzzle`, `-ear-01`, `-ear-02`, `-mane`. Merlons, pearls and ears share one
  mesh each, as on the page.
- **The turned part is its profile,** a line of vertices sampled as three.js samples the page's
  spline (six points a knot), under a live Screw modifier of the lathe's 40 steps. Move a profile
  vertex and the whole piece follows; the modifier is applied only on export.
- **Axes and size:** a board square is 1, as on the page. The page's Y-up is Blender's Z-up, and a
  piece faces Blender's −Y, as the page's black pieces face +Z (it turns the white ones half round).
- **The two materials,** `material-marble` and `material-obsidian`, carry the page's numbers in both
  worlds: a value node, `world` (0 the cathedral, 1 MONOLITH), moves the colour, roughness and
  clearcoat between `WORLD.cathedral` and `WORLD.monolith` (`js/scene/worlds.js`), and with them
  marble's form shading (darker toward the silhouette and in the contact shadow near the base) and
  obsidian's steel rim, which only MONOLITH lights. Colours are the page's own values, which three.js
  r147 reads as linear.
- **The review room** in each piece's file is the pillars' (the light panels, the mirror floor, a
  key and two rim spots, `world-monolith-room`, a camera framing both woods), at the pieces' scale:
  a sixth of the pillars', the spots' power by the square of that. Cycles, 64 samples.
- **Rebuilding** keeps every file already here, since it may hold work done since; `--force`
  replaces them. A rebuild never writes this machine's paths into a file: the render output is
  `//` and the File Browser's folder is blanked, as Editing a model describes.

## Editing a model

Each .blend holds one model, ready to change and export again:

- **Its collections:** the model's own (`monolith-stele`, `column-doric`),
  which is what exports; on the monoliths, a cutters collection
  (`monolith-stele-cutters`), excluded from the view layer, whose objects
  still make the cuts; and `review`, with a camera, lights, a mirror floor
  and the room's light panels, never exported.
- **Its cuts and bevels are live:** Boolean and Bevel modifiers, applied
  only on export. To change a cut, tick the cutters collection back on,
  move a cutter, and untick it.
- **Export with its exporter, not File › Export:** select the model's
  collection, then Properties › Collection › Exporters › glTF for MONOLITH ›
  Export. It writes `{model}.glb` beside the .blend, with the game's
  settings stored in the file: binary, modifiers applied, Y up, no Draco, no
  cameras or lights. File › Export would also take the cutters, which ride
  on the model's root.
- **Save the .blend too.** The build script will then keep both files here
  rather than replace them, and list them as kept; it replaces them only
  when run with `--overwrite`.
- **Clear Blender's remembered folder before you commit a re-saved .blend.**
  The File Browser in the Shading workspace stores the last folder it
  showed inside the file, and on Windows that folder sits under your user
  folder, so it names your Windows username. Clearing the folder in
  Blender writes only an end marker over the first character and leaves
  the rest of the old path in the file. So the lines below fill the field
  first, then clear it. Paste them into the Python Console (Scripting
  workspace), then save:

  ```python
  for screen in bpy.data.screens:
      for area in screen.areas:
          for space in area.spaces:
              if space.type == 'FILE_BROWSER' and space.params:
                  space.params.directory = b'.' * 1281
                  space.params.directory = b''
  ```

  Showing the Shading workspace again can fill the folder back in, so
  run the lines just before the last save. Files the build script writes
  (`monoliths_build.py` 1.5.0 and later) come with the folder already
  blanked this way.
- **The Solomonic, the Prism and the Rook are each one fused mesh** with
  a live Bevel modifier that rounds only edges carrying a bevel weight.
  Change them in Edit Mode as one mesh (Edge › Edge Bevel Weight to round
  or unround an edge), or change their design in the build script and
  rebuild; their parts were joined, and the Rook's crown cut, when they
  were made.
- **`pillars.blend` holds all ten,** each in its own collection with its
  own exporter, set to export the model as if it stood at the origin, so
  it writes the same .glb as the model's own file. Edit a model in one of
  its two files, not both, or they part.

<!-- ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once! -->

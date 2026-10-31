/*
✒ Metadata
    - Title: Model Packer (MONOLITH Edition - v1.0)
    - File Name: pack-models.mjs
    - Relative Path: tools/pack-models.mjs
    - Artifact Type: javascript
    - Version: 1.0.3
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.0.3 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      models moved with the project's assets, as Dennis asked: the default
      folder is assets/models/.
    - 1.0.2 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Found
      while writing tools/build-emblem.mjs: the default paths now come from
      the script's file path through fileURLToPath. Read from the URL as
      before, they broke on Windows (/C:/… is no Windows path) and wherever
      the folder's path holds a space (%20).
    - 1.0.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.0.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release, written when Dennis's Blender pillars went into the page:
      the published page's host serves no .glb, so it gets the same bytes
      wrapped in JSON.

✒ Description:
    Wraps each assets/models/*.glb in a .glb.json file: the same bytes as
    base64, with the file's name, size and SHA-256. js/scene/pillars.js
    fetches a model as .glb first and, where a host serves no .glb (the
    published artifact), as .glb.json, decoding it back to the identical
    .glb before three.js reads it. Nothing about the model changes; only how
    it travels.

✒ Key Features:
    - One .glb.json per .glb, written to the folder given (by default the
      .glb's own folder).
    - Records name, bytes and SHA-256, and checks that the base64 decodes
      back to the same bytes before writing.
    - Leaves the .glb and the .blend files untouched.

✒ Usage Instructions:
    Run with Node 18 or later from the project folder:
        node tools/pack-models.mjs [models-folder] [out-folder]
    A local working copy does not need the .glb.json files: Live Server
    serves the .glb. Run this when publishing the page, after the models
    change.

✒ Other Important Information:
    - Dependencies: Node's fs, path, crypto and url only.
    - Compatible platforms: any system with Node 18+.
---------
*/
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));   // not the URL's pathname, which breaks on Windows
const SRC = path.resolve(process.argv[2] || path.join(here, '..', 'assets', 'models'));
const OUT = path.resolve(process.argv[3] || SRC);
fs.mkdirSync(OUT, { recursive: true });
const glbs = fs.readdirSync(SRC).filter(f => f.endsWith('.glb')).sort();
if (!glbs.length) { console.error(`no .glb files in ${SRC}`); process.exit(1); }
for (const f of glbs) {
  const bytes = fs.readFileSync(path.join(SRC, f));
  if (bytes.toString('latin1', 0, 4) !== 'glTF') throw new Error(`${f} is not a binary glTF`);
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex'), glb = bytes.toString('base64');
  if (!Buffer.from(glb, 'base64').equals(bytes)) throw new Error(`${f}: base64 does not round-trip`);
  fs.writeFileSync(path.join(OUT, `${f}.json`), JSON.stringify({ name: f, bytes: bytes.length, sha256, glb }) + '\n');
  console.log(`${f}.json  ${bytes.length} bytes  ${sha256.slice(0, 12)}`);
}

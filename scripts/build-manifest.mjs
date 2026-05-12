#!/usr/bin/env node
/**
 * Build manifest.json from the per-script directories under scripts/.
 *
 *   node scripts/build-manifest.mjs
 *
 * Layout convention:
 *   scripts/<id>/<id>.user.js   # script body, must contain ==UserScript== block
 *   scripts/<id>/meta.json      # { id, name, description, author, homepage, tags, preinstall, private }
 *   scripts/<id>/README.md      # optional human-facing docs (not used here)
 *
 * Anything where `meta.json.private === true` (or the directory name starts
 * with `_`) is excluded from the published manifest.
 *
 * Distribution: this repo is published as the npm package
 *   @ziuchen/super-clipboard-userscripts
 * and consumed via npmmirror's CDN-style file URL:
 *   https://registry.npmmirror.com/@ziuchen/super-clipboard-userscripts/<version>/files/<path>
 *
 * `scripts/build-manifest.mjs` is also invoked as a `prepublishOnly` hook
 * so the manifest is always rebuilt right before `npm publish` and packed
 * into the tarball.
 */
import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(HERE);
const SCRIPTS_DIR = join(ROOT, "scripts");
const PKG_PATH = join(ROOT, "package.json");
const OUT_PATH = join(ROOT, "manifest.json");

const PKG = JSON.parse(await readFile(PKG_PATH, "utf8"));
const PKG_NAME = PKG.name;
const PKG_VERSION = PKG.version;

// npmmirror serves arbitrary files from a published version with the path
// pattern below; we pin to the version in package.json so each release is
// content-addressed (callers fetching `latest` get the latest published
// version's manifest, but downloadURLs inside the manifest point at the
// exact version they were generated from).
const MIRROR_BASE = `https://registry.npmmirror.com/${PKG_NAME}/${PKG_VERSION}/files`;

const META_RE = /\/\/\s*@(\S+)\s+(.+?)\s*$/gm;

function parseScriptMeta(source) {
  const m = source.match(/\/\/\s*==UserScript==[\s\S]+?\/\/\s*==\/UserScript==/);
  if (!m) throw new Error("missing ==UserScript== block");
  const out = {};
  for (const match of m[0].matchAll(META_RE)) {
    const [, key, value] = match;
    if (out[key] == null) out[key] = value;
  }
  return out;
}

async function main() {
  const entries = await readdir(SCRIPTS_DIR, { withFileTypes: true });
  const dirs = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  const items = [];
  for (const id of dirs) {
    const dir = join(SCRIPTS_DIR, id);
    const metaPath = join(dir, "meta.json");
    const scriptPath = join(dir, `${id}.user.js`);

    let meta;
    try {
      meta = JSON.parse(await readFile(metaPath, "utf8"));
    } catch {
      console.warn(`[manifest] skip ${id}/: missing or invalid meta.json`);
      continue;
    }

    const isPrivate = meta.private === true || id.startsWith("_");
    let scriptStat;
    try {
      scriptStat = await stat(scriptPath);
    } catch {
      console.warn(`[manifest] skip ${id}/: missing ${id}.user.js`);
      continue;
    }
    if (!scriptStat.isFile()) continue;

    if (isPrivate) {
      console.log(`  [-] ${id}/  (private, skipped)`);
      continue;
    }

    const source = await readFile(scriptPath, "utf8");
    const scriptMeta = parseScriptMeta(source);
    const sha256 = createHash("sha256").update(source).digest("hex");
    const downloadURL = `${MIRROR_BASE}/scripts/${id}/${id}.user.js`;
    items.push({
      id,
      name: meta.name ?? scriptMeta.name ?? id,
      description: meta.description ?? scriptMeta.description,
      author: meta.author ?? scriptMeta.author,
      homepage: meta.homepage,
      version: scriptMeta.version ?? "0.0.0",
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      preinstall: meta.preinstall === true,
      downloadURL,
      updateURL: scriptMeta.updateURL ?? downloadURL,
      sha256,
    });
    console.log(`  [+] ${id}/  v${scriptMeta.version}  ${sha256.slice(0, 12)}…`);
  }

  const manifest = { manifestVersion: 1, items };
  await writeFile(OUT_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(
    `\n[manifest] wrote ${relative(process.cwd(), OUT_PATH)} (${items.length} items, pkg ${PKG_NAME}@${PKG_VERSION})`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

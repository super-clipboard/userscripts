#!/usr/bin/env node
/**
 * Build manifest.json from the per-script directories under scripts/.
 *
 *   node scripts/build-manifest.mjs
 *
 * Layout convention:
 *   scripts/<id>/<id>.user.js   # script body, must contain ==UserScript== block
 *   scripts/<id>/README.md      # optional human-facing docs (not used here)
 *
 * Everything is read from the ==UserScript== header. In addition to the
 * standard directives we recognise two custom ones:
 *
 *   // @tag         text          (repeatable; collected into manifest.tags)
 *   // @tag         ocr
 *   // @preinstall  true          (defaults to false)
 *
 * Directories whose name starts with `_` are skipped (used for `_template`).
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
const MULTI_KEYS = new Set(["tag", "match-clip", "require", "grant"]);

function parseScriptHeader(source) {
  const m = source.match(/\/\/\s*==UserScript==[\s\S]+?\/\/\s*==\/UserScript==/);
  if (!m) throw new Error("missing ==UserScript== block");
  const single = {};
  const multi = {};
  for (const match of m[0].matchAll(META_RE)) {
    const [, key, value] = match;
    if (MULTI_KEYS.has(key)) {
      (multi[key] ??= []).push(value);
    } else if (single[key] == null) {
      single[key] = value;
    }
  }
  return { ...single, ...multi };
}

async function main() {
  const entries = await readdir(SCRIPTS_DIR, { withFileTypes: true });
  const dirs = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((n) => !n.startsWith("_"))
    .sort();

  const items = [];
  for (const id of dirs) {
    const dir = join(SCRIPTS_DIR, id);
    const scriptPath = join(dir, `${id}.user.js`);

    let scriptStat;
    try {
      scriptStat = await stat(scriptPath);
    } catch {
      console.warn(`[manifest] skip ${id}/: missing ${id}.user.js`);
      continue;
    }
    if (!scriptStat.isFile()) continue;

    const source = await readFile(scriptPath, "utf8");
    const header = parseScriptHeader(source);
    const sha256 = createHash("sha256").update(source).digest("hex");
    const downloadURL = `${MIRROR_BASE}/scripts/${id}/${id}.user.js`;
    const tags = Array.isArray(header.tag) ? header.tag : [];
    const preinstall = String(header.preinstall ?? "").toLowerCase() === "true";

    items.push({
      id,
      name: header.name ?? id,
      description: header.description ?? "",
      author: header.author,
      homepage: header.homepage,
      version: header.version ?? "0.0.0",
      tags,
      preinstall,
      downloadURL,
      updateURL: header.updateURL ?? downloadURL,
      sha256,
    });
    console.log(`  [+] ${id}/  v${header.version}  ${sha256.slice(0, 12)}…`);
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

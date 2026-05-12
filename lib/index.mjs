/**
 * @ziuchen/super-clipboard-userscripts
 *
 * Manifest schema and a small set of utilities consumed by the
 * SuperClipboard client. Bundling the package both as a static-file dump
 * and as an importable JS module avoids CDN edge-cases that throttle
 * "static files only" packages.
 */

/**
 * Built-in CDN host presets. Each preset knows how to turn a triplet
 * `(pkg, version, path)` into a URL. The client lets users pick one
 * (or a custom URL template) so they can route around regional outages.
 *
 * `{pkg}` / `{version}` / `{path}` placeholders are substituted verbatim;
 * `{path}` will not start with a slash.
 */
export const mirrorPresets = Object.freeze({
  npmmirror: {
    label: "npmmirror (China)",
    template: "https://registry.npmmirror.com/{pkg}/{version}/files/{path}",
  },
  jsdelivr: {
    label: "jsDelivr",
    template: "https://cdn.jsdelivr.net/npm/{pkg}@{version}/{path}",
  },
  unpkg: {
    label: "unpkg",
    template: "https://unpkg.com/{pkg}@{version}/{path}",
  },
});

/** Path of the manifest within the published tarball. */
export const DEFAULT_MANIFEST_PATH = "manifest.json";

/** Identifier of the npm package itself (kept here for reflection). */
export const PACKAGE_NAME = "@ziuchen/super-clipboard-userscripts";

/**
 * Build a URL pointing at a file inside a published version, using a
 * preset key (see `mirrorPresets`) or a raw template string containing
 * the same `{pkg}/{version}/{path}` placeholders.
 */
export function buildFileURL({
  pkg = PACKAGE_NAME,
  version,
  path,
  preset = "npmmirror",
  template,
} = {}) {
  if (!version) throw new Error("buildFileURL requires { version }");
  if (path == null) throw new Error("buildFileURL requires { path }");
  const tpl = template ?? mirrorPresets[preset]?.template;
  if (!tpl) throw new Error(`unknown mirror preset: ${preset}`);
  const cleanPath = String(path).replace(/^\/+/, "");
  return tpl
    .replace(/\{pkg\}/g, pkg)
    .replace(/\{version\}/g, version)
    .replace(/\{path\}/g, cleanPath);
}

/**
 * Convenience wrapper that resolves the script body URL for a manifest
 * item. If `preset` differs from npmmirror, this rewrites the original
 * `downloadURL` to the chosen mirror.
 */
export function scriptFileURL(item, options = {}) {
  if (!item || typeof item !== "object") throw new Error("scriptFileURL: invalid item");
  const { preset = "npmmirror", template } = options;
  const parsed = parseNpmmirrorURL(item.downloadURL);
  if (!parsed) return item.downloadURL;
  return buildFileURL({
    pkg: parsed.pkg,
    version: parsed.version,
    path: parsed.path,
    preset,
    template,
  });
}

/**
 * Lightweight runtime validator for manifest objects fetched from the
 * network. Throws on schema mismatch so consumers can show a meaningful
 * error instead of crashing later.
 */
export function validateManifest(value) {
  if (!value || typeof value !== "object") {
    throw new TypeError("manifest: not an object");
  }
  if (value.manifestVersion !== 1) {
    throw new TypeError(`manifest: unsupported manifestVersion ${value.manifestVersion}`);
  }
  if (!Array.isArray(value.items)) {
    throw new TypeError("manifest: items is not an array");
  }
  for (const item of value.items) {
    if (!item || typeof item !== "object") throw new TypeError("manifest item: not an object");
    if (typeof item.id !== "string" || !item.id) throw new TypeError("manifest item: missing id");
    if (typeof item.name !== "string" || !item.name)
      throw new TypeError(`item ${item.id}: missing name`);
    if (typeof item.version !== "string" || !item.version) {
      throw new TypeError(`item ${item.id}: missing version`);
    }
    if (typeof item.downloadURL !== "string" || !item.downloadURL) {
      throw new TypeError(`item ${item.id}: missing downloadURL`);
    }
  }
  return value;
}

/** Find a manifest item by id, returning `undefined` when missing. */
export function findScript(manifest, id) {
  if (!manifest || !Array.isArray(manifest.items)) return undefined;
  return manifest.items.find((item) => item.id === id);
}

/**
 * Parse an npmmirror file-mode URL back into `(pkg, version, path)`.
 * Returns `null` when the URL doesn't match the expected shape.
 *
 * Example input:
 *   https://registry.npmmirror.com/@ziuchen/super-clipboard-userscripts/0.1.0/files/scripts/qr/qr.user.js
 *      → { pkg: "@ziuchen/super-clipboard-userscripts", version: "0.1.0", path: "scripts/qr/qr.user.js" }
 */
export function parseNpmmirrorURL(url) {
  if (typeof url !== "string") return null;
  const m = url.match(
    /^https:\/\/registry\.npmmirror\.com\/(@[^/]+\/[^/]+|[^/]+)\/([^/]+)\/files\/(.+)$/,
  );
  if (!m) return null;
  return { pkg: m[1], version: m[2], path: m[3] };
}

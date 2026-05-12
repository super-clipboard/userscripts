import { strict as assert } from "node:assert";
import { test } from "node:test";

import {
  DEFAULT_MANIFEST_PATH,
  PACKAGE_NAME,
  buildFileURL,
  findScript,
  mirrorPresets,
  parseNpmmirrorURL,
  scriptFileURL,
  validateManifest,
} from "../lib/index.mjs";

test("constants are exported", () => {
  assert.equal(DEFAULT_MANIFEST_PATH, "manifest.json");
  assert.equal(PACKAGE_NAME, "@ziuchen/super-clipboard-userscripts");
});

test("mirrorPresets cover the documented options", () => {
  for (const k of ["npmmirror", "jsdelivr", "unpkg"]) {
    assert.ok(mirrorPresets[k]?.template?.includes("{pkg}"), `preset ${k} should reference {pkg}`);
  }
});

test("buildFileURL substitutes placeholders for each preset", () => {
  const args = { version: "1.2.3", path: "scripts/qr/qr.user.js" };
  assert.equal(
    buildFileURL({ ...args, preset: "npmmirror" }),
    "https://registry.npmmirror.com/@ziuchen/super-clipboard-userscripts/1.2.3/files/scripts/qr/qr.user.js",
  );
  assert.equal(
    buildFileURL({ ...args, preset: "jsdelivr" }),
    "https://cdn.jsdelivr.net/npm/@ziuchen/super-clipboard-userscripts@1.2.3/scripts/qr/qr.user.js",
  );
  assert.equal(
    buildFileURL({ ...args, preset: "unpkg" }),
    "https://unpkg.com/@ziuchen/super-clipboard-userscripts@1.2.3/scripts/qr/qr.user.js",
  );
});

test("buildFileURL strips leading slashes from path", () => {
  assert.equal(
    buildFileURL({ version: "1.0.0", path: "/scripts/qr/qr.user.js", preset: "jsdelivr" }),
    "https://cdn.jsdelivr.net/npm/@ziuchen/super-clipboard-userscripts@1.0.0/scripts/qr/qr.user.js",
  );
});

test("buildFileURL accepts a custom template overriding preset", () => {
  assert.equal(
    buildFileURL({
      version: "1.0.0",
      path: "manifest.json",
      template: "https://example.com/{pkg}/{version}/{path}",
    }),
    "https://example.com/@ziuchen/super-clipboard-userscripts/1.0.0/manifest.json",
  );
});

test("buildFileURL throws when version or path is missing", () => {
  assert.throws(() => buildFileURL({ path: "x" }), /version/);
  assert.throws(() => buildFileURL({ version: "1.0.0" }), /path/);
});

test("scriptFileURL rewrites a known npmmirror URL into the chosen mirror", () => {
  const item = {
    id: "qr",
    name: "QR",
    version: "1.0.0",
    downloadURL:
      "https://registry.npmmirror.com/@ziuchen/super-clipboard-userscripts/1.0.0/files/scripts/qr/qr.user.js",
  };
  assert.equal(
    scriptFileURL(item, { preset: "jsdelivr" }),
    "https://cdn.jsdelivr.net/npm/@ziuchen/super-clipboard-userscripts@1.0.0/scripts/qr/qr.user.js",
  );
  // Fallback to original URL when scheme is not the npmmirror file route.
  assert.equal(
    scriptFileURL({ ...item, downloadURL: "https://example.com/x.js" }),
    "https://example.com/x.js",
  );
});

test("parseNpmmirrorURL extracts pkg/version/path", () => {
  assert.deepEqual(
    parseNpmmirrorURL(
      "https://registry.npmmirror.com/@ziuchen/super-clipboard-userscripts/0.1.0/files/scripts/qr/qr.user.js",
    ),
    {
      pkg: "@ziuchen/super-clipboard-userscripts",
      version: "0.1.0",
      path: "scripts/qr/qr.user.js",
    },
  );
  assert.equal(parseNpmmirrorURL("https://example.com/x.js"), null);
});

test("validateManifest accepts a well-formed manifest", () => {
  const m = {
    manifestVersion: 1,
    items: [{ id: "x", name: "X", version: "1.0.0", downloadURL: "https://example.com/x.js" }],
  };
  assert.equal(validateManifest(m), m);
});

test("validateManifest rejects bad shapes", () => {
  assert.throws(() => validateManifest(null), /not an object/);
  assert.throws(() => validateManifest({ manifestVersion: 2, items: [] }), /unsupported/);
  assert.throws(() => validateManifest({ manifestVersion: 1, items: "no" }), /not an array/);
  assert.throws(
    () => validateManifest({ manifestVersion: 1, items: [{ id: "a", name: "A", version: "1" }] }),
    /missing downloadURL/,
  );
});

test("findScript looks up by id and tolerates missing manifest", () => {
  const m = {
    manifestVersion: 1,
    items: [{ id: "a", name: "A", version: "1.0.0", downloadURL: "https://x" }],
  };
  assert.equal(findScript(m, "a")?.name, "A");
  assert.equal(findScript(m, "z"), undefined);
  assert.equal(findScript(undefined, "a"), undefined);
});

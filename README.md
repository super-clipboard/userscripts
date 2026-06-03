# super-clipboard / userscripts

> English ｜ [简体中文](./README.zh-CN.md)

A community-maintained collection of user scripts.

## Repo Layout

```
package.json                      # name = @ziuchen/super-clipboard-userscripts
scripts/<id>/<id>.user.js         # script body, must contain a ==UserScript== block
scripts/<id>/README.md            # optional usage notes / screenshots
scripts/_template/                # copy this directory to start a new script (dirs starting with `_` are skipped)
scripts/build-manifest.mjs        # manifest builder; runs automatically as `prepublishOnly`
.github/workflows/publish.yml     # pushing a `v*` tag → publishes to npm via OIDC
```

## Contributing a Script

1. Copy `scripts/_template/` to `scripts/<your-id>/`. The directory name **is** the script id (kebab-case).
2. Rename `_template.user.js` → `<your-id>.user.js`. Fill in the `==UserScript==` block.
3. The manifest is generated entirely from the `==UserScript==` header — no `meta.json` needed.
4. Open a pull request. After merging, a maintainer will publish a new release.

### UserScript Header Reference

Standard directives (`@name`, `@version`, `@description`, `@author`, `@homepage`, `@namespace`, `@updateURL`, `@require`, `@grant`, `@run-at`) work as in Tampermonkey. Two extras are recognised by the manifest builder:

```
// @match-clip   text          // repeatable: text | image | file
// @match-clip   image
// @tag          ocr           // repeatable: free-form tags shown in the market UI
// @tag          background
// @preinstall   true          // optional, defaults to false
```

### Script API Cheat Sheet

```js
// Register a context-menu command
globalNativeApi.registerMenuCommand("My Command", async (ctx) => {
  if (!ctx.clip) return;
  const body = await globalNativeApi.getClipBody(ctx.clip);
  const text = body?.text ?? body?.preview ?? "";

  // Common operations:
  utools.copyText(text); // write back to clipboard
  globalNativeApi.toast({ title, body }); // show an in-app toast
  document.body.innerHTML = "..."; // build a UI
  await globalNativeApi.showPanel({ width, height, placement: "center" });
});
```

`@match-clip text` (or `image`, `file`) controls when the command is offered.
External libraries can be loaded via `// @require <url>`.

## Local Development

```bash
npm install
npm test                    # node:test, exercises lib/ helpers
npm run build               # generates manifest.json
```

## Release (maintainers only)

```bash
npm version patch          # or minor / major
git push --follow-tags
```

`publish.yml` rebuilds the manifest and publishes to npm via an OIDC trusted publisher.

## License

MIT

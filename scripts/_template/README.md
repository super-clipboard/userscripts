# 示例脚本

这是一个用于演示目录结构的模板。请复制本目录，按以下步骤改写：

1. 把目录改名为你的脚本 id（kebab-case，例如 `slug-converter`）。
2. 同步把 `_template.user.js` 改名为 `<id>.user.js`。
3. 修改 `meta.json` 中的 `id`、`name`、`description`、`tags` 等。
4. 把 `meta.json` 中的 `private` 字段去掉（默认 `false`）。
5. 在 `<id>.user.js` 头部更新 `@updateURL` 指向 jsDelivr 路径。
6. 本地运行 `node scripts/build-manifest.mjs` 重新生成 `manifest.json`。

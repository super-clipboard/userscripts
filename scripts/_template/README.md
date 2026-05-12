# 示例脚本

这是一个用于演示目录结构的模板。请复制本目录，按以下步骤改写：

1. 把目录改名为你的脚本 id（kebab-case，例如 `slug-converter`）。
2. 同步把 `_template.user.js` 改名为 `<id>.user.js`。
3. 修改 `<id>.user.js` 头部的 `@name` / `@description` / `@author` / `@version` / `@tag` / `@match-clip` / `@preinstall` 等字段，所有 manifest 信息都从这里读取，无需 `meta.json`。
4. 本地运行 `node scripts/build-manifest.mjs` 检查输出。

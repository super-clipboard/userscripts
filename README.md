# super-clipboard / userscripts

[SuperClipboard](https://github.com/super-clipboard) 官方用户脚本市场（开源增量集）。

> 本仓库**只放 SuperClipboard 应用未内置的社区脚本**。已内置的脚本（如 QR、另存为、智慧分词、自动 OCR 标记）随 app 版本发布，不在这里维护。

## 客户端如何拉取本仓库

应用内置默认 manifest URL：

```
https://cdn.jsdelivr.net/gh/super-clipboard/userscripts@latest/manifest.json
```

`@latest` 由 jsDelivr 解析为最新 git tag。所以发布流程 = 打 tag + 创建 GitHub Release，jsDelivr 自动更新缓存（亦可访问 `https://purge.jsdelivr.net/...` 主动刷新）。

回落直链（用于无 jsDelivr 时）：

```
https://github.com/super-clipboard/userscripts/releases/latest/download/manifest.json
```

## 仓库结构

```
manifest.json                     # 由 build-manifest 生成；勿手工编辑
scripts/<id>/<id>.user.js         # 脚本主体，需带 ==UserScript== 头
scripts/<id>/meta.json            # 元信息（id/name/description/tags/preinstall/...）
scripts/<id>/README.md            # 可选，使用说明 / 截图
scripts/<id>/CHANGELOG.md         # 可选
scripts/_template/                # 复制本目录开始你的新脚本（id 以 _ 开头会被跳过）
scripts/build-manifest.mjs
.github/workflows/
  lint.yml                        # PR 校验：manifest 是否最新 + 脚本头合法
  release.yml                     # 打 v* tag → 生成 Release + 附带 manifest.json
```

## 添加新脚本

1. 复制 `scripts/_template/` 到 `scripts/<your-id>/`，目录名即脚本 id（kebab-case）。
2. 把 `_template.user.js` 改名为 `<your-id>.user.js`，写好 `==UserScript==` 头（必须包含 `@version`）。
3. 改 `meta.json`：填 `id` / `name` / `description` / `tags` / `preinstall` 等；删除 `private` 字段。
4. 在脚本头加 `// @updateURL  https://cdn.jsdelivr.net/gh/super-clipboard/userscripts@latest/scripts/<your-id>/<your-id>.user.js`。
5. 本地运行 `node scripts/build-manifest.mjs` 重新生成 `manifest.json` 并提交。
6. 提交 PR；通过 lint workflow 后由仓库 maintainer 合并。

## 发布 Release

只有 maintainer 操作：

```bash
node scripts/build-manifest.mjs
git add manifest.json
git commit -m "chore: bump manifest"
git tag v1.2.3 -m "release v1.2.3"
git push origin main --tags
```

`release.yml` 会自动创建对应 GitHub Release 并把 `manifest.json` 作为 asset 上传。jsDelivr 上 `@latest` 在数小时内指向新 tag。

## 版本策略

- `manifestVersion` 在 manifest 顶层，向前兼容用。
- 单个脚本通过 `@version` (semver) 做更新判定。客户端发现远程版本更高时会提示用户更新，**永远不会静默覆盖**。
- 用户在本地修改过的脚本（`installFrom.userModified === true`）更新前会再次确认。

## 开源协议

MIT

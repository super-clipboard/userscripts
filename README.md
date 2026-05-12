# super-clipboard / userscripts

[SuperClipboard](https://github.com/super-clipboard) 官方用户脚本市场（开源增量集）。

> 本仓库**只放 SuperClipboard 应用未内置的社区脚本**。已内置的脚本（QR、另存为、智慧分词、自动 OCR 标记）随 app 版本发布，不在这里维护。

## 分发方式

仓库以 npm 包 `@ziuchen/super-clipboard-userscripts` 发布，客户端通过 npmmirror CDN 拉取：

```
https://registry.npmmirror.com/@ziuchen/super-clipboard-userscripts/latest/files/manifest.json
```

`manifest.json` 不放仓库根目录，由 `prepublishOnly` 钩子自动生成并打进 tarball。每个脚本的 `downloadURL` 会被生成为指向**当前发布版本**的 npmmirror 地址（version-pinned，避免脚本漂移）。

## 仓库结构

```
package.json                      # name=@ziuchen/super-clipboard-userscripts
scripts/<id>/<id>.user.js         # 脚本主体，需带 ==UserScript== 头
scripts/<id>/meta.json            # 元信息（id/name/description/tags/preinstall/...）
scripts/<id>/README.md            # 可选，使用说明 / 截图
scripts/_template/                # 复制本目录开始你的新脚本（_ 前缀目录会被跳过）
scripts/build-manifest.mjs        # 构建器；prepublishOnly 自动调用
.github/workflows/publish.yml     # 推送 v* tag → OIDC 发布到 npm
```

## 添加新脚本

1. 复制 `scripts/_template/` 到 `scripts/<your-id>/`，目录名即脚本 id（kebab-case）。
2. 把 `_template.user.js` 改名为 `<your-id>.user.js`，写好 `==UserScript==` 头（必须包含 `@version`）。
3. 改 `meta.json`：填 `id` / `name` / `description` / `tags` / `preinstall` 等；删除 `private` 字段。
4. 提交 PR；合并后由 maintainer 发布。

## 发布

只有 maintainer 操作：

```bash
npm version patch          # 或 minor/major，自动改 package.json + 打 tag
git push --follow-tags
```

`publish.yml` 会自动构建 manifest 并通过 OIDC trusted publisher 发到 npm，不需要 NPM_TOKEN。
首次发布前需在 npmjs.com 包页面 → Settings → Publishing access → Add trusted publisher，
绑定 `super-clipboard/userscripts` 仓库 + `publish.yml` 工作流。

## 版本策略

- `manifestVersion` 在 manifest 顶层，向前兼容用。
- 单个脚本通过 `@version` (semver) 做更新判定。客户端发现远程版本更高时会提示用户更新，**永远不会静默覆盖**。
- 用户在本地修改过的脚本（`installFrom.userModified === true`）更新前会再次确认。
- 每次 npm 发布都会重新构建 manifest 并 version-pin 所有 `downloadURL`，从而保证安装/更新拉到的脚本字节级一致（`sha256` 内嵌校验）。

## 开源协议

MIT

# super-clipboard / userscripts

> [English](./README.md) ｜ 简体中文

社区维护的用户脚本集合。

## 仓库结构

```
package.json                      # name=@ziuchen/super-clipboard-userscripts
scripts/<id>/<id>.user.js         # 脚本主体，需带 ==UserScript== 头
scripts/<id>/README.md            # 可选，使用说明 / 截图
scripts/_template/                # 复制本目录开始你的新脚本（_ 前缀目录会被跳过）
scripts/build-manifest.mjs        # 构建器；prepublishOnly 自动调用
.github/workflows/publish.yml     # 推送 v* tag → OIDC 发布到 npm
```

## 添加新脚本

1. 复制 `scripts/_template/` 到 `scripts/<your-id>/`，目录名即脚本 id（kebab-case）。
2. 把 `_template.user.js` 改名为 `<your-id>.user.js`，写好 `==UserScript==` 头。
3. manifest 完全从脚本头生成，不需要 `meta.json`。
4. 提交 PR；合并后由 maintainer 发布。

### UserScript 头参考

标准指令（`@name`/`@version`/`@description`/`@author`/`@homepage`/`@namespace`/`@updateURL`/`@require`/`@grant`/`@run-at`）与 Tampermonkey 一致。额外识别两个自定义指令：

```
// @match-clip   text          // 可重复：text | image | file
// @match-clip   image
// @tag          ocr           // 可重复：自由文本 tag，在市场 UI 展示
// @tag          background
// @preinstall   true          // 可选，默认 false
```

### 脚本 API 速览

```js
// 注册一个右键菜单命令
globalNativeApi.registerMenuCommand("命令名", async (ctx) => {
  // ctx.clips 始终是数组：单选时长度 1，多选时按列表顺序的全部选中项
  const target = ctx.clips?.[0];
  if (!target) return;
  const body = await globalNativeApi.getClipBody(target);
  const text = body?.text ?? body?.preview ?? "";
  // ... 处理 text，可选：
  // utools.copyText(text)                                  // 写回剪贴板
  // globalNativeApi.notification({ title, body })          // 弹通知
  // document.body.innerHTML = "..."; await globalNativeApi.showPanel({ width, height, placement })
});
```

## 本地开发

```bash
npm install
npm test                    # node:test，跑 lib/ 的单测
npm run build               # 生成 manifest.json
```

## 发布（仅 maintainer）

```bash
npm version patch          # 或 minor/major
git push --follow-tags
```

`publish.yml` 会自动构建 manifest 并通过 OIDC trusted publisher 发到 npm。

## 协议

MIT

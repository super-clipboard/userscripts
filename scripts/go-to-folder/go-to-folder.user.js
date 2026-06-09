// ==UserScript==
// @name         前往文件夹
// @namespace    com.superclipboard.builtin.go-to-folder
// @version      1.1.0
// @updateURL    https://registry.npmmirror.com/@ziuchen/super-clipboard-userscripts/0.6.1/files/scripts/go-to-folder/go-to-folder.user.js
// @downloadURL  https://registry.npmmirror.com/@ziuchen/super-clipboard-userscripts/0.6.1/files/scripts/go-to-folder/go-to-folder.user.js
// @description  识别剪贴板中的 Unix 绝对路径（/path/to/dir 或 ~/path），在文件管理器中打开对应目录
// @author       SuperClipboard
// @run-at       foreground
// @match-clip   text
// @grant        globalNativeApi.registerMenuCommand
// @grant        globalNativeApi.getClipBody
// @grant        globalNativeApi.toast
// @grant        utools.shellOpenPath
// @tag          text
// @tag          path
// @tag          utility
// ==/UserScript==

// 匹配 Unix 绝对路径（含 ~ 前缀），允许末尾带 /
const PATH_REGEX = /^(?:~?\/[^/\n\r\f\v]+)+\/?$/;

function extractPath(text) {
  const cleaned = text.trim();
  return PATH_REGEX.test(cleaned) ? cleaned : null;
}

globalNativeApi.registerMenuCommand(
  "前往文件夹",
  async (ctx) => {
    const target = ctx.clips?.[0];
    if (!target) return;

    const body = await globalNativeApi.getClipBody(target);
    const text = body?.text || body?.preview || "";
    if (!text) return;

    const path = extractPath(text);
    if (!path) return;

    try {
      utools.shellOpenPath(path);
    } catch (e) {
      globalNativeApi.toast({
        title: "打开失败",
        body: `路径可能不存在: ${path}`,
      });
    }
  },
  {
    /**
     * 同步 matcher — 在 host 侧执行，过滤掉非 Unix 路径文本。
     * matcher 内不能引用外部变量（序列化为 new Function("ctx", body)），
     * 因此正则直接内联在函数体中。
     */
    matcher: function (ctx) {
      const hash = ctx.trigger && ctx.trigger.hash;
      if (!hash) return false;

      const body = ctx.bodies.get(hash);
      if (!body || body.type !== "text") return false;

      const text = body.text || body.preview || "";
      if (!text) return false;

      return /^(?:~?\/[^/\n\r\f\v]+)+\/?$/.test(text.trim());
    },
  },
);

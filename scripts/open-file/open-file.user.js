// ==UserScript==
// @name         打开文件
// @namespace    com.superclipboard.builtin.open-file
// @version      1.0.0
// @updateURL    https://registry.npmmirror.com/@ziuchen/super-clipboard-userscripts/0.6.1/files/scripts/open-file/open-file.user.js
// @downloadURL  https://registry.npmmirror.com/@ziuchen/super-clipboard-userscripts/0.6.1/files/scripts/open-file/open-file.user.js
// @description  识别剪贴板中的文件路径（带扩展名），用默认程序打开对应文件
// @author       SuperClipboard
// @run-at       foreground
// @match-clip   text
// @grant        globalNativeApi.registerMenuCommand
// @grant        globalNativeApi.getClipBody
// @grant        globalNativeApi.toast
// @grant        utools.shellOpenPath
// @tag          text
// @tag          path
// @tag          file
// @tag          utility
// ==/UserScript==

// 匹配带扩展名的 Unix 绝对路径
const FILE_REGEX = /^(?:~?\/[^/\n\r\f\v]+)+\.\w{2,10}$/;

function extractPath(text) {
  const cleaned = text.trim();
  return FILE_REGEX.test(cleaned) ? cleaned : null;
}

globalNativeApi.registerMenuCommand(
  "打开文件",
  async (ctx) => {
    const target = ctx.clips?.[0];
    if (!target) return;

    const body = await globalNativeApi.getClipBody(target);
    const text = body?.text || body?.preview || "";
    if (!text) return;

    const path = extractPath(text);
    if (!path) return;

    try {
      await utools.shellOpenPath(path);
    } catch (e) {
      globalNativeApi.toast({
        title: "打开失败",
        body: `无法打开文件: ${path}`,
      });
    }
  },
  {
    /**
     * 同步 matcher — 在 host 侧执行，仅对带扩展名的文件路径显示菜单。
     */
    matcher: function (ctx) {
      const hash = ctx.trigger && ctx.trigger.hash;
      if (!hash) return false;

      const body = ctx.bodies.get(hash);
      if (!body || body.type !== "text") return false;

      const text = body.text || body.preview || "";
      if (!text) return false;

      return /^(?:~?\/[^/\n\r\f\v]+)+\.\w{2,10}$/.test(text.trim());
    },
  },
);

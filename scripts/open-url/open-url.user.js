// ==UserScript==
// @name         打开网址
// @namespace    com.superclipboard.builtin.open-url
// @version      1.0.0
// @updateURL    https://registry.npmmirror.com/@ziuchen/super-clipboard-userscripts/0.6.1/files/scripts/open-url/open-url.user.js
// @downloadURL  https://registry.npmmirror.com/@ziuchen/super-clipboard-userscripts/0.6.1/files/scripts/open-url/open-url.user.js
// @description  识别剪贴板中的网址（http/https 或裸域名），在浏览器中打开
// @author       SuperClipboard
// @run-at       foreground
// @match-clip   text
// @grant        globalNativeApi.registerMenuCommand
// @grant        globalNativeApi.getClipBody
// @grant        globalNativeApi.toast
// @grant        utools.shellOpenExternal
// @tag          text
// @tag          url
// @tag          web
// @tag          utility
// ==/UserScript==

// 匹配 http/https 完整 URL 或裸域名（可含端口）
const URL_REGEX = /^https?:\/\/[^\s/$.?#]\S+$|^[a-z0-9][-a-z0-9]{0,62}(\.[a-z0-9][-a-z0-9]{0,62}){1,10}(:[0-9]{1,5})?$/im;

function extractUrl(text) {
  const cleaned = text.trim();
  return URL_REGEX.test(cleaned) ? cleaned : null;
}

/**
 * 裸域名补全 https:// 前缀。
 */
function normalizeUrl(url) {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

globalNativeApi.registerMenuCommand(
  "打开网址",
  async (ctx) => {
    const target = ctx.clips?.[0];
    if (!target) return;

    const body = await globalNativeApi.getClipBody(target);
    const text = body?.text || body?.preview || "";
    if (!text) return;

    const url = extractUrl(text);
    if (!url) return;

    try {
      await utools.shellOpenExternal(normalizeUrl(url));
    } catch (e) {
      globalNativeApi.toast({
        title: "打开失败",
        body: `无法打开网址: ${url}`,
      });
    }
  },
  {
    /**
     * 同步 matcher — 在 host 侧执行，仅对 URL 文本显示菜单。
     * 正则含 im 标志，支持大小写不敏感和多行锚点。
     */
    matcher: function (ctx) {
      const hash = ctx.trigger && ctx.trigger.hash;
      if (!hash) return false;

      const body = ctx.bodies.get(hash);
      if (!body || body.type !== "text") return false;

      const text = body.text || body.preview || "";
      if (!text) return false;

      return /^https?:\/\/[^\s/$.?#]\S+$|^[a-z0-9][-a-z0-9]{0,62}(\.[a-z0-9][-a-z0-9]{0,62}){1,10}(:[0-9]{1,5})?$/im.test(
        text.trim(),
      );
    },
  },
);

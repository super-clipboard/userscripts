// ==UserScript==
// @name         跳转到颜色助手
// @namespace    com.superclipboard.redirect.redirect-to-color-helper
// @version      0.1.0
// @description  将颜色值文本发送到「颜色助手」uTools 插件管理
// @author       SuperClipboard
// @run-at       foreground
// @match-clip   text
// @grant        globalNativeApi.registerMenuCommand
// @grant        globalNativeApi.getClipBody
// @grant        globalNativeApi.toast
// @grant        utools.redirect
// @tag          redirect
// @tag          text
// @tag          color
// @preinstall   false
// ==/UserScript==

globalNativeApi.registerMenuCommand("颜色管理", async (ctx) => {
  if (!ctx.clips?.length) return;

  if (typeof utools?.redirect !== "function") {
    globalNativeApi.toast({
      title: "颜色助手",
      body: "请更新 uTools 到最新版本以使用跳转功能",
    });
    return;
  }

  const target = ctx.clips[0];
  if (target.type !== "text") return;

  try {
    const body = await globalNativeApi.getClipBody(target);
    const text = body?.text ?? body?.preview ?? "";
    if (!text) return;
    utools.redirect(["颜色助手", "颜色"], { type: "text", data: text });
  } catch (err) {
    globalNativeApi.toast({
      title: "颜色管理跳转失败",
      body: err?.message ?? String(err),
    });
  }
}, {
  matcher: (ctx) => {
    const [item] = ctx.clips ?? [];
    if (item && ctx.bodies.get(item.hash)) {
      // 判断文本内容是否为颜色值（简单判断，支持 hex、rgb(a)、hsl(a) 格式）
      const text = ctx.bodies.get(item.hash)?.text ?? "";
      return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(text) || // hex
        /^rgba?\(\s*(\d{1,3}\s*,\s*){2,3}\d{1,3}\s*(,\s*(0|1|0?\.\d+))?\)$/.test(text) || // rgb(a)
        /^hsla?\(\s*\d{1,3}\s*,\s*(\d{1,3}%\s*,\s*){2}(0|1|0?\.\d+)?\)$/.test(text); // hsl(a)
    }
    return false;
  }
});

// ==UserScript==
// @name         跳转到翻译
// @namespace    com.superclipboard.redirect.redirect-to-translate
// @version      0.1.0
// @description  将文本发送到「翻译」uTools 插件翻译
// @author       SuperClipboard
// @run-at       foreground
// @match-clip   text
// @grant        globalNativeApi.registerMenuCommand
// @grant        globalNativeApi.getClipBody
// @grant        globalNativeApi.toast
// @grant        utools.redirect
// @tag          redirect
// @tag          text
// @tag          translate
// @preinstall   false
// ==/UserScript==

globalNativeApi.registerMenuCommand("翻译", async (ctx) => {
  if (!ctx.clips?.length) return;

  if (typeof utools?.redirect !== "function") {
    globalNativeApi.toast({
      title: "翻译",
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
    utools.redirect(["翻译", "翻译"], { type: "text", data: text });
  } catch (err) {
    globalNativeApi.toast({
      title: "翻译跳转失败",
      body: err?.message ?? String(err),
    });
  }
});

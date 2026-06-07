// ==UserScript==
// @name         跳转到字数统计
// @namespace    com.superclipboard.redirect.redirect-to-word-count
// @version      0.1.0
// @description  将文本发送到「字数统计」uTools 插件统计字数
// @author       SuperClipboard
// @run-at       foreground
// @match-clip   text
// @grant        globalNativeApi.registerMenuCommand
// @grant        globalNativeApi.getClipBody
// @grant        globalNativeApi.toast
// @grant        utools.redirect
// @tag          redirect
// @tag          text
// @tag          stats
// @preinstall   false
// ==/UserScript==

globalNativeApi.registerMenuCommand("统计文本字数", async (ctx) => {
  if (!ctx.clips?.length) return;

  if (typeof utools?.redirect !== "function") {
    globalNativeApi.toast({
      title: "字数统计",
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
    utools.redirect(["字数统计", "统计文本次数"], { type: "text", data: text });
  } catch (err) {
    globalNativeApi.toast({
      title: "字数统计跳转失败",
      body: err?.message ?? String(err),
    });
  }
});

// ==UserScript==
// @name         跳转到百度搜索
// @namespace    com.superclipboard.redirect.redirect-to-baidu-search
// @version      0.1.0
// @description  将文本发送到「网页快开」百度搜索
// @author       SuperClipboard
// @run-at       foreground
// @match-clip   text
// @grant        globalNativeApi.registerMenuCommand
// @grant        globalNativeApi.getClipBody
// @grant        globalNativeApi.toast
// @grant        utools.redirect
// @tag          redirect
// @tag          text
// @tag          search
// @preinstall   false
// ==/UserScript==

globalNativeApi.registerMenuCommand("百度搜索", async (ctx) => {
  if (!ctx.clips?.length) return;

  if (typeof utools?.redirect !== "function") {
    globalNativeApi.toast({
      title: "百度搜索",
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
    utools.redirect(["网页快开", "百度一下"], { type: "text", data: text });
  } catch (err) {
    globalNativeApi.toast({
      title: "百度搜索跳转失败",
      body: err?.message ?? String(err),
    });
  }
});

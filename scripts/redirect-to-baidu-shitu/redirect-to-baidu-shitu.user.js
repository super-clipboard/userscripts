// ==UserScript==
// @name         跳转到百度识图
// @namespace    com.superclipboard.redirect.redirect-to-baidu-shitu
// @version      0.1.0
// @description  将图片发送到「百度识图」以图搜图
// @author       SuperClipboard
// @run-at       foreground
// @match-clip   image
// @grant        globalNativeApi.registerMenuCommand
// @grant        globalNativeApi.getClipBody
// @grant        globalNativeApi.toast
// @grant        utools.redirect
// @tag          redirect
// @tag          image
// @tag          search
// @preinstall   false
// ==/UserScript==

function bytesToDataUrl(bytes, mime) {
  const blob = new Blob([bytes], { type: mime || "image/png" });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error("read blob failed"));
    reader.readAsDataURL(blob);
  });
}

globalNativeApi.registerMenuCommand("百度识图", async (ctx) => {
  if (!ctx.clips?.length) return;

  if (typeof utools?.redirect !== "function") {
    globalNativeApi.toast({
      title: "百度识图",
      body: "请更新 uTools 到最新版本以使用跳转功能",
    });
    return;
  }

  const target = ctx.clips[0];
  if (target.type !== "image") return;

  try {
    const body = await globalNativeApi.getClipBody(target);
    if (!body?.bytes) return;
    const dataUrl = await bytesToDataUrl(body.bytes, body.mime);
    utools.redirect(["网页快开", "百度识图"], { type: "img", data: dataUrl });
  } catch (err) {
    globalNativeApi.toast({
      title: "百度识图跳转失败",
      body: err?.message ?? String(err),
    });
  }
});

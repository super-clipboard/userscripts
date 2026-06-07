// ==UserScript==
// @name         跳转到二维码助手
// @namespace    com.superclipboard.redirect.redirect-to-qrcode-decode
// @version      0.1.0
// @description  将图片发送到「二维码助手」uTools 插件识别二维码
// @author       SuperClipboard
// @run-at       foreground
// @match-clip   image
// @grant        globalNativeApi.registerMenuCommand
// @grant        globalNativeApi.getClipBody
// @grant        globalNativeApi.toast
// @grant        utools.redirect
// @tag          redirect
// @tag          image
// @tag          qrcode
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

globalNativeApi.registerMenuCommand("识别图片中二维码", async (ctx) => {
  if (!ctx.clips?.length) return;

  if (typeof utools?.redirect !== "function") {
    globalNativeApi.toast({
      title: "二维码助手",
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
    utools.redirect(["二维码助手", "识别图片中二维码"], { type: "img", data: dataUrl });
  } catch (err) {
    globalNativeApi.toast({
      title: "二维码识别跳转失败",
      body: err?.message ?? String(err),
    });
  }
});

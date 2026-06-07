// ==UserScript==
// @name         跳转到备忘快贴
// @namespace    com.superclipboard.redirect.redirect-to-collection
// @version      0.1.0
// @description  将文本/图片保存到「备忘快贴」uTools 插件
// @author       SuperClipboard
// @run-at       foreground
// @match-clip   text
// @match-clip   image
// @grant        globalNativeApi.registerMenuCommand
// @grant        globalNativeApi.getClipBody
// @grant        globalNativeApi.toast
// @grant        utools.redirect
// @tag          redirect
// @tag          text
// @tag          image
// @tag          note
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

globalNativeApi.registerMenuCommand("保存到备忘快贴", async (ctx) => {
  if (!ctx.clips?.length) return;

  if (typeof utools?.redirect !== "function") {
    globalNativeApi.toast({
      title: "备忘快贴",
      body: "请更新 uTools 到最新版本以使用跳转功能",
    });
    return;
  }

  const target = ctx.clips[0];

  try {
    if (target.type === "text") {
      const body = await globalNativeApi.getClipBody(target);
      const text = body?.text ?? body?.preview ?? "";
      if (!text) return;
      utools.redirect(["备忘快贴", "备忘记录"], { type: "text", data: text });
    } else if (target.type === "image") {
      const body = await globalNativeApi.getClipBody(target);
      if (!body?.bytes) return;
      const dataUrl = await bytesToDataUrl(body.bytes, body.mime);
      utools.redirect(["备忘快贴", "备忘记录"], { type: "img", data: dataUrl });
    }
  } catch (err) {
    globalNativeApi.toast({
      title: "备忘快贴跳转失败",
      body: err?.message ?? String(err),
    });
  }
});

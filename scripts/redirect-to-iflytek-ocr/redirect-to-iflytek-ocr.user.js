// ==UserScript==
// @name         跳转到讯飞 OCR
// @namespace    com.superclipboard.redirect.redirect-to-iflytek-ocr
// @version      0.1.0
// @description  将图片/图片文件发送到「讯飞OCR」uTools 插件做文字识别
// @author       SuperClipboard
// @run-at       foreground
// @match-clip   image
// @match-clip   file
// @grant        globalNativeApi.registerMenuCommand
// @grant        globalNativeApi.getClipBody
// @grant        globalNativeApi.toast
// @grant        utools.redirect
// @tag          redirect
// @tag          image
// @tag          ocr
// @preinstall   false
// ==/UserScript==

const IMAGE_EXT_RE = /\.(?:jpg|jpeg|png)$/i;

function bytesToDataUrl(bytes, mime) {
  const blob = new Blob([bytes], { type: mime || "image/png" });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error("read blob failed"));
    reader.readAsDataURL(blob);
  });
}

globalNativeApi.registerMenuCommand("讯飞 OCR 识别", async (ctx) => {
  if (!ctx.clips?.length) return;

  if (typeof utools?.redirect !== "function") {
    globalNativeApi.toast({
      title: "讯飞 OCR",
      body: "请更新 uTools 到最新版本以使用跳转功能",
    });
    return;
  }

  const target = ctx.clips[0];

  try {
    if (target.type === "image") {
      const body = await globalNativeApi.getClipBody(target);
      if (!body?.bytes) return;
      const dataUrl = await bytesToDataUrl(body.bytes, body.mime);
      utools.redirect(["讯飞ocr", "讯飞ocr"], { type: "img", data: dataUrl });
    } else if (target.type === "file" && target.fileName && IMAGE_EXT_RE.test(target.fileName)) {
      // 图片文件：传递文件路径
      const filePath = target.fileName;
      utools.redirect(["讯飞ocr", "讯飞ocr"], { type: "files", data: [filePath] });
    }
  } catch (err) {
    globalNativeApi.toast({
      title: "讯飞 OCR 跳转失败",
      body: err?.message ?? String(err),
    });
  }
}, {
  matcher: (ctx) => {
    const [item] = ctx.clips ?? [];
    if (!item) return false;
    // 图片剪贴板：始终展示
    if (item.type === "image") return true;
    // 文件剪贴板：仅图片文件展示（OCR 仅支持 jpg/jpeg/png）
    if (item.type === "file" && item.fileName) return /\.(?:jpg|jpeg|png)$/i.test(item.fileName);
    return false;
  },
});

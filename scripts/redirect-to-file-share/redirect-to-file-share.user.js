// ==UserScript==
// @name         跳转到文件分享
// @namespace    com.superclipboard.redirect.redirect-to-file-share
// @version      0.1.0
// @description  将文件发送到「share」uTools 插件分享到局域网
// @author       SuperClipboard
// @run-at       foreground
// @match-clip   file
// @grant        globalNativeApi.registerMenuCommand
// @grant        globalNativeApi.getClipBody
// @grant        globalNativeApi.toast
// @grant        utools.redirect
// @tag          redirect
// @tag          file
// @tag          share
// @preinstall   false
// ==/UserScript==

globalNativeApi.registerMenuCommand("分享文件到局域网", async (ctx) => {
  if (!ctx.clips?.length) return;

  if (typeof utools?.redirect !== "function") {
    globalNativeApi.toast({
      title: "文件分享",
      body: "请更新 uTools 到最新版本以使用跳转功能",
    });
    return;
  }

  const target = ctx.clips[0];
  if (target.type !== "file") return;

  try {
    const filePaths = target.fileName ? [target.fileName] : [];
    if (!filePaths.length) return;
    utools.redirect(["share", "分享文件"], { type: "files", data: filePaths });
  } catch (err) {
    globalNativeApi.toast({
      title: "文件分享跳转失败",
      body: err?.message ?? String(err),
    });
  }
});

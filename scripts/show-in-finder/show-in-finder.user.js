// ==UserScript==
// @name         在 Finder/文件资源管理器中查看
// @namespace    com.superclipboard.builtin.show-in-finder
// @version      1.0.0
// @updateURL    https://registry.npmmirror.com/@ziuchen/super-clipboard-userscripts/0.6.1/files/scripts/show-in-finder/show-in-finder.user.js
// @downloadURL  https://registry.npmmirror.com/@ziuchen/super-clipboard-userscripts/0.6.1/files/scripts/show-in-finder/show-in-finder.user.js
// @description  在系统文件管理器中定位到当前文件剪贴板对应的文件
// @author       SuperClipboard
// @run-at       foreground
// @match-clip   file
// @grant        globalNativeApi.registerMenuCommand
// @grant        globalNativeApi.getClipBody
// @grant        globalNativeApi.toast
// @grant        utools.shellShowItemInFolder
// @tag          file
// @tag          utility
// ==/UserScript==

/**
 * 根据 navigator.platform 返回平台对应的菜单文案。
 * sandbox iframe 内可用，uTools Electron 版本固定。
 */
function getPlatformLabel() {
  const p = navigator.platform || "";
  if (/(Mac|iPhone|iPad|iPod)/i.test(p)) return "在 Finder 中查看";
  if (/(Win)/i.test(p)) return "在文件资源管理器中查看";
  return "在文件管理器中查看";
}

const LABEL = getPlatformLabel();

globalNativeApi.registerMenuCommand(LABEL, async (ctx) => {
  // 多选时取触发右键的那一条（ctx.clips[0] 即 trigger）
  const target = ctx.clips?.[0];
  if (!target) return;

  const body = await globalNativeApi.getClipBody(target);
  if (!body || body.type !== "file") return;

  const files = body.files ?? [];
  if (files.length === 0) {
    globalNativeApi.toast({ title: "无法定位", body: "该剪贴板没有关联的文件路径" });
    return;
  }

  // 多个文件仅取首个，避免 Finder 反复跳转
  const firstPath = files[0]?.path;
  if (!firstPath) {
    globalNativeApi.toast({ title: "无法定位", body: "文件路径为空" });
    return;
  }

  try {
    await utools.shellShowItemInFolder(firstPath);
  } catch (e) {
    globalNativeApi.toast({
      title: "定位失败",
      body: `无法在文件管理器中定位: ${firstPath}`,
    });
  }
});

// ==UserScript==
// @name         另存为
// @namespace    com.superclipboard.builtin.saveas
// @version      1.1.0
// @author       SuperClipboard
// @description  把当前剪贴板内容另存到选定文件夹下
// @run-at       foreground
// @match-clip   text
// @match-clip   image
// @match-clip   file
// @grant        globalNativeApi.registerMenuCommand
// @grant        globalNativeApi.getClipBody
// @grant        globalNativeApi.saveFile
// @grant        globalNativeApi.copyLocalFile
// @grant        globalNativeApi.error
// @grant        globalNativeApi.notification
// @grant        utools.showOpenDialog
// @grant        utools.getPath
// @tag          text
// @tag          image
// @tag          file
// @preinstall   true
// ==/UserScript==

globalNativeApi.registerMenuCommand("另存为...", async (ctx) => {
  const targets = ctx.clips ?? [];
  if (targets.length === 0) return;

  const defaultDir = await utools.getPath("downloads");
  const targetDirResult = await utools.showOpenDialog({
    title: "选择要保存的位置",
    defaultPath: defaultDir,
    buttonLabel: "保存",
    properties: ["openDirectory", "createDirectory"],
  });
  const targetDir = targetDirResult?.[0];

  if (!targetDir) return;

  const baseTs = new Date().toISOString().replaceAll(/[:.]/g, "-");
  let successCount = 0;
  let failCount = 0;
  const errors = [];

  for (const [idx, clip] of targets.entries()) {
    try {
      const body = await globalNativeApi.getClipBody(clip);
      if (!body) {
        throw new Error("未能获取到项目内容");
      }

      const suffix = targets.length > 1 ? `-${idx + 1}` : "";

      if (body.type === "text") {
        const text = body.text || body.preview || "";
        const filename = `clip-${baseTs}${suffix}.txt`;
        await globalNativeApi.saveFile(text, {
          filename,
          targetDir,
          mime: "text/plain",
        });
        successCount++;
      } else if (body.type === "image") {
        if (!body.bytes) {
          throw new Error("图片字节数据为空");
        }
        const filename = `clip-${baseTs}${suffix}.png`;
        await globalNativeApi.saveFile(body.bytes, {
          filename,
          targetDir,
          mime: body.mime || "image/png",
        });
        successCount++;
      } else if (body.type === "file") {
        const files = body.files ?? [];
        if (files.length === 0) {
          throw new Error("文件路径列表为空");
        }
        for (const file of files) {
          if (!file.path) continue;
          const destPath =
            targetDir.endsWith("/") || targetDir.endsWith("\\")
              ? `${targetDir}${file.name}`
              : `${targetDir}/${file.name}`;
          await globalNativeApi.copyLocalFile(file.path, destPath);
        }
        successCount++;
      }
    } catch (err) {
      failCount++;
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`项目 #${idx + 1} (${clip.type}) 另存失败: ${msg}`);
      globalNativeApi.error(`另存项目 #${idx + 1} 失败:`, err);
    }
  }

  if (failCount === 0) {
    await globalNativeApi.notification({
      title: "另存为成功",
      body: `已成功保存 ${successCount} 个项目到 ${targetDir}`,
    });
  } else {
    await globalNativeApi.notification({
      title: `另存为完成 (有 ${failCount} 个失败)`,
      body: `成功 ${successCount} 个。失败原因: ${errors.slice(0, 2).join("; ")}${errors.length > 2 ? " 等" : ""}`,
    });
  }
});

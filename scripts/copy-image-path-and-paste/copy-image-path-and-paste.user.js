// ==UserScript==
// @name         复制图片路径并粘贴
// @namespace    com.superclipboard.copy-image-path-and-paste
// @version      0.1.0
// @description  把图片保存到临时目录（或直接使用图片文件的路径），将路径写入剪贴板并触发粘贴到上一个应用
// @author       SuperClipboard
// @run-at       foreground
// @match-clip   image
// @match-clip   file
// @grant        globalNativeApi.registerMenuCommand
// @grant        globalNativeApi.getClipBody
// @grant        globalNativeApi.saveFile
// @grant        globalNativeApi.toast
// @grant        utools.getPath
// @grant        utools.copyText
// @grant        utools.hideMainWindowPasteText
// @tag          image
// @tag          file
// @preinstall   true
// ==/UserScript==

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|bmp|tiff?|heic|heif|avif|svg)$/i;

function isImagePath(filePath) {
  return typeof filePath === "string" && IMAGE_EXT_RE.test(filePath);
}

/** 从 MIME 类型提取文件扩展名，无法识别时默认 `png` */
function mimeToExt(mime) {
  const map = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/bmp": "bmp",
    "image/tiff": "tif",
    "image/avif": "avif",
    "image/heic": "heic",
    "image/heif": "heif",
    "image/svg+xml": "svg",
  };
  return (mime && map[mime]) || "png";
}

/** 从 base64 数据 URL 解码为 Uint8Array（供图片 bytes 缺失时兜底） */
function decodeBase64Image(dataUrl) {
  const match = /^data:image\/[^;]+;base64,(.+)$/.exec(dataUrl || "");
  if (!match?.[1]) return null;
  const binary = atob(match[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * 收集当前选中的「图片路径」：
 * - image 类型：把图片字节写入系统临时目录，返回生成的文件绝对路径；
 * - file 类型：直接返回其中图片文件的原始路径。
 */
async function collectImagePaths(clips) {
  const paths = [];
  for (const clip of clips) {
    try {
      const body = await globalNativeApi.getClipBody(clip);
      if (!body) continue;

      if (clip.type === "image" && body.type === "image") {
        const bytes = body.bytes ?? decodeBase64Image(body.preview);
        if (!bytes) continue;
        const ext = mimeToExt(body.mime);
        const filename = `sc-image-path-${clip.hash.slice(0, 8)}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
        const tempDir = await utools.getPath("temp");
        await globalNativeApi.saveFile(bytes, {
          filename,
          mime: body.mime || "image/png",
          targetDir: tempDir,
        });
        paths.push(
          tempDir.endsWith("/") || tempDir.endsWith("\\")
            ? tempDir + filename
            : tempDir + "/" + filename,
        );
      } else if (clip.type === "file" && body.type === "file") {
        for (const f of body.files ?? []) {
          if (f.isFile && isImagePath(f.path)) paths.push(f.path);
        }
      }
    } catch (err) {
      console.warn(`[复制图片路径并粘贴] 处理 ${clip.type} 项目失败:`, err);
    }
  }
  return paths;
}

globalNativeApi.registerMenuCommand(
  "复制图片路径并粘贴",
  async (ctx) => {
    const clips = ctx.clips ?? [];
    if (clips.length === 0) return;

    const paths = await collectImagePaths(clips);
    if (paths.length === 0) {
      await globalNativeApi.toast({
        title: "复制图片路径并粘贴",
        body: "未找到图片或图片文件",
      });
      return;
    }

    const text = paths.join("\n");
    try {
      // 1. 把路径写入剪贴板
      await utools.copyText(text);
      // 2. 隐藏主窗口并触发粘贴到上一个应用（该 API 本身含「写剪贴板 → 粘贴」语义）
      await utools.hideMainWindowPasteText(text);
      await globalNativeApi.toast({
        title: "已复制图片路径并粘贴",
        body: paths.length === 1 ? text : `${text}\n（共 ${paths.length} 个路径）`,
      });
    } catch (err) {
      await globalNativeApi.toast({
        title: "粘贴失败",
        body: err?.message ?? String(err),
      });
    }
  },
  {
    matcher: (ctx) => {
      // 图片类型：matcher 无法同步获取字节内容，直接放行，由回调里兜底判断
      if (ctx.clips.some((c) => c.type === "image")) return true;
      // 文件类型：冷启动时 body 可能不在缓存中，放行由回调判断；否则要求至少一个图片文件
      if (ctx.clips.some((c) => c.type === "file" && !ctx.bodies.has(c.hash))) return true;
      const imageExt = /\.(png|jpe?g|gif|webp|bmp|tiff?|heic|heif|avif|svg)$/i;
      for (const c of ctx.clips) {
        if (c.type !== "file") continue;
        const b = ctx.bodies.get(c.hash);
        if (
          b &&
          b.type === "file" &&
          (b.files ?? []).some((f) => f.isFile && imageExt.test(f.path))
        ) {
          return true;
        }
      }
      return false;
    },
  },
);

// ==UserScript==
// @name         Base64 编解码
// @namespace    com.superclipboard.community.base64-codec
// @version      0.2.0
// @description  对剪贴板文本做 Base64 编码 / 解码（UTF-8）
// @author       super-clipboard
// @run-at       foreground
// @match-clip   text
// @grant        globalNativeApi.getClipBody
// @grant        globalNativeApi.registerMenuCommand
// @grant        globalNativeApi.notification
// @grant        utools.copyText
// @tag          text
// @tag          encode
// @tag          base64
// ==/UserScript==

async function read(ctx) {
  const target = ctx.clips?.[0];
  if (!target) return "";
  const body = await globalNativeApi.getClipBody(target);
  return (body && (body.text || body.preview)) || "";
}

function utf8Encode(text) {
  // btoa only handles latin1; round-trip via TextEncoder for unicode safety.
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function utf8Decode(b64) {
  const bin = atob(b64.trim());
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

globalNativeApi.registerMenuCommand("Base64 编码", async (ctx) => {
  const text = await read(ctx);
  if (!text) return;
  try {
    const out = utf8Encode(text);
    utools.copyText(out);
    globalNativeApi.notification({ title: "Base64 编码完成", body: `${out.length} chars` });
  } catch (err) {
    globalNativeApi.notification({ title: "编码失败", body: err.message ?? String(err) });
  }
});

globalNativeApi.registerMenuCommand("Base64 解码", async (ctx) => {
  const text = (await read(ctx)).trim();
  if (!text) return;
  try {
    const out = utf8Decode(text);
    utools.copyText(out);
    globalNativeApi.notification({ title: "Base64 解码完成", body: `${out.length} chars` });
  } catch (err) {
    globalNativeApi.notification({ title: "解码失败", body: "不是合法的 Base64 / UTF-8 字符串" });
  }
});

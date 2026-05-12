// ==UserScript==
// @name         JSON 格式化
// @namespace    com.superclipboard.community.json-format
// @version      0.1.0
// @description  把剪贴板里的 JSON 美化或压缩后写回剪贴板
// @author       super-clipboard
// @run-at       foreground
// @match-clip   text
// @grant        globalNativeApi.*
// @tag          text
// @tag          json
// @tag          format
// ==/UserScript==

function read(ctx) {
  return ctx.clip
    ? globalNativeApi.getClipBody(ctx.clip).then((b) => (b && (b.text || b.preview)) || "")
    : Promise.resolve("");
}

function tryParse(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (err) {
    return { ok: false, err };
  }
}

globalNativeApi.registerMenuCommand("格式化 JSON", async (ctx) => {
  const text = (await read(ctx)).trim();
  if (!text) return;
  const r = tryParse(text);
  if (!r.ok) {
    globalNativeApi.notification({ title: "JSON 解析失败", body: r.err.message });
    return;
  }
  const pretty = JSON.stringify(r.value, null, 2);
  utools.copyText(pretty);
  globalNativeApi.notification({ title: "已格式化 JSON", body: `${pretty.length} chars` });
});

globalNativeApi.registerMenuCommand("压缩 JSON", async (ctx) => {
  const text = (await read(ctx)).trim();
  if (!text) return;
  const r = tryParse(text);
  if (!r.ok) {
    globalNativeApi.notification({ title: "JSON 解析失败", body: r.err.message });
    return;
  }
  const min = JSON.stringify(r.value);
  utools.copyText(min);
  globalNativeApi.notification({ title: "已压缩 JSON", body: `${min.length} chars` });
});

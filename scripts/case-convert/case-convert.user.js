// ==UserScript==
// @name         命名风格转换
// @namespace    com.superclipboard.community.case-convert
// @version      0.2.1
// @updateURL    https://registry.npmmirror.com/@ziuchen/super-clipboard-userscripts/0.5.0/files/scripts/case-convert/case-convert.user.js
// @downloadURL  https://registry.npmmirror.com/@ziuchen/super-clipboard-userscripts/0.5.0/files/scripts/case-convert/case-convert.user.js
// @description  在 camelCase / snake_case / kebab-case / PascalCase / CONSTANT_CASE 之间切换
// @author       super-clipboard
// @run-at       foreground
// @match-clip   text
// @grant        globalNativeApi.registerMenuCommand
// @grant        globalNativeApi.getClipBody
// @grant        globalNativeApi.notification
// @grant        globalNativeApi.showPanel
// @grant        utools.copyText
// @tag          text
// @tag          case
// @tag          naming
// ==/UserScript==

function tokenize(text) {
  return text
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[\s_\-./]+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

const styles = [
  {
    id: "camel",
    label: "camelCase",
    fn: (ws) =>
      ws
        .map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
        .join(""),
  },
  {
    id: "pascal",
    label: "PascalCase",
    fn: (ws) => ws.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(""),
  },
  { id: "snake", label: "snake_case", fn: (ws) => ws.map((w) => w.toLowerCase()).join("_") },
  { id: "kebab", label: "kebab-case", fn: (ws) => ws.map((w) => w.toLowerCase()).join("-") },
  { id: "const", label: "CONSTANT_CASE", fn: (ws) => ws.map((w) => w.toUpperCase()).join("_") },
  {
    id: "title",
    label: "Title Case",
    fn: (ws) => ws.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" "),
  },
];

globalNativeApi.registerMenuCommand("命名风格转换", async (ctx) => {
  const target = ctx.clips?.[0];
  if (!target) return;
  const body = await globalNativeApi.getClipBody(target);
  const text = ((body && (body.text || body.preview)) || "").trim();
  if (!text) return;
  const words = tokenize(text);
  if (!words.length) return;

  const rows = styles
    .map((s) => {
      const out = s.fn(words);
      const safe = out.replace(/&/g, "&amp;").replace(/</g, "&lt;");
      return `<div class="row" data-text="${encodeURIComponent(out)}"><span class="label">${s.label}</span><code>${safe}</code></div>`;
    })
    .join("");

  document.body.innerHTML = `
    <style>
      body { margin:0; padding:12px; font-family: system-ui; background:#fff; color:#111; }
      h3 { margin:0 0 10px; font-size:13px; color:#666; font-weight:500; }
      .row { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:6px; cursor:pointer; }
      .row:hover { background:#f4f4f5; }
      .label { font-size:11px; color:#888; min-width:110px; }
      code { font-family: ui-monospace, monospace; font-size:13px; word-break:break-all; }
    </style>
    <h3>点击复制</h3>
    ${rows}
  `;
  document.querySelectorAll(".row").forEach((el) => {
    el.addEventListener("click", () => {
      const t = decodeURIComponent(el.getAttribute("data-text"));
      utools.copyText(t);
      globalNativeApi.notification({ title: "已复制", body: t });
    });
  });
  await globalNativeApi.showPanel({ width: 360, height: 320, placement: "center" });
});

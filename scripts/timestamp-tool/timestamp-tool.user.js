// ==UserScript==
// @name         时间戳转换
// @namespace    com.superclipboard.community.timestamp-tool
// @version      0.2.1
// @updateURL    https://registry.npmmirror.com/@ziuchen/super-clipboard-userscripts/0.6.1/files/scripts/timestamp-tool/timestamp-tool.user.js
// @downloadURL  https://registry.npmmirror.com/@ziuchen/super-clipboard-userscripts/0.6.1/files/scripts/timestamp-tool/timestamp-tool.user.js
// @description  在 Unix 时间戳和本地时间字符串之间互转
// @author       super-clipboard
// @run-at       foreground
// @match-clip   text
// @grant        globalNativeApi.registerMenuCommand
// @grant        globalNativeApi.getClipBody
// @grant        globalNativeApi.toast
// @grant        globalNativeApi.showPanel
// @grant        utools.copyText
// @tag          text
// @tag          time
// @tag          datetime
// ==/UserScript==

function pad(n) {
  return n < 10 ? "0" + n : "" + n;
}

function formatLocal(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function parseInput(text) {
  const t = text.trim();
  if (!t) return null;
  // pure digits → unix sec or ms
  if (/^\d{9,13}$/.test(t)) {
    const n = Number(t);
    const ms = t.length <= 10 ? n * 1000 : n;
    const d = new Date(ms);
    if (!isNaN(d.getTime())) return { kind: "fromUnix", date: d, raw: n };
  }
  // try Date.parse
  const ms = Date.parse(t);
  if (!isNaN(ms)) return { kind: "fromString", date: new Date(ms) };
  return null;
}

globalNativeApi.registerMenuCommand("时间戳转换", async (ctx) => {
  const target = ctx.clips?.[0];
  if (!target) return;
  const body = await globalNativeApi.getClipBody(target);
  const text = ((body && (body.text || body.preview)) || "").trim();
  const parsed = text ? parseInput(text) : null;
  const now = new Date();

  const inputDate = parsed ? parsed.date : now;
  const sec = Math.floor(inputDate.getTime() / 1000);
  const ms = inputDate.getTime();
  const local = formatLocal(inputDate);
  const iso = inputDate.toISOString();

  const inputLine = parsed
    ? `<div class="src">输入：<code>${text.replace(/</g, "&lt;")}</code></div>`
    : `<div class="src">未识别到时间，显示当前时间</div>`;

  const rows = [
    { label: "本地时间", value: local },
    { label: "ISO 8601", value: iso },
    { label: "Unix (秒)", value: String(sec) },
    { label: "Unix (毫秒)", value: String(ms) },
  ]
    .map(
      (r) =>
        `<div class="row" data-text="${encodeURIComponent(r.value)}"><span class="label">${r.label}</span><code>${r.value}</code></div>`,
    )
    .join("");

  document.body.innerHTML = `
    <style>
      body { margin:0; padding:12px; font-family: system-ui; background:#fff; color:#111; }
      .src { font-size:11px; color:#888; margin-bottom:8px; }
      .src code { background:#f4f4f5; padding:1px 4px; border-radius:3px; }
      .row { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:6px; cursor:pointer; }
      .row:hover { background:#f4f4f5; }
      .label { font-size:11px; color:#888; min-width:90px; }
      code { font-family: ui-monospace, monospace; font-size:13px; }
    </style>
    ${inputLine}
    ${rows}
  `;
  document.querySelectorAll(".row").forEach((el) => {
    el.addEventListener("click", () => {
      const t = decodeURIComponent(el.getAttribute("data-text"));
      utools.copyText(t);
      globalNativeApi.toast({ title: "已复制", body: t });
    });
  });
  await globalNativeApi.showPanel({ width: 360, height: 260, placement: "center" });
});

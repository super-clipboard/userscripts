// ==UserScript==
// @name         二维码生成
// @namespace    com.superclipboard.builtin.qr
// @version      1.0.1
// @updateURL    https://registry.npmmirror.com/@ziuchen/super-clipboard-userscripts/0.5.0/files/scripts/qr/qr.user.js
// @downloadURL  https://registry.npmmirror.com/@ziuchen/super-clipboard-userscripts/0.5.0/files/scripts/qr/qr.user.js
// @author       SuperClipboard
// @description  把当前文本剪贴板生成二维码并在浮窗显示（基于 qrcode-encoder）
// @run-at       foreground
// @match-clip   text
// @grant        globalNativeApi.registerMenuCommand
// @grant        globalNativeApi.getClipBody
// @grant        globalNativeApi.toast
// @grant        globalNativeApi.showPanel
// @require      https://registry.npmmirror.com/qrcode-encoder/1.3.0/files/dist/iife/qrcode-encoder.iife.js#sha256-5KyVbh3LWYvV9VB/OSCGI2JLqBoIulvKW0af8TISAMA=
// @tag          text
// @tag          utility
// @preinstall   true
// ==/UserScript==

globalNativeApi.registerMenuCommand("生成二维码", async (ctx) => {
  // 多选场景下，仅为触发条目生成二维码（二维码 UI 天然是单项）
  const target = ctx.clips?.[0];
  if (!target) return;
  const body = await globalNativeApi.getClipBody(target);
  const text = (body && (body.text || body.preview)) || "";
  if (!text) return;

  function buildSVG(level) {
    const modules = QRCodeEncoder.encode(text, { errorCorrection: level });
    return QRCodeEncoder.toSVG(modules);
  }

  // 初始用最低等级（最大容量）
  let currentLevel = "L";
  let svg;
  try {
    svg = buildSVG(currentLevel);
  } catch (err) {
    globalNativeApi.toast({
      title: "二维码生成失败",
      body: err && err.message ? err.message : String(err),
    });
    throw err;
  }

  document.body.innerHTML = `
    <style>
      *, *::before, *::after { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
      html::-webkit-scrollbar, body::-webkit-scrollbar { width: 5px; height: 5px; }
      html::-webkit-scrollbar-track, body::-webkit-scrollbar-track { background: transparent; }
      html::-webkit-scrollbar-thumb, body::-webkit-scrollbar-thumb {
        background: hsl(var(--border, 220 14% 82%)); border-radius: 3px; }
      html::-webkit-scrollbar-thumb:hover, body::-webkit-scrollbar-thumb:hover {
        background: hsl(var(--muted-foreground, 0 0% 50%)); }
      @keyframes panel-in {
        from { opacity: 0; transform: scale(0.97) translateY(6px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }
      body { display: flex; flex-direction: column; font-family: system-ui; padding: 16px; gap: 12px;
             animation: panel-in 0.18s ease-out both; }
      .header { display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
      h3 { margin: 0; font-size: 14px; font-weight: 600; }
      select { font-size: 12px; padding: 2px 6px; border-radius: 4px;
               border: 1px solid hsl(var(--border, 220 14% 88%)); cursor: pointer;
               background: hsl(var(--background, 0 0% 100%));
               color: hsl(var(--foreground, 0 0% 10%)); }
      .qr-wrap { display: flex; justify-content: center; padding: 10px;
                 background: #fff; border-radius: 8px; flex-shrink: 0; }
      .qr-wrap svg { width: 256px; height: 256px; display: block; }
      .text { font-size: 12px; color: hsl(var(--muted-foreground, 0 0% 40%));
              white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
              text-align: center; flex-shrink: 0; }
    </style>
    <div class="header">
      <h3>二维码</h3>
      <select id="ec-level">
        <option value="L">容错: L（低）</option>
        <option value="M">容错: M（中）</option>
        <option value="Q">容错: Q（高）</option>
        <option value="H">容错: H（最高）</option>
      </select>
    </div>
    <div class="qr-wrap" id="qr"></div>
    <div class="text" id="t"></div>
  `;

  const qrEl = document.getElementById("qr");
  const textEl = document.getElementById("t");
  const select = document.getElementById("ec-level");

  qrEl.innerHTML = svg;
  textEl.textContent = text;
  textEl.title = text;

  select.value = currentLevel;
  select.addEventListener("change", () => {
    const prev = currentLevel;
    currentLevel = select.value;
    try {
      qrEl.innerHTML = buildSVG(currentLevel);
    } catch {
      // 当前等级下 payload 超限，回退到上一个可用等级
      currentLevel = prev;
      select.value = prev;
      globalNativeApi.toast({
        title: "容错等级切换失败",
        body: "当前文本在此等级下超出二维码容量上限",
      });
    }
  });

  await globalNativeApi.showPanel({ width: 320, height: 390, placement: "center" });
});

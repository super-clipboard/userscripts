// ==UserScript==
// @name         智慧分词
// @namespace    com.superclipboard.builtin.tokenize
// @version      1.0.2
// @updateURL    https://registry.npmmirror.com/@ziuchen/super-clipboard-userscripts/0.5.0/files/scripts/tokenize/tokenize.user.js
// @downloadURL  https://registry.npmmirror.com/@ziuchen/super-clipboard-userscripts/0.5.0/files/scripts/tokenize/tokenize.user.js
// @author       SuperClipboard
// @description  对当前文本剪贴板进行中文智慧分词并展示（基于 segmentit）
// @run-at       foreground
// @match-clip   text
// @grant        globalNativeApi.getClipBody
// @grant        globalNativeApi.registerMenuCommand
// @grant        globalNativeApi.showPanel
// @grant        utools.copyText
// @require      https://registry.npmmirror.com/segmentit/2.0.3/files/dist/umd/segmentit.js#sha256-djjXMKyvPTGLiGgiwMDmY5mXfH7OA3D7QbeQd2UGoVU=
// @tag          text
// @tag          ai
// @preinstall   true
// ==/UserScript==

// Segmentit UMD 在 @require 后可通过 window.Segmentit 访问
let seg = null;
function getSegment() {
  if (seg) return seg;
  const { Segment, useDefault } = Segmentit;
  seg = useDefault(new Segment());
  return seg;
}

globalNativeApi.registerMenuCommand("智慧分词", async (ctx) => {
  const targets = ctx.clips ?? [];
  if (targets.length === 0) return;
  // 多选时合并所有文本后一次分词
  const bodies = await Promise.all(targets.map((c) => globalNativeApi.getClipBody(c)));
  const text = bodies
    .map((body) => (body && (body.text || body.preview)) || "")
    .filter((t) => t.trim())
    .join("\n");
  if (!text.trim()) return;

  // 按换行符拆分，每行单独分词，保留换行结构
  const rawLines = text.split(/\r\n|\r|\n/);
  const lineTokensList = rawLines.map((line) =>
    line.trim() ? getSegment().doSegment(line, { simple: true }) : [],
  );
  const totalCount = lineTokensList.reduce((s, toks) => s + toks.length, 0);

  document.body.innerHTML = `
    <style>
      *, *::before, *::after { box-sizing: border-box; }
      @keyframes panel-in {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: none; }
      }
      body { margin: 0; display: flex; flex-direction: column; height: 100vh; overflow: hidden;
             font-family: system-ui; background: hsl(var(--background, 0 0% 100%));
             color: hsl(var(--foreground, 0 0% 10%)); animation: panel-in 0.18s ease-out both; }
      .header { padding: 12px 14px 8px; flex-shrink: 0; }
      h3 { margin: 0; font-size: 13px; font-weight: 600; }
      .content { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 4px 14px 8px; }
      .content::-webkit-scrollbar { width: 6px; }
      .content::-webkit-scrollbar-track { background: transparent; }
      .content::-webkit-scrollbar-thumb { background: hsl(var(--border, 220 14% 82%)); border-radius: 3px; }
      .content::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground, 0 0% 50%)); }
      .line-group { display: flex; flex-wrap: wrap; gap: 4px; padding: 5px 0; }
      .tok { padding: 3px 9px; background: hsl(var(--accent, 220 14% 96%));
             color: hsl(var(--accent-foreground, 220 14% 20%)); border-radius: 4px;
             font-size: 12px; cursor: pointer; user-select: none;
             max-width: 100%; overflow-wrap: break-word;
             transition: background 0.1s; }
      .tok:hover { background: hsl(var(--muted, 220 14% 92%)); }
      /* 修复点 1：使用变量适配深色模式下的选中文字颜色 */
      .tok.selected { background: hsl(var(--primary, 220 90% 56%)); color: hsl(var(--primary-foreground, 0 0% 100%)); }
      .footer { padding: 8px 14px; flex-shrink: 0; display: flex; align-items: center;
                justify-content: space-between; border-top: 1px solid hsl(var(--border, 220 14% 88%)); }
      .hint { font-size: 11px; color: hsl(var(--muted-foreground, 0 0% 40%)); }
      .btn { padding: 4px 12px; font-size: 12px;
             border: 1px solid hsl(var(--border, 220 14% 88%)); border-radius: 5px;
             cursor: pointer; background: hsl(var(--accent, 220 14% 96%));
             color: hsl(var(--accent-foreground, 220 14% 20%)); }
      .btn:hover { background: hsl(var(--muted, 220 14% 92%)); }
      /* 修复点 2：使用变量适配深色模式下的主按钮文字颜色 */
      .btn.primary { background: hsl(var(--primary, 220 90% 56%)); color: hsl(var(--primary-foreground, 0 0% 100%)); border-color: transparent; }
      .btn.primary:hover { opacity: 0.88; }
    </style>
    <div class="header">
      <h3>分词结果（共 ${totalCount} 个）</h3>
    </div>
    <div class="content" id="content"></div>
    <div class="footer">
      <span class="hint" id="hint">点击或拖动选择词语</span>
      <div style="display:flex;gap:6px">
        <button class="btn" id="clear-btn">清除选择</button>
        <button class="btn primary" id="copy-btn">合并复制</button>
      </div>
    </div>
  `;

  const content = document.getElementById("content");
  const hint = document.getElementById("hint");

  // 扁平化 token 元数据，带行索引
  const tokEls = [];
  lineTokensList.forEach((toks, lineIdx) => {
    const group = document.createElement("div");
    group.className = "line-group";
    toks.forEach((t) => {
      const span = document.createElement("span");
      span.className = "tok";
      span.textContent = t;
      group.appendChild(span);
      tokEls.push({ el: span, lineIdx, text: t });
    });
    content.appendChild(group);
  });

  // 选择状态
  let isDragging = false;
  let dragStartIdx = -1;
  let dragCurIdx = -1;
  let hasMoved = false;

  function getIdx(el) {
    return tokEls.findIndex((item) => item.el === el);
  }
  function clearSel() {
    tokEls.forEach((item) => item.el.classList.remove("selected"));
  }
  function applySel(lo, hi) {
    const a = Math.min(lo, hi);
    const b = Math.max(lo, hi);
    tokEls.forEach((item, i) => item.el.classList.toggle("selected", i >= a && i <= b));
  }
  function updateHint() {
    const n = tokEls.filter((item) => item.el.classList.contains("selected")).length;
    hint.textContent = n > 0 ? `已选 ${n} 个词` : "点击或拖动选择词语";
  }

  content.addEventListener("mousedown", (e) => {
    const tok = e.target.closest(".tok");
    if (!tok) return;
    e.preventDefault();
    isDragging = true;
    hasMoved = false;
    dragStartIdx = getIdx(tok);
    dragCurIdx = dragStartIdx;
  });

  content.addEventListener("mouseover", (e) => {
    if (!isDragging) return;
    const tok = e.target.closest(".tok");
    if (!tok) return;
    const idx = getIdx(tok);
    if (idx === dragCurIdx) return;
    hasMoved = true;
    dragCurIdx = idx;
    clearSel();
    applySel(dragStartIdx, dragCurIdx);
    updateHint();
  });

  window.addEventListener("mouseup", (e) => {
    if (!isDragging) return;
    isDragging = false;
    if (!hasMoved) {
      // 单击：追加/撤销选中，不清除其他已选词
      const tok = document.elementFromPoint(e.clientX, e.clientY)?.closest(".tok");
      if (tok) {
        tok.classList.toggle("selected");
      } else {
        clearSel();
      }
    }
    updateHint();
    dragStartIdx = -1;
    dragCurIdx = -1;
    hasMoved = false;
  });

  // 失焦时重置拖拽状态，防止残留
  window.addEventListener("blur", () => {
    isDragging = false;
    hasMoved = false;
    dragStartIdx = -1;
    dragCurIdx = -1;
  });

  document.getElementById("clear-btn").onclick = () => {
    clearSel();
    updateHint();
  };

  document.getElementById("copy-btn").onclick = () => {
    const selected = tokEls.filter((item) => item.el.classList.contains("selected"));
    // 未选择时复制全部
    const source = selected.length > 0 ? selected : tokEls;
    // 按行分组：行内 token 直接拼接，行间用换行符分隔
    const lineMap = new Map();
    source.forEach((item) => {
      if (!lineMap.has(item.lineIdx)) lineMap.set(item.lineIdx, []);
      lineMap.get(item.lineIdx).push(item.text);
    });
    const result = [...lineMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, toks]) => toks.join(""))
      .join("\n");
    utools.copyText(result);
    hint.textContent = "已复制！";
    setTimeout(updateHint, 1500);
  };

  await globalNativeApi.showPanel({ width: 480, height: 420, placement: "center" });
});
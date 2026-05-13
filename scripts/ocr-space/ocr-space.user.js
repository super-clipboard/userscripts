// ==UserScript==
// @name         OCR.space 图片识别
// @namespace    com.superclipboard.community.ocr-space
// @version      0.1.0
// @description  通过 ocr.space 在线 API 对图片剪贴板做 OCR；结果写入 clip metadata，供后续文字搜图使用。需要自行申请免费 API Key。
// @author       super-clipboard
// @homepage     https://ocr.space/ocrapi
// @run-at       foreground
// @match-clip   text
// @match-clip   image
// @grant        globalNativeApi.*
// @grant        utools.*
// @tag          image
// @tag          ocr
// ==/UserScript==

const KEY_STORE = "ocrspace.apiKey";
const LANG_STORE = "ocrspace.language";
const ENGINE_STORE = "ocrspace.engine";
const AUTO_STORE = "ocrspace.auto";

const ENDPOINT = "https://api.ocr.space/parse/image";
const SIGNUP_URL = "https://ocr.space/ocrapi/freekey";

const LANG_OPTIONS = [
  { value: "eng", label: "English" },
  { value: "chs", label: "Chinese (Simplified)" },
  { value: "cht", label: "Chinese (Traditional)" },
  { value: "jpn", label: "Japanese" },
  { value: "kor", label: "Korean" },
  { value: "fre", label: "French" },
  { value: "ger", label: "German" },
  { value: "spa", label: "Spanish" },
  { value: "rus", label: "Russian" },
  { value: "auto", label: "Auto detect (engine 2 only)" },
];

async function getKey() {
  return (await globalNativeApi.getValue(KEY_STORE)) || "";
}

async function getLang() {
  return (await globalNativeApi.getValue(LANG_STORE)) || "eng";
}

async function getEngine() {
  const v = await globalNativeApi.getValue(ENGINE_STORE);
  return v === "1" ? "1" : "2";
}

async function getAuto() {
  return (await globalNativeApi.getValue(AUTO_STORE)) === true;
}

function bytesToDataUrl(bytes, mime) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([bytes], { type: mime || "image/png" });
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error("read blob failed"));
    reader.readAsDataURL(blob);
  });
}

async function callOcrSpace(dataUrl, key, language, engine) {
  const form = new FormData();
  form.append("base64Image", dataUrl);
  if (language === "auto") {
    form.append("OCREngine", "2");
    form.append("detectOrientation", "true");
  } else {
    form.append("language", language);
    form.append("OCREngine", engine);
    form.append("detectOrientation", "true");
  }
  form.append("isOverlayRequired", "false");
  form.append("scale", "true");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { apikey: key },
    body: form,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.IsErroredOnProcessing) {
    const msg = Array.isArray(json.ErrorMessage)
      ? json.ErrorMessage.join("; ")
      : json.ErrorMessage || "OCR failed";
    throw new Error(msg);
  }
  const text = (json.ParsedResults || [])
    .map((p) => (p && p.ParsedText) || "")
    .join("\n")
    .replace(/\r/g, "")
    .trim();
  return text;
}

async function ocrClip(clip, opts) {
  const key = await getKey();
  if (!key) {
    if (opts && opts.notify) {
      globalNativeApi.notification({
        title: "OCR.space",
        body: "请先在右键菜单「OCR.space 设置」中填入 API Key。",
      });
    }
    return null;
  }
  const body = await globalNativeApi.getClipBody(clip);
  if (!body || body.type !== "image" || !body.bytes) {
    if (opts && opts.notify) {
      globalNativeApi.notification({ title: "OCR.space", body: "当前剪贴板不是图片。" });
    }
    return null;
  }

  let dataUrl;
  try {
    dataUrl = await bytesToDataUrl(body.bytes, body.mime);
  } catch (err) {
    globalNativeApi.log("[ocr-space] read image failed", err.message || String(err));
    return null;
  }

  const language = await getLang();
  const engine = await getEngine();

  let text;
  try {
    text = await callOcrSpace(dataUrl, key, language, engine);
  } catch (err) {
    globalNativeApi.log("[ocr-space] api failed", clip.hash, err.message || String(err));
    if (opts && opts.notify) {
      globalNativeApi.notification({ title: "OCR 失败", body: err.message || String(err) });
    }
    return null;
  }

  await globalNativeApi.setClipMetadata(clip, {
    ocrText: text,
    ocrSource: "ocr.space",
    ocrLanguage: language,
    ocrEngine: engine,
    ocrAt: Date.now(),
  });
  globalNativeApi.log("[ocr-space] ok", clip.hash, "len=" + text.length);

  if (opts && opts.notify) {
    globalNativeApi.notification({
      title: text ? "OCR 完成" : "OCR 完成（空结果）",
      body: text ? text.slice(0, 120) : "图片中未识别到文字",
    });
  }
  if (text && opts && opts.copy) {
    utools.copyText(text);
  }
  return text;
}

// ── Background auto-OCR ─────────────────────────────────────────────────
globalNativeApi.addClipboardListener("image", async (clip) => {
  if (!(await getAuto())) return;
  if (!(await getKey())) return; // silent until configured
  await ocrClip(clip, { notify: false, copy: false });
});

// ── Manual OCR menu command (image clips) ───────────────────────────────
globalNativeApi.registerMenuCommand("OCR.space 识别图片", async (ctx) => {
  const target = ctx.clips?.[0];
  if (!target) return;
  await ocrClip(target, { notify: true, copy: true });
});

// ── Settings panel (always available) ───────────────────────────────────
function escapeHtml(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

globalNativeApi.registerMenuCommand("OCR.space 设置", async () => {
  const [currentKey, currentLang, currentEngine, currentAuto] = await Promise.all([
    getKey(),
    getLang(),
    getEngine(),
    getAuto(),
  ]);

  const langOpts = LANG_OPTIONS.map((o) => `<option value="${o.value}">${o.label}</option>`).join(
    "",
  );

  document.body.innerHTML = `
    <style>
      body { margin:0; padding:14px; font-family: system-ui; background:#fff; color:#111; font-size:13px; }
      h3 { margin:0 0 10px; font-size:14px; }
      label { display:block; margin:10px 0 4px; color:#555; font-size:12px; }
      input[type=text], input[type=password], select {
        width:100%; box-sizing:border-box; padding:6px 8px; font-size:13px;
        border:1px solid #d4d4d8; border-radius:4px; background:#fafafa;
      }
      .row { display:flex; gap:8px; align-items:center; }
      .row.checkbox { margin-top:10px; }
      .actions { display:flex; gap:8px; margin-top:14px; justify-content:flex-end; }
      button { padding:6px 14px; font-size:13px; border-radius:4px; cursor:pointer; border:1px solid #d4d4d8; background:#f4f4f5; }
      button.primary { background:#2563eb; color:#fff; border-color:#2563eb; }
      .hint { margin-top:10px; font-size:11px; color:#888; line-height:1.5; }
      .hint a { color:#2563eb; text-decoration:none; }
    </style>
    <h3>OCR.space 设置</h3>

    <label for="k">API Key</label>
    <input id="k" type="password" value="${escapeHtml(currentKey)}" placeholder="K12345678901234" />

    <label for="l">识别语言</label>
    <select id="l">${langOpts}</select>

    <label for="e">OCR 引擎</label>
    <select id="e">
      <option value="2">Engine 2（推荐，支持 auto / 更准）</option>
      <option value="1">Engine 1（单语言、更快）</option>
    </select>

    <div class="row checkbox">
      <input id="a" type="checkbox" />
      <label for="a" style="margin:0">自动 OCR 新图片（后台）</label>
    </div>

    <div class="actions">
      <button id="cancel">取消</button>
      <button id="save" class="primary">保存</button>
    </div>

    <div class="hint">
      免费 API Key 申请：<a id="signup" href="${SIGNUP_URL}">${SIGNUP_URL}</a><br>
      免费额度：每月约 25,000 次，每张图 ≤ 1MB。识别结果会写入剪贴项的 metadata（<code>ocrText</code>），未来图片文字搜索可以直接复用。
    </div>
  `;

  document.getElementById("l").value = currentLang;
  document.getElementById("e").value = currentEngine;
  document.getElementById("a").checked = !!currentAuto;
  document.getElementById("signup").addEventListener("click", (ev) => {
    ev.preventDefault();
    if (typeof utools !== "undefined" && utools.shellOpenExternal) {
      utools.shellOpenExternal(SIGNUP_URL);
    }
  });

  document.getElementById("cancel").addEventListener("click", () => {
    if (globalNativeApi.closePanel) globalNativeApi.closePanel();
  });
  document.getElementById("save").addEventListener("click", async () => {
    const k = document.getElementById("k").value.trim();
    const l = document.getElementById("l").value;
    const e = document.getElementById("e").value;
    const a = document.getElementById("a").checked;
    if (!k) {
      globalNativeApi.notification({ title: "请输入 API Key", body: "" });
      return;
    }
    await Promise.all([
      globalNativeApi.setValue(KEY_STORE, k),
      globalNativeApi.setValue(LANG_STORE, l),
      globalNativeApi.setValue(ENGINE_STORE, e),
      globalNativeApi.setValue(AUTO_STORE, a),
    ]);
    globalNativeApi.notification({
      title: "OCR.space 设置已保存",
      body: a ? "已开启后台自动 OCR" : "",
    });
    if (globalNativeApi.closePanel) globalNativeApi.closePanel();
  });

  await globalNativeApi.showPanel({ width: 420, height: 460, placement: "center" });
});

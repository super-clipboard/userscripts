# ocr-space

通过 [ocr.space](https://ocr.space/ocrapi) 的在线 OCR API 对剪贴板图片做识别。

## 准备

1. 在 <https://ocr.space/ocrapi/freekey> 申请免费 API Key（每月约 25,000 次，单图 ≤ 1MB）。
2. 在 SuperClipboard 中安装本脚本，右键任意剪贴项 → **OCR.space 设置**，填入 API Key 与语言。
3. 可选勾选「自动 OCR 新图片（后台）」让脚本在每次复制图片时自动识别。

## 行为

- 手动：右键图片 → **OCR.space 识别图片**。识别结果会写入剪贴板，并以通知形式预览。
- 自动：后台监听新图片，识别完成后把结果写入宿主专用的 `ocr/{hash}` 文档（供内置「图片文字搜索」复用），不打扰用户。

```js
// 写入宿主的 ocr/{hash} 文档（跨脚本共享、与图片内容寻址）
await globalNativeApi.setClipOcrText(clip.hash, text);
```

同一图片内容（同 hash）只存一份识别结果，卸载/重装本脚本后仍保留。

## 隐私

- API Key 与所有偏好通过 `globalNativeApi.setValue` 存在脚本沙箱内，不与其他脚本共享。
- 图片字节会以 base64 形式 POST 到 `https://api.ocr.space/parse/image`。介意的请勿开启自动 OCR。

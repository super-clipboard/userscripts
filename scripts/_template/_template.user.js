// ==UserScript==
// @name         示例脚本
// @namespace    com.example.template
// @version      0.1.0
// @description  复制本目录并改成你的脚本，删除本说明。
// @author       you
// @run-at       foreground
// @match-clip   text
// @grant        globalNativeApi.*
// @updateURL    https://cdn.jsdelivr.net/gh/super-clipboard/userscripts@latest/scripts/_template/_template.user.js
// ==/UserScript==

globalNativeApi.registerMenuCommand("Hello", (ctx) => {
  globalNativeApi.notification({ title: "Hello", body: ctx.clip?.hash ?? "" });
});

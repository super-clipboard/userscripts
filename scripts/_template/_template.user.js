// ==UserScript==
// @name         示例脚本
// @namespace    com.example.template
// @version      0.1.0
// @description  复制本目录并改成你的脚本，删除本说明。
// @author       you
// @homepage     https://example.com
// @run-at       foreground
// @match-clip   text
// @grant        globalNativeApi.registerMenuCommand
// @grant        globalNativeApi.notification
// @tag          example
// @preinstall   false
// ==/UserScript==

globalNativeApi.registerMenuCommand("Hello", (ctx) => {
  globalNativeApi.notification({ title: "Hello", body: ctx.clips?.[0]?.hash ?? "" });
});

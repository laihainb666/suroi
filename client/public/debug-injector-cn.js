/* Suroi 万能调试菜单 — 中文版入口 (Chinese entry for the universal debug injector) */
(function () {
    window.SUROI_DEBUG_LANG = "zh";
    if (window.__SUROI_INJECTOR__) return;
    var s = document.createElement("script");
    s.src = "/debug-injector.js";
    s.onload = function () { console.log("[injector] 已加载中文版万能调试菜单"); };
    document.head.appendChild(s);
})();

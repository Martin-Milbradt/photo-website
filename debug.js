// Append `?debug=1` to any page URL to load the eruda DevTools overlay (a
// floating console that works inside in-app WebViews where Safari Web
// Inspector cannot attach, e.g. Telegram on iOS 16.4+). Sets window.__DEBUG
// synchronously so firebase-config.js can also flip Firestore into verbose
// logging when this flag is on. Only fetches the eruda bundle when the flag
// is present, so production loads are unaffected.
(function () {
    if (new URLSearchParams(location.search).get("debug") !== "1") return;
    window.__DEBUG = true;
    var s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/eruda";
    s.onload = function () {
        if (!window.eruda) return;
        window.eruda.init();
        console.log("[debug] eruda overlay initialized");
    };
    document.head.appendChild(s);
})();

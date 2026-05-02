// Append `?debug=1` to any page URL to load the eruda DevTools overlay (a
// floating console that works inside in-app WebViews where Safari Web
// Inspector cannot attach, e.g. Telegram on iOS 16.4+). Sets window.__DEBUG
// synchronously so firebase-config.js can also flip Firestore into verbose
// logging when this flag is on. Only fetches the eruda bundle when the flag
// is present, so production loads are unaffected.
//
// Also installs a small "Dump" button next to eruda's wrench - tap it to
// open every captured log line in a full-screen, selectable textarea with
// Copy / Close. Working around how finicky it is to select multi-line text
// inside the eruda console panel on mobile. Captures into our own buffer
// rather than scraping eruda's DOM, so it survives eruda version changes
// and also catches uncaught errors / promise rejections.
(function () {
    if (new URLSearchParams(location.search).get("debug") !== "1") return;
    window.__DEBUG = true;

    var buffer = [];
    window.__DEBUG_LOGS = buffer;

    function formatArg(a) {
        if (typeof a === "string") return a;
        if (a instanceof Error) return a.stack || a.message || String(a);
        if (a === null || a === undefined) return String(a);
        try {
            return JSON.stringify(a);
        } catch {
            return String(a);
        }
    }

    function record(level, args) {
        buffer.push({
            ts: new Date().toISOString(),
            level: level,
            text: Array.prototype.map.call(args, formatArg).join(" "),
        });
    }

    ["log", "warn", "error", "info", "debug"].forEach(function (method) {
        var original = console[method].bind(console);
        console[method] = function () {
            record(method, arguments);
            return original.apply(console, arguments);
        };
    });

    window.addEventListener("error", function (e) {
        record("uncaught", [
            e.message,
            "at",
            (e.filename || "?") + ":" + (e.lineno || "?") + ":" + (e.colno || "?"),
            e.error && e.error.stack ? e.error.stack : "",
        ]);
    });

    window.addEventListener("unhandledrejection", function (e) {
        record("rejection", [e.reason]);
    });

    var s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/eruda";
    s.onload = function () {
        if (!window.eruda) return;
        window.eruda.init();
        console.log("[debug] eruda overlay initialized");
    };
    document.head.appendChild(s);

    function installDumpButton() {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = "Dump";
        btn.style.cssText =
            "position:fixed;top:8px;right:8px;z-index:99998;padding:6px 10px;" +
            "background:#222;color:#fff;border:1px solid #555;border-radius:4px;" +
            "font:14px sans-serif;cursor:pointer;";
        btn.addEventListener("click", showLogOverlay);
        document.body.appendChild(btn);
    }

    function bufferToText() {
        return buffer
            .map(function (e) {
                return "[" + e.ts + "] " + e.level.toUpperCase() + " " + e.text;
            })
            .join("\n");
    }

    function showLogOverlay() {
        var text = bufferToText();

        var overlay = document.createElement("div");
        overlay.style.cssText =
            "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.92);" +
            "display:flex;flex-direction:column;padding:12px;";

        var ta = document.createElement("textarea");
        ta.value = text;
        ta.readOnly = true;
        ta.style.cssText =
            "flex:1;width:100%;background:#fff;color:#000;font:12px monospace;" +
            "padding:8px;border:0;resize:none;";

        var bar = document.createElement("div");
        bar.style.cssText = "display:flex;gap:8px;margin-top:8px;";

        var copy = document.createElement("button");
        copy.type = "button";
        copy.textContent = "Copy";
        copy.style.cssText = "flex:1;padding:12px;font:14px sans-serif;";
        copy.addEventListener("click", function () {
            ta.focus();
            ta.select();
            ta.setSelectionRange(0, text.length);
            var done = function () {
                copy.textContent = "Copied!";
            };
            var fallback = function () {
                try {
                    document.execCommand("copy");
                    done();
                } catch {
                    copy.textContent = "Long-press textarea to copy";
                }
            };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(done, fallback);
            } else {
                fallback();
            }
        });

        var close = document.createElement("button");
        close.type = "button";
        close.textContent = "Close";
        close.style.cssText = "flex:1;padding:12px;font:14px sans-serif;";
        close.addEventListener("click", function () {
            overlay.remove();
        });

        bar.appendChild(copy);
        bar.appendChild(close);
        overlay.appendChild(ta);
        overlay.appendChild(bar);
        document.body.appendChild(overlay);
    }
})();

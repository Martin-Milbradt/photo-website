// Firebase configuration
// Client-side Firebase config is public by design: the apiKey identifies the
// project, not authenticates it. Real security comes from the Firestore rules.
// If you fork this repo, replace these values with your own Firebase project
// (see firebase-config.example.js). Otherwise your app will write to this
// project's Firestore.
const firebaseConfig = {
    apiKey: "AIzaSyC4MDE158p_QnDiwpwfGRPJOZioBK4d8UY",
    authDomain: "photobook-birgit.firebaseapp.com",
    projectId: "photobook-birgit",
    storageBucket: "photobook-birgit.firebasestorage.app",
    messagingSenderId: "111894783878",
    appId: "1:111894783878:web:ab1d92320326e936f22e07",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
// eslint-disable-next-line no-unused-vars
const db = firebase.firestore();
// Restrictive in-app WebViews (notably Telegram on iOS) drop the streaming
// WebChannel connection Firestore uses by default, leaving .get() requests
// stuck pending forever. Auto-detect falls back to long-polling on those
// transports without penalising browsers where streaming works.
db.settings({
    experimentalAutoDetectLongPolling: true,
});
// When ?debug=1 is set (see debug.js), surface the underlying transport /
// auth handshake events so we can see what's stalling in the eruda overlay.
if (window.__DEBUG && firebase.firestore.setLogLevel) {
    firebase.firestore.setLogLevel("debug");
    console.log("[debug] Firestore verbose logging enabled");
}
// Offline persistence keeps Firestore data in IndexedDB and serves onSnapshot
// listeners from cache first, then streams deltas from the server. This gives
// instant renders on return visits and only fetches what actually changed.
//
// We skip persistence inside iOS in-app WebViews (Telegram, WhatsApp,
// Instagram, etc.). On those, WKWebView holds the IndexedDB connection from
// the previous page open during in-app navigation, so the new page hangs
// forever inside `updateClientMetadataAndTryBecomePrimary` waiting to write
// its client metadata. Real Mobile Safari sends both `Safari/` and `Version/`
// in its User-Agent; in-app WebViews are missing one or both. Network reads
// are still cheap (~100-300 ms) and the localStorage prerender for the
// photobook list keeps the index page instant on return visits.
//
// `failed-precondition` fires if persistence is already enabled by another
// client in the same origin; `unimplemented` fires on browsers without
// IndexedDB (e.g. Safari private mode). Both are harmless - we keep working
// with network-only reads.
const ua = navigator.userAgent;
const isIOSInAppWebView =
    /iPhone|iPad|iPod/.test(ua) && (!/Safari\//.test(ua) || !/Version\//.test(ua));
if (!isIOSInAppWebView) {
    db.enablePersistence().catch((error) => {
        console.warn("Firestore offline persistence not available:", error.code || error.message || error);
    });
} else if (window.__DEBUG) {
    console.log("[debug] iOS in-app WebView detected, skipping Firestore persistence");
}

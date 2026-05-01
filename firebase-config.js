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
// When ?debug=1 is set (see debug.js), surface Firestore's transport / auth
// handshake events so we can see what's happening in the eruda overlay.
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
// its client metadata. UA detection is unreliable - modern Telegram on iOS
// sends a User-Agent byte-identical to Mobile Safari - so we fingerprint the
// runtime instead: WKWebView exposes `window.webkit.messageHandlers` for the
// native bridge, real Mobile Safari does not expose a `window.webkit`
// namespace at all.
//
// The `.catch` handles `unimplemented` on browsers without IndexedDB (e.g.
// Safari private mode); the app still works, just without the cache.
const isWKWebView = !!window.webkit?.messageHandlers;
if (!isWKWebView) {
    db.enablePersistence().catch((error) => {
        console.warn("Firestore offline persistence not available:", error.code || error.message || error);
    });
} else if (window.__DEBUG) {
    console.log("[debug] WKWebView detected, skipping Firestore persistence");
}

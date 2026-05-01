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
// `failed-precondition` fires if a previous client in the same origin still
// holds the persistence lease - typically during in-WebView navigation in
// Telegram on iOS, where WKWebView does not fire `pagehide` reliably so the
// outgoing page never releases its lease. The new page silently falls back
// to network-only reads, which is the right behaviour: the alternative,
// `synchronizeTabs: true`, would block forever inside
// `updateClientMetadataAndTryBecomePrimary` waiting to take the lease over.
// `unimplemented` fires on browsers without IndexedDB (e.g. Safari private
// mode); same harmless fallback.
db.enablePersistence().catch((error) => {
    console.warn("Firestore offline persistence not available:", error.code || error.message || error);
});

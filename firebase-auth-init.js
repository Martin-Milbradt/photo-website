// Pre-initialize Firebase Auth via the modular SDK so that the cross-origin
// helper iframe (loaded from `authDomain` = photobook-birgit.firebaseapp.com)
// is never created. Safari's ITP blocks that iframe from accessing the parent
// frame whenever `authDomain` differs from the page origin, which produces
// the console error "Blocked a frame with origin ... from accessing a frame
// with origin ...". The iframe only exists to support popup / redirect OAuth
// flows and cross-tab session sync; this app uses signInAnonymously only, so
// omitting the popupRedirectResolver costs nothing.
//
// This module runs as a deferred script AFTER firebase-config.js (which calls
// firebase.initializeApp) but BEFORE auth.js's DOMContentLoaded handler issues
// the first `firebase.auth()` call. The compat library then picks up this
// pre-initialized auth instance instead of creating one with the default
// resolver.

import {
    initializeAuth,
    indexedDBLocalPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

initializeAuth(firebase.app(), {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence],
});

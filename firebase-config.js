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
// Offline persistence keeps Firestore data in IndexedDB and serves onSnapshot
// listeners from cache first, then streams deltas from the server. This gives
// instant renders on return visits and only fetches what actually changed.
// `failed-precondition` fires if multiple tabs are open without sync; handled
// by `synchronizeTabs`. `unimplemented` fires on browsers without IndexedDB
// (e.g. Safari private mode); the app still works, just without the cache.
db.enablePersistence({ synchronizeTabs: true }).catch((error) => {
    console.warn("Firestore offline persistence not available:", error.code || error.message || error);
});

// Firebase configuration template
// Copy this file to firebase-config.js and replace the values with your
// own Firebase project. Get them from:
//   Firebase Console -> Project Settings -> Your apps -> Web app
//
// Note: client-side Firebase config is public by design. The apiKey just
// identifies the project; security comes from your Firestore rules.
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
};

firebase.initializeApp(firebaseConfig);
// eslint-disable-next-line no-unused-vars
const db = firebase.firestore();

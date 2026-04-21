# Family Photobooks Website

Statische Website zum Teilen von PosterXXL / PhotoConnector Fotobüchern. Drei Rollen (Familie, Freunde, Admin) mit je eigenem Passwort. Läuft auf GitHub Pages, Daten in Firebase Firestore.

## Setup

1. Firebase-Projekt anlegen, Firestore aktivieren, folgende Rules setzen:

    ```javascript
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /photobooks/{document=**} {
          allow read, write: if true;
        }
        match /config/auth {
          allow read: if true;
          allow create: if !exists(/databases/$(database)/documents/config/auth);
          allow update, delete: if false;
        }
      }
    }
    ```

2. `firebase-config.example.js` nach `firebase-config.js` kopieren und die Werte aus der Firebase Console eintragen.
3. `npm install && npm run build-css`.
4. Auf GitHub Pages deployen (Settings → Pages → Branch `main`).
5. `setup.html` einmal im Browser öffnen und die drei Passwörter festlegen.

Fotobücher hinzufügen über `admin.html`. Passwörter später ändern: Dokument `config/auth` direkt in der Firebase Console bearbeiten.

## Hinweis

Clientseitige Passwortprüfung, kein Ersatz für echte Authentifizierung. Die Firebase-Config ist öffentlich, Schutz kommt aus den Firestore-Rules.

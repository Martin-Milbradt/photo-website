# Family Photobooks Website

Eine einfache, passwortgeschützte Website zum Hosten und Teilen von PosterXXL / PhotoConnector Fotobüchern mit Familie und Freunden.

## Features

- **Drei Rollen**: Familie, Freunde, Admin. Jede Rolle hat ein eigenes Passwort.
- **Verwaltungsinterface**: Admin-Panel zum Hinzufügen, Bearbeiten und Löschen von Fotobüchern.
- **Freunde-Filter**: Freunde sehen nur Fotobücher, die ausdrücklich für sie freigegeben sind.
- **Karten-Ansicht**: Fotobücher mit Ortsangabe werden auf einer OpenStreetMap-Karte angezeigt (Leaflet, OSM DE-Tiles).
- **Automatische URL-Konvertierung**: PosterXXL-URLs werden automatisch in einbettungsfreundliche PhotoConnector-URLs umgewandelt.
- **Globale Speicherung**: Fotobücher und Auth-Konfiguration liegen in Firebase Firestore.
- **Responsives Design**: Tailwind CSS, funktioniert auf Desktop und Mobilgeräten.

## Architektur

Rein clientseitige Static-Site. Keine Backend-Logik, kein Build-Step zur Deploy-Zeit (außer Tailwind). Deployment via GitHub Pages.

- Firebase Firestore hält zwei Collections:
  - `photobooks` - die Fotobuch-Einträge
  - `config/auth` - SHA-256-Hashes der drei Passwörter
- Passwörter werden im Browser gehasht (SHA-256 mit konstantem Pepper) und gegen den in Firestore gespeicherten Hash verglichen.

### Sicherheitsmodell (Grenzen)

Das ist ein statisches Hobby-Projekt, keine echte Authentifizierung. Wichtig zu wissen:

- Firebase-Config ist öffentlich. Jeder, der die Seite besucht, sieht `projectId` und `apiKey` im HTML.
- Clientseitige Passwortprüfung lässt sich umgehen. Wer es will, kann per DevTools direkt Firestore lesen, wenn die Rules es erlauben.
- Echte Sicherheit kommt nur aus den Firestore-Rules, nicht aus geheim gehaltenen Passwörtern.
- Für echte Sicherheit: Firebase Authentication einbauen und die Rules so schreiben, dass nur authentifizierte Admins schreiben dürfen. Das ist in diesem Projekt bewusst nicht umgesetzt.

## Setup (eigene Instanz aufsetzen)

### 1. Firebase-Projekt anlegen

1. Auf [Firebase Console](https://console.firebase.google.com/) ein neues Projekt anlegen.
2. Im Projekt **Firestore Database** aktivieren (Production mode oder Test mode, wir setzen die Rules gleich selbst).
3. Standort in der Nähe der Nutzer wählen.

### 2. Firestore Rules setzen

Empfohlene Rules (lesbar für alle, Auth-Config nur einmalig anlegbar):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /photobooks/{document=**} {
      allow read: if true;
      allow write: if true;
    }
    match /config/auth {
      allow read: if true;
      allow create: if !exists(/databases/$(database)/documents/config/auth);
      allow update, delete: if false;
    }
  }
}
```

Mit diesen Rules kann:

- jeder die Fotobücher und die Passwort-Hashes lesen (clientseitige Hash-Prüfung);
- jeder Fotobücher schreiben/löschen (Schutz erfolgt über das Admin-Passwort in der UI, nicht in den Rules);
- `config/auth` genau einmal über `setup.html` angelegt werden, danach ist es gesperrt.

Um Passwörter später zu ändern, bearbeitet man das Dokument `config/auth` direkt in der Firebase Console.

Wer die Schreibrechte für `photobooks` härten will, muss Firebase Authentication einbauen. Das liegt außerhalb dieses Projekts.

### 3. Firebase-Config in die App einfügen

1. In Firebase Console: **Projekteinstellungen** -> **Your apps** -> Web-App (`</>`) hinzufügen.
2. Das `firebaseConfig`-Objekt kopieren.
3. `firebase-config.example.js` nach `firebase-config.js` kopieren und die Werte ersetzen.

`firebase-config.js` wird mit ins Repo commited, damit GitHub Pages die Datei ausliefern kann. Das ist unbedenklich, solange Schritt 2 (Rules) korrekt gesetzt ist.

### 4. Tailwind CSS bauen

```bash
npm install
npm run build-css
```

Für Entwicklung mit Watch-Modus:

```bash
npm run watch-css
```

Die gebaute CSS-Datei `dist/output.css` muss commited werden, da GitHub Pages keinen Build-Step ausführt.

### 5. Passwörter einrichten

1. Die Seite auf GitHub Pages oder lokal öffnen.
2. `setup.html` aufrufen (z. B. `https://deinuser.github.io/photo-website/setup.html`).
3. Die drei Passwörter eingeben und speichern.
4. `setup.html` kann danach nicht mehr verwendet werden (Rules erlauben kein zweites `create`).

### 6. Auf GitHub Pages deployen

1. Repository auf GitHub anlegen.
2. Code pushen.
3. **Settings -> Pages** -> Source: Branch `main`, Root.
4. Die Seite ist unter `https://deinuser.github.io/photo-website/` erreichbar.

### 7. Fotobücher hinzufügen

1. `admin.html` aufrufen.
2. Mit dem Admin-Passwort einloggen.
3. Titel, Datum (`MM.JJJJ`), PosterXXL- oder PhotoConnector-URL (auch `<iframe>`-Snippet), optional Bild-URL und Ort ausfüllen.
4. "Für Freunde verfügbar" setzen, wenn das Fotobuch auch für die Freunde-Rolle sichtbar sein soll.

## Dateien

| Datei                        | Zweck                                                                  |
| ---------------------------- | ---------------------------------------------------------------------- |
| `index.html`                 | Übersichtsseite mit Chronologie und Karte                              |
| `photobook.html`             | Einzelansicht (iframe)                                                 |
| `admin.html`                 | Verwaltung                                                             |
| `setup.html`                 | Einmaliges Einrichten der Passwort-Hashes                              |
| `auth.js`                    | Rollen, Cookies, Passwort-Hashing, Firestore-Config-Fetch              |
| `photobooks.js`              | Firestore-CRUD für Fotobücher, PosterXXL-URL-Konvertierung             |
| `main.js`                    | Übersicht, Karte (Leaflet + Nominatim-Geocoding)                       |
| `photobook-viewer.js`        | Einzelansicht-Logik                                                    |
| `admin.js`                   | Admin-Formular, Liste, Bearbeiten-Modal                                |
| `firebase-config.js`         | Firebase-Projekt-Config (öffentlich, siehe oben)                       |
| `firebase-config.example.js` | Template für Forks                                                     |
| `src/input.css`              | Tailwind-Eingabe                                                       |
| `dist/output.css`            | Gebautes Tailwind (muss commited sein)                                 |

## Hinweise

- Nominatim (OpenStreetMap-Geocoding) hat eine Fair-Use-Policy. Für produktive Last einen eigenen Geocoder oder Cache einbauen.
- Das iframe für PosterXXL/PhotoConnector erfordert, dass der Anbieter `X-Frame-Options` nicht setzt. Wenn die Einbettung bricht, liegt es an deren Seite.
- Für "Passwort vergessen" gibt es keinen Flow. Wenn das Admin-Passwort verloren geht, den `config/auth`-Dokument-Inhalt in der Firebase Console bearbeiten.

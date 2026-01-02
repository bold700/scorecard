# Scorecard - Vechtsport Score App

Een digitale scorecard web app voor vechtsportwedstrijden, gebouwd met React, TypeScript en Material Design 3.

## Features

- 🏆 Toernooi management
- 🥊 Meerdere wedstrijden per toernooi
- 👥 Meerdere juryleden per wedstrijd
- ⚡ Quick buttons voor score invoer (turf-mechanisme)
- 📊 Realtime score berekening
- 📱 Mobile-first PWA
- 🎨 Material Design 3 (Dark mode)

## Tech Stack

- **React 18** met TypeScript
- **Vite** voor build tooling
- **Material UI (MUI)** voor Material Design 3 componenten
- **React Router** voor navigatie
- **Zustand** voor state management
- **Firebase** (voorbereid voor realtime updates)

## Installatie

```bash
npm install
```

## Development

```bash
npm run dev
```

De app draait op http://localhost:3000

## Build

```bash
npm run build
```

## Gebruikersrollen

1. **Organisator**: Maakt toernooien aan en beheert wedstrijden
2. **Officiële Jury**: Houdt officiële scores bij
3. **Publieke Gebruiker**: Kan scores bijhouden voor vergelijking

## Score Input

Scores worden ingevoerd via grote quick buttons:
- +1 Punt Rood/Blauw
- -1 Aftrek Rood/Blauw
- Undo laatste actie

Elke actie wordt gelogd als event voor volledige traceerbaarheid.

## GitHub Pages Deployment

De app is geconfigureerd voor automatische deployment naar GitHub Pages via GitHub Actions.

### Setup

1. Ga naar je GitHub repository settings
2. Navigeer naar "Pages" in het menu
3. Selecteer "GitHub Actions" als source
4. Push naar de `main` of `master` branch om automatisch te deployen

De app wordt automatisch gebouwd en gedeployed bij elke push naar de main branch.

## Firebase Setup (voor gedeelde toernooien)

Om toernooien gedeeld te maken zodat andere gebruikers ze kunnen zien:

1. **Maak een Firebase project aan:**
   - Ga naar [Firebase Console](https://console.firebase.google.com/)
   - Klik op "Add project"
   - Volg de stappen om een nieuw project aan te maken

2. **Activeer Firestore Database:**
   - In je Firebase project, ga naar "Firestore Database"
   - Klik op "Create database"
   - Kies "Start in test mode" (voor development)
   - Selecteer een locatie

3. **Haal je Firebase config op:**
   - Ga naar Project Settings > General
   - Scroll naar "Your apps" en klik op het web icoon (</>)
   - Registreer je app en kopieer de configuratie

4. **Maak een .env bestand:**
   ```bash
   cp .env.example .env
   ```

5. **Vul je Firebase credentials in:**
   Open `.env` en vul de volgende variabelen in:
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

6. **Herstart de dev server:**
   ```bash
   npm run dev
   ```

**Belangrijk:** Zonder Firebase configuratie werkt de app nog steeds, maar gebruikt dan alleen localStorage (lokaal). Met Firebase worden toernooien gedeeld tussen alle gebruikers.

### GitHub Pages Deployment

Voor GitHub Pages deployment moet je ook GitHub Secrets toevoegen:

1. **Ga naar je GitHub repository:**
   - Klik op "Settings" > "Secrets and variables" > "Actions"
   - Klik op "New repository secret"

2. **Voeg de volgende secrets toe:**
   - `VITE_FIREBASE_API_KEY` - Je Firebase API key
   - `VITE_FIREBASE_AUTH_DOMAIN` - Je Firebase auth domain
   - `VITE_FIREBASE_PROJECT_ID` - Je Firebase project ID
   - `VITE_FIREBASE_STORAGE_BUCKET` - Je Firebase storage bucket
   - `VITE_FIREBASE_MESSAGING_SENDER_ID` - Je Firebase messaging sender ID
   - `VITE_FIREBASE_APP_ID` - Je Firebase app ID

3. **Na het toevoegen van de secrets:**
   - Push een nieuwe commit naar de main branch
   - De GitHub Actions workflow zal automatisch de build uitvoeren met de Firebase credentials

## Status

De app ondersteunt nu Firebase Firestore voor gedeelde toernooien. Zonder Firebase configuratie valt de app terug op localStorage voor lokale opslag.


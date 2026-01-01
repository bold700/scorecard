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

## Status

Dit is een MVP versie. Realtime updates via Firebase en offline sync worden later toegevoegd.


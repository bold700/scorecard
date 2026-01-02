# Firebase Debugging Checklist

## Probleem
Firebase werkt lokaal maar niet op GitHub Pages.

## Stappen om te debuggen:

### 1. Controleer GitHub Secrets
Ga naar: https://github.com/bold700/scorecard/settings/secrets/actions

Zorg dat deze 6 secrets bestaan:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### 2. Open Browser Console op GitHub Pages
1. Ga naar: https://bold700.github.io/scorecard/
2. Druk op F12 om Developer Tools te openen
3. Ga naar de "Console" tab
4. Zoek naar deze berichten:
   - "Firebase initialized successfully" → Firebase werkt
   - "Firebase not configured - using demo values" → Secrets zijn niet ingesteld
   - "Firebase not available, saving to localStorage only" → Firebase is niet beschikbaar

### 3. Controleer de Build Logs
1. Ga naar: https://github.com/bold700/scorecard/actions
2. Klik op de laatste workflow run
3. Kijk of de build stap succesvol is
4. Controleer of er errors zijn

### 4. Test of Secrets werken
Als de secrets zijn toegevoegd, moet je:
1. Een nieuwe commit pushen (of de workflow opnieuw draaien)
2. Wachten tot de build klaar is
3. De GitHub Pages versie verversen (Ctrl+Shift+R)

### 5. Als het nog steeds niet werkt
Check de browser console voor:
- Firebase errors
- Network errors
- CORS errors

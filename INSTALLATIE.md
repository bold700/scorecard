# Installatie Instructies

## Probleem met OneDrive

Als je permission errors krijgt tijdens `npm install`, komt dit omdat OneDrive bestanden blokkeert tijdens synchronisatie.

## Oplossingen:

### Optie 1: Project buiten OneDrive verplaatsen (Aanbevolen)

1. Verplaats de `scorecard` folder naar buiten OneDrive, bijvoorbeeld:
   - `C:\dev\scorecard` of
   - `C:\Users\kcati\Documents\GitHub\scorecard` (zonder OneDrive)

2. Open een nieuwe terminal in de nieuwe locatie

3. Voer uit:
```bash
npm install
npm run dev
```

### Optie 2: OneDrive sync tijdelijk uitschakelen

1. Rechtsklik op de scorecard folder in Windows Verkenner
2. Kies "OneDrive" > "Stop syncing this folder"
3. Voer `npm install` uit
4. Herstel sync na installatie

### Optie 3: Wachten en opnieuw proberen

1. Wacht tot OneDrive klaar is met synchroniseren (geen iconen in systeemvak)
2. Voer opnieuw uit: `npm install`
3. Als het nog steeds niet werkt, gebruik Optie 1

## Na installatie:

```bash
npm run dev
```

De app draait dan op http://localhost:3000


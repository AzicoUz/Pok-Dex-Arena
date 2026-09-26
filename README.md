# PokéDex Arena — React 4.1 Music Edition Ultimate

A polished Pokémon collection + trainer-game frontend built with **React, Vite and PokéAPI**. The project keeps the original Azico branding and expands the 3.x release into a multi-mode game dashboard.

## 4.1 systems
- Dashboard / Trainer HQ
- 151 Kanto Pokémon with local cache
- Pokédex 2.0: search, type/collection filters, sorting, favorites, live species data, abilities, habitat, egg groups and moves
- 6-slot Team Builder with drag & drop
- 6v6 Arena with moves, PP, type effectiveness, STAB, critical hits, status effects, switching, field healing and a 3-minute timer
- Wild Zone catch loop with Poké Ball / Great Ball / Ultra Ball
- Inventory deck with capture and healing supplies
- Evolution Lab using live evolution-chain data
- Regions hub with generation roadmap
- Mini Games: Type Guess, silhouette quiz, Quick Quiz and Reaction Rush
- Trainer profile, XP, levels, battle history, streaks and achievements
- Dark / Light / OLED themes
- Floating background music player powered by the Audius API: trending tracks, play/pause, previous/next, seek, volume, genre filter, refresh and minimized mode
- Browser-side Audius API key field in Settings (optional) and VITE_AUDIUS_API_KEY support
- Responsive UI and reduced-motion support
- Persistent state through localStorage

## Run

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Music API

Background music uses Audius as the streaming catalog. The current Audius API exposes track search/trending and a stream endpoint; most read-only endpoints can work without credentials, while an API key can be used for higher rate limits. API keys are documented as safe for frontend use; bearer tokens must not be exposed in browser code.

For local development you can either paste an API key in **Settings → Background music** or place it in `.env` as `VITE_AUDIUS_API_KEY`. The player respects browser autoplay rules, so the first audible playback may require a user gesture.

## Data

Pokémon data is loaded from the public PokéAPI REST service. The first 151 Pokémon are cached in localStorage so repeat visits can avoid downloading the same collection again. Move/species/evolution requests are cached in memory during a session.

## Notes

Battle calculations, capture probability and some trainer/gameplay rules are **frontend simulation mechanics**. They are intentionally simplified and are not a claim of exact main-series Pokémon battle formulas.

## Creator

**Designed & built by Azico**


## 4.1.1 stability fix

This patch fixes a development-time blank-screen race caused by React StrictMode running effects twice. An aborted first PokéAPI request could previously set the loading state to false while the second request was still loading, leaving the Dashboard with an empty Pokémon array.

The loader now tracks the active request and ignores stale progress/error/finally updates. The Dashboard also has a safe empty-data state, and a global Error Boundary shows a recovery screen instead of a completely blank page if an unexpected render error occurs.

### Run locally
```bash
npm install
npm run dev
```
Open the exact local URL shown by Vite, normally `http://localhost:5173/`. If the terminal is already serving an older copy, stop it with `Ctrl+C`, make sure you are in this project folder, then run `npm run dev` again.

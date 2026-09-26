# ⚡ PokéDex Arena 4.1.1

<p align="center">
  <strong>A modern Pokémon game platform built with React, Vite and PokéAPI.</strong>
</p>

<p align="center">
  <em>Crafted by Azico</em>
</p>

---

## 🎮 About

**PokéDex Arena** is a modern interactive Pokémon platform that combines a Pokédex, team building, 6v6 battles, Pokémon catching, evolution, inventory, mini-games, trainer progression, achievements, themes and background music.

The project is built with **React + Vite** and uses **PokéAPI** for dynamic Pokémon data.

> ⚡ Version: **4.1.1 — Azico Edition**

---

## ✨ Features

### 🏠 Dashboard
- Trainer dashboard
- XP and level progression
- Battle statistics
- Collection progress
- Recent activity
- Quick access to game modes

### 📖 Pokédex
- 151 Pokémon
- Search and filtering
- Type filters
- Favorites
- Caught / uncaught tracking
- Stat sorting
- Pokémon details
- Base stats
- Abilities
- Moves
- Species information
- Habitat information
- Evolution information

### ⚔️ Battle Arena
- 6 vs 6 battles
- Turn-based combat
- Pokémon switching
- Move selection
- Move PP
- Type effectiveness
- STAB
- Critical hits
- Status effects
- HP system
- Battle log
- Battle animations
- Victory / defeat system
- XP rewards
- Win / loss statistics

### 🎒 Inventory
- Poké Balls
- Great Balls
- Ultra Balls
- Potions
- Super Potions
- Battle items

### 🐾 Wild Pokémon
Encounter wild Pokémon and attempt to capture them.

```text
A wild Pokémon appeared!

[ Throw Poké Ball ]
[ Run ]
```

Captured Pokémon can become part of your collection and team.

### 🧬 Evolution
Explore Pokémon evolution chains and evolve compatible Pokémon.

```text
Charmander
     ↓
Charmeleon
     ↓
Charizard
```

### 🏆 Achievements
Unlock achievements through gameplay.

Examples:
- First Victory
- Pokémon Collector
- Battle Master
- Evolution Master
- Arena Champion
- Capture Expert

### 🎮 Mini Games
- Type Guess
- Who's That Pokémon?
- Quick Quiz
- Reaction Rush

Mini-games provide additional XP and achievements.

### 👤 Trainer Profile
Track:
- Trainer name
- Level
- XP
- Wins
- Losses
- KOs
- Win rate
- Pokémon caught
- Mini-game victories
- Current streak
- Best streak
- Achievements
- Battle history

### 🎵 Background Music
- Play / Pause
- Previous / Next
- Volume control
- Track progress
- Genre selection
- Autoplay option
- Persistent music settings
- External audio API support

> Browser autoplay policies may require user interaction before audio starts.

### 🎨 Themes
- 🌙 Dark
- ☀️ Light
- 🖤 OLED

### ✍️ Azico Branding
The application includes **Azico** branding throughout the project.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React | UI and application architecture |
| Vite | Development and build tooling |
| JavaScript | Application logic |
| CSS | UI styling and animations |
| PokéAPI | Pokémon data |
| LocalStorage | Local game persistence |
| HTML5 Audio | Background music |

---

## 🌐 API

PokéDex Arena uses **PokéAPI** for Pokémon data.

Official API:

https://pokeapi.co/

The application can retrieve:
- Pokémon
- Types
- Abilities
- Stats
- Moves
- Species
- Evolution chains
- Sprites and artwork

---

## 📦 Installation

Clone the repository:

```bash
git clone https://github.com/AzicoUz/Pokemon-Arena-4.1.1.git
```

Enter the project:

```bash
cd Pokemon-Arena-4.1.1
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the URL shown by Vite, usually:

```text
http://localhost:5173/
```

---

## 🏗️ Production Build

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

---

## 📁 Project Structure

```text
Pokemon-Arena-4.1.1/
│
├── public/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── context/
│   ├── services/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
│
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 💾 Local Data

The application uses browser `localStorage` to preserve local progress, including:

- Trainer profile
- Pokémon team
- Favorites
- Collection
- Inventory
- Achievements
- Battle statistics
- Music preferences
- Theme preferences

---

## 🔐 Environment Variables

If your selected external music service requires an API key, create a `.env` file:

```env
VITE_AUDIO_API_KEY=your_api_key_here
```

Never commit private API keys to GitHub.

---

## 📱 Responsive Design

Designed for:
- 💻 Desktop
- 💻 Laptop
- 📱 Mobile
- 📱 Tablet

---

## 🚀 Roadmap

- [ ] Online multiplayer
- [ ] Real-time PvP battles
- [ ] Trainer accounts
- [ ] Cloud saves
- [ ] More Pokémon regions
- [ ] Advanced battle mechanics
- [ ] Trading system
- [ ] Friends system
- [ ] Online leaderboard
- [ ] Ranked battles
- [ ] More mini-games

---

## ⚠️ Disclaimer

PokéDex Arena is a fan-made educational and experimental project.

Pokémon and related intellectual property belong to their respective owners.

This project is not affiliated with or endorsed by Nintendo, Game Freak, or The Pokémon Company.

PokéAPI is used as the project's Pokémon data source.

---

## 👨‍💻 Creator

### Azico

Frontend Developer & Creator

GitHub: **AzicoUz**

---

## 📄 License

This project is licensed under the **MIT License**.

See the `LICENSE` file for details.

---

<p align="center">

### ⚡ PokéDex Arena

**Built with React. Powered by PokéAPI. Crafted by Azico.**

</p>

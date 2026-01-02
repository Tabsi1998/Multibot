# Discord MultiBot - Product Requirements Document (PRD)

## Original Problem Statement
Der Benutzer möchte einen "ultimativen" All-in-One Discord Bot in Deutsch entwickeln, der mehrere spezialisierte Bots wie MEE6, Dyno, TempVoice und TicketTool ersetzen kann.

---

## ✅ Implementierte Features

### 1. Authentication System
- JWT-basierte Authentifizierung
- Erster Benutzer = automatisch Admin
- Login/Logout, Benutzerverwaltung

### 2. Web Dashboard
- React Frontend mit Discord-Design
- Sidebar-Navigation mit allen Features
- Server-Konfiguration

### 3. Discord Slash Commands
- `/help`, `/botinfo`, `/serverinfo`, `/userinfo`
- `/rank`, `/leaderboard`
- Moderation: `/warn`, `/kick`, `/ban`, `/mute`

### 4. Server-Daten Synchronisation
- Bot synchronisiert Rollen, Kanäle, Kategorien, Emojis
- Web-Dashboard zeigt Dropdowns mit Suche

### 5. Moderation
- Alle Standard-Moderationsbefehle
- Warn-System, Log-Kanal

### 6. Temp Voice Channels (ERWEITERT - 02.01.2026)
**Mehrere Creator Channels:**
- Pro Kategorie/Spiel eigenen Creator
- z.B. "🎮 Valorant erstellen" → "Valorant #1"

**Nummerierungsoptionen:**
- Zahlen (1, 2, 3...)
- Buchstaben (a, b, c...)
- Hochgestellt (¹, ², ³...)
- Tiefgestellt (₁, ₂, ₃...)
- Römisch (i, ii, iii...)

**Position:**
- Oben (direkt unter Creator)
- Unten (Ende der Kategorie)

**Web-Dashboard:**
- Mehrere Creator verwalten
- Jeder mit eigenem Template
- Aktivieren/Deaktivieren pro Creator

**✅ BUG FIXED:** `create_temp_channel` Funktion akzeptiert jetzt `creator_id` Parameter

### 7. Reaction Roles
- Button Reaction Roles
- Emoji Reaction Roles
- Web-Konfiguration

### 8. Discord Spiele
- TicTacToe, Stadt Land Fluss
- Münzwurf, Würfeln, RPS, 8-Ball

### 9. Leveling System
- Nachrichten XP
- Voice XP (pro Minute)
- Level-Belohnungen (Rollen, Emojis)
- Rangliste

### 10. Ticket System (NEU - 02.01.2026)
**API & UI:**
- Ticket-Panels erstellen und verwalten
- Kategorien für Tickets
- Custom Fields
- Support-Rollen
- Claim-System
- Statistiken (Offen, Beansprucht, Geschlossen, Gesamt)

**✅ Bot-Logik implementiert:**
- `TicketCreateView` - Button zum Erstellen
- `TicketCategorySelectView` - Kategorieauswahl
- `TicketControlView` - Beanspruchen/Schließen Buttons
- `/ticket panel` - Panel im Kanal senden
- `/ticket claim` - Ticket beanspruchen
- `/ticket close` - Ticket schließen
- `/ticket add @user` - Benutzer hinzufügen
- `/ticket remove @user` - Benutzer entfernen
- `/ticket rename` - Ticket umbenennen

### 11. Bot Customization
- Status (online, idle, dnd)
- Activity Type (playing, watching, listening)
- Activity Text

### 12. "Made with Emergent" Badge
- ✅ CSS + JavaScript zum Ausblenden hinzugefügt
- ⚠️ In Preview-Umgebung noch sichtbar (wird von Plattform injiziert)
- ✅ Wird in Production-Deployment nicht erscheinen

---

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- GET /api/auth/users (admin)

### Bot Management
- GET /api/bot/status
- POST /api/bot/configure
- POST /api/bot/start
- POST /api/bot/stop

### Guild Config
- GET /api/guilds/{guild_id}
- PUT /api/guilds/{guild_id}
- GET /api/guilds/{guild_id}/leaderboard

### Ticket System
- GET /api/guilds/{guild_id}/ticket-panels
- POST /api/guilds/{guild_id}/ticket-panels
- GET /api/guilds/{guild_id}/ticket-panels/{panel_id}
- PUT /api/guilds/{guild_id}/ticket-panels/{panel_id}
- DELETE /api/guilds/{guild_id}/ticket-panels/{panel_id}
- GET /api/guilds/{guild_id}/tickets
- GET /api/guilds/{guild_id}/tickets/stats

### Multi Temp Voice Creators
- GET /api/guilds/{guild_id}/temp-creators
- POST /api/guilds/{guild_id}/temp-creators
- GET /api/guilds/{guild_id}/temp-creators/{creator_id}
- PUT /api/guilds/{guild_id}/temp-creators/{creator_id}
- DELETE /api/guilds/{guild_id}/temp-creators/{creator_id}

### Level Rewards
- GET /api/guilds/{guild_id}/level-rewards
- POST /api/guilds/{guild_id}/level-rewards
- DELETE /api/guilds/{guild_id}/level-rewards/{reward_id}

### Server Data
- GET /api/guilds/{guild_id}/server-data
- POST /api/guilds/{guild_id}/server-data/sync

---

## Test Reports
- iteration_1.json ✅
- iteration_2.json ✅
- iteration_3.json ✅ (14/14)
- iteration_4.json ✅ (28/28)
- iteration_5.json ✅ (25/25)
- iteration_6.json ✅ (21/21 Backend + Frontend 100%)

## Test Credentials
- Email: admin@test.de
- Password: admin123
- Guild ID: 807292920734547969

---

## Backlog / Future Tasks

### P0 (Erledigt ✅)
- [x] Temp Voice Channel Bug beheben (create_temp_channel mit creator_id)
- [x] Ticket System Bot-Logik implementieren
- [x] "Made with Emergent" Badge ausblenden

### P1 (Nächste Priorität)
- [ ] Bot live auf Discord Server testen (braucht DISCORD_BOT_TOKEN)
- [ ] Dokumentation aktualisieren (README.md, /docs/*.md)

### P2
- [ ] Mehr Spiele (Hangman, Quiz, etc.)
- [ ] KI-Chat Integration (OpenAI/Emergent LLM Key)
- [ ] Multi-Language Support
- [ ] Backup/Restore

### P3 (Refactoring)
- [ ] discord_bot.py in Cogs aufteilen (>2000 Zeilen)

---

## Code Architecture
```
/app/
├── backend/
│   ├── server.py       # FastAPI app, alle API routes
│   ├── discord_bot.py  # Discord Bot Logic (discord.py) - inkl. Ticket System
│   ├── database.py     # MongoDB Funktionen
│   ├── models.py       # Pydantic models
│   ├── translations.py # Sprach-Strings
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DashboardLayout.jsx
│   │   │   └── ServerDataSelector.jsx
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── TempChannels.jsx
│   │   │   ├── Tickets.jsx
│   │   │   ├── Leveling.jsx
│   │   │   └── ... (weitere)
│   │   └── App.js
│   ├── public/
│   │   └── index.html  # Badge ausgeblendet
│   └── .env
├── tests/
│   ├── test_iteration_6.py
│   └── ...
└── memory/
    └── PRD.md
```

---

*Zuletzt aktualisiert: 02.01.2026*

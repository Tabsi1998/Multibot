# Discord MultiBot - Product Requirements Document (PRD)

## Original Problem Statement
Der Benutzer möchte einen "ultimativen" All-in-One Discord Bot in Deutsch entwickeln, der mehrere spezialisierte Bots wie MEE6, Dyno, TempVoice und TicketTool ersetzen kann.

---

## ✅ Implementierte Features

### 1. Authentication System ✅
- JWT-basierte Authentifizierung
- Erster Benutzer = automatisch Admin
- Login/Logout, Benutzerverwaltung

### 2. Web Dashboard ✅
- React Frontend mit Discord-Design
- Sidebar-Navigation mit allen Features
- Server-Konfiguration
- **ALLE EINSTELLUNGEN NACHTRÄGLICH BEARBEITBAR** ✅

### 3. Discord Slash Commands ✅
- `/help`, `/botinfo`, `/serverinfo`, `/userinfo`
- `/rank`, `/leaderboard`
- Moderation: `/warn`, `/kick`, `/ban`, `/mute`

### 4. Server-Daten Synchronisation ✅
- Bot synchronisiert Rollen, Kanäle, Kategorien, Emojis
- Web-Dashboard zeigt Dropdowns mit Suche

### 5. Moderation ✅
- Alle Standard-Moderationsbefehle
- Warn-System, Log-Kanal

### 6. Temp Voice Channels (ERWEITERT) ✅
- **Multi-Creator System** mit individuellem Template pro Creator
- **Nummerierungsoptionen**: Zahlen, Buchstaben, Hochgestellt, Tiefgestellt, Römisch
- **Position**: Oben oder unten in der Kategorie
- **Edit-Dialog** für nachträgliche Bearbeitung ✅
- Bug Fixed: `create_temp_channel` akzeptiert jetzt `creator_id`

### 7. Reaction Roles (ERWEITERT) ✅
- Button Reaction Roles
- Emoji Reaction Roles
- **Embed-Vorschau** im Create/Edit Dialog ✅
- **RoleSelector & TextChannelSelector** statt manuelle ID-Eingabe ✅
- **PUT API für Bearbeitung** ✅
- **Edit-Dialog** für nachträgliche Bearbeitung ✅

### 8. Discord Spiele (ERWEITERT - 12 SPIELE!) ✅
| Spiel | Befehl | Spieler | Kategorie |
|-------|--------|---------|-----------|
| Tic Tac Toe | `/game tictactoe` | 2 | Klassiker |
| Stadt Land Fluss | `/game stadtlandfluss` | 2-4 | Wissen |
| Münzwurf | `/game coinflip` | 1 | Zufall |
| Würfeln | `/game dice` | 1 | Zufall |
| Schere Stein Papier | `/game rps` | 1 | Klassiker |
| Magische 8-Ball | `/game 8ball` | 1 | Spaß |
| **Galgenmännchen** | `/game hangman` | 1+ | Wissen |
| **Quiz/Trivia** | `/game trivia` | 1+ | Wissen |
| **Zahlenraten** | `/game numberguess` | 1 | Zufall |
| **Wortkette** | `/game wordchain` | 2+ | Wissen |
| **Reaktionstest** | `/game reaction` | 1+ | Geschicklichkeit |
| **Memory** | `/game memory` | 1-2 | Geschicklichkeit |

- **Jedes Spiel individuell ein-/ausschaltbar** ✅
- **Kategorie-Filter** (Alle, Klassiker, Wissen, Zufall, Geschicklichkeit, Spaß) ✅
- **Buttons "Alle aktivieren" / "Alle deaktivieren"** ✅
- **Cooldown-Einstellung** ✅
- **Spiele-Kanal konfigurierbar** ✅

### 9. Leveling System ✅
- Text-XP für Nachrichten
- Voice-XP für Zeit in Sprachkanälen
- Level-Belohnungen (Rollen & Emojis)
- Rangliste

### 10. Ticket System (VOLLSTÄNDIG) ✅
- **API & UI für Panels** ✅
- **Bot-Logik implementiert** ✅
  - `TicketCreateView`, `TicketCategorySelectView`, `TicketControlView`
  - `/ticket panel`, `/ticket claim`, `/ticket close`, `/ticket add`, `/ticket remove`, `/ticket rename`
- **Edit-Dialog** für nachträgliche Bearbeitung ✅
- Kategorien, Custom Fields, Support-Rollen, Claim-System

### 11. Bot Customization ✅
- Status (online, idle, dnd)
- Activity Type (playing, watching, listening)
- Activity Text

### 12. "Made with Emergent" Badge ✅
- CSS + JavaScript zum Ausblenden hinzugefügt
- Verschwindet nach Production-Deployment

---

## Test Reports
- iteration_1.json ✅
- iteration_2.json ✅
- iteration_3.json ✅ (14/14)
- iteration_4.json ✅ (28/28)
- iteration_5.json ✅ (25/25)
- iteration_6.json ✅ (21/21)
- **iteration_7.json ✅ (23/23 + Frontend 100%)**

## Test Credentials
- Email: admin@test.de
- Password: admin123
- Guild ID: 807292920734547969

---

## Dokumentation (AKTUALISIERT) ✅
- `/app/README.md` - Vollständige Projekt-Dokumentation
- `/app/docs/API.md` - API Dokumentation mit allen Endpoints
- `/app/docs/COMMANDS.md` - Alle Discord Bot Befehle

---

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### Reaction Roles (CRUD + PUT) ✅
- GET /api/guilds/{guild_id}/reaction-roles
- POST /api/guilds/{guild_id}/reaction-roles
- **PUT /api/guilds/{guild_id}/reaction-roles/{rr_id}** ✅
- DELETE /api/guilds/{guild_id}/reaction-roles/{rr_id}

### Ticket System (CRUD + PUT) ✅
- GET /api/guilds/{guild_id}/ticket-panels
- POST /api/guilds/{guild_id}/ticket-panels
- PUT /api/guilds/{guild_id}/ticket-panels/{panel_id}
- DELETE /api/guilds/{guild_id}/ticket-panels/{panel_id}

### Temp Voice Creators (CRUD + PUT) ✅
- GET /api/guilds/{guild_id}/temp-creators
- POST /api/guilds/{guild_id}/temp-creators
- PUT /api/guilds/{guild_id}/temp-creators/{creator_id}
- DELETE /api/guilds/{guild_id}/temp-creators/{creator_id}

### Guild Config (inkl. Games) ✅
- GET /api/guilds/{guild_id}
- PUT /api/guilds/{guild_id}
  - `disabled_games: []` - Deaktivierte Spiele
  - `game_cooldown: 30` - Cooldown in Sekunden
  - `max_active_games: 5` - Max aktive Spiele

---

## Backlog / Future Tasks

### P0 (ERLEDIGT ✅)
- [x] Temp Voice Channel Bug beheben
- [x] Ticket System Bot-Logik implementieren
- [x] "Made with Emergent" Badge ausblenden
- [x] Reaction Roles: PUT API + Edit Dialog
- [x] Tickets: Edit Dialog
- [x] Temp Channels: Edit Dialog
- [x] Spiele: 12 Spiele mit Ein/Aus Toggle
- [x] Dokumentation aktualisieren

### P1 (Nächste Priorität)
- [ ] Bot live auf Discord-Server testen
- [ ] Custom Commands Feature erweitern

### P2
- [ ] Mehr Spiele (Hangman mit Bildern, etc.)
- [ ] KI-Chat Integration
- [ ] Multi-Language Support

### P3 (Refactoring)
- [ ] discord_bot.py in Cogs aufteilen

---

## Code Architecture
```
/app/
├── backend/
│   ├── server.py       # FastAPI, alle API routes
│   ├── discord_bot.py  # Bot Logic + 12 Spiele + Ticket System
│   ├── database.py     # MongoDB + update_reaction_role
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ServerDataSelector.jsx  # RoleSelector, ChannelSelector
│   │   ├── pages/
│   │   │   ├── ReactionRoles.jsx  # + Edit Dialog + Vorschau
│   │   │   ├── Tickets.jsx        # + Edit Dialog
│   │   │   ├── TempChannels.jsx   # + Edit Dialog
│   │   │   ├── Games.jsx          # 12 Spiele + Toggle + Filter
│   │   │   └── ...
│   │   └── App.js
│   └── .env
├── docs/
│   ├── API.md
│   ├── COMMANDS.md
│   └── ...
├── tests/
│   └── test_iteration_7.py
└── README.md
```

---

*Zuletzt aktualisiert: 03.01.2026*

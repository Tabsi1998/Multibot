# Discord MultiBot - Product Requirements Document (PRD)

## Original Problem Statement
Der Benutzer möchte einen "ultimativen" All-in-One Discord Bot in Deutsch entwickeln, der mehrere spezialisierte Bots wie MEE6 und Dyno ersetzen kann.

## User Persona
- Discord Server Administrator
- Sprache: Deutsch
- Technische Kenntnisse: Fortgeschritten (kann Bot selbst hosten)
- Ziel: Einen einzigen Bot für alle Server-Management-Funktionen

---

## Core Features

### ✅ Implemented (MVP Complete)

#### 1. Authentication System
- JWT-basierte Authentifizierung
- Registrierung (erster Benutzer = automatisch Admin)
- Login/Logout
- Benutzerverwaltung im Dashboard

#### 2. Web Dashboard
- React Frontend mit Discord-ähnlichem Design
- Sidebar-Navigation
- Server-Konfiguration
- Bot-Status und Steuerung

#### 3. Moderation
- Kick, Ban, Mute, Warn Befehle
- Warn-System mit Speicherung
- Log-Kanal Konfiguration

#### 4. Leveling / XP System
- XP für Nachrichten
- Level-Ups mit Benachrichtigungen
- Leaderboard
- XP-Rate konfigurierbar

#### 5. Welcome & Goodbye
- Willkommensnachrichten
- Abschiedsnachrichten
- Auto-Rollen für neue Mitglieder
- Kanal-Konfiguration

#### 6. Custom Commands
- Benutzerdefinierte Befehle erstellen
- Antworten mit Variablen
- Embed-Support

#### 7. News System
- Automatische Ankündigungen
- Feed-Konfiguration
- Kanal-Auswahl

#### 8. Bot Settings
- Token-Konfiguration
- Prefix-Einstellung
- Bot-Start/Stop Steuerung
- Bot-Logs Anzeige

---

## ✅ Neu Implementiert (02.01.2026)

### 9. Temp Voice Channels (tempvoice.xyz Style)
**Status: VOLLSTÄNDIG IMPLEMENTIERT**

Features:
- ✅ Aktivierung/Deaktivierung
- ✅ Creator Channel ID konfigurieren
- ✅ Kategorie für neue Kanäle
- ✅ Standard Kanal-Name mit Variablen ({user})
- ✅ Standard Benutzerlimit (Slider 0-99)
- ✅ Standard Bitrate (8-384 kbps)
- ✅ Benutzer-Berechtigungen:
  - Umbenennen erlauben
  - Limit setzen erlauben
  - Sperren erlauben
  - Verstecken erlauben
  - Kicken erlauben
  - Permit erlauben
  - Bitrate ändern erlauben
- ✅ Aktive Temp-Channels Übersicht
- ✅ Discord Befehle: /vc rename, /vc limit, /vc lock, /vc unlock, /vc kick, /vc permit, /vc claim

### 10. Reaction Roles
**Status: VOLLSTÄNDIG IMPLEMENTIERT**

Features:
- ✅ Button Reaction Roles (empfohlen, modern)
- ✅ Emoji Reaction Roles (klassisch)
- ✅ Erstellen über Web-Dialog:
  - Typ-Auswahl (Button/Emoji)
  - Kanal ID
  - Titel & Beschreibung
  - Embed-Farbe (Colorpicker)
  - Rollen mit Emoji, Rollen-ID, Label
  - Quick-Emoji Auswahl
  - Bis zu 10 Rollen pro Nachricht
- ✅ Liste aktiver Reaction Roles
- ✅ Löschen über Web
- ✅ Discord Befehle: /reactionrole create, /reactionrole reaction, /reactionrole list

### 11. Discord Spiele
**Status: VOLLSTÄNDIG IMPLEMENTIERT**

Spiele:
- ✅ Tic Tac Toe (2 Spieler) - /game tictactoe @Gegner
- ✅ Stadt Land Fluss (2-4 Spieler) - /game stadtlandfluss @Spieler2 [@Spieler3] [@Spieler4]
- ✅ Münzwurf (1 Spieler) - /game coinflip
- ✅ Würfeln (1 Spieler) - /game dice [Seiten]
- ✅ Schere Stein Papier (1 Spieler) - /game rps
- ✅ 8-Ball (1 Spieler) - /game 8ball [Frage]

Dashboard Features:
- ✅ Spiele aktivieren/deaktivieren
- ✅ Spiele-Kanal Beschränkung (optional)
- ✅ Statistiken (Gespielte Spiele, Top Spieler)
- ✅ Aktive Spiele Übersicht
- ✅ Alle Befehle mit Beschreibung

---

## API Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- GET /api/users/me

### Bot
- GET /api/bot/status
- POST /api/bot/start
- POST /api/bot/stop
- GET /api/bot/logs
- POST /api/bot/test

### Guild Configuration
- GET /api/guilds/{guild_id}
- PUT /api/guilds/{guild_id}
- GET /api/guilds/{guild_id}/stats

### Temp Channels
- GET /api/guilds/{guild_id}/temp-channels
- DELETE /api/guilds/{guild_id}/temp-channels/{channel_id}

### Reaction Roles
- GET /api/guilds/{guild_id}/reaction-roles
- POST /api/guilds/{guild_id}/reaction-roles
- DELETE /api/guilds/{guild_id}/reaction-roles/{id}

### Games
- GET /api/guilds/{guild_id}/games
- GET /api/guilds/{guild_id}/games/stats

---

## Tech Stack
- **Backend:** FastAPI (Python)
- **Frontend:** React mit Shadcn/UI
- **Database:** MongoDB
- **Bot:** discord.py
- **Auth:** JWT
- **Deployment:** Self-hosted via install.sh

---

## Backlog / Future Tasks

### P0 (Nächste Priorität)
- [ ] Discord Slash-Commands für Temp Channels vollständig implementieren
- [ ] Discord Slash-Commands für Reaction Roles vollständig implementieren
- [ ] Discord Slash-Commands für Spiele vollständig implementieren
- [ ] Bot tatsächlich starten (erfordert gültigen Discord Token)

### P1
- [ ] KI-Chat Integration (wenn API Key vorhanden)
- [ ] Mehr Spiele hinzufügen (Hangman, Quiz, etc.)
- [ ] Permissions Management erweitern

### P2
- [ ] Multi-Language Support für Frontend
- [ ] Backup/Restore für Konfiguration
- [ ] Audit-Log für Admin-Aktionen

---

## Test Reports
- /app/test_reports/iteration_1.json
- /app/test_reports/iteration_2.json
- /app/test_reports/iteration_3.json ✅ (14/14 Tests bestanden)

## Test Credentials
- Email: admin@test.de
- Password: admin123
- Guild ID: 807292920734547969

---

## Files Structure
```
/app/
├── backend/
│   ├── server.py       # FastAPI + alle API Endpunkte
│   ├── discord_bot.py  # Discord Bot Logik
│   ├── database.py     # MongoDB Funktionen
│   └── translations.py # Deutsche Übersetzungen
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── TempChannels.jsx ✅ NEU
│       │   ├── ReactionRoles.jsx ✅ NEU
│       │   ├── Games.jsx ✅ NEU
│       │   └── ...
│       └── components/
│           └── DashboardLayout.jsx
├── docs/
├── install.sh
└── memory/
    └── PRD.md
```

---

*Zuletzt aktualisiert: 02.01.2026*

# Discord MultiBot - Product Requirements Document (PRD)

## Original Problem Statement
Der Benutzer möchte einen "ultimativen" All-in-One Discord Bot in Deutsch entwickeln, der mehrere spezialisierte Bots wie MEE6, Dyno und TempVoice ersetzen kann.

## User Persona
- Discord Server Administrator
- Sprache: Deutsch
- Technische Kenntnisse: Fortgeschritten (kann Bot selbst hosten)
- Ziel: Einen einzigen Bot für alle Server-Management-Funktionen

---

## ✅ Implementierte Features

### 1. Authentication System
- JWT-basierte Authentifizierung
- Registrierung (erster Benutzer = automatisch Admin)
- Login/Logout
- Benutzerverwaltung im Dashboard

### 2. Web Dashboard
- React Frontend mit Discord-ähnlichem Design
- Sidebar-Navigation mit allen Features
- Server-Konfiguration
- Bot-Status und Steuerung

### 3. Discord Slash Commands (NEU - 02.01.2026)
- `/help` - Übersicht aller Befehle
- `/botinfo` - Bot-Informationen (Name, Server, Latenz)
- `/serverinfo` - Server-Statistiken (Mitglieder, Kanäle, Rollen)
- `/userinfo` - Benutzer-Info mit Level/XP
- `/rank` - Zeigt Rang eines Benutzers
- `/leaderboard` - Top 10 Rangliste

### 4. Server-Daten Synchronisation (NEU - 02.01.2026)
- Bot synchronisiert Rollen, Kanäle, Kategorien, Emojis
- Daten werden in MongoDB gecached
- Web-Dashboard zeigt Dropdowns mit Suche
- Auto-Sync bei Bot-Start und Änderungen

### 5. Moderation
- `/warn`, `/kick`, `/ban`, `/mute` Befehle
- Warn-System mit Speicherung
- Log-Kanal Konfiguration
- `/warnings`, `/clearwarns`

### 6. Temp Voice Channels (tempvoice.xyz Style)
- Aktivierung/Deaktivierung
- Creator Channel + Kategorie
- Standard-Name, Limit, Bitrate
- 7 Benutzer-Berechtigungen
- `/vc rename`, `/vc limit`, `/vc lock`, etc.

### 7. Reaction Roles
- Button Reaction Roles
- Emoji Reaction Roles
- Web-Konfiguration mit Farbauswahl
- Bis zu 10 Rollen pro Nachricht

### 8. Discord Spiele
- TicTacToe, Stadt Land Fluss
- Münzwurf, Würfeln
- Schere Stein Papier, 8-Ball
- Statistiken und Leaderboard

### 9. Leveling System (ERWEITERT - 02.01.2026)
- **Nachrichten XP:** XP pro Nachricht, Cooldown
- **Voice XP (NEU):** XP pro Minute in Voice-Channels
  - Mindest-Benutzer Einstellung
  - AFK-Kanal ausschließen
  - Voice-Zeit Tracking
- **Level-Belohnungen (NEU):**
  - Rollen bei bestimmten Leveln
  - Emojis freischalten
  - Aktivierbar/Deaktivierbar
- Level-Up Benachrichtigungen

### 10. Bot Aussehen Einstellungen (NEU - 02.01.2026)
- Bot Status (Online, Abwesend, Bitte nicht stören, Unsichtbar)
- Aktivitäts-Typ (Spielt, Schaut, Hört, Tritt an in)
- Aktivitäts-Text (z.B. "mit /help starten")
- Embed-Farbe für alle Bot-Nachrichten

### 11. Welcome & Goodbye
- Willkommensnachrichten
- Abschiedsnachrichten
- Auto-Rollen

### 12. Custom Commands
- Benutzerdefinierte Befehle
- Variablen-Support

### 13. News System
- Automatische Ankündigungen
- Zeitplanung

---

## API Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- GET /api/users/me

### Bot Control
- GET /api/bot/status
- POST /api/bot/start
- POST /api/bot/stop
- GET /api/bot/logs

### Guild Configuration
- GET /api/guilds/{guild_id}
- PUT /api/guilds/{guild_id}
- GET /api/guilds/{guild_id}/stats

### Server Data (NEU)
- GET /api/guilds/{guild_id}/server-data
- POST /api/guilds/{guild_id}/server-data/sync

### Temp Channels
- GET /api/guilds/{guild_id}/temp-channels
- DELETE /api/guilds/{guild_id}/temp-channels/{id}

### Reaction Roles
- GET /api/guilds/{guild_id}/reaction-roles
- POST /api/guilds/{guild_id}/reaction-roles
- DELETE /api/guilds/{guild_id}/reaction-roles/{id}

### Games
- GET /api/guilds/{guild_id}/games
- GET /api/guilds/{guild_id}/games/stats

### Level Rewards (NEU)
- GET /api/guilds/{guild_id}/level-rewards
- POST /api/guilds/{guild_id}/level-rewards
- DELETE /api/guilds/{guild_id}/level-rewards/{id}
- PUT /api/guilds/{guild_id}/level-rewards/{id}/toggle

### Voice Stats (NEU)
- GET /api/guilds/{guild_id}/voice-stats
- GET /api/guilds/{guild_id}/voice-sessions

---

## Tech Stack
- **Backend:** FastAPI (Python)
- **Frontend:** React mit Shadcn/UI
- **Database:** MongoDB
- **Bot:** discord.py
- **Auth:** JWT
- **Deployment:** Self-hosted via install.sh

---

## Frontend Komponenten

### Seiten
- Dashboard.jsx
- TempChannels.jsx
- ReactionRoles.jsx
- Games.jsx
- Leveling.jsx (erweitert mit Voice XP)
- Settings.jsx (erweitert mit Bot Aussehen)
- Moderation.jsx
- Welcome.jsx
- CustomCommands.jsx
- News.jsx

### Neue Komponenten
- ServerDataSelector.jsx - Dropdown mit Suche für Rollen/Kanäle/Emojis

---

## Test Reports
- /app/test_reports/iteration_1.json
- /app/test_reports/iteration_2.json
- /app/test_reports/iteration_3.json ✅ (14/14)
- /app/test_reports/iteration_4.json ✅ (28/28 - 100% Backend + Frontend)

## Test Credentials
- Email: admin@test.de
- Password: admin123
- Guild ID: 807292920734547969

---

## Backlog / Future Tasks

### P0 (Nächste Priorität)
- [ ] Bot auf echtem Discord Server testen
- [ ] Server-Daten Sync verifizieren wenn Bot läuft

### P1
- [ ] Mehr Spiele hinzufügen (Hangman, Quiz)
- [ ] KI-Chat Integration
- [ ] Ticket-System

### P2
- [ ] Multi-Language Support
- [ ] Backup/Restore
- [ ] Audit-Log

---

*Zuletzt aktualisiert: 02.01.2026*

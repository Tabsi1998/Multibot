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

### 6. Temp Voice Channels (NEU ERWEITERT - 02.01.2026)
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

### 7. Reaction Roles
- Button Reaction Roles
- Emoji Reaction Roles
- Web-Konfiguration

### 8. Discord Spiele
- TicTacToe, Stadt Land Fluss
- Münzwurf, Würfeln, RPS, 8-Ball

### 9. Leveling System
- Nachrichten XP
- Voice XP (XP pro Minute)
- Level-Belohnungen (Rollen & Emojis)

### 10. Ticket System (NEU - 02.01.2026)
**Ticket-Panel:**
- Embed mit Button erstellen
- Titel, Beschreibung, Farbe konfigurierbar
- Button Emoji und Text

**Ticket-Kategorien:**
- Dropdown beim Erstellen
- z.B. "Support", "Bug Report", "Feature Request"

**Benutzerdefinierte Felder:**
- Text-Eingabe
- Mehrzeilige Eingabe
- Dropdown-Auswahl

**Support-Team:**
- Support-Rollen (können Tickets sehen & claimen)
- Ping-Rollen (bei neuem Ticket)

**Features:**
- Claimen aktivieren/deaktivieren
- Transcripts aktivieren/deaktivieren
- Ticket-Kanal Name Template ({number}, {user})

**Discord Befehle:**
- `/ticket claim` - Ticket beanspruchen
- `/ticket close` - Ticket schließen
- `/ticket add @user` - Benutzer hinzufügen
- `/ticket remove @user` - Benutzer entfernen
- `/ticket rename` - Ticket umbenennen
- `/ticket transcript` - Transcript erstellen

### 11. Bot Aussehen
- Status (Online, Abwesend, DND, Unsichtbar)
- Aktivität (Spielt, Schaut, Hört, Tritt an in)
- Embed-Farbe

### 12. Welcome & Goodbye
- Willkommensnachrichten
- Auto-Rollen

### 13. Custom Commands
- Benutzerdefinierte Befehle

### 14. News System
- Automatische Ankündigungen

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

### Server Data
- GET /api/guilds/{guild_id}/server-data
- POST /api/guilds/{guild_id}/server-data/sync

### Ticket System (NEU)
- GET /api/guilds/{guild_id}/ticket-panels
- POST /api/guilds/{guild_id}/ticket-panels
- GET /api/guilds/{guild_id}/ticket-panels/{panel_id}
- PUT /api/guilds/{guild_id}/ticket-panels/{panel_id}
- DELETE /api/guilds/{guild_id}/ticket-panels/{panel_id}
- GET /api/guilds/{guild_id}/tickets
- GET /api/guilds/{guild_id}/tickets/stats
- POST /api/guilds/{guild_id}/tickets/{ticket_id}/claim
- POST /api/guilds/{guild_id}/tickets/{ticket_id}/close

### Multi Temp Voice Creators (NEU)
- GET /api/guilds/{guild_id}/temp-creators
- POST /api/guilds/{guild_id}/temp-creators
- GET /api/guilds/{guild_id}/temp-creators/{creator_id}
- PUT /api/guilds/{guild_id}/temp-creators/{creator_id}
- DELETE /api/guilds/{guild_id}/temp-creators/{creator_id}

### Temp Channels
- GET /api/guilds/{guild_id}/temp-channels
- DELETE /api/guilds/{guild_id}/temp-channels/{id}

### Reaction Roles
- GET/POST/DELETE /api/guilds/{guild_id}/reaction-roles

### Games
- GET /api/guilds/{guild_id}/games
- GET /api/guilds/{guild_id}/games/stats

### Level Rewards
- GET/POST/DELETE /api/guilds/{guild_id}/level-rewards

### Voice Stats
- GET /api/guilds/{guild_id}/voice-stats
- GET /api/guilds/{guild_id}/voice-sessions

---

## Test Reports
- iteration_1.json ✅
- iteration_2.json ✅
- iteration_3.json ✅ (14/14)
- iteration_4.json ✅ (28/28)
- iteration_5.json ✅ (25/25 - Ticket System & Multi Temp Creators)

## Test Credentials
- Email: admin@test.de
- Password: admin123
- Guild ID: 807292920734547969

---

## Backlog / Future Tasks

### P0 (Nächste Priorität)
- [ ] Discord Bot Slash Commands für Tickets implementieren
- [ ] Discord Bot Logic für Multi Temp Creators implementieren
- [ ] Bot live testen

### P1
- [ ] Mehr Spiele
- [ ] KI-Chat Integration

### P2
- [ ] Multi-Language Support
- [ ] Backup/Restore

---

*Zuletzt aktualisiert: 02.01.2026*

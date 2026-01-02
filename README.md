# Discord MultiBot Command Center

<div align="center">

![MultiBot Logo](https://img.shields.io/badge/MultiBot-Command%20Center-5865F2?style=for-the-badge&logo=discord&logoColor=white)

**Der ultimative All-in-One Discord Bot mit Web-Dashboard**

[🇩🇪 Deutsch](#deutsch) | [🇬🇧 English](#english)

</div>

---

## 🚀 One-Command Installation (VOLLAUTOMATISCH)

```bash
git clone https://github.com/your-repo/multibot-command-center.git
cd multibot-command-center
chmod +x install.sh && ./install.sh
./start.sh
```

**Der Installer installiert ALLES automatisch:**
- Python 3.11+ / Node.js 20.x / MongoDB 7.0 / Yarn
- Alle Python- und Node.js-Pakete
- Erstellt Start/Stop/Restart/Status Scripts

Nach dem Start:
- **Lokal:** http://localhost:3000
- **Netzwerk:** http://DEINE-IP:3000

Registriere dich - **der erste Benutzer wird automatisch Administrator!** 👑

---

## Deutsch

### 📋 Inhaltsverzeichnis

- [Über das Projekt](#über-das-projekt)
- [Features](#features)
- [Installation](#installation)
- [Konfiguration](#konfiguration)
- [Bot Commands](#bot-commands)
- [Web Dashboard](#web-dashboard)
- [API Dokumentation](#api-dokumentation)

### Über das Projekt

MultiBot Command Center ist ein umfassender Discord-Bot mit Web-Dashboard, der die Funktionen von MEE6, Sapphire und anderen populären Bots in einem einzigen Bot vereint. Konfigurierbar über Slash-Commands UND Web-Interface.

### Features

| Feature | Beschreibung |
|---------|-------------|
| 🛡️ **Moderation** | Warn, Kick, Ban, Mute mit automatischen Aktionen |
| 🔑 **Berechtigungen** | Rollenbasierte Command-Berechtigungen |
| 🎤 **Temp Kanäle** | Automatische Voice-Kanäle |
| 🏆 **Leveling** | XP-System mit Level-Rollen |
| 👋 **Willkommen** | Begrüßungsnachrichten & Auto-Rollen |
| 💬 **Custom Commands** | Eigene Text-Commands |
| 🤖 **KI-Chat** | ChatGPT-Integration |
| 📰 **News** | Geplante Ankündigungen |
| 🔐 **Login-System** | Benutzer-Authentifizierung mit JWT |
| 👑 **Admin-System** | Erster Benutzer = Administrator |

### Installation

#### Voraussetzungen

- Python 3.11+
- Node.js 18+
- MongoDB
- Discord Bot Token

#### Schritt 1: Bot erstellen

1. Gehe zum [Discord Developer Portal](https://discord.com/developers/applications)
2. Klicke auf "New Application"
3. Gehe zu "Bot" → "Add Bot"
4. Aktiviere unter "Privileged Gateway Intents":
   - ✅ SERVER MEMBERS INTENT
   - ✅ MESSAGE CONTENT INTENT
5. Kopiere den Bot Token

#### Schritt 2: Bot einladen

Erstelle eine Einladungs-URL unter OAuth2 → URL Generator:
- Scopes: `bot`, `applications.commands`
- Permissions: `Administrator`

#### Schritt 3: Konfiguration

1. Öffne das Web-Dashboard (http://localhost:3000)
2. **Registriere dich** - Der erste Benutzer wird automatisch Admin!
3. Gehe zu "Einstellungen"
4. Füge deinen Discord Bot Token ein
5. Optional: Füge deinen OpenAI API Key hinzu
6. Speichere und starte den Bot

### Konfiguration

#### Umgebungsvariablen

| Variable | Beschreibung | Erforderlich |
|----------|-------------|--------------|
| `DISCORD_BOT_TOKEN` | Dein Discord Bot Token | ✅ |
| `OPENAI_API_KEY` | OpenAI API Key für KI-Chat | ❌ |
| `MONGO_URL` | MongoDB Verbindungs-URL | ✅ |
| `DB_NAME` | Datenbankname | ✅ |

### Bot Commands

#### Moderation

| Command | Beschreibung | Berechtigung |
|---------|-------------|--------------|
| `/warn <user> [grund]` | Benutzer verwarnen | Kick Members |
| `/warnings <user>` | Verwarnungen anzeigen | - |
| `/clearwarnings <user>` | Verwarnungen löschen | Kick Members |
| `/kick <user> [grund]` | Benutzer kicken | Kick Members |
| `/ban <user> [grund]` | Benutzer bannen | Ban Members |
| `/mute <user> [dauer] [grund]` | Benutzer stummschalten | Moderate Members |
| `/unmute <user>` | Stummschaltung aufheben | Moderate Members |

#### Leveling

| Command | Beschreibung |
|---------|-------------|
| `/rank [user]` | Zeigt Rang und XP |
| `/leaderboard` | Zeigt die XP-Rangliste |

#### Info

| Command | Beschreibung |
|---------|-------------|
| `/serverinfo` | Server-Informationen |
| `/userinfo [user]` | Benutzer-Informationen |

### Web Dashboard

Das Web-Dashboard bietet eine intuitive Oberfläche zur Konfiguration aller Bot-Funktionen:

#### Seiten

1. **Dashboard** - Übersicht, Bot-Steuerung, Statistiken
2. **Moderation** - Verwarnungs-Einstellungen, Mod-Logs
3. **Berechtigungen** - Admin/Mod Rollen verwalten
4. **Temp Kanäle** - Voice-Kanal Erstellung konfigurieren
5. **Leveling** - XP-System, Level-Rollen
6. **Willkommen** - Begrüßung, Auto-Rollen
7. **Commands** - Custom Commands erstellen
8. **KI Chat** - ChatGPT-Integration
9. **News** - Ankündigungen verwalten
10. **Einstellungen** - Token, Sprache, Prefix

---

## English

### 📋 Table of Contents

- [About](#about)
- [Features](#features-1)
- [Installation](#installation-1)
- [Configuration](#configuration)
- [Bot Commands](#bot-commands-1)
- [Web Dashboard](#web-dashboard-1)
- [API Documentation](#api-documentation)

### About

MultiBot Command Center is a comprehensive Discord bot with web dashboard that combines features from MEE6, Sapphire and other popular bots into a single solution. Configurable via slash commands AND web interface.

### Features

| Feature | Description |
|---------|-------------|
| 🛡️ **Moderation** | Warn, Kick, Ban, Mute with automatic actions |
| 🔑 **Permissions** | Role-based command permissions |
| 🎤 **Temp Channels** | Automatic voice channels |
| 🏆 **Leveling** | XP system with level roles |
| 👋 **Welcome** | Welcome messages & auto-roles |
| 💬 **Custom Commands** | Create your own text commands |
| 🤖 **AI Chat** | ChatGPT integration |
| 📰 **News** | Scheduled announcements |

### Installation

#### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB
- Discord Bot Token

#### Step 1: Create Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Go to "Bot" → "Add Bot"
4. Enable under "Privileged Gateway Intents":
   - ✅ SERVER MEMBERS INTENT
   - ✅ MESSAGE CONTENT INTENT
5. Copy the Bot Token

#### Step 2: Invite Bot

Create an invite URL under OAuth2 → URL Generator:
- Scopes: `bot`, `applications.commands`
- Permissions: `Administrator`

#### Step 3: Configuration

1. Open the web dashboard
2. Go to "Settings"
3. Enter your Discord Bot Token
4. Optional: Add your OpenAI API Key
5. Save and start the bot

### Configuration

#### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DISCORD_BOT_TOKEN` | Your Discord Bot Token | ✅ |
| `OPENAI_API_KEY` | OpenAI API Key for AI chat | ❌ |
| `MONGO_URL` | MongoDB connection URL | ✅ |
| `DB_NAME` | Database name | ✅ |

### Bot Commands

#### Moderation

| Command | Description | Permission |
|---------|-------------|------------|
| `/warn <user> [reason]` | Warn a user | Kick Members |
| `/warnings <user>` | Show warnings | - |
| `/clearwarnings <user>` | Clear warnings | Kick Members |
| `/kick <user> [reason]` | Kick a user | Kick Members |
| `/ban <user> [reason]` | Ban a user | Ban Members |
| `/mute <user> [duration] [reason]` | Mute a user | Moderate Members |
| `/unmute <user>` | Unmute a user | Moderate Members |

#### Leveling

| Command | Description |
|---------|-------------|
| `/rank [user]` | Shows rank and XP |
| `/leaderboard` | Shows XP leaderboard |

#### Info

| Command | Description |
|---------|-------------|
| `/serverinfo` | Server information |
| `/userinfo [user]` | User information |

### Web Dashboard

The web dashboard provides an intuitive interface for configuring all bot features:

#### Pages

1. **Dashboard** - Overview, bot controls, statistics
2. **Moderation** - Warning settings, mod logs
3. **Permissions** - Manage admin/mod roles
4. **Temp Channels** - Configure voice channel creation
5. **Leveling** - XP system, level roles
6. **Welcome** - Greeting messages, auto-roles
7. **Commands** - Create custom commands
8. **AI Chat** - ChatGPT integration
9. **News** - Manage announcements
10. **Settings** - Token, language, prefix

---

## API Documentation

### Base URL
```
https://your-domain.com/api
```

### Endpoints

#### Bot Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bot/status` | Get bot status |
| POST | `/bot/configure` | Configure bot tokens |
| POST | `/bot/start` | Start the bot |
| POST | `/bot/stop` | Stop the bot |

#### Guild Configuration

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/guilds` | List all guilds |
| GET | `/guilds/{id}` | Get guild config |
| PUT | `/guilds/{id}` | Update guild config |
| GET | `/guilds/{id}/stats` | Get guild statistics |

#### Moderation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/guilds/{id}/warnings` | List warnings |
| DELETE | `/guilds/{id}/warnings/{user_id}` | Clear user warnings |
| GET | `/guilds/{id}/modlogs` | Get moderation logs |

#### Leveling

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/guilds/{id}/leaderboard` | Get XP leaderboard |
| GET | `/guilds/{id}/users/{user_id}` | Get user data |
| PUT | `/guilds/{id}/users/{user_id}` | Update user XP/level |

#### Custom Commands

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/guilds/{id}/commands` | List commands |
| POST | `/guilds/{id}/commands` | Create command |
| DELETE | `/guilds/{id}/commands/{name}` | Delete command |

#### News

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/guilds/{id}/news` | List news |
| POST | `/guilds/{id}/news` | Create news |
| DELETE | `/guilds/{id}/news/{news_id}` | Delete news |

#### Permissions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/guilds/{id}/permissions` | Get permissions |
| PUT | `/guilds/{id}/permissions` | Update permissions |

---

## License

MIT License - Siehe [LICENSE](LICENSE) für Details.

## Support

Bei Fragen oder Problemen erstelle ein Issue oder kontaktiere uns auf Discord.

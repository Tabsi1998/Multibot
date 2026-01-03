# Discord MultiBot - Der ultimative All-in-One Discord Bot

Ein umfassender Discord-Bot mit Web-Dashboard für Moderation, Temp Voice Channels, Ticket-System, Leveling, Reaction Roles, Spiele und mehr.

## ✨ Features

### 🛡️ Moderation
- Kick, Ban, Mute, Warn-System
- Mod-Log Kanal
- Warn-Historie pro Benutzer

### 🎤 Temporäre Sprachkanäle
- **Multi-Creator System**: Mehrere Creator-Kanäle pro Server
- **Individuelle Konfiguration**: Jeder Creator mit eigenem Template
- **Nummerierungsoptionen**: Zahlen (1,2,3), Buchstaben (a,b,c), Hochgestellt (¹²³), Tiefgestellt (₁₂₃), Römisch (i,ii,iii)
- **Position**: Oben oder unten in der Kategorie
- **Benutzer-Berechtigungen**: Umbenennen, Limit, Sperren, Verstecken, Kicken, Erlauben, Bitrate

### 🎫 Ticket-System
- Anpassbare Ticket-Panels mit Embeds
- **Automatische Einbettung** bei Erstellung und Aktualisierung
- Kategorien für verschiedene Ticket-Typen
- Benutzerdefinierte Felder
- Claim-System für Support-Mitarbeiter
- Transcript-Funktion

### 🏆 Leveling-System
- Text-XP für Nachrichten
- Voice-XP für Zeit in Sprachkanälen
- Level-Belohnungen (Rollen & Emojis)
- Rangliste

### 🎭 Reaction Roles
- Button Reaction Roles (modern)
- Emoji Reaction Roles (klassisch)
- **Automatische Einbettung** bei Erstellung
- Embed-Vorschau im Dashboard
- Bis zu 10 Rollen pro Nachricht

### 🎮 Spiele (12 Spiele!)

| Spiel | Befehl | Spieler | Kategorie |
|-------|--------|---------|-----------|
| Tic Tac Toe | `/game tictactoe @user` | 2 | Klassiker |
| Stadt Land Fluss | `/game stadtlandfluss @user` | 2-4 | Wissen |
| Schere Stein Papier | `/game rps [@user]` | 1-2 | Klassiker |
| Münzwurf | `/game coinflip` | 1 | Zufall |
| Würfeln | `/game dice [seiten]` | 1 | Zufall |
| Magische 8-Ball | `/game 8ball [frage]` | 1 | Spaß |
| Galgenmännchen | `/game hangman` | 1+ | Wissen |
| Quiz/Trivia | `/game trivia [kategorie]` | 1+ | Wissen |
| Zahlenraten | `/game numberguess` | 1 | Zufall |
| Wortkette | `/game wordchain` | 2+ | Wissen |
| Reaktionstest | `/game reaction` | 1+ | Geschick |
| Memory | `/game memory [@user]` | 1-2 | Geschick |

- Jedes Spiel individuell ein-/ausschaltbar
- Kategorie-Filter im Dashboard
- Cooldown-System

### 👋 Willkommen & Verabschiedung
- Anpassbare Nachrichten mit Variablen
- Auto-Rollen für neue Mitglieder
- **Regelbestätigung**: Rolle bei Discord Membership Screening

### 🤖 Bot-Anpassung
- Status (Online, Abwesend, Nicht stören)
- Aktivitätstyp (Spielt, Schaut, Hört zu)
- Aktivitätstext

---

## 🚀 Installation

### Schnellstart
```bash
curl -sSL https://raw.githubusercontent.com/your-repo/multibot/main/install.sh | bash
```

### Manuelle Installation

1. **Repository klonen**
```bash
git clone https://github.com/your-repo/multibot.git
cd multibot
```

2. **Backend einrichten**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# DISCORD_BOT_TOKEN in .env setzen
```

3. **Frontend einrichten**
```bash
cd frontend
yarn install
```

4. **MongoDB starten**
```bash
docker run -d -p 27017:27017 mongo:latest
```

5. **Services starten**
```bash
# Backend
cd backend && python server.py

# Frontend
cd frontend && yarn start
```

---

## 📋 Slash Commands

### Info
| Befehl | Beschreibung |
|--------|--------------|
| `/help` | Zeigt alle Befehle |
| `/ping` | Bot-Latenz |
| `/botinfo` | Bot-Informationen |
| `/serverinfo` | Server-Statistiken |
| `/userinfo [@user]` | Benutzer-Info |

### Moderation
| Befehl | Beschreibung |
|--------|--------------|
| `/warn @user [grund]` | Verwarnt einen Benutzer |
| `/kick @user [grund]` | Kickt einen Benutzer |
| `/ban @user [grund]` | Bannt einen Benutzer |
| `/mute @user [dauer]` | Mutet einen Benutzer |
| `/warnings @user` | Zeigt Verwarnungen |
| `/clearwarns @user` | Löscht Verwarnungen |

### Temp Voice
| Befehl | Beschreibung |
|--------|--------------|
| `/vc rename [name]` | Kanal umbenennen |
| `/vc limit [anzahl]` | Userlimit setzen |
| `/vc lock` / `/vc unlock` | Kanal sperren/entsperren |
| `/vc hide` / `/vc show` | Kanal verstecken/zeigen |
| `/vc kick @user` | Benutzer kicken |
| `/vc permit @user` | Benutzer erlauben |
| `/vc claim` | Kanal übernehmen |

### Tickets
| Befehl | Beschreibung |
|--------|--------------|
| `/ticket panel [id]` | Panel senden |
| `/ticket claim` | Ticket beanspruchen |
| `/ticket close` | Ticket schließen |
| `/ticket add @user` | Benutzer hinzufügen |
| `/ticket remove @user` | Benutzer entfernen |

### Leveling
| Befehl | Beschreibung |
|--------|--------------|
| `/rank [@user]` | Zeigt Rang |
| `/leaderboard` | Rangliste |

---

## 🔌 API Dokumentation

Siehe [/docs/API.md](docs/API.md) für vollständige API-Dokumentation.

### Wichtige Endpoints:
- `POST /api/auth/login` - Login
- `GET/PUT /api/guilds/{id}` - Server-Konfiguration
- `CRUD /api/guilds/{id}/temp-creators` - Temp Voice Creators
- `CRUD /api/guilds/{id}/ticket-panels` - Ticket Panels (Auto-Send)
- `CRUD /api/guilds/{id}/reaction-roles` - Reaction Roles (Auto-Send)
- `CRUD /api/guilds/{id}/level-rewards` - Level Belohnungen

---

## 🧪 Test-Ergebnisse

| Test Suite | Tests | Bestanden | Erfolgsrate |
|------------|-------|-----------|-------------|
| Backend API | 31 | 31 | 100% |
| Frontend UI | 25+ | 25+ | 100% |

---

## 🛠️ Technologie

- **Backend**: FastAPI (Python)
- **Frontend**: React + Tailwind CSS
- **Datenbank**: MongoDB
- **Bot**: discord.py
- **Auth**: JWT

---

## 📄 Lizenz

MIT License

---

*Zuletzt aktualisiert: 03.01.2026*

# Discord MultiBot - Ultimativer All-in-One Bot

Ein umfassender Discord-Bot mit Web-Dashboard für Moderation, Temp Voice Channels, Ticket-System, Leveling, Reaction Roles, Spiele und mehr.

## Features

### 🛡️ Moderation
- Kick, Ban, Mute, Warn
- Mod-Log Kanal
- Warn-System mit Historie

### 🎤 Temporäre Sprachkanäle
- **Multi-Creator System**: Mehrere Creator-Kanäle pro Server
- **Individuelle Konfiguration**: Jeder Creator mit eigenem Template
- **Nummerierungsoptionen**: Zahlen, Buchstaben, Hochgestellt, Tiefgestellt, Römisch
- **Position**: Oben oder unten in der Kategorie
- **Benutzer-Berechtigungen**: Umbenennen, Limit, Sperren, Verstecken, Kicken, Erlauben, Bitrate

### 🎫 Ticket-System
- Anpassbare Ticket-Panels mit Embeds
- Kategorien für verschiedene Ticket-Typen
- Benutzerdefinierte Felder
- Claim-System für Support-Mitarbeiter
- Transcript-Funktion
- Support-Rollen und Ping-Rollen

### 🏆 Leveling-System
- Text-XP für Nachrichten
- Voice-XP für Zeit in Sprachkanälen
- Level-Belohnungen (Rollen & Emojis)
- Rangliste

### 🎭 Reaction Roles
- Button Reaction Roles (modern)
- Emoji Reaction Roles (klassisch)
- Anpassbare Embeds mit Vorschau
- Bis zu 10 Rollen pro Nachricht

### 🎮 Spiele (12 Spiele!)
| Spiel | Befehl | Spieler |
|-------|--------|---------|
| Tic Tac Toe | `/game tictactoe @user` | 2 |
| Stadt Land Fluss | `/game stadtlandfluss @user` | 2-4 |
| Münzwurf | `/game coinflip` | 1 |
| Würfeln | `/game dice [seiten]` | 1 |
| Schere Stein Papier | `/game rps` | 1 |
| Magische 8-Ball | `/game 8ball [frage]` | 1 |
| Galgenmännchen | `/game hangman` | 1+ |
| Quiz/Trivia | `/game trivia [kategorie]` | 1+ |
| Zahlenraten | `/game numberguess` | 1 |
| Wortkette | `/game wordchain` | 2+ |
| Reaktionstest | `/game reaction` | 1+ |
| Memory | `/game memory [@gegner]` | 1-2 |

- Jedes Spiel individuell ein-/ausschaltbar
- Spiele-Kanal konfigurierbar
- Cooldown-System

### 👋 Willkommen & Verabschiedung
- Anpassbare Nachrichten
- Auto-Rollen für neue Mitglieder
- Variablen für Personalisierung

### ⚙️ Custom Commands
- Eigene Befehle erstellen
- Embed-Antworten

### 🤖 Bot-Anpassung
- Status (Online, Abwesend, Nicht stören)
- Aktivitätstyp (Spielt, Schaut, Hört zu)
- Aktivitätstext

## Installation

### Schnellstart (Ein-Befehl-Installation)

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
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# .env bearbeiten und DISCORD_BOT_TOKEN setzen
```

3. **Frontend einrichten**
```bash
cd frontend
yarn install
cp .env.example .env
# .env bearbeiten
```

4. **MongoDB starten**
```bash
# Mit Docker:
docker run -d -p 27017:27017 mongo:latest

# Oder MongoDB lokal installieren
```

5. **Services starten**
```bash
# Backend
cd backend && python server.py

# Frontend (neues Terminal)
cd frontend && yarn start
```

6. **Dashboard öffnen**
- Öffne `http://localhost:3000`
- Registriere dich (erster Benutzer = Admin)
- Füge deinen Bot-Token hinzu
- Konfiguriere deinen Server

## Discord Bot Setup

1. Gehe zu [Discord Developer Portal](https://discord.com/developers/applications)
2. Erstelle eine neue Application
3. Gehe zu "Bot" → "Add Bot"
4. Aktiviere diese Intents:
   - Presence Intent
   - Server Members Intent
   - Message Content Intent
5. Kopiere den Token und füge ihn im Dashboard ein
6. Lade den Bot mit dem OAuth2 URL Generator ein:
   - Scopes: `bot`, `applications.commands`
   - Permissions: Administrator (oder spezifische Berechtigungen)

## Slash Commands

### Moderation
| Befehl | Beschreibung |
|--------|--------------|
| `/warn @user [grund]` | Verwarnt einen Benutzer |
| `/kick @user [grund]` | Kickt einen Benutzer |
| `/ban @user [grund]` | Bannt einen Benutzer |
| `/mute @user [dauer]` | Mutet einen Benutzer |
| `/warnings @user` | Zeigt Verwarnungen |
| `/clearwarnings @user` | Löscht alle Verwarnungen |

### Leveling
| Befehl | Beschreibung |
|--------|--------------|
| `/rank [@user]` | Zeigt Rang und XP |
| `/leaderboard` | Zeigt die Rangliste |

### Tickets
| Befehl | Beschreibung |
|--------|--------------|
| `/ticket panel [panel_id]` | Sendet ein Ticket-Panel |
| `/ticket claim` | Beansprucht ein Ticket |
| `/ticket close` | Schließt ein Ticket |
| `/ticket add @user` | Fügt Benutzer zum Ticket hinzu |
| `/ticket remove @user` | Entfernt Benutzer vom Ticket |
| `/ticket rename [name]` | Benennt das Ticket um |

### Temp Voice
| Befehl | Beschreibung |
|--------|--------------|
| `/voice name [name]` | Benennt deinen Kanal um |
| `/voice limit [anzahl]` | Setzt das Benutzerlimit |
| `/voice lock` | Sperrt den Kanal |
| `/voice unlock` | Entsperrt den Kanal |
| `/voice hide` | Versteckt den Kanal |
| `/voice show` | Zeigt den Kanal |
| `/voice permit @user` | Erlaubt einem Benutzer den Zugang |
| `/voice reject @user` | Verweigert einem Benutzer den Zugang |
| `/voice kick @user` | Kickt einen Benutzer |
| `/voice claim` | Übernimmt einen verwaisten Kanal |

### Reaction Roles
| Befehl | Beschreibung |
|--------|--------------|
| `/reactionrole create` | Erstellt Button Reaction Roles |
| `/reactionrole reaction` | Fügt Emoji-Reaktionen hinzu |
| `/reactionrole list` | Listet alle Reaction Roles |

### Info
| Befehl | Beschreibung |
|--------|--------------|
| `/help` | Zeigt alle Befehle |
| `/botinfo` | Zeigt Bot-Informationen |
| `/serverinfo` | Zeigt Server-Informationen |
| `/userinfo [@user]` | Zeigt Benutzer-Informationen |

## Web Dashboard

Das Dashboard bietet eine moderne, Discord-ähnliche Oberfläche für:

- **Alle Einstellungen bearbeiten** - Jedes Panel, jeder Creator, jede Einstellung kann nachträglich bearbeitet werden
- **Live-Vorschau** - Sehe Embeds bevor sie gesendet werden
- **Server-Daten-Sync** - Rollen und Kanäle werden automatisch synchronisiert
- **Statistiken** - Übersicht über Tickets, Spiele, Leveling

## Technologie

- **Backend**: FastAPI (Python)
- **Frontend**: React mit Tailwind CSS
- **Datenbank**: MongoDB
- **Bot**: discord.py
- **Auth**: JWT

## Support

Bei Fragen oder Problemen:
- Erstelle ein Issue auf GitHub
- Tritt dem Support-Discord bei

## Lizenz

MIT License

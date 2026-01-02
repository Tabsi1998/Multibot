# Schnellstart / Quick Start Guide

## 🚀 One-Command Installation (VOLLAUTOMATISCH)

### Linux (Ubuntu/Debian/Fedora/Arch)

```bash
# 1. Repository klonen
git clone https://github.com/your-repo/multibot-command-center.git
cd multibot-command-center

# 2. Installer ausführen - ALLES wird automatisch installiert!
chmod +x install.sh
./install.sh

# 3. Starten
./start.sh
```

**Das war's!** Der Installer installiert automatisch:
- ✅ Python 3.11+
- ✅ Node.js 20.x
- ✅ MongoDB 7.0
- ✅ Yarn
- ✅ Alle Python-Pakete
- ✅ Alle Node.js-Pakete

### macOS

```bash
# Homebrew wird automatisch installiert falls nicht vorhanden
git clone https://github.com/your-repo/multibot-command-center.git
cd multibot-command-center
chmod +x install.sh && ./install.sh
./start.sh
```

### Verfügbare Befehle nach Installation

| Befehl | Beschreibung |
|--------|--------------|
| `./start.sh` | Starten (Backend + Frontend + MongoDB) |
| `./stop.sh` | Stoppen |
| `./restart.sh` | Neustarten |
| `./status.sh` | Status prüfen |

### Zugriff

Nach dem Start:
- **Lokal:** http://localhost:3000
- **Netzwerk:** http://DEINE-IP:3000 (andere Geräte können zugreifen!)

---

## 🇩🇪 Deutsch

### 5-Minuten Setup

#### 1. Discord Bot erstellen (2 Min)

1. Öffne das [Discord Developer Portal](https://discord.com/developers/applications)
2. Klicke auf **"New Application"**
3. Gib einen Namen ein (z.B. "MultiBot") → **Create**
4. Gehe zu **Bot** → **Add Bot** → **Yes, do it!**
5. Aktiviere:
   - ✅ SERVER MEMBERS INTENT
   - ✅ MESSAGE CONTENT INTENT
6. Klicke auf **"Reset Token"** → Kopiere den Token

#### 2. Bot auf Server einladen (1 Min)

1. Gehe zu **OAuth2** → **URL Generator**
2. Wähle Scopes:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Wähle Permissions:
   - ✅ `Administrator`
4. Kopiere die generierte URL und öffne sie im Browser
5. Wähle deinen Server → **Authorize**

#### 3. Dashboard einrichten (2 Min)

1. Starte mit `./start.sh`
2. Öffne http://localhost:3000
3. **Registriere dich** - Erster Benutzer = Admin! 👑
4. Melde dich an
5. Gehe zu **Einstellungen**
6. Füge deinen **Discord Bot Token** ein
7. Klicke auf **"Tokens speichern"**
8. Gehe zum **Dashboard**
9. Gib deine **Server-ID** ein
10. Klicke auf **"Starten"** → Bot ist online! 🎉

---

### Erste Schritte nach der Installation

#### Willkommensnachrichten aktivieren

1. Gehe zu **Willkommen**
2. Aktiviere **"Willkommen aktivieren"**
3. Gib die **Kanal-ID** ein (Rechtsklick auf Kanal → ID kopieren)
4. Passe die Nachricht an: `Willkommen {user} auf {server}! 🎉`
5. Speichern

#### XP-System konfigurieren

1. Gehe zu **Leveling**
2. Aktiviere das System (Standard: aktiv)
3. Optional: Füge **Level-Rollen** hinzu
4. Optional: Lege einen **Level-Up Kanal** fest

#### Custom Commands erstellen

1. Gehe zu **Commands**
2. Klicke auf **"Neuer Command"**
3. Name: `regeln`
4. Antwort: `Unsere Serverregeln: 1. Sei nett 2. Kein Spam`
5. Speichern → Benutzer können jetzt `!regeln` nutzen

---

## 🇬🇧 English

### 5-Minute Setup

#### 1. Create Discord Bot (2 Min)

1. Open the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"**
3. Enter a name (e.g., "MultiBot") → **Create**
4. Go to **Bot** → **Add Bot** → **Yes, do it!**
5. Enable:
   - ✅ SERVER MEMBERS INTENT
   - ✅ MESSAGE CONTENT INTENT
6. Click **"Reset Token"** → Copy the token

#### 2. Invite Bot to Server (1 Min)

1. Go to **OAuth2** → **URL Generator**
2. Select Scopes:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Select Permissions:
   - ✅ `Administrator`
4. Copy the generated URL and open it in your browser
5. Select your server → **Authorize**

#### 3. Configure Dashboard (2 Min)

1. Open the web dashboard
2. Go to **Settings**
3. Enter your **Discord Bot Token**
4. Click **"Save Tokens"**
5. Go back to **Dashboard**
6. Enter your **Server ID** (Right-click server → Copy Server ID)
7. Click **"Save"**
8. Click **"Start"** → Bot is online! 🎉

---

### First Steps After Installation

#### Enable Welcome Messages

1. Go to **Welcome**
2. Enable **"Welcome Enabled"**
3. Enter the **Channel ID** (Right-click channel → Copy ID)
4. Customize message: `Welcome {user} to {server}! 🎉`
5. Save

#### Configure XP System

1. Go to **Leveling**
2. Enable the system (default: enabled)
3. Optional: Add **Level Roles**
4. Optional: Set a **Level-Up Channel**

#### Create Custom Commands

1. Go to **Commands**
2. Click **"New Command"**
3. Name: `rules`
4. Response: `Server rules: 1. Be nice 2. No spam`
5. Save → Users can now use `!rules`

---

## Server-ID finden / Finding Server ID

### Discord Desktop

1. Aktiviere Entwicklermodus:
   - Einstellungen → App-Einstellungen → Erweitert → Entwicklermodus ✅
2. Rechtsklick auf den Server → **Server-ID kopieren**

### Discord Mobile

1. Server-Einstellungen → Weitere Optionen → **ID kopieren**

---

## Häufige Probleme / Common Issues

### Bot kommt nicht online / Bot won't start

**Ursache:** Token nicht korrekt eingegeben

**Lösung:**
1. Gehe zum Developer Portal
2. Bot → Reset Token
3. Kopiere den neuen Token
4. Füge ihn in den Einstellungen ein

### Commands funktionieren nicht / Commands don't work

**Ursache:** Intents nicht aktiviert

**Lösung:**
1. Developer Portal → Bot
2. Aktiviere SERVER MEMBERS INTENT
3. Aktiviere MESSAGE CONTENT INTENT
4. Starte den Bot neu

### Willkommen funktioniert nicht / Welcome not working

**Ursache:** Falsche Kanal-ID

**Lösung:**
1. Aktiviere Entwicklermodus
2. Rechtsklick auf den gewünschten Kanal
3. Kopiere die ID
4. Füge sie im Dashboard ein

---

## Support

Bei weiteren Fragen:
- Erstelle ein Issue auf GitHub
- Tritt unserem Discord-Server bei
- Schreibe an support@example.com

# Discord Bot Befehle

## Moderation

| Befehl | Beschreibung | Berechtigung |
|--------|--------------|--------------|
| `/warn @user [grund]` | Verwarnt einen Benutzer | Nachrichten verwalten |
| `/kick @user [grund]` | Kickt einen Benutzer | Mitglieder kicken |
| `/ban @user [grund]` | Bannt einen Benutzer | Mitglieder bannen |
| `/mute @user [dauer]` | Mutet einen Benutzer (Timeout) | Mitglieder moderieren |
| `/unmute @user` | Entmutet einen Benutzer | Mitglieder moderieren |
| `/warnings @user` | Zeigt alle Verwarnungen eines Benutzers | Nachrichten verwalten |
| `/clearwarnings @user` | Löscht alle Verwarnungen | Administrator |

---

## Leveling & Rangliste

| Befehl | Beschreibung |
|--------|--------------|
| `/rank [@user]` | Zeigt deinen oder eines anderen Benutzers Rang |
| `/leaderboard [seite]` | Zeigt die Server-Rangliste |

---

## Ticket System

| Befehl | Beschreibung | Hinweis |
|--------|--------------|---------|
| `/ticket panel [panel_id]` | Sendet ein Ticket-Panel in den aktuellen Kanal | Admin |
| `/ticket claim` | Beansprucht das aktuelle Ticket | Im Ticket-Kanal |
| `/ticket close` | Schließt das aktuelle Ticket | Im Ticket-Kanal |
| `/ticket add @user` | Fügt einen Benutzer zum Ticket hinzu | Im Ticket-Kanal |
| `/ticket remove @user` | Entfernt einen Benutzer vom Ticket | Im Ticket-Kanal |
| `/ticket rename [name]` | Benennt das Ticket um | Im Ticket-Kanal |

---

## Temporäre Sprachkanäle

Diese Befehle funktionieren nur in deinem eigenen temporären Kanal:

| Befehl | Beschreibung |
|--------|--------------|
| `/voice name [name]` | Benennt deinen Kanal um |
| `/voice limit [anzahl]` | Setzt das Benutzerlimit (0 = unbegrenzt) |
| `/voice lock` | Sperrt den Kanal (niemand kann mehr beitreten) |
| `/voice unlock` | Entsperrt den Kanal |
| `/voice hide` | Versteckt den Kanal für alle |
| `/voice show` | Zeigt den Kanal wieder |
| `/voice permit @user` | Erlaubt einem Benutzer den Zugang |
| `/voice reject @user` | Verweigert einem Benutzer den Zugang |
| `/voice kick @user` | Kickt einen Benutzer aus dem Kanal |
| `/voice bitrate [kbps]` | Ändert die Bitrate |
| `/voice claim` | Übernimmt einen verwaisten Kanal |
| `/voice transfer @user` | Überträgt den Kanal an jemand anderen |
| `/voice info` | Zeigt Informationen über den Kanal |

---

## Reaction Roles

| Befehl | Beschreibung | Berechtigung |
|--------|--------------|--------------|
| `/reactionrole create` | Erstellt Button Reaction Roles | Server verwalten |
| `/reactionrole reaction` | Fügt Emoji-Reaktionen zu einer Nachricht hinzu | Server verwalten |
| `/reactionrole list` | Listet alle Reaction Roles auf | Server verwalten |

---

## Spiele

### Mehrspieler-Spiele

| Befehl | Beschreibung | Spieler |
|--------|--------------|---------|
| `/game tictactoe @gegner` | Tic Tac Toe | 2 |
| `/game stadtlandfluss @spieler2 [@spieler3] [@spieler4]` | Stadt Land Fluss | 2-4 |
| `/game memory [@gegner]` | Memory-Kartenspiel | 1-2 |
| `/game wordchain` | Wortkette | 2+ |

### Einzelspieler-Spiele

| Befehl | Beschreibung |
|--------|--------------|
| `/game coinflip` | Münzwurf - Kopf oder Zahl |
| `/game dice [seiten]` | Würfelt (Standard: 6 Seiten) |
| `/game rps` | Schere, Stein, Papier gegen den Bot |
| `/game 8ball [frage]` | Frage die magische 8-Ball |
| `/game hangman` | Galgenmännchen |
| `/game trivia [kategorie]` | Quiz mit verschiedenen Kategorien |
| `/game numberguess` | Rate eine Zahl zwischen 1-100 |
| `/game reaction` | Reaktionstest - wie schnell bist du? |

### Trivia-Kategorien
- `general` - Allgemeinwissen
- `science` - Wissenschaft
- `history` - Geschichte
- `geography` - Geographie

---

## Info-Befehle

| Befehl | Beschreibung |
|--------|--------------|
| `/help` | Zeigt eine Übersicht aller Befehle |
| `/botinfo` | Zeigt Informationen über den Bot |
| `/serverinfo` | Zeigt Server-Statistiken |
| `/userinfo [@user]` | Zeigt Benutzer-Informationen |

---

## Variablen für Templates

### Willkommensnachrichten
- `{user}` - Benutzername
- `{mention}` - Benutzer-Erwähnung
- `{server}` - Servername
- `{membercount}` - Mitgliederanzahl

### Temp Voice Kanäle
- `{user}` - Benutzername des Erstellers
- `{number}` - Kanalnummer
- `{game}` - Aktuelles Spiel (falls vorhanden)

### Tickets
- `{number}` - Ticketnummer
- `{user}` - Benutzername des Erstellers

---

## Berechtigungen

Der Bot benötigt folgende Berechtigungen:
- Administrator (empfohlen) ODER
- Nachrichten senden
- Nachrichten verwalten
- Embeds senden
- Reaktionen hinzufügen
- Mitglieder kicken/bannen
- Rollen verwalten
- Kanäle verwalten
- Sprachkanäle verbinden
- Mitglieder verschieben

### Discord Intents (erforderlich)
- Presence Intent
- Server Members Intent  
- Message Content Intent

Diese müssen im [Discord Developer Portal](https://discord.com/developers/applications) aktiviert werden.

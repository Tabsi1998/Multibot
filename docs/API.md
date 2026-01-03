# API Dokumentation

## Authentifizierung

Alle API-Anfragen (außer Login/Register) benötigen einen JWT-Token im Header:
```
Authorization: Bearer <token>
```

## Endpunkte

### Auth

#### POST /api/auth/register
Registriert einen neuen Benutzer.
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "Username"
}
```

#### POST /api/auth/login
Meldet einen Benutzer an.
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
Response:
```json
{
  "token": "eyJ...",
  "user": { "email": "...", "username": "...", "role": "admin" }
}
```

#### GET /api/auth/me
Gibt den aktuellen Benutzer zurück.

---

### Bot Management

#### GET /api/bot/status
Gibt den Bot-Status zurück.

#### POST /api/bot/configure
Konfiguriert den Bot.
```json
{
  "token": "Bot-Token",
  "prefix": "!"
}
```

#### POST /api/bot/start
Startet den Bot.

#### POST /api/bot/stop
Stoppt den Bot.

---

### Guild (Server) Konfiguration

#### GET /api/guilds/{guild_id}
Gibt die Server-Konfiguration zurück.

#### PUT /api/guilds/{guild_id}
Aktualisiert die Server-Konfiguration.
```json
{
  "prefix": "!",
  "mod_log_channel": "123456789",
  "games_enabled": true,
  "disabled_games": ["hangman", "trivia"],
  "welcome_enabled": true,
  "welcome_channel": "123456789",
  "welcome_message": "Willkommen {user}!",
  "level_rewards": [...],
  "voice_xp_config": {...}
}
```

#### GET /api/guilds/{guild_id}/leaderboard
Gibt die XP-Rangliste zurück.

---

### Temp Voice Creators

#### GET /api/guilds/{guild_id}/temp-creators
Listet alle Temp Voice Creators.

#### POST /api/guilds/{guild_id}/temp-creators
Erstellt einen neuen Creator.
```json
{
  "channel_id": "123456789",
  "category_id": "123456789",
  "name_template": "🔊 {user}'s Kanal",
  "numbering_type": "number",
  "position": "bottom",
  "default_limit": 0,
  "default_bitrate": 64000,
  "allow_rename": true,
  "allow_limit": true,
  "allow_lock": true,
  "allow_hide": true,
  "allow_kick": true,
  "allow_permit": true,
  "allow_bitrate": true
}
```

#### GET /api/guilds/{guild_id}/temp-creators/{creator_id}
Gibt einen Creator zurück.

#### PUT /api/guilds/{guild_id}/temp-creators/{creator_id}
Aktualisiert einen Creator.

#### DELETE /api/guilds/{guild_id}/temp-creators/{creator_id}
Löscht einen Creator.

---

### Ticket System

#### GET /api/guilds/{guild_id}/ticket-panels
Listet alle Ticket-Panels.

#### POST /api/guilds/{guild_id}/ticket-panels
Erstellt ein neues Panel.
```json
{
  "channel_id": "123456789",
  "title": "🎫 Support Tickets",
  "description": "Klicke auf den Button...",
  "color": "#5865F2",
  "button_label": "Ticket erstellen",
  "button_emoji": "🎫",
  "ticket_category": "123456789",
  "ticket_name_template": "ticket-{number}",
  "categories": [
    { "name": "Support", "emoji": "🔧", "description": "Allgemeiner Support" }
  ],
  "custom_fields": [
    { "label": "Betreff", "type": "text", "required": true }
  ],
  "support_roles": ["123456789"],
  "ping_roles": ["123456789"],
  "claim_enabled": true,
  "transcript_enabled": true
}
```

#### GET /api/guilds/{guild_id}/ticket-panels/{panel_id}
Gibt ein Panel zurück.

#### PUT /api/guilds/{guild_id}/ticket-panels/{panel_id}
Aktualisiert ein Panel.

#### DELETE /api/guilds/{guild_id}/ticket-panels/{panel_id}
Löscht ein Panel.

#### GET /api/guilds/{guild_id}/tickets
Listet alle Tickets.

#### GET /api/guilds/{guild_id}/tickets/stats
Gibt Ticket-Statistiken zurück.
```json
{
  "open": 5,
  "claimed": 2,
  "closed": 100,
  "total": 107
}
```

---

### Reaction Roles

#### GET /api/guilds/{guild_id}/reaction-roles
Listet alle Reaction Roles.

#### POST /api/guilds/{guild_id}/reaction-roles
Erstellt eine neue Reaction Role.
```json
{
  "channel_id": "123456789",
  "title": "🎭 Wähle deine Rollen",
  "description": "Klicke auf einen Button...",
  "color": "#5865F2",
  "type": "button",
  "roles": [
    { "emoji": "🎮", "role_id": "123456789", "label": "Gamer" }
  ],
  "embed_image": "",
  "embed_thumbnail": ""
}
```

#### PUT /api/guilds/{guild_id}/reaction-roles/{rr_id}
Aktualisiert eine Reaction Role.

#### DELETE /api/guilds/{guild_id}/reaction-roles/{rr_id}
Löscht eine Reaction Role.

---

### Games

#### GET /api/guilds/{guild_id}/games
Listet aktive Spiele.

#### GET /api/guilds/{guild_id}/games/stats
Gibt Spiel-Statistiken zurück.
```json
{
  "total_games": 150,
  "top_player": "Username#1234"
}
```

---

### Level Rewards

#### GET /api/guilds/{guild_id}/level-rewards
Listet alle Level-Belohnungen.

#### POST /api/guilds/{guild_id}/level-rewards
Erstellt eine neue Belohnung.
```json
{
  "level": 10,
  "type": "role",
  "role_id": "123456789",
  "emoji": ""
}
```

#### DELETE /api/guilds/{guild_id}/level-rewards/{reward_id}
Löscht eine Belohnung.

---

### Server Data

#### GET /api/guilds/{guild_id}/server-data
Gibt synchronisierte Server-Daten zurück (Rollen, Kanäle, Kategorien, Emojis).

#### POST /api/guilds/{guild_id}/sync
Synchronisiert Server-Daten vom Discord-Server.

---

## Fehler-Responses

```json
{
  "detail": "Fehlermeldung"
}
```

| Status Code | Bedeutung |
|-------------|-----------|
| 400 | Ungültige Anfrage |
| 401 | Nicht autorisiert |
| 403 | Zugriff verweigert |
| 404 | Nicht gefunden |
| 500 | Server-Fehler |

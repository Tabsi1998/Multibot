# API Dokumentation / API Documentation

## 🇩🇪 Deutsch

### Übersicht

Die MultiBot API ermöglicht die vollständige Steuerung des Discord-Bots über REST-Endpunkte.

### Basis-URL

```
https://your-domain.com/api
```

### Authentifizierung

Die API verwendet JWT (JSON Web Token) für die Authentifizierung.

**Header Format:**
```
Authorization: Bearer <your_jwt_token>
```

**Öffentliche Endpoints (kein Token erforderlich):**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/bot/status`

**Geschützte Endpoints (Token erforderlich):**
- Alle anderen Endpoints

**Admin-only Endpoints (Admin-Token erforderlich):**
- `POST /api/bot/configure`
- `GET /api/auth/users`
- `PUT /api/auth/users/{id}/admin`
- `DELETE /api/auth/users/{id}`

---

### Authentifizierung

#### Benutzer registrieren

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "MeinName",
  "email": "email@example.com",
  "password": "sicheres-passwort"
}
```

**Antwort:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "username": "MeinName",
    "email": "email@example.com",
    "is_admin": true
  },
  "message": "Registrierung erfolgreich! Du bist der erste Benutzer und damit Administrator."
}
```

> **Hinweis:** Der erste registrierte Benutzer wird automatisch Administrator!

#### Benutzer anmelden

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "email@example.com",
  "password": "sicheres-passwort"
}
```

**Antwort:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "username": "MeinName",
    "email": "email@example.com",
    "is_admin": true
  }
}
```

#### Aktueller Benutzer

```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Benutzer auflisten (Admin)

```http
GET /api/auth/users
Authorization: Bearer <admin_token>
```

#### Admin-Status ändern (Admin)

```http
PUT /api/auth/users/{user_id}/admin?is_admin=true
Authorization: Bearer <admin_token>
```

#### Benutzer löschen (Admin)

```http
DELETE /api/auth/users/{user_id}
Authorization: Bearer <admin_token>
```

---

### Bot-Verwaltung

#### Bot-Status abrufen

```http
GET /api/bot/status
```

**Antwort:**
```json
{
  "running": true,
  "token_configured": true,
  "openai_configured": true
}
```

#### Bot konfigurieren (Admin)

```http
POST /api/bot/configure
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "discord_token": "YOUR_DISCORD_TOKEN",
  "openai_api_key": "YOUR_OPENAI_KEY"
}
```

#### Bot starten

```http
POST /api/bot/start
```

#### Bot stoppen

```http
POST /api/bot/stop
```

---

### Server-Konfiguration

#### Server-Einstellungen abrufen

```http
GET /api/guilds/{guild_id}
```

**Antwort:**
```json
{
  "guild_id": "123456789",
  "language": "de",
  "prefix": "!",
  "leveling_enabled": true,
  "xp_per_message": 15,
  "xp_cooldown": 60,
  "welcome_enabled": false,
  "welcome_channel": null,
  "welcome_message": null,
  "ai_enabled": false,
  "ai_channel": null,
  "ai_system_prompt": "Du bist ein freundlicher Discord-Bot."
}
```

#### Server-Einstellungen aktualisieren

```http
PUT /api/guilds/{guild_id}
Content-Type: application/json

{
  "language": "de",
  "prefix": "!",
  "leveling_enabled": true,
  "xp_per_message": 20,
  "welcome_enabled": true,
  "welcome_channel": "123456789",
  "welcome_message": "Willkommen {user}!"
}
```

#### Server-Statistiken abrufen

```http
GET /api/guilds/{guild_id}/stats
```

**Antwort:**
```json
{
  "total_users": 150,
  "total_warnings": 12,
  "total_commands": 5,
  "total_news": 3,
  "top_users": [...],
  "recent_mod_actions": [...]
}
```

---

### Moderation

#### Verwarnungen auflisten

```http
GET /api/guilds/{guild_id}/warnings
GET /api/guilds/{guild_id}/warnings?user_id=123456789
```

#### Verwarnungen löschen

```http
DELETE /api/guilds/{guild_id}/warnings/{user_id}
```

#### Moderations-Logs abrufen

```http
GET /api/guilds/{guild_id}/modlogs?limit=50
```

---

### Leveling

#### Rangliste abrufen

```http
GET /api/guilds/{guild_id}/leaderboard?limit=10
```

**Antwort:**
```json
{
  "leaderboard": [
    {
      "user_id": "123456789",
      "xp": 1500,
      "level": 5,
      "messages": 200
    }
  ]
}
```

#### Benutzer-Daten abrufen

```http
GET /api/guilds/{guild_id}/users/{user_id}
```

#### Benutzer-Daten aktualisieren

```http
PUT /api/guilds/{guild_id}/users/{user_id}?xp=1000&level=5
```

---

### Custom Commands

#### Commands auflisten

```http
GET /api/guilds/{guild_id}/commands
```

**Antwort:**
```json
{
  "commands": [
    {
      "name": "hilfe",
      "response": "Hier ist die Hilfe...",
      "created_by": "dashboard",
      "created_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

#### Command erstellen

```http
POST /api/guilds/{guild_id}/commands
Content-Type: application/json

{
  "name": "regeln",
  "response": "1. Sei nett\n2. Kein Spam\n3. Hab Spaß!"
}
```

#### Command löschen

```http
DELETE /api/guilds/{guild_id}/commands/{name}
```

---

### News

#### News auflisten

```http
GET /api/guilds/{guild_id}/news
```

#### News erstellen

```http
POST /api/guilds/{guild_id}/news
Content-Type: application/json

{
  "title": "Wichtige Ankündigung",
  "content": "Hier ist der Inhalt...",
  "scheduled_for": "2024-01-15T18:00:00Z"
}
```

#### News löschen

```http
DELETE /api/guilds/{guild_id}/news/{news_id}
```

---

### Berechtigungen

#### Berechtigungen abrufen

```http
GET /api/guilds/{guild_id}/permissions
```

**Antwort:**
```json
{
  "admin_roles": ["123456789"],
  "mod_roles": ["987654321"],
  "command_permissions": {
    "ban": ["123456789"],
    "kick": ["123456789", "987654321"]
  }
}
```

#### Berechtigungen aktualisieren

```http
PUT /api/guilds/{guild_id}/permissions
Content-Type: application/json

{
  "command": "ban",
  "role_ids": ["123456789"]
}
```

---

## 🇬🇧 English

### Overview

The MultiBot API provides complete control over the Discord bot through REST endpoints.

### Base URL

```
https://your-domain.com/api
```

### Authentication

Currently no authentication required (local usage).

---

### Bot Management

#### Get Bot Status

```http
GET /api/bot/status
```

**Response:**
```json
{
  "running": true,
  "token_configured": true,
  "openai_configured": true
}
```

#### Configure Bot

```http
POST /api/bot/configure
Content-Type: application/json

{
  "discord_token": "YOUR_DISCORD_TOKEN",
  "openai_api_key": "YOUR_OPENAI_KEY"
}
```

#### Start Bot

```http
POST /api/bot/start
```

#### Stop Bot

```http
POST /api/bot/stop
```

---

### Guild Configuration

#### Get Guild Settings

```http
GET /api/guilds/{guild_id}
```

**Response:**
```json
{
  "guild_id": "123456789",
  "language": "en",
  "prefix": "!",
  "leveling_enabled": true,
  "xp_per_message": 15,
  "xp_cooldown": 60,
  "welcome_enabled": false,
  "welcome_channel": null,
  "welcome_message": null,
  "ai_enabled": false,
  "ai_channel": null,
  "ai_system_prompt": "You are a friendly Discord bot."
}
```

#### Update Guild Settings

```http
PUT /api/guilds/{guild_id}
Content-Type: application/json

{
  "language": "en",
  "prefix": "!",
  "leveling_enabled": true,
  "xp_per_message": 20,
  "welcome_enabled": true,
  "welcome_channel": "123456789",
  "welcome_message": "Welcome {user}!"
}
```

#### Get Guild Statistics

```http
GET /api/guilds/{guild_id}/stats
```

**Response:**
```json
{
  "total_users": 150,
  "total_warnings": 12,
  "total_commands": 5,
  "total_news": 3,
  "top_users": [...],
  "recent_mod_actions": [...]
}
```

---

### Moderation

#### List Warnings

```http
GET /api/guilds/{guild_id}/warnings
GET /api/guilds/{guild_id}/warnings?user_id=123456789
```

#### Clear Warnings

```http
DELETE /api/guilds/{guild_id}/warnings/{user_id}
```

#### Get Moderation Logs

```http
GET /api/guilds/{guild_id}/modlogs?limit=50
```

---

### Leveling

#### Get Leaderboard

```http
GET /api/guilds/{guild_id}/leaderboard?limit=10
```

**Response:**
```json
{
  "leaderboard": [
    {
      "user_id": "123456789",
      "xp": 1500,
      "level": 5,
      "messages": 200
    }
  ]
}
```

#### Get User Data

```http
GET /api/guilds/{guild_id}/users/{user_id}
```

#### Update User Data

```http
PUT /api/guilds/{guild_id}/users/{user_id}?xp=1000&level=5
```

---

### Custom Commands

#### List Commands

```http
GET /api/guilds/{guild_id}/commands
```

**Response:**
```json
{
  "commands": [
    {
      "name": "help",
      "response": "Here is the help...",
      "created_by": "dashboard",
      "created_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

#### Create Command

```http
POST /api/guilds/{guild_id}/commands
Content-Type: application/json

{
  "name": "rules",
  "response": "1. Be nice\n2. No spam\n3. Have fun!"
}
```

#### Delete Command

```http
DELETE /api/guilds/{guild_id}/commands/{name}
```

---

### News

#### List News

```http
GET /api/guilds/{guild_id}/news
```

#### Create News

```http
POST /api/guilds/{guild_id}/news
Content-Type: application/json

{
  "title": "Important Announcement",
  "content": "Here is the content...",
  "scheduled_for": "2024-01-15T18:00:00Z"
}
```

#### Delete News

```http
DELETE /api/guilds/{guild_id}/news/{news_id}
```

---

### Permissions

#### Get Permissions

```http
GET /api/guilds/{guild_id}/permissions
```

**Response:**
```json
{
  "admin_roles": ["123456789"],
  "mod_roles": ["987654321"],
  "command_permissions": {
    "ban": ["123456789"],
    "kick": ["123456789", "987654321"]
  }
}
```

#### Update Permissions

```http
PUT /api/guilds/{guild_id}/permissions
Content-Type: application/json

{
  "command": "ban",
  "role_ids": ["123456789"]
}
```

---

## Error Responses

All endpoints may return the following error responses:

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid parameters |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error |

**Error Response Format:**
```json
{
  "detail": "Error message here"
}
```

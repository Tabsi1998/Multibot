# Konfigurationsreferenz / Configuration Reference

## 🇩🇪 Deutsch

Diese Dokumentation beschreibt alle verfügbaren Konfigurationsoptionen für den MultiBot.

---

## Server-Einstellungen

### Allgemein

| Option | Typ | Standard | Beschreibung |
|--------|-----|----------|--------------|
| `language` | string | `"de"` | Bot-Sprache (`de`, `en`) |
| `prefix` | string | `"!"` | Prefix für Custom Commands |

### Moderation

| Option | Typ | Standard | Beschreibung |
|--------|-----|----------|--------------|
| `mod_log_channel` | string | `null` | Kanal-ID für Mod-Logs |
| `mute_role` | string | `null` | Rollen-ID für Stummschaltung |
| `warn_threshold` | number | `3` | Anzahl Verwarnungen vor Aktion |
| `warn_action` | string | `"mute"` | Aktion bei Schwelle (`mute`, `kick`, `ban`) |

### Willkommen

| Option | Typ | Standard | Beschreibung |
|--------|-----|----------|--------------|
| `welcome_enabled` | boolean | `false` | Willkommensnachrichten aktivieren |
| `welcome_channel` | string | `null` | Kanal-ID für Nachrichten |
| `welcome_message` | string | `null` | Benutzerdefinierte Nachricht |
| `goodbye_enabled` | boolean | `false` | Verabschiedungsnachrichten aktivieren |
| `goodbye_message` | string | `null` | Benutzerdefinierte Verabschiedung |
| `auto_roles` | array | `[]` | Rollen-IDs für neue Mitglieder |

#### Variablen für Nachrichten

| Variable | Beschreibung |
|----------|--------------|
| `{user}` | Mention des Benutzers |
| `{server}` | Name des Servers |

**Beispiel:**
```
Willkommen {user} auf {server}! 🎉
```

### Leveling

| Option | Typ | Standard | Beschreibung |
|--------|-----|----------|--------------|
| `leveling_enabled` | boolean | `true` | XP-System aktivieren |
| `xp_per_message` | number | `15` | XP pro Nachricht |
| `xp_cooldown` | number | `60` | Cooldown in Sekunden |
| `level_up_channel` | string | `null` | Kanal für Level-Up Nachrichten |
| `level_roles` | object | `{}` | Level-Rollen Mapping |
| `ignored_channels` | array | `[]` | Kanäle ohne XP |

#### Level-Rollen Format

```json
{
  "5": "123456789",
  "10": "987654321",
  "20": "111222333"
}
```

### Temp Kanäle

| Option | Typ | Standard | Beschreibung |
|--------|-----|----------|--------------|
| `temp_channels_enabled` | boolean | `false` | Temp Kanäle aktivieren |
| `temp_channel_category` | string | `null` | Kategorie-ID für neue Kanäle |
| `temp_channel_creator` | string | `null` | Voice-Kanal-ID zum Erstellen |

### KI-Chat

| Option | Typ | Standard | Beschreibung |
|--------|-----|----------|--------------|
| `ai_enabled` | boolean | `false` | KI-Chat aktivieren |
| `ai_channel` | string | `null` | Kanal-ID für KI-Antworten |
| `ai_system_prompt` | string | *siehe unten* | System-Prompt für die KI |

**Standard System-Prompt:**
```
Du bist ein freundlicher Discord-Bot Assistent.
```

### News

| Option | Typ | Standard | Beschreibung |
|--------|-----|----------|--------------|
| `news_channel` | string | `null` | Kanal-ID für Ankündigungen |

### Berechtigungen

| Option | Typ | Standard | Beschreibung |
|--------|-----|----------|--------------|
| `admin_roles` | array | `[]` | Rollen-IDs mit Admin-Rechten |
| `mod_roles` | array | `[]` | Rollen-IDs mit Mod-Rechten |
| `command_permissions` | object | `{}` | Command-spezifische Berechtigungen |

#### Command Permissions Format

```json
{
  "ban": ["123456789"],
  "kick": ["123456789", "987654321"],
  "warn": ["123456789", "987654321"]
}
```

---

## 🇬🇧 English

This documentation describes all available configuration options for MultiBot.

---

## Server Settings

### General

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `language` | string | `"de"` | Bot language (`de`, `en`) |
| `prefix` | string | `"!"` | Prefix for custom commands |

### Moderation

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mod_log_channel` | string | `null` | Channel ID for mod logs |
| `mute_role` | string | `null` | Role ID for muting |
| `warn_threshold` | number | `3` | Number of warnings before action |
| `warn_action` | string | `"mute"` | Action at threshold (`mute`, `kick`, `ban`) |

### Welcome

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `welcome_enabled` | boolean | `false` | Enable welcome messages |
| `welcome_channel` | string | `null` | Channel ID for messages |
| `welcome_message` | string | `null` | Custom message |
| `goodbye_enabled` | boolean | `false` | Enable goodbye messages |
| `goodbye_message` | string | `null` | Custom goodbye message |
| `auto_roles` | array | `[]` | Role IDs for new members |

#### Message Variables

| Variable | Description |
|----------|-------------|
| `{user}` | User mention |
| `{server}` | Server name |

**Example:**
```
Welcome {user} to {server}! 🎉
```

### Leveling

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `leveling_enabled` | boolean | `true` | Enable XP system |
| `xp_per_message` | number | `15` | XP per message |
| `xp_cooldown` | number | `60` | Cooldown in seconds |
| `level_up_channel` | string | `null` | Channel for level-up messages |
| `level_roles` | object | `{}` | Level roles mapping |
| `ignored_channels` | array | `[]` | Channels without XP |

#### Level Roles Format

```json
{
  "5": "123456789",
  "10": "987654321",
  "20": "111222333"
}
```

### Temp Channels

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `temp_channels_enabled` | boolean | `false` | Enable temp channels |
| `temp_channel_category` | string | `null` | Category ID for new channels |
| `temp_channel_creator` | string | `null` | Voice channel ID to create |

### AI Chat

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ai_enabled` | boolean | `false` | Enable AI chat |
| `ai_channel` | string | `null` | Channel ID for AI responses |
| `ai_system_prompt` | string | *see below* | System prompt for AI |

**Default System Prompt:**
```
You are a friendly Discord bot assistant.
```

### News

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `news_channel` | string | `null` | Channel ID for announcements |

### Permissions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `admin_roles` | array | `[]` | Role IDs with admin rights |
| `mod_roles` | array | `[]` | Role IDs with mod rights |
| `command_permissions` | object | `{}` | Command-specific permissions |

#### Command Permissions Format

```json
{
  "ban": ["123456789"],
  "kick": ["123456789", "987654321"],
  "warn": ["123456789", "987654321"]
}
```

---

## Vollständiges Beispiel / Complete Example

```json
{
  "guild_id": "123456789012345678",
  "language": "de",
  "prefix": "!",
  
  "mod_log_channel": "111111111111111111",
  "mute_role": null,
  "warn_threshold": 3,
  "warn_action": "mute",
  
  "welcome_enabled": true,
  "welcome_channel": "222222222222222222",
  "welcome_message": "Willkommen {user} auf {server}! 🎉",
  "goodbye_enabled": true,
  "goodbye_message": "Auf Wiedersehen {user}! 👋",
  "auto_roles": ["333333333333333333"],
  
  "leveling_enabled": true,
  "xp_per_message": 15,
  "xp_cooldown": 60,
  "level_up_channel": "444444444444444444",
  "level_roles": {
    "5": "555555555555555555",
    "10": "666666666666666666"
  },
  "ignored_channels": ["777777777777777777"],
  
  "temp_channels_enabled": true,
  "temp_channel_category": "888888888888888888",
  "temp_channel_creator": "999999999999999999",
  
  "ai_enabled": true,
  "ai_channel": "101010101010101010",
  "ai_system_prompt": "Du bist ein freundlicher Gaming-Bot.",
  
  "news_channel": "111111111111111112",
  
  "admin_roles": ["121212121212121212"],
  "mod_roles": ["131313131313131313"],
  "command_permissions": {
    "ban": ["121212121212121212"],
    "kick": ["121212121212121212", "131313131313131313"]
  }
}
```

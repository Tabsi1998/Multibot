# Bot Commands Referenz / Bot Commands Reference

## 🇩🇪 Deutsch

Alle verfügbaren Slash-Commands für den MultiBot.

---

## Moderation

### /warn
Verwarnt einen Benutzer.

**Syntax:**
```
/warn <user> [grund]
```

**Parameter:**
| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|--------------|--------------|
| `user` | User | ✅ | Der zu verwarnende Benutzer |
| `grund` | String | ❌ | Grund der Verwarnung |

**Berechtigung:** Kick Members

**Beispiel:**
```
/warn @BenutzerName Spam im Chat
```

---

### /warnings
Zeigt alle Verwarnungen eines Benutzers.

**Syntax:**
```
/warnings <user>
```

**Parameter:**
| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|--------------|--------------|
| `user` | User | ✅ | Der Benutzer |

**Berechtigung:** Keine

---

### /clearwarnings
Löscht alle Verwarnungen eines Benutzers.

**Syntax:**
```
/clearwarnings <user>
```

**Parameter:**
| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|--------------|--------------|
| `user` | User | ✅ | Der Benutzer |

**Berechtigung:** Kick Members

---

### /kick
Kickt einen Benutzer vom Server.

**Syntax:**
```
/kick <user> [grund]
```

**Parameter:**
| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|--------------|--------------|
| `user` | User | ✅ | Der zu kickende Benutzer |
| `grund` | String | ❌ | Grund des Kicks |

**Berechtigung:** Kick Members

---

### /ban
Bannt einen Benutzer vom Server.

**Syntax:**
```
/ban <user> [grund]
```

**Parameter:**
| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|--------------|--------------|
| `user` | User | ✅ | Der zu bannende Benutzer |
| `grund` | String | ❌ | Grund des Banns |

**Berechtigung:** Ban Members

---

### /mute
Stummschaltet einen Benutzer.

**Syntax:**
```
/mute <user> [dauer] [grund]
```

**Parameter:**
| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|--------------|--------------|
| `user` | User | ✅ | Der Benutzer |
| `dauer` | Integer | ❌ | Dauer in Minuten (Standard: 10) |
| `grund` | String | ❌ | Grund der Stummschaltung |

**Berechtigung:** Moderate Members

---

### /unmute
Hebt die Stummschaltung eines Benutzers auf.

**Syntax:**
```
/unmute <user>
```

**Parameter:**
| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|--------------|--------------|
| `user` | User | ✅ | Der Benutzer |

**Berechtigung:** Moderate Members

---

## Leveling

### /rank
Zeigt den Rang und XP eines Benutzers.

**Syntax:**
```
/rank [user]
```

**Parameter:**
| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|--------------|--------------|
| `user` | User | ❌ | Der Benutzer (Standard: du selbst) |

**Berechtigung:** Keine

**Antwort enthält:**
- Aktuelles Level
- Gesamt-XP
- Anzahl Nachrichten
- Fortschritt zum nächsten Level

---

### /leaderboard
Zeigt die XP-Rangliste des Servers.

**Syntax:**
```
/leaderboard
```

**Berechtigung:** Keine

**Zeigt die Top 10 Benutzer nach XP.**

---

## Info

### /serverinfo
Zeigt Informationen über den Server.

**Syntax:**
```
/serverinfo
```

**Berechtigung:** Keine

**Antwort enthält:**
- Server-Name und ID
- Owner
- Mitgliederanzahl
- Kanalanzahl
- Rollenanzahl
- Erstellungsdatum
- Boost-Status

---

### /userinfo
Zeigt Informationen über einen Benutzer.

**Syntax:**
```
/userinfo [user]
```

**Parameter:**
| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|--------------|--------------|
| `user` | User | ❌ | Der Benutzer (Standard: du selbst) |

**Berechtigung:** Keine

**Antwort enthält:**
- Benutzername und ID
- Beitrittsdatum
- Account-Erstellungsdatum
- Rollen
- Höchste Rolle

---

## 🇬🇧 English

All available slash commands for MultiBot.

---

## Moderation

### /warn
Warns a user.

**Syntax:**
```
/warn <user> [reason]
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user` | User | ✅ | The user to warn |
| `reason` | String | ❌ | Reason for the warning |

**Permission:** Kick Members

**Example:**
```
/warn @UserName Spamming in chat
```

---

### /warnings
Shows all warnings for a user.

**Syntax:**
```
/warnings <user>
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user` | User | ✅ | The user |

**Permission:** None

---

### /clearwarnings
Clears all warnings for a user.

**Syntax:**
```
/clearwarnings <user>
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user` | User | ✅ | The user |

**Permission:** Kick Members

---

### /kick
Kicks a user from the server.

**Syntax:**
```
/kick <user> [reason]
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user` | User | ✅ | The user to kick |
| `reason` | String | ❌ | Reason for the kick |

**Permission:** Kick Members

---

### /ban
Bans a user from the server.

**Syntax:**
```
/ban <user> [reason]
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user` | User | ✅ | The user to ban |
| `reason` | String | ❌ | Reason for the ban |

**Permission:** Ban Members

---

### /mute
Mutes a user.

**Syntax:**
```
/mute <user> [duration] [reason]
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user` | User | ✅ | The user |
| `duration` | Integer | ❌ | Duration in minutes (default: 10) |
| `reason` | String | ❌ | Reason for the mute |

**Permission:** Moderate Members

---

### /unmute
Unmutes a user.

**Syntax:**
```
/unmute <user>
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user` | User | ✅ | The user |

**Permission:** Moderate Members

---

## Leveling

### /rank
Shows the rank and XP of a user.

**Syntax:**
```
/rank [user]
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user` | User | ❌ | The user (default: yourself) |

**Permission:** None

**Response includes:**
- Current level
- Total XP
- Message count
- Progress to next level

---

### /leaderboard
Shows the XP leaderboard.

**Syntax:**
```
/leaderboard
```

**Permission:** None

**Shows the top 10 users by XP.**

---

## Info

### /serverinfo
Shows information about the server.

**Syntax:**
```
/serverinfo
```

**Permission:** None

**Response includes:**
- Server name and ID
- Owner
- Member count
- Channel count
- Role count
- Creation date
- Boost status

---

### /userinfo
Shows information about a user.

**Syntax:**
```
/userinfo [user]
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user` | User | ❌ | The user (default: yourself) |

**Permission:** None

**Response includes:**
- Username and ID
- Join date
- Account creation date
- Roles
- Top role

---

## Berechtigungsübersicht / Permission Overview

| Command | Permission |
|---------|------------|
| `/warn` | Kick Members |
| `/warnings` | None |
| `/clearwarnings` | Kick Members |
| `/kick` | Kick Members |
| `/ban` | Ban Members |
| `/mute` | Moderate Members |
| `/unmute` | Moderate Members |
| `/rank` | None |
| `/leaderboard` | None |
| `/serverinfo` | None |
| `/userinfo` | None |

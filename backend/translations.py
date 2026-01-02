# Multi-language translations for Discord Bot
TRANSLATIONS = {
    "de": {
        "welcome_default": "Willkommen auf dem Server, {user}! 🎉",
        "goodbye_default": "Auf Wiedersehen, {user}! 👋",
        "level_up": "🎉 Herzlichen Glückwunsch {user}! Du hast Level {level} erreicht!",
        "warn_dm": "⚠️ Du wurdest auf **{server}** verwarnt!\nGrund: {reason}",
        "mute_dm": "🔇 Du wurdest auf **{server}** stummgeschaltet!\nDauer: {duration}\nGrund: {reason}",
        "kick_dm": "👢 Du wurdest von **{server}** gekickt!\nGrund: {reason}",
        "ban_dm": "🔨 Du wurdest von **{server}** gebannt!\nGrund: {reason}",
        "temp_channel_created": "🎤 Dein temporärer Kanal wurde erstellt: {channel}",
        "no_permission": "❌ Du hast keine Berechtigung für diesen Befehl!",
        "user_not_found": "❌ Benutzer nicht gefunden!",
        "success": "✅ Erfolgreich!",
        "error": "❌ Ein Fehler ist aufgetreten!",
        "ai_thinking": "🤔 Ich denke nach...",
        "xp_gained": "+{xp} XP",
        "leaderboard_title": "🏆 XP Rangliste",
        "modlog_warn": "⚠️ **Verwarnung**",
        "modlog_mute": "🔇 **Stummschaltung**",
        "modlog_kick": "👢 **Kick**",
        "modlog_ban": "🔨 **Bann**",
        "news_posted": "📢 News wurde gepostet!",
    },
    "en": {
        "welcome_default": "Welcome to the server, {user}! 🎉",
        "goodbye_default": "Goodbye, {user}! 👋",
        "level_up": "🎉 Congratulations {user}! You reached Level {level}!",
        "warn_dm": "⚠️ You have been warned on **{server}**!\nReason: {reason}",
        "mute_dm": "🔇 You have been muted on **{server}**!\nDuration: {duration}\nReason: {reason}",
        "kick_dm": "👢 You have been kicked from **{server}**!\nReason: {reason}",
        "ban_dm": "🔨 You have been banned from **{server}**!\nReason: {reason}",
        "temp_channel_created": "🎤 Your temporary channel was created: {channel}",
        "no_permission": "❌ You don't have permission for this command!",
        "user_not_found": "❌ User not found!",
        "success": "✅ Success!",
        "error": "❌ An error occurred!",
        "ai_thinking": "🤔 Thinking...",
        "xp_gained": "+{xp} XP",
        "leaderboard_title": "🏆 XP Leaderboard",
        "modlog_warn": "⚠️ **Warning**",
        "modlog_mute": "🔇 **Mute**",
        "modlog_kick": "👢 **Kick**",
        "modlog_ban": "🔨 **Ban**",
        "news_posted": "📢 News has been posted!",
    }
}

def get_translation(lang: str, key: str, **kwargs) -> str:
    """Get translated string with optional formatting"""
    translations = TRANSLATIONS.get(lang, TRANSLATIONS["de"])
    text = translations.get(key, TRANSLATIONS["de"].get(key, key))
    if kwargs:
        try:
            return text.format(**kwargs)
        except KeyError:
            return text
    return text

def t(lang: str, key: str, **kwargs) -> str:
    """Shorthand for get_translation"""
    return get_translation(lang, key, **kwargs)

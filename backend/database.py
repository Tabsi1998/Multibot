from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Collections
guilds_collection = db.guilds
users_collection = db.users
warnings_collection = db.warnings
custom_commands_collection = db.custom_commands
news_collection = db.news
mod_logs_collection = db.mod_logs
temp_channels_collection = db.temp_channels
reaction_roles_collection = db.reaction_roles
games_collection = db.games

# Default guild config
DEFAULT_GUILD_CONFIG = {
    "language": "de",
    "prefix": "!",
    # Moderation
    "mod_log_channel": None,
    "mute_role": None,
    "warn_threshold": 3,
    "warn_action": "mute",
    # Welcome
    "welcome_enabled": False,
    "welcome_channel": None,
    "welcome_message": None,
    "goodbye_enabled": False,
    "goodbye_message": None,
    "auto_roles": [],
    # Leveling
    "leveling_enabled": True,
    "xp_per_message": 15,
    "xp_cooldown": 60,
    "level_up_channel": None,
    "level_roles": {},
    "ignored_channels": [],
    # Voice XP
    "voice_xp_enabled": False,
    "voice_xp_per_minute": 5,
    "voice_xp_min_users": 2,
    "voice_afk_channel": None,
    # Temp Channels - EXPANDED
    "temp_channels_enabled": False,
    "temp_channel_category": None,
    "temp_channel_creator": None,
    "temp_channel_default_name": "🔊 {user}'s Kanal",
    "temp_channel_default_limit": 0,
    "temp_channel_default_bitrate": 64000,
    "temp_channel_allow_rename": True,
    "temp_channel_allow_limit": True,
    "temp_channel_allow_lock": True,
    "temp_channel_allow_hide": True,
    "temp_channel_allow_kick": True,
    "temp_channel_allow_permit": True,
    "temp_channel_allow_bitrate": True,
    # AI
    "ai_enabled": False,
    "ai_channel": None,
    "ai_system_prompt": "Du bist ein freundlicher Discord-Bot Assistent.",
    # News
    "news_channel": None,
    # Permissions
    "command_permissions": {},
    "admin_roles": [],
    "mod_roles": [],
    # Games
    "games_enabled": True,
    "games_channel": None,
    # Bot Info
    "bot_status": "online",  # online, idle, dnd, invisible
    "bot_activity_type": "playing",  # playing, watching, listening, competing
    "bot_activity_text": "mit /help starten",
    "bot_embed_color": "#5865F2",
}

async def get_guild_config(guild_id: str) -> dict:
    """Get or create guild configuration"""
    config = await guilds_collection.find_one({"guild_id": guild_id}, {"_id": 0})
    if not config:
        config = {**DEFAULT_GUILD_CONFIG, "guild_id": guild_id}
        insert_doc = dict(config)
        await guilds_collection.insert_one(insert_doc)
        config = {k: v for k, v in config.items() if k != "_id"}
    else:
        for key, value in DEFAULT_GUILD_CONFIG.items():
            if key not in config:
                config[key] = value
    return config

async def update_guild_config(guild_id: str, updates: dict) -> dict:
    """Update guild configuration"""
    await guilds_collection.update_one(
        {"guild_id": guild_id},
        {"$set": updates},
        upsert=True
    )
    return await get_guild_config(guild_id)

async def get_user_data(guild_id: str, user_id: str) -> dict:
    """Get or create user data for a guild"""
    user = await users_collection.find_one(
        {"guild_id": guild_id, "user_id": user_id},
        {"_id": 0}
    )
    if not user:
        user = {
            "guild_id": guild_id,
            "user_id": user_id,
            "xp": 0,
            "level": 0,
            "messages": 0,
            "last_xp": None,
            "warnings": 0
        }
        insert_doc = dict(user)
        await users_collection.insert_one(insert_doc)
        user = {k: v for k, v in user.items() if k != "_id"}
    return user

async def update_user_data(guild_id: str, user_id: str, updates: dict) -> dict:
    """Update user data"""
    await users_collection.update_one(
        {"guild_id": guild_id, "user_id": user_id},
        {"$set": updates},
        upsert=True
    )
    return await get_user_data(guild_id, user_id)

async def add_warning(guild_id: str, user_id: str, mod_id: str, reason: str) -> dict:
    """Add a warning to a user"""
    from datetime import datetime, timezone
    warning = {
        "guild_id": guild_id,
        "user_id": user_id,
        "mod_id": mod_id,
        "reason": reason,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await warnings_collection.insert_one(warning)
    await users_collection.update_one(
        {"guild_id": guild_id, "user_id": user_id},
        {"$inc": {"warnings": 1}},
        upsert=True
    )
    return warning

async def get_warnings(guild_id: str, user_id: str) -> list:
    """Get all warnings for a user"""
    warnings = await warnings_collection.find(
        {"guild_id": guild_id, "user_id": user_id},
        {"_id": 0}
    ).to_list(100)
    return warnings

async def clear_warnings(guild_id: str, user_id: str) -> int:
    """Clear all warnings for a user"""
    result = await warnings_collection.delete_many(
        {"guild_id": guild_id, "user_id": user_id}
    )
    await users_collection.update_one(
        {"guild_id": guild_id, "user_id": user_id},
        {"$set": {"warnings": 0}}
    )
    return result.deleted_count

async def get_leaderboard(guild_id: str, limit: int = 10) -> list:
    """Get XP leaderboard for a guild"""
    users = await users_collection.find(
        {"guild_id": guild_id},
        {"_id": 0}
    ).sort("xp", -1).limit(limit).to_list(limit)
    return users

async def add_custom_command(guild_id: str, name: str, response: str, created_by: str) -> dict:
    """Add a custom command"""
    from datetime import datetime, timezone
    command = {
        "guild_id": guild_id,
        "name": name.lower(),
        "response": response,
        "created_by": created_by,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await custom_commands_collection.update_one(
        {"guild_id": guild_id, "name": name.lower()},
        {"$set": command},
        upsert=True
    )
    return command

async def get_custom_commands(guild_id: str) -> list:
    """Get all custom commands for a guild"""
    commands = await custom_commands_collection.find(
        {"guild_id": guild_id},
        {"_id": 0}
    ).to_list(100)
    return commands

async def delete_custom_command(guild_id: str, name: str) -> bool:
    """Delete a custom command"""
    result = await custom_commands_collection.delete_one(
        {"guild_id": guild_id, "name": name.lower()}
    )
    return result.deleted_count > 0

async def add_news(guild_id: str, title: str, content: str, scheduled_for: str = None, created_by: str = None) -> dict:
    """Add a news item"""
    from datetime import datetime, timezone
    import uuid
    news = {
        "id": str(uuid.uuid4()),
        "guild_id": guild_id,
        "title": title,
        "content": content,
        "scheduled_for": scheduled_for,
        "created_by": created_by,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "posted": False
    }
    insert_doc = dict(news)
    await news_collection.insert_one(insert_doc)
    return {k: v for k, v in news.items() if k != "_id"}

async def get_news(guild_id: str) -> list:
    """Get all news for a guild"""
    news = await news_collection.find(
        {"guild_id": guild_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return news

async def delete_news(news_id: str) -> bool:
    """Delete a news item"""
    result = await news_collection.delete_one({"id": news_id})
    return result.deleted_count > 0

async def mark_news_posted(news_id: str) -> bool:
    """Mark news as posted"""
    result = await news_collection.update_one(
        {"id": news_id},
        {"$set": {"posted": True}}
    )
    return result.modified_count > 0

async def add_mod_log(guild_id: str, action: str, mod_id: str, target_id: str, reason: str) -> dict:
    """Add a moderation log entry"""
    from datetime import datetime, timezone
    import uuid
    log = {
        "id": str(uuid.uuid4()),
        "guild_id": guild_id,
        "action": action,
        "mod_id": mod_id,
        "target_id": target_id,
        "reason": reason,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await mod_logs_collection.insert_one(log)
    return log

async def get_mod_logs(guild_id: str, limit: int = 50) -> list:
    """Get moderation logs for a guild"""
    logs = await mod_logs_collection.find(
        {"guild_id": guild_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    return logs

# ==================== TEMP CHANNELS ====================

async def create_temp_channel(guild_id: str, channel_id: str, owner_id: str, name: str) -> dict:
    """Create a temp channel record"""
    from datetime import datetime, timezone
    channel = {
        "guild_id": guild_id,
        "channel_id": channel_id,
        "owner_id": owner_id,
        "name": name,
        "user_limit": 0,
        "bitrate": 64000,
        "locked": False,
        "hidden": False,
        "permitted_users": [],
        "banned_users": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await temp_channels_collection.insert_one(channel)
    return {k: v for k, v in channel.items() if k != "_id"}

async def get_temp_channel(channel_id: str) -> dict:
    """Get temp channel by ID"""
    channel = await temp_channels_collection.find_one(
        {"channel_id": channel_id},
        {"_id": 0}
    )
    return channel

async def get_temp_channels(guild_id: str) -> list:
    """Get all temp channels for a guild"""
    channels = await temp_channels_collection.find(
        {"guild_id": guild_id},
        {"_id": 0}
    ).to_list(100)
    return channels

async def update_temp_channel(channel_id: str, updates: dict) -> dict:
    """Update temp channel"""
    await temp_channels_collection.update_one(
        {"channel_id": channel_id},
        {"$set": updates}
    )
    return await get_temp_channel(channel_id)

async def delete_temp_channel(channel_id: str) -> bool:
    """Delete temp channel record"""
    result = await temp_channels_collection.delete_one({"channel_id": channel_id})
    return result.deleted_count > 0

# ==================== REACTION ROLES ====================

async def create_reaction_role(guild_id: str, channel_id: str, message_id: str, 
                                emoji: str, role_id: str, role_type: str = "reaction",
                                title: str = None, description: str = None) -> dict:
    """Create a reaction role"""
    from datetime import datetime, timezone
    import uuid
    rr = {
        "id": str(uuid.uuid4()),
        "guild_id": guild_id,
        "channel_id": channel_id,
        "message_id": message_id,
        "emoji": emoji,
        "role_id": role_id,
        "role_type": role_type,  # "reaction", "button", "dropdown"
        "title": title,
        "description": description,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await reaction_roles_collection.insert_one(rr)
    return {k: v for k, v in rr.items() if k != "_id"}

async def get_reaction_roles(guild_id: str) -> list:
    """Get all reaction roles for a guild"""
    rrs = await reaction_roles_collection.find(
        {"guild_id": guild_id},
        {"_id": 0}
    ).to_list(100)
    return rrs

async def get_reaction_role_by_message(message_id: str, emoji: str = None) -> list:
    """Get reaction roles by message ID"""
    query = {"message_id": message_id}
    if emoji:
        query["emoji"] = emoji
    rrs = await reaction_roles_collection.find(query, {"_id": 0}).to_list(100)
    return rrs

async def delete_reaction_role(rr_id: str) -> bool:
    """Delete a reaction role"""
    result = await reaction_roles_collection.delete_one({"id": rr_id})
    return result.deleted_count > 0

async def delete_reaction_roles_by_message(message_id: str) -> int:
    """Delete all reaction roles for a message"""
    result = await reaction_roles_collection.delete_many({"message_id": message_id})
    return result.deleted_count

# ==================== GAMES ====================

async def create_game(guild_id: str, channel_id: str, game_type: str, 
                      player1_id: str, player2_id: str = None, state: dict = None) -> dict:
    """Create a game"""
    from datetime import datetime, timezone
    import uuid
    game = {
        "id": str(uuid.uuid4()),
        "guild_id": guild_id,
        "channel_id": channel_id,
        "game_type": game_type,
        "player1_id": player1_id,
        "player2_id": player2_id,
        "state": state or {},
        "status": "waiting" if not player2_id else "active",
        "winner_id": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await games_collection.insert_one(game)
    return {k: v for k, v in game.items() if k != "_id"}

async def get_game(game_id: str) -> dict:
    """Get game by ID"""
    game = await games_collection.find_one({"id": game_id}, {"_id": 0})
    return game

async def get_active_games(guild_id: str) -> list:
    """Get all active games for a guild"""
    games = await games_collection.find(
        {"guild_id": guild_id, "status": {"$in": ["waiting", "active"]}},
        {"_id": 0}
    ).to_list(100)
    return games

async def update_game(game_id: str, updates: dict) -> dict:
    """Update game"""
    await games_collection.update_one(
        {"id": game_id},
        {"$set": updates}
    )
    return await get_game(game_id)

async def delete_game(game_id: str) -> bool:
    """Delete a game"""
    result = await games_collection.delete_one({"id": game_id})
    return result.deleted_count > 0

# ==================== SERVER SYNC ====================

server_data_collection = db.server_data

async def sync_server_data(guild_id: str, roles: list, channels: list, categories: list, emojis: list) -> dict:
    """Sync all server data (roles, channels, categories, emojis)"""
    from datetime import datetime, timezone
    
    data = {
        "guild_id": guild_id,
        "roles": roles,
        "channels": channels,
        "categories": categories,
        "emojis": emojis,
        "last_sync": datetime.now(timezone.utc).isoformat()
    }
    
    await server_data_collection.update_one(
        {"guild_id": guild_id},
        {"$set": data},
        upsert=True
    )
    return data

async def get_server_data(guild_id: str) -> dict:
    """Get cached server data"""
    data = await server_data_collection.find_one(
        {"guild_id": guild_id},
        {"_id": 0}
    )
    return data or {"guild_id": guild_id, "roles": [], "channels": [], "categories": [], "emojis": []}

# ==================== LEVEL REWARDS ====================

level_rewards_collection = db.level_rewards

async def get_level_rewards(guild_id: str) -> list:
    """Get all level rewards for a guild"""
    rewards = await level_rewards_collection.find(
        {"guild_id": guild_id},
        {"_id": 0}
    ).to_list(100)
    return rewards

async def create_level_reward(guild_id: str, level: int, reward_type: str, reward_value: str, reward_name: str = None) -> dict:
    """Create a level reward"""
    import uuid
    reward = {
        "id": str(uuid.uuid4()),
        "guild_id": guild_id,
        "level": level,
        "reward_type": reward_type,  # "role", "emoji"
        "reward_value": reward_value,  # role_id or emoji_id
        "reward_name": reward_name,
        "enabled": True
    }
    await level_rewards_collection.insert_one(reward)
    return {k: v for k, v in reward.items() if k != "_id"}

async def delete_level_reward(reward_id: str) -> bool:
    """Delete a level reward"""
    result = await level_rewards_collection.delete_one({"id": reward_id})
    return result.deleted_count > 0

async def toggle_level_reward(reward_id: str, enabled: bool) -> bool:
    """Toggle a level reward"""
    result = await level_rewards_collection.update_one(
        {"id": reward_id},
        {"$set": {"enabled": enabled}}
    )
    return result.modified_count > 0

# ==================== VOICE XP TRACKING ====================

voice_sessions_collection = db.voice_sessions

async def start_voice_session(guild_id: str, user_id: str, channel_id: str) -> dict:
    """Start tracking a voice session"""
    from datetime import datetime, timezone
    
    session = {
        "guild_id": guild_id,
        "user_id": user_id,
        "channel_id": channel_id,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "ended_at": None,
        "xp_awarded": 0
    }
    
    await voice_sessions_collection.update_one(
        {"guild_id": guild_id, "user_id": user_id, "ended_at": None},
        {"$set": session},
        upsert=True
    )
    return session

async def end_voice_session(guild_id: str, user_id: str) -> dict:
    """End a voice session and calculate XP"""
    from datetime import datetime, timezone
    
    session = await voice_sessions_collection.find_one(
        {"guild_id": guild_id, "user_id": user_id, "ended_at": None},
        {"_id": 0}
    )
    
    if not session:
        return None
    
    ended_at = datetime.now(timezone.utc)
    started_at = datetime.fromisoformat(session["started_at"].replace("Z", "+00:00"))
    duration_minutes = (ended_at - started_at).total_seconds() / 60
    
    await voice_sessions_collection.update_one(
        {"guild_id": guild_id, "user_id": user_id, "ended_at": None},
        {"$set": {"ended_at": ended_at.isoformat()}}
    )
    
    session["ended_at"] = ended_at.isoformat()
    session["duration_minutes"] = duration_minutes
    return session

async def get_active_voice_sessions(guild_id: str) -> list:
    """Get all active voice sessions"""
    sessions = await voice_sessions_collection.find(
        {"guild_id": guild_id, "ended_at": None},
        {"_id": 0}
    ).to_list(1000)
    return sessions


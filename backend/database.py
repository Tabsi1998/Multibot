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

# Default guild config
DEFAULT_GUILD_CONFIG = {
    "language": "de",
    "prefix": "!",
    # Moderation
    "mod_log_channel": None,
    "mute_role": None,
    "warn_threshold": 3,
    "warn_action": "mute",  # mute, kick, ban
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
    "level_roles": {},  # {level: role_id}
    "ignored_channels": [],
    # Temp Channels
    "temp_channels_enabled": False,
    "temp_channel_category": None,
    "temp_channel_creator": None,  # Voice channel that creates temp channels
    # AI
    "ai_enabled": False,
    "ai_channel": None,
    "ai_system_prompt": "Du bist ein freundlicher Discord-Bot Assistent.",
    # News
    "news_channel": None,
    # Permissions
    "command_permissions": {},  # {command: [role_ids]}
    "admin_roles": [],
    "mod_roles": [],
}

async def get_guild_config(guild_id: str) -> dict:
    """Get or create guild configuration"""
    config = await guilds_collection.find_one({"guild_id": guild_id}, {"_id": 0})
    if not config:
        config = {**DEFAULT_GUILD_CONFIG, "guild_id": guild_id}
        # Remove _id before returning
        insert_doc = dict(config)
        await guilds_collection.insert_one(insert_doc)
        # Return fresh copy without _id
        config = {k: v for k, v in config.items() if k != "_id"}
    else:
        # Merge with defaults for any missing keys
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
        await users_collection.insert_one(user)
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
    # Update user warning count
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
    await news_collection.insert_one(news)
    return news

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

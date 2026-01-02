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

async def create_temp_channel(guild_id: str, channel_id: str, owner_id: str, name: str, creator_id: str = None) -> dict:
    """Create a temp channel record"""
    from datetime import datetime, timezone
    channel = {
        "guild_id": guild_id,
        "channel_id": channel_id,
        "owner_id": owner_id,
        "name": name,
        "creator_id": creator_id,  # Link to the creator that spawned this channel
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

async def update_reaction_role(rr_id: str, data: dict) -> dict:
    """Update a reaction role"""
    # Remove fields that shouldn't be updated
    update_data = {k: v for k, v in data.items() if k not in ["id", "_id", "guild_id", "message_id"]}
    
    result = await reaction_roles_collection.find_one_and_update(
        {"id": rr_id},
        {"$set": update_data},
        return_document=True
    )
    if result:
        return {k: v for k, v in result.items() if k != "_id"}
    return None

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

# ==================== TICKET SYSTEM ====================

ticket_panels_collection = db.ticket_panels
tickets_collection = db.tickets

async def create_ticket_panel(guild_id: str, panel_data: dict) -> dict:
    """Create a ticket panel configuration"""
    import uuid
    from datetime import datetime, timezone
    
    panel = {
        "id": str(uuid.uuid4()),
        "guild_id": guild_id,
        "channel_id": panel_data.get("channel_id"),
        "message_id": None,  # Set when bot creates the message
        "title": panel_data.get("title", "🎫 Support Tickets"),
        "description": panel_data.get("description", "Klicke auf den Button um ein Ticket zu erstellen."),
        "color": panel_data.get("color", "#5865F2"),
        "button_label": panel_data.get("button_label", "Ticket erstellen"),
        "button_emoji": panel_data.get("button_emoji", "🎫"),
        "ticket_category": panel_data.get("ticket_category"),  # Category for ticket channels
        "ticket_name_template": panel_data.get("ticket_name_template", "ticket-{number}"),
        "categories": panel_data.get("categories", []),  # Dropdown categories
        "custom_fields": panel_data.get("custom_fields", []),  # Custom form fields
        "support_roles": panel_data.get("support_roles", []),  # Roles that can see/claim tickets
        "ping_roles": panel_data.get("ping_roles", []),  # Roles to ping on new ticket
        "claim_enabled": panel_data.get("claim_enabled", True),
        "transcript_enabled": panel_data.get("transcript_enabled", True),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "ticket_counter": 0
    }
    
    await ticket_panels_collection.insert_one(panel)
    return {k: v for k, v in panel.items() if k != "_id"}

async def get_ticket_panels(guild_id: str) -> list:
    """Get all ticket panels for a guild"""
    panels = await ticket_panels_collection.find(
        {"guild_id": guild_id},
        {"_id": 0}
    ).to_list(50)
    return panels

async def get_ticket_panel(panel_id: str) -> dict:
    """Get a specific ticket panel"""
    panel = await ticket_panels_collection.find_one(
        {"id": panel_id},
        {"_id": 0}
    )
    return panel

async def update_ticket_panel(panel_id: str, updates: dict) -> bool:
    """Update a ticket panel"""
    result = await ticket_panels_collection.update_one(
        {"id": panel_id},
        {"$set": updates}
    )
    return result.modified_count > 0

async def delete_ticket_panel(panel_id: str) -> bool:
    """Delete a ticket panel"""
    result = await ticket_panels_collection.delete_one({"id": panel_id})
    return result.deleted_count > 0

async def increment_ticket_counter(panel_id: str) -> int:
    """Increment and return the ticket counter"""
    result = await ticket_panels_collection.find_one_and_update(
        {"id": panel_id},
        {"$inc": {"ticket_counter": 1}},
        return_document=True
    )
    return result.get("ticket_counter", 1) if result else 1

async def create_ticket(guild_id: str, panel_id: str, ticket_data: dict) -> dict:
    """Create a new ticket"""
    import uuid
    from datetime import datetime, timezone
    
    ticket = {
        "id": str(uuid.uuid4()),
        "guild_id": guild_id,
        "panel_id": panel_id,
        "channel_id": ticket_data.get("channel_id"),
        "user_id": ticket_data.get("user_id"),
        "ticket_number": ticket_data.get("ticket_number", 1),
        "category": ticket_data.get("category"),
        "custom_fields": ticket_data.get("custom_fields", {}),
        "status": "open",  # open, claimed, closed
        "claimed_by": None,
        "claimed_at": None,
        "closed_by": None,
        "closed_at": None,
        "transcript_url": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await tickets_collection.insert_one(ticket)
    return {k: v for k, v in ticket.items() if k != "_id"}

async def get_tickets(guild_id: str, status: str = None) -> list:
    """Get tickets for a guild"""
    query = {"guild_id": guild_id}
    if status:
        query["status"] = status
    
    tickets = await tickets_collection.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return tickets

async def get_ticket(ticket_id: str) -> dict:
    """Get a specific ticket"""
    ticket = await tickets_collection.find_one(
        {"id": ticket_id},
        {"_id": 0}
    )
    return ticket

async def get_ticket_by_channel(channel_id: str) -> dict:
    """Get ticket by channel ID"""
    ticket = await tickets_collection.find_one(
        {"channel_id": channel_id},
        {"_id": 0}
    )
    return ticket

async def update_ticket(ticket_id: str, updates: dict) -> bool:
    """Update a ticket"""
    result = await tickets_collection.update_one(
        {"id": ticket_id},
        {"$set": updates}
    )
    return result.modified_count > 0

async def claim_ticket(ticket_id: str, user_id: str) -> bool:
    """Claim a ticket"""
    from datetime import datetime, timezone
    result = await tickets_collection.update_one(
        {"id": ticket_id, "status": "open"},
        {"$set": {
            "claimed_by": user_id,
            "claimed_at": datetime.now(timezone.utc).isoformat(),
            "status": "claimed"
        }}
    )
    return result.modified_count > 0

async def close_ticket(ticket_id: str, user_id: str) -> bool:
    """Close a ticket"""
    from datetime import datetime, timezone
    result = await tickets_collection.update_one(
        {"id": ticket_id},
        {"$set": {
            "closed_by": user_id,
            "closed_at": datetime.now(timezone.utc).isoformat(),
            "status": "closed"
        }}
    )
    return result.modified_count > 0

async def get_ticket_stats(guild_id: str) -> dict:
    """Get ticket statistics"""
    open_count = await tickets_collection.count_documents({"guild_id": guild_id, "status": "open"})
    claimed_count = await tickets_collection.count_documents({"guild_id": guild_id, "status": "claimed"})
    closed_count = await tickets_collection.count_documents({"guild_id": guild_id, "status": "closed"})
    total_count = await tickets_collection.count_documents({"guild_id": guild_id})
    
    return {
        "open": open_count,
        "claimed": claimed_count,
        "closed": closed_count,
        "total": total_count
    }

# ==================== MULTI TEMP VOICE CREATORS ====================

temp_creators_collection = db.temp_creators

async def create_temp_creator(guild_id: str, creator_data: dict) -> dict:
    """Create a temp voice channel creator configuration"""
    import uuid
    
    creator = {
        "id": str(uuid.uuid4()),
        "guild_id": guild_id,
        "channel_id": creator_data.get("channel_id"),  # The creator voice channel
        "category_id": creator_data.get("category_id"),  # Where to create temp channels
        "name_template": creator_data.get("name_template", "🔊 {user}'s Kanal"),
        "numbering_type": creator_data.get("numbering_type", "number"),  # number, letter, superscript
        "position": creator_data.get("position", "bottom"),  # top, bottom
        "default_limit": creator_data.get("default_limit", 0),
        "default_bitrate": creator_data.get("default_bitrate", 64000),
        # Permissions
        "allow_rename": creator_data.get("allow_rename", True),
        "allow_limit": creator_data.get("allow_limit", True),
        "allow_lock": creator_data.get("allow_lock", True),
        "allow_hide": creator_data.get("allow_hide", True),
        "allow_kick": creator_data.get("allow_kick", True),
        "allow_permit": creator_data.get("allow_permit", True),
        "allow_bitrate": creator_data.get("allow_bitrate", True),
        "enabled": True,
        "channel_counter": 0
    }
    
    await temp_creators_collection.insert_one(creator)
    return {k: v for k, v in creator.items() if k != "_id"}

async def get_temp_creators(guild_id: str) -> list:
    """Get all temp voice creators for a guild"""
    creators = await temp_creators_collection.find(
        {"guild_id": guild_id},
        {"_id": 0}
    ).to_list(50)
    return creators

async def get_temp_creator(creator_id: str) -> dict:
    """Get a specific temp creator"""
    creator = await temp_creators_collection.find_one(
        {"id": creator_id},
        {"_id": 0}
    )
    return creator

async def get_temp_creator_by_channel(channel_id: str) -> dict:
    """Get temp creator by channel ID"""
    creator = await temp_creators_collection.find_one(
        {"channel_id": channel_id},
        {"_id": 0}
    )
    return creator

async def update_temp_creator(creator_id: str, updates: dict) -> bool:
    """Update a temp creator"""
    result = await temp_creators_collection.update_one(
        {"id": creator_id},
        {"$set": updates}
    )
    return result.modified_count > 0

async def delete_temp_creator(creator_id: str) -> bool:
    """Delete a temp creator"""
    result = await temp_creators_collection.delete_one({"id": creator_id})
    return result.deleted_count > 0

async def increment_temp_creator_counter(creator_id: str) -> int:
    """Increment and return the channel counter"""
    result = await temp_creators_collection.find_one_and_update(
        {"id": creator_id},
        {"$inc": {"channel_counter": 1}},
        return_document=True
    )
    return result.get("channel_counter", 1) if result else 1

def get_numbering(number: int, numbering_type: str) -> str:
    """Convert number to the specified format"""
    if numbering_type == "letter":
        # 1=a, 2=b, 3=c, ..., 26=z, 27=aa, etc.
        result = ""
        while number > 0:
            number -= 1
            result = chr(ord('a') + (number % 26)) + result
            number //= 26
        return result
    elif numbering_type == "superscript":
        superscripts = "⁰¹²³⁴⁵⁶⁷⁸⁹"
        return "".join(superscripts[int(d)] for d in str(number))
    elif numbering_type == "subscript":
        subscripts = "₀₁₂₃₄₅₆₇₈₉"
        return "".join(subscripts[int(d)] for d in str(number))
    elif numbering_type == "roman":
        # Simple roman numerals for 1-50
        val = [50, 40, 10, 9, 5, 4, 1]
        syms = ['L', 'XL', 'X', 'IX', 'V', 'IV', 'I']
        result = ""
        for i, v in enumerate(val):
            while number >= v:
                result += syms[i]
                number -= v
        return result.lower()
    else:  # number
        return str(number)

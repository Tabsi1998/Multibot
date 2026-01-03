from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import asyncio
import subprocess
import sys
import hashlib
import secrets
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', secrets.token_hex(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Security
security = HTTPBearer(auto_error=False)

# Import database helpers
from database import (
    get_guild_config, update_guild_config, get_user_data, update_user_data,
    add_warning, get_warnings, clear_warnings, get_leaderboard,
    add_custom_command, get_custom_commands, delete_custom_command,
    add_news, get_news, delete_news, get_mod_logs, add_mod_log
)

# Create the main app
app = FastAPI(title="Discord Bot Command Center API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Bot process tracking
bot_process = None

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    """Hash password with SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_jwt_token(user_id: str, username: str, is_admin: bool) -> str:
    """Create JWT token"""
    payload = {
        "user_id": user_id,
        "username": username,
        "is_admin": is_admin,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> Optional[dict]:
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[dict]:
    """Get current user from JWT token"""
    if not credentials:
        return None
    
    payload = verify_jwt_token(credentials.credentials)
    if not payload:
        return None
    
    return payload

async def require_auth(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Require authentication"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Nicht authentifiziert")
    
    payload = verify_jwt_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Token ungültig oder abgelaufen")
    
    return payload

async def require_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Require admin authentication"""
    user = await require_auth(credentials)
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin-Berechtigung erforderlich")
    return user

# ==================== MODELS ====================

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    is_admin: bool
    created_at: str

class BotConfig(BaseModel):
    discord_token: Optional[str] = None
    openai_api_key: Optional[str] = None

class GuildConfigUpdate(BaseModel):
    language: Optional[str] = None
    prefix: Optional[str] = None
    mod_log_channel: Optional[str] = None
    mute_role: Optional[str] = None
    warn_threshold: Optional[int] = None
    warn_action: Optional[str] = None
    welcome_enabled: Optional[bool] = None
    welcome_channel: Optional[str] = None
    welcome_message: Optional[str] = None
    goodbye_enabled: Optional[bool] = None
    goodbye_message: Optional[str] = None
    auto_roles: Optional[List[str]] = None
    leveling_enabled: Optional[bool] = None
    xp_per_message: Optional[int] = None
    xp_cooldown: Optional[int] = None
    level_up_channel: Optional[str] = None
    level_roles: Optional[Dict[str, str]] = None
    ignored_channels: Optional[List[str]] = None
    # Voice XP
    voice_xp_enabled: Optional[bool] = None
    voice_xp_per_minute: Optional[int] = None
    voice_xp_min_users: Optional[int] = None
    voice_afk_channel: Optional[str] = None
    # Temp Channels
    temp_channels_enabled: Optional[bool] = None
    temp_channel_category: Optional[str] = None
    temp_channel_creator: Optional[str] = None
    ai_enabled: Optional[bool] = None
    ai_channel: Optional[str] = None
    ai_system_prompt: Optional[str] = None
    news_channel: Optional[str] = None
    admin_roles: Optional[List[str]] = None
    mod_roles: Optional[List[str]] = None
    # Bot Appearance
    bot_status: Optional[str] = None
    bot_activity_type: Optional[str] = None
    bot_activity_text: Optional[str] = None
    bot_embed_color: Optional[str] = None
    # Games
    games_enabled: Optional[bool] = None
    games_channel: Optional[str] = None
    disabled_games: Optional[List[str]] = None
    game_cooldown: Optional[int] = None
    max_active_games: Optional[int] = None

class CustomCommandCreate(BaseModel):
    name: str
    response: str

class NewsCreate(BaseModel):
    title: str
    content: str
    scheduled_for: Optional[str] = None

class PermissionUpdate(BaseModel):
    command: str
    role_ids: List[str]

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    """Register a new user. First user becomes admin."""
    # Check if email already exists
    existing = await db.dashboard_users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="E-Mail bereits registriert")
    
    # Check if username already exists
    existing_username = await db.dashboard_users.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Benutzername bereits vergeben")
    
    # Check if this is the first user (will be admin)
    user_count = await db.dashboard_users.count_documents({})
    is_admin = user_count == 0
    
    # Create user
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "username": user_data.username,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "is_admin": is_admin,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.dashboard_users.insert_one(user)
    
    # Create JWT token
    token = create_jwt_token(user_id, user_data.username, is_admin)
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "username": user_data.username,
            "email": user_data.email,
            "is_admin": is_admin
        },
        "message": "Registrierung erfolgreich!" + (" Du bist der erste Benutzer und damit Administrator." if is_admin else "")
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    """Login with email and password"""
    user = await db.dashboard_users.find_one({"email": credentials.email})
    
    if not user:
        raise HTTPException(status_code=401, detail="Ungültige Anmeldedaten")
    
    if user["password_hash"] != hash_password(credentials.password):
        raise HTTPException(status_code=401, detail="Ungültige Anmeldedaten")
    
    # Create JWT token
    token = create_jwt_token(user["id"], user["username"], user["is_admin"])
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "is_admin": user["is_admin"]
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(require_auth)):
    """Get current user info"""
    user = await db.dashboard_users.find_one({"id": current_user["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    return user

@api_router.get("/auth/users")
async def list_users(current_user: dict = Depends(require_admin)):
    """List all users (admin only)"""
    users = await db.dashboard_users.find({}, {"_id": 0, "password_hash": 0}).to_list(100)
    return {"users": users}

@api_router.put("/auth/users/{user_id}/admin")
async def toggle_admin(user_id: str, is_admin: bool, current_user: dict = Depends(require_admin)):
    """Toggle admin status for a user (admin only)"""
    if user_id == current_user["user_id"]:
        raise HTTPException(status_code=400, detail="Du kannst deinen eigenen Admin-Status nicht ändern")
    
    result = await db.dashboard_users.update_one(
        {"id": user_id},
        {"$set": {"is_admin": is_admin}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    
    return {"success": True, "message": f"Admin-Status auf {is_admin} gesetzt"}

@api_router.delete("/auth/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(require_admin)):
    """Delete a user (admin only)"""
    if user_id == current_user["user_id"]:
        raise HTTPException(status_code=400, detail="Du kannst dich nicht selbst löschen")
    
    result = await db.dashboard_users.delete_one({"id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    
    return {"success": True, "message": "Benutzer gelöscht"}

# ==================== BOT MANAGEMENT ====================

@api_router.get("/")
async def root():
    return {"message": "Discord Bot Command Center API", "status": "online"}

@api_router.get("/bot/status")
async def get_bot_status():
    """Get bot running status"""
    global bot_process
    is_running = bot_process is not None and bot_process.poll() is None
    token_set = bool(os.environ.get('DISCORD_BOT_TOKEN'))
    
    return {
        "running": is_running,
        "token_configured": token_set,
        "openai_configured": bool(os.environ.get('OPENAI_API_KEY') or os.environ.get('EMERGENT_LLM_KEY'))
    }

@api_router.post("/bot/configure")
async def configure_bot(config: BotConfig, current_user: dict = Depends(require_admin)):
    """Configure bot tokens (admin only)"""
    env_path = ROOT_DIR / '.env'
    env_content = env_path.read_text() if env_path.exists() else ""
    
    lines = env_content.strip().split('\n') if env_content.strip() else []
    env_dict = {}
    for line in lines:
        if '=' in line and not line.startswith('#'):
            key, value = line.split('=', 1)
            env_dict[key.strip()] = value.strip().strip('"')
    
    if config.discord_token:
        env_dict['DISCORD_BOT_TOKEN'] = config.discord_token
        os.environ['DISCORD_BOT_TOKEN'] = config.discord_token
    
    if config.openai_api_key:
        env_dict['OPENAI_API_KEY'] = config.openai_api_key
        os.environ['OPENAI_API_KEY'] = config.openai_api_key
    
    # Write back
    new_content = '\n'.join([f'{k}="{v}"' for k, v in env_dict.items()])
    env_path.write_text(new_content)
    
    return {"success": True, "message": "Konfiguration gespeichert"}

@api_router.post("/bot/start")
async def start_bot(background_tasks: BackgroundTasks):
    """Start the Discord bot"""
    global bot_process
    
    if bot_process and bot_process.poll() is None:
        return {"success": False, "message": "Bot läuft bereits"}
    
    if not os.environ.get('DISCORD_BOT_TOKEN'):
        raise HTTPException(status_code=400, detail="Discord Token nicht konfiguriert")
    
    # Create logs directory
    log_dir = ROOT_DIR / 'logs'
    log_dir.mkdir(exist_ok=True)
    
    # Open log files
    bot_log = open(log_dir / 'bot.log', 'a')
    bot_err = open(log_dir / 'bot_error.log', 'a')
    
    # Start bot in background with logs
    bot_process = subprocess.Popen(
        [sys.executable, '-u', str(ROOT_DIR / 'discord_bot.py')],
        stdout=bot_log,
        stderr=bot_err,
        cwd=str(ROOT_DIR)
    )
    
    logger.info(f"Bot process started with PID: {bot_process.pid}")
    
    return {"success": True, "message": f"Bot wird gestartet... (PID: {bot_process.pid})"}

@api_router.post("/bot/stop")
async def stop_bot():
    """Stop the Discord bot"""
    global bot_process
    
    if bot_process and bot_process.poll() is None:
        bot_process.terminate()
        bot_process.wait(timeout=5)
        bot_process = None
        return {"success": True, "message": "Bot gestoppt"}
    
    return {"success": False, "message": "Bot läuft nicht"}

@api_router.get("/bot/logs")
async def get_bot_logs(lines: int = 50, log_type: str = "all"):
    """Get bot logs for debugging"""
    log_dir = ROOT_DIR / 'logs'
    result = {"logs": "", "errors": ""}
    
    try:
        if log_type in ["all", "stdout"]:
            bot_log = log_dir / 'bot.log'
            if bot_log.exists():
                with open(bot_log, 'r') as f:
                    all_lines = f.readlines()
                    result["logs"] = "".join(all_lines[-lines:])
        
        if log_type in ["all", "stderr"]:
            bot_err = log_dir / 'bot_error.log'
            if bot_err.exists():
                with open(bot_err, 'r') as f:
                    all_lines = f.readlines()
                    result["errors"] = "".join(all_lines[-lines:])
    except Exception as e:
        result["error"] = str(e)
    
    return result

@api_router.post("/bot/test")
async def test_bot_config():
    """Test if bot can start (checks imports and token)"""
    issues = []
    
    # Check token
    token = os.environ.get('DISCORD_BOT_TOKEN')
    if not token:
        issues.append("DISCORD_BOT_TOKEN nicht gesetzt")
    elif len(token) < 50:
        issues.append("DISCORD_BOT_TOKEN scheint ungültig zu sein (zu kurz)")
    
    # Test imports
    try:
        import discord
        from discord import app_commands
        from discord.ext import commands
    except ImportError as e:
        issues.append(f"discord.py Import-Fehler: {e}")
    
    try:
        from database import get_guild_config
    except ImportError as e:
        issues.append(f"database Import-Fehler: {e}")
    
    try:
        from translations import t
    except ImportError as e:
        issues.append(f"translations Import-Fehler: {e}")
    
    # Check MongoDB
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        mongo_url = os.environ.get('MONGO_URL')
        if not mongo_url:
            issues.append("MONGO_URL nicht gesetzt")
    except Exception as e:
        issues.append(f"MongoDB Fehler: {e}")
    
    if issues:
        return {"success": False, "issues": issues}
    
    return {"success": True, "message": "Alle Checks bestanden!"}

# ==================== GUILD CONFIG ====================

@api_router.get("/guilds")
async def list_guilds():
    """List all configured guilds"""
    guilds = await db.guilds.find({}, {"_id": 0}).to_list(100)
    return {"guilds": guilds}

@api_router.get("/guilds/{guild_id}")
async def get_guild(guild_id: str):
    """Get guild configuration"""
    config = await get_guild_config(guild_id)
    return config

@api_router.put("/guilds/{guild_id}")
async def update_guild(guild_id: str, updates: GuildConfigUpdate):
    """Update guild configuration"""
    update_dict = {k: v for k, v in updates.model_dump().items() if v is not None}
    config = await update_guild_config(guild_id, update_dict)
    return config

@api_router.get("/guilds/{guild_id}/stats")
async def get_guild_stats(guild_id: str):
    """Get guild statistics"""
    users = await db.users.count_documents({"guild_id": guild_id})
    warnings = await db.warnings.count_documents({"guild_id": guild_id})
    commands = await db.custom_commands.count_documents({"guild_id": guild_id})
    news = await db.news.count_documents({"guild_id": guild_id})
    
    # Top users by XP
    top_users = await get_leaderboard(guild_id, 5)
    
    # Recent mod actions
    mod_logs = await get_mod_logs(guild_id, 10)
    
    return {
        "total_users": users,
        "total_warnings": warnings,
        "total_commands": commands,
        "total_news": news,
        "top_users": top_users,
        "recent_mod_actions": mod_logs
    }

# ==================== MODERATION ====================

@api_router.get("/guilds/{guild_id}/warnings")
async def list_warnings(guild_id: str, user_id: Optional[str] = None):
    """List warnings"""
    if user_id:
        warnings = await get_warnings(guild_id, user_id)
    else:
        warnings = await db.warnings.find({"guild_id": guild_id}, {"_id": 0}).to_list(100)
    return {"warnings": warnings}

@api_router.delete("/guilds/{guild_id}/warnings/{user_id}")
async def clear_user_warnings(guild_id: str, user_id: str):
    """Clear warnings for a user"""
    count = await clear_warnings(guild_id, user_id)
    return {"deleted": count}

@api_router.get("/guilds/{guild_id}/modlogs")
async def list_mod_logs(guild_id: str, limit: int = 50):
    """Get moderation logs"""
    logs = await get_mod_logs(guild_id, limit)
    return {"logs": logs}

# ==================== LEVELING ====================

@api_router.get("/guilds/{guild_id}/leaderboard")
async def get_guild_leaderboard(guild_id: str, limit: int = 10):
    """Get XP leaderboard"""
    users = await get_leaderboard(guild_id, limit)
    return {"leaderboard": users}

@api_router.get("/guilds/{guild_id}/users/{user_id}")
async def get_user(guild_id: str, user_id: str):
    """Get user data"""
    user = await get_user_data(guild_id, user_id)
    return user

@api_router.put("/guilds/{guild_id}/users/{user_id}")
async def update_user(guild_id: str, user_id: str, xp: Optional[int] = None, level: Optional[int] = None):
    """Update user XP/level"""
    updates = {}
    if xp is not None:
        updates['xp'] = xp
    if level is not None:
        updates['level'] = level
    
    user = await update_user_data(guild_id, user_id, updates)
    return user

# ==================== CUSTOM COMMANDS ====================

@api_router.get("/guilds/{guild_id}/commands")
async def list_custom_commands(guild_id: str):
    """List custom commands"""
    commands = await get_custom_commands(guild_id)
    return {"commands": commands}

@api_router.post("/guilds/{guild_id}/commands")
async def create_custom_command(guild_id: str, cmd: CustomCommandCreate):
    """Create a custom command"""
    command = await add_custom_command(guild_id, cmd.name, cmd.response, "dashboard")
    return command

@api_router.delete("/guilds/{guild_id}/commands/{name}")
async def remove_custom_command(guild_id: str, name: str):
    """Delete a custom command"""
    deleted = await delete_custom_command(guild_id, name)
    if not deleted:
        raise HTTPException(status_code=404, detail="Command not found")
    return {"deleted": True}

# ==================== NEWS ====================

@api_router.get("/guilds/{guild_id}/news")
async def list_news(guild_id: str):
    """List news"""
    news = await get_news(guild_id)
    return {"news": news}

@api_router.post("/guilds/{guild_id}/news")
async def create_news(guild_id: str, news: NewsCreate):
    """Create news"""
    item = await add_news(guild_id, news.title, news.content, news.scheduled_for)
    return item

@api_router.delete("/guilds/{guild_id}/news/{news_id}")
async def remove_news(guild_id: str, news_id: str):
    """Delete news"""
    deleted = await delete_news(news_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="News not found")
    return {"deleted": True}

# ==================== PERMISSIONS ====================

@api_router.get("/guilds/{guild_id}/permissions")
async def get_permissions(guild_id: str):
    """Get command permissions"""
    config = await get_guild_config(guild_id)
    return {
        "command_permissions": config.get('command_permissions', {}),
        "admin_roles": config.get('admin_roles', []),
        "mod_roles": config.get('mod_roles', [])
    }

@api_router.put("/guilds/{guild_id}/permissions")
async def update_permissions(guild_id: str, update: PermissionUpdate):
    """Update command permissions"""
    config = await get_guild_config(guild_id)
    permissions = config.get('command_permissions', {})
    permissions[update.command] = update.role_ids
    await update_guild_config(guild_id, {"command_permissions": permissions})
    return {"success": True}

# ==================== TEMP CHANNELS API ====================

@api_router.get("/guilds/{guild_id}/temp-channels")
async def list_temp_channels(guild_id: str):
    """List all active temp channels"""
    from database import get_temp_channels
    channels = await get_temp_channels(guild_id)
    return {"channels": channels}

@api_router.delete("/guilds/{guild_id}/temp-channels/{channel_id}")
async def remove_temp_channel(guild_id: str, channel_id: str):
    """Delete a temp channel record"""
    from database import delete_temp_channel
    deleted = await delete_temp_channel(channel_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Channel not found")
    return {"deleted": True}

# ==================== REACTION ROLES API ====================

class ReactionRoleCreate(BaseModel):
    title: str
    description: Optional[str] = None
    channel_id: str
    type: str = "button"
    roles: List[Dict[str, str]]
    color: Optional[str] = "#5865F2"

@api_router.get("/guilds/{guild_id}/reaction-roles")
async def list_reaction_roles(guild_id: str):
    """List all reaction roles"""
    from database import get_reaction_roles
    rrs = await get_reaction_roles(guild_id)
    return {"reaction_roles": rrs}

@api_router.post("/guilds/{guild_id}/reaction-roles")
async def create_reaction_role_api(guild_id: str, rr: ReactionRoleCreate):
    """Create a reaction role setup"""
    from database import create_reaction_role
    import uuid
    
    # For web-created reaction roles, we store the config
    # The actual Discord message will be created by the bot when it connects
    results = []
    for role_config in rr.roles:
        result = await create_reaction_role(
            guild_id=guild_id,
            channel_id=rr.channel_id,
            message_id="pending",  # Will be set when bot creates the message
            emoji=role_config.get("emoji", ""),
            role_id=role_config.get("role_id", ""),
            role_type=rr.type,
            title=rr.title,
            description=rr.description
        )
        results.append(result)
    
    return {"created": len(results), "reaction_roles": results}

@api_router.put("/guilds/{guild_id}/reaction-roles/{rr_id}")
async def update_reaction_role(guild_id: str, rr_id: str, data: dict):
    """Update a reaction role"""
    from database import update_reaction_role
    updated = await update_reaction_role(rr_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Reaction role not found")
    return {"updated": True, **updated}

@api_router.delete("/guilds/{guild_id}/reaction-roles/{rr_id}")
async def remove_reaction_role(guild_id: str, rr_id: str):
    """Delete a reaction role"""
    from database import delete_reaction_role
    deleted = await delete_reaction_role(rr_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Reaction role not found")
    return {"deleted": True}

# ==================== GAMES API ====================

@api_router.get("/guilds/{guild_id}/games")
async def list_active_games(guild_id: str):
    """List all active games"""
    from database import get_active_games
    games = await get_active_games(guild_id)
    return {"games": games}

@api_router.get("/guilds/{guild_id}/games/stats")
async def get_game_stats(guild_id: str):
    """Get game statistics"""
    total_games = await db.games.count_documents({"guild_id": guild_id})
    
    # Get top player
    pipeline = [
        {"$match": {"guild_id": guild_id, "winner_id": {"$ne": None}}},
        {"$group": {"_id": "$winner_id", "wins": {"$sum": 1}}},
        {"$sort": {"wins": -1}},
        {"$limit": 1}
    ]
    top_player_result = await db.games.aggregate(pipeline).to_list(1)
    top_player = top_player_result[0]["_id"][:8] + "..." if top_player_result else None
    
    return {
        "total_games": total_games,
        "top_player": top_player
    }

# ==================== SERVER DATA SYNC API ====================

@api_router.get("/guilds/{guild_id}/server-data")
async def get_server_data_api(guild_id: str):
    """Get cached server data (roles, channels, emojis)"""
    from database import get_server_data
    data = await get_server_data(guild_id)
    return data

@api_router.post("/guilds/{guild_id}/server-data/sync")
async def trigger_server_sync(guild_id: str):
    """Trigger a server data sync (called by bot)"""
    # This endpoint is called by the bot when it syncs
    # The actual sync happens in the bot
    return {"message": "Sync wird vom Bot durchgeführt", "guild_id": guild_id}

# ==================== LEVEL REWARDS API ====================

class LevelRewardCreate(BaseModel):
    level: int
    reward_type: str  # "role" or "emoji"
    reward_value: str
    reward_name: Optional[str] = None

@api_router.get("/guilds/{guild_id}/level-rewards")
async def list_level_rewards(guild_id: str):
    """List all level rewards"""
    from database import get_level_rewards
    rewards = await get_level_rewards(guild_id)
    return {"rewards": rewards}

@api_router.post("/guilds/{guild_id}/level-rewards")
async def create_level_reward_api(guild_id: str, reward: LevelRewardCreate):
    """Create a level reward"""
    from database import create_level_reward
    result = await create_level_reward(
        guild_id=guild_id,
        level=reward.level,
        reward_type=reward.reward_type,
        reward_value=reward.reward_value,
        reward_name=reward.reward_name
    )
    return result

@api_router.delete("/guilds/{guild_id}/level-rewards/{reward_id}")
async def remove_level_reward(guild_id: str, reward_id: str):
    """Delete a level reward"""
    from database import delete_level_reward
    deleted = await delete_level_reward(reward_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Reward not found")
    return {"deleted": True}

@api_router.put("/guilds/{guild_id}/level-rewards/{reward_id}/toggle")
async def toggle_level_reward_api(guild_id: str, reward_id: str, enabled: bool = True):
    """Toggle a level reward"""
    from database import toggle_level_reward
    await toggle_level_reward(reward_id, enabled)
    return {"success": True, "enabled": enabled}

# ==================== VOICE XP API ====================

@api_router.get("/guilds/{guild_id}/voice-sessions")
async def list_voice_sessions(guild_id: str):
    """List active voice sessions"""
    from database import get_active_voice_sessions
    sessions = await get_active_voice_sessions(guild_id)
    return {"sessions": sessions}

@api_router.get("/guilds/{guild_id}/voice-stats")
async def get_voice_stats(guild_id: str):
    """Get voice XP statistics"""
    # Get total voice time from ended sessions
    pipeline = [
        {"$match": {"guild_id": guild_id, "ended_at": {"$ne": None}}},
        {"$group": {"_id": None, "total_sessions": {"$sum": 1}}}
    ]
    result = await db.voice_sessions.aggregate(pipeline).to_list(1)
    total_sessions = result[0]["total_sessions"] if result else 0
    
    # Count active sessions
    active_sessions = await db.voice_sessions.count_documents({"guild_id": guild_id, "ended_at": None})
    
    return {
        "total_sessions": total_sessions,
        "active_sessions": active_sessions
    }

# ==================== TICKET SYSTEM API ====================

class TicketPanelCreate(BaseModel):
    channel_id: str
    title: Optional[str] = "🎫 Support Tickets"
    description: Optional[str] = "Klicke auf den Button um ein Ticket zu erstellen."
    color: Optional[str] = "#5865F2"
    button_label: Optional[str] = "Ticket erstellen"
    button_emoji: Optional[str] = "🎫"
    ticket_category: Optional[str] = None
    ticket_name_template: Optional[str] = "ticket-{number}"
    categories: Optional[List[Dict[str, str]]] = []
    custom_fields: Optional[List[Dict[str, Any]]] = []
    support_roles: Optional[List[str]] = []
    ping_roles: Optional[List[str]] = []
    claim_enabled: Optional[bool] = True
    transcript_enabled: Optional[bool] = True

@api_router.get("/guilds/{guild_id}/ticket-panels")
async def list_ticket_panels(guild_id: str):
    """List all ticket panels"""
    from database import get_ticket_panels
    panels = await get_ticket_panels(guild_id)
    return {"panels": panels}

@api_router.post("/guilds/{guild_id}/ticket-panels")
async def create_ticket_panel_api(guild_id: str, panel: TicketPanelCreate):
    """Create a ticket panel"""
    from database import create_ticket_panel
    result = await create_ticket_panel(guild_id, panel.dict())
    return result

@api_router.get("/guilds/{guild_id}/ticket-panels/{panel_id}")
async def get_ticket_panel_api(guild_id: str, panel_id: str):
    """Get a specific ticket panel"""
    from database import get_ticket_panel
    panel = await get_ticket_panel(panel_id)
    if not panel:
        raise HTTPException(status_code=404, detail="Panel not found")
    return panel

@api_router.put("/guilds/{guild_id}/ticket-panels/{panel_id}")
async def update_ticket_panel_api(guild_id: str, panel_id: str, updates: Dict[str, Any]):
    """Update a ticket panel"""
    from database import update_ticket_panel
    await update_ticket_panel(panel_id, updates)
    return {"success": True}

@api_router.delete("/guilds/{guild_id}/ticket-panels/{panel_id}")
async def delete_ticket_panel_api(guild_id: str, panel_id: str):
    """Delete a ticket panel"""
    from database import delete_ticket_panel
    deleted = await delete_ticket_panel(panel_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Panel not found")
    return {"deleted": True}

@api_router.get("/guilds/{guild_id}/tickets")
async def list_tickets(guild_id: str, status: Optional[str] = None):
    """List tickets"""
    from database import get_tickets
    tickets = await get_tickets(guild_id, status)
    return {"tickets": tickets}

@api_router.get("/guilds/{guild_id}/tickets/stats")
async def get_tickets_stats(guild_id: str):
    """Get ticket statistics"""
    from database import get_ticket_stats
    stats = await get_ticket_stats(guild_id)
    return stats

@api_router.post("/guilds/{guild_id}/tickets/{ticket_id}/claim")
async def claim_ticket_api(guild_id: str, ticket_id: str, user_id: str):
    """Claim a ticket"""
    from database import claim_ticket
    result = await claim_ticket(ticket_id, user_id)
    if not result:
        raise HTTPException(status_code=400, detail="Could not claim ticket")
    return {"success": True}

@api_router.post("/guilds/{guild_id}/tickets/{ticket_id}/close")
async def close_ticket_api(guild_id: str, ticket_id: str, user_id: str):
    """Close a ticket"""
    from database import close_ticket
    result = await close_ticket(ticket_id, user_id)
    if not result:
        raise HTTPException(status_code=400, detail="Could not close ticket")
    return {"success": True}

# ==================== MULTI TEMP VOICE CREATORS API ====================

class TempCreatorCreate(BaseModel):
    channel_id: str
    category_id: Optional[str] = None
    name_template: Optional[str] = "🔊 {user}'s Kanal"
    numbering_type: Optional[str] = "number"  # number, letter, superscript, subscript, roman
    position: Optional[str] = "bottom"  # top, bottom
    default_limit: Optional[int] = 0
    default_bitrate: Optional[int] = 64000
    allow_rename: Optional[bool] = True
    allow_limit: Optional[bool] = True
    allow_lock: Optional[bool] = True
    allow_hide: Optional[bool] = True
    allow_kick: Optional[bool] = True
    allow_permit: Optional[bool] = True
    allow_bitrate: Optional[bool] = True

@api_router.get("/guilds/{guild_id}/temp-creators")
async def list_temp_creators(guild_id: str):
    """List all temp voice creators"""
    from database import get_temp_creators
    creators = await get_temp_creators(guild_id)
    return {"creators": creators}

@api_router.post("/guilds/{guild_id}/temp-creators")
async def create_temp_creator_api(guild_id: str, creator: TempCreatorCreate):
    """Create a temp voice creator"""
    from database import create_temp_creator
    result = await create_temp_creator(guild_id, creator.dict())
    return result

@api_router.get("/guilds/{guild_id}/temp-creators/{creator_id}")
async def get_temp_creator_api(guild_id: str, creator_id: str):
    """Get a specific temp creator"""
    from database import get_temp_creator
    creator = await get_temp_creator(creator_id)
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    return creator

@api_router.put("/guilds/{guild_id}/temp-creators/{creator_id}")
async def update_temp_creator_api(guild_id: str, creator_id: str, updates: Dict[str, Any]):
    """Update a temp creator"""
    from database import update_temp_creator
    await update_temp_creator(creator_id, updates)
    return {"success": True}

@api_router.delete("/guilds/{guild_id}/temp-creators/{creator_id}")
async def delete_temp_creator_api(guild_id: str, creator_id: str):
    """Delete a temp creator"""
    from database import delete_temp_creator
    deleted = await delete_temp_creator(creator_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Creator not found")
    return {"deleted": True}

# Include the router
app.include_router(api_router)

# Root route (for direct backend access)
@app.get("/")
async def root_redirect():
    """Root route - shows API info"""
    return {
        "name": "MultiBot Command Center API",
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs",
        "api": "/api/",
        "message": "Das Dashboard läuft auf Port 3000. API-Endpunkte sind unter /api/ verfügbar."
    }

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

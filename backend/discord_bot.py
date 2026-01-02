import discord
from discord import app_commands
from discord.ext import commands, tasks
import asyncio
import os
import logging
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from pathlib import Path

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from database import (
    get_guild_config, update_guild_config, get_user_data, update_user_data,
    add_warning, get_warnings, clear_warnings, get_leaderboard,
    get_custom_commands, add_mod_log, get_news, mark_news_posted
)
from translations import t

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('discord_bot')

# Bot setup with all intents
intents = discord.Intents.all()
bot = commands.Bot(command_prefix="!", intents=intents)

# Temp channels tracking
temp_channels = {}

# AI Chat integration
async def get_ai_response(message: str, system_prompt: str) -> str:
    """Get AI response using emergent integrations"""
    try:
        api_key = os.environ.get('OPENAI_API_KEY') or os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return "❌ AI ist nicht konfiguriert. Bitte füge einen API Key hinzu."
        
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"discord-{datetime.now().timestamp()}",
            system_message=system_prompt
        )
        chat.with_model("openai", "gpt-4o")
        
        user_message = UserMessage(text=message)
        response = await chat.send_message(user_message)
        return response
    except Exception as e:
        logger.error(f"AI Error: {e}")
        return f"❌ AI Fehler: {str(e)}"

# Calculate level from XP
def calculate_level(xp: int) -> int:
    """Calculate level from XP (100 XP per level, increasing)"""
    level = 0
    required = 100
    total = 0
    while total + required <= xp:
        total += required
        level += 1
        required = int(100 * (1.1 ** level))
    return level

def xp_for_level(level: int) -> int:
    """Calculate total XP needed for a level"""
    total = 0
    for i in range(level):
        total += int(100 * (1.1 ** i))
    return total

@bot.event
async def on_ready():
    logger.info(f'{bot.user} ist online!')
    try:
        synced = await bot.tree.sync()
        logger.info(f'Synced {len(synced)} slash commands')
    except Exception as e:
        logger.error(f'Error syncing commands: {e}')
    
    # Start scheduled tasks
    check_scheduled_news.start()

@bot.event
async def on_guild_join(guild):
    """Initialize config when bot joins a guild"""
    await get_guild_config(str(guild.id))
    logger.info(f'Joined guild: {guild.name}')

@bot.event
async def on_member_join(member):
    """Welcome message and auto-roles"""
    config = await get_guild_config(str(member.guild.id))
    lang = config.get('language', 'de')
    
    # Auto roles
    if config.get('auto_roles'):
        for role_id in config['auto_roles']:
            role = member.guild.get_role(int(role_id))
            if role:
                try:
                    await member.add_roles(role)
                except:
                    pass
    
    # Welcome message
    if config.get('welcome_enabled') and config.get('welcome_channel'):
        channel = member.guild.get_channel(int(config['welcome_channel']))
        if channel:
            message = config.get('welcome_message') or t(lang, 'welcome_default', user=member.mention)
            message = message.replace('{user}', member.mention).replace('{server}', member.guild.name)
            await channel.send(message)

@bot.event
async def on_member_remove(member):
    """Goodbye message"""
    config = await get_guild_config(str(member.guild.id))
    lang = config.get('language', 'de')
    
    if config.get('goodbye_enabled') and config.get('welcome_channel'):
        channel = member.guild.get_channel(int(config['welcome_channel']))
        if channel:
            message = config.get('goodbye_message') or t(lang, 'goodbye_default', user=member.name)
            message = message.replace('{user}', member.name).replace('{server}', member.guild.name)
            await channel.send(message)

@bot.event
async def on_message(message):
    """Handle XP, custom commands, and AI"""
    if message.author.bot:
        return
    
    guild_id = str(message.guild.id) if message.guild else None
    if not guild_id:
        return
    
    config = await get_guild_config(guild_id)
    lang = config.get('language', 'de')
    
    # Check for custom commands
    if message.content.startswith(config.get('prefix', '!')):
        cmd_name = message.content[1:].split()[0].lower()
        commands_list = await get_custom_commands(guild_id)
        for cmd in commands_list:
            if cmd['name'] == cmd_name:
                await message.channel.send(cmd['response'])
                return
    
    # AI Channel
    if config.get('ai_enabled') and config.get('ai_channel'):
        if str(message.channel.id) == config['ai_channel']:
            async with message.channel.typing():
                response = await get_ai_response(
                    message.content,
                    config.get('ai_system_prompt', 'Du bist ein freundlicher Discord-Bot.')
                )
                await message.reply(response)
            return
    
    # XP System
    if config.get('leveling_enabled'):
        if str(message.channel.id) in config.get('ignored_channels', []):
            return
        
        user_data = await get_user_data(guild_id, str(message.author.id))
        now = datetime.now(timezone.utc)
        
        # Check cooldown
        last_xp = user_data.get('last_xp')
        if last_xp:
            last_xp_time = datetime.fromisoformat(last_xp)
            cooldown = config.get('xp_cooldown', 60)
            if (now - last_xp_time).total_seconds() < cooldown:
                return
        
        # Add XP
        xp_gain = config.get('xp_per_message', 15)
        new_xp = user_data['xp'] + xp_gain
        old_level = user_data['level']
        new_level = calculate_level(new_xp)
        
        await update_user_data(guild_id, str(message.author.id), {
            'xp': new_xp,
            'level': new_level,
            'messages': user_data['messages'] + 1,
            'last_xp': now.isoformat()
        })
        
        # Level up
        if new_level > old_level:
            # Check for level roles
            level_roles = config.get('level_roles', {})
            if str(new_level) in level_roles:
                role = message.guild.get_role(int(level_roles[str(new_level)]))
                if role:
                    try:
                        await message.author.add_roles(role)
                    except:
                        pass
            
            # Send level up message
            level_channel = message.channel
            if config.get('level_up_channel'):
                level_channel = message.guild.get_channel(int(config['level_up_channel'])) or message.channel
            
            await level_channel.send(t(lang, 'level_up', user=message.author.mention, level=new_level))
    
    await bot.process_commands(message)

@bot.event
async def on_voice_state_update(member, before, after):
    """Temp channel management"""
    if member.bot:
        return
    
    guild_id = str(member.guild.id)
    config = await get_guild_config(guild_id)
    
    if not config.get('temp_channels_enabled'):
        return
    
    # User joined temp channel creator
    if after.channel and str(after.channel.id) == config.get('temp_channel_creator'):
        category = member.guild.get_channel(int(config['temp_channel_category'])) if config.get('temp_channel_category') else after.channel.category
        
        # Create temp channel
        channel = await member.guild.create_voice_channel(
            name=f"🔊 {member.display_name}",
            category=category,
            user_limit=10
        )
        
        # Set permissions - owner can manage
        await channel.set_permissions(member, manage_channels=True, move_members=True)
        
        # Move user
        await member.move_to(channel)
        
        # Track channel
        temp_channels[channel.id] = {
            'owner': member.id,
            'guild': member.guild.id
        }
    
    # User left a temp channel
    if before.channel and before.channel.id in temp_channels:
        if len(before.channel.members) == 0:
            try:
                await before.channel.delete()
                del temp_channels[before.channel.id]
            except:
                pass

# ==================== SLASH COMMANDS ====================

# Moderation Commands
@bot.tree.command(name="warn", description="Verwarnt einen Benutzer")
@app_commands.describe(user="Der zu verwarnende Benutzer", reason="Grund der Verwarnung")
async def warn(interaction: discord.Interaction, user: discord.Member, reason: str = "Kein Grund angegeben"):
    config = await get_guild_config(str(interaction.guild.id))
    lang = config.get('language', 'de')
    
    if not interaction.user.guild_permissions.kick_members:
        await interaction.response.send_message(t(lang, 'no_permission'), ephemeral=True)
        return
    
    await add_warning(str(interaction.guild.id), str(user.id), str(interaction.user.id), reason)
    await add_mod_log(str(interaction.guild.id), 'warn', str(interaction.user.id), str(user.id), reason)
    
    # DM user
    try:
        await user.send(t(lang, 'warn_dm', server=interaction.guild.name, reason=reason))
    except:
        pass
    
    # Check warn threshold
    warnings = await get_warnings(str(interaction.guild.id), str(user.id))
    threshold = config.get('warn_threshold', 3)
    
    if len(warnings) >= threshold:
        action = config.get('warn_action', 'mute')
        if action == 'kick':
            await user.kick(reason=f"Erreichte {threshold} Verwarnungen")
        elif action == 'ban':
            await user.ban(reason=f"Erreichte {threshold} Verwarnungen")
    
    await interaction.response.send_message(
        f"⚠️ {user.mention} wurde verwarnt. Grund: {reason}\nVerwarnungen: {len(warnings)}",
        ephemeral=False
    )

@bot.tree.command(name="warnings", description="Zeigt Verwarnungen eines Benutzers")
@app_commands.describe(user="Der Benutzer")
async def warnings(interaction: discord.Interaction, user: discord.Member):
    warns = await get_warnings(str(interaction.guild.id), str(user.id))
    
    if not warns:
        await interaction.response.send_message(f"{user.mention} hat keine Verwarnungen.", ephemeral=True)
        return
    
    embed = discord.Embed(title=f"Verwarnungen für {user.display_name}", color=discord.Color.orange())
    for i, w in enumerate(warns, 1):
        embed.add_field(
            name=f"Verwarnung #{i}",
            value=f"Grund: {w['reason']}\nZeit: {w['timestamp'][:10]}",
            inline=False
        )
    
    await interaction.response.send_message(embed=embed)

@bot.tree.command(name="clearwarnings", description="Löscht alle Verwarnungen eines Benutzers")
@app_commands.describe(user="Der Benutzer")
async def clearwarnings(interaction: discord.Interaction, user: discord.Member):
    config = await get_guild_config(str(interaction.guild.id))
    
    if not interaction.user.guild_permissions.kick_members:
        await interaction.response.send_message(t(config.get('language', 'de'), 'no_permission'), ephemeral=True)
        return
    
    count = await clear_warnings(str(interaction.guild.id), str(user.id))
    await interaction.response.send_message(f"✅ {count} Verwarnungen von {user.mention} gelöscht.")

@bot.tree.command(name="kick", description="Kickt einen Benutzer")
@app_commands.describe(user="Der zu kickende Benutzer", reason="Grund")
async def kick(interaction: discord.Interaction, user: discord.Member, reason: str = "Kein Grund angegeben"):
    config = await get_guild_config(str(interaction.guild.id))
    lang = config.get('language', 'de')
    
    if not interaction.user.guild_permissions.kick_members:
        await interaction.response.send_message(t(lang, 'no_permission'), ephemeral=True)
        return
    
    try:
        await user.send(t(lang, 'kick_dm', server=interaction.guild.name, reason=reason))
    except:
        pass
    
    await user.kick(reason=reason)
    await add_mod_log(str(interaction.guild.id), 'kick', str(interaction.user.id), str(user.id), reason)
    await interaction.response.send_message(f"👢 {user.mention} wurde gekickt. Grund: {reason}")

@bot.tree.command(name="ban", description="Bannt einen Benutzer")
@app_commands.describe(user="Der zu bannende Benutzer", reason="Grund")
async def ban(interaction: discord.Interaction, user: discord.Member, reason: str = "Kein Grund angegeben"):
    config = await get_guild_config(str(interaction.guild.id))
    lang = config.get('language', 'de')
    
    if not interaction.user.guild_permissions.ban_members:
        await interaction.response.send_message(t(lang, 'no_permission'), ephemeral=True)
        return
    
    try:
        await user.send(t(lang, 'ban_dm', server=interaction.guild.name, reason=reason))
    except:
        pass
    
    await user.ban(reason=reason)
    await add_mod_log(str(interaction.guild.id), 'ban', str(interaction.user.id), str(user.id), reason)
    await interaction.response.send_message(f"🔨 {user.mention} wurde gebannt. Grund: {reason}")

@bot.tree.command(name="mute", description="Stummschaltet einen Benutzer")
@app_commands.describe(user="Der Benutzer", duration="Dauer in Minuten", reason="Grund")
async def mute(interaction: discord.Interaction, user: discord.Member, duration: int = 10, reason: str = "Kein Grund angegeben"):
    config = await get_guild_config(str(interaction.guild.id))
    lang = config.get('language', 'de')
    
    if not interaction.user.guild_permissions.moderate_members:
        await interaction.response.send_message(t(lang, 'no_permission'), ephemeral=True)
        return
    
    until = datetime.now(timezone.utc) + timedelta(minutes=duration)
    await user.timeout(until, reason=reason)
    
    try:
        await user.send(t(lang, 'mute_dm', server=interaction.guild.name, duration=f"{duration} Minuten", reason=reason))
    except:
        pass
    
    await add_mod_log(str(interaction.guild.id), 'mute', str(interaction.user.id), str(user.id), f"{reason} ({duration}min)")
    await interaction.response.send_message(f"🔇 {user.mention} wurde für {duration} Minuten stummgeschaltet. Grund: {reason}")

@bot.tree.command(name="unmute", description="Hebt Stummschaltung auf")
@app_commands.describe(user="Der Benutzer")
async def unmute(interaction: discord.Interaction, user: discord.Member):
    config = await get_guild_config(str(interaction.guild.id))
    
    if not interaction.user.guild_permissions.moderate_members:
        await interaction.response.send_message(t(config.get('language', 'de'), 'no_permission'), ephemeral=True)
        return
    
    await user.timeout(None)
    await interaction.response.send_message(f"🔊 {user.mention} wurde entstummt.")

# Leveling Commands
@bot.tree.command(name="rank", description="Zeigt deinen Rang und XP")
@app_commands.describe(user="Benutzer (optional)")
async def rank(interaction: discord.Interaction, user: discord.Member = None):
    target = user or interaction.user
    user_data = await get_user_data(str(interaction.guild.id), str(target.id))
    
    level = user_data['level']
    xp = user_data['xp']
    next_level_xp = xp_for_level(level + 1)
    current_level_xp = xp_for_level(level)
    progress = xp - current_level_xp
    needed = next_level_xp - current_level_xp
    
    embed = discord.Embed(title=f"Rang von {target.display_name}", color=discord.Color.blue())
    embed.add_field(name="Level", value=str(level), inline=True)
    embed.add_field(name="XP", value=f"{xp:,}", inline=True)
    embed.add_field(name="Nachrichten", value=f"{user_data['messages']:,}", inline=True)
    embed.add_field(name="Fortschritt", value=f"{progress}/{needed} XP", inline=False)
    embed.set_thumbnail(url=target.display_avatar.url)
    
    await interaction.response.send_message(embed=embed)

@bot.tree.command(name="leaderboard", description="Zeigt die XP Rangliste")
async def leaderboard(interaction: discord.Interaction):
    config = await get_guild_config(str(interaction.guild.id))
    users = await get_leaderboard(str(interaction.guild.id), 10)
    
    embed = discord.Embed(
        title=t(config.get('language', 'de'), 'leaderboard_title'),
        color=discord.Color.gold()
    )
    
    for i, u in enumerate(users, 1):
        member = interaction.guild.get_member(int(u['user_id']))
        name = member.display_name if member else f"User {u['user_id'][:8]}"
        medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else f"#{i}"
        embed.add_field(
            name=f"{medal} {name}",
            value=f"Level {u['level']} | {u['xp']:,} XP",
            inline=False
        )
    
    await interaction.response.send_message(embed=embed)

# Info Commands
@bot.tree.command(name="serverinfo", description="Zeigt Server-Informationen")
async def serverinfo(interaction: discord.Interaction):
    guild = interaction.guild
    
    embed = discord.Embed(title=guild.name, color=discord.Color.blurple())
    embed.set_thumbnail(url=guild.icon.url if guild.icon else None)
    embed.add_field(name="Owner", value=guild.owner.mention, inline=True)
    embed.add_field(name="Mitglieder", value=guild.member_count, inline=True)
    embed.add_field(name="Kanäle", value=len(guild.channels), inline=True)
    embed.add_field(name="Rollen", value=len(guild.roles), inline=True)
    embed.add_field(name="Erstellt am", value=guild.created_at.strftime("%d.%m.%Y"), inline=True)
    embed.add_field(name="Boosts", value=guild.premium_subscription_count, inline=True)
    
    await interaction.response.send_message(embed=embed)

@bot.tree.command(name="userinfo", description="Zeigt Benutzer-Informationen")
@app_commands.describe(user="Benutzer")
async def userinfo(interaction: discord.Interaction, user: discord.Member = None):
    target = user or interaction.user
    
    embed = discord.Embed(title=target.display_name, color=target.color)
    embed.set_thumbnail(url=target.display_avatar.url)
    embed.add_field(name="ID", value=target.id, inline=True)
    embed.add_field(name="Beigetreten", value=target.joined_at.strftime("%d.%m.%Y"), inline=True)
    embed.add_field(name="Account erstellt", value=target.created_at.strftime("%d.%m.%Y"), inline=True)
    embed.add_field(name="Rollen", value=len(target.roles) - 1, inline=True)
    embed.add_field(name="Top Rolle", value=target.top_role.mention, inline=True)
    
    await interaction.response.send_message(embed=embed)

# Scheduled news task
@tasks.loop(minutes=1)
async def check_scheduled_news():
    """Check and post scheduled news"""
    try:
        # Get all guilds the bot is in
        for guild in bot.guilds:
            config = await get_guild_config(str(guild.id))
            if not config.get('news_channel'):
                continue
            
            news_list = await get_news(str(guild.id))
            now = datetime.now(timezone.utc)
            
            for news in news_list:
                if news.get('posted'):
                    continue
                
                scheduled = news.get('scheduled_for')
                if scheduled:
                    scheduled_time = datetime.fromisoformat(scheduled.replace('Z', '+00:00'))
                    if scheduled_time <= now:
                        channel = guild.get_channel(int(config['news_channel']))
                        if channel:
                            embed = discord.Embed(
                                title=f"📢 {news['title']}",
                                description=news['content'],
                                color=discord.Color.blue(),
                                timestamp=now
                            )
                            await channel.send(embed=embed)
                            await mark_news_posted(news['id'])
    except Exception as e:
        logger.error(f"News check error: {e}")

def run_bot():
    """Run the Discord bot"""
    token = os.environ.get('DISCORD_BOT_TOKEN')
    if not token:
        logger.error("DISCORD_BOT_TOKEN not set!")
        return
    
    bot.run(token)

if __name__ == "__main__":
    run_bot()

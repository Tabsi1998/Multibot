import discord
from discord import app_commands, ui
from discord.ext import commands, tasks
import asyncio
import os
import logging
import random
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from pathlib import Path

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from database import (
    get_guild_config, update_guild_config, get_user_data, update_user_data,
    add_warning, get_warnings, clear_warnings, get_leaderboard,
    get_custom_commands, add_mod_log, get_news, mark_news_posted,
    create_temp_channel, get_temp_channel, get_temp_channels, update_temp_channel, delete_temp_channel,
    get_reaction_roles, get_reaction_role_by_message, create_reaction_role, delete_reaction_role,
    create_game, get_game, update_game, get_active_games,
    get_level_rewards, get_server_data
)
from translations import t

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('discord_bot')

# Bot setup with all intents
intents = discord.Intents.all()
bot = commands.Bot(command_prefix="!", intents=intents)

# ==================== AI INTEGRATION (DISABLED) ====================
# AI features temporarily disabled - can be enabled later

async def get_ai_response(message: str, system_prompt: str) -> str:
    """AI response - currently disabled"""
    return "❌ AI-Feature ist derzeit deaktiviert. Wird später hinzugefügt!"

# ==================== HELPER FUNCTIONS ====================

def calculate_level(xp: int) -> int:
    level = 0
    required = 100
    total = 0
    while total + required <= xp:
        total += required
        level += 1
        required = int(100 * (1.1 ** level))
    return level

def xp_for_level(level: int) -> int:
    total = 0
    for i in range(level):
        total += int(100 * (1.1 ** i))
    return total

# ==================== TEMP VOICE CHANNEL VIEWS ====================

class TempChannelControlView(ui.View):
    """Control panel for temp voice channels"""
    def __init__(self, channel_id: str, owner_id: int):
        super().__init__(timeout=None)
        self.channel_id = channel_id
        self.owner_id = owner_id
    
    async def check_owner(self, interaction: discord.Interaction) -> bool:
        if interaction.user.id != self.owner_id:
            await interaction.response.send_message("❌ Nur der Kanal-Besitzer kann das!", ephemeral=True)
            return False
        return True
    
    @ui.button(label="🔒 Sperren", style=discord.ButtonStyle.secondary, custom_id="temp_lock")
    async def lock_channel(self, interaction: discord.Interaction, button: ui.Button):
        if not await self.check_owner(interaction):
            return
        
        channel = interaction.guild.get_channel(int(self.channel_id))
        if channel:
            await channel.set_permissions(interaction.guild.default_role, connect=False)
            await update_temp_channel(self.channel_id, {"locked": True})
            await interaction.response.send_message("🔒 Kanal gesperrt!", ephemeral=True)
    
    @ui.button(label="🔓 Entsperren", style=discord.ButtonStyle.secondary, custom_id="temp_unlock")
    async def unlock_channel(self, interaction: discord.Interaction, button: ui.Button):
        if not await self.check_owner(interaction):
            return
        
        channel = interaction.guild.get_channel(int(self.channel_id))
        if channel:
            await channel.set_permissions(interaction.guild.default_role, connect=True)
            await update_temp_channel(self.channel_id, {"locked": False})
            await interaction.response.send_message("🔓 Kanal entsperrt!", ephemeral=True)
    
    @ui.button(label="👁️ Verstecken", style=discord.ButtonStyle.secondary, custom_id="temp_hide")
    async def hide_channel(self, interaction: discord.Interaction, button: ui.Button):
        if not await self.check_owner(interaction):
            return
        
        channel = interaction.guild.get_channel(int(self.channel_id))
        if channel:
            await channel.set_permissions(interaction.guild.default_role, view_channel=False)
            await update_temp_channel(self.channel_id, {"hidden": True})
            await interaction.response.send_message("👁️ Kanal versteckt!", ephemeral=True)
    
    @ui.button(label="👁️ Zeigen", style=discord.ButtonStyle.secondary, custom_id="temp_show")
    async def show_channel(self, interaction: discord.Interaction, button: ui.Button):
        if not await self.check_owner(interaction):
            return
        
        channel = interaction.guild.get_channel(int(self.channel_id))
        if channel:
            await channel.set_permissions(interaction.guild.default_role, view_channel=True)
            await update_temp_channel(self.channel_id, {"hidden": False})
            await interaction.response.send_message("👁️ Kanal sichtbar!", ephemeral=True)
    
    @ui.button(label="✏️ Umbenennen", style=discord.ButtonStyle.primary, custom_id="temp_rename")
    async def rename_channel(self, interaction: discord.Interaction, button: ui.Button):
        if not await self.check_owner(interaction):
            return
        
        modal = TempChannelRenameModal(self.channel_id)
        await interaction.response.send_modal(modal)
    
    @ui.button(label="👥 Limit", style=discord.ButtonStyle.primary, custom_id="temp_limit")
    async def set_limit(self, interaction: discord.Interaction, button: ui.Button):
        if not await self.check_owner(interaction):
            return
        
        modal = TempChannelLimitModal(self.channel_id)
        await interaction.response.send_modal(modal)

class TempChannelRenameModal(ui.Modal, title="Kanal umbenennen"):
    name = ui.TextInput(label="Neuer Name", placeholder="Mein cooler Kanal", max_length=100)
    
    def __init__(self, channel_id: str):
        super().__init__()
        self.channel_id = channel_id
    
    async def on_submit(self, interaction: discord.Interaction):
        channel = interaction.guild.get_channel(int(self.channel_id))
        if channel:
            await channel.edit(name=self.name.value)
            await update_temp_channel(self.channel_id, {"name": self.name.value})
            await interaction.response.send_message(f"✅ Kanal umbenannt zu: {self.name.value}", ephemeral=True)

class TempChannelLimitModal(ui.Modal, title="Benutzerlimit setzen"):
    limit = ui.TextInput(label="Limit (0 = unbegrenzt)", placeholder="0", max_length=3)
    
    def __init__(self, channel_id: str):
        super().__init__()
        self.channel_id = channel_id
    
    async def on_submit(self, interaction: discord.Interaction):
        try:
            limit = int(self.limit.value)
            if limit < 0 or limit > 99:
                raise ValueError()
            
            channel = interaction.guild.get_channel(int(self.channel_id))
            if channel:
                await channel.edit(user_limit=limit)
                await update_temp_channel(self.channel_id, {"user_limit": limit})
                await interaction.response.send_message(f"✅ Limit gesetzt: {limit if limit > 0 else 'unbegrenzt'}", ephemeral=True)
        except:
            await interaction.response.send_message("❌ Bitte gib eine Zahl zwischen 0 und 99 ein!", ephemeral=True)

# ==================== REACTION ROLE VIEWS ====================

class ReactionRoleView(ui.View):
    """View for button-based reaction roles"""
    def __init__(self):
        super().__init__(timeout=None)

class RoleButton(ui.Button):
    def __init__(self, role_id: int, emoji: str, label: str = None):
        super().__init__(
            style=discord.ButtonStyle.secondary,
            emoji=emoji,
            label=label,
            custom_id=f"role_{role_id}"
        )
        self.role_id = role_id
    
    async def callback(self, interaction: discord.Interaction):
        role = interaction.guild.get_role(self.role_id)
        if not role:
            await interaction.response.send_message("❌ Rolle nicht gefunden!", ephemeral=True)
            return
        
        if role in interaction.user.roles:
            await interaction.user.remove_roles(role)
            await interaction.response.send_message(f"➖ Rolle **{role.name}** entfernt!", ephemeral=True)
        else:
            await interaction.user.add_roles(role)
            await interaction.response.send_message(f"➕ Rolle **{role.name}** hinzugefügt!", ephemeral=True)

# ==================== GAME VIEWS ====================

class TicTacToeButton(ui.Button):
    def __init__(self, x: int, y: int):
        super().__init__(style=discord.ButtonStyle.secondary, label="\u200b", row=y)
        self.x = x
        self.y = y
    
    async def callback(self, interaction: discord.Interaction):
        view: TicTacToeView = self.view
        
        if view.current_player != interaction.user:
            await interaction.response.send_message("❌ Du bist nicht dran!", ephemeral=True)
            return
        
        if view.board[self.y][self.x] is not None:
            await interaction.response.send_message("❌ Feld bereits belegt!", ephemeral=True)
            return
        
        # Make move
        view.board[self.y][self.x] = view.current_player
        self.style = discord.ButtonStyle.danger if view.current_player == view.player1 else discord.ButtonStyle.success
        self.label = "X" if view.current_player == view.player1 else "O"
        self.disabled = True
        
        # Check winner
        winner = view.check_winner()
        if winner:
            view.disable_all()
            await update_game(view.game_id, {"status": "finished", "winner_id": str(winner.id)})
            await interaction.response.edit_message(
                content=f"🎉 **{winner.display_name}** hat gewonnen!",
                view=view
            )
            return
        
        if view.is_draw():
            view.disable_all()
            await update_game(view.game_id, {"status": "finished"})
            await interaction.response.edit_message(
                content="🤝 **Unentschieden!**",
                view=view
            )
            return
        
        # Switch player
        view.current_player = view.player2 if view.current_player == view.player1 else view.player1
        await interaction.response.edit_message(
            content=f"🎮 **TicTacToe**\n{view.player1.mention} (X) vs {view.player2.mention} (O)\n\n➡️ {view.current_player.mention} ist dran!",
            view=view
        )

class TicTacToeView(ui.View):
    def __init__(self, player1: discord.Member, player2: discord.Member, game_id: str):
        super().__init__(timeout=300)
        self.player1 = player1
        self.player2 = player2
        self.current_player = player1
        self.game_id = game_id
        self.board = [[None for _ in range(3)] for _ in range(3)]
        
        for y in range(3):
            for x in range(3):
                self.add_item(TicTacToeButton(x, y))
    
    def check_winner(self):
        # Rows
        for row in self.board:
            if row[0] and row[0] == row[1] == row[2]:
                return row[0]
        
        # Columns
        for col in range(3):
            if self.board[0][col] and self.board[0][col] == self.board[1][col] == self.board[2][col]:
                return self.board[0][col]
        
        # Diagonals
        if self.board[0][0] and self.board[0][0] == self.board[1][1] == self.board[2][2]:
            return self.board[0][0]
        if self.board[0][2] and self.board[0][2] == self.board[1][1] == self.board[2][0]:
            return self.board[0][2]
        
        return None
    
    def is_draw(self):
        return all(cell is not None for row in self.board for cell in row)
    
    def disable_all(self):
        for item in self.children:
            item.disabled = True

# Stadt Land Fluss
class StadtLandFlussView(ui.View):
    def __init__(self, game_id: str, players: list, categories: list, letter: str):
        super().__init__(timeout=120)
        self.game_id = game_id
        self.players = players
        self.categories = categories
        self.letter = letter
        self.answers = {}
        self.stopped = False
    
    @ui.button(label="📝 Antworten eingeben", style=discord.ButtonStyle.primary)
    async def submit_answers(self, interaction: discord.Interaction, button: ui.Button):
        if interaction.user.id not in [p.id for p in self.players]:
            await interaction.response.send_message("❌ Du spielst nicht mit!", ephemeral=True)
            return
        
        if str(interaction.user.id) in self.answers:
            await interaction.response.send_message("❌ Du hast bereits Antworten eingegeben!", ephemeral=True)
            return
        
        modal = StadtLandFlussModal(self.game_id, self.categories, self.letter, interaction.user.id)
        await interaction.response.send_modal(modal)
    
    @ui.button(label="🛑 STOPP!", style=discord.ButtonStyle.danger)
    async def stop_game(self, interaction: discord.Interaction, button: ui.Button):
        if interaction.user.id not in [p.id for p in self.players]:
            await interaction.response.send_message("❌ Du spielst nicht mit!", ephemeral=True)
            return
        
        self.stopped = True
        self.disable_all()
        await interaction.response.edit_message(
            content=f"🛑 **{interaction.user.display_name}** hat STOPP gerufen!\n\nZeit zum Auswerten...",
            view=self
        )
    
    def disable_all(self):
        for item in self.children:
            item.disabled = True

class StadtLandFlussModal(ui.Modal):
    def __init__(self, game_id: str, categories: list, letter: str, user_id: int):
        super().__init__(title=f"Stadt Land Fluss - Buchstabe: {letter}")
        self.game_id = game_id
        self.user_id = user_id
        
        for i, cat in enumerate(categories[:5]):  # Max 5 categories for modal
            self.add_item(ui.TextInput(
                label=cat,
                placeholder=f"{cat} mit {letter}...",
                required=False,
                max_length=50
            ))
    
    async def on_submit(self, interaction: discord.Interaction):
        answers = {child.label: child.value for child in self.children if child.value}
        
        # Update game state
        game = await get_game(self.game_id)
        if game:
            state = game.get("state", {})
            player_answers = state.get("answers", {})
            player_answers[str(self.user_id)] = answers
            state["answers"] = player_answers
            await update_game(self.game_id, {"state": state})
        
        await interaction.response.send_message(f"✅ Antworten gespeichert!", ephemeral=True)

# ==================== TICKET SYSTEM VIEWS ====================

class TicketCreateView(ui.View):
    """View for creating tickets from panel"""
    def __init__(self, panel_id: str):
        super().__init__(timeout=None)
        self.panel_id = panel_id
    
    @ui.button(label="Ticket erstellen", style=discord.ButtonStyle.primary, emoji="🎫", custom_id="ticket_create")
    async def create_ticket(self, interaction: discord.Interaction, button: ui.Button):
        from database import get_ticket_panel, create_ticket, increment_ticket_counter, get_ticket_by_channel
        
        panel = await get_ticket_panel(self.panel_id)
        if not panel:
            await interaction.response.send_message("❌ Ticket-Panel nicht gefunden!", ephemeral=True)
            return
        
        # Check if user already has an open ticket
        existing_tickets = await db.tickets.find({
            "guild_id": str(interaction.guild.id),
            "user_id": str(interaction.user.id),
            "status": {"$in": ["open", "claimed"]}
        }).to_list(100)
        
        if len(existing_tickets) >= 3:
            await interaction.response.send_message("❌ Du hast bereits zu viele offene Tickets!", ephemeral=True)
            return
        
        # If panel has categories, show category select first
        if panel.get('categories') and len(panel['categories']) > 0:
            view = TicketCategorySelectView(self.panel_id, panel['categories'])
            await interaction.response.send_message(
                "📋 **Wähle eine Kategorie für dein Ticket:**",
                view=view,
                ephemeral=True
            )
            return
        
        # Create ticket directly
        await self.do_create_ticket(interaction, panel, None)
    
    async def do_create_ticket(self, interaction: discord.Interaction, panel: dict, category: str):
        from database import create_ticket, increment_ticket_counter
        
        # Get ticket number
        ticket_number = await increment_ticket_counter(panel['id'])
        
        # Create channel name
        name_template = panel.get('ticket_name_template', 'ticket-{number}')
        channel_name = name_template.replace('{number}', str(ticket_number))
        channel_name = channel_name.replace('{user}', interaction.user.name[:20])
        
        # Get category
        ticket_category = None
        if panel.get('ticket_category'):
            ticket_category = interaction.guild.get_channel(int(panel['ticket_category']))
        
        # Create overwrites
        overwrites = {
            interaction.guild.default_role: discord.PermissionOverwrite(view_channel=False),
            interaction.user: discord.PermissionOverwrite(
                view_channel=True, 
                send_messages=True, 
                read_message_history=True,
                attach_files=True,
                embed_links=True
            ),
            interaction.guild.me: discord.PermissionOverwrite(
                view_channel=True,
                send_messages=True,
                manage_channels=True,
                manage_messages=True
            )
        }
        
        # Add support roles
        for role_id in panel.get('support_roles', []):
            role = interaction.guild.get_role(int(role_id))
            if role:
                overwrites[role] = discord.PermissionOverwrite(
                    view_channel=True,
                    send_messages=True,
                    read_message_history=True,
                    manage_messages=True
                )
        
        try:
            channel = await interaction.guild.create_text_channel(
                name=channel_name,
                category=ticket_category,
                overwrites=overwrites,
                topic=f"Ticket von {interaction.user.name} | ID: {interaction.user.id}"
            )
            
            # Save ticket to database
            ticket_data = {
                "channel_id": str(channel.id),
                "user_id": str(interaction.user.id),
                "ticket_number": ticket_number,
                "category": category
            }
            await create_ticket(str(interaction.guild.id), panel['id'], ticket_data)
            
            # Create embed
            embed_color = int(panel.get('color', '#5865F2').replace('#', ''), 16)
            embed = discord.Embed(
                title=f"🎫 Ticket #{ticket_number}",
                description=f"Willkommen {interaction.user.mention}!\n\nEin Support-Mitarbeiter wird sich bald um dich kümmern.",
                color=embed_color
            )
            if category:
                embed.add_field(name="Kategorie", value=category, inline=True)
            embed.add_field(name="Erstellt von", value=interaction.user.mention, inline=True)
            embed.set_footer(text=f"Ticket ID: {ticket_number}")
            
            # Create control view
            view = TicketControlView(str(channel.id), panel['id'], panel.get('claim_enabled', True))
            
            # Send initial message
            content = ""
            # Ping roles
            for role_id in panel.get('ping_roles', []):
                role = interaction.guild.get_role(int(role_id))
                if role:
                    content += f"{role.mention} "
            
            await channel.send(content=content if content else None, embed=embed, view=view)
            
            await interaction.response.send_message(
                f"✅ Ticket erstellt! → {channel.mention}",
                ephemeral=True
            )
            
            logger.info(f'Created ticket #{ticket_number} for {interaction.user.name}')
            
        except Exception as e:
            logger.error(f'Error creating ticket: {e}')
            await interaction.response.send_message(f"❌ Fehler beim Erstellen des Tickets: {e}", ephemeral=True)


class TicketCategorySelectView(ui.View):
    """View for selecting ticket category"""
    def __init__(self, panel_id: str, categories: list):
        super().__init__(timeout=60)
        self.panel_id = panel_id
        
        options = []
        for cat in categories[:25]:  # Max 25 options
            options.append(discord.SelectOption(
                label=cat.get('name', 'Kategorie'),
                emoji=cat.get('emoji') if cat.get('emoji') else None,
                description=cat.get('description', '')[:100] if cat.get('description') else None,
                value=cat.get('name', 'Kategorie')
            ))
        
        self.add_item(TicketCategorySelect(panel_id, options))


class TicketCategorySelect(ui.Select):
    def __init__(self, panel_id: str, options: list):
        super().__init__(
            placeholder="Kategorie auswählen...",
            options=options,
            custom_id="ticket_category_select"
        )
        self.panel_id = panel_id
    
    async def callback(self, interaction: discord.Interaction):
        from database import get_ticket_panel
        
        selected_category = self.values[0]
        panel = await get_ticket_panel(self.panel_id)
        
        if panel:
            view = TicketCreateView(self.panel_id)
            await view.do_create_ticket(interaction, panel, selected_category)


class TicketControlView(ui.View):
    """Control panel for tickets"""
    def __init__(self, channel_id: str, panel_id: str, claim_enabled: bool = True):
        super().__init__(timeout=None)
        self.channel_id = channel_id
        self.panel_id = panel_id
        
        if claim_enabled:
            self.add_item(TicketClaimButton(channel_id))
        self.add_item(TicketCloseButton(channel_id))


class TicketClaimButton(ui.Button):
    def __init__(self, channel_id: str):
        super().__init__(
            label="Beanspruchen",
            style=discord.ButtonStyle.primary,
            emoji="✋",
            custom_id=f"ticket_claim_{channel_id}"
        )
        self.channel_id = channel_id
    
    async def callback(self, interaction: discord.Interaction):
        from database import get_ticket_by_channel, claim_ticket
        
        ticket = await get_ticket_by_channel(self.channel_id)
        if not ticket:
            await interaction.response.send_message("❌ Ticket nicht gefunden!", ephemeral=True)
            return
        
        if ticket.get('status') == 'claimed':
            await interaction.response.send_message("❌ Ticket wurde bereits beansprucht!", ephemeral=True)
            return
        
        # Claim ticket
        await claim_ticket(ticket['id'], str(interaction.user.id))
        
        # Update button
        self.label = f"Beansprucht von {interaction.user.display_name}"
        self.disabled = True
        self.style = discord.ButtonStyle.success
        
        await interaction.response.edit_message(view=self.view)
        await interaction.channel.send(f"✋ {interaction.user.mention} hat dieses Ticket beansprucht.")


class TicketCloseButton(ui.Button):
    def __init__(self, channel_id: str):
        super().__init__(
            label="Schließen",
            style=discord.ButtonStyle.danger,
            emoji="🔒",
            custom_id=f"ticket_close_{channel_id}"
        )
        self.channel_id = channel_id
    
    async def callback(self, interaction: discord.Interaction):
        from database import get_ticket_by_channel, close_ticket
        
        ticket = await get_ticket_by_channel(self.channel_id)
        if not ticket:
            await interaction.response.send_message("❌ Ticket nicht gefunden!", ephemeral=True)
            return
        
        # Show confirmation
        view = TicketCloseConfirmView(self.channel_id, ticket['id'])
        await interaction.response.send_message(
            "⚠️ **Möchtest du dieses Ticket wirklich schließen?**\n\nDer Kanal wird in 5 Sekunden nach Bestätigung gelöscht.",
            view=view,
            ephemeral=True
        )


class TicketCloseConfirmView(ui.View):
    def __init__(self, channel_id: str, ticket_id: str):
        super().__init__(timeout=30)
        self.channel_id = channel_id
        self.ticket_id = ticket_id
    
    @ui.button(label="Ja, schließen", style=discord.ButtonStyle.danger, emoji="✅")
    async def confirm(self, interaction: discord.Interaction, button: ui.Button):
        from database import close_ticket
        
        await close_ticket(self.ticket_id, str(interaction.user.id))
        
        channel = interaction.guild.get_channel(int(self.channel_id))
        if channel:
            await interaction.response.send_message("✅ Ticket wird geschlossen...")
            
            # Send closing message in ticket
            embed = discord.Embed(
                title="🔒 Ticket geschlossen",
                description=f"Geschlossen von {interaction.user.mention}",
                color=discord.Color.red()
            )
            await channel.send(embed=embed)
            
            # Delete after delay
            await asyncio.sleep(5)
            try:
                await channel.delete(reason=f"Ticket geschlossen von {interaction.user.name}")
            except:
                pass
    
    @ui.button(label="Abbrechen", style=discord.ButtonStyle.secondary)
    async def cancel(self, interaction: discord.Interaction, button: ui.Button):
        await interaction.response.edit_message(content="❌ Abgebrochen.", view=None)


# ==================== BOT EVENTS ====================

async def sync_guild_data(guild):
    """Sync all guild data to database for web dashboard"""
    from database import sync_server_data
    
    # Collect roles
    roles = []
    for role in guild.roles:
        if role.name != "@everyone":
            roles.append({
                "id": str(role.id),
                "name": role.name,
                "color": str(role.color),
                "position": role.position,
                "mentionable": role.mentionable,
                "managed": role.managed
            })
    
    # Collect channels
    channels = []
    for channel in guild.channels:
        channel_type = "text" if isinstance(channel, discord.TextChannel) else \
                       "voice" if isinstance(channel, discord.VoiceChannel) else \
                       "category" if isinstance(channel, discord.CategoryChannel) else "other"
        channels.append({
            "id": str(channel.id),
            "name": channel.name,
            "type": channel_type,
            "category_id": str(channel.category_id) if channel.category_id else None,
            "position": channel.position
        })
    
    # Collect categories
    categories = []
    for category in guild.categories:
        categories.append({
            "id": str(category.id),
            "name": category.name,
            "position": category.position
        })
    
    # Collect emojis
    emojis = []
    for emoji in guild.emojis:
        emojis.append({
            "id": str(emoji.id),
            "name": emoji.name,
            "animated": emoji.animated,
            "url": str(emoji.url)
        })
    
    await sync_server_data(str(guild.id), roles, channels, categories, emojis)
    logger.info(f'Synced data for guild: {guild.name} ({len(roles)} roles, {len(channels)} channels, {len(emojis)} emojis)')

@bot.event
async def on_ready():
    logger.info(f'{bot.user} ist online!')
    
    # Set bot status from config (using first guild or default)
    try:
        activity = discord.Game(name="/help für Befehle")
        await bot.change_presence(status=discord.Status.online, activity=activity)
    except Exception as e:
        logger.error(f'Error setting status: {e}')
    
    # Sync slash commands
    try:
        synced = await bot.tree.sync()
        logger.info(f'Synced {len(synced)} slash commands')
    except Exception as e:
        logger.error(f'Error syncing commands: {e}')
    
    # Sync all guild data
    for guild in bot.guilds:
        try:
            await sync_guild_data(guild)
        except Exception as e:
            logger.error(f'Error syncing guild {guild.name}: {e}')
    
    # Start background tasks
    check_scheduled_news.start()
    voice_xp_task.start()

@bot.event
async def on_guild_join(guild):
    await get_guild_config(str(guild.id))
    await sync_guild_data(guild)
    logger.info(f'Joined guild: {guild.name}')

@bot.event
async def on_guild_update(before, after):
    """Re-sync when guild is updated"""
    await sync_guild_data(after)

@bot.event
async def on_guild_channel_create(channel):
    """Re-sync when channel is created"""
    await sync_guild_data(channel.guild)

@bot.event
async def on_guild_channel_delete(channel):
    """Re-sync when channel is deleted"""
    await sync_guild_data(channel.guild)

@bot.event
async def on_guild_role_create(role):
    """Re-sync when role is created"""
    await sync_guild_data(role.guild)

@bot.event
async def on_guild_role_delete(role):
    """Re-sync when role is deleted"""
    await sync_guild_data(role.guild)

@bot.event
async def on_member_join(member):
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
    if message.author.bot:
        return
    
    guild_id = str(message.guild.id) if message.guild else None
    if not guild_id:
        return
    
    config = await get_guild_config(guild_id)
    lang = config.get('language', 'de')
    
    # Custom commands
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
        
        last_xp = user_data.get('last_xp')
        if last_xp:
            last_xp_time = datetime.fromisoformat(last_xp)
            cooldown = config.get('xp_cooldown', 60)
            if (now - last_xp_time).total_seconds() < cooldown:
                return
        
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
        
        if new_level > old_level:
            level_roles = config.get('level_roles', {})
            if str(new_level) in level_roles:
                role = message.guild.get_role(int(level_roles[str(new_level)]))
                if role:
                    try:
                        await message.author.add_roles(role)
                    except:
                        pass
            
            level_channel = message.channel
            if config.get('level_up_channel'):
                level_channel = message.guild.get_channel(int(config['level_up_channel'])) or message.channel
            
            await level_channel.send(t(lang, 'level_up', user=message.author.mention, level=new_level))
    
    await bot.process_commands(message)

@bot.event
async def on_voice_state_update(member, before, after):
    """Temp channel management and Voice XP tracking"""
    if member.bot:
        return
    
    guild_id = str(member.guild.id)
    config = await get_guild_config(guild_id)
    
    # ==================== VOICE XP TRACKING ====================
    from database import start_voice_session, end_voice_session
    
    if config.get('voice_xp_enabled'):
        afk_channel_id = config.get('voice_afk_channel')
        
        # User joined a voice channel
        if after.channel and (not before.channel or before.channel.id != after.channel.id):
            # Don't track AFK channel
            if afk_channel_id and str(after.channel.id) == afk_channel_id:
                pass
            else:
                await start_voice_session(guild_id, str(member.id), str(after.channel.id))
        
        # User left voice channel
        if before.channel and (not after.channel or before.channel.id != after.channel.id):
            await end_voice_session(guild_id, str(member.id))
    
    # ==================== MULTI TEMP CHANNEL MANAGEMENT ====================
    from database import get_temp_creators, get_temp_creator_by_channel, increment_temp_creator_counter, get_numbering
    
    # User joined a voice channel - check if it's a creator
    if after.channel:
        creator = await get_temp_creator_by_channel(str(after.channel.id))
        
        if creator and creator.get('enabled', True):
            # Get category
            category = None
            if creator.get('category_id'):
                category = member.guild.get_channel(int(creator['category_id']))
            if not category:
                category = after.channel.category
            
            # Get next number
            counter = await increment_temp_creator_counter(creator['id'])
            numbering = get_numbering(counter, creator.get('numbering_type', 'number'))
            
            # Create channel name from template
            name_template = creator.get('name_template', "🔊 {user}'s Kanal")
            channel_name = name_template.replace('{user}', member.display_name)
            channel_name = channel_name.replace('{number}', numbering)
            channel_name = channel_name.replace('{game}', after.channel.name.split()[0] if after.channel.name else 'Game')
            
            # Create temp channel
            try:
                channel = await member.guild.create_voice_channel(
                    name=channel_name,
                    category=category,
                    user_limit=creator.get('default_limit', 0),
                    bitrate=min(creator.get('default_bitrate', 64000), member.guild.bitrate_limit)
                )
                
                # Position: top = move up, bottom = stay
                if creator.get('position') == 'top' and category:
                    # Find the creator channel position and place new channel below it
                    try:
                        creator_channel = member.guild.get_channel(int(creator['channel_id']))
                        if creator_channel:
                            await channel.edit(position=creator_channel.position + 1)
                    except:
                        pass
                
                # Set permissions
                await channel.set_permissions(member, manage_channels=True, move_members=True, mute_members=True)
                
                # Move user
                await member.move_to(channel)
                
                # Save to database
                await create_temp_channel(guild_id, str(channel.id), str(member.id), channel_name, creator['id'])
                
                # Send control panel
                embed = discord.Embed(
                    title="🎤 Dein Temp-Kanal",
                    description=f"Willkommen in **{channel_name}**, {member.mention}!",
                    color=discord.Color.blue()
                )
                embed.add_field(
                    name="📝 Befehle", 
                    value="`/vc rename` - Umbenennen\n`/vc limit` - Limit setzen\n`/vc lock` - Sperren\n`/vc kick` - Benutzer kicken", 
                    inline=False
                )
                
                view = TempChannelControlView(str(channel.id), member.id)
                try:
                    await channel.send(embed=embed, view=view)
                except:
                    pass
                    
                logger.info(f'Created temp channel: {channel_name} for {member.display_name}')
            except Exception as e:
                logger.error(f'Error creating temp channel: {e}')
    
    # ==================== LEGACY SINGLE CREATOR (fallback) ====================
    # Check old single-creator config for backwards compatibility
    if after.channel and config.get('temp_channels_enabled') and config.get('temp_channel_creator'):
        if str(after.channel.id) == config.get('temp_channel_creator'):
            # Check if we already handled this with multi-creator
            creator = await get_temp_creator_by_channel(str(after.channel.id))
            if not creator:
                category = member.guild.get_channel(int(config['temp_channel_category'])) if config.get('temp_channel_category') else after.channel.category
                
                name_template = config.get('temp_channel_default_name', "🔊 {user}'s Kanal")
                channel_name = name_template.replace('{user}', member.display_name)
                
                try:
                    channel = await member.guild.create_voice_channel(
                        name=channel_name,
                        category=category,
                        user_limit=config.get('temp_channel_default_limit', 0),
                        bitrate=min(config.get('temp_channel_default_bitrate', 64000), member.guild.bitrate_limit)
                    )
                    
                    await channel.set_permissions(member, manage_channels=True, move_members=True, mute_members=True)
                    await member.move_to(channel)
                    await create_temp_channel(guild_id, str(channel.id), str(member.id), channel_name)
                    
                    embed = discord.Embed(
                        title="🎤 Dein Temp-Kanal",
                        description=f"Willkommen in deinem Kanal, {member.mention}!",
                        color=discord.Color.blue()
                    )
                    view = TempChannelControlView(str(channel.id), member.id)
                    try:
                        await channel.send(embed=embed, view=view)
                    except:
                        pass
                except Exception as e:
                    logger.error(f'Error creating legacy temp channel: {e}')
    
    # ==================== DELETE EMPTY TEMP CHANNELS ====================
    if before.channel:
        temp_channel = await get_temp_channel(str(before.channel.id))
        if temp_channel:
            if len(before.channel.members) == 0:
                try:
                    await before.channel.delete()
                    await delete_temp_channel(str(before.channel.id))
                    logger.info(f'Deleted empty temp channel: {before.channel.name}')
                except:
                    pass

@bot.event
async def on_raw_reaction_add(payload):
    """Handle reaction role additions"""
    if payload.member.bot:
        return
    
    rrs = await get_reaction_role_by_message(str(payload.message_id), str(payload.emoji))
    for rr in rrs:
        role = payload.member.guild.get_role(int(rr['role_id']))
        if role:
            try:
                await payload.member.add_roles(role)
            except:
                pass

@bot.event
async def on_raw_reaction_remove(payload):
    """Handle reaction role removals"""
    guild = bot.get_guild(payload.guild_id)
    if not guild:
        return
    
    member = guild.get_member(payload.user_id)
    if not member or member.bot:
        return
    
    rrs = await get_reaction_role_by_message(str(payload.message_id), str(payload.emoji))
    for rr in rrs:
        role = guild.get_role(int(rr['role_id']))
        if role:
            try:
                await member.remove_roles(role)
            except:
                pass

# ==================== GENERAL COMMANDS ====================

@bot.tree.command(name="help", description="Zeigt alle verfügbaren Befehle")
async def help_command(interaction: discord.Interaction):
    config = await get_guild_config(str(interaction.guild.id))
    embed_color = int(config.get('bot_embed_color', '#5865F2').replace('#', ''), 16)
    
    embed = discord.Embed(
        title="📚 MultiBot Befehle",
        description="Hier findest du alle verfügbaren Befehle:",
        color=embed_color
    )
    
    # Moderation
    embed.add_field(
        name="🛡️ Moderation",
        value="`/warn` - Benutzer verwarnen\n`/kick` - Benutzer kicken\n`/ban` - Benutzer bannen\n`/mute` - Benutzer stummschalten\n`/warnings` - Verwarnungen anzeigen\n`/clearwarns` - Verwarnungen löschen",
        inline=False
    )
    
    # Temp Channels
    embed.add_field(
        name="🎤 Temp Voice Channels",
        value="`/vc rename` - Kanal umbenennen\n`/vc limit` - Userlimit setzen\n`/vc lock` - Kanal sperren\n`/vc unlock` - Kanal entsperren\n`/vc kick` - Benutzer kicken\n`/vc permit` - Benutzer erlauben\n`/vc claim` - Kanal übernehmen",
        inline=False
    )
    
    # Leveling
    embed.add_field(
        name="🏆 Leveling",
        value="`/rank` - Zeigt deinen Rang\n`/leaderboard` - Top 10 Rangliste",
        inline=False
    )
    
    # Games
    embed.add_field(
        name="🎮 Spiele",
        value="`/game tictactoe` - TicTacToe spielen\n`/game stadtlandfluss` - Stadt Land Fluss\n`/game coinflip` - Münzwurf\n`/game dice` - Würfeln\n`/game rps` - Schere Stein Papier\n`/game 8ball` - Magische 8-Ball",
        inline=False
    )
    
    # Info
    embed.add_field(
        name="ℹ️ Informationen",
        value="`/help` - Diese Hilfe\n`/botinfo` - Bot Informationen\n`/serverinfo` - Server Statistiken\n`/userinfo` - Benutzer Info",
        inline=False
    )
    
    embed.set_footer(text=f"MultiBot v1.0 | Prefix: {config.get('prefix', '!')}")
    await interaction.response.send_message(embed=embed)

@bot.tree.command(name="botinfo", description="Zeigt Informationen über den Bot")
async def botinfo(interaction: discord.Interaction):
    config = await get_guild_config(str(interaction.guild.id))
    embed_color = int(config.get('bot_embed_color', '#5865F2').replace('#', ''), 16)
    
    # Calculate uptime (approximate)
    import time
    
    embed = discord.Embed(
        title="🤖 Bot Informationen",
        color=embed_color
    )
    
    embed.set_thumbnail(url=bot.user.avatar.url if bot.user.avatar else bot.user.default_avatar.url)
    
    embed.add_field(name="Bot Name", value=bot.user.name, inline=True)
    embed.add_field(name="Bot ID", value=bot.user.id, inline=True)
    embed.add_field(name="Server", value=len(bot.guilds), inline=True)
    embed.add_field(name="Benutzer", value=sum(g.member_count for g in bot.guilds), inline=True)
    embed.add_field(name="Latenz", value=f"{round(bot.latency * 1000)}ms", inline=True)
    embed.add_field(name="Python", value=f"{discord.__version__}", inline=True)
    
    embed.add_field(
        name="🔗 Links",
        value="[Dashboard](https://discord-master-4.preview.emergentagent.com) • [Support](#)",
        inline=False
    )
    
    embed.set_footer(text="MultiBot - Der ultimative All-in-One Discord Bot")
    await interaction.response.send_message(embed=embed)

@bot.tree.command(name="serverinfo", description="Zeigt Server Statistiken")
async def serverinfo(interaction: discord.Interaction):
    guild = interaction.guild
    config = await get_guild_config(str(guild.id))
    embed_color = int(config.get('bot_embed_color', '#5865F2').replace('#', ''), 16)
    
    # Count channels
    text_channels = len(guild.text_channels)
    voice_channels = len(guild.voice_channels)
    categories = len(guild.categories)
    
    # Count members
    total_members = guild.member_count
    bots = len([m for m in guild.members if m.bot])
    humans = total_members - bots
    
    # Online status
    online = len([m for m in guild.members if m.status != discord.Status.offline])
    
    embed = discord.Embed(
        title=f"📊 {guild.name}",
        color=embed_color
    )
    
    if guild.icon:
        embed.set_thumbnail(url=guild.icon.url)
    
    embed.add_field(name="🆔 Server ID", value=guild.id, inline=True)
    embed.add_field(name="👑 Owner", value=guild.owner.mention if guild.owner else "Unbekannt", inline=True)
    embed.add_field(name="📅 Erstellt", value=guild.created_at.strftime("%d.%m.%Y"), inline=True)
    
    embed.add_field(name="👥 Mitglieder", value=f"Gesamt: {total_members}\nMenschen: {humans}\nBots: {bots}", inline=True)
    embed.add_field(name="🟢 Online", value=f"{online} Mitglieder", inline=True)
    embed.add_field(name="🎭 Rollen", value=len(guild.roles), inline=True)
    
    embed.add_field(name="💬 Kanäle", value=f"Text: {text_channels}\nVoice: {voice_channels}\nKategorien: {categories}", inline=True)
    embed.add_field(name="😀 Emojis", value=f"{len(guild.emojis)}/{guild.emoji_limit}", inline=True)
    embed.add_field(name="🚀 Boost Level", value=f"Level {guild.premium_tier}", inline=True)
    
    await interaction.response.send_message(embed=embed)

@bot.tree.command(name="userinfo", description="Zeigt Informationen über einen Benutzer")
@app_commands.describe(user="Der Benutzer (optional)")
async def userinfo(interaction: discord.Interaction, user: discord.Member = None):
    user = user or interaction.user
    config = await get_guild_config(str(interaction.guild.id))
    embed_color = int(config.get('bot_embed_color', '#5865F2').replace('#', ''), 16)
    
    # Get XP data
    user_data = await get_user_data(str(interaction.guild.id), str(user.id))
    
    embed = discord.Embed(
        title=f"👤 {user.display_name}",
        color=user.color if user.color != discord.Color.default() else embed_color
    )
    
    embed.set_thumbnail(url=user.avatar.url if user.avatar else user.default_avatar.url)
    
    embed.add_field(name="🆔 User ID", value=user.id, inline=True)
    embed.add_field(name="📛 Username", value=str(user), inline=True)
    embed.add_field(name="🤖 Bot", value="Ja" if user.bot else "Nein", inline=True)
    
    embed.add_field(name="📅 Discord beigetreten", value=user.created_at.strftime("%d.%m.%Y"), inline=True)
    embed.add_field(name="📥 Server beigetreten", value=user.joined_at.strftime("%d.%m.%Y") if user.joined_at else "?", inline=True)
    
    # Leveling info
    embed.add_field(name="⭐ Level", value=user_data.get('level', 0), inline=True)
    embed.add_field(name="✨ XP", value=user_data.get('xp', 0), inline=True)
    embed.add_field(name="💬 Nachrichten", value=user_data.get('messages', 0), inline=True)
    embed.add_field(name="🎤 Voice (Min)", value=user_data.get('voice_minutes', 0), inline=True)
    
    # Top roles (max 5)
    roles = [r.mention for r in user.roles if r.name != "@everyone"][:5]
    if roles:
        embed.add_field(name=f"🎭 Rollen ({len(user.roles)-1})", value=" ".join(roles), inline=False)
    
    await interaction.response.send_message(embed=embed)

# ==================== MODERATION COMMANDS ====================

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
    
    try:
        await user.send(t(lang, 'warn_dm', server=interaction.guild.name, reason=reason))
    except:
        pass
    
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

# ==================== TEMP CHANNEL COMMANDS ====================

vc_group = app_commands.Group(name="vc", description="Temp Voice Channel Befehle")

@vc_group.command(name="rename", description="Benenne deinen Temp-Kanal um")
@app_commands.describe(name="Neuer Name")
async def vc_rename(interaction: discord.Interaction, name: str):
    if not interaction.user.voice or not interaction.user.voice.channel:
        await interaction.response.send_message("❌ Du bist in keinem Voice-Kanal!", ephemeral=True)
        return
    
    channel = interaction.user.voice.channel
    temp_channel = await get_temp_channel(str(channel.id))
    
    if not temp_channel or temp_channel['owner_id'] != str(interaction.user.id):
        await interaction.response.send_message("❌ Das ist nicht dein Kanal!", ephemeral=True)
        return
    
    await channel.edit(name=name)
    await update_temp_channel(str(channel.id), {"name": name})
    await interaction.response.send_message(f"✅ Kanal umbenannt zu: **{name}**", ephemeral=True)

@vc_group.command(name="limit", description="Setze das Benutzerlimit")
@app_commands.describe(limit="Limit (0 = unbegrenzt)")
async def vc_limit(interaction: discord.Interaction, limit: int):
    if not interaction.user.voice or not interaction.user.voice.channel:
        await interaction.response.send_message("❌ Du bist in keinem Voice-Kanal!", ephemeral=True)
        return
    
    channel = interaction.user.voice.channel
    temp_channel = await get_temp_channel(str(channel.id))
    
    if not temp_channel or temp_channel['owner_id'] != str(interaction.user.id):
        await interaction.response.send_message("❌ Das ist nicht dein Kanal!", ephemeral=True)
        return
    
    if limit < 0 or limit > 99:
        await interaction.response.send_message("❌ Limit muss zwischen 0 und 99 sein!", ephemeral=True)
        return
    
    await channel.edit(user_limit=limit)
    await update_temp_channel(str(channel.id), {"user_limit": limit})
    await interaction.response.send_message(f"✅ Limit gesetzt: **{limit if limit > 0 else 'unbegrenzt'}**", ephemeral=True)

@vc_group.command(name="lock", description="Sperre deinen Kanal")
async def vc_lock(interaction: discord.Interaction):
    if not interaction.user.voice or not interaction.user.voice.channel:
        await interaction.response.send_message("❌ Du bist in keinem Voice-Kanal!", ephemeral=True)
        return
    
    channel = interaction.user.voice.channel
    temp_channel = await get_temp_channel(str(channel.id))
    
    if not temp_channel or temp_channel['owner_id'] != str(interaction.user.id):
        await interaction.response.send_message("❌ Das ist nicht dein Kanal!", ephemeral=True)
        return
    
    await channel.set_permissions(interaction.guild.default_role, connect=False)
    await update_temp_channel(str(channel.id), {"locked": True})
    await interaction.response.send_message("🔒 Kanal gesperrt!", ephemeral=True)

@vc_group.command(name="unlock", description="Entsperre deinen Kanal")
async def vc_unlock(interaction: discord.Interaction):
    if not interaction.user.voice or not interaction.user.voice.channel:
        await interaction.response.send_message("❌ Du bist in keinem Voice-Kanal!", ephemeral=True)
        return
    
    channel = interaction.user.voice.channel
    temp_channel = await get_temp_channel(str(channel.id))
    
    if not temp_channel or temp_channel['owner_id'] != str(interaction.user.id):
        await interaction.response.send_message("❌ Das ist nicht dein Kanal!", ephemeral=True)
        return
    
    await channel.set_permissions(interaction.guild.default_role, connect=True)
    await update_temp_channel(str(channel.id), {"locked": False})
    await interaction.response.send_message("🔓 Kanal entsperrt!", ephemeral=True)

@vc_group.command(name="kick", description="Kicke einen Benutzer aus deinem Kanal")
@app_commands.describe(user="Der zu kickende Benutzer")
async def vc_kick(interaction: discord.Interaction, user: discord.Member):
    if not interaction.user.voice or not interaction.user.voice.channel:
        await interaction.response.send_message("❌ Du bist in keinem Voice-Kanal!", ephemeral=True)
        return
    
    channel = interaction.user.voice.channel
    temp_channel = await get_temp_channel(str(channel.id))
    
    if not temp_channel or temp_channel['owner_id'] != str(interaction.user.id):
        await interaction.response.send_message("❌ Das ist nicht dein Kanal!", ephemeral=True)
        return
    
    if user.voice and user.voice.channel == channel:
        await user.move_to(None)
        await interaction.response.send_message(f"👢 {user.mention} wurde aus dem Kanal geworfen!", ephemeral=True)
    else:
        await interaction.response.send_message("❌ Der Benutzer ist nicht in deinem Kanal!", ephemeral=True)

@vc_group.command(name="permit", description="Erlaube einem Benutzer deinen Kanal zu betreten")
@app_commands.describe(user="Der Benutzer")
async def vc_permit(interaction: discord.Interaction, user: discord.Member):
    if not interaction.user.voice or not interaction.user.voice.channel:
        await interaction.response.send_message("❌ Du bist in keinem Voice-Kanal!", ephemeral=True)
        return
    
    channel = interaction.user.voice.channel
    temp_channel = await get_temp_channel(str(channel.id))
    
    if not temp_channel or temp_channel['owner_id'] != str(interaction.user.id):
        await interaction.response.send_message("❌ Das ist nicht dein Kanal!", ephemeral=True)
        return
    
    await channel.set_permissions(user, connect=True, view_channel=True)
    await interaction.response.send_message(f"✅ {user.mention} darf jetzt den Kanal betreten!", ephemeral=True)

@vc_group.command(name="claim", description="Übernimm einen verlassenen Temp-Kanal")
async def vc_claim(interaction: discord.Interaction):
    if not interaction.user.voice or not interaction.user.voice.channel:
        await interaction.response.send_message("❌ Du bist in keinem Voice-Kanal!", ephemeral=True)
        return
    
    channel = interaction.user.voice.channel
    temp_channel = await get_temp_channel(str(channel.id))
    
    if not temp_channel:
        await interaction.response.send_message("❌ Das ist kein Temp-Kanal!", ephemeral=True)
        return
    
    # Check if owner is still in channel
    owner = interaction.guild.get_member(int(temp_channel['owner_id']))
    if owner and owner.voice and owner.voice.channel == channel:
        await interaction.response.send_message("❌ Der Besitzer ist noch im Kanal!", ephemeral=True)
        return
    
    # Transfer ownership
    await update_temp_channel(str(channel.id), {"owner_id": str(interaction.user.id)})
    await channel.set_permissions(interaction.user, manage_channels=True, move_members=True, mute_members=True)
    await interaction.response.send_message(f"👑 Du bist jetzt der Besitzer dieses Kanals!", ephemeral=True)

bot.tree.add_command(vc_group)

# ==================== REACTION ROLE COMMANDS ====================

rr_group = app_commands.Group(name="reactionrole", description="Reaction Role Befehle")

@rr_group.command(name="create", description="Erstelle Reaction Roles mit Buttons")
@app_commands.describe(
    title="Titel der Nachricht",
    description="Beschreibung",
    role1="Erste Rolle",
    emoji1="Emoji für Rolle 1",
    role2="Zweite Rolle (optional)",
    emoji2="Emoji für Rolle 2",
    role3="Dritte Rolle (optional)",
    emoji3="Emoji für Rolle 3"
)
async def rr_create(
    interaction: discord.Interaction,
    title: str,
    description: str,
    role1: discord.Role,
    emoji1: str,
    role2: discord.Role = None,
    emoji2: str = None,
    role3: discord.Role = None,
    emoji3: str = None
):
    if not interaction.user.guild_permissions.manage_roles:
        await interaction.response.send_message("❌ Du brauchst die Berechtigung 'Rollen verwalten'!", ephemeral=True)
        return
    
    embed = discord.Embed(
        title=title,
        description=description,
        color=discord.Color.blue()
    )
    
    roles_text = []
    view = ReactionRoleView()
    
    roles_to_add = [(role1, emoji1)]
    if role2 and emoji2:
        roles_to_add.append((role2, emoji2))
    if role3 and emoji3:
        roles_to_add.append((role3, emoji3))
    
    for role, emoji in roles_to_add:
        roles_text.append(f"{emoji} → {role.mention}")
        view.add_item(RoleButton(role.id, emoji, role.name))
    
    embed.add_field(name="Rollen", value="\n".join(roles_text), inline=False)
    embed.set_footer(text="Klicke auf einen Button um die Rolle zu erhalten/entfernen")
    
    await interaction.response.send_message(embed=embed, view=view)
    msg = await interaction.original_response()
    
    # Save to database
    for role, emoji in roles_to_add:
        await create_reaction_role(
            str(interaction.guild.id),
            str(interaction.channel.id),
            str(msg.id),
            emoji,
            str(role.id),
            "button",
            title,
            description
        )

@rr_group.command(name="reaction", description="Erstelle klassische Reaction Roles (mit Emoji-Reaktionen)")
@app_commands.describe(
    message_id="ID der Nachricht",
    emoji="Emoji zum Reagieren",
    role="Die Rolle"
)
async def rr_reaction(
    interaction: discord.Interaction,
    message_id: str,
    emoji: str,
    role: discord.Role
):
    if not interaction.user.guild_permissions.manage_roles:
        await interaction.response.send_message("❌ Du brauchst die Berechtigung 'Rollen verwalten'!", ephemeral=True)
        return
    
    try:
        message = await interaction.channel.fetch_message(int(message_id))
        await message.add_reaction(emoji)
        
        await create_reaction_role(
            str(interaction.guild.id),
            str(interaction.channel.id),
            message_id,
            emoji,
            str(role.id),
            "reaction"
        )
        
        await interaction.response.send_message(f"✅ Reaction Role erstellt! Reagiere mit {emoji} auf die Nachricht um {role.mention} zu erhalten.", ephemeral=True)
    except:
        await interaction.response.send_message("❌ Nachricht nicht gefunden oder ungültiges Emoji!", ephemeral=True)

@rr_group.command(name="list", description="Liste alle Reaction Roles")
async def rr_list(interaction: discord.Interaction):
    rrs = await get_reaction_roles(str(interaction.guild.id))
    
    if not rrs:
        await interaction.response.send_message("📭 Keine Reaction Roles konfiguriert.", ephemeral=True)
        return
    
    embed = discord.Embed(title="🎭 Reaction Roles", color=discord.Color.blue())
    
    for rr in rrs[:10]:  # Limit to 10
        role = interaction.guild.get_role(int(rr['role_id']))
        role_name = role.name if role else "Unbekannt"
        embed.add_field(
            name=f"{rr['emoji']} → {role_name}",
            value=f"Typ: {rr['role_type']}\nNachricht: {rr['message_id']}",
            inline=True
        )
    
    await interaction.response.send_message(embed=embed, ephemeral=True)

bot.tree.add_command(rr_group)

# ==================== GAME COMMANDS ====================

game_group = app_commands.Group(name="game", description="Spiele Befehle")

@game_group.command(name="tictactoe", description="Spiele TicTacToe gegen jemanden")
@app_commands.describe(opponent="Dein Gegner")
async def game_tictactoe(interaction: discord.Interaction, opponent: discord.Member):
    if opponent.bot:
        await interaction.response.send_message("❌ Du kannst nicht gegen Bots spielen!", ephemeral=True)
        return
    
    if opponent == interaction.user:
        await interaction.response.send_message("❌ Du kannst nicht gegen dich selbst spielen!", ephemeral=True)
        return
    
    game = await create_game(
        str(interaction.guild.id),
        str(interaction.channel.id),
        "tictactoe",
        str(interaction.user.id),
        str(opponent.id),
        {"board": [[None]*3 for _ in range(3)]}
    )
    
    view = TicTacToeView(interaction.user, opponent, game['id'])
    await interaction.response.send_message(
        f"🎮 **TicTacToe**\n{interaction.user.mention} (X) vs {opponent.mention} (O)\n\n➡️ {interaction.user.mention} ist dran!",
        view=view
    )

@game_group.command(name="stadtlandfluss", description="Spiele Stadt Land Fluss")
@app_commands.describe(
    player2="Zweiter Spieler",
    player3="Dritter Spieler (optional)",
    player4="Vierter Spieler (optional)"
)
async def game_slf(
    interaction: discord.Interaction,
    player2: discord.Member,
    player3: discord.Member = None,
    player4: discord.Member = None
):
    players = [interaction.user, player2]
    if player3:
        players.append(player3)
    if player4:
        players.append(player4)
    
    # Check for bots and duplicates
    for p in players:
        if p.bot:
            await interaction.response.send_message("❌ Bots können nicht mitspielen!", ephemeral=True)
            return
    
    if len(players) != len(set(p.id for p in players)):
        await interaction.response.send_message("❌ Jeder Spieler kann nur einmal mitspielen!", ephemeral=True)
        return
    
    # Random letter
    letter = random.choice("ABCDEFGHIJKLMNOPRSTUVW")
    categories = ["Stadt", "Land", "Fluss", "Name", "Beruf"]
    
    game = await create_game(
        str(interaction.guild.id),
        str(interaction.channel.id),
        "stadtlandfluss",
        str(interaction.user.id),
        None,
        {
            "players": [str(p.id) for p in players],
            "letter": letter,
            "categories": categories,
            "answers": {}
        }
    )
    
    embed = discord.Embed(
        title="🌍 Stadt Land Fluss",
        description=f"**Buchstabe: {letter}**\n\nKategorien: {', '.join(categories)}",
        color=discord.Color.green()
    )
    embed.add_field(name="Spieler", value="\n".join([p.mention for p in players]), inline=False)
    embed.set_footer(text="Klicke auf 'Antworten eingeben' um deine Antworten zu schreiben. Erster mit 'STOPP!' beendet die Runde!")
    
    view = StadtLandFlussView(game['id'], players, categories, letter)
    await interaction.response.send_message(embed=embed, view=view)

@game_group.command(name="coinflip", description="Wirf eine Münze")
async def game_coinflip(interaction: discord.Interaction):
    result = random.choice(["Kopf 🪙", "Zahl 🪙"])
    
    embed = discord.Embed(
        title="🪙 Münzwurf",
        description=f"Die Münze wird geworfen...",
        color=discord.Color.gold()
    )
    await interaction.response.send_message(embed=embed)
    
    await asyncio.sleep(1.5)
    
    embed.description = f"**{result}**"
    await interaction.edit_original_response(embed=embed)

@game_group.command(name="dice", description="Würfle einen Würfel")
@app_commands.describe(sides="Anzahl der Seiten (Standard: 6)")
async def game_dice(interaction: discord.Interaction, sides: int = 6):
    if sides < 2 or sides > 100:
        await interaction.response.send_message("❌ Würfel muss 2-100 Seiten haben!", ephemeral=True)
        return
    
    result = random.randint(1, sides)
    
    embed = discord.Embed(
        title="🎲 Würfelwurf",
        description=f"Du hast einen d{sides} gewürfelt...\n\n**🎯 {result}**",
        color=discord.Color.purple()
    )
    await interaction.response.send_message(embed=embed)

@game_group.command(name="rps", description="Schere, Stein, Papier")
@app_commands.describe(choice="Deine Wahl")
@app_commands.choices(choice=[
    app_commands.Choice(name="✊ Stein", value="stein"),
    app_commands.Choice(name="✋ Papier", value="papier"),
    app_commands.Choice(name="✌️ Schere", value="schere")
])
async def game_rps(interaction: discord.Interaction, choice: str):
    choices = {"stein": "✊", "papier": "✋", "schere": "✌️"}
    bot_choice = random.choice(list(choices.keys()))
    
    # Determine winner
    if choice == bot_choice:
        result = "🤝 Unentschieden!"
        color = discord.Color.yellow()
    elif (choice == "stein" and bot_choice == "schere") or \
         (choice == "schere" and bot_choice == "papier") or \
         (choice == "papier" and bot_choice == "stein"):
        result = "🎉 Du gewinnst!"
        color = discord.Color.green()
    else:
        result = "😢 Du verlierst!"
        color = discord.Color.red()
    
    embed = discord.Embed(
        title="✊✋✌️ Schere, Stein, Papier",
        color=color
    )
    embed.add_field(name="Du", value=choices[choice], inline=True)
    embed.add_field(name="Bot", value=choices[bot_choice], inline=True)
    embed.add_field(name="Ergebnis", value=result, inline=False)
    
    await interaction.response.send_message(embed=embed)

@game_group.command(name="8ball", description="Frage die magische 8-Ball")
@app_commands.describe(question="Deine Frage")
async def game_8ball(interaction: discord.Interaction, question: str):
    responses = [
        "🟢 Ja, definitiv!",
        "🟢 Ohne Zweifel.",
        "🟢 Ja.",
        "🟢 Sehr wahrscheinlich.",
        "🟡 Frag später nochmal.",
        "🟡 Kann ich jetzt nicht sagen.",
        "🟡 Konzentriere dich und frag nochmal.",
        "🔴 Eher nicht.",
        "🔴 Nein.",
        "🔴 Auf keinen Fall!",
        "🔴 Meine Quellen sagen nein."
    ]
    
    embed = discord.Embed(
        title="🎱 Magische 8-Ball",
        color=discord.Color.dark_purple()
    )
    embed.add_field(name="Frage", value=question, inline=False)
    embed.add_field(name="Antwort", value=random.choice(responses), inline=False)
    
    await interaction.response.send_message(embed=embed)

bot.tree.add_command(game_group)

# ==================== INFO COMMANDS ====================

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

# ==================== SCHEDULED TASKS ====================

@tasks.loop(minutes=1)
async def check_scheduled_news():
    try:
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

@tasks.loop(minutes=1)
async def voice_xp_task():
    """Award XP to users in voice channels"""
    from database import get_active_voice_sessions, get_level_rewards
    
    try:
        for guild in bot.guilds:
            config = await get_guild_config(str(guild.id))
            
            if not config.get('voice_xp_enabled'):
                continue
            
            xp_per_minute = config.get('voice_xp_per_minute', 5)
            min_users = config.get('voice_xp_min_users', 2)
            afk_channel_id = config.get('voice_afk_channel')
            
            # Get all voice channels with users
            for vc in guild.voice_channels:
                # Skip AFK channel
                if afk_channel_id and str(vc.id) == afk_channel_id:
                    continue
                
                # Count non-bot members
                members = [m for m in vc.members if not m.bot]
                
                # Check minimum users
                if len(members) < min_users:
                    continue
                
                # Award XP to each member
                for member in members:
                    # Check if deafened or muted (optional - skip if self-muted)
                    voice_state = member.voice
                    if voice_state and voice_state.self_deaf:
                        continue  # Skip self-deafened users
                    
                    user_data = await get_user_data(str(guild.id), str(member.id))
                    new_xp = user_data['xp'] + xp_per_minute
                    old_level = user_data['level']
                    new_level = calculate_level(new_xp)
                    
                    # Update XP (add voice_minutes tracking)
                    voice_minutes = user_data.get('voice_minutes', 0) + 1
                    await update_user_data(str(guild.id), str(member.id), {
                        'xp': new_xp,
                        'level': new_level,
                        'voice_minutes': voice_minutes
                    })
                    
                    # Level up!
                    if new_level > old_level:
                        # Check level rewards
                        rewards = await get_level_rewards(str(guild.id))
                        for reward in rewards:
                            if reward.get('enabled') and reward.get('level') == new_level:
                                if reward.get('reward_type') == 'role':
                                    role = guild.get_role(int(reward['reward_value']))
                                    if role:
                                        try:
                                            await member.add_roles(role)
                                        except:
                                            pass
                        
                        # Send level up message (find appropriate channel)
                        level_channel_id = config.get('level_up_channel')
                        if level_channel_id:
                            channel = guild.get_channel(int(level_channel_id))
                            if channel:
                                lang = config.get('language', 'de')
                                await channel.send(f"🎉 {member.mention} ist jetzt Level **{new_level}**! (Voice XP)")
                        
    except Exception as e:
        logger.error(f"Voice XP task error: {e}")
    except Exception as e:
        logger.error(f"News check error: {e}")

def run_bot():
    token = os.environ.get('DISCORD_BOT_TOKEN')
    if not token:
        logger.error("DISCORD_BOT_TOKEN not set!")
        return
    
    bot.run(token)

if __name__ == "__main__":
    run_bot()

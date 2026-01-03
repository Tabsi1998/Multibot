"""
Iteration 8 Test Suite - Discord Bot Dashboard
Tests all API endpoints and features:
- Login API
- Guild Config (GET/PUT)
- Temp Creators (CRUD)
- Ticket Panels (CRUD with Auto-Send)
- Reaction Roles (CRUD with Auto-Send)
- Level Rewards (CRUD)
- Server Data
- Games
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://discord-master-4.preview.emergentagent.com').rstrip('/')
GUILD_ID = "807292920734547969"

# Test credentials
TEST_EMAIL = "admin@test.de"
TEST_PASSWORD = "admin123"


class TestAuth:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test successful login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        assert data["user"]["is_admin"] == True
        assert isinstance(data["token"], str)
        assert len(data["token"]) > 0
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for tests"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


class TestGuildConfig:
    """Guild configuration endpoint tests"""
    
    def test_get_guild_config(self, auth_headers):
        """Test GET guild configuration"""
        response = requests.get(f"{BASE_URL}/api/guilds/{GUILD_ID}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "guild_id" in data
        assert data["guild_id"] == GUILD_ID
        # Check default config fields exist
        assert "language" in data
        assert "prefix" in data
        assert "leveling_enabled" in data
        assert "games_enabled" in data
    
    def test_update_guild_config(self, auth_headers):
        """Test PUT guild configuration"""
        update_data = {
            "prefix": "!",
            "leveling_enabled": True,
            "games_enabled": True
        }
        response = requests.put(f"{BASE_URL}/api/guilds/{GUILD_ID}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["prefix"] == "!"
        assert data["leveling_enabled"] == True
        assert data["games_enabled"] == True
    
    def test_update_guild_disabled_games(self, auth_headers):
        """Test updating disabled_games array"""
        update_data = {
            "disabled_games": ["coinflip", "dice"]
        }
        response = requests.put(f"{BASE_URL}/api/guilds/{GUILD_ID}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "disabled_games" in data
        assert "coinflip" in data["disabled_games"]
        assert "dice" in data["disabled_games"]
        
        # Reset disabled_games
        requests.put(f"{BASE_URL}/api/guilds/{GUILD_ID}", json={"disabled_games": []}, headers=auth_headers)


class TestTempCreators:
    """Temp Voice Creators CRUD tests"""
    
    def test_get_temp_creators(self, auth_headers):
        """Test GET temp creators list"""
        response = requests.get(f"{BASE_URL}/api/guilds/{GUILD_ID}/temp-creators", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "creators" in data
        assert isinstance(data["creators"], list)
    
    def test_create_temp_creator(self, auth_headers):
        """Test POST create temp creator"""
        creator_data = {
            "channel_id": f"TEST_{uuid.uuid4().hex[:8]}",
            "category_id": "123456789",
            "name_template": "🔊 {user}'s Kanal",
            "numbering_type": "number",
            "position": "bottom",
            "default_limit": 5,
            "default_bitrate": 64000,
            "allow_rename": True,
            "allow_limit": True,
            "allow_lock": True,
            "allow_hide": True,
            "allow_kick": True,
            "allow_permit": True,
            "allow_bitrate": True
        }
        response = requests.post(f"{BASE_URL}/api/guilds/{GUILD_ID}/temp-creators", json=creator_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["name_template"] == "🔊 {user}'s Kanal"
        assert data["numbering_type"] == "number"
        assert data["default_limit"] == 5
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/guilds/{GUILD_ID}/temp-creators/{data['id']}", headers=auth_headers)
    
    def test_update_temp_creator(self, auth_headers):
        """Test PUT update temp creator"""
        # Create first
        creator_data = {
            "channel_id": f"TEST_{uuid.uuid4().hex[:8]}",
            "name_template": "Original Template"
        }
        create_response = requests.post(f"{BASE_URL}/api/guilds/{GUILD_ID}/temp-creators", json=creator_data, headers=auth_headers)
        creator_id = create_response.json()["id"]
        
        # Update
        update_data = {"name_template": "Updated Template"}
        response = requests.put(f"{BASE_URL}/api/guilds/{GUILD_ID}/temp-creators/{creator_id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/guilds/{GUILD_ID}/temp-creators/{creator_id}", headers=auth_headers)
    
    def test_delete_temp_creator(self, auth_headers):
        """Test DELETE temp creator"""
        # Create first
        creator_data = {"channel_id": f"TEST_{uuid.uuid4().hex[:8]}"}
        create_response = requests.post(f"{BASE_URL}/api/guilds/{GUILD_ID}/temp-creators", json=creator_data, headers=auth_headers)
        creator_id = create_response.json()["id"]
        
        # Delete
        response = requests.delete(f"{BASE_URL}/api/guilds/{GUILD_ID}/temp-creators/{creator_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["deleted"] == True
    
    def test_delete_nonexistent_temp_creator(self, auth_headers):
        """Test DELETE nonexistent temp creator returns 404"""
        response = requests.delete(f"{BASE_URL}/api/guilds/{GUILD_ID}/temp-creators/nonexistent-id", headers=auth_headers)
        assert response.status_code == 404


class TestTicketPanels:
    """Ticket Panels CRUD tests with Auto-Send"""
    
    def test_get_ticket_panels(self, auth_headers):
        """Test GET ticket panels list"""
        response = requests.get(f"{BASE_URL}/api/guilds/{GUILD_ID}/ticket-panels", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "panels" in data
        assert isinstance(data["panels"], list)
    
    def test_create_ticket_panel(self, auth_headers):
        """Test POST create ticket panel (with auto-send)"""
        panel_data = {
            "channel_id": f"TEST_{uuid.uuid4().hex[:8]}",
            "title": "🎫 TEST Support Tickets",
            "description": "Test ticket panel description",
            "color": "#5865F2",
            "button_label": "Ticket erstellen",
            "button_emoji": "🎫",
            "ticket_category": "123456789",
            "ticket_name_template": "ticket-{number}",
            "categories": [{"name": "Support", "emoji": "🔧"}],
            "custom_fields": [{"label": "Beschreibung", "type": "textarea"}],
            "support_roles": [],
            "ping_roles": [],
            "claim_enabled": True,
            "transcript_enabled": True
        }
        response = requests.post(f"{BASE_URL}/api/guilds/{GUILD_ID}/ticket-panels", json=panel_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["title"] == "🎫 TEST Support Tickets"
        assert data["claim_enabled"] == True
        assert len(data["categories"]) == 1
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/guilds/{GUILD_ID}/ticket-panels/{data['id']}", headers=auth_headers)
    
    def test_update_ticket_panel(self, auth_headers):
        """Test PUT update ticket panel"""
        # Create first
        panel_data = {
            "channel_id": f"TEST_{uuid.uuid4().hex[:8]}",
            "title": "Original Title"
        }
        create_response = requests.post(f"{BASE_URL}/api/guilds/{GUILD_ID}/ticket-panels", json=panel_data, headers=auth_headers)
        panel_id = create_response.json()["id"]
        
        # Update
        update_data = {"title": "Updated Title", "color": "#FF0000"}
        response = requests.put(f"{BASE_URL}/api/guilds/{GUILD_ID}/ticket-panels/{panel_id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/guilds/{GUILD_ID}/ticket-panels/{panel_id}", headers=auth_headers)
    
    def test_delete_ticket_panel(self, auth_headers):
        """Test DELETE ticket panel"""
        # Create first
        panel_data = {"channel_id": f"TEST_{uuid.uuid4().hex[:8]}"}
        create_response = requests.post(f"{BASE_URL}/api/guilds/{GUILD_ID}/ticket-panels", json=panel_data, headers=auth_headers)
        panel_id = create_response.json()["id"]
        
        # Delete
        response = requests.delete(f"{BASE_URL}/api/guilds/{GUILD_ID}/ticket-panels/{panel_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["deleted"] == True
    
    def test_delete_nonexistent_ticket_panel(self, auth_headers):
        """Test DELETE nonexistent ticket panel returns 404"""
        response = requests.delete(f"{BASE_URL}/api/guilds/{GUILD_ID}/ticket-panels/nonexistent-id", headers=auth_headers)
        assert response.status_code == 404
    
    def test_send_ticket_panel(self, auth_headers):
        """Test POST send ticket panel to Discord"""
        # Create first
        panel_data = {"channel_id": f"TEST_{uuid.uuid4().hex[:8]}"}
        create_response = requests.post(f"{BASE_URL}/api/guilds/{GUILD_ID}/ticket-panels", json=panel_data, headers=auth_headers)
        panel_id = create_response.json()["id"]
        
        # Send
        response = requests.post(f"{BASE_URL}/api/guilds/{GUILD_ID}/ticket-panels/{panel_id}/send", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["queued"] == True
        assert "action_id" in data
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/guilds/{GUILD_ID}/ticket-panels/{panel_id}", headers=auth_headers)


class TestReactionRoles:
    """Reaction Roles CRUD tests with Auto-Send"""
    
    def test_get_reaction_roles(self, auth_headers):
        """Test GET reaction roles list"""
        response = requests.get(f"{BASE_URL}/api/guilds/{GUILD_ID}/reaction-roles", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "reaction_roles" in data
        assert isinstance(data["reaction_roles"], list)
    
    def test_create_reaction_role(self, auth_headers):
        """Test POST create reaction role (with auto-send)"""
        rr_data = {
            "title": "🎭 TEST Reaction Roles",
            "description": "Test reaction role description",
            "channel_id": f"TEST_{uuid.uuid4().hex[:8]}",
            "type": "button",
            "roles": [
                {"emoji": "🎮", "role_id": "123456789", "label": "Gamer"},
                {"emoji": "🎵", "role_id": "987654321", "label": "Music"}
            ],
            "color": "#5865F2"
        }
        response = requests.post(f"{BASE_URL}/api/guilds/{GUILD_ID}/reaction-roles", json=rr_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "created" in data
        assert data["created"] == 1
        assert "reaction_roles" in data
        assert len(data["reaction_roles"]) == 1
        
        rr = data["reaction_roles"][0]
        assert rr["title"] == "🎭 TEST Reaction Roles"
        assert len(rr["roles"]) == 2
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/guilds/{GUILD_ID}/reaction-roles/{rr['id']}", headers=auth_headers)
    
    def test_update_reaction_role(self, auth_headers):
        """Test PUT update reaction role"""
        # Create first
        rr_data = {
            "title": "Original Title",
            "channel_id": f"TEST_{uuid.uuid4().hex[:8]}",
            "type": "button",
            "roles": [{"emoji": "🎮", "role_id": "123456789"}]
        }
        create_response = requests.post(f"{BASE_URL}/api/guilds/{GUILD_ID}/reaction-roles", json=rr_data, headers=auth_headers)
        rr_id = create_response.json()["reaction_roles"][0]["id"]
        
        # Update
        update_data = {"title": "Updated Title", "description": "New description", "color": "#FF0000"}
        response = requests.put(f"{BASE_URL}/api/guilds/{GUILD_ID}/reaction-roles/{rr_id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["updated"] == True
        assert data["title"] == "Updated Title"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/guilds/{GUILD_ID}/reaction-roles/{rr_id}", headers=auth_headers)
    
    def test_delete_reaction_role(self, auth_headers):
        """Test DELETE reaction role"""
        # Create first
        rr_data = {
            "title": "To Delete",
            "channel_id": f"TEST_{uuid.uuid4().hex[:8]}",
            "type": "button",
            "roles": [{"emoji": "🎮", "role_id": "123456789"}]
        }
        create_response = requests.post(f"{BASE_URL}/api/guilds/{GUILD_ID}/reaction-roles", json=rr_data, headers=auth_headers)
        rr_id = create_response.json()["reaction_roles"][0]["id"]
        
        # Delete
        response = requests.delete(f"{BASE_URL}/api/guilds/{GUILD_ID}/reaction-roles/{rr_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["deleted"] == True
    
    def test_delete_nonexistent_reaction_role(self, auth_headers):
        """Test DELETE nonexistent reaction role returns 404"""
        response = requests.delete(f"{BASE_URL}/api/guilds/{GUILD_ID}/reaction-roles/nonexistent-id", headers=auth_headers)
        assert response.status_code == 404
    
    def test_send_reaction_role(self, auth_headers):
        """Test POST send reaction role to Discord"""
        # Create first
        rr_data = {
            "title": "Send Test",
            "channel_id": f"TEST_{uuid.uuid4().hex[:8]}",
            "type": "button",
            "roles": [{"emoji": "🎮", "role_id": "123456789"}]
        }
        create_response = requests.post(f"{BASE_URL}/api/guilds/{GUILD_ID}/reaction-roles", json=rr_data, headers=auth_headers)
        rr_id = create_response.json()["reaction_roles"][0]["id"]
        
        # Send
        response = requests.post(f"{BASE_URL}/api/guilds/{GUILD_ID}/reaction-roles/{rr_id}/send", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["queued"] == True
        assert "action_id" in data
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/guilds/{GUILD_ID}/reaction-roles/{rr_id}", headers=auth_headers)


class TestLevelRewards:
    """Level Rewards CRUD tests"""
    
    def test_get_level_rewards(self, auth_headers):
        """Test GET level rewards list"""
        response = requests.get(f"{BASE_URL}/api/guilds/{GUILD_ID}/level-rewards", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "rewards" in data
        assert isinstance(data["rewards"], list)
    
    def test_create_level_reward(self, auth_headers):
        """Test POST create level reward"""
        reward_data = {
            "level": 10,
            "reward_type": "role",
            "reward_value": "TEST_123456789",
            "reward_name": "Test Role"
        }
        response = requests.post(f"{BASE_URL}/api/guilds/{GUILD_ID}/level-rewards", json=reward_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["level"] == 10
        assert data["reward_type"] == "role"
        assert data["reward_value"] == "TEST_123456789"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/guilds/{GUILD_ID}/level-rewards/{data['id']}", headers=auth_headers)
    
    def test_delete_level_reward(self, auth_headers):
        """Test DELETE level reward"""
        # Create first
        reward_data = {
            "level": 5,
            "reward_type": "role",
            "reward_value": "TEST_delete"
        }
        create_response = requests.post(f"{BASE_URL}/api/guilds/{GUILD_ID}/level-rewards", json=reward_data, headers=auth_headers)
        reward_id = create_response.json()["id"]
        
        # Delete
        response = requests.delete(f"{BASE_URL}/api/guilds/{GUILD_ID}/level-rewards/{reward_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["deleted"] == True


class TestServerData:
    """Server Data endpoint tests"""
    
    def test_get_server_data(self, auth_headers):
        """Test GET server data (roles, channels, categories, emojis)"""
        response = requests.get(f"{BASE_URL}/api/guilds/{GUILD_ID}/server-data", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "guild_id" in data
        assert "roles" in data
        assert "channels" in data
        assert "categories" in data
        assert "emojis" in data
        assert isinstance(data["roles"], list)
        assert isinstance(data["channels"], list)


class TestGames:
    """Games endpoint tests"""
    
    def test_get_active_games(self, auth_headers):
        """Test GET active games list"""
        response = requests.get(f"{BASE_URL}/api/guilds/{GUILD_ID}/games", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "games" in data
        assert isinstance(data["games"], list)
    
    def test_get_game_stats(self, auth_headers):
        """Test GET game statistics"""
        response = requests.get(f"{BASE_URL}/api/guilds/{GUILD_ID}/games/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_games" in data


class TestTickets:
    """Tickets endpoint tests"""
    
    def test_get_tickets(self, auth_headers):
        """Test GET tickets list"""
        response = requests.get(f"{BASE_URL}/api/guilds/{GUILD_ID}/tickets", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "tickets" in data
        assert isinstance(data["tickets"], list)
    
    def test_get_ticket_stats(self, auth_headers):
        """Test GET ticket statistics"""
        response = requests.get(f"{BASE_URL}/api/guilds/{GUILD_ID}/tickets/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "open" in data
        assert "claimed" in data
        assert "closed" in data
        assert "total" in data


class TestBotStatus:
    """Bot status endpoint tests"""
    
    def test_get_bot_status(self):
        """Test GET bot status"""
        response = requests.get(f"{BASE_URL}/api/bot/status")
        assert response.status_code == 200
        data = response.json()
        assert "running" in data
        assert "token_configured" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

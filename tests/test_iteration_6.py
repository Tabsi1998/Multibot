"""
Iteration 6 Test Suite - Discord Bot Dashboard
Tests: Login API, Temp Creators, Ticket Panels, Level Rewards, Server Data APIs
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
GUILD_ID = "807292920734547969"

# Test credentials
TEST_EMAIL = "admin@test.de"
TEST_PASSWORD = "admin123"


class TestAuth:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "Token not in response"
        assert "user" in data, "User not in response"
        assert data["user"]["email"] == TEST_EMAIL
        assert isinstance(data["token"], str)
        assert len(data["token"]) > 0
        print(f"✓ Login successful for {TEST_EMAIL}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid credentials correctly rejected")
    
    def test_auth_me_with_token(self):
        """Test /auth/me endpoint with valid token"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = login_response.json()["token"]
        
        # Get user info
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200, f"Auth/me failed: {response.text}"
        
        data = response.json()
        assert data["email"] == TEST_EMAIL
        print("✓ Auth/me endpoint working")


@pytest.fixture(scope="class")
def auth_token():
    """Get authentication token for tests"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Authentication failed - skipping authenticated tests")


class TestTempCreators:
    """Temp Voice Creators API tests"""
    
    def test_get_temp_creators(self, auth_token):
        """Test GET /api/guilds/{guildId}/temp-creators"""
        response = requests.get(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/temp-creators",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "creators" in data
        assert isinstance(data["creators"], list)
        print(f"✓ GET temp-creators: {len(data['creators'])} creators found")
    
    def test_create_temp_creator(self, auth_token):
        """Test POST /api/guilds/{guildId}/temp-creators"""
        creator_data = {
            "channel_id": "TEST_channel_123456",
            "category_id": "TEST_category_123456",
            "name_template": "🔊 TEST {user}'s Kanal",
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
        
        response = requests.post(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/temp-creators",
            json=creator_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["channel_id"] == creator_data["channel_id"]
        assert data["name_template"] == creator_data["name_template"]
        assert data["numbering_type"] == "number"
        print(f"✓ POST temp-creator created: {data['id']}")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/temp-creators/{data['id']}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
    
    def test_create_temp_creator_with_letter_numbering(self, auth_token):
        """Test temp creator with letter numbering type"""
        creator_data = {
            "channel_id": "TEST_letter_channel",
            "category_id": "TEST_category",
            "name_template": "🔊 TEST Channel {number}",
            "numbering_type": "letter",
            "position": "top"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/temp-creators",
            json=creator_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["numbering_type"] == "letter"
        assert data["position"] == "top"
        print("✓ Temp creator with letter numbering created")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/temp-creators/{data['id']}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
    
    def test_delete_temp_creator(self, auth_token):
        """Test DELETE /api/guilds/{guildId}/temp-creators/{creatorId}"""
        # First create
        creator_data = {
            "channel_id": "TEST_delete_channel",
            "name_template": "TEST Delete Channel"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/temp-creators",
            json=creator_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        creator_id = create_response.json()["id"]
        
        # Then delete
        response = requests.delete(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/temp-creators/{creator_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        print("✓ DELETE temp-creator successful")
    
    def test_delete_nonexistent_temp_creator(self, auth_token):
        """Test DELETE nonexistent temp creator returns 404"""
        response = requests.delete(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/temp-creators/nonexistent-id-12345",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 404
        print("✓ DELETE nonexistent temp-creator returns 404")


class TestTicketPanels:
    """Ticket Panels API tests"""
    
    def test_get_ticket_panels(self, auth_token):
        """Test GET /api/guilds/{guildId}/ticket-panels"""
        response = requests.get(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/ticket-panels",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "panels" in data
        assert isinstance(data["panels"], list)
        print(f"✓ GET ticket-panels: {len(data['panels'])} panels found")
    
    def test_create_ticket_panel(self, auth_token):
        """Test POST /api/guilds/{guildId}/ticket-panels"""
        panel_data = {
            "channel_id": "TEST_ticket_channel_123",
            "title": "🎫 TEST Support Tickets",
            "description": "TEST - Klicke auf den Button um ein Ticket zu erstellen.",
            "color": "#5865F2",
            "button_label": "Ticket erstellen",
            "button_emoji": "🎫",
            "ticket_category": "TEST_category_123",
            "ticket_name_template": "ticket-{number}",
            "categories": [
                {"name": "Support", "emoji": "❓", "description": "General support"}
            ],
            "custom_fields": [
                {"label": "Issue", "type": "text", "required": True}
            ],
            "support_roles": ["TEST_role_123"],
            "ping_roles": [],
            "claim_enabled": True,
            "transcript_enabled": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/ticket-panels",
            json=panel_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["title"] == panel_data["title"]
        assert data["channel_id"] == panel_data["channel_id"]
        assert data["claim_enabled"] == True
        assert data["transcript_enabled"] == True
        print(f"✓ POST ticket-panel created: {data['id']}")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/ticket-panels/{data['id']}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
    
    def test_delete_ticket_panel(self, auth_token):
        """Test DELETE /api/guilds/{guildId}/ticket-panels/{panelId}"""
        # First create
        panel_data = {
            "channel_id": "TEST_delete_panel_channel",
            "title": "TEST Delete Panel"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/ticket-panels",
            json=panel_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        panel_id = create_response.json()["id"]
        
        # Then delete
        response = requests.delete(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/ticket-panels/{panel_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        print("✓ DELETE ticket-panel successful")
    
    def test_delete_nonexistent_ticket_panel(self, auth_token):
        """Test DELETE nonexistent ticket panel returns 404"""
        response = requests.delete(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/ticket-panels/nonexistent-id-12345",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 404
        print("✓ DELETE nonexistent ticket-panel returns 404")
    
    def test_get_tickets(self, auth_token):
        """Test GET /api/guilds/{guildId}/tickets"""
        response = requests.get(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/tickets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "tickets" in data
        assert isinstance(data["tickets"], list)
        print(f"✓ GET tickets: {len(data['tickets'])} tickets found")
    
    def test_get_ticket_stats(self, auth_token):
        """Test GET /api/guilds/{guildId}/tickets/stats"""
        response = requests.get(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/tickets/stats",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "open" in data
        assert "claimed" in data
        assert "closed" in data
        assert "total" in data
        print(f"✓ GET ticket stats: open={data['open']}, claimed={data['claimed']}, closed={data['closed']}, total={data['total']}")


class TestLevelRewards:
    """Level Rewards API tests"""
    
    def test_get_level_rewards(self, auth_token):
        """Test GET /api/guilds/{guildId}/level-rewards"""
        response = requests.get(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/level-rewards",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "rewards" in data
        assert isinstance(data["rewards"], list)
        print(f"✓ GET level-rewards: {len(data['rewards'])} rewards found")
    
    def test_create_level_reward(self, auth_token):
        """Test POST /api/guilds/{guildId}/level-rewards"""
        reward_data = {
            "level": 99,
            "reward_type": "role",
            "reward_value": "TEST_role_reward_123",
            "reward_name": "TEST Level 99 Role"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/level-rewards",
            json=reward_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["level"] == 99
        assert data["reward_type"] == "role"
        assert data["reward_value"] == reward_data["reward_value"]
        print(f"✓ POST level-reward created: {data['id']}")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/level-rewards/{data['id']}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
    
    def test_delete_level_reward(self, auth_token):
        """Test DELETE /api/guilds/{guildId}/level-rewards/{rewardId}"""
        # First create
        reward_data = {
            "level": 98,
            "reward_type": "emoji",
            "reward_value": "TEST_emoji_123",
            "reward_name": "TEST Emoji Reward"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/level-rewards",
            json=reward_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        reward_id = create_response.json()["id"]
        
        # Then delete
        response = requests.delete(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/level-rewards/{reward_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        print("✓ DELETE level-reward successful")


class TestServerData:
    """Server Data API tests"""
    
    def test_get_server_data(self, auth_token):
        """Test GET /api/guilds/{guildId}/server-data"""
        response = requests.get(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/server-data",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "guild_id" in data
        assert "roles" in data
        assert "channels" in data
        assert "categories" in data
        assert "emojis" in data
        print(f"✓ GET server-data: roles={len(data['roles'])}, channels={len(data['channels'])}, categories={len(data['categories'])}")


class TestGuildConfig:
    """Guild Configuration API tests"""
    
    def test_get_guild_config(self, auth_token):
        """Test GET /api/guilds/{guildId}"""
        response = requests.get(
            f"{BASE_URL}/api/guilds/{GUILD_ID}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "guild_id" in data
        print(f"✓ GET guild config for {GUILD_ID}")
    
    def test_get_leaderboard(self, auth_token):
        """Test GET /api/guilds/{guildId}/leaderboard"""
        response = requests.get(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/leaderboard?limit=10",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "leaderboard" in data
        assert isinstance(data["leaderboard"], list)
        print(f"✓ GET leaderboard: {len(data['leaderboard'])} users")


class TestBotStatus:
    """Bot Status API tests"""
    
    def test_get_bot_status(self):
        """Test GET /api/bot/status"""
        response = requests.get(f"{BASE_URL}/api/bot/status")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "running" in data
        assert "token_configured" in data
        print(f"✓ GET bot/status: running={data['running']}, token_configured={data['token_configured']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

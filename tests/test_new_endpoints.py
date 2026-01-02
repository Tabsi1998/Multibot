"""
Test suite for new Discord Bot Dashboard features (Iteration 4):
- Server Data Sync API (/api/guilds/{guildId}/server-data)
- Level Rewards API (/api/guilds/{guildId}/level-rewards)
- Voice Stats API (/api/guilds/{guildId}/voice-stats)
- Voice XP Configuration
- Bot Appearance Settings
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TEST_GUILD_ID = "807292920734547969"
TEST_EMAIL = "admin@test.de"
TEST_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for all tests"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Authentication failed - cannot proceed with tests")


class TestServerDataAPI:
    """Test Server Data Sync API endpoints"""
    
    def test_get_server_data(self, auth_token):
        """Test getting cached server data (roles, channels, emojis)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/server-data", 
                               headers=headers)
        assert response.status_code == 200, f"Failed to get server data: {response.text}"
        data = response.json()
        
        # Verify structure - should have roles, channels, categories, emojis arrays
        assert "guild_id" in data, "guild_id not in response"
        assert "roles" in data, "roles not in response"
        assert "channels" in data, "channels not in response"
        assert "categories" in data, "categories not in response"
        assert "emojis" in data, "emojis not in response"
        
        # Verify types
        assert isinstance(data["roles"], list), "roles should be a list"
        assert isinstance(data["channels"], list), "channels should be a list"
        assert isinstance(data["categories"], list), "categories should be a list"
        assert isinstance(data["emojis"], list), "emojis should be a list"
        
        print(f"Server data: {len(data['roles'])} roles, {len(data['channels'])} channels, {len(data['emojis'])} emojis")
        
    def test_trigger_server_sync(self, auth_token):
        """Test triggering server data sync"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/server-data/sync", 
                                headers=headers)
        assert response.status_code == 200, f"Failed to trigger sync: {response.text}"
        data = response.json()
        assert "message" in data, "message not in response"


class TestLevelRewardsAPI:
    """Test Level Rewards API endpoints"""
    
    def test_list_level_rewards(self, auth_token):
        """Test listing level rewards"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/level-rewards", 
                               headers=headers)
        assert response.status_code == 200, f"Failed to list level rewards: {response.text}"
        data = response.json()
        assert "rewards" in data, "rewards not in response"
        assert isinstance(data["rewards"], list), "rewards should be a list"
        
    def test_create_level_reward_role(self, auth_token):
        """Test creating a role-type level reward"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        reward_data = {
            "level": 5,
            "reward_type": "role",
            "reward_value": "TEST_123456789",
            "reward_name": "TEST_Level 5 Role"
        }
        response = requests.post(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/level-rewards", 
                                json=reward_data, headers=headers)
        assert response.status_code == 200, f"Failed to create level reward: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data, "id not in response"
        assert data["level"] == 5, "level mismatch"
        assert data["reward_type"] == "role", "reward_type mismatch"
        assert data["reward_value"] == "TEST_123456789", "reward_value mismatch"
        assert data["enabled"] == True, "reward should be enabled by default"
        
        # Verify persistence by listing
        list_response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/level-rewards", 
                                    headers=headers)
        assert list_response.status_code == 200
        list_data = list_response.json()
        found = any(r.get("reward_value") == "TEST_123456789" for r in list_data["rewards"])
        assert found, "Created reward not found in list"
        
    def test_create_level_reward_emoji(self, auth_token):
        """Test creating an emoji-type level reward"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        reward_data = {
            "level": 10,
            "reward_type": "emoji",
            "reward_value": "TEST_emoji_987654321",
            "reward_name": "TEST_Level 10 Emoji"
        }
        response = requests.post(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/level-rewards", 
                                json=reward_data, headers=headers)
        assert response.status_code == 200, f"Failed to create emoji reward: {response.text}"
        data = response.json()
        assert data["reward_type"] == "emoji"
        
    def test_toggle_level_reward(self, auth_token):
        """Test toggling a level reward on/off"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # First get a reward to toggle
        list_response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/level-rewards", 
                                    headers=headers)
        list_data = list_response.json()
        test_rewards = [r for r in list_data.get("rewards", []) 
                       if r.get("reward_value", "").startswith("TEST_")]
        
        if test_rewards:
            reward_id = test_rewards[0]["id"]
            
            # Toggle off
            response = requests.put(
                f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/level-rewards/{reward_id}/toggle?enabled=false",
                headers=headers
            )
            assert response.status_code == 200, f"Failed to toggle reward off: {response.text}"
            
            # Toggle back on
            response = requests.put(
                f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/level-rewards/{reward_id}/toggle?enabled=true",
                headers=headers
            )
            assert response.status_code == 200, f"Failed to toggle reward on: {response.text}"
        else:
            pytest.skip("No test rewards to toggle")
            
    def test_delete_level_reward(self, auth_token):
        """Test deleting a level reward"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create one to delete
        reward_data = {
            "level": 99,
            "reward_type": "role",
            "reward_value": "TEST_to_delete_999",
            "reward_name": "TEST_To Delete"
        }
        create_response = requests.post(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/level-rewards", 
                                       json=reward_data, headers=headers)
        assert create_response.status_code == 200
        reward_id = create_response.json()["id"]
        
        # Delete it
        delete_response = requests.delete(
            f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/level-rewards/{reward_id}",
            headers=headers
        )
        assert delete_response.status_code == 200, f"Failed to delete reward: {delete_response.text}"
        
        # Verify deletion
        list_response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/level-rewards", 
                                    headers=headers)
        list_data = list_response.json()
        found = any(r.get("id") == reward_id for r in list_data["rewards"])
        assert not found, "Deleted reward still exists"
        
    def test_delete_nonexistent_reward(self, auth_token):
        """Test deleting a non-existent reward returns 404"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.delete(
            f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/level-rewards/nonexistent-id-xyz",
            headers=headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestVoiceStatsAPI:
    """Test Voice XP Stats API endpoints"""
    
    def test_get_voice_stats(self, auth_token):
        """Test getting voice XP statistics"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/voice-stats", 
                               headers=headers)
        assert response.status_code == 200, f"Failed to get voice stats: {response.text}"
        data = response.json()
        
        # Verify structure
        assert "total_sessions" in data, "total_sessions not in response"
        assert "active_sessions" in data, "active_sessions not in response"
        assert isinstance(data["total_sessions"], int), "total_sessions should be int"
        assert isinstance(data["active_sessions"], int), "active_sessions should be int"
        
    def test_list_voice_sessions(self, auth_token):
        """Test listing active voice sessions"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/voice-sessions", 
                               headers=headers)
        assert response.status_code == 200, f"Failed to list voice sessions: {response.text}"
        data = response.json()
        assert "sessions" in data, "sessions not in response"
        assert isinstance(data["sessions"], list), "sessions should be a list"


class TestVoiceXPConfig:
    """Test Voice XP configuration in guild settings"""
    
    def test_update_voice_xp_settings(self, auth_token):
        """Test updating voice XP configuration"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        update_data = {
            "voice_xp_enabled": True,
            "voice_xp_per_minute": 10,
            "voice_xp_min_users": 3,
            "voice_afk_channel": "123456789"
        }
        response = requests.put(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}", 
                               json=update_data, headers=headers)
        assert response.status_code == 200, f"Failed to update voice XP config: {response.text}"
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}", headers=headers)
        assert get_response.status_code == 200
        data = get_response.json()
        assert data.get("voice_xp_enabled") == True
        assert data.get("voice_xp_per_minute") == 10
        assert data.get("voice_xp_min_users") == 3


class TestBotAppearanceConfig:
    """Test Bot Appearance configuration in guild settings"""
    
    def test_update_bot_appearance(self, auth_token):
        """Test updating bot appearance settings"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        update_data = {
            "bot_status": "online",
            "bot_activity_type": "playing",
            "bot_activity_text": "mit /help starten",
            "bot_embed_color": "#5865F2"
        }
        response = requests.put(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}", 
                               json=update_data, headers=headers)
        assert response.status_code == 200, f"Failed to update bot appearance: {response.text}"
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}", headers=headers)
        assert get_response.status_code == 200
        data = get_response.json()
        assert data.get("bot_status") == "online"
        assert data.get("bot_activity_type") == "playing"
        assert data.get("bot_activity_text") == "mit /help starten"
        assert data.get("bot_embed_color") == "#5865F2"
        
    def test_update_bot_status_options(self, auth_token):
        """Test different bot status options"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Test idle status
        response = requests.put(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}", 
                               json={"bot_status": "idle"}, headers=headers)
        assert response.status_code == 200
        
        # Test dnd status
        response = requests.put(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}", 
                               json={"bot_status": "dnd"}, headers=headers)
        assert response.status_code == 200
        
        # Reset to online
        response = requests.put(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}", 
                               json={"bot_status": "online"}, headers=headers)
        assert response.status_code == 200


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_level_rewards(self, auth_token):
        """Clean up TEST_ prefixed level rewards"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        list_response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/level-rewards", 
                                    headers=headers)
        if list_response.status_code == 200:
            list_data = list_response.json()
            for reward in list_data.get("rewards", []):
                if reward.get("reward_value", "").startswith("TEST_") or \
                   reward.get("reward_name", "").startswith("TEST_"):
                    requests.delete(
                        f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/level-rewards/{reward['id']}",
                        headers=headers
                    )
        assert True  # Cleanup always passes


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

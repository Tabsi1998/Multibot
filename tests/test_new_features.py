"""
Test suite for new Discord Bot Dashboard features:
- Temp Channels API
- Reaction Roles API
- Games API
- Authentication flow
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TEST_GUILD_ID = "807292920734547969"
TEST_EMAIL = "admin@test.de"
TEST_PASSWORD = "admin123"


class TestAuthentication:
    """Test authentication endpoints"""
    
    def test_login_success(self):
        """Test successful login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Token not in response"
        assert "user" in data, "User not in response"
        assert data["user"]["email"] == TEST_EMAIL
        
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@test.de",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestGuildConfig:
    """Test guild configuration endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_get_guild_config(self, auth_token):
        """Test getting guild configuration"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}", headers=headers)
        assert response.status_code == 200, f"Failed to get guild config: {response.text}"
        data = response.json()
        # Verify temp channel config fields exist
        assert "temp_channels_enabled" in data
        assert "temp_channel_category" in data
        assert "temp_channel_creator" in data
        # Verify games config fields exist
        assert "games_enabled" in data
        
    def test_update_guild_config_temp_channels(self, auth_token):
        """Test updating temp channel configuration"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        update_data = {
            "temp_channels_enabled": True,
            "temp_channel_category": "123456789",
            "temp_channel_creator": "987654321"
        }
        response = requests.put(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}", 
                               json=update_data, headers=headers)
        assert response.status_code == 200, f"Failed to update config: {response.text}"
        
        # Verify the update persisted
        get_response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}", headers=headers)
        assert get_response.status_code == 200
        data = get_response.json()
        assert data["temp_channels_enabled"] == True
        assert data["temp_channel_category"] == "123456789"
        
    def test_update_guild_config_games(self, auth_token):
        """Test updating games configuration"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        update_data = {
            "games_enabled": True,
            "games_channel": "111222333"
        }
        response = requests.put(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}", 
                               json=update_data, headers=headers)
        assert response.status_code == 200, f"Failed to update games config: {response.text}"


class TestTempChannelsAPI:
    """Test Temp Channels API endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_list_temp_channels(self, auth_token):
        """Test listing temp channels"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/temp-channels", 
                               headers=headers)
        assert response.status_code == 200, f"Failed to list temp channels: {response.text}"
        data = response.json()
        assert "channels" in data
        assert isinstance(data["channels"], list)
        
    def test_delete_nonexistent_temp_channel(self, auth_token):
        """Test deleting a non-existent temp channel"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.delete(
            f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/temp-channels/nonexistent123",
            headers=headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestReactionRolesAPI:
    """Test Reaction Roles API endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_list_reaction_roles(self, auth_token):
        """Test listing reaction roles"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/reaction-roles", 
                               headers=headers)
        assert response.status_code == 200, f"Failed to list reaction roles: {response.text}"
        data = response.json()
        assert "reaction_roles" in data
        assert isinstance(data["reaction_roles"], list)
        
    def test_create_reaction_role(self, auth_token):
        """Test creating a reaction role"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        rr_data = {
            "title": "TEST_Reaction Role",
            "description": "Test description",
            "channel_id": "123456789",
            "type": "button",
            "roles": [
                {"emoji": "🎮", "role_id": "111222333", "label": "Gamer"}
            ],
            "color": "#5865F2"
        }
        response = requests.post(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/reaction-roles", 
                                json=rr_data, headers=headers)
        assert response.status_code == 200, f"Failed to create reaction role: {response.text}"
        data = response.json()
        assert "created" in data
        assert data["created"] >= 1
        
        # Verify it was created by listing
        list_response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/reaction-roles", 
                                    headers=headers)
        assert list_response.status_code == 200
        list_data = list_response.json()
        # Find our created reaction role
        found = any(rr.get("title") == "TEST_Reaction Role" for rr in list_data["reaction_roles"])
        assert found, "Created reaction role not found in list"
        
    def test_delete_reaction_role(self, auth_token):
        """Test deleting a reaction role"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # First create one to delete
        rr_data = {
            "title": "TEST_To Delete",
            "description": "Will be deleted",
            "channel_id": "123456789",
            "type": "reaction",
            "roles": [
                {"emoji": "❌", "role_id": "999888777", "label": "Delete Me"}
            ],
            "color": "#DA373C"
        }
        create_response = requests.post(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/reaction-roles", 
                                       json=rr_data, headers=headers)
        assert create_response.status_code == 200
        
        # Get the ID of the created reaction role
        list_response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/reaction-roles", 
                                    headers=headers)
        list_data = list_response.json()
        rr_to_delete = next((rr for rr in list_data["reaction_roles"] 
                           if rr.get("title") == "TEST_To Delete"), None)
        
        if rr_to_delete:
            # Delete it
            delete_response = requests.delete(
                f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/reaction-roles/{rr_to_delete['id']}",
                headers=headers
            )
            assert delete_response.status_code == 200, f"Failed to delete: {delete_response.text}"
            
    def test_delete_nonexistent_reaction_role(self, auth_token):
        """Test deleting a non-existent reaction role"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.delete(
            f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/reaction-roles/nonexistent-id-123",
            headers=headers
        )
        assert response.status_code == 404


class TestGamesAPI:
    """Test Games API endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_list_active_games(self, auth_token):
        """Test listing active games"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/games", 
                               headers=headers)
        assert response.status_code == 200, f"Failed to list games: {response.text}"
        data = response.json()
        assert "games" in data
        assert isinstance(data["games"], list)
        
    def test_get_game_stats(self, auth_token):
        """Test getting game statistics"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/games/stats", 
                               headers=headers)
        assert response.status_code == 200, f"Failed to get game stats: {response.text}"
        data = response.json()
        assert "total_games" in data
        assert isinstance(data["total_games"], int)


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_cleanup_test_reaction_roles(self, auth_token):
        """Clean up TEST_ prefixed reaction roles"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        list_response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/reaction-roles", 
                                    headers=headers)
        if list_response.status_code == 200:
            list_data = list_response.json()
            for rr in list_data.get("reaction_roles", []):
                if rr.get("title", "").startswith("TEST_"):
                    requests.delete(
                        f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/reaction-roles/{rr['id']}",
                        headers=headers
                    )
        assert True  # Cleanup always passes


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

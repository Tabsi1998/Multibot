"""
Iteration 7 Backend API Tests
Testing: Login, Reaction Roles (CRUD + PUT), Ticket Panels (CRUD + PUT), 
Temp Creators (CRUD + PUT), Guild Config with disabled_games
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "admin@test.de"
TEST_PASSWORD = "admin123"
GUILD_ID = "807292920734547969"


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
        print(f"✓ Login successful, token received")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@test.de",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ Invalid login correctly rejected with 401")


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
    return {"Authorization": f"Bearer {auth_token}"}


class TestReactionRolesAPI:
    """Reaction Roles CRUD + PUT tests"""
    
    def test_get_reaction_roles(self, auth_headers):
        """Test GET /api/guilds/{guildId}/reaction-roles"""
        response = requests.get(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/reaction-roles",
            headers=auth_headers
        )
        assert response.status_code == 200, f"GET failed: {response.text}"
        data = response.json()
        assert "reaction_roles" in data
        assert isinstance(data["reaction_roles"], list)
        print(f"✓ GET reaction-roles: {len(data['reaction_roles'])} items")
    
    def test_create_reaction_role(self, auth_headers):
        """Test POST /api/guilds/{guildId}/reaction-roles"""
        payload = {
            "title": "TEST_Reaction Role",
            "description": "Test description for reaction role",
            "channel_id": "123456789012345678",
            "type": "button",
            "roles": [
                {"emoji": "🎮", "role_id": "111111111111111111", "label": "Gamer"}
            ],
            "color": "#5865F2"
        }
        response = requests.post(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/reaction-roles",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200, f"POST failed: {response.text}"
        data = response.json()
        assert "created" in data
        assert data["created"] >= 1
        print(f"✓ POST reaction-role created: {data['created']} items")
        return data
    
    def test_update_reaction_role(self, auth_headers):
        """Test PUT /api/guilds/{guildId}/reaction-roles/{rr_id}"""
        # First create a reaction role
        create_payload = {
            "title": "TEST_Update RR",
            "description": "Original description",
            "channel_id": "123456789012345678",
            "type": "button",
            "roles": [{"emoji": "🔥", "role_id": "222222222222222222"}],
            "color": "#FF0000"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/reaction-roles",
            json=create_payload,
            headers=auth_headers
        )
        assert create_response.status_code == 200
        created_data = create_response.json()
        
        # Get the ID of created reaction role
        rr_id = created_data.get("reaction_roles", [{}])[0].get("id")
        if not rr_id:
            pytest.skip("Could not get reaction role ID for update test")
        
        # Update the reaction role
        update_payload = {
            "title": "TEST_Updated Title",
            "description": "Updated description",
            "color": "#00FF00"
        }
        update_response = requests.put(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/reaction-roles/{rr_id}",
            json=update_payload,
            headers=auth_headers
        )
        assert update_response.status_code == 200, f"PUT failed: {update_response.text}"
        data = update_response.json()
        assert data.get("updated") == True
        print(f"✓ PUT reaction-role updated successfully")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/reaction-roles/{rr_id}",
            headers=auth_headers
        )
    
    def test_delete_reaction_role(self, auth_headers):
        """Test DELETE /api/guilds/{guildId}/reaction-roles/{rr_id}"""
        # First create a reaction role to delete
        create_payload = {
            "title": "TEST_Delete RR",
            "description": "To be deleted",
            "channel_id": "123456789012345678",
            "type": "button",
            "roles": [{"emoji": "❌", "role_id": "333333333333333333"}],
            "color": "#DA373C"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/reaction-roles",
            json=create_payload,
            headers=auth_headers
        )
        assert create_response.status_code == 200
        created_data = create_response.json()
        rr_id = created_data.get("reaction_roles", [{}])[0].get("id")
        
        if not rr_id:
            pytest.skip("Could not get reaction role ID for delete test")
        
        # Delete the reaction role
        delete_response = requests.delete(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/reaction-roles/{rr_id}",
            headers=auth_headers
        )
        assert delete_response.status_code == 200, f"DELETE failed: {delete_response.text}"
        data = delete_response.json()
        assert data.get("deleted") == True
        print(f"✓ DELETE reaction-role successful")
    
    def test_delete_nonexistent_reaction_role(self, auth_headers):
        """Test DELETE with nonexistent ID returns 404"""
        response = requests.delete(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/reaction-roles/nonexistent-id-12345",
            headers=auth_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ DELETE nonexistent reaction-role returns 404")


class TestTicketPanelsAPI:
    """Ticket Panels CRUD + PUT tests"""
    
    def test_get_ticket_panels(self, auth_headers):
        """Test GET /api/guilds/{guildId}/ticket-panels"""
        response = requests.get(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/ticket-panels",
            headers=auth_headers
        )
        assert response.status_code == 200, f"GET failed: {response.text}"
        data = response.json()
        assert "panels" in data
        assert isinstance(data["panels"], list)
        print(f"✓ GET ticket-panels: {len(data['panels'])} items")
    
    def test_create_ticket_panel(self, auth_headers):
        """Test POST /api/guilds/{guildId}/ticket-panels"""
        payload = {
            "channel_id": "123456789012345678",
            "title": "TEST_Support Tickets",
            "description": "Test ticket panel description",
            "color": "#5865F2",
            "button_label": "Create Ticket",
            "button_emoji": "🎫",
            "ticket_category": "987654321098765432",
            "ticket_name_template": "ticket-{number}",
            "categories": [
                {"name": "General", "emoji": "📋", "description": "General support"}
            ],
            "custom_fields": [
                {"label": "Issue", "type": "text", "required": True}
            ],
            "support_roles": ["111111111111111111"],
            "ping_roles": ["222222222222222222"],
            "claim_enabled": True,
            "transcript_enabled": True
        }
        response = requests.post(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/ticket-panels",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200, f"POST failed: {response.text}"
        data = response.json()
        assert "id" in data
        print(f"✓ POST ticket-panel created with ID: {data['id']}")
        return data
    
    def test_update_ticket_panel(self, auth_headers):
        """Test PUT /api/guilds/{guildId}/ticket-panels/{panel_id}"""
        # First create a panel
        create_payload = {
            "channel_id": "123456789012345678",
            "title": "TEST_Update Panel",
            "description": "Original description",
            "color": "#FF0000"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/ticket-panels",
            json=create_payload,
            headers=auth_headers
        )
        assert create_response.status_code == 200
        panel_id = create_response.json().get("id")
        
        if not panel_id:
            pytest.skip("Could not get panel ID for update test")
        
        # Update the panel
        update_payload = {
            "title": "TEST_Updated Panel Title",
            "description": "Updated description",
            "color": "#00FF00",
            "claim_enabled": False
        }
        update_response = requests.put(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/ticket-panels/{panel_id}",
            json=update_payload,
            headers=auth_headers
        )
        assert update_response.status_code == 200, f"PUT failed: {update_response.text}"
        data = update_response.json()
        assert data.get("success") == True
        print(f"✓ PUT ticket-panel updated successfully")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/ticket-panels/{panel_id}",
            headers=auth_headers
        )
    
    def test_delete_ticket_panel(self, auth_headers):
        """Test DELETE /api/guilds/{guildId}/ticket-panels/{panel_id}"""
        # First create a panel to delete
        create_payload = {
            "channel_id": "123456789012345678",
            "title": "TEST_Delete Panel",
            "description": "To be deleted"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/ticket-panels",
            json=create_payload,
            headers=auth_headers
        )
        assert create_response.status_code == 200
        panel_id = create_response.json().get("id")
        
        if not panel_id:
            pytest.skip("Could not get panel ID for delete test")
        
        # Delete the panel
        delete_response = requests.delete(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/ticket-panels/{panel_id}",
            headers=auth_headers
        )
        assert delete_response.status_code == 200, f"DELETE failed: {delete_response.text}"
        data = delete_response.json()
        assert data.get("deleted") == True
        print(f"✓ DELETE ticket-panel successful")
    
    def test_delete_nonexistent_panel(self, auth_headers):
        """Test DELETE with nonexistent ID returns 404"""
        response = requests.delete(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/ticket-panels/nonexistent-id-12345",
            headers=auth_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ DELETE nonexistent panel returns 404")


class TestTempCreatorsAPI:
    """Temp Voice Creators CRUD + PUT tests"""
    
    def test_get_temp_creators(self, auth_headers):
        """Test GET /api/guilds/{guildId}/temp-creators"""
        response = requests.get(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/temp-creators",
            headers=auth_headers
        )
        assert response.status_code == 200, f"GET failed: {response.text}"
        data = response.json()
        assert "creators" in data
        assert isinstance(data["creators"], list)
        print(f"✓ GET temp-creators: {len(data['creators'])} items")
    
    def test_create_temp_creator(self, auth_headers):
        """Test POST /api/guilds/{guildId}/temp-creators"""
        payload = {
            "channel_id": "123456789012345678",
            "category_id": "987654321098765432",
            "name_template": "🔊 TEST_{user}'s Kanal",
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
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200, f"POST failed: {response.text}"
        data = response.json()
        assert "id" in data
        print(f"✓ POST temp-creator created with ID: {data['id']}")
        return data
    
    def test_update_temp_creator(self, auth_headers):
        """Test PUT /api/guilds/{guildId}/temp-creators/{creator_id}"""
        # First create a creator
        create_payload = {
            "channel_id": "123456789012345678",
            "name_template": "🔊 TEST_Update {user}",
            "numbering_type": "number"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/temp-creators",
            json=create_payload,
            headers=auth_headers
        )
        assert create_response.status_code == 200
        creator_id = create_response.json().get("id")
        
        if not creator_id:
            pytest.skip("Could not get creator ID for update test")
        
        # Update the creator
        update_payload = {
            "name_template": "🔊 TEST_Updated {user}",
            "numbering_type": "letter",
            "position": "top",
            "default_limit": 10,
            "allow_rename": False
        }
        update_response = requests.put(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/temp-creators/{creator_id}",
            json=update_payload,
            headers=auth_headers
        )
        assert update_response.status_code == 200, f"PUT failed: {update_response.text}"
        data = update_response.json()
        assert data.get("success") == True
        print(f"✓ PUT temp-creator updated successfully")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/temp-creators/{creator_id}",
            headers=auth_headers
        )
    
    def test_delete_temp_creator(self, auth_headers):
        """Test DELETE /api/guilds/{guildId}/temp-creators/{creator_id}"""
        # First create a creator to delete
        create_payload = {
            "channel_id": "123456789012345678",
            "name_template": "🔊 TEST_Delete {user}"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/temp-creators",
            json=create_payload,
            headers=auth_headers
        )
        assert create_response.status_code == 200
        creator_id = create_response.json().get("id")
        
        if not creator_id:
            pytest.skip("Could not get creator ID for delete test")
        
        # Delete the creator
        delete_response = requests.delete(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/temp-creators/{creator_id}",
            headers=auth_headers
        )
        assert delete_response.status_code == 200, f"DELETE failed: {delete_response.text}"
        data = delete_response.json()
        assert data.get("deleted") == True
        print(f"✓ DELETE temp-creator successful")
    
    def test_delete_nonexistent_creator(self, auth_headers):
        """Test DELETE with nonexistent ID returns 404"""
        response = requests.delete(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/temp-creators/nonexistent-id-12345",
            headers=auth_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ DELETE nonexistent creator returns 404")


class TestGuildConfigGames:
    """Guild Config with disabled_games array tests"""
    
    def test_get_guild_config(self, auth_headers):
        """Test GET /api/guilds/{guildId}"""
        response = requests.get(
            f"{BASE_URL}/api/guilds/{GUILD_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"GET failed: {response.text}"
        data = response.json()
        assert "guild_id" in data
        print(f"✓ GET guild config successful")
    
    def test_update_guild_config_disabled_games(self, auth_headers):
        """Test PUT /api/guilds/{guildId} with disabled_games array"""
        # First get current config
        get_response = requests.get(
            f"{BASE_URL}/api/guilds/{GUILD_ID}",
            headers=auth_headers
        )
        original_disabled = get_response.json().get("disabled_games", [])
        
        # Update with disabled_games
        update_payload = {
            "disabled_games": ["coinflip", "dice", "8ball"]
        }
        update_response = requests.put(
            f"{BASE_URL}/api/guilds/{GUILD_ID}",
            json=update_payload,
            headers=auth_headers
        )
        assert update_response.status_code == 200, f"PUT failed: {update_response.text}"
        data = update_response.json()
        
        # Verify disabled_games was saved
        assert "disabled_games" in data
        assert "coinflip" in data["disabled_games"]
        assert "dice" in data["disabled_games"]
        assert "8ball" in data["disabled_games"]
        print(f"✓ PUT guild config with disabled_games successful")
        
        # Restore original
        requests.put(
            f"{BASE_URL}/api/guilds/{GUILD_ID}",
            json={"disabled_games": original_disabled},
            headers=auth_headers
        )
    
    def test_update_guild_config_games_enabled(self, auth_headers):
        """Test PUT /api/guilds/{guildId} with games_enabled toggle"""
        update_payload = {
            "games_enabled": False
        }
        update_response = requests.put(
            f"{BASE_URL}/api/guilds/{GUILD_ID}",
            json=update_payload,
            headers=auth_headers
        )
        assert update_response.status_code == 200, f"PUT failed: {update_response.text}"
        data = update_response.json()
        assert data.get("games_enabled") == False
        print(f"✓ PUT guild config games_enabled=False successful")
        
        # Restore
        requests.put(
            f"{BASE_URL}/api/guilds/{GUILD_ID}",
            json={"games_enabled": True},
            headers=auth_headers
        )


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_reaction_roles(self, auth_headers):
        """Clean up TEST_ prefixed reaction roles"""
        response = requests.get(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/reaction-roles",
            headers=auth_headers
        )
        if response.status_code == 200:
            rrs = response.json().get("reaction_roles", [])
            deleted = 0
            for rr in rrs:
                if rr.get("title", "").startswith("TEST_"):
                    requests.delete(
                        f"{BASE_URL}/api/guilds/{GUILD_ID}/reaction-roles/{rr['id']}",
                        headers=auth_headers
                    )
                    deleted += 1
            print(f"✓ Cleaned up {deleted} test reaction roles")
    
    def test_cleanup_test_ticket_panels(self, auth_headers):
        """Clean up TEST_ prefixed ticket panels"""
        response = requests.get(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/ticket-panels",
            headers=auth_headers
        )
        if response.status_code == 200:
            panels = response.json().get("panels", [])
            deleted = 0
            for panel in panels:
                if panel.get("title", "").startswith("TEST_"):
                    requests.delete(
                        f"{BASE_URL}/api/guilds/{GUILD_ID}/ticket-panels/{panel['id']}",
                        headers=auth_headers
                    )
                    deleted += 1
            print(f"✓ Cleaned up {deleted} test ticket panels")
    
    def test_cleanup_test_temp_creators(self, auth_headers):
        """Clean up TEST_ prefixed temp creators"""
        response = requests.get(
            f"{BASE_URL}/api/guilds/{GUILD_ID}/temp-creators",
            headers=auth_headers
        )
        if response.status_code == 200:
            creators = response.json().get("creators", [])
            deleted = 0
            for creator in creators:
                if "TEST_" in creator.get("name_template", ""):
                    requests.delete(
                        f"{BASE_URL}/api/guilds/{GUILD_ID}/temp-creators/{creator['id']}",
                        headers=auth_headers
                    )
                    deleted += 1
            print(f"✓ Cleaned up {deleted} test temp creators")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

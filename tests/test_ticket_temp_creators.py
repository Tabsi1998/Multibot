"""
Test suite for new Discord Bot Dashboard features (Iteration 5):
- Ticket System API (/api/guilds/{guildId}/ticket-panels, /api/guilds/{guildId}/tickets)
- Multi Temp Voice Creators API (/api/guilds/{guildId}/temp-creators)
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


# ==================== TICKET PANELS API ====================

class TestTicketPanelsAPI:
    """Test Ticket Panels API endpoints"""
    
    def test_list_ticket_panels(self, auth_token):
        """Test listing ticket panels"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/ticket-panels", 
                               headers=headers)
        assert response.status_code == 200, f"Failed to list ticket panels: {response.text}"
        data = response.json()
        assert "panels" in data, "panels not in response"
        assert isinstance(data["panels"], list), "panels should be a list"
        print(f"Found {len(data['panels'])} ticket panels")
        
    def test_create_ticket_panel_basic(self, auth_token):
        """Test creating a basic ticket panel"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        panel_data = {
            "channel_id": "TEST_channel_123456",
            "title": "TEST_Support Tickets",
            "description": "Test ticket panel description",
            "color": "#5865F2",
            "button_label": "Ticket erstellen",
            "button_emoji": "🎫"
        }
        response = requests.post(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/ticket-panels", 
                                json=panel_data, headers=headers)
        assert response.status_code == 200, f"Failed to create ticket panel: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data, "id not in response"
        assert data["title"] == "TEST_Support Tickets", "title mismatch"
        assert data["channel_id"] == "TEST_channel_123456", "channel_id mismatch"
        assert data["color"] == "#5865F2", "color mismatch"
        assert data["claim_enabled"] == True, "claim_enabled should default to True"
        assert data["transcript_enabled"] == True, "transcript_enabled should default to True"
        assert data["ticket_counter"] == 0, "ticket_counter should start at 0"
        
        # Verify persistence
        list_response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/ticket-panels", 
                                    headers=headers)
        assert list_response.status_code == 200
        list_data = list_response.json()
        found = any(p.get("title") == "TEST_Support Tickets" for p in list_data["panels"])
        assert found, "Created panel not found in list"
        
    def test_create_ticket_panel_with_categories(self, auth_token):
        """Test creating a ticket panel with categories"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        panel_data = {
            "channel_id": "TEST_channel_categories",
            "title": "TEST_Panel with Categories",
            "description": "Panel with dropdown categories",
            "categories": [
                {"id": "cat1", "name": "Support", "emoji": "🔧", "description": "General support"},
                {"id": "cat2", "name": "Bug Report", "emoji": "🐛", "description": "Report bugs"},
                {"id": "cat3", "name": "Feature Request", "emoji": "💡", "description": "Request features"}
            ],
            "support_roles": ["role_123", "role_456"],
            "ping_roles": ["role_789"]
        }
        response = requests.post(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/ticket-panels", 
                                json=panel_data, headers=headers)
        assert response.status_code == 200, f"Failed to create panel with categories: {response.text}"
        data = response.json()
        
        assert len(data["categories"]) == 3, "Should have 3 categories"
        assert data["categories"][0]["name"] == "Support", "First category name mismatch"
        assert len(data["support_roles"]) == 2, "Should have 2 support roles"
        assert len(data["ping_roles"]) == 1, "Should have 1 ping role"
        
    def test_create_ticket_panel_with_custom_fields(self, auth_token):
        """Test creating a ticket panel with custom form fields"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        panel_data = {
            "channel_id": "TEST_channel_fields",
            "title": "TEST_Panel with Custom Fields",
            "custom_fields": [
                {"id": "field1", "label": "Dein Name", "type": "text", "required": True},
                {"id": "field2", "label": "Beschreibung", "type": "textarea", "required": True},
                {"id": "field3", "label": "Priorität", "type": "dropdown", "required": False, 
                 "options": ["Niedrig", "Mittel", "Hoch"]}
            ],
            "ticket_name_template": "support-{number}",
            "claim_enabled": False,
            "transcript_enabled": True
        }
        response = requests.post(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/ticket-panels", 
                                json=panel_data, headers=headers)
        assert response.status_code == 200, f"Failed to create panel with fields: {response.text}"
        data = response.json()
        
        assert len(data["custom_fields"]) == 3, "Should have 3 custom fields"
        assert data["custom_fields"][0]["label"] == "Dein Name", "First field label mismatch"
        assert data["custom_fields"][2]["type"] == "dropdown", "Third field type mismatch"
        assert data["claim_enabled"] == False, "claim_enabled should be False"
        assert data["ticket_name_template"] == "support-{number}", "template mismatch"
        
    def test_get_ticket_panel_by_id(self, auth_token):
        """Test getting a specific ticket panel"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # First get list to find a panel ID
        list_response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/ticket-panels", 
                                    headers=headers)
        list_data = list_response.json()
        test_panels = [p for p in list_data.get("panels", []) 
                      if p.get("title", "").startswith("TEST_")]
        
        if test_panels:
            panel_id = test_panels[0]["id"]
            response = requests.get(
                f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/ticket-panels/{panel_id}",
                headers=headers
            )
            assert response.status_code == 200, f"Failed to get panel: {response.text}"
            data = response.json()
            assert data["id"] == panel_id, "Panel ID mismatch"
        else:
            pytest.skip("No test panels to get")
            
    def test_update_ticket_panel(self, auth_token):
        """Test updating a ticket panel"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # First get list to find a panel ID
        list_response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/ticket-panels", 
                                    headers=headers)
        list_data = list_response.json()
        test_panels = [p for p in list_data.get("panels", []) 
                      if p.get("title", "").startswith("TEST_")]
        
        if test_panels:
            panel_id = test_panels[0]["id"]
            update_data = {
                "title": "TEST_Updated Title",
                "description": "Updated description"
            }
            response = requests.put(
                f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/ticket-panels/{panel_id}",
                json=update_data, headers=headers
            )
            assert response.status_code == 200, f"Failed to update panel: {response.text}"
            
            # Verify update
            get_response = requests.get(
                f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/ticket-panels/{panel_id}",
                headers=headers
            )
            assert get_response.status_code == 200
            data = get_response.json()
            assert data["title"] == "TEST_Updated Title", "Title not updated"
        else:
            pytest.skip("No test panels to update")
            
    def test_delete_ticket_panel(self, auth_token):
        """Test deleting a ticket panel"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create one to delete
        panel_data = {
            "channel_id": "TEST_to_delete",
            "title": "TEST_To Delete Panel"
        }
        create_response = requests.post(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/ticket-panels", 
                                       json=panel_data, headers=headers)
        assert create_response.status_code == 200
        panel_id = create_response.json()["id"]
        
        # Delete it
        delete_response = requests.delete(
            f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/ticket-panels/{panel_id}",
            headers=headers
        )
        assert delete_response.status_code == 200, f"Failed to delete panel: {delete_response.text}"
        
        # Verify deletion
        get_response = requests.get(
            f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/ticket-panels/{panel_id}",
            headers=headers
        )
        assert get_response.status_code == 404, "Deleted panel should return 404"
        
    def test_delete_nonexistent_panel(self, auth_token):
        """Test deleting a non-existent panel returns 404"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.delete(
            f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/ticket-panels/nonexistent-panel-xyz",
            headers=headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


# ==================== TICKETS API ====================

class TestTicketsAPI:
    """Test Tickets API endpoints"""
    
    def test_list_tickets(self, auth_token):
        """Test listing tickets"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/tickets", 
                               headers=headers)
        assert response.status_code == 200, f"Failed to list tickets: {response.text}"
        data = response.json()
        assert "tickets" in data, "tickets not in response"
        assert isinstance(data["tickets"], list), "tickets should be a list"
        
    def test_list_tickets_by_status(self, auth_token):
        """Test listing tickets filtered by status"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Test open tickets
        response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/tickets?status=open", 
                               headers=headers)
        assert response.status_code == 200, f"Failed to list open tickets: {response.text}"
        
        # Test closed tickets
        response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/tickets?status=closed", 
                               headers=headers)
        assert response.status_code == 200, f"Failed to list closed tickets: {response.text}"
        
    def test_get_ticket_stats(self, auth_token):
        """Test getting ticket statistics"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/tickets/stats", 
                               headers=headers)
        assert response.status_code == 200, f"Failed to get ticket stats: {response.text}"
        data = response.json()
        
        # Verify structure
        assert "open" in data, "open count not in response"
        assert "claimed" in data, "claimed count not in response"
        assert "closed" in data, "closed count not in response"
        assert "total" in data, "total count not in response"
        
        # Verify types
        assert isinstance(data["open"], int), "open should be int"
        assert isinstance(data["claimed"], int), "claimed should be int"
        assert isinstance(data["closed"], int), "closed should be int"
        assert isinstance(data["total"], int), "total should be int"
        
        print(f"Ticket stats: open={data['open']}, claimed={data['claimed']}, closed={data['closed']}, total={data['total']}")


# ==================== TEMP VOICE CREATORS API ====================

class TestTempCreatorsAPI:
    """Test Multi Temp Voice Creators API endpoints"""
    
    def test_list_temp_creators(self, auth_token):
        """Test listing temp voice creators"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/temp-creators", 
                               headers=headers)
        assert response.status_code == 200, f"Failed to list temp creators: {response.text}"
        data = response.json()
        assert "creators" in data, "creators not in response"
        assert isinstance(data["creators"], list), "creators should be a list"
        print(f"Found {len(data['creators'])} temp creators")
        
    def test_create_temp_creator_basic(self, auth_token):
        """Test creating a basic temp voice creator"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        creator_data = {
            "channel_id": "TEST_voice_channel_123",
            "name_template": "🔊 {user}'s Kanal",
            "numbering_type": "number",
            "position": "bottom"
        }
        response = requests.post(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/temp-creators", 
                                json=creator_data, headers=headers)
        assert response.status_code == 200, f"Failed to create temp creator: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data, "id not in response"
        assert data["channel_id"] == "TEST_voice_channel_123", "channel_id mismatch"
        assert data["numbering_type"] == "number", "numbering_type mismatch"
        assert data["position"] == "bottom", "position mismatch"
        assert data["enabled"] == True, "enabled should default to True"
        assert data["channel_counter"] == 0, "channel_counter should start at 0"
        
        # Verify default permissions
        assert data["allow_rename"] == True, "allow_rename should default to True"
        assert data["allow_limit"] == True, "allow_limit should default to True"
        assert data["allow_lock"] == True, "allow_lock should default to True"
        
    def test_create_temp_creator_letter_numbering(self, auth_token):
        """Test creating a temp creator with letter numbering"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        creator_data = {
            "channel_id": "TEST_voice_letter",
            "name_template": "🎮 Gaming {number}",
            "numbering_type": "letter",
            "position": "top",
            "default_limit": 5,
            "default_bitrate": 96000
        }
        response = requests.post(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/temp-creators", 
                                json=creator_data, headers=headers)
        assert response.status_code == 200, f"Failed to create letter creator: {response.text}"
        data = response.json()
        
        assert data["numbering_type"] == "letter", "numbering_type should be letter"
        assert data["position"] == "top", "position should be top"
        assert data["default_limit"] == 5, "default_limit mismatch"
        assert data["default_bitrate"] == 96000, "default_bitrate mismatch"
        
    def test_create_temp_creator_superscript(self, auth_token):
        """Test creating a temp creator with superscript numbering"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        creator_data = {
            "channel_id": "TEST_voice_superscript",
            "name_template": "🎵 Music {number}",
            "numbering_type": "superscript"
        }
        response = requests.post(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/temp-creators", 
                                json=creator_data, headers=headers)
        assert response.status_code == 200, f"Failed to create superscript creator: {response.text}"
        data = response.json()
        assert data["numbering_type"] == "superscript"
        
    def test_create_temp_creator_subscript(self, auth_token):
        """Test creating a temp creator with subscript numbering"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        creator_data = {
            "channel_id": "TEST_voice_subscript",
            "name_template": "📺 Stream {number}",
            "numbering_type": "subscript"
        }
        response = requests.post(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/temp-creators", 
                                json=creator_data, headers=headers)
        assert response.status_code == 200, f"Failed to create subscript creator: {response.text}"
        data = response.json()
        assert data["numbering_type"] == "subscript"
        
    def test_create_temp_creator_roman(self, auth_token):
        """Test creating a temp creator with roman numeral numbering"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        creator_data = {
            "channel_id": "TEST_voice_roman",
            "name_template": "⚔️ Battle {number}",
            "numbering_type": "roman"
        }
        response = requests.post(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/temp-creators", 
                                json=creator_data, headers=headers)
        assert response.status_code == 200, f"Failed to create roman creator: {response.text}"
        data = response.json()
        assert data["numbering_type"] == "roman"
        
    def test_create_temp_creator_custom_permissions(self, auth_token):
        """Test creating a temp creator with custom permissions"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        creator_data = {
            "channel_id": "TEST_voice_perms",
            "name_template": "🔒 Private {number}",
            "allow_rename": False,
            "allow_limit": True,
            "allow_lock": True,
            "allow_hide": False,
            "allow_kick": True,
            "allow_permit": True,
            "allow_bitrate": False
        }
        response = requests.post(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/temp-creators", 
                                json=creator_data, headers=headers)
        assert response.status_code == 200, f"Failed to create perms creator: {response.text}"
        data = response.json()
        
        assert data["allow_rename"] == False, "allow_rename should be False"
        assert data["allow_hide"] == False, "allow_hide should be False"
        assert data["allow_bitrate"] == False, "allow_bitrate should be False"
        assert data["allow_lock"] == True, "allow_lock should be True"
        
    def test_get_temp_creator_by_id(self, auth_token):
        """Test getting a specific temp creator"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # First get list to find a creator ID
        list_response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/temp-creators", 
                                    headers=headers)
        list_data = list_response.json()
        test_creators = [c for c in list_data.get("creators", []) 
                        if c.get("channel_id", "").startswith("TEST_")]
        
        if test_creators:
            creator_id = test_creators[0]["id"]
            response = requests.get(
                f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/temp-creators/{creator_id}",
                headers=headers
            )
            assert response.status_code == 200, f"Failed to get creator: {response.text}"
            data = response.json()
            assert data["id"] == creator_id, "Creator ID mismatch"
        else:
            pytest.skip("No test creators to get")
            
    def test_update_temp_creator(self, auth_token):
        """Test updating a temp creator"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # First get list to find a creator ID
        list_response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/temp-creators", 
                                    headers=headers)
        list_data = list_response.json()
        test_creators = [c for c in list_data.get("creators", []) 
                        if c.get("channel_id", "").startswith("TEST_")]
        
        if test_creators:
            creator_id = test_creators[0]["id"]
            update_data = {
                "name_template": "🔊 Updated {user}'s Channel",
                "default_limit": 10,
                "enabled": False
            }
            response = requests.put(
                f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/temp-creators/{creator_id}",
                json=update_data, headers=headers
            )
            assert response.status_code == 200, f"Failed to update creator: {response.text}"
            
            # Verify update
            get_response = requests.get(
                f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/temp-creators/{creator_id}",
                headers=headers
            )
            assert get_response.status_code == 200
            data = get_response.json()
            assert data["name_template"] == "🔊 Updated {user}'s Channel", "Template not updated"
            assert data["default_limit"] == 10, "Limit not updated"
            assert data["enabled"] == False, "Enabled not updated"
        else:
            pytest.skip("No test creators to update")
            
    def test_delete_temp_creator(self, auth_token):
        """Test deleting a temp creator"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create one to delete
        creator_data = {
            "channel_id": "TEST_to_delete_creator",
            "name_template": "🗑️ To Delete"
        }
        create_response = requests.post(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/temp-creators", 
                                       json=creator_data, headers=headers)
        assert create_response.status_code == 200
        creator_id = create_response.json()["id"]
        
        # Delete it
        delete_response = requests.delete(
            f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/temp-creators/{creator_id}",
            headers=headers
        )
        assert delete_response.status_code == 200, f"Failed to delete creator: {delete_response.text}"
        
        # Verify deletion
        get_response = requests.get(
            f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/temp-creators/{creator_id}",
            headers=headers
        )
        assert get_response.status_code == 404, "Deleted creator should return 404"
        
    def test_delete_nonexistent_creator(self, auth_token):
        """Test deleting a non-existent creator returns 404"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.delete(
            f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/temp-creators/nonexistent-creator-xyz",
            headers=headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


# ==================== NUMBERING FUNCTION TEST ====================

class TestNumberingFunction:
    """Test the get_numbering function in database.py"""
    
    def test_numbering_via_api(self, auth_token):
        """Verify numbering types work by creating creators with each type"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        numbering_types = ["number", "letter", "superscript", "subscript", "roman"]
        
        for num_type in numbering_types:
            creator_data = {
                "channel_id": f"TEST_numbering_{num_type}",
                "name_template": f"Test {num_type} {{number}}",
                "numbering_type": num_type
            }
            response = requests.post(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/temp-creators", 
                                    json=creator_data, headers=headers)
            assert response.status_code == 200, f"Failed to create {num_type} creator: {response.text}"
            data = response.json()
            assert data["numbering_type"] == num_type, f"numbering_type mismatch for {num_type}"


# ==================== CLEANUP ====================

class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_ticket_panels(self, auth_token):
        """Clean up TEST_ prefixed ticket panels"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        list_response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/ticket-panels", 
                                    headers=headers)
        if list_response.status_code == 200:
            list_data = list_response.json()
            deleted_count = 0
            for panel in list_data.get("panels", []):
                if panel.get("title", "").startswith("TEST_") or \
                   panel.get("channel_id", "").startswith("TEST_"):
                    requests.delete(
                        f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/ticket-panels/{panel['id']}",
                        headers=headers
                    )
                    deleted_count += 1
            print(f"Cleaned up {deleted_count} test ticket panels")
        assert True  # Cleanup always passes
        
    def test_cleanup_test_temp_creators(self, auth_token):
        """Clean up TEST_ prefixed temp creators"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        list_response = requests.get(f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/temp-creators", 
                                    headers=headers)
        if list_response.status_code == 200:
            list_data = list_response.json()
            deleted_count = 0
            for creator in list_data.get("creators", []):
                if creator.get("channel_id", "").startswith("TEST_") or \
                   creator.get("name_template", "").startswith("TEST_"):
                    requests.delete(
                        f"{BASE_URL}/api/guilds/{TEST_GUILD_ID}/temp-creators/{creator['id']}",
                        headers=headers
                    )
                    deleted_count += 1
            print(f"Cleaned up {deleted_count} test temp creators")
        assert True  # Cleanup always passes


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

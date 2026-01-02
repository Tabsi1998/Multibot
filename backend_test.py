import requests
import sys
import json
from datetime import datetime

class DiscordBotAPITester:
    def __init__(self, base_url="https://multichat-manager.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_guild_id = "123456789012345678"  # Test guild ID

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            return success, response.json() if response.text and response.status_code < 500 else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_bot_status(self):
        """Test bot status endpoint"""
        return self.run_test("Bot Status", "GET", "bot/status", 200)

    def test_bot_configure(self):
        """Test bot configuration"""
        config_data = {
            "discord_token": "test_token_123",
            "openai_api_key": "test_openai_key"
        }
        return self.run_test("Bot Configure", "POST", "bot/configure", 200, data=config_data)

    def test_bot_start(self):
        """Test bot start (will likely fail without valid token)"""
        return self.run_test("Bot Start", "POST", "bot/start", 400)  # Expect 400 due to invalid token

    def test_bot_stop(self):
        """Test bot stop"""
        return self.run_test("Bot Stop", "POST", "bot/stop", 200)

    def test_list_guilds(self):
        """Test listing guilds"""
        return self.run_test("List Guilds", "GET", "guilds", 200)

    def test_get_guild_config(self):
        """Test getting guild configuration"""
        return self.run_test("Get Guild Config", "GET", f"guilds/{self.test_guild_id}", 200)

    def test_update_guild_config(self):
        """Test updating guild configuration"""
        update_data = {
            "language": "de",
            "prefix": "!",
            "warn_threshold": 3,
            "warn_action": "mute",
            "leveling_enabled": True,
            "xp_per_message": 15
        }
        return self.run_test("Update Guild Config", "PUT", f"guilds/{self.test_guild_id}", 200, data=update_data)

    def test_guild_stats(self):
        """Test getting guild statistics"""
        return self.run_test("Guild Stats", "GET", f"guilds/{self.test_guild_id}/stats", 200)

    def test_guild_warnings(self):
        """Test getting guild warnings"""
        return self.run_test("Guild Warnings", "GET", f"guilds/{self.test_guild_id}/warnings", 200)

    def test_guild_leaderboard(self):
        """Test getting guild leaderboard"""
        return self.run_test("Guild Leaderboard", "GET", f"guilds/{self.test_guild_id}/leaderboard", 200)

    def test_custom_commands(self):
        """Test custom commands CRUD"""
        # List commands
        success1, _ = self.run_test("List Custom Commands", "GET", f"guilds/{self.test_guild_id}/commands", 200)
        
        # Create command
        command_data = {
            "name": "test_command",
            "response": "This is a test command response"
        }
        success2, _ = self.run_test("Create Custom Command", "POST", f"guilds/{self.test_guild_id}/commands", 200, data=command_data)
        
        # Delete command
        success3, _ = self.run_test("Delete Custom Command", "DELETE", f"guilds/{self.test_guild_id}/commands/test_command", 200)
        
        return success1 and success2 and success3

    def test_news_endpoints(self):
        """Test news CRUD operations"""
        # List news
        success1, _ = self.run_test("List News", "GET", f"guilds/{self.test_guild_id}/news", 200)
        
        # Create news
        news_data = {
            "title": "Test News",
            "content": "This is a test news article",
            "scheduled_for": None
        }
        success2, response = self.run_test("Create News", "POST", f"guilds/{self.test_guild_id}/news", 200, data=news_data)
        
        # Delete news if created successfully
        if success2 and response.get('id'):
            success3, _ = self.run_test("Delete News", "DELETE", f"guilds/{self.test_guild_id}/news/{response['id']}", 200)
        else:
            success3 = True  # Skip delete if create failed
        
        return success1 and success2 and success3

    def test_permissions(self):
        """Test permissions endpoints"""
        # Get permissions
        success1, _ = self.run_test("Get Permissions", "GET", f"guilds/{self.test_guild_id}/permissions", 200)
        
        # Update permissions
        permission_data = {
            "command": "test_command",
            "role_ids": ["123456789", "987654321"]
        }
        success2, _ = self.run_test("Update Permissions", "PUT", f"guilds/{self.test_guild_id}/permissions", 200, data=permission_data)
        
        return success1 and success2

    def test_moderation_endpoints(self):
        """Test moderation endpoints"""
        # Get mod logs
        success1, _ = self.run_test("Get Mod Logs", "GET", f"guilds/{self.test_guild_id}/modlogs", 200)
        
        # Clear warnings (should work even if no warnings exist)
        success2, _ = self.run_test("Clear User Warnings", "DELETE", f"guilds/{self.test_guild_id}/warnings/123456789", 200)
        
        return success1 and success2

    def test_user_endpoints(self):
        """Test user-related endpoints"""
        test_user_id = "987654321012345678"
        
        # Get user data
        success1, _ = self.run_test("Get User Data", "GET", f"guilds/{self.test_guild_id}/users/{test_user_id}", 200)
        
        # Update user data
        success2, _ = self.run_test("Update User Data", "PUT", f"guilds/{self.test_guild_id}/users/{test_user_id}?xp=100&level=5", 200)
        
        return success1 and success2

def main():
    print("🚀 Starting Discord Bot API Tests...")
    print("=" * 50)
    
    tester = DiscordBotAPITester()
    
    # Core API tests
    tester.test_root_endpoint()
    tester.test_bot_status()
    tester.test_bot_configure()
    tester.test_bot_start()
    tester.test_bot_stop()
    
    # Guild management tests
    tester.test_list_guilds()
    tester.test_get_guild_config()
    tester.test_update_guild_config()
    tester.test_guild_stats()
    
    # Feature-specific tests
    tester.test_guild_warnings()
    tester.test_guild_leaderboard()
    tester.test_custom_commands()
    tester.test_news_endpoints()
    tester.test_permissions()
    tester.test_moderation_endpoints()
    tester.test_user_endpoints()
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("🎉 Backend API tests mostly successful!")
        return 0
    elif success_rate >= 50:
        print("⚠️  Backend API has some issues but core functionality works")
        return 1
    else:
        print("❌ Backend API has significant issues")
        return 2

if __name__ == "__main__":
    sys.exit(main())
import requests
import sys
import json
from datetime import datetime
import uuid

class AuthAPITester:
    def __init__(self, base_url="https://discord-master-4.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_token = None
        self.user_token = None
        self.test_user_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:300]}...")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:300]}...")

            return success, response.json() if response.text and response.status_code < 500 else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login_existing_admin(self):
        """Test login with existing admin user"""
        login_data = {
            "email": "admin@test.de",
            "password": "admin123"
        }
        success, response = self.run_test("Login Existing Admin", "POST", "auth/login", 200, data=login_data)
        
        if success and response.get('token'):
            self.admin_token = response['token']
            print(f"   ✅ Admin token obtained: {self.admin_token[:20]}...")
            print(f"   ✅ Admin user: {response.get('user', {})}")
            return response.get('user', {}).get('is_admin', False)
        return False

    def test_register_new_user(self):
        """Test registration of new user (should NOT be admin since first user exists)"""
        timestamp = datetime.now().strftime("%H%M%S")
        register_data = {
            "username": f"testuser_{timestamp}",
            "email": f"test_{timestamp}@example.com",
            "password": "testpass123"
        }
        success, response = self.run_test("Register New User", "POST", "auth/register", 200, data=register_data)
        
        if success and response.get('token'):
            self.user_token = response['token']
            self.test_user_id = response.get('user', {}).get('id')
            print(f"   ✅ User token obtained: {self.user_token[:20]}...")
            print(f"   ✅ New user: {response.get('user', {})}")
            is_admin = response.get('user', {}).get('is_admin', True)  # Should be False
            if not is_admin:
                print(f"   ✅ Correctly NOT admin (second user)")
                return True
            else:
                print(f"   ❌ Incorrectly marked as admin (should only be first user)")
                return False
        return False

    def test_auth_me_with_token(self):
        """Test /auth/me with valid token"""
        if not self.admin_token:
            print("   ⚠️  Skipping - no admin token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        return self.run_test("Auth Me (with token)", "GET", "auth/me", 200, headers=headers)[0]

    def test_auth_me_without_token(self):
        """Test /auth/me without token (should fail)"""
        return self.run_test("Auth Me (no token)", "GET", "auth/me", 401)[0]

    def test_auth_users_with_admin_token(self):
        """Test /auth/users with admin token"""
        if not self.admin_token:
            print("   ⚠️  Skipping - no admin token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, response = self.run_test("List Users (admin)", "GET", "auth/users", 200, headers=headers)
        
        if success:
            users = response.get('users', [])
            print(f"   ✅ Found {len(users)} users")
            admin_users = [u for u in users if u.get('is_admin')]
            print(f"   ✅ Found {len(admin_users)} admin users")
        
        return success

    def test_auth_users_with_user_token(self):
        """Test /auth/users with non-admin token (should fail)"""
        if not self.user_token:
            print("   ⚠️  Skipping - no user token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        return self.run_test("List Users (non-admin)", "GET", "auth/users", 403, headers=headers)[0]

    def test_auth_users_without_token(self):
        """Test /auth/users without token (should fail)"""
        return self.run_test("List Users (no token)", "GET", "auth/users", 401)[0]

    def test_bot_configure_with_admin_token(self):
        """Test bot configuration with admin token"""
        if not self.admin_token:
            print("   ⚠️  Skipping - no admin token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        config_data = {
            "discord_token": "test_token_admin_auth",
            "openai_api_key": "test_openai_admin_auth"
        }
        return self.run_test("Bot Configure (admin)", "POST", "bot/configure", 200, data=config_data, headers=headers)[0]

    def test_bot_configure_with_user_token(self):
        """Test bot configuration with non-admin token (should fail)"""
        if not self.user_token:
            print("   ⚠️  Skipping - no user token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        config_data = {
            "discord_token": "test_token_user_auth",
            "openai_api_key": "test_openai_user_auth"
        }
        return self.run_test("Bot Configure (non-admin)", "POST", "bot/configure", 403, data=config_data, headers=headers)[0]

    def test_bot_configure_without_token(self):
        """Test bot configuration without token (should fail)"""
        config_data = {
            "discord_token": "test_token_no_auth",
            "openai_api_key": "test_openai_no_auth"
        }
        return self.run_test("Bot Configure (no token)", "POST", "bot/configure", 401, data=config_data)[0]

    def test_toggle_admin_status(self):
        """Test toggling admin status (admin only)"""
        if not self.admin_token or not self.test_user_id:
            print("   ⚠️  Skipping - no admin token or test user available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Try to make test user admin
        success1, _ = self.run_test("Toggle Admin (make admin)", "PUT", f"auth/users/{self.test_user_id}/admin?is_admin=true", 200, headers=headers)
        
        # Try to remove admin status
        success2, _ = self.run_test("Toggle Admin (remove admin)", "PUT", f"auth/users/{self.test_user_id}/admin?is_admin=false", 200, headers=headers)
        
        return success1 and success2

    def test_delete_user(self):
        """Test deleting user (admin only)"""
        if not self.admin_token or not self.test_user_id:
            print("   ⚠️  Skipping - no admin token or test user available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        return self.run_test("Delete User", "DELETE", f"auth/users/{self.test_user_id}", 200, headers=headers)[0]

def main():
    print("🚀 Starting Auth API Tests...")
    print("=" * 60)
    
    tester = AuthAPITester()
    
    # Test login with existing admin
    print("\n📋 Testing Admin Login...")
    admin_login_success = tester.test_login_existing_admin()
    
    # Test registration of new user
    print("\n📋 Testing User Registration...")
    user_register_success = tester.test_register_new_user()
    
    # Test auth/me endpoint
    print("\n📋 Testing Auth Me Endpoint...")
    tester.test_auth_me_with_token()
    tester.test_auth_me_without_token()
    
    # Test auth/users endpoint
    print("\n📋 Testing Auth Users Endpoint...")
    tester.test_auth_users_with_admin_token()
    tester.test_auth_users_with_user_token()
    tester.test_auth_users_without_token()
    
    # Test admin-only bot configuration
    print("\n📋 Testing Admin-Only Bot Configuration...")
    tester.test_bot_configure_with_admin_token()
    tester.test_bot_configure_with_user_token()
    tester.test_bot_configure_without_token()
    
    # Test user management (admin only)
    print("\n📋 Testing User Management...")
    tester.test_toggle_admin_status()
    tester.test_delete_user()
    
    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Auth Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    # Summary
    print("\n📋 Key Auth Features:")
    print(f"   Admin Login: {'✅' if admin_login_success else '❌'}")
    print(f"   User Registration: {'✅' if user_register_success else '❌'}")
    print(f"   Admin Token: {'✅' if tester.admin_token else '❌'}")
    print(f"   User Token: {'✅' if tester.user_token else '❌'}")
    
    if success_rate >= 80:
        print("🎉 Auth API tests mostly successful!")
        return 0
    elif success_rate >= 50:
        print("⚠️  Auth API has some issues but core functionality works")
        return 1
    else:
        print("❌ Auth API has significant issues")
        return 2

if __name__ == "__main__":
    sys.exit(main())
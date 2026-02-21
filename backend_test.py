import requests
import sys
import json
from datetime import datetime

class PnTASnackAPITester:
    def __init__(self, base_url="https://snack-dashboard.preview.emergentagent.com"):
        self.base_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.test_results = {}

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
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
                    return success, response.json() if response.text else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text[:200]}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            return False, {}

    def test_api_root(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_menu_endpoint(self):
        """Test menu retrieval"""
        success, response = self.run_test("Get Menu", "GET", "menu", 200)
        if success and response:
            categories = set(item.get('category') for item in response)
            print(f"   Found {len(response)} menu items in {len(categories)} categories")
            # Check if we have expected Dutch categories
            expected_categories = ['SNACKS', 'PATAT', 'BURGERS', 'DRANKEN']
            found_categories = [cat for cat in expected_categories if cat in categories]
            print(f"   Found expected categories: {found_categories}")
            return success, response
        return success, response

    def test_seed_menu(self):
        """Test menu seeding"""
        return self.run_test("Seed Menu", "POST", "menu/seed", 200)

    def test_orders_crud(self):
        """Test complete order CRUD operations"""
        print("\n📝 Testing Order CRUD Operations...")
        
        # 1. Get initial orders
        success, initial_orders = self.run_test("Get Orders (Initial)", "GET", "orders", 200)
        if not success:
            return False
        
        # 2. Create test order
        test_order = {
            "customer_name": "Test Gebruiker",
            "items": [
                {
                    "menu_item_id": "test-id-1", 
                    "name": "Frikandel", 
                    "quantity": 2, 
                    "price": 2.25
                },
                {
                    "menu_item_id": "test-id-2", 
                    "name": "Kroket", 
                    "quantity": 1, 
                    "price": 2.50
                }
            ]
        }
        success, new_order = self.run_test("Create Order", "POST", "orders", 200, test_order)
        if not success or not new_order:
            return False
        
        order_id = new_order.get('id')
        if not order_id:
            print("❌ No order ID returned")
            return False
        
        print(f"   Created order with ID: {order_id}")
        
        # 3. Update order payment status
        update_data = {"is_paid": True}
        success, updated_order = self.run_test("Update Order Payment", "PUT", f"orders/{order_id}", 200, update_data)
        if success:
            print(f"   Payment status updated: {updated_order.get('is_paid', False)}")
        
        # 4. Update order items
        updated_items = [
            {
                "menu_item_id": "test-id-1", 
                "name": "Frikandel", 
                "quantity": 3, 
                "price": 2.25
            }
        ]
        success, updated_order = self.run_test("Update Order Items", "PUT", f"orders/{order_id}", 200, {"items": updated_items})
        if success:
            print(f"   Order items updated, new total: {updated_order.get('total_price', 0)}")
        
        # 5. Delete order
        success, _ = self.run_test("Delete Order", "DELETE", f"orders/{order_id}", 200)
        
        return True

    def test_activity_log(self):
        """Test activity log functionality"""
        print("\n📊 Testing Activity Log...")
        
        # Get existing logs
        success, logs = self.run_test("Get Activity Log", "GET", "activity-log", 200)
        if not success:
            return False
        
        # Create new log entry
        log_entry = {
            "action": "Test Actie",
            "details": "Test activiteit voor API testing",
            "order_id": "test-order-123",
            "device_info": "Test Agent Browser"
        }
        success, new_log = self.run_test("Create Activity Log", "POST", "activity-log", 200, log_entry)
        
        if success:
            print(f"   Created log entry with ID: {new_log.get('id')}")
        
        return success

    def test_settings(self):
        """Test app settings functionality"""
        print("\n⚙️ Testing App Settings...")
        
        # Get current settings
        success, settings = self.run_test("Get Settings", "GET", "settings", 200)
        if not success:
            return False
        
        print(f"   Current settings: edit_mode={settings.get('is_edit_mode')}, payment_link='{settings.get('payment_link', '')}'")
        
        # Update payment link
        update_data = {"payment_link": "https://test-payment.nl/betalen"}
        success, updated_settings = self.run_test("Update Payment Link", "PUT", "settings", 200, update_data)
        if success:
            print(f"   Updated payment link: {updated_settings.get('payment_link')}")
        
        # Update edit mode
        update_data = {"is_edit_mode": True}
        success, updated_settings = self.run_test("Update Edit Mode", "PUT", "settings", 200, update_data)
        if success:
            print(f"   Updated edit mode: {updated_settings.get('is_edit_mode')}")
        
        return success

    def test_admin_verification(self):
        """Test admin PIN verification"""
        print("\n🔐 Testing Admin Verification...")
        
        # Test correct PIN
        success, response = self.run_test("Admin Verify (Correct PIN)", "POST", "admin/verify", 200, {"pin": "1990"})
        if success and response.get('success') == True:
            print("   ✅ Correct PIN (1990) accepted")
        else:
            print("   ❌ Correct PIN rejected")
            return False
        
        # Test incorrect PIN
        success, response = self.run_test("Admin Verify (Wrong PIN)", "POST", "admin/verify", 200, {"pin": "1234"})
        if success and response.get('success') == False:
            print("   ✅ Wrong PIN correctly rejected")
        else:
            print("   ❌ Wrong PIN incorrectly accepted")
            return False
        
        return True

    def test_reset_functionality(self):
        """Test app reset functionality"""
        print("\n🔄 Testing App Reset...")
        
        return self.run_test("Reset App", "POST", "reset", 200)

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting P&TA Snack Bestel App API Testing...")
        print(f"Backend URL: {self.base_url}")
        
        # Test sequence
        test_functions = [
            self.test_api_root,
            self.test_menu_endpoint,
            self.test_orders_crud,
            self.test_activity_log,
            self.test_settings,
            self.test_admin_verification,
            self.test_reset_functionality
        ]
        
        for test_func in test_functions:
            try:
                test_func()
            except Exception as e:
                print(f"❌ Test function {test_func.__name__} failed with error: {e}")
                self.failed_tests.append({
                    "test": test_func.__name__,
                    "error": str(e)
                })
        
        # Print final results
        print(f"\n📊 Test Results:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed / max(self.tests_run, 1) * 100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"  - {failure.get('test', 'Unknown')}: {failure.get('error', failure.get('response', 'Unknown error'))}")
        
        return self.tests_passed, self.tests_run, self.failed_tests

def main():
    tester = PnTASnackAPITester()
    passed, total, failures = tester.run_all_tests()
    
    # Return exit code
    return 0 if passed == total else 1

if __name__ == "__main__":
    sys.exit(main())
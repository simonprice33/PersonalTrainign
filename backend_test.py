#!/usr/bin/env python3
"""
Backend Testing Suite for Simon Price PT Client Onboarding Flow
Tests the complete client onboarding and subscription flow with Stripe integration
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configuration
BACKEND_URL = "https://admin-refactor-6.preview.emergentagent.com/api"
TEST_EMAIL_BASE = "simon.price+test"
TEST_DOMAIN = "@simonprice-pt.co.uk"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_header(title):
    print(f"\n{Colors.CYAN}{'='*60}{Colors.END}")
    print(f"{Colors.CYAN}{Colors.BOLD}{title}{Colors.END}")
    print(f"{Colors.CYAN}{'='*60}{Colors.END}")

def print_test(test_name):
    print(f"\n{Colors.BLUE}🧪 Testing: {test_name}{Colors.END}")

def print_success(message):
    print(f"{Colors.GREEN}✅ {message}{Colors.END}")

def print_error(message):
    print(f"{Colors.RED}❌ {message}{Colors.END}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.END}")

def print_info(message):
    print(f"{Colors.WHITE}ℹ️  {message}{Colors.END}")

class ClientOnboardingTester:
    def __init__(self):
        self.admin_token = None
        self.test_client_email = None
        self.payment_token = None
        self.client_secret = None
        self.test_results = []
        
    def add_result(self, test_name, success, message, details=None):
        """Add test result to tracking"""
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'details': details,
            'timestamp': datetime.now().isoformat()
        })
        
    def get_admin_token(self):
        """Get admin JWT token for authenticated requests"""
        print_test("Admin Authentication")
        
        # First try to setup admin if needed
        try:
            setup_response = requests.post(f"{BACKEND_URL}/admin/setup")
            if setup_response.status_code == 201:
                print_info("Admin user created successfully")
            elif setup_response.status_code == 400:
                print_info("Admin user already exists")
        except Exception as e:
            print_warning(f"Admin setup check failed: {e}")
        
        # Login as admin
        login_data = {
            "email": "simon.price@simonprice-pt.co.uk",
            "password": "Qwerty1234!!!"
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/admin/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get('accessToken')
                print_success(f"Admin login successful")
                self.add_result("Admin Authentication", True, "Login successful")
                return True
            else:
                print_error(f"Admin login failed: {response.status_code} - {response.text}")
                self.add_result("Admin Authentication", False, f"Login failed: {response.status_code}")
                return False
                
        except Exception as e:
            print_error(f"Admin login error: {e}")
            self.add_result("Admin Authentication", False, f"Login error: {e}")
            return False
    
    def test_create_payment_link(self):
        """Test admin creates payment link with email alias"""
        print_test("Admin Creates Payment Link")
        
        if not self.admin_token:
            print_error("No admin token available")
            self.add_result("Create Payment Link", False, "No admin token")
            return False
        
        # Generate unique test email with alias
        timestamp = int(time.time())
        self.test_client_email = f"{TEST_EMAIL_BASE}{timestamp}{TEST_DOMAIN}"
        
        client_data = {
            "name": "Test Client Janet",
            "email": self.test_client_email,
            "phone": "+44 7700 900123",
            "price": 125,
            "billingDay": 1
        }
        
        headers = {
            "Authorization": f"Bearer {self.admin_token}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/admin/create-payment-link", 
                                   json=client_data, headers=headers)
            
            if response.status_code == 201:
                data = response.json()
                payment_link = data.get('paymentLink', '')
                
                # Extract token from payment link
                if '?token=' in payment_link:
                    self.payment_token = payment_link.split('?token=')[1]
                    print_success(f"Payment link created for {self.test_client_email}")
                    print_info(f"Token extracted: {self.payment_token[:20]}...")
                    self.add_result("Create Payment Link", True, 
                                  f"Payment link created for {self.test_client_email}",
                                  {"email": self.test_client_email, "price": 125, "billingDay": 1})
                    return True
                else:
                    print_error("Payment link created but no token found")
                    self.add_result("Create Payment Link", False, "No token in payment link")
                    return False
            else:
                print_error(f"Create payment link failed: {response.status_code} - {response.text}")
                self.add_result("Create Payment Link", False, 
                              f"Failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print_error(f"Create payment link error: {e}")
            self.add_result("Create Payment Link", False, f"Error: {e}")
            return False
    
    def test_validate_token(self):
        """Test client validates payment token"""
        print_test("Client Validates Token")
        
        if not self.payment_token:
            print_error("No payment token available")
            self.add_result("Validate Token", False, "No payment token")
            return False
        
        token_data = {
            "token": self.payment_token
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/client/validate-token", json=token_data)
            
            if response.status_code == 200:
                data = response.json()
                client_data = data.get('data', {})
                
                # Verify client data
                expected_email = self.test_client_email
                expected_price = 125
                expected_billing_day = 1
                
                actual_email = client_data.get('email')
                actual_price = client_data.get('price')
                actual_billing_day = client_data.get('billingDay')
                
                if (actual_email == expected_email and 
                    actual_price == expected_price and 
                    actual_billing_day == expected_billing_day):
                    print_success("Token validation successful with correct data")
                    print_info(f"Email: {actual_email}")
                    print_info(f"Price: £{actual_price}")
                    print_info(f"Billing Day: {actual_billing_day}")
                    self.add_result("Validate Token", True, "Token validation successful",
                                  {"email": actual_email, "price": actual_price, "billingDay": actual_billing_day})
                    return True
                else:
                    print_error("Token validation returned incorrect data")
                    print_error(f"Expected: {expected_email}, £{expected_price}, day {expected_billing_day}")
                    print_error(f"Actual: {actual_email}, £{actual_price}, day {actual_billing_day}")
                    self.add_result("Validate Token", False, "Incorrect data returned",
                                  {"expected": {"email": expected_email, "price": expected_price, "billingDay": expected_billing_day},
                                   "actual": {"email": actual_email, "price": actual_price, "billingDay": actual_billing_day}})
                    return False
            else:
                print_error(f"Token validation failed: {response.status_code} - {response.text}")
                self.add_result("Validate Token", False, f"Failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print_error(f"Token validation error: {e}")
            self.add_result("Validate Token", False, f"Error: {e}")
            return False
    
    def test_create_setup_intent(self):
        """Test client creates setup intent"""
        print_test("Client Creates Setup Intent")
        
        if not self.test_client_email:
            print_error("No test client email available")
            self.add_result("Create Setup Intent", False, "No test client email")
            return False
        
        setup_data = {
            "email": self.test_client_email
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/client/create-setup-intent", json=setup_data)
            
            if response.status_code == 200:
                data = response.json()
                self.client_secret = data.get('clientSecret')
                
                if self.client_secret:
                    print_success("Setup intent created successfully")
                    print_info(f"Client secret: {self.client_secret[:20]}...")
                    self.add_result("Create Setup Intent", True, "Setup intent created successfully")
                    return True
                else:
                    print_error("Setup intent created but no client secret returned")
                    self.add_result("Create Setup Intent", False, "No client secret returned")
                    return False
            else:
                print_error(f"Setup intent creation failed: {response.status_code} - {response.text}")
                self.add_result("Create Setup Intent", False, f"Failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print_error(f"Setup intent creation error: {e}")
            self.add_result("Create Setup Intent", False, f"Error: {e}")
            return False
    
    def test_complete_onboarding(self):
        """Test client completes onboarding with test payment method"""
        print_test("Client Completes Onboarding")
        
        if not self.payment_token:
            print_error("No payment token available")
            self.add_result("Complete Onboarding", False, "No payment token")
            return False
        
        # Use Stripe test payment method
        onboarding_data = {
            "token": self.payment_token,
            "paymentMethodId": "pm_card_visa"  # Stripe test payment method
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/client/complete-onboarding", json=onboarding_data)
            
            if response.status_code == 200:
                data = response.json()
                subscription_status = data.get('subscriptionStatus')
                
                print_success("Onboarding completed successfully")
                print_info(f"Subscription status: {subscription_status}")
                self.add_result("Complete Onboarding", True, "Onboarding completed successfully",
                              {"subscriptionStatus": subscription_status})
                return True
            else:
                print_error(f"Onboarding completion failed: {response.status_code} - {response.text}")
                self.add_result("Complete Onboarding", False, f"Failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print_error(f"Onboarding completion error: {e}")
            self.add_result("Complete Onboarding", False, f"Error: {e}")
            return False
    
    def test_duplicate_email_handling(self):
        """Test creating payment link with same base email but different alias"""
        print_test("Duplicate Email Handling (Different Alias)")
        
        if not self.admin_token:
            print_error("No admin token available")
            self.add_result("Duplicate Email Handling", False, "No admin token")
            return False
        
        # Create another email with different alias
        timestamp = int(time.time()) + 1
        different_alias_email = f"{TEST_EMAIL_BASE}{timestamp}{TEST_DOMAIN}"
        
        client_data = {
            "name": "Test Client Different Alias",
            "email": different_alias_email,
            "phone": "+44 7700 900456",
            "price": 125,
            "billingDay": 15
        }
        
        headers = {
            "Authorization": f"Bearer {self.admin_token}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/admin/create-payment-link", 
                                   json=client_data, headers=headers)
            
            if response.status_code == 201:
                print_success(f"Different alias email accepted: {different_alias_email}")
                self.add_result("Duplicate Email Handling", True, 
                              f"Different alias accepted: {different_alias_email}")
                return True
            else:
                print_error(f"Different alias rejected: {response.status_code} - {response.text}")
                self.add_result("Duplicate Email Handling", False, 
                              f"Different alias rejected: {response.status_code}")
                return False
                
        except Exception as e:
            print_error(f"Duplicate email test error: {e}")
            self.add_result("Duplicate Email Handling", False, f"Error: {e}")
            return False
    
    def test_exact_duplicate_email(self):
        """Test creating payment link with exact same email (should fail)"""
        print_test("Exact Duplicate Email (Should Fail)")
        
        if not self.admin_token or not self.test_client_email:
            print_error("No admin token or test email available")
            self.add_result("Exact Duplicate Email", False, "Missing prerequisites")
            return False
        
        client_data = {
            "name": "Test Client Duplicate",
            "email": self.test_client_email,  # Same exact email
            "phone": "+44 7700 900789",
            "price": 150,
            "billingDay": 10
        }
        
        headers = {
            "Authorization": f"Bearer {self.admin_token}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/admin/create-payment-link", 
                                   json=client_data, headers=headers)
            
            if response.status_code == 409:
                print_success("Exact duplicate email correctly rejected with 409")
                self.add_result("Exact Duplicate Email", True, "Duplicate correctly rejected with 409")
                return True
            elif response.status_code == 400:
                print_success("Exact duplicate email correctly rejected with 400")
                self.add_result("Exact Duplicate Email", True, "Duplicate correctly rejected with 400")
                return True
            else:
                print_error(f"Duplicate email not properly rejected: {response.status_code}")
                self.add_result("Exact Duplicate Email", False, 
                              f"Not properly rejected: {response.status_code}")
                return False
                
        except Exception as e:
            print_error(f"Exact duplicate test error: {e}")
            self.add_result("Exact Duplicate Email", False, f"Error: {e}")
            return False
    
    def test_invalid_token(self):
        """Test token validation with invalid token"""
        print_test("Invalid Token Handling")
        
        invalid_token_data = {
            "token": "invalid.token.here"
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/client/validate-token", json=invalid_token_data)
            
            if response.status_code == 400:
                print_success("Invalid token correctly rejected with 400")
                self.add_result("Invalid Token Handling", True, "Invalid token correctly rejected")
                return True
            else:
                print_error(f"Invalid token not properly rejected: {response.status_code}")
                self.add_result("Invalid Token Handling", False, 
                              f"Not properly rejected: {response.status_code}")
                return False
                
        except Exception as e:
            print_error(f"Invalid token test error: {e}")
            self.add_result("Invalid Token Handling", False, f"Error: {e}")
            return False
    
    def verify_database_records(self):
        """Verify client and clientUser records were created"""
        print_test("Database Records Verification")
        
        if not self.admin_token:
            print_error("No admin token available")
            self.add_result("Database Verification", False, "No admin token")
            return False
        
        headers = {
            "Authorization": f"Bearer {self.admin_token}",
            "Content-Type": "application/json"
        }
        
        try:
            # Check clients collection
            clients_response = requests.get(f"{BACKEND_URL}/admin/clients", headers=headers)
            
            if clients_response.status_code == 200:
                clients_data = clients_response.json()
                clients = clients_data.get('clients', [])
                
                # Find our test client
                test_client = None
                for client in clients:
                    if client.get('email') == self.test_client_email:
                        test_client = client
                        break
                
                if test_client:
                    print_success(f"Client record found in database")
                    print_info(f"Status: {test_client.get('status')}")
                    print_info(f"Customer ID: {test_client.get('customer_id', 'N/A')}")
                    
                    # Check client users collection
                    client_users_response = requests.get(f"{BACKEND_URL}/admin/client-users", headers=headers)
                    
                    if client_users_response.status_code == 200:
                        client_users_data = client_users_response.json()
                        client_users = client_users_data.get('clientUsers', [])
                        
                        test_client_user = None
                        for user in client_users:
                            if user.get('email') == self.test_client_email:
                                test_client_user = user
                                break
                        
                        if test_client_user:
                            print_success("Client user record found in database")
                            print_info(f"User status: {test_client_user.get('status')}")
                            self.add_result("Database Verification", True, 
                                          "Both client and client user records found",
                                          {"client_status": test_client.get('status'),
                                           "user_status": test_client_user.get('status')})
                            return True
                        else:
                            print_error("Client user record not found")
                            self.add_result("Database Verification", False, "Client user record not found")
                            return False
                    else:
                        print_error(f"Failed to fetch client users: {client_users_response.status_code}")
                        self.add_result("Database Verification", False, "Failed to fetch client users")
                        return False
                else:
                    print_error("Client record not found in database")
                    self.add_result("Database Verification", False, "Client record not found")
                    return False
            else:
                print_error(f"Failed to fetch clients: {clients_response.status_code}")
                self.add_result("Database Verification", False, "Failed to fetch clients")
                return False
                
        except Exception as e:
            print_error(f"Database verification error: {e}")
            self.add_result("Database Verification", False, f"Error: {e}")
            return False
    
    def run_all_tests(self):
        """Run the complete test suite"""
        print_header("CLIENT ONBOARDING FLOW TESTING")
        print_info(f"Backend URL: {BACKEND_URL}")
        print_info(f"Test timestamp: {datetime.now().isoformat()}")
        
        # Test sequence
        tests = [
            ("Admin Authentication", self.get_admin_token),
            ("Create Payment Link", self.test_create_payment_link),
            ("Validate Token", self.test_validate_token),
            ("Create Setup Intent", self.test_create_setup_intent),
            ("Complete Onboarding", self.test_complete_onboarding),
            ("Database Verification", self.verify_database_records),
            ("Different Alias Email", self.test_duplicate_email_handling),
            ("Exact Duplicate Email", self.test_exact_duplicate_email),
            ("Invalid Token", self.test_invalid_token)
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print_error(f"Test {test_name} crashed: {e}")
                failed += 1
                self.add_result(test_name, False, f"Test crashed: {e}")
        
        # Print summary
        print_header("TEST SUMMARY")
        print(f"{Colors.GREEN}✅ Passed: {passed}{Colors.END}")
        print(f"{Colors.RED}❌ Failed: {failed}{Colors.END}")
        print(f"{Colors.BLUE}📊 Total: {passed + failed}{Colors.END}")
        
        if self.test_client_email:
            print_info(f"Test client email: {self.test_client_email}")
        
        # Print detailed results
        print_header("DETAILED RESULTS")
        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['test']}: {result['message']}")
            if result.get('details'):
                print(f"   Details: {json.dumps(result['details'], indent=2)}")
        
        return passed, failed

def main():
    """Main test execution"""
    tester = ClientOnboardingTester()
    passed, failed = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if failed == 0 else 1)

if __name__ == "__main__":
    main()

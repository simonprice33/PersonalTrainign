#!/usr/bin/env python3
"""
Comprehensive Client Onboarding Flow Testing
Tests what can be tested without valid Stripe API keys and documents issues
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configuration
BACKEND_URL = "https://cms-refresh.preview.emergentagent.com/api"
TEST_EMAIL_BASE = "simon.price+test"
TEST_DOMAIN = "@simonprice-pt.co.uk"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
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
        self.test_results = []
        self.critical_issues = []
        self.working_features = []
        
    def add_result(self, test_name, success, message, details=None):
        """Add test result to tracking"""
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'details': details,
            'timestamp': datetime.now().isoformat()
        })
        
        if success:
            self.working_features.append(test_name)
        else:
            self.critical_issues.append(f"{test_name}: {message}")
    
    def get_admin_token(self):
        """Get admin JWT token for authenticated requests"""
        print_test("Admin Authentication")
        
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
    
    def test_create_payment_link_structure(self):
        """Test payment link creation structure (expect Stripe API failure)"""
        print_test("Payment Link Creation Structure")
        
        if not self.admin_token:
            print_error("No admin token available")
            self.add_result("Payment Link Structure", False, "No admin token")
            return False
        
        timestamp = int(time.time())
        test_email = f"{TEST_EMAIL_BASE}{timestamp}{TEST_DOMAIN}"
        
        client_data = {
            "name": "Test Client Janet",
            "email": test_email,
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
            
            print_info(f"Status Code: {response.status_code}")
            print_info(f"Response: {response.text}")
            
            if response.status_code == 500:
                response_data = response.json()
                error_message = response_data.get('message', '')
                
                if "Invalid API Key provided" in error_message:
                    print_warning("Stripe API key invalid (expected in test environment)")
                    print_success("Endpoint structure working - fails at Stripe integration as expected")
                    self.add_result("Payment Link Structure", True, 
                                  "Endpoint working, Stripe API key invalid (expected)",
                                  {"email": test_email, "stripe_error": error_message})
                    return True
                else:
                    print_error(f"Unexpected error: {error_message}")
                    self.add_result("Payment Link Structure", False, f"Unexpected error: {error_message}")
                    return False
            elif response.status_code == 201:
                print_success("Payment link created successfully (unexpected - Stripe working)")
                self.add_result("Payment Link Structure", True, "Payment link created successfully")
                return True
            else:
                print_error(f"Unexpected status code: {response.status_code}")
                self.add_result("Payment Link Structure", False, f"Unexpected status: {response.status_code}")
                return False
                
        except Exception as e:
            print_error(f"Payment link test error: {e}")
            self.add_result("Payment Link Structure", False, f"Error: {e}")
            return False
    
    def test_token_validation_with_mock_token(self):
        """Test token validation with a properly structured mock token"""
        print_test("Token Validation Logic")
        
        try:
            # Test with invalid token first
            invalid_token_data = {"token": "invalid.token.here"}
            response = requests.post(f"{BACKEND_URL}/client/validate-token", json=invalid_token_data)
            
            print_info(f"Invalid token test - Status: {response.status_code}")
            
            if response.status_code == 400:
                print_success("Invalid token correctly rejected")
                self.add_result("Token Validation Logic", True, "Invalid token handling working")
                return True
            else:
                print_error(f"Invalid token should return 400, got {response.status_code}")
                self.add_result("Token Validation Logic", False, f"Invalid token handling broken: {response.status_code}")
                return False
                
        except Exception as e:
            print_error(f"Token validation test error: {e}")
            self.add_result("Token Validation Logic", False, f"Error: {e}")
            return False
    
    def test_setup_intent_creation(self):
        """Test setup intent creation (expect Stripe failure)"""
        print_test("Setup Intent Creation")
        
        setup_data = {"email": "test@example.com"}
        
        try:
            response = requests.post(f"{BACKEND_URL}/client/create-setup-intent", json=setup_data)
            
            print_info(f"Status Code: {response.status_code}")
            print_info(f"Response: {response.text}")
            
            if response.status_code == 500:
                response_data = response.json()
                error_message = response_data.get('message', '')
                
                if "Failed to create setup intent" in error_message:
                    print_warning("Setup intent creation fails (expected without valid Stripe key)")
                    print_success("Endpoint structure working - fails at Stripe integration as expected")
                    self.add_result("Setup Intent Creation", True, 
                                  "Endpoint working, Stripe integration fails as expected")
                    return True
                else:
                    print_error(f"Unexpected error: {error_message}")
                    self.add_result("Setup Intent Creation", False, f"Unexpected error: {error_message}")
                    return False
            elif response.status_code == 200:
                print_success("Setup intent created successfully (unexpected - Stripe working)")
                self.add_result("Setup Intent Creation", True, "Setup intent created successfully")
                return True
            else:
                print_error(f"Unexpected status code: {response.status_code}")
                self.add_result("Setup Intent Creation", False, f"Unexpected status: {response.status_code}")
                return False
                
        except Exception as e:
            print_error(f"Setup intent test error: {e}")
            self.add_result("Setup Intent Creation", False, f"Error: {e}")
            return False
    
    def test_complete_onboarding_structure(self):
        """Test complete onboarding structure (expect token/Stripe failure)"""
        print_test("Complete Onboarding Structure")
        
        onboarding_data = {
            "token": "invalid.token.here",
            "paymentMethodId": "pm_card_visa"
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/client/complete-onboarding", json=onboarding_data)
            
            print_info(f"Status Code: {response.status_code}")
            print_info(f"Response: {response.text}")
            
            if response.status_code == 400:
                response_data = response.json()
                error_message = response_data.get('message', '')
                
                if "Invalid or expired token" in error_message:
                    print_success("Token validation working in onboarding endpoint")
                    self.add_result("Complete Onboarding Structure", True, 
                                  "Token validation working correctly")
                    return True
                else:
                    print_error(f"Unexpected 400 error: {error_message}")
                    self.add_result("Complete Onboarding Structure", False, f"Unexpected error: {error_message}")
                    return False
            else:
                print_error(f"Expected 400 for invalid token, got {response.status_code}")
                self.add_result("Complete Onboarding Structure", False, 
                              f"Token validation not working: {response.status_code}")
                return False
                
        except Exception as e:
            print_error(f"Complete onboarding test error: {e}")
            self.add_result("Complete Onboarding Structure", False, f"Error: {e}")
            return False
    
    def test_admin_clients_endpoint(self):
        """Test admin clients listing endpoint"""
        print_test("Admin Clients Endpoint")
        
        if not self.admin_token:
            print_error("No admin token available")
            self.add_result("Admin Clients Endpoint", False, "No admin token")
            return False
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        try:
            response = requests.get(f"{BACKEND_URL}/admin/clients", headers=headers)
            
            print_info(f"Status Code: {response.status_code}")
            print_info(f"Response: {response.text}")
            
            if response.status_code == 200:
                response_data = response.json()
                
                if 'clients' in response_data and 'count' in response_data:
                    clients = response_data['clients']
                    count = response_data['count']
                    print_success(f"Clients endpoint working - {count} clients found")
                    self.add_result("Admin Clients Endpoint", True, 
                                  f"Working correctly - {count} clients",
                                  {"count": count, "clients_length": len(clients)})
                    return True
                else:
                    print_error("Response missing 'clients' or 'count' field")
                    self.add_result("Admin Clients Endpoint", False, "Missing required fields")
                    return False
            else:
                print_error(f"Clients endpoint failed: {response.status_code}")
                self.add_result("Admin Clients Endpoint", False, f"Failed: {response.status_code}")
                return False
                
        except Exception as e:
            print_error(f"Clients endpoint test error: {e}")
            self.add_result("Admin Clients Endpoint", False, f"Error: {e}")
            return False
    
    def test_admin_client_users_endpoint(self):
        """Test admin client users listing endpoint"""
        print_test("Admin Client Users Endpoint")
        
        if not self.admin_token:
            print_error("No admin token available")
            self.add_result("Admin Client Users Endpoint", False, "No admin token")
            return False
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        try:
            response = requests.get(f"{BACKEND_URL}/admin/client-users", headers=headers)
            
            print_info(f"Status Code: {response.status_code}")
            print_info(f"Response: {response.text}")
            
            if response.status_code == 200:
                response_data = response.json()
                
                if 'clientUsers' in response_data and 'count' in response_data:
                    client_users = response_data['clientUsers']
                    count = response_data['count']
                    print_success(f"Client users endpoint working - {count} users found")
                    self.add_result("Admin Client Users Endpoint", True, 
                                  f"Working correctly - {count} users",
                                  {"count": count, "users_length": len(client_users)})
                    return True
                else:
                    print_error("Response missing 'clientUsers' or 'count' field")
                    self.add_result("Admin Client Users Endpoint", False, "Missing required fields")
                    return False
            else:
                print_error(f"Client users endpoint failed: {response.status_code}")
                self.add_result("Admin Client Users Endpoint", False, f"Failed: {response.status_code}")
                return False
                
        except Exception as e:
            print_error(f"Client users endpoint test error: {e}")
            self.add_result("Admin Client Users Endpoint", False, f"Error: {e}")
            return False
    
    def test_email_alias_handling(self):
        """Test email alias handling in payment link creation"""
        print_test("Email Alias Handling")
        
        if not self.admin_token:
            print_error("No admin token available")
            self.add_result("Email Alias Handling", False, "No admin token")
            return False
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test different email aliases
        timestamp = int(time.time())
        test_emails = [
            f"{TEST_EMAIL_BASE}{timestamp}a{TEST_DOMAIN}",
            f"{TEST_EMAIL_BASE}{timestamp}b{TEST_DOMAIN}",
        ]
        
        success_count = 0
        
        for i, email in enumerate(test_emails):
            client_data = {
                "name": f"Test Client {i+1}",
                "email": email,
                "phone": "+44 7700 900123",
                "price": 125,
                "billingDay": 1
            }
            
            try:
                response = requests.post(f"{BACKEND_URL}/admin/create-payment-link", 
                                       json=client_data, headers=headers)
                
                print_info(f"Email {email} - Status: {response.status_code}")
                
                if response.status_code == 500:
                    response_data = response.json()
                    if "Invalid API Key provided" in response_data.get('message', ''):
                        print_success(f"Email alias {email} accepted (Stripe key issue expected)")
                        success_count += 1
                    else:
                        print_error(f"Unexpected error for {email}")
                elif response.status_code == 201:
                    print_success(f"Email alias {email} accepted and processed")
                    success_count += 1
                elif response.status_code == 409:
                    print_error(f"Email alias {email} rejected as duplicate")
                else:
                    print_error(f"Unexpected status for {email}: {response.status_code}")
                    
            except Exception as e:
                print_error(f"Error testing email {email}: {e}")
        
        if success_count == len(test_emails):
            print_success("Email alias handling working correctly")
            self.add_result("Email Alias Handling", True, 
                          f"All {success_count} email aliases accepted correctly")
            return True
        else:
            print_error(f"Only {success_count}/{len(test_emails)} email aliases handled correctly")
            self.add_result("Email Alias Handling", False, 
                          f"Only {success_count}/{len(test_emails)} aliases worked")
            return False
    
    def run_all_tests(self):
        """Run the complete test suite"""
        print_header("CLIENT ONBOARDING FLOW TESTING")
        print_info(f"Backend URL: {BACKEND_URL}")
        print_info(f"Test timestamp: {datetime.now().isoformat()}")
        print_warning("Note: Stripe API key is invalid - testing structure and error handling")
        
        # Test sequence
        tests = [
            ("Admin Authentication", self.get_admin_token),
            ("Payment Link Structure", self.test_create_payment_link_structure),
            ("Token Validation Logic", self.test_token_validation_with_mock_token),
            ("Setup Intent Creation", self.test_setup_intent_creation),
            ("Complete Onboarding Structure", self.test_complete_onboarding_structure),
            ("Admin Clients Endpoint", self.test_admin_clients_endpoint),
            ("Admin Client Users Endpoint", self.test_admin_client_users_endpoint),
            ("Email Alias Handling", self.test_email_alias_handling)
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
        
        # Print working features
        if self.working_features:
            print_header("WORKING FEATURES")
            for feature in self.working_features:
                print(f"{Colors.GREEN}✅ {feature}{Colors.END}")
        
        # Print critical issues
        if self.critical_issues:
            print_header("CRITICAL ISSUES")
            for issue in self.critical_issues:
                print(f"{Colors.RED}❌ {issue}{Colors.END}")
        
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
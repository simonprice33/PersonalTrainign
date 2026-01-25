#!/usr/bin/env python3
"""
Admin Content Management API Testing
Tests for Packages, PARQ Questions, and Health Questions endpoints
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://subman-content.preview.emergentagent.com/api"
ADMIN_EMAIL = "simon.price@simonprice-pt.co.uk"
ADMIN_PASSWORD = "Qwerty1234!!!"

class ContentManagementTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.access_token = None
        self.test_results = []
        self.created_items = {
            'packages': [],
            'parq_questions': [],
            'health_questions': []
        }

    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'details': details,
            'timestamp': datetime.now().isoformat()
        })

    def authenticate(self):
        """Authenticate and get access token"""
        print("\n🔐 AUTHENTICATING...")
        
        try:
            response = requests.post(
                f"{self.base_url}/admin/login",
                json={
                    "email": ADMIN_EMAIL,
                    "password": ADMIN_PASSWORD
                },
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('accessToken'):
                    self.access_token = data['accessToken']
                    self.log_test("Admin Authentication", True, "Successfully authenticated")
                    return True
                else:
                    self.log_test("Admin Authentication", False, "No access token in response", data)
                    return False
            else:
                self.log_test("Admin Authentication", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Admin Authentication", False, f"Request failed: {str(e)}")
            return False

    def get_auth_headers(self):
        """Get authorization headers"""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }

    def test_packages_crud(self):
        """Test Package CRUD operations"""
        print("\n📦 TESTING PACKAGES...")
        
        # Test GET all packages
        try:
            response = requests.get(
                f"{self.base_url}/admin/packages",
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_test("GET /admin/packages", True, f"Retrieved {len(data.get('packages', []))} packages")
                else:
                    self.log_test("GET /admin/packages", False, "Response not successful", data)
            else:
                self.log_test("GET /admin/packages", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /admin/packages", False, f"Request failed: {str(e)}")

        # Test CREATE package
        test_package = {
            "name": "Test Package",
            "price": 99,
            "description": "Test description for automated testing",
            "features": ["Feature 1", "Feature 2", "Automated Testing Feature"]
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/admin/packages",
                json=test_package,
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    created_package = data.get('package', {})
                    package_id = created_package.get('id')
                    if package_id:
                        self.created_items['packages'].append(package_id)
                        self.log_test("POST /admin/packages", True, f"Created package with ID: {package_id}")
                        
                        # Test UPDATE package
                        update_data = {
                            "name": "Updated Test Package",
                            "price": 149,
                            "description": "Updated description"
                        }
                        
                        try:
                            update_response = requests.put(
                                f"{self.base_url}/admin/packages/{package_id}",
                                json=update_data,
                                headers=self.get_auth_headers()
                            )
                            
                            if update_response.status_code == 200:
                                update_result = update_response.json()
                                if update_result.get('success'):
                                    self.log_test("PUT /admin/packages/:id", True, "Package updated successfully")
                                else:
                                    self.log_test("PUT /admin/packages/:id", False, "Update not successful", update_result)
                            else:
                                self.log_test("PUT /admin/packages/:id", False, f"HTTP {update_response.status_code}", update_response.text)
                        except Exception as e:
                            self.log_test("PUT /admin/packages/:id", False, f"Request failed: {str(e)}")
                    else:
                        self.log_test("POST /admin/packages", False, "No package ID in response", data)
                else:
                    self.log_test("POST /admin/packages", False, "Package creation not successful", data)
            else:
                self.log_test("POST /admin/packages", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("POST /admin/packages", False, f"Request failed: {str(e)}")

    def test_parq_questions_crud(self):
        """Test PARQ Questions CRUD operations"""
        print("\n❓ TESTING PARQ QUESTIONS...")
        
        # Test GET all PARQ questions
        try:
            response = requests.get(
                f"{self.base_url}/admin/parq-questions",
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_test("GET /admin/parq-questions", True, f"Retrieved {len(data.get('questions', []))} PARQ questions")
                else:
                    self.log_test("GET /admin/parq-questions", False, "Response not successful", data)
            else:
                self.log_test("GET /admin/parq-questions", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /admin/parq-questions", False, f"Request failed: {str(e)}")

        # Test CREATE PARQ question
        test_parq = {
            "question": "Do you have any automated testing conditions that might affect your exercise routine?",
            "order": 99,
            "requires_doctor_approval": True
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/admin/parq-questions",
                json=test_parq,
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    created_question = data.get('question', {})
                    question_id = created_question.get('id')
                    if question_id:
                        self.created_items['parq_questions'].append(question_id)
                        self.log_test("POST /admin/parq-questions", True, f"Created PARQ question with ID: {question_id}")
                        
                        # Test UPDATE PARQ question
                        update_data = {
                            "question": "Updated: Do you have any automated testing conditions that might affect your exercise routine?",
                            "active": True
                        }
                        
                        try:
                            update_response = requests.put(
                                f"{self.base_url}/admin/parq-questions/{question_id}",
                                json=update_data,
                                headers=self.get_auth_headers()
                            )
                            
                            if update_response.status_code == 200:
                                update_result = update_response.json()
                                if update_result.get('success'):
                                    self.log_test("PUT /admin/parq-questions/:id", True, "PARQ question updated successfully")
                                else:
                                    self.log_test("PUT /admin/parq-questions/:id", False, "Update not successful", update_result)
                            else:
                                self.log_test("PUT /admin/parq-questions/:id", False, f"HTTP {update_response.status_code}", update_response.text)
                        except Exception as e:
                            self.log_test("PUT /admin/parq-questions/:id", False, f"Request failed: {str(e)}")
                    else:
                        self.log_test("POST /admin/parq-questions", False, "No question ID in response", data)
                else:
                    self.log_test("POST /admin/parq-questions", False, "PARQ question creation not successful", data)
            else:
                self.log_test("POST /admin/parq-questions", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("POST /admin/parq-questions", False, f"Request failed: {str(e)}")

    def test_health_questions_crud(self):
        """Test Health Questions CRUD operations"""
        print("\n🏥 TESTING HEALTH QUESTIONS...")
        
        # Test GET all health questions
        try:
            response = requests.get(
                f"{self.base_url}/admin/health-questions",
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_test("GET /admin/health-questions", True, f"Retrieved {len(data.get('questions', []))} health questions")
                else:
                    self.log_test("GET /admin/health-questions", False, "Response not successful", data)
            else:
                self.log_test("GET /admin/health-questions", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /admin/health-questions", False, f"Request failed: {str(e)}")

        # Test CREATE health question
        test_health = {
            "question": "What is your experience with automated testing in fitness applications?",
            "type": "multiple-choice",
            "order": 99,
            "options": ["Beginner", "Intermediate", "Advanced", "Expert"]
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/admin/health-questions",
                json=test_health,
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    created_question = data.get('question', {})
                    question_id = created_question.get('id')
                    if question_id:
                        self.created_items['health_questions'].append(question_id)
                        self.log_test("POST /admin/health-questions", True, f"Created health question with ID: {question_id}")
                        
                        # Test UPDATE health question
                        update_data = {
                            "question": "Updated: What is your experience with automated testing in fitness applications?",
                            "type": "multiple-choice",
                            "options": ["None", "Basic", "Intermediate", "Advanced", "Expert"]
                        }
                        
                        try:
                            update_response = requests.put(
                                f"{self.base_url}/admin/health-questions/{question_id}",
                                json=update_data,
                                headers=self.get_auth_headers()
                            )
                            
                            if update_response.status_code == 200:
                                update_result = update_response.json()
                                if update_result.get('success'):
                                    self.log_test("PUT /admin/health-questions/:id", True, "Health question updated successfully")
                                else:
                                    self.log_test("PUT /admin/health-questions/:id", False, "Update not successful", update_result)
                            else:
                                self.log_test("PUT /admin/health-questions/:id", False, f"HTTP {update_response.status_code}", update_response.text)
                        except Exception as e:
                            self.log_test("PUT /admin/health-questions/:id", False, f"Request failed: {str(e)}")
                    else:
                        self.log_test("POST /admin/health-questions", False, "No question ID in response", data)
                else:
                    self.log_test("POST /admin/health-questions", False, "Health question creation not successful", data)
            else:
                self.log_test("POST /admin/health-questions", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("POST /admin/health-questions", False, f"Request failed: {str(e)}")

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("\n🧹 CLEANING UP TEST DATA...")
        
        # Delete test packages
        for package_id in self.created_items['packages']:
            try:
                response = requests.delete(
                    f"{self.base_url}/admin/packages/{package_id}",
                    headers=self.get_auth_headers()
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success'):
                        self.log_test("DELETE Package", True, f"Deleted package {package_id}")
                    else:
                        self.log_test("DELETE Package", False, f"Failed to delete package {package_id}", data)
                else:
                    self.log_test("DELETE Package", False, f"HTTP {response.status_code} for package {package_id}", response.text)
            except Exception as e:
                self.log_test("DELETE Package", False, f"Request failed for package {package_id}: {str(e)}")

        # Delete test PARQ questions
        for question_id in self.created_items['parq_questions']:
            try:
                response = requests.delete(
                    f"{self.base_url}/admin/parq-questions/{question_id}",
                    headers=self.get_auth_headers()
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success'):
                        self.log_test("DELETE PARQ Question", True, f"Deleted PARQ question {question_id}")
                    else:
                        self.log_test("DELETE PARQ Question", False, f"Failed to delete PARQ question {question_id}", data)
                else:
                    self.log_test("DELETE PARQ Question", False, f"HTTP {response.status_code} for PARQ question {question_id}", response.text)
            except Exception as e:
                self.log_test("DELETE PARQ Question", False, f"Request failed for PARQ question {question_id}: {str(e)}")

        # Delete test health questions
        for question_id in self.created_items['health_questions']:
            try:
                response = requests.delete(
                    f"{self.base_url}/admin/health-questions/{question_id}",
                    headers=self.get_auth_headers()
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success'):
                        self.log_test("DELETE Health Question", True, f"Deleted health question {question_id}")
                    else:
                        self.log_test("DELETE Health Question", False, f"Failed to delete health question {question_id}", data)
                else:
                    self.log_test("DELETE Health Question", False, f"HTTP {response.status_code} for health question {question_id}", response.text)
            except Exception as e:
                self.log_test("DELETE Health Question", False, f"Request failed for health question {question_id}: {str(e)}")

    def run_all_tests(self):
        """Run all content management tests"""
        print("=" * 80)
        print("🧪 ADMIN CONTENT MANAGEMENT API TESTING")
        print("=" * 80)
        print(f"🌐 Base URL: {self.base_url}")
        print(f"👤 Admin Email: {ADMIN_EMAIL}")
        print(f"🕐 Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Authenticate first
        if not self.authenticate():
            print("\n❌ Authentication failed. Cannot proceed with tests.")
            return False
        
        # Run all tests
        self.test_packages_crud()
        self.test_parq_questions_crud()
        self.test_health_questions_crud()
        
        # Clean up
        self.cleanup_test_data()
        
        # Summary
        self.print_summary()
        
        return True

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "0%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for test in self.test_results:
                if not test['success']:
                    print(f"   • {test['test']}: {test['message']}")
        
        print(f"\n🕐 Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)

def main():
    """Main function"""
    tester = ContentManagementTester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
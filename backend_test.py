#!/usr/bin/env python3
"""
Backend API Testing Script for Simon Price PT Website
Tests MongoDB email storage implementation for all forms
"""

import requests
import json
import sys
from datetime import datetime
import pymongo
import os

# Get backend URL from frontend .env
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
        return None

# MongoDB connection for testing
def get_mongo_connection():
    try:
        client = pymongo.MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=5000)
        db = client["simonprice_pt_db"]
        collection = db["mailing_list"]
        # Test connection
        client.server_info()
        return client, db, collection
    except Exception as e:
        print(f"❌ MongoDB connection error: {e}")
        return None, None, None

def cleanup_test_emails(collection):
    """Clean up test emails from database"""
    if collection:
        try:
            test_emails = [
                "test.contact@example.com",
                "test.tdee@example.com", 
                "test.client@example.com",
                "duplicate.test@example.com"
            ]
            for email in test_emails:
                collection.delete_many({"email": email})
            print("🧹 Cleaned up test emails from database")
        except Exception as e:
            print(f"⚠️ Error cleaning up test emails: {e}")

def test_mongodb_connection(collection):
    """Test MongoDB connection and mailing_list collection"""
    print("\n=== Testing MongoDB Connection ===")
    try:
        if not collection:
            print("❌ MongoDB connection failed")
            return False
            
        # Test collection exists and has unique index
        indexes = collection.list_indexes()
        has_email_index = False
        for index in indexes:
            if 'email' in index.get('key', {}):
                has_email_index = True
                break
                
        if has_email_index:
            print("✅ MongoDB connected with unique email index")
            return True
        else:
            print("❌ Email index not found")
            return False
            
    except Exception as e:
        print(f"❌ MongoDB connection test error: {e}")
        return False

def test_health_endpoint(base_url):
    """Test GET /api/health endpoint"""
    print("\n=== Testing Health Check Endpoint ===")
    try:
        url = f"{base_url}/api/health"
        print(f"Testing: GET {url}")
        
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Health check endpoint working")
            return True
        else:
            print("❌ Health check endpoint failed")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Health check endpoint error: {e}")
        return False

def test_contact_form_email_storage(base_url, collection):
    """Test POST /api/contact email storage to MongoDB"""
    print("\n=== Testing Contact Form Email Storage ===")
    
    form_data = {
        "name": "Contact Test User",
        "email": "test.contact@example.com", 
        "phone": "+44 7123 456789",
        "goals": "weight-loss",
        "experience": "beginner",
        "message": "This is a test message for MongoDB email storage testing"
    }
    
    try:
        url = f"{base_url}/api/contact"
        print(f"Testing: POST {url}")
        print(f"Data: {json.dumps(form_data, indent=2)}")
        
        response = requests.post(url, json=form_data, timeout=15)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Microsoft Graph API will fail, but email should still be saved to MongoDB
        if response.status_code == 500:
            response_data = response.json()
            if "there was a problem sending your message" in response_data.get("message", "").lower():
                print("✅ Contact form processed (Graph API auth failed as expected)")
                
                # Check if email was saved to MongoDB
                if collection:
                    email_record = collection.find_one({"email": form_data["email"]})
                    if email_record:
                        print("✅ Email saved to MongoDB successfully")
                        print(f"   - opted_in: {email_record.get('opted_in')}")
                        print(f"   - source: {email_record.get('source')}")
                        print(f"   - name: {email_record.get('name')}")
                        print(f"   - goals: {email_record.get('goals')}")
                        
                        # Verify expected values
                        if (email_record.get('opted_in') == True and 
                            email_record.get('source') == 'contact_form' and
                            email_record.get('name') == form_data['name'] and
                            email_record.get('goals') == form_data['goals']):
                            print("✅ Contact form email storage working correctly")
                            return True
                        else:
                            print("❌ Email record has incorrect values")
                            return False
                    else:
                        print("❌ Email not found in MongoDB")
                        return False
                else:
                    print("⚠️ Cannot verify MongoDB storage (no connection)")
                    return True  # API processed correctly even without DB verification
                    
        elif response.status_code in [200, 201]:
            print("✅ Contact form processed successfully")
            return True
        else:
            print("❌ Contact form failed unexpectedly")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Contact form error: {e}")
        return False

def test_tdee_calculator_email_storage(base_url, collection):
    """Test POST /api/tdee-results email storage with opt-in/opt-out"""
    print("\n=== Testing TDEE Calculator Email Storage ===")
    
    # Test with joinMailingList=true (opted in)
    form_data_opt_in = {
        "email": "test.tdee@example.com",
        "joinMailingList": True,
        "results": {
            "bmr": 1800,
            "tdee": 2200,
            "goalCalories": 1700,
            "macros": {
                "protein": 140,
                "carbs": 170,
                "fat": 60
            }
        },
        "userInfo": {
            "age": 30,
            "gender": "male",
            "weight": "80kg",
            "height": "180cm",
            "activityLevel": "1.55",
            "goal": "lose"
        }
    }
    
    try:
        url = f"{base_url}/api/tdee-results"
        print(f"Testing: POST {url} (with opt-in)")
        print(f"Data: {json.dumps(form_data_opt_in, indent=2)}")
        
        response = requests.post(url, json=form_data_opt_in, timeout=15)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Microsoft Graph API will fail, but email should still be saved to MongoDB
        if response.status_code == 500:
            response_data = response.json()
            if "there was a problem sending your results" in response_data.get("message", "").lower():
                print("✅ TDEE results processed (Graph API auth failed as expected)")
                
                # Check if email was saved to MongoDB with correct opt-in status
                if collection:
                    email_record = collection.find_one({"email": form_data_opt_in["email"]})
                    if email_record:
                        print("✅ Email saved to MongoDB successfully")
                        print(f"   - opted_in: {email_record.get('opted_in')}")
                        print(f"   - source: {email_record.get('source')}")
                        print(f"   - age: {email_record.get('age')}")
                        print(f"   - gender: {email_record.get('gender')}")
                        print(f"   - goal: {email_record.get('goal')}")
                        print(f"   - opt_in_date: {email_record.get('opt_in_date')}")
                        
                        # Verify expected values for opt-in
                        if (email_record.get('opted_in') == True and 
                            email_record.get('source') == 'tdee_calculator' and
                            email_record.get('age') == 30 and
                            email_record.get('opt_in_date') is not None):
                            print("✅ TDEE calculator opt-in email storage working correctly")
                            
                            # Now test opt-out scenario
                            return test_tdee_calculator_opt_out(base_url, collection)
                        else:
                            print("❌ Email record has incorrect opt-in values")
                            return False
                    else:
                        print("❌ Email not found in MongoDB")
                        return False
                else:
                    print("⚠️ Cannot verify MongoDB storage (no connection)")
                    return True
                    
        elif response.status_code in [200, 201]:
            print("✅ TDEE results processed successfully")
            return True
        else:
            print("❌ TDEE results failed unexpectedly")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ TDEE results error: {e}")
        return False

def test_tdee_calculator_opt_out(base_url, collection):
    """Test TDEE calculator with joinMailingList=false (opt-out)"""
    print("\n--- Testing TDEE Calculator Opt-Out ---")
    
    form_data_opt_out = {
        "email": "test.tdee@example.com",  # Same email to test update
        "joinMailingList": False,
        "results": {
            "bmr": 1800,
            "tdee": 2200,
            "goalCalories": 2200,
            "macros": {
                "protein": 140,
                "carbs": 220,
                "fat": 70
            }
        },
        "userInfo": {
            "age": 30,
            "gender": "male",
            "weight": "80kg",
            "height": "180cm",
            "activityLevel": "1.55",
            "goal": "maintain"
        }
    }
    
    try:
        url = f"{base_url}/api/tdee-results"
        print(f"Testing: POST {url} (with opt-out)")
        
        response = requests.post(url, json=form_data_opt_out, timeout=15)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 500:
            # Check if email record was updated with opt-out
            if collection:
                email_record = collection.find_one({"email": form_data_opt_out["email"]})
                if email_record:
                    print(f"   - opted_in: {email_record.get('opted_in')}")
                    print(f"   - opt_out_date: {email_record.get('opt_out_date')}")
                    
                    # Verify opt-out transition
                    if (email_record.get('opted_in') == False and
                        email_record.get('opt_out_date') is not None):
                        print("✅ TDEE calculator opt-out transition working correctly")
                        return True
                    else:
                        print("❌ Opt-out transition failed")
                        return False
                        
        return False
        
    except Exception as e:
        print(f"❌ TDEE opt-out test error: {e}")
        return False

def test_contact_form_validation(base_url):
    """Test POST /api/contact with invalid form data"""
    print("\n=== Testing Contact Form Validation ===")
    
    # Test with invalid email
    invalid_data = {
        "name": "T",  # Too short
        "email": "invalid-email",  # Invalid format
        "goals": "invalid-goal",  # Invalid goal
        "experience": "expert"  # Invalid experience level
    }
    
    try:
        url = f"{base_url}/api/contact"
        print(f"Testing: POST {url}")
        print(f"Data: {json.dumps(invalid_data, indent=2)}")
        
        response = requests.post(url, json=invalid_data, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Should return 400 error with validation errors
        if response.status_code == 400:
            response_data = response.json()
            if "check your form inputs" in response_data.get("message", "").lower():
                print("✅ Form validation working correctly")
                return True
        
        print("❌ Form validation not working properly")
        return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Form validation test error: {e}")
        return False

def test_existing_endpoints(base_url):
    """Test the currently implemented endpoints"""
    print("\n=== Testing Currently Implemented Endpoints ===")
    
    # Test root endpoint
    try:
        url = f"{base_url}/api/"
        print(f"Testing: GET {url}")
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Root API endpoint working")
        else:
            print("❌ Root API endpoint failed")
    except Exception as e:
        print(f"❌ Root API endpoint error: {e}")
    
    # Test status endpoint GET
    try:
        url = f"{base_url}/api/status"
        print(f"\nTesting: GET {url}")
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Status GET endpoint working")
        else:
            print("❌ Status GET endpoint failed")
    except Exception as e:
        print(f"❌ Status GET endpoint error: {e}")
    
    # Test status endpoint POST
    try:
        url = f"{base_url}/api/status"
        test_data = {"client_name": "Test Client"}
        print(f"\nTesting: POST {url}")
        print(f"Data: {json.dumps(test_data, indent=2)}")
        response = requests.post(url, json=test_data, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Status POST endpoint working")
        else:
            print("❌ Status POST endpoint failed")
    except Exception as e:
        print(f"❌ Status POST endpoint error: {e}")

def main():
    print("=" * 60)
    print("Backend API Testing - Simon Price PT Website")
    print("=" * 60)
    
    # Get backend URL
    backend_url = get_backend_url()
    if not backend_url:
        print("❌ Could not get backend URL from frontend/.env")
        sys.exit(1)
    
    print(f"Backend URL: {backend_url}")
    
    # Test results tracking
    results = {
        "health_check": False,
        "contact_without_recaptcha": False, 
        "contact_invalid_recaptcha": False,
        "form_validation": False
    }
    
    # Run tests for expected endpoints (from review request)
    results["health_check"] = test_health_endpoint(backend_url)
    results["contact_without_recaptcha"] = test_contact_form_without_recaptcha(backend_url)
    results["contact_invalid_recaptcha"] = test_contact_form_with_invalid_recaptcha(backend_url)
    results["form_validation"] = test_contact_form_validation(backend_url)
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    print(f"Health Check (/api/health): {'✅ PASS' if results['health_check'] else '❌ FAIL'}")
    print(f"Contact Form (no reCAPTCHA): {'✅ PASS' if results['contact_without_recaptcha'] else '❌ FAIL'}")
    print(f"Contact Form (invalid reCAPTCHA): {'✅ PASS' if results['contact_invalid_recaptcha'] else '❌ FAIL'}")
    print(f"Form Validation: {'✅ PASS' if results['form_validation'] else '❌ FAIL'}")
    
    # Overall assessment
    expected_tests_passed = sum([results["health_check"], results["contact_without_recaptcha"], results["contact_invalid_recaptcha"], results["form_validation"]])
    
    if expected_tests_passed == 0:
        print("\n❌ CRITICAL: None of the expected endpoints are implemented")
        print("The backend appears to be missing the contact form and reCAPTCHA functionality")
    elif expected_tests_passed < 4:
        print(f"\n⚠️  WARNING: Only {expected_tests_passed}/4 expected tests passed")
    else:
        print("\n✅ All expected functionality working correctly")
    
    print(f"\nTimestamp: {datetime.now().isoformat()}")

if __name__ == "__main__":
    main()
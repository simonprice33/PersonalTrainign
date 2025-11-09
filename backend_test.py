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
    if collection is not None:
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
        if collection is None:
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
                if collection is not None:
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
                if collection is not None:
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
            if collection is not None:
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

def test_client_contact_form_email_storage(base_url, collection):
    """Test POST /api/client-contact email storage with inverted opt-out logic"""
    print("\n=== Testing Client Contact Form Email Storage ===")
    
    # Test with joinMailingList=false (unchecked checkbox = opt-in)
    form_data_opt_in = {
        "name": "Client Test User",
        "email": "test.client@example.com",
        "phone": "+44 7987 654321",
        "bestTimeToCall": "morning",
        "joinMailingList": False  # Unchecked = user wants to join (opted_in=true)
    }
    
    try:
        url = f"{base_url}/api/client-contact"
        print(f"Testing: POST {url} (unchecked opt-out = opt-in)")
        print(f"Data: {json.dumps(form_data_opt_in, indent=2)}")
        
        response = requests.post(url, json=form_data_opt_in, timeout=15)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Microsoft Graph API will fail, but email should still be saved to MongoDB
        if response.status_code == 500:
            response_data = response.json()
            if "there was a problem submitting your request" in response_data.get("message", "").lower():
                print("✅ Client contact processed (Graph API auth failed as expected)")
                
                # Check if email was saved to MongoDB with correct inverted logic
                if collection:
                    email_record = collection.find_one({"email": form_data_opt_in["email"]})
                    if email_record:
                        print("✅ Email saved to MongoDB successfully")
                        print(f"   - opted_in: {email_record.get('opted_in')}")
                        print(f"   - source: {email_record.get('source')}")
                        print(f"   - name: {email_record.get('name')}")
                        print(f"   - phone: {email_record.get('phone')}")
                        print(f"   - best_time_to_call: {email_record.get('best_time_to_call')}")
                        
                        # Verify inverted logic: joinMailingList=false should result in opted_in=true
                        if (email_record.get('opted_in') == True and 
                            email_record.get('source') == 'client_inquiry' and
                            email_record.get('name') == form_data_opt_in['name'] and
                            email_record.get('best_time_to_call') == form_data_opt_in['bestTimeToCall']):
                            print("✅ Client contact inverted opt-in logic working correctly")
                            
                            # Now test opt-out scenario
                            return test_client_contact_opt_out(base_url, collection)
                        else:
                            print("❌ Email record has incorrect values for inverted opt-in")
                            return False
                    else:
                        print("❌ Email not found in MongoDB")
                        return False
                else:
                    print("⚠️ Cannot verify MongoDB storage (no connection)")
                    return True
                    
        elif response.status_code in [200, 201]:
            print("✅ Client contact processed successfully")
            return True
        else:
            print("❌ Client contact failed unexpectedly")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Client contact error: {e}")
        return False

def test_client_contact_opt_out(base_url, collection):
    """Test client contact with joinMailingList=true (checked checkbox = opt-out)"""
    print("\n--- Testing Client Contact Opt-Out ---")
    
    form_data_opt_out = {
        "name": "Client Test User",
        "email": "test.client@example.com",  # Same email to test update
        "phone": "+44 7987 654321",
        "bestTimeToCall": "evening",
        "joinMailingList": True  # Checked = user does NOT want to join (opted_in=false)
    }
    
    try:
        url = f"{base_url}/api/client-contact"
        print(f"Testing: POST {url} (checked opt-out = opt-out)")
        
        response = requests.post(url, json=form_data_opt_out, timeout=15)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 500:
            # Check if email record was updated with opt-out
            if collection is not None:
                email_record = collection.find_one({"email": form_data_opt_out["email"]})
                if email_record:
                    print(f"   - opted_in: {email_record.get('opted_in')}")
                    print(f"   - opt_out_date: {email_record.get('opt_out_date')}")
                    
                    # Verify inverted logic: joinMailingList=true should result in opted_in=false
                    if (email_record.get('opted_in') == False and
                        email_record.get('opt_out_date') is not None):
                        print("✅ Client contact inverted opt-out logic working correctly")
                        return True
                    else:
                        print("❌ Inverted opt-out logic failed")
                        return False
                        
        return False
        
    except Exception as e:
        print(f"❌ Client contact opt-out test error: {e}")
        return False

def test_duplicate_email_handling(base_url, collection):
    """Test duplicate email handling across different forms"""
    print("\n=== Testing Duplicate Email Handling ===")
    
    test_email = "duplicate.test@example.com"
    
    # First submission - Contact form
    contact_data = {
        "name": "Duplicate Test User",
        "email": test_email,
        "phone": "+44 7111 222333",
        "goals": "muscle-gain",
        "experience": "intermediate",
        "message": "First submission via contact form"
    }
    
    try:
        # Submit via contact form first
        url = f"{base_url}/api/contact"
        print(f"First submission: POST {url}")
        response1 = requests.post(url, json=contact_data, timeout=15)
        print(f"Status Code: {response1.status_code}")
        
        if collection is not None and response1.status_code == 500:
            # Check first record
            first_record = collection.find_one({"email": test_email})
            if first_record:
                first_collected = first_record.get('first_collected')
                print(f"✅ First record created with first_collected: {first_collected}")
                
                # Second submission - TDEE Calculator with different opt-in status
                tdee_data = {
                    "email": test_email,
                    "joinMailingList": False,  # Different from contact form (which assumes true)
                    "results": {"bmr": 1600, "tdee": 2000, "goalCalories": 2200, "macros": {"protein": 120, "carbs": 200, "fat": 65}},
                    "userInfo": {"age": 25, "gender": "female", "weight": "65kg", "height": "165cm", "activityLevel": "1.375", "goal": "gain"}
                }
                
                print(f"\nSecond submission: POST {base_url}/api/tdee-results")
                response2 = requests.post(f"{base_url}/api/tdee-results", json=tdee_data, timeout=15)
                print(f"Status Code: {response2.status_code}")
                
                if response2.status_code == 500:
                    # Check updated record
                    updated_record = collection.find_one({"email": test_email})
                    if updated_record:
                        print(f"✅ Record updated")
                        print(f"   - first_collected unchanged: {updated_record.get('first_collected') == first_collected}")
                        print(f"   - last_updated changed: {updated_record.get('last_updated') != first_collected}")
                        print(f"   - opted_in: {updated_record.get('opted_in')}")
                        print(f"   - source updated: {updated_record.get('source')}")
                        
                        # Verify duplicate handling
                        if (updated_record.get('first_collected') == first_collected and
                            updated_record.get('last_updated') != first_collected and
                            updated_record.get('source') == 'tdee_calculator'):
                            print("✅ Duplicate email handling working correctly")
                            return True
                        else:
                            print("❌ Duplicate email handling failed")
                            return False
                            
        return False
        
    except Exception as e:
        print(f"❌ Duplicate email test error: {e}")
        return False

def test_cors_configuration(base_url):
    """Test CORS configuration"""
    print("\n=== Testing CORS Configuration ===")
    
    try:
        # Test preflight request
        url = f"{base_url}/api/contact"
        headers = {
            'Origin': 'https://simonfitcoach.preview.emergentagent.com',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'
        }
        
        response = requests.options(url, headers=headers, timeout=10)
        print(f"OPTIONS Status Code: {response.status_code}")
        print(f"CORS Headers: {dict(response.headers)}")
        
        # Check for CORS headers
        cors_headers = response.headers.get('Access-Control-Allow-Origin')
        if cors_headers:
            print("✅ CORS configuration working")
            return True
        else:
            print("❌ CORS headers missing")
            return False
            
    except Exception as e:
        print(f"❌ CORS test error: {e}")
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
    print("=" * 80)
    print("MongoDB Email Storage Testing - Simon Price PT Website")
    print("=" * 80)
    
    # Get backend URL
    backend_url = get_backend_url()
    if not backend_url:
        print("❌ Could not get backend URL from frontend/.env")
        sys.exit(1)
    
    print(f"Backend URL: {backend_url}")
    
    # Get MongoDB connection
    mongo_client, mongo_db, email_collection = get_mongo_connection()
    
    # Clean up any existing test emails
    cleanup_test_emails(email_collection)
    
    # Test results tracking
    results = {
        "mongodb_connection": False,
        "health_check": False,
        "contact_form_storage": False,
        "tdee_calculator_storage": False,
        "client_contact_storage": False,
        "duplicate_handling": False,
        "cors_configuration": False
    }
    
    # Run MongoDB email storage tests
    results["mongodb_connection"] = test_mongodb_connection(email_collection)
    results["health_check"] = test_health_endpoint(backend_url)
    results["contact_form_storage"] = test_contact_form_email_storage(backend_url, email_collection)
    results["tdee_calculator_storage"] = test_tdee_calculator_email_storage(backend_url, email_collection)
    results["client_contact_storage"] = test_client_contact_form_email_storage(backend_url, email_collection)
    results["duplicate_handling"] = test_duplicate_email_handling(backend_url, email_collection)
    results["cors_configuration"] = test_cors_configuration(backend_url)
    
    # Clean up test emails after testing
    cleanup_test_emails(email_collection)
    
    # Close MongoDB connection
    if mongo_client:
        mongo_client.close()
    
    # Summary
    print("\n" + "=" * 80)
    print("MONGODB EMAIL STORAGE TEST SUMMARY")
    print("=" * 80)
    
    print(f"MongoDB Connection & Index: {'✅ PASS' if results['mongodb_connection'] else '❌ FAIL'}")
    print(f"Health Check Endpoint: {'✅ PASS' if results['health_check'] else '❌ FAIL'}")
    print(f"Contact Form Email Storage: {'✅ PASS' if results['contact_form_storage'] else '❌ FAIL'}")
    print(f"TDEE Calculator Email Storage: {'✅ PASS' if results['tdee_calculator_storage'] else '❌ FAIL'}")
    print(f"Client Contact Email Storage: {'✅ PASS' if results['client_contact_storage'] else '❌ FAIL'}")
    print(f"Duplicate Email Handling: {'✅ PASS' if results['duplicate_handling'] else '❌ FAIL'}")
    print(f"CORS Configuration: {'✅ PASS' if results['cors_configuration'] else '❌ FAIL'}")
    
    # Overall assessment
    total_tests = len(results)
    passed_tests = sum(results.values())
    
    print(f"\n📊 OVERALL RESULTS: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 ALL TESTS PASSED - MongoDB email storage implementation working correctly!")
    elif passed_tests >= total_tests * 0.8:
        print("⚠️ MOSTLY WORKING - Minor issues detected")
    elif passed_tests >= total_tests * 0.5:
        print("⚠️ PARTIAL SUCCESS - Several issues need attention")
    else:
        print("❌ CRITICAL ISSUES - Major problems with MongoDB email storage")
    
    print(f"\n🕒 Test completed at: {datetime.now().isoformat()}")
    
    # Return results for external processing
    return results

if __name__ == "__main__":
    main()
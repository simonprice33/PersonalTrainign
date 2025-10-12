#!/usr/bin/env python3
"""
Backend API Testing Script for Simon Price PT Website
Tests the contact form submission with reCAPTCHA v2 integration
"""

import requests
import json
import sys
from datetime import datetime

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

def test_contact_form_without_recaptcha(base_url):
    """Test POST /api/contact without reCAPTCHA token"""
    print("\n=== Testing Contact Form Without reCAPTCHA ===")
    
    form_data = {
        "name": "Test User",
        "email": "test@example.com", 
        "phone": "+44 7123 456789",
        "goals": "weight-loss",
        "experience": "beginner",
        "message": "This is a test message for reCAPTCHA integration"
    }
    
    try:
        url = f"{base_url}/api/contact"
        print(f"Testing: POST {url}")
        print(f"Data: {json.dumps(form_data, indent=2)}")
        
        response = requests.post(url, json=form_data, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        # According to requirements, should process but log warning
        if response.status_code in [200, 201]:
            print("✅ Contact form without reCAPTCHA processed (as expected)")
            return True
        else:
            print("❌ Contact form without reCAPTCHA failed")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Contact form without reCAPTCHA error: {e}")
        return False

def test_contact_form_with_invalid_recaptcha(base_url):
    """Test POST /api/contact with invalid reCAPTCHA token"""
    print("\n=== Testing Contact Form With Invalid reCAPTCHA ===")
    
    form_data = {
        "name": "Test User",
        "email": "test@example.com",
        "phone": "+44 7123 456789", 
        "goals": "weight-loss",
        "experience": "beginner",
        "message": "This is a test message for reCAPTCHA integration",
        "recaptchaToken": "invalid_token_12345"
    }
    
    try:
        url = f"{base_url}/api/contact"
        print(f"Testing: POST {url}")
        print(f"Data: {json.dumps(form_data, indent=2)}")
        
        response = requests.post(url, json=form_data, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Should return 400 error about reCAPTCHA verification failed
        if response.status_code == 400:
            print("✅ Contact form with invalid reCAPTCHA properly rejected")
            return True
        else:
            print("❌ Contact form with invalid reCAPTCHA not properly handled")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Contact form with invalid reCAPTCHA error: {e}")
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
        "existing_endpoints": True  # Will test what's actually implemented
    }
    
    # Run tests for expected endpoints (from review request)
    results["health_check"] = test_health_endpoint(backend_url)
    results["contact_without_recaptcha"] = test_contact_form_without_recaptcha(backend_url)
    results["contact_invalid_recaptcha"] = test_contact_form_with_invalid_recaptcha(backend_url)
    
    # Test what's actually implemented
    test_existing_endpoints(backend_url)
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    print(f"Health Check (/api/health): {'✅ PASS' if results['health_check'] else '❌ FAIL'}")
    print(f"Contact Form (no reCAPTCHA): {'✅ PASS' if results['contact_without_recaptcha'] else '❌ FAIL'}")
    print(f"Contact Form (invalid reCAPTCHA): {'✅ PASS' if results['contact_invalid_recaptcha'] else '❌ FAIL'}")
    
    # Overall assessment
    expected_tests_passed = sum([results["health_check"], results["contact_without_recaptcha"], results["contact_invalid_recaptcha"]])
    
    if expected_tests_passed == 0:
        print("\n❌ CRITICAL: None of the expected endpoints are implemented")
        print("The backend appears to be missing the contact form and reCAPTCHA functionality")
    elif expected_tests_passed < 3:
        print(f"\n⚠️  WARNING: Only {expected_tests_passed}/3 expected tests passed")
    else:
        print("\n✅ All expected functionality working correctly")
    
    print(f"\nTimestamp: {datetime.now().isoformat()}")

if __name__ == "__main__":
    main()
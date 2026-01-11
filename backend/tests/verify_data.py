#!/usr/bin/env python3
"""
Quick verification test to check data persistence
"""

import requests
import json

BASE_URL = "https://cms-refresh.preview.emergentagent.com/api"
ADMIN_EMAIL = "simon.price@simonprice-pt.co.uk"
ADMIN_PASSWORD = "Qwerty1234!!!"

def authenticate():
    """Get access token"""
    response = requests.post(
        f"{BASE_URL}/admin/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    if response.status_code == 200:
        return response.json().get('accessToken')
    return None

def verify_data_persistence():
    """Verify that data is properly stored and retrieved"""
    token = authenticate()
    if not token:
        print("❌ Authentication failed")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("🔍 VERIFYING DATA PERSISTENCE...")
    
    # Check packages
    response = requests.get(f"{BASE_URL}/admin/packages", headers=headers)
    if response.status_code == 200:
        data = response.json()
        packages = data.get('packages', [])
        print(f"✅ Packages: Found {len(packages)} packages")
        for pkg in packages:
            print(f"   • {pkg.get('name')} - £{pkg.get('price')} - {pkg.get('id')}")
    
    # Check PARQ questions
    response = requests.get(f"{BASE_URL}/admin/parq-questions", headers=headers)
    if response.status_code == 200:
        data = response.json()
        questions = data.get('questions', [])
        print(f"✅ PARQ Questions: Found {len(questions)} questions")
        for q in questions[:3]:  # Show first 3
            print(f"   • Order {q.get('order')}: {q.get('question')[:50]}...")
    
    # Check health questions
    response = requests.get(f"{BASE_URL}/admin/health-questions", headers=headers)
    if response.status_code == 200:
        data = response.json()
        questions = data.get('questions', [])
        print(f"✅ Health Questions: Found {len(questions)} questions")
        for q in questions[:3]:  # Show first 3
            print(f"   • Order {q.get('order')}: {q.get('question')[:50]}... (Type: {q.get('type')})")

if __name__ == "__main__":
    verify_data_persistence()
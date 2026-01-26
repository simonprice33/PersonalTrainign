"""
Test suite for Policy Management endpoints
Tests all 4 policy types: Cancellation, Terms of Service, Privacy, Cookie
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://admin-refactor-6.preview.emergentagent.com')

# Admin credentials
ADMIN_EMAIL = "simon.price@simonprice-pt.co.uk"
ADMIN_PASSWORD = "NewTest123!"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/admin/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    data = response.json()
    assert data.get("success") is True
    assert "accessToken" in data
    return data["accessToken"]


@pytest.fixture
def auth_headers(admin_token):
    """Return headers with auth token"""
    return {"Authorization": f"Bearer {admin_token}"}


class TestPublicPolicyEndpoints:
    """Test public (unauthenticated) policy endpoints"""
    
    def test_health_check(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
    
    def test_public_cancellation_policy(self):
        """Test public cancellation policy endpoint"""
        response = requests.get(f"{BASE_URL}/api/cancellation-policy")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "sections" in data
        assert isinstance(data["sections"], list)
    
    def test_public_terms_of_service(self):
        """Test public terms of service endpoint"""
        response = requests.get(f"{BASE_URL}/api/terms-of-service")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "sections" in data
        assert isinstance(data["sections"], list)
    
    def test_public_privacy_policy(self):
        """Test public privacy policy endpoint"""
        response = requests.get(f"{BASE_URL}/api/privacy-policy")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "sections" in data
        assert isinstance(data["sections"], list)
    
    def test_public_cookie_policy(self):
        """Test public cookie policy endpoint"""
        response = requests.get(f"{BASE_URL}/api/cookie-policy")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "sections" in data
        assert isinstance(data["sections"], list)


class TestAdminPolicyEndpoints:
    """Test admin policy management endpoints"""
    
    def test_admin_get_cancellation_policy(self, auth_headers):
        """Test admin get cancellation policy"""
        response = requests.get(
            f"{BASE_URL}/api/admin/cancellation-policy",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "sections" in data
    
    def test_admin_get_terms_of_service(self, auth_headers):
        """Test admin get terms of service"""
        response = requests.get(
            f"{BASE_URL}/api/admin/policies/terms-of-service",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "sections" in data
    
    def test_admin_get_privacy_policy(self, auth_headers):
        """Test admin get privacy policy"""
        response = requests.get(
            f"{BASE_URL}/api/admin/policies/privacy-policy",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "sections" in data
    
    def test_admin_get_cookie_policy(self, auth_headers):
        """Test admin get cookie policy"""
        response = requests.get(
            f"{BASE_URL}/api/admin/policies/cookie-policy",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "sections" in data


class TestPolicyCRUDOperations:
    """Test CRUD operations for policy sections and items"""
    
    @pytest.fixture
    def test_section_id(self, auth_headers):
        """Create a test section and return its ID, cleanup after test"""
        # Create section
        response = requests.post(
            f"{BASE_URL}/api/admin/policies/privacy-policy/sections",
            headers=auth_headers,
            json={"title": "TEST_Privacy Section"}
        )
        assert response.status_code == 201
        data = response.json()
        section_id = data["section"]["id"]
        
        yield section_id
        
        # Cleanup - delete section
        requests.delete(
            f"{BASE_URL}/api/admin/policies/privacy-policy/sections/{section_id}",
            headers=auth_headers
        )
    
    def test_create_policy_section(self, auth_headers):
        """Test creating a policy section"""
        response = requests.post(
            f"{BASE_URL}/api/admin/policies/cookie-policy/sections",
            headers=auth_headers,
            json={"title": "TEST_Cookie Section"}
        )
        assert response.status_code == 201
        data = response.json()
        assert data.get("success") is True
        assert "section" in data
        assert data["section"]["title"] == "TEST_Cookie Section"
        
        # Cleanup
        section_id = data["section"]["id"]
        requests.delete(
            f"{BASE_URL}/api/admin/policies/cookie-policy/sections/{section_id}",
            headers=auth_headers
        )
    
    def test_update_policy_section(self, auth_headers, test_section_id):
        """Test updating a policy section"""
        response = requests.put(
            f"{BASE_URL}/api/admin/policies/privacy-policy/sections/{test_section_id}",
            headers=auth_headers,
            json={"title": "TEST_Updated Privacy Section"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
    
    def test_add_item_to_section(self, auth_headers, test_section_id):
        """Test adding an item to a policy section"""
        response = requests.post(
            f"{BASE_URL}/api/admin/policies/privacy-policy/sections/{test_section_id}/items",
            headers=auth_headers,
            json={"text": "TEST_Privacy item text"}
        )
        assert response.status_code == 201
        data = response.json()
        assert data.get("success") is True
        assert "item" in data
        assert data["item"]["text"] == "TEST_Privacy item text"
    
    def test_update_item_in_section(self, auth_headers, test_section_id):
        """Test updating an item in a policy section"""
        # First add an item
        add_response = requests.post(
            f"{BASE_URL}/api/admin/policies/privacy-policy/sections/{test_section_id}/items",
            headers=auth_headers,
            json={"text": "TEST_Original text"}
        )
        item_id = add_response.json()["item"]["id"]
        
        # Update the item
        response = requests.put(
            f"{BASE_URL}/api/admin/policies/privacy-policy/sections/{test_section_id}/items/{item_id}",
            headers=auth_headers,
            json={"text": "TEST_Updated text"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
    
    def test_delete_item_from_section(self, auth_headers, test_section_id):
        """Test deleting an item from a policy section"""
        # First add an item
        add_response = requests.post(
            f"{BASE_URL}/api/admin/policies/privacy-policy/sections/{test_section_id}/items",
            headers=auth_headers,
            json={"text": "TEST_Item to delete"}
        )
        item_id = add_response.json()["item"]["id"]
        
        # Delete the item
        response = requests.delete(
            f"{BASE_URL}/api/admin/policies/privacy-policy/sections/{test_section_id}/items/{item_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
    
    def test_delete_policy_section(self, auth_headers):
        """Test deleting a policy section"""
        # Create a section to delete
        create_response = requests.post(
            f"{BASE_URL}/api/admin/policies/terms-of-service/sections",
            headers=auth_headers,
            json={"title": "TEST_Section to delete"}
        )
        section_id = create_response.json()["section"]["id"]
        
        # Delete the section
        response = requests.delete(
            f"{BASE_URL}/api/admin/policies/terms-of-service/sections/{section_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True


class TestCancellationPolicyCRUD:
    """Test CRUD operations specifically for cancellation policy (uses different endpoint pattern)"""
    
    @pytest.fixture
    def cancellation_section_id(self, auth_headers):
        """Create a test cancellation section and return its ID"""
        response = requests.post(
            f"{BASE_URL}/api/admin/cancellation-policy/sections",
            headers=auth_headers,
            json={"title": "TEST_Cancellation Section"}
        )
        assert response.status_code == 201
        section_id = response.json()["section"]["id"]
        
        yield section_id
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/admin/cancellation-policy/sections/{section_id}",
            headers=auth_headers
        )
    
    def test_create_cancellation_section(self, auth_headers):
        """Test creating a cancellation policy section"""
        response = requests.post(
            f"{BASE_URL}/api/admin/cancellation-policy/sections",
            headers=auth_headers,
            json={"title": "TEST_New Cancellation Section"}
        )
        assert response.status_code == 201
        data = response.json()
        assert data.get("success") is True
        
        # Cleanup
        section_id = data["section"]["id"]
        requests.delete(
            f"{BASE_URL}/api/admin/cancellation-policy/sections/{section_id}",
            headers=auth_headers
        )
    
    def test_add_item_to_cancellation_section(self, auth_headers, cancellation_section_id):
        """Test adding an item to cancellation policy section"""
        response = requests.post(
            f"{BASE_URL}/api/admin/cancellation-policy/sections/{cancellation_section_id}/items",
            headers=auth_headers,
            json={"text": "TEST_30 days notice required"}
        )
        assert response.status_code == 201
        data = response.json()
        assert data.get("success") is True
        assert data["item"]["text"] == "TEST_30 days notice required"


class TestInvalidPolicyType:
    """Test handling of invalid policy types"""
    
    def test_invalid_policy_type_returns_error(self, auth_headers):
        """Test that invalid policy type returns appropriate error"""
        response = requests.get(
            f"{BASE_URL}/api/admin/policies/invalid-policy",
            headers=auth_headers
        )
        assert response.status_code == 400
        data = response.json()
        assert data.get("success") is False


class TestUnauthorizedAccess:
    """Test that admin endpoints require authentication"""
    
    def test_admin_endpoint_requires_auth(self):
        """Test that admin policy endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/cancellation-policy")
        assert response.status_code == 401
    
    def test_create_section_requires_auth(self):
        """Test that creating section requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/admin/policies/privacy-policy/sections",
            json={"title": "Unauthorized Section"}
        )
        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

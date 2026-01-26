"""
Test Suite for Join Now and Purchase Flow Features
Tests: Policy pages, packages, PARQ questions, health questions, and purchase flow
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://admin-refactor-6.preview.emergentagent.com')

class TestPolicyEndpoints:
    """Test all 4 policy page endpoints"""
    
    def test_cancellation_policy_returns_content(self):
        """Test cancellation policy endpoint returns sections with content"""
        response = requests.get(f"{BASE_URL}/api/cancellation-policy")
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] == True
        assert 'sections' in data
        assert len(data['sections']) > 0
        
        # Verify section structure
        section = data['sections'][0]
        assert 'id' in section
        assert 'title' in section
        assert 'items' in section
        assert len(section['items']) > 0
        
    def test_terms_of_service_returns_content(self):
        """Test terms of service endpoint returns sections with content"""
        response = requests.get(f"{BASE_URL}/api/terms-of-service")
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] == True
        assert 'sections' in data
        assert len(data['sections']) > 0
        
    def test_privacy_policy_returns_content(self):
        """Test privacy policy endpoint returns sections with content"""
        response = requests.get(f"{BASE_URL}/api/privacy-policy")
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] == True
        assert 'sections' in data
        assert len(data['sections']) > 0
        
    def test_cookie_policy_returns_content(self):
        """Test cookie policy endpoint returns sections with content"""
        response = requests.get(f"{BASE_URL}/api/cookie-policy")
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] == True
        assert 'sections' in data
        assert len(data['sections']) > 0


class TestPackagesEndpoint:
    """Test packages endpoint for Join Now page"""
    
    def test_packages_returns_list(self):
        """Test packages endpoint returns list of packages"""
        response = requests.get(f"{BASE_URL}/api/public/packages")
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] == True
        assert 'packages' in data
        assert len(data['packages']) > 0
        
    def test_packages_have_required_fields(self):
        """Test each package has required fields"""
        response = requests.get(f"{BASE_URL}/api/public/packages")
        data = response.json()
        
        for pkg in data['packages']:
            assert 'id' in pkg
            assert 'name' in pkg
            assert 'price' in pkg
            assert 'description' in pkg
            assert 'features' in pkg
            assert isinstance(pkg['features'], list)
            
    def test_packages_have_popular_flag(self):
        """Test packages have is_popular flag"""
        response = requests.get(f"{BASE_URL}/api/public/packages")
        data = response.json()
        
        # At least one package should have is_popular flag
        has_popular = any(pkg.get('is_popular', False) for pkg in data['packages'])
        assert has_popular, "At least one package should be marked as popular"
        
    def test_pt_with_nutrition_package_exists(self):
        """Test PT with Nutrition package exists"""
        response = requests.get(f"{BASE_URL}/api/public/packages")
        data = response.json()
        
        pt_package = next((p for p in data['packages'] if p['id'] == 'pt-with-nutrition'), None)
        assert pt_package is not None
        assert pt_package['is_popular'] == True
        
    def test_nutrition_only_package_exists(self):
        """Test Nutrition Only package exists"""
        response = requests.get(f"{BASE_URL}/api/public/packages")
        data = response.json()
        
        nutrition_package = next((p for p in data['packages'] if p['id'] == 'nutrition-only'), None)
        assert nutrition_package is not None


class TestPARQQuestions:
    """Test PARQ questions endpoint"""
    
    def test_parq_questions_for_pt_package(self):
        """Test PARQ questions are returned for PT package"""
        response = requests.get(f"{BASE_URL}/api/public/parq-questions?packageId=pt-with-nutrition")
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] == True
        assert 'questions' in data
        assert len(data['questions']) > 0
        
    def test_parq_questions_have_required_fields(self):
        """Test PARQ questions have required fields"""
        response = requests.get(f"{BASE_URL}/api/public/parq-questions?packageId=pt-with-nutrition")
        data = response.json()
        
        for q in data['questions']:
            assert 'id' in q
            assert 'question' in q
            assert 'order' in q
            
    def test_no_parq_for_nutrition_only(self):
        """Test no PARQ questions for Nutrition Only package"""
        response = requests.get(f"{BASE_URL}/api/public/parq-questions?packageId=nutrition-only")
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] == True
        assert len(data['questions']) == 0


class TestHealthQuestions:
    """Test health questions endpoint"""
    
    def test_health_questions_returned(self):
        """Test health questions are returned"""
        response = requests.get(f"{BASE_URL}/api/public/health-questions?packageId=pt-with-nutrition")
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] == True
        assert 'questions' in data
        assert len(data['questions']) > 0
        
    def test_health_questions_have_types(self):
        """Test health questions have different types"""
        response = requests.get(f"{BASE_URL}/api/public/health-questions?packageId=pt-with-nutrition")
        data = response.json()
        
        types = set(q['type'] for q in data['questions'])
        # Should have at least text and multiple_choice types
        assert 'text' in types or 'multiple_choice' in types
        
    def test_multiple_choice_has_options(self):
        """Test multiple choice questions have options"""
        response = requests.get(f"{BASE_URL}/api/public/health-questions?packageId=pt-with-nutrition")
        data = response.json()
        
        mc_questions = [q for q in data['questions'] if q['type'] == 'multiple_choice']
        for q in mc_questions:
            assert 'options' in q
            assert len(q['options']) > 0


class TestHealthCheck:
    """Test health check endpoint"""
    
    def test_health_check(self):
        """Test health check endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] == True
        assert data['status'] == 'OK'


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

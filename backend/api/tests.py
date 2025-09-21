from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
import json
from .models import Startup, StartupTag, Position, Application
from .authentication import create_jwt_token

User = get_user_model()


class AuthenticationTestCase(APITestCase):
    """Test cases for authentication endpoints"""
    
    def setUp(self):
        self.signup_url = reverse('signup')
        self.login_url = reverse('login')
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpassword123'
        }
    
    def test_user_signup(self):
        """Test user registration"""
        response = self.client.post(self.signup_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', response.data)
        self.assertIn('user', response.data)
        self.assertTrue(User.objects.filter(email=self.user_data['email']).exists())
    
    def test_user_login(self):
        """Test user login"""
        # Create user first
        user = User.objects.create_user(
            username=self.user_data['username'],
            email=self.user_data['email'],
            password=self.user_data['password']
        )
        
        login_data = {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }
        response = self.client.post(self.login_url, login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        self.assertIn('user', response.data)
    
    def test_invalid_login(self):
        """Test login with invalid credentials"""
        login_data = {
            'email': 'nonexistent@example.com',
            'password': 'wrongpassword'
        }
        response = self.client.post(self.login_url, login_data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class StartupTestCase(APITestCase):
    """Test cases for startup endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword123'
        )
        self.token = create_jwt_token(self.user)
        self.client.cookies['token'] = self.token
        
        self.startup_data = {
            'title': 'Test Startup',
            'description': 'This is a test startup description that is long enough',
            'field': 'Technology',
            'type': 'marketplace',
            'category': 'saas'
        }
    
    def test_create_startup(self):
        """Test creating a startup"""
        url = reverse('startup_create')
        response = self.client.post(url, self.startup_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Startup.objects.filter(title=self.startup_data['title']).exists())
    
    def test_marketplace_list(self):
        """Test marketplace listing"""
        # Create a startup
        startup = Startup.objects.create(
            owner=self.user,
            title='Test Marketplace Startup',
            description='Test description for marketplace',
            field='Technology',
            type='marketplace'
        )
        
        url = reverse('marketplace_list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
    
    def test_startup_detail(self):
        """Test startup detail view"""
        startup = Startup.objects.create(
            owner=self.user,
            title='Test Startup Detail',
            description='Test description for detail view',
            field='Technology'
        )
        
        url = reverse('startup_detail', kwargs={'pk': startup.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], startup.title)


class ApplicationTestCase(APITestCase):
    """Test cases for application endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword123'
        )
        self.token = create_jwt_token(self.user)
        self.client.cookies['token'] = self.token
        
        # Create a startup and position
        self.startup = Startup.objects.create(
            owner=self.user,
            title='Test Startup',
            description='Test description for applications',
            field='Technology',
            type='collaboration'
        )
        
        self.position = Position.objects.create(
            startup=self.startup,
            title='Test Position',
            description='Test position description'
        )
    
    def test_apply_for_collaboration(self):
        """Test applying for a collaboration"""
        url = reverse('apply_collaboration', kwargs={'pk': self.startup.id})
        application_data = {
            'position_id': str(self.position.id),
            'cover_letter': 'This is my cover letter',
            'experience': 'I have 5 years of experience'
        }
        
        response = self.client.post(url, application_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', response.data)
        self.assertTrue(Application.objects.filter(
            applicant=self.user,
            position=self.position
        ).exists())
    
    def test_user_applications(self):
        """Test getting user applications"""
        # Create an application
        Application.objects.create(
            startup=self.startup,
            position=self.position,
            applicant=self.user,
            cover_letter='Test cover letter'
        )
        
        url = reverse('user_applications')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)


class SearchTestCase(APITestCase):
    """Test cases for search functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword123'
        )
        
        # Create test startups
        Startup.objects.create(
            owner=self.user,
            title='AI Startup',
            description='Artificial intelligence startup',
            field='Technology',
            type='marketplace'
        )
        
        Startup.objects.create(
            owner=self.user,
            title='E-commerce Platform',
            description='Online shopping platform',
            field='E-commerce',
            type='collaboration'
        )
    
    def test_search_startups(self):
        """Test searching startups"""
        url = reverse('search')
        response = self.client.get(url, {'q': 'AI'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertIn('totalResults', response.data)
    
    def test_search_with_filters(self):
        """Test searching with type filter"""
        url = reverse('search')
        response = self.client.get(url, {'q': 'startup', 'type': 'marketplace'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

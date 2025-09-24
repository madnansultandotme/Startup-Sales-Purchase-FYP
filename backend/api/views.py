from rest_framework import status, generics, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import api_view, permission_classes
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, AllowAny
import rest_framework.parsers
from django_ratelimit.decorators import ratelimit
from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.db.models import Q
import bcrypt
from .models import Startup, StartupTag, Position, Application, Notification, Favorite, Interest
from .messaging_models import Conversation, Message, UserProfile, FileUpload
from .serializers import (
	UserRegistrationSerializer, UserLoginSerializer, UserSerializer, 
	StartupTagSerializer, PositionSerializer, StartupListSerializer, StartupDetailSerializer, StartupCreateSerializer, 
	ApplicationSerializer, ApplicationCreateSerializer, UserStartupSerializer,
	SearchResultSerializer, NotificationSerializer, FavoriteSerializer, InterestSerializer,
	MessageSerializer, ConversationSerializer, ConversationCreateSerializer, MessageCreateSerializer,
	UserProfileSerializer, UserProfileUpdateSerializer, FileUploadSerializer, FileUploadCreateSerializer
)

User = get_user_model()


# Helper function to get authenticated user from session or token
def get_session_user(request):
	"""Get authenticated user from session or auth token"""
	print(f"🔍 get_session_user called for path: {getattr(request, 'path', 'unknown')}")
	print(f"🔍 Request headers: Authorization={request.META.get('HTTP_AUTHORIZATION', 'None')}, Cookie={request.META.get('HTTP_COOKIE', 'None')}")
	
	# First, check for auth token in Authorization header
	auth_header = request.META.get('HTTP_AUTHORIZATION')
	if auth_header and auth_header.startswith('Bearer '):
		auth_token = auth_header.split(' ')[1]
		print(f"🔑 Found auth token in header: {auth_token[:10]}...")
		
		# Validate token by checking all active sessions
		from django.contrib.sessions.models import Session
		for session in Session.objects.all():
			try:
				session_data = session.get_decoded()
				if session_data.get('auth_token') == auth_token and 'user_id' in session_data:
					user_id = session_data['user_id']
					user = User.objects.get(id=user_id, is_active=True)
					print(f"✅ Found user from auth token: {user.username}")
					return user
			except:
				continue
		
		print(f"❌ Invalid or expired auth token")
	
	# Check if user is authenticated via Django auth middleware
	if hasattr(request, 'user') and request.user.is_authenticated and hasattr(request.user, 'id'):
		print(f"✅ Found authenticated user via Django auth: {request.user.username}")
		return request.user
	
	# Check session data (fallback)
	if hasattr(request, 'session'):
		print(f"📝 Session key: {request.session.session_key}")
		print(f"📝 Session data: {dict(request.session)}")
		
		# Check if session has authentication flag and user_id
		if request.session.get('is_authenticated') and 'user_id' in request.session:
			try:
				user_id = request.session['user_id']
				user = User.objects.get(id=user_id, is_active=True)
				print(f"✅ Found user from session data: {user.username}")
				return user
			except (User.DoesNotExist, ValueError) as e:
				print(f"❌ Error getting user from session: {e}")
				pass
		else:
			print(f"❌ Session missing authentication data: is_authenticated={request.session.get('is_authenticated')}, has_user_id={'user_id' in request.session}")
	else:
		print(f"❌ No session available on request")
	
	return None


# Home route
@api_view(['GET'])
@permission_classes([AllowAny])
def home(request):
	"""Home endpoint to test API is working"""
	return Response({
		"message": "Welcome to Startup Sales & Purchase Platform API",
		"version": "1.0.0",
		"status": "active",
		"endpoints": {
			"authentication": [
				"POST /signup",
				"POST /auth/login",
				"POST /auth/refresh",
				"POST /auth/forget-password",
				"POST /auth/verify",
				"POST /auth/logout"
			],
			"startups": [
				"POST /api/startups",
				"GET /api/startups/:id",
				"GET /api/marketplace",
				"GET /api/collaborations"
			],
			"applications": [
				"POST /api/collaborations/:id/apply",
				"GET /api/users/applications"
			],
			"user": [
				"GET /api/users/profile",
				"GET /api/users/startups"
			],
			"other": [
				"GET /api/stats",
				"GET /api/search"
			]
		}
	})


# Authentication Views
@method_decorator(ratelimit(key='ip', rate='5/m', method='POST'), name='post')
@method_decorator(csrf_exempt, name='dispatch')
class SignupView(generics.CreateAPIView):
	"""User registration endpoint"""
	queryset = User.objects.all()
	serializer_class = UserRegistrationSerializer
	permission_classes = [AllowAny]
	
	def create(self, request, *args, **kwargs):
		serializer = self.get_serializer(data=request.data)
		if serializer.is_valid():
			try:
				user = serializer.save()
				
				# Auto-login after successful signup (like login flow)
				print(f"\n🔐=== SIGNUP AUTO-LOGIN ===")
				print(f"Auto-login user after signup: {user.username} (ID: {user.id})")
				
				# Ensure session exists and is saved
				if not request.session.session_key:
					print(f"🔑 Creating new session key")
					request.session.create()
				print(f"🔑 Session key: {request.session.session_key}")
				
				# Use Django's login to create session
				from django.contrib.auth import login
				print(f"🔑 Calling Django login() for user")
				login(request, user)
				print(f"🔑 Django login completed. User authenticated: {request.user.is_authenticated}")
				
				# Store user ID in session for easy access
				request.session['user_id'] = str(user.id)
				request.session['user_email'] = user.email
				request.session['user_role'] = user.role
				request.session['is_authenticated'] = True
				print(f"📝 Session data stored: {dict(request.session)}")
				
				# Force session save
				request.session.save()
				print(f"💾 Session saved. Final session key: {request.session.session_key}")
				
				# Create a simple auth token for the frontend to use (same as login)
				import hashlib
				import time
				auth_token = hashlib.sha256(f"{user.id}{user.email}{time.time()}".encode()).hexdigest()[:32]
				
				# Store the auth token in session for validation
				request.session['auth_token'] = auth_token
				request.session.save()
				print(f"🔑 Auth token created and stored: {auth_token[:10]}...")
				
				response_data = {
					"message": "Account created successfully",
					"auth_token": auth_token,  # Send token to frontend like login does
					"user": {
						"id": str(user.id),
						"username": user.username,
						"email": user.email,
						"role": user.role,
						"emailVerified": True,  # Simplified - no email verification
					},
				}
				
				response = Response(response_data, status=status.HTTP_201_CREATED)
				
				# Set session cookie (same as login flow)
				if request.session.session_key:
					response['X-Session-ID'] = request.session.session_key
					response.set_cookie(
						key='sessionid',
						value=request.session.session_key,
						max_age=86400,
						httponly=False,
						samesite=None,
						secure=False,
						domain=None
					)
					print(f"🍪 Session cookie + auth token set for signup")
				print(f"🎉 Signup with auto-login successful!")
				print("🔐=== END SIGNUP AUTO-LOGIN ===\n")
				
				return response
			except Exception as e:
				if "User already exists" in str(e):
					return Response(
						{"error": 1062, "message": "User already exists"},
						status=status.HTTP_409_CONFLICT
					)
				return Response(
					{"message": "Internal server error"},
					status=status.HTTP_500_INTERNAL_SERVER_ERROR
				)
		
		# Handle password validation errors
		if 'password' in serializer.errors:
			return Response(
				{"message": "Password must be greater than 8 characters"},
				status=status.HTTP_400_BAD_REQUEST
			)
		
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(ratelimit(key='ip', rate='10/m', method='POST'), name='post')
@method_decorator(csrf_exempt, name='dispatch')
class LoginView(generics.GenericAPIView):
	"""User login endpoint with session authentication"""
	serializer_class = UserLoginSerializer
	permission_classes = [AllowAny]
	
	def post(self, request):
		print("\n🔐=== LOGIN DEBUG ===")
		print(f"Login request from: {request.META.get('REMOTE_ADDR')}")
		print(f"Request cookies: {dict(request.COOKIES)}")
		print(f"Session before login: {request.session.session_key}")
		
		serializer = self.get_serializer(data=request.data)
		if serializer.is_valid():
			email = serializer.validated_data['email']
			password = serializer.validated_data['password']
			
			try:
				user = User.objects.get(email=email, is_active=True)
				print(f"Found user: {user.username} (ID: {user.id})")
				
				# Verify password with bcrypt
				if bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
					print(f"✅ Password verified for user: {user.username}")
					
					# Ensure session exists and is saved
					if not request.session.session_key:
						print(f"🔑 Creating new session key")
						request.session.create()
					print(f"🔑 Session key: {request.session.session_key}")
					
					# Use Django's login to create session
					from django.contrib.auth import login
					print(f"🔑 Calling Django login() for user")
					login(request, user)
					print(f"🔑 Django login completed. User authenticated: {request.user.is_authenticated}")
					
					# Store user ID in session for easy access
					request.session['user_id'] = str(user.id)
					request.session['user_email'] = user.email
					request.session['user_role'] = user.role
					request.session['is_authenticated'] = True
					print(f"📝 Session data stored: {dict(request.session)}")
					
					# Force session save
					request.session.save()
					print(f"💾 Session saved. Final session key: {request.session.session_key}")
					
					# Create a simple auth token for the frontend to use
					import hashlib
					import time
					auth_token = hashlib.sha256(f"{user.id}{user.email}{time.time()}".encode()).hexdigest()[:32]
					
					# Store the auth token in session for validation
					request.session['auth_token'] = auth_token
					request.session.save()
					
					response_data = {
						"message": "Login successful",
						"auth_token": auth_token,  # Send token to frontend
						"user": {
							"id": str(user.id),
							"username": user.username,
							"email": user.email,
							"role": user.role,
							"emailVerified": user.email_verified,
						}
					}
					
					response = Response(response_data, status=status.HTTP_200_OK)
					
					# Still set session cookie as backup, but rely on token
					if request.session.session_key:
						response['X-Session-ID'] = request.session.session_key
						response.set_cookie(
							key='sessionid',
							value=request.session.session_key,
							max_age=86400,
							httponly=False,
							samesite=None,
							secure=False,
							domain=None
						)
						print(f"🍪 Session cookie + auth token set: {auth_token[:10]}...")
					print(f"🎉 Login successful! Returning response with session cookie")
					print("🔐=== END LOGIN DEBUG ===\n")
					return response
				else:
					return Response(
						{"error": "Wrong credentials"},
						status=status.HTTP_401_UNAUTHORIZED
					)
			except User.DoesNotExist:
				return Response(
					{"error": "Wrong credentials"},
					status=status.HTTP_401_UNAUTHORIZED
				)
		
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class VerifyEmailView(generics.GenericAPIView):
	"""Verify email endpoint (simplified - no actual verification)"""
	permission_classes = [AllowAny]
	
	def post(self, request):
		# Simplified - just return success
		return Response({
			"success": True,
			"message": "Email verified successfully"
		}, status=status.HTTP_200_OK)


@method_decorator(ratelimit(key='ip', rate='3/m', method='POST'), name='post')
@method_decorator(csrf_exempt, name='dispatch')
class SendVerificationCodeView(generics.GenericAPIView):
	"""Send verification code endpoint (simplified)"""
	permission_classes = [AllowAny]
	
	def post(self, request):
		# Simplified - just return success
		return Response({
			"success": True,
			"message": "Verification code sent to your email"
		}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
@ratelimit(key='ip', rate='3/m', method='POST')
def forget_password(request):
	"""Password reset endpoint (placeholder)"""
	# This is a placeholder - implement actual password reset logic
	return Response(
		{"message": "Password reset email sent"},
		status=status.HTTP_200_OK
	)


@method_decorator(csrf_exempt, name='dispatch')
class RefreshTokenView(generics.GenericAPIView):
	"""Refresh token endpoint (simplified - no tokens)"""
	permission_classes = [AllowAny]
	
	def post(self, request):
		# Simplified - just return success message
		return Response({
			"message": "No token refresh needed"
		}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def logout(request):
	"""Logout endpoint with session cleanup"""
	try:
		# Use Django's logout to clear session
		from django.contrib.auth import logout as django_logout
		django_logout(request)
		
		# Clear session data
		if hasattr(request, 'session'):
			request.session.flush()
		
		return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)
	except Exception as e:
		return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)


# Startup Management Views
@method_decorator(csrf_exempt, name='dispatch')
class StartupCreateView(generics.CreateAPIView):
    """Create startup listing"""
    serializer_class = StartupCreateSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        # Get authenticated user
        user = get_session_user(request)
        if not user:
            return Response(
                {"error": "Authentication required", "message": "Please login to create a startup"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        print(f"\n🚀=== STARTUP CREATION ===")
        print(f"👤 Authenticated user: {user.username} (ID: {user.id})")
        print(f"📊 Request data keys: {list(request.data.keys())}")
        
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        # Get user again to ensure we have it
        user = get_session_user(self.request)
        if not user:
            raise PermissionDenied("Authentication required")
        
        print(f"💾 Creating startup with owner: {user.username}")
        
        # Save startup with authenticated user as owner
        startup = serializer.save(owner=user)
        
        print(f"✅ Startup created: {startup.title} (ID: {startup.id})")
        
        # Add default tags based on type
        if startup.type == 'marketplace':
            StartupTag.objects.create(startup=startup, tag="Fund Raising")
            print(f"🏷️ Added 'Fund Raising' tag")
        else:
            StartupTag.objects.create(startup=startup, tag="Open to Collaborate")
            print(f"🏷️ Added 'Open to Collaborate' tag")
        
        print(f"🚀=== END STARTUP CREATION ===\n")


class MarketplaceListView(generics.ListAPIView):
    """Get all marketplace listings"""
    serializer_class = StartupListSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = Startup.objects.filter(type='marketplace', status='active')
        
        # Apply filters
        sort_by = self.request.query_params.get('sortBy', 'date')
        order = self.request.query_params.get('order', 'desc')
        startup_type = self.request.query_params.get('type')
        category = self.request.query_params.get('category')
        limit = self.request.query_params.get('limit')
        
        if startup_type:
            queryset = queryset.filter(category=startup_type)
        if category:
            queryset = queryset.filter(category=category)
        
        # Simple ordering
        if sort_by == 'date':
            order_field = 'created_at'
        elif sort_by == 'price':
            order_field = 'asking_price'
        else:
            order_field = 'created_at'
        
        if order == 'desc':
            order_field = f'-{order_field}'
        
        queryset = queryset.order_by(order_field)
        
        if limit:
            try:
                limit = int(limit)
                queryset = queryset[:limit]
            except ValueError:
                pass
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "results": serializer.data,
            "count": queryset.count()
        })


class CollaborationListView(generics.ListAPIView):
	"""Get collaboration listings"""
	serializer_class = StartupListSerializer
	permission_classes = [AllowAny]
	
	def get_queryset(self):
		queryset = Startup.objects.filter(type='collaboration', status='active')
		
		# Apply filters
		sort_by = self.request.query_params.get('sortBy', 'date')
		order = self.request.query_params.get('order', 'desc')
		phase = self.request.query_params.get('phase')
		earnthrough = self.request.query_params.get('earnthrough')
		
		if phase:
			queryset = queryset.filter(phase=phase)
		if earnthrough:
			queryset = queryset.filter(earn_through=earnthrough)
		
		# Simple ordering
		if sort_by == 'date':
			order_field = 'created_at'
		elif sort_by == 'team':
			order_field = 'team_size'
		else:
			order_field = 'created_at'
		
		if order == 'desc':
			order_field = f'-{order_field}'
		
		return queryset.order_by(order_field)


class StartupDetailView(generics.RetrieveAPIView):
	"""Get startup details"""
	queryset = Startup.objects.all()
	serializer_class = StartupDetailSerializer
	permission_classes = [AllowAny]
	
	def retrieve(self, request, *args, **kwargs):
		instance = self.get_object()
		# Increment view count
		instance.views += 1
		instance.save(update_fields=['views'])
		return super().retrieve(request, *args, **kwargs)


# Collaboration Views
class ApplyForCollaborationView(generics.CreateAPIView):
	"""Apply for collaboration"""
	serializer_class = ApplicationCreateSerializer
	permission_classes = [AllowAny]
	
	def create(self, request, *args, **kwargs):
		user = get_session_user(request)
		if not user:
			return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
		startup_id = kwargs.get('pk')
		try:
			startup = Startup.objects.get(id=startup_id)
			serializer = self.get_serializer(data=request.data)
			if serializer.is_valid():
				application = serializer.save()
				# Notify startup owner of new application
				Notification.objects.create(
					user=startup.owner,
					type='new_application',
					title='New application received',
					message=f"{user.username} applied to {startup.title}",
					data={
						"startupId": str(startup.id),
						"applicationId": str(application.id),
						"positionId": str(application.position.id),
					}
				)
				return Response({
					"message": "Application submitted successfully",
					"application": {
						"id": str(application.id),
						"startupId": str(application.startup.id),
						"positionId": str(application.position.id),
						"applicantId": str(application.applicant.id),
						"status": application.status,
						"createdAt": application.created_at
					}
				}, status=status.HTTP_201_CREATED)
			return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
		except Startup.DoesNotExist:
			return Response(
				{"error": "Startup not found"},
				status=status.HTTP_404_NOT_FOUND
			)


class UserApplicationsView(generics.ListAPIView):
	"""Get user applications"""
	serializer_class = ApplicationSerializer
	permission_classes = [AllowAny]
	
	def get_queryset(self):
		user = get_session_user(self.request)
		if not user:
			return Application.objects.none()
		return Application.objects.filter(applicant=user)


# Entrepreneur Application Management
class StartupApplicationsView(generics.ListAPIView):
	"""List applications for a given startup (entrepreneur owner only)"""
	serializer_class = ApplicationSerializer
	permission_classes = [AllowAny]

	def get_queryset(self):
		startup_id = self.kwargs.get('pk')
		user = get_session_user(self.request)
		if not user:
			return Application.objects.none()
		# Only allow owner to see applications
		return Application.objects.filter(
			startup_id=startup_id,
			startup__owner=user,
		).select_related('startup', 'position', 'applicant')


class ApproveApplicationView(generics.UpdateAPIView):
	"""Approve an application (startup owner only)"""
	serializer_class = ApplicationSerializer
	permission_classes = [AllowAny]
	queryset = Application.objects.all()

	def update(self, request, *args, **kwargs):
		application = self.get_object()
		user = get_session_user(request)
		if not user or application.startup.owner != user:
			return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
		application.status = 'approved'
		application.save(update_fields=['status'])
		# Notify applicant of status change
		Notification.objects.create(
			user=application.applicant,
			type='application_status',
			title='Application approved',
			message=f"Your application for {application.position.title} at {application.startup.title} was approved.",
			data={
				"startupId": str(application.startup.id),
				"applicationId": str(application.id),
				"positionId": str(application.position.id),
				"status": application.status,
			}
		)
		serializer = self.get_serializer(application)
		return Response(serializer.data, status=status.HTTP_200_OK)


# UC5: Positions Management (Entrepreneur Only)
class AllPositionsView(generics.ListAPIView):
    """List all available positions across all startups (for job seekers)"""
    serializer_class = PositionSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        # Return all active positions from active startups (both collaboration and marketplace)
        return Position.objects.filter(
            is_active=True,
            startup__status='active'
        ).select_related('startup', 'startup__owner').order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        # Apply filters if provided
        category = request.query_params.get('category')
        field = request.query_params.get('field')
        phase = request.query_params.get('phase')
        team_size = request.query_params.get('team_size')
        search_query = request.query_params.get('q', request.query_params.get('query'))
        
        if category:
            queryset = queryset.filter(startup__category=category)
        if field:
            queryset = queryset.filter(startup__field__icontains=field)
        if phase:
            queryset = queryset.filter(startup__phase__icontains=phase)
        if team_size:
            queryset = queryset.filter(startup__team_size__icontains=team_size)
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(requirements__icontains=search_query) |
                Q(startup__title__icontains=search_query)
            )
        
        serializer = self.get_serializer(queryset, many=True)
        
        # Add startup info to each position
        for i, position_data in enumerate(serializer.data):
            position = queryset[i]
            position_data['startup'] = {
                'id': str(position.startup.id),
                'title': position.startup.title,
                'description': position.startup.description,
                'category': position.startup.category,
                'field': position.startup.field,
                'phase': position.startup.phase,
                'team_size': position.startup.team_size,
                'earn_through': position.startup.earn_through,
                'owner': {
                    'id': str(position.startup.owner.id),
                    'username': position.startup.owner.username,
                    'email': position.startup.owner.email
                }
            }
        
        return Response({
            "results": serializer.data,
            "count": queryset.count()
        })


class StartupPositionsView(generics.ListCreateAPIView):
    """List and create positions for a startup (owner only for create, public for list)"""
    serializer_class = PositionSerializer
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        startup_id = self.kwargs.get('pk')
        # For listing (GET), show active positions to everyone
        # For creating (POST), only allow startup owner
        if self.request.method == 'GET':
            return Position.objects.filter(startup_id=startup_id, is_active=True)
        else:
            user = get_session_user(self.request)
            if not user:
                return Position.objects.none()  # Return empty queryset if not authenticated
            return Position.objects.filter(startup_id=startup_id, startup__owner=user)
    
    def list(self, request, *args, **kwargs):
        startup_id = self.kwargs.get('pk')
        try:
            startup = Startup.objects.get(id=startup_id)
        except Startup.DoesNotExist:
            return Response({"detail": "Startup not found"}, status=status.HTTP_404_NOT_FOUND)
        
        positions = self.get_queryset()
        serializer = self.get_serializer(positions, many=True)
        
        return Response({
            "startup": {
                "id": str(startup.id),
                "title": startup.title,
                "description": startup.description,
                "category": startup.category
            },
            "positions": serializer.data
        })

    def perform_create(self, serializer):
        startup_id = self.kwargs.get('pk')
        user = get_session_user(self.request)
        if not user:
            raise PermissionDenied("Authentication required")
        try:
            startup = Startup.objects.get(id=startup_id, owner=user)
        except Startup.DoesNotExist:
            raise PermissionDenied("Not authorized to modify this startup")
        serializer.save(startup=startup)


class PositionDetailView(generics.RetrieveUpdateAPIView):
    """Retrieve/Update a position (owner only)"""
    serializer_class = PositionSerializer
    permission_classes = [AllowAny]
    queryset = Position.objects.select_related('startup')

    def update(self, request, *args, **kwargs):
        position = self.get_object()
        user = get_session_user(request)
        if not user or position.startup.owner != user:
            return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)


class ClosePositionView(generics.UpdateAPIView):
    """Close a position (set is_active=False)"""
    serializer_class = PositionSerializer
    permission_classes = [AllowAny]
    queryset = Position.objects.select_related('startup')

    def update(self, request, *args, **kwargs):
        position = self.get_object()
        user = get_session_user(request)
        if not user or position.startup.owner != user:
            return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        position.is_active = False
        position.save(update_fields=['is_active'])
        serializer = self.get_serializer(position)
        return Response(serializer.data, status=status.HTTP_200_OK)


class OpenPositionView(generics.UpdateAPIView):
    """Open a position (set is_active=True)"""
    serializer_class = PositionSerializer
    permission_classes = [AllowAny]
    queryset = Position.objects.select_related('startup')

    def update(self, request, *args, **kwargs):
        position = self.get_object()
        user = get_session_user(request)
        if not user or position.startup.owner != user:
            return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        position.is_active = True
        position.save(update_fields=['is_active'])
        serializer = self.get_serializer(position)
        return Response(serializer.data, status=status.HTTP_200_OK)

class DeclineApplicationView(generics.UpdateAPIView):
	"""Decline an application (startup owner only)"""
	serializer_class = ApplicationSerializer
	permission_classes = [AllowAny]
	queryset = Application.objects.all()

	def update(self, request, *args, **kwargs):
		application = self.get_object()
		user = get_session_user(request)
		if not user or application.startup.owner != user:
			return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
		application.status = 'rejected'
		application.save(update_fields=['status'])
		# Notify applicant of status change
		Notification.objects.create(
			user=application.applicant,
			type='application_status',
			title='Application rejected',
			message=f"Your application for {application.position.title} at {application.startup.title} was rejected.",
			data={
				"startupId": str(application.startup.id),
				"applicationId": str(application.id),
				"positionId": str(application.position.id),
				"status": application.status,
			}
		)
		serializer = self.get_serializer(application)
		return Response(serializer.data, status=status.HTTP_200_OK)


# UC6: Notifications
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
@csrf_exempt
def notification_list_view(request):
    """List current user's notifications and create new ones"""
    if request.method == 'GET':
        # List notifications for current user
        user = get_session_user(request)
        if not user:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        notifications = Notification.objects.filter(user=user).order_by('-created_at')
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Create notification for specific user
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Target user not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Create notification directly without using serializer save
        try:
            notification = Notification.objects.create(
                user=target_user,
                type=request.data.get('type', 'general'),
                title=request.data.get('title', ''),
                message=request.data.get('message', ''),
                data=request.data.get('data', {})
            )
            
            # Return success response with notification data
            response_data = {
                'id': str(notification.id),
                'type': notification.type,
                'title': notification.title,
                'message': notification.message,
                'data': notification.data,
                'is_read': notification.is_read,
                'created_at': notification.created_at.isoformat()
            }
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': f'Failed to create notification: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MarkNotificationReadView(generics.UpdateAPIView):
    """Mark a notification as read"""
    serializer_class = NotificationSerializer
    permission_classes = [AllowAny]
    queryset = Notification.objects.all()

    def update(self, request, *args, **kwargs):
        n = self.get_object()
        user = get_session_user(request)
        if not user or n.user != user:
            return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        n.is_read = True
        n.save(update_fields=['is_read'])
        serializer = self.get_serializer(n)
        return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([AllowAny])
@csrf_exempt
def mark_all_notifications_read(request):
    user = get_session_user(request)
    if not user:
        return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
    count = Notification.objects.filter(user=user, is_read=False).update(is_read=True)
    return Response({"updated": count})


# UC7: Investor engagement
class UserFavoritesView(generics.ListAPIView):
    """List current user's saved startups"""
    serializer_class = FavoriteSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = get_session_user(self.request)
        if not user:
            return Favorite.objects.none()
        return Favorite.objects.filter(user=user).select_related('startup', 'startup__owner').order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        # Add debugging info
        user = get_session_user(request)
        print(f"🔍 UserFavoritesView: User {user} requesting favorites")
        print(f"🔍 User authenticated: {user is not None}")
        if not user:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        return super().list(request, *args, **kwargs)


class ToggleFavoriteView(generics.GenericAPIView):
    """POST to save favorite, DELETE to remove"""
    permission_classes = [AllowAny]
    serializer_class = FavoriteSerializer

    def post(self, request, *args, **kwargs):
        user = get_session_user(request)
        if not user:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        startup_id = kwargs.get('pk')
        try:
            startup = Startup.objects.get(id=startup_id)
        except Startup.DoesNotExist:
            return Response({"detail": "Startup not found"}, status=status.HTTP_404_NOT_FOUND)
        fav, created = Favorite.objects.get_or_create(user=user, startup=startup)
        if created:
            return Response(self.get_serializer(fav).data, status=status.HTTP_201_CREATED)
        return Response(self.get_serializer(fav).data, status=status.HTTP_200_OK)

    def delete(self, request, *args, **kwargs):
        user = get_session_user(request)
        if not user:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        startup_id = kwargs.get('pk')
        Favorite.objects.filter(user=user, startup_id=startup_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserInterestsView(generics.ListAPIView):
    """List current user's expressed interests"""
    serializer_class = InterestSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = get_session_user(self.request)
        if not user:
            return Interest.objects.none()
        return Interest.objects.filter(user=user).select_related('startup', 'startup__owner').order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        # Add debugging info
        user = get_session_user(request)
        print(f"🔍 UserInterestsView: User {user} requesting interests")
        print(f"🔍 User authenticated: {user is not None}")
        if not user:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        return super().list(request, *args, **kwargs)


class StartupInterestsView(generics.ListAPIView):
    """List interests for a startup (owner only)"""
    serializer_class = InterestSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        startup_id = self.kwargs.get('pk')
        user = get_session_user(self.request)
        if not user:
            return Interest.objects.none()
        return Interest.objects.filter(startup_id=startup_id, startup__owner=user).select_related('startup', 'user')


class ExpressInterestView(generics.CreateAPIView):
    """Express interest in a startup with optional message"""
    serializer_class = InterestSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        user = get_session_user(request)
        if not user:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        startup_id = kwargs.get('pk')
        message = request.data.get('message', '')
        try:
            startup = Startup.objects.get(id=startup_id)
        except Startup.DoesNotExist:
            return Response({"detail": "Startup not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if interest already exists
        try:
            interest = Interest.objects.get(user=user, startup=startup)
            # Update existing interest
            if message:
                interest.message = message
                interest.save(update_fields=['message'])
            created = False
        except Interest.DoesNotExist:
            # Create new interest
            interest = Interest.objects.create(
                user=user, 
                startup=startup, 
                message=message
            )
            created = True
            
            # Notify owner only for new interests
            Notification.objects.create(
                user=startup.owner,
                type='new_application',
                title='New investor interest',
                message=f"{user.username} is interested in {startup.title}",
                data={"startupId": str(startup.id), "interestId": str(interest.id)},
            )
        
        # === Messaging: ensure DB-based conversation between investor and owner ===
        try:
            # Find existing conversation between the two, or create one
            conversation = Conversation.objects.filter(
                participants=user,
                is_active=True,
            ).filter(participants=startup.owner).first()
            if not conversation:
                conversation = Conversation.objects.create(title=f"{startup.title}")
                conversation.participants.set([user.id, startup.owner.id])

            # If a message was provided in the interest, persist it as the first message
            if message and message.strip():
                Message.objects.create(
                    conversation=conversation,
                    sender=user,
                    content=message.strip(),
                    message_type='text'
                )
        except Exception as e:
            # Don't fail the interest API if messaging setup fails; log to console
            print(f"⚠️ Messaging setup failed for interest: {e}")

        serializer = self.get_serializer(interest)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


# Cookie test endpoint
@api_view(['GET'])
@permission_classes([AllowAny])
def cookie_test(request):
	"""Test cookie handling"""
	print(f"\n🍪=== COOKIE TEST DEBUG ===")
	print(f"Request cookies: {dict(request.COOKIES)}")
	print(f"Session key: {getattr(request.session, 'session_key', 'None')}")
	print(f"Origin: {request.META.get('HTTP_ORIGIN', 'None')}")
	print(f"Referer: {request.META.get('HTTP_REFERER', 'None')}")
	print(f"User-Agent: {request.META.get('HTTP_USER_AGENT', 'None')[:50]}...")
	print(f"🍪=== END COOKIE TEST DEBUG ===\n")
	
	return Response({
		"cookies_received": dict(request.COOKIES),
		"session_key": getattr(request.session, 'session_key', None),
		"origin": request.META.get('HTTP_ORIGIN'),
		"message": "Cookie test endpoint"
	})


# Authentication test endpoint
@api_view(['GET'])
@permission_classes([AllowAny])
def auth_test(request):
	"""Test authentication status"""
	print("\n🔍=== AUTH TEST DEBUG ===")
	print(f"Path: {request.path}")
	print(f"Method: {request.method}")
	print(f"Session key: {request.session.session_key if hasattr(request, 'session') else 'No session'}")
	print(f"Request user: {request.user if hasattr(request, 'user') else 'No user attr'}")
	print(f"User is_authenticated: {request.user.is_authenticated if hasattr(request, 'user') else 'No user attr'}")
	print(f"Session data: {dict(request.session) if hasattr(request, 'session') else 'No session'}")
	print(f"Session exists: {hasattr(request, 'session')}")
	
	user = get_session_user(request)
	print(f"get_session_user returned: {user}")
	print("🔍=== END AUTH TEST DEBUG ===\n")
	
	return Response({
		"authenticated": user is not None,
		"user": {
			"id": str(user.id) if user else None,
			"username": user.username if user else None,
			"email": user.email if user else None
		} if user else None,
		"session_key": request.session.session_key if hasattr(request, 'session') else None,
		"session_data": dict(request.session) if hasattr(request, 'session') else None,
		"request_user": str(request.user) if hasattr(request, 'user') else None,
		"request_user_authenticated": request.user.is_authenticated if hasattr(request, 'user') else False,
		"cookies": dict(request.COOKIES) if hasattr(request, 'COOKIES') else None
	})


# User Management Views
class UserProfileView(generics.RetrieveAPIView):
	"""Get user profile"""
	serializer_class = UserSerializer
	permission_classes = [AllowAny]
	
	def get_object(self):
		user = get_session_user(self.request)
		if not user:
			raise PermissionDenied("Authentication required")
		return user


class UserStartupsView(generics.ListAPIView):
	"""Get user's startups"""
	serializer_class = UserStartupSerializer
	permission_classes = [AllowAny]
	
	def get_queryset(self):
		user = get_session_user(self.request)
		if not user:
			return Startup.objects.none()
		return Startup.objects.filter(owner=user)


# Statistics Views
@api_view(['GET'])
@permission_classes([AllowAny])
def platform_stats(request):
	"""Get platform statistics"""
	total_startups = Startup.objects.count()
	total_users = User.objects.count()
	total_applications = Application.objects.count()
	total_collaborations = Application.objects.filter(status='approved').count()
	
	# Recent activity (simplified)
	recent_activity = [
		{
			"type": "startup_created",
			"message": "New startup listing created",
			"timestamp": "2024-01-01T00:00:00Z"
		}
	]
	
	return Response({
		"totalStartups": total_startups,
		"totalUsers": total_users,
		"totalTransactions": 0,  # Placeholder
		"totalCollaborations": total_collaborations,
		"recentActivity": recent_activity
	})


# Search Views
class SearchView(generics.ListAPIView):
	"""Search startups"""
	serializer_class = SearchResultSerializer
	permission_classes = [AllowAny]
	
	def get_queryset(self):
		# Get search parameters from frontend
		query = self.request.query_params.get('query', '')
		category = self.request.query_params.get('category', '')
		search_type = self.request.query_params.get('type', '')
		phase = self.request.query_params.get('phase', '')
		field = self.request.query_params.get('field', '')
		team_size = self.request.query_params.get('team_size', '')
		funding_stage = self.request.query_params.get('funding_stage', '')
		limit = int(self.request.query_params.get('limit', 20))
		
		queryset = Startup.objects.filter(status='active')
		
		# Apply text search
		if query:
			queryset = queryset.filter(
				Q(title__icontains=query) |
				Q(description__icontains=query) |
				Q(field__icontains=query)
			)
		
		# Apply filters
		if search_type:
			queryset = queryset.filter(type=search_type)
		
		if category:
			queryset = queryset.filter(category=category)
		
		if phase:
			queryset = queryset.filter(phase__icontains=phase)
		
		if field:
			queryset = queryset.filter(field__icontains=field)
		
		if team_size:
			queryset = queryset.filter(team_size__icontains=team_size)
		
		# funding_stage could be mapped to phase or handled differently
		if funding_stage:
			queryset = queryset.filter(phase__icontains=funding_stage)
		
		return queryset.order_by('-created_at')[:limit]
	
	def list(self, request, *args, **kwargs):
		# Get full queryset before limit for count
		query = self.request.query_params.get('query', '')
		category = self.request.query_params.get('category', '')
		search_type = self.request.query_params.get('type', '')
		phase = self.request.query_params.get('phase', '')
		field = self.request.query_params.get('field', '')
		team_size = self.request.query_params.get('team_size', '')
		funding_stage = self.request.query_params.get('funding_stage', '')
		
		# Build queryset for count
		full_queryset = Startup.objects.filter(status='active')
		
		if query:
			full_queryset = full_queryset.filter(
				Q(title__icontains=query) |
				Q(description__icontains=query) |
				Q(field__icontains=query)
			)
		
		if search_type:
			full_queryset = full_queryset.filter(type=search_type)
		
		if category:
			full_queryset = full_queryset.filter(category=category)
		
		if phase:
			full_queryset = full_queryset.filter(phase__icontains=phase)
		
		if field:
			full_queryset = full_queryset.filter(field__icontains=field)
		
		if team_size:
			full_queryset = full_queryset.filter(team_size__icontains=team_size)
		
		if funding_stage:
			full_queryset = full_queryset.filter(phase__icontains=funding_stage)
		
		total_count = full_queryset.count()
		
		# Get limited results
		queryset = self.get_queryset()
		serializer = self.get_serializer(queryset, many=True)
		
		return Response({
			"results": serializer.data,
			"count": total_count
		})


# ==================== NEW MISSING ENDPOINTS ====================

# Messaging System Views
class ConversationListView(generics.ListCreateAPIView):
	"""List user's conversations or create new conversation"""
	serializer_class = ConversationSerializer
	permission_classes = [AllowAny]
	
	def get_queryset(self):
		user = get_session_user(self.request)
		if not user:
			return Conversation.objects.none()
		return Conversation.objects.filter(
			participants=user,
			is_active=True
		).prefetch_related('participants', 'messages').order_by('-updated_at')
	
	def get_serializer_class(self):
		if self.request.method == 'POST':
			return ConversationCreateSerializer
		return ConversationSerializer


class ConversationDetailView(generics.RetrieveAPIView):
	"""Get conversation details"""
	serializer_class = ConversationSerializer
	permission_classes = [AllowAny]
	
	def get_queryset(self):
		user = get_session_user(self.request)
		if not user:
			return Conversation.objects.none()
		return Conversation.objects.filter(
			participants=user,
			is_active=True
		)


class MessageListView(generics.ListCreateAPIView):
	"""List messages in conversation or send new message"""
	serializer_class = MessageSerializer
	permission_classes = [AllowAny]
	
	def get_queryset(self):
		conversation_id = self.kwargs.get('conversation_id')
		user = get_session_user(self.request)
		if not user:
			return Message.objects.none()
		return Message.objects.filter(
			conversation_id=conversation_id,
			conversation__participants=user
		).select_related('sender').order_by('created_at')
	
	def get_serializer_class(self):
		if self.request.method == 'POST':
			return MessageCreateSerializer
		return MessageSerializer
	
	def perform_create(self, serializer):
		conversation_id = self.kwargs.get('conversation_id')
		user = get_session_user(self.request)
		if not user:
			raise PermissionDenied("Authentication required")
		try:
			conversation = Conversation.objects.get(
				id=conversation_id,
				participants=user
			)
			serializer.save(conversation=conversation)
		except Conversation.DoesNotExist:
			raise PermissionDenied("Conversation not found")


@api_view(['GET'])
@permission_classes([AllowAny])
@csrf_exempt
def get_online_users(request):
	"""Get list of online users for messaging"""
	# This is a simplified version - in production you'd use WebSockets
	# For now, return all active users
	online_users = User.objects.filter(is_active=True)[:50]
	serializer = UserSerializer(online_users, many=True)
	return Response(serializer.data)


# User Profile Management Views
class UserProfileDetailView(generics.RetrieveUpdateAPIView):
	"""Get or update user profile"""
	serializer_class = UserProfileSerializer
	permission_classes = [AllowAny]
	
	def get_object(self):
		user = get_session_user(self.request)
		if not user:
			raise PermissionDenied("Authentication required")
		profile, created = UserProfile.objects.get_or_create(user=user)
		return profile
	
	def get_serializer_class(self):
		if self.request.method in ['PUT', 'PATCH']:
			return UserProfileUpdateSerializer
		return UserProfileSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def get_account_by_token(request, token):
	"""Get account by token (for frontend compatibility)"""
	try:
		# Verify token and get user
		from .authentication import JWTAuthentication
		auth = JWTAuthentication()
		user, _ = auth.authenticate(request)
		
		if not user:
			return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
		
		# Get or create profile
		profile, created = UserProfile.objects.get_or_create(user=user)
		
		serializer = UserProfileSerializer(profile)
		return Response(serializer.data)
		
	except Exception as e:
		return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)


# File Upload Views
class FileUploadView(generics.CreateAPIView):
	"""Upload files (resume, images, etc.)"""
	serializer_class = FileUploadCreateSerializer
	permission_classes = [AllowAny]
	parser_classes = [rest_framework.parsers.MultiPartParser, rest_framework.parsers.FormParser]
	
	def create(self, request, *args, **kwargs):
		serializer = self.get_serializer(data=request.data)
		if serializer.is_valid():
			file_upload = serializer.save()
			response_serializer = FileUploadSerializer(file_upload)
			return Response(response_serializer.data, status=status.HTTP_201_CREATED)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FileUploadListView(generics.ListAPIView):
	"""List user's uploaded files"""
	serializer_class = FileUploadSerializer
	permission_classes = [AllowAny]
	
	def get_queryset(self):
		user = get_session_user(self.request)
		if not user:
			return FileUpload.objects.none()
		file_type = self.request.query_params.get('type')
		queryset = FileUpload.objects.filter(user=user, is_active=True)
		if file_type:
			queryset = queryset.filter(file_type=file_type)
		return queryset.order_by('-created_at')


@api_view(['POST'])
@permission_classes([AllowAny])
def upload_resume(request):
	"""Upload resume file"""
	user = get_session_user(request)
	if not user:
		return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
	if 'file' not in request.FILES:
		return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
	
	file = request.FILES['file']
	file_upload = FileUpload.objects.create(
		user=user,
		file=file,
		file_type='resume',
		original_name=file.name,
		file_size=file.size,
		mime_type=file.content_type
	)
	
	serializer = FileUploadSerializer(file_upload)
	return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def upload_startup_image(request):
	"""Upload startup image"""
	user = get_session_user(request)
	if not user:
		return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
	if 'file' not in request.FILES:
		return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
	
	file = request.FILES['file']
	file_upload = FileUpload.objects.create(
		user=user,
		file=file,
		file_type='startup_image',
		original_name=file.name,
		file_size=file.size,
		mime_type=file.content_type
	)
	
	serializer = FileUploadSerializer(file_upload)
	return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def upload_profile_picture(request):
	"""Upload profile picture"""
	user = get_session_user(request)
	if not user:
		return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
	if 'file' not in request.FILES:
		return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
	
	file = request.FILES['file']
	file_upload = FileUpload.objects.create(
		user=user,
		file=file,
		file_type='profile_picture',
		original_name=file.name,
		file_size=file.size,
		mime_type=file.content_type
	)
	
	# Update user profile with new picture
	profile, created = UserProfile.objects.get_or_create(user=user)
	profile.profile_picture = file
	profile.save()
	
	serializer = FileUploadSerializer(file_upload)
	return Response(serializer.data, status=status.HTTP_201_CREATED)


# Additional utility endpoints
class ProfileDataView(generics.RetrieveUpdateAPIView):
	"""Get and update comprehensive user profile data for account settings"""
	permission_classes = [AllowAny]
	
	def get_object(self):
		user = get_session_user(self.request)
		if not user or not hasattr(user, 'id'):
			raise PermissionDenied("Authentication required")
		profile, created = UserProfile.objects.get_or_create(user=user)
		return profile
	
	def get_serializer_class(self):
		if self.request.method in ['PUT', 'PATCH']:
			return UserProfileUpdateSerializer
		return UserProfileSerializer
	
	def get(self, request, *args, **kwargs):
		"""Get comprehensive user profile data for account settings"""
		user = get_session_user(request)
		if not user or not hasattr(user, 'id'):
			return Response(
				{"error": "Authentication required"},
				status=status.HTTP_401_UNAUTHORIZED
			)
		
		profile, created = UserProfile.objects.get_or_create(user=user)
		
		# Get user's startups
		user_startups = Startup.objects.filter(owner=user)
		startups_serializer = UserStartupSerializer(user_startups, many=True)
		
		# Get user's applications
		user_applications = Application.objects.filter(applicant=user)
		applications_serializer = ApplicationSerializer(user_applications, many=True)
		
		# Get user's favorites
		user_favorites = Favorite.objects.filter(user=user)
		favorites_serializer = FavoriteSerializer(user_favorites, many=True)
		
		profile_serializer = UserProfileSerializer(profile)
		
		return Response({
			'profile': profile_serializer.data,
			'startups': startups_serializer.data,
			'applications': applications_serializer.data,
			'favorites': favorites_serializer.data,
			'stats': {
				'startups_created': user_startups.count(),
				'applications_submitted': user_applications.count(),
				'favorites_count': user_favorites.count(),
			}
		})
	
	def patch(self, request, *args, **kwargs):
		"""Update comprehensive user profile data"""
		user = get_session_user(request)
		if not user or not hasattr(user, 'id'):
			return Response(
				{"error": "Authentication required"},
				status=status.HTTP_401_UNAUTHORIZED
			)
		
		profile, created = UserProfile.objects.get_or_create(user=user)
		
		serializer = UserProfileUpdateSerializer(profile, data=request.data, partial=True)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

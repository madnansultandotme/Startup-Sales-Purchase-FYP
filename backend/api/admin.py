from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Startup, StartupTag, Position, Application, UserSession


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for User model"""
    list_display = ('username', 'email', 'is_active', 'email_verified', 'created_at')
    list_filter = ('is_active', 'email_verified', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email')
    ordering = ('-created_at',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {
            'fields': ('email_verified', 'created_at', 'updated_at')
        }),
    )
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Startup)
class StartupAdmin(admin.ModelAdmin):
    """Admin configuration for Startup model"""
    list_display = ('title', 'owner', 'type', 'category', 'status', 'views', 'created_at')
    list_filter = ('type', 'category', 'status', 'featured', 'created_at')
    search_fields = ('title', 'description', 'field')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'views', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'role_title', 'description', 'field', 'website_url')
        }),
        ('Financial Information', {
            'fields': ('revenue', 'profit', 'asking_price', 'ttm_revenue', 'ttm_profit', 
                      'last_month_revenue', 'last_month_profit')
        }),
        ('Collaboration Information', {
            'fields': ('earn_through', 'phase', 'team_size')
        }),
        ('Classification', {
            'fields': ('type', 'category', 'status', 'featured')
        }),
        ('Metadata', {
            'fields': ('owner', 'stages', 'views', 'created_at', 'updated_at')
        }),
    )


@admin.register(StartupTag)
class StartupTagAdmin(admin.ModelAdmin):
    """Admin configuration for StartupTag model"""
    list_display = ('startup', 'tag')
    list_filter = ('tag',)
    search_fields = ('startup__title', 'tag')


@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    """Admin configuration for Position model"""
    list_display = ('title', 'startup', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('title', 'startup__title')
    ordering = ('-created_at',)


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    """Admin configuration for Application model"""
    list_display = ('applicant', 'startup', 'position', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('applicant__username', 'startup__title', 'position__title')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    """Admin configuration for UserSession model"""
    list_display = ('user', 'expires_at', 'created_at')
    list_filter = ('expires_at', 'created_at')
    search_fields = ('user__username', 'user__email')
    ordering = ('-created_at',)
    readonly_fields = ('token_hash', 'created_at')

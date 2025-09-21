import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import apiClient from '../utils/axiosConfig';
import { API_BASE_URL } from '../utils/api';

const AuthContext = createContext();

// Export AuthContext for components that need direct access
export { AuthContext };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const refreshAccessToken = async () => {
    try {
      // Prevent infinite refresh loops
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTime;
      
      // Don't refresh more than once every 5 seconds
      if (timeSinceLastRefresh < 5000) {
        console.log('⏱️ Too soon to refresh again, waiting...');
        return false;
      }
      
      // Maximum 5 refresh attempts before giving up
      if (refreshAttempts >= 5) {
        console.log('❌ Too many refresh attempts, logging out...');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        Cookies.remove('token');
        Cookies.remove('refresh_token');
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }
      
      console.log(`🔄 Attempting to refresh access token... (attempt ${refreshAttempts + 1}/5)`);
      setRefreshAttempts(prev => prev + 1);
      setLastRefreshTime(now);
      
      // Try to get refresh token from localStorage first, then cookies
      const refreshToken = localStorage.getItem('refresh_token') || Cookies.get('refresh_token');
      
      if (!refreshToken) {
        console.log('No refresh token found in localStorage or cookies');
        return false;
      }
      
      const response = await apiClient.post('/auth/refresh', {
        refresh_token: refreshToken
      });
      
      if (response.data.access_token) {
        console.log('✅ Access token refreshed successfully');
        
        // Store new access token in localStorage (backend sets HttpOnly cookie)
        localStorage.setItem('access_token', response.data.access_token);
        console.log('✅ New access token stored:', response.data.access_token.substring(0, 20) + '...');
        
        // Reset refresh attempts on success
        setRefreshAttempts(0);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Failed to refresh token:', error);
      return false;
    }
  };

  const checkAuthStatus = async () => {
    console.log('🔍 Checking authentication status...');
    try {
      // Get token from localStorage first (set by login/refresh), then fall back to cookies
      const token = localStorage.getItem('access_token') || Cookies.get('token');
      const verificationToken = localStorage.getItem('verificationToken');
      console.log('Access token from localStorage:', token ? `${token.substring(0, 20)}...` : 'No access token found');
      console.log('Verification token in localStorage:', verificationToken ? 'Found' : 'Not found');
      
      if (token) {
        console.log('Token found, verifying with backend...');
        try {
          const response = await apiClient.get('/api/users/profile');
          const user = response.data.user;
          console.log('Profile verification successful:', user);
          
          // If we got a successful response with user data, the token is valid
          // Set authentication state regardless of emailVerified status
          // (backend should handle email verification enforcement)
          console.log('Token is valid, user authenticated:', user.username);
          setUser(user);
          setIsAuthenticated(true);
          
          // Clear verification token as user has a valid auth token
          localStorage.removeItem('verificationToken');
        } catch (apiError) {
          // If token is expired, try to refresh it
          if (apiError.response?.status === 401) {
            console.log('Access token expired, attempting to refresh...');
            const refreshed = await refreshAccessToken();
            
            if (refreshed) {
              // Retry the profile request with new token
              try {
                const response = await apiClient.get('/api/users/profile');
                const user = response.data.user;
                console.log('Profile verification successful after refresh:', user);
                setUser(user);
                setIsAuthenticated(true);
                localStorage.removeItem('verificationToken');
              } catch (retryError) {
                console.error('Failed to get profile after refresh:', retryError);
                throw retryError;
              }
            } else {
              throw apiError;
            }
          } else {
            throw apiError;
          }
        }
      } else {
        console.log('No token found, checking if refresh is possible...');
        const refreshed = await refreshAccessToken();
        
        if (refreshed) {
          // Don't immediately retry - let the normal auth flow handle it
          console.log('🔄 Token refreshed, auth state will update automatically');
        } else {
          console.log('No valid tokens, user not authenticated');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      console.log('Clearing authentication state due to error');
      setUser(null);
      setIsAuthenticated(false);
      // Remove invalid tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      Cookies.remove('token');
      Cookies.remove('refresh_token');
    } finally {
      setLoading(false);
      console.log('Auth check completed');
    }
  };

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password
      });

      console.log('Login response:', response.data);

      if (response.data.user) {
        const user = response.data.user;
        console.log('Login user data:', user);
        
        // Store tokens from response data (backend also sets cookies)
        if (response.data.token || response.data.access_token) {
          console.log('Storing tokens from login response');
          const accessToken = response.data.access_token || response.data.token;
          const refreshToken = response.data.refresh_token;
          
          // Store in localStorage as backup (HttpOnly cookies are primary)
          localStorage.setItem('access_token', accessToken);
          if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken);
          }
          
          console.log('✅ Tokens stored in localStorage');
          console.log('- Access token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'None');
          console.log('- Refresh token:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'None');
        } else {
          console.warn('No token received in login response');
        }
        
        // Wait a moment to ensure cookies are properly set before updating auth state
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Final verification that tokens are available
        const finalTokenCheck = Cookies.get('token');
        const finalRefreshCheck = Cookies.get('refresh_token');
        console.log('🔍 Final token verification:');
        console.log('- Access token available:', !!finalTokenCheck);
        console.log('- Refresh token available:', !!finalRefreshCheck);
        
        setUser(user);
        setIsAuthenticated(true);
        // Clear verification token as user is now authenticated
        localStorage.removeItem('verificationToken');
        return { success: true, user: user };
      } else {
        console.warn('No user data in login response');
        return { success: false, error: 'No user data received' };
      }
    } catch (error) {
      console.error('Login failed:', error);
      
      // Check if it's an email verification error (403 with specific message)
      if (error.response?.status === 403 && 
          (error.response?.data?.message === 'Email not verified' || 
           error.response?.data?.error === 'Email not verified' ||
           error.response?.data?.message?.includes('not verified'))) {
        console.log('Login failed due to unverified email');
        return {
          success: false,
          error: 'Email not verified',
          needsVerification: true
        };
      }
      
      return { 
        success: false, 
        error: error.response?.data?.error || error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const signup = async (username, email, password, role = 'entrepreneur', phone_number = '') => {
    try {
      const requestData = {
        username,
        email,
        password,
        role
      };
      
      // Only include phone_number if provided
      if (phone_number && phone_number.trim()) {
        requestData.phone_number = phone_number.trim();
      }
      
      console.log('📝 Signup request data:', requestData);
      
      const response = await apiClient.post('/signup', requestData);

      console.log('Signup response:', response.data);

      if (response.data.user) {
        const user = response.data.user;
        
        // Check if email is verified
        if (user.emailVerified && response.data.token) {
          console.log('User email already verified, storing auth token');
          Cookies.set('token', response.data.token, { 
            expires: 7, // 7 days
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
          });
          setUser(user);
          setIsAuthenticated(true);
          // Clear verification token as user is now authenticated
          localStorage.removeItem('verificationToken');
        } else {
          console.log('Email not verified - user needs to verify email first');
          // Don't set authenticated state until email is verified
          setUser(user);
          setIsAuthenticated(false);
          
          // Store user email for verification flow
          localStorage.setItem('pendingLoginEmail', user.email);
        }
        
        return { 
          success: true, 
          user: user,
          requiresVerification: !user.emailVerified
        };
      } else {
        console.warn('No user data in signup response');
        return { success: false, error: 'No user data received' };
      }
    } catch (error) {
      console.error('Signup failed:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
          headers: error.config?.headers
        }
      });
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          (typeof error.response?.data === 'string' ? error.response.data : null) ||
                          'Signup failed';
                          
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const verifyEmail = async (verificationCode, email) => {
    try {
      if (!verificationCode) {
        return {
          success: false,
          error: 'Verification code is required'
        };
      }
      
      console.log('Verifying email with code:', verificationCode, 'for email:', email);
      
      const response = await apiClient.post('/auth/verify', { 
        code: verificationCode,
        email: email
      });
      
      console.log('Email verification response:', response.data);
      
      if (response.data.success || response.status === 200) {
        console.log('Email verification successful');
        
        // If user data is returned, update state
        if (response.data.user) {
          const verifiedUser = response.data.user;
          console.log('User after verification:', verifiedUser);
          setUser(verifiedUser);
          
          // Store auth token if provided after verification
          if (response.data.token) {
            console.log('Storing auth token after email verification');
            Cookies.set('token', response.data.token, { 
              expires: 7,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax'
            });
            setIsAuthenticated(true);
          }
        } else {
          // If no user data returned, update current user's emailVerified status
          console.log('No user data in verification response, updating current user');
          if (user) {
            const updatedUser = { ...user, emailVerified: true };
            setUser(updatedUser);
            setIsAuthenticated(true); // Set authenticated since verification was successful
            console.log('Updated user emailVerified status and set authenticated:', updatedUser);
          }
        }
        
        return { success: true, message: response.data.message || 'Email verified successfully' };
      } else {
        return { success: false, error: response.data.message || 'Verification failed' };
      }
    } catch (error) {
      console.error('Email verification failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.error || 'Email verification failed'
      };
    }
  };

  const resendVerificationCode = async (email) => {
    try {
      console.log('Resending verification code for:', email);
      const response = await apiClient.post('/auth/send-verification-code', { email });
      
      if (response.data.verificationToken) {
        localStorage.setItem('verificationToken', response.data.verificationToken);
      }
      
      return {
        success: true,
        message: response.data.message || 'Verification code sent successfully'
      };
    } catch (error) {
      console.error('Failed to resend verification code:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to resend verification code'
      };
    }
  };

  const requestNewVerificationToken = async (email) => {
    try {
      console.log('Sending verification code to email:', email);
      const response = await apiClient.post('/auth/send-verification-code', { email });
      
      return { 
        success: true, 
        message: response.data.message || 'Verification code sent to your email' 
      };
    } catch (error) {
      console.error('Failed to send verification code:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.error || 'Failed to send verification code'
      };
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      // Clear tokens from localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('verificationToken');
      // Clear cookie backups
      Cookies.remove('token');
      Cookies.remove('refresh_token');
    }
  };

  const updateUser = (userData) => {
    setUser(prevUser => ({ ...prevUser, ...userData }));
  };

  // Debug function to check current auth state
  const getAuthStatus = () => {
    const authToken = Cookies.get('token');
    const verificationToken = localStorage.getItem('verificationToken');
    return {
      isAuthenticated,
      hasAuthToken: !!authToken,
      hasVerificationToken: !!verificationToken,
      userEmailVerified: user?.emailVerified || false,
      userName: user?.username || user?.name || 'Unknown'
    };
  };

  // Role-based access helpers
  const isEntrepreneur = () => user?.role === 'entrepreneur';
  const isStudent = () => user?.role === 'student';
  const isInvestor = () => user?.role === 'investor';

  const canCreateStartups = () => isEntrepreneur();
  const canApplyToJobs = () => isStudent();
  const canInvest = () => isInvestor();

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    signup,
    verifyEmail,
    resendVerificationCode,
    requestNewVerificationToken,
    logout,
    updateUser,
    getAuthStatus,
    isEntrepreneur,
    isStudent,
    isInvestor,
    canCreateStartups,
    canApplyToJobs,
    canInvest
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

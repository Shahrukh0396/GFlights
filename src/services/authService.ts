import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
import { AuthResponse, LoginRequest, RegisterRequest, AuthError } from '../types/auth';

const TOKEN_KEY = '@gflights_token';
const USER_KEY = '@gflights_user';

class AuthService {
  private token: string | null = null;
  private user: any = null;

  // Initialize auth state from storage
  async initializeAuth(): Promise<boolean> {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY)
      ]);

      if (storedToken && storedUser) {
        this.token = storedToken;
        this.user = JSON.parse(storedUser);

        // Set default authorization header for future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

        return true;
      }
      return false;
    } catch (error) {
      console.error('Error initializing auth:', error);
      return false;
    }
  }

  // Register new user
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      console.log('Making request to:', api.defaults.baseURL + '/auth/register');
      console.log('Request data:', userData);
      const response = await api.post('/auth/register', userData);
      console.log('Success response:', response.status, response.data);
      const { user, access_token } = response.data;

      await this.setAuthData(user, access_token);

      return { user, access_token };
    } catch (error: any) {
      console.log('Register error:', error);
      console.log('Error response:', error.response?.data);
      console.log('Error status:', error.response?.status);
      console.log('Request data sent:', userData);
      console.log('Full error response:', JSON.stringify(error.response?.data, null, 2));
      throw this.handleAuthError(error);
    }
  }

  // Login user
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/login', credentials);
      const { user, access_token } = response.data;

      await this.setAuthData(user, access_token);

      return { user, access_token };
    } catch (error: any) {
      console.log('Login error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
      this.token = null;
      this.user = null;

      // Remove authorization header
      delete api.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  // Get current user
  getCurrentUser(): any {
    return this.user;
  }

  // Get current token
  getToken(): string | null {
    return this.token;
  }

  // Set auth data in storage and memory
  private async setAuthData(user: any, token: string): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, token),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(user))
      ]);

      this.token = token;
      this.user = user;

      // Set authorization header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      console.error('Error setting auth data:', error);
      throw new Error('Failed to save authentication data');
    }
  }

  // Handle authentication errors
  private handleAuthError(error: any): AuthError {
    console.log('Auth error:', error);
    if (error.response) {
      const { status, data } = error.response;
      return {
        message: data.message || 'Authentication failed',
        statusCode: status
      };
    } else if (error.request) {
      return {
        message: 'Network error. Please check your connection.',
        statusCode: 0
      };
    } else {
      return {
        message: 'An unexpected error occurred',
        statusCode: 500
      };
    }
  }
}

// Export singleton instance
export default new AuthService();

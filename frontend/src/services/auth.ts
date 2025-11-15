import { apiClient, setAuthToken } from '../lib/apiClient';
import { useAuthStore } from '../store/authStore';
import type { AuthResponse, LoginRequest, RegisterRequest, UpdateProfileRequest, User } from '../types/api';

export const registerUser = async (payload: RegisterRequest): Promise<User> => {
  const response = await apiClient.post<User>('/auth/register', payload);
  return response.data;
};

export const loginUser = async (payload: LoginRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', payload);
  return response.data;
};

export const fetchProfile = async (): Promise<User> => {
  const response = await apiClient.get<User>('/profile/me');
  return response.data;
};

export const updateProfile = async (payload: UpdateProfileRequest): Promise<User> => {
  const response = await apiClient.patch<User>('/profile/me', payload);
  return response.data;
};

export const useAuthActions = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const login = (auth: AuthResponse) => {
    setAuth(auth.access_token, auth.user);
    setAuthToken(auth.access_token);
  };

  const logout = () => {
    clearAuth();
    setAuthToken(null);
  };

  return { login, logout };
};


import apiClient from './client';

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: number;
  email: string;
  is_active: boolean;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  // OAuth2PasswordRequestForm expects form-encoded data
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);
  const res = await apiClient.post<LoginResponse>('/auth/login', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return res.data;
}

export async function register(email: string, password: string): Promise<UserResponse> {
  const res = await apiClient.post<UserResponse>('/auth/register', { email, password });
  return res.data;
}

export async function getMe(): Promise<UserResponse> {
  const res = await apiClient.get<UserResponse>('/auth/me');
  return res.data;
}

export async function changePassword(old_password: string, new_password: string): Promise<{ message: string }> {
  const res = await apiClient.post<{ message: string }>('/auth/change-password', { old_password, new_password });
  return res.data;
}


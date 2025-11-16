export interface UserSettings {
  default_model?: string;
  default_temperature?: number;
  theme?: 'light' | 'dark' | 'auto';
  auto_scroll?: boolean;
  accent_color?: string;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  settings?: UserSettings | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: 'bearer';
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  display_name: string;
}

export interface UpdateProfileRequest {
  display_name?: string;
  settings?: UserSettings;
}

export interface Chat {
  id: string;
  title: string;
  model_name: string;
  created_at: string;
  updated_at: string;
}

export interface ChatDetail extends Chat {
  messages: Message[];
}

export interface Message {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model_name: string | null;
  created_at: string;
}

export interface CreateChatRequest {
  title?: string | null;
  model_name?: string | null;
}

export interface UpdateChatRequest {
  title: string;
}

export interface SendMessageRequest {
  content: string;
}


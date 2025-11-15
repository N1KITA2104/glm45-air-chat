import { apiClient } from '../lib/apiClient';
import type {
  Chat,
  ChatDetail,
  CreateChatRequest,
  Message,
  SendMessageRequest,
  UpdateChatRequest,
} from '../types/api';

export const fetchChats = async (): Promise<Chat[]> => {
  const response = await apiClient.get<Chat[]>('/chats');
  return response.data;
};

export const fetchChat = async (chatId: string): Promise<ChatDetail> => {
  const response = await apiClient.get<ChatDetail>(`/chats/${chatId}`);
  return response.data;
};

export const createChat = async (payload: CreateChatRequest = {}): Promise<Chat> => {
  const response = await apiClient.post<Chat>('/chats', payload);
  return response.data;
};

export const updateChat = async (chatId: string, payload: UpdateChatRequest): Promise<Chat> => {
  const response = await apiClient.patch<Chat>(`/chats/${chatId}`, payload);
  return response.data;
};

export const deleteChat = async (chatId: string): Promise<void> => {
  await apiClient.delete(`/chats/${chatId}`);
};

export const fetchMessages = async (chatId: string): Promise<Message[]> => {
  const response = await apiClient.get<Message[]>(`/chats/${chatId}/messages`);
  return response.data;
};

export const sendMessage = async (
  chatId: string,
  payload: SendMessageRequest,
): Promise<Message> => {
  const response = await apiClient.post<Message>(`/chats/${chatId}/messages`, payload);
  return response.data;
};


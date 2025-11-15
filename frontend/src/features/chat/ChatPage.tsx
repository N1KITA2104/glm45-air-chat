import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ChatHeader } from './components/ChatHeader';
import { ChatMessageInput } from './components/ChatMessageInput';
import { ChatMessageList } from './components/ChatMessageList';
import { ChatSidebar } from './components/ChatSidebar';
import {
  createChat,
  deleteChat,
  fetchChats,
  fetchMessages,
  sendMessage,
  updateChat,
} from '../../services/chats';
import { useAuthStore } from '../../store/authStore';
import type { Chat } from '../../types/api';
import '../../styles/chat.css';
import { useAuthActions } from '../../services/auth';

export const ChatPage = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { logout } = useAuthActions();

  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const chatsQuery = useQuery({
    queryKey: ['chats'],
    queryFn: fetchChats,
  });

  const messagesQuery = useQuery({
    queryKey: ['messages', activeChatId],
    queryFn: () => fetchMessages(activeChatId!),
    enabled: Boolean(activeChatId),
    refetchInterval: 0,
  });

  const createChatMutation = useMutation({
    mutationFn: createChat,
    onSuccess: (newChat) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      setActiveChatId(newChat.id);
    },
  });

  const renameChatMutation = useMutation({
    mutationFn: ({ chatId, title }: { chatId: string; title: string }) =>
      updateChat(chatId, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      if (activeChatId) {
        queryClient.invalidateQueries({ queryKey: ['messages', activeChatId] });
      }
    },
  });

  const deleteChatMutation = useMutation({
    mutationFn: deleteChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      setActiveChatId(null);
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ chatId, content }: { chatId: string; content: string }) =>
      sendMessage(chatId, { content }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });

  const chats = chatsQuery.data ?? [];
  const activeChat: Chat | null = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) ?? null,
    [activeChatId, chats],
  );

  useEffect(() => {
    if (!activeChatId && chats.length > 0) {
      setActiveChatId(chats[0].id);
    }
  }, [activeChatId, chats]);

  const handleCreateChat = () => {
    createChatMutation.mutate({});
  };

  const handleRenameChat = () => {
    if (!activeChat) return;
    const nextTitle = window.prompt('Enter a new title for this chat', activeChat.title);
    if (!nextTitle) return;
    renameChatMutation.mutate({ chatId: activeChat.id, title: nextTitle });
  };

  const handleDeleteChat = () => {
    if (!activeChat) return;
    const confirmed = window.confirm('Delete this chat? This cannot be undone.');
    if (!confirmed) return;
    deleteChatMutation.mutate(activeChat.id);
  };

  const handleSendMessage = async (content: string) => {
    try {
      if (!activeChatId) {
        const newChat = await createChatMutation.mutateAsync({});
        setActiveChatId(newChat.id);
        await sendMessageMutation.mutateAsync({ chatId: newChat.id, content });
        return;
      }
      await sendMessageMutation.mutateAsync({ chatId: activeChatId, content });
    } catch (error) {
      console.error(error);
      window.alert('Failed to send message. Please try again.');
    }
  };

  const handleSignOut = () => {
    logout();
    queryClient.clear();
  };

  return (
    <div className="chat-layout">
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelect={setActiveChatId}
        onCreateChat={handleCreateChat}
      />
      <main className="chat-main">
        <header className="chat-topbar">
          <div>
            <h3>{user?.display_name ?? 'Pet Lover'}</h3>
            <span>{user?.email}</span>
          </div>
          <div className="chat-topbar-actions">
            <Link to="/profile">Profile</Link>
            <button type="button" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </header>

        <ChatHeader chat={activeChat} onRename={handleRenameChat} onDelete={handleDeleteChat} />

        <section className="chat-body">
          <ChatMessageList
            messages={messagesQuery.data}
            isLoading={messagesQuery.isLoading || messagesQuery.isFetching}
          />
        </section>

        <ChatMessageInput
          onSend={handleSendMessage}
          disabled={sendMessageMutation.isPending || createChatMutation.isPending}
        />
      </main>
    </div>
  );
};


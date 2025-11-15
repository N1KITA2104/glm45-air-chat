import { useEffect, useMemo, useState } from 'react';
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

type OptimisticMessage = {
  id: string;
  content: string;
  role: 'user';
  created_at: string;
  isOptimistic: true;
};

export const ChatPage = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { logout } = useAuthActions();

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<Map<string, OptimisticMessage[]>>(
    new Map(),
  );
  const [isThinking, setIsThinking] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const chatsQuery = useQuery({
    queryKey: ['chats'],
    queryFn: fetchChats,
  });

  const chats = chatsQuery.data ?? [];
  const activeChat: Chat | null = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) ?? null,
    [activeChatId, chats],
  );

  const activeChatQueryId = activeChat?.id ?? null;

  const messagesQuery = useQuery({
    queryKey: ['messages', activeChatQueryId],
    queryFn: () => fetchMessages(activeChatQueryId!),
    enabled: Boolean(activeChatQueryId) && Boolean(activeChat),
    refetchInterval: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const createChatMutation = useMutation({
    mutationFn: createChat,
    onSuccess: (newChat) => {
      queryClient.setQueryData(['chats'], (oldChats: Chat[] | undefined) => {
        return oldChats ? [...oldChats, newChat] : [newChat];
      });
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
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(['chats'], (oldChats: Chat[] | undefined) => {
        return oldChats ? oldChats.filter((chat) => chat.id !== deletedId) : [];
      });
      queryClient.removeQueries({ queryKey: ['messages', deletedId], exact: true });
      setOptimisticMessages((prev) => {
        const newMap = new Map(prev);
        newMap.delete(deletedId);
        return newMap;
      });
      setActiveChatId((current) => {
        if (current === deletedId) {
          return null;
        }
        return current;
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ chatId, content }: { chatId: string; content: string }) =>
      sendMessage(chatId, { content }),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      await queryClient.refetchQueries({ queryKey: ['messages', variables.chatId] });
      setOptimisticMessages((prev) => {
        const newMap = new Map(prev);
        const chatMessages = newMap.get(variables.chatId) || [];
        newMap.set(
          variables.chatId,
          chatMessages.filter((msg) => msg.content !== variables.content),
        );
        return newMap;
      });
      setIsThinking(false);
    },
    onError: (_, variables) => {
      setOptimisticMessages((prev) => {
        const newMap = new Map(prev);
        const chatMessages = newMap.get(variables.chatId) || [];
        newMap.set(
          variables.chatId,
          chatMessages.filter((msg) => msg.content !== variables.content),
        );
        return newMap;
      });
      setIsThinking(false);
    },
  });

  useEffect(() => {
    if (chats.length === 0) {
      if (activeChatId !== null) {
        setActiveChatId(null);
      }
      return;
    }

    const exists = activeChatId ? chats.some((chat) => chat.id === activeChatId) : false;
    if (!activeChatId || !exists) {
      const firstChat = chats[0];
      if (firstChat) {
        setActiveChatId(firstChat.id);
      }
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
    let targetChatId = activeChatId;
    try {
      const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;
      const optimisticMessage: OptimisticMessage = {
        id: optimisticId,
        content,
        role: 'user',
        created_at: new Date().toISOString(),
        isOptimistic: true,
      };

      if (!activeChatId) {
        const newChat = await createChatMutation.mutateAsync({});
        targetChatId = newChat.id;
        setActiveChatId(newChat.id);
      }

      setOptimisticMessages((prev) => {
        const newMap = new Map(prev);
        const chatMessages = newMap.get(targetChatId!) || [];
        newMap.set(targetChatId!, [...chatMessages, optimisticMessage]);
        return newMap;
      });
      setIsThinking(true);

      await sendMessageMutation.mutateAsync({ chatId: targetChatId!, content });
    } catch (error) {
      console.error(error);
      window.alert('Failed to send message. Please try again.');
      setIsThinking(false);
      if (targetChatId) {
        setOptimisticMessages((prev) => {
          const newMap = new Map(prev);
          const chatMessages = newMap.get(targetChatId!) || [];
          newMap.set(
            targetChatId!,
            chatMessages.filter((msg) => msg.content !== content),
          );
          return newMap;
        });
      }
    }
  };

  const handleSignOut = () => {
    logout();
    queryClient.clear();
  };

  return (
    <div className={`chat-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelect={setActiveChatId}
        onCreateChat={handleCreateChat}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user}
        onSignOut={handleSignOut}
      />
      <main className="chat-main">

        <ChatHeader chat={activeChat} onRename={handleRenameChat} onDelete={handleDeleteChat} />

        <section className="chat-body">
          <ChatMessageList
            messages={messagesQuery.data}
            isLoading={messagesQuery.isLoading || messagesQuery.isFetching}
            optimisticMessages={activeChatId ? optimisticMessages.get(activeChatId) || [] : []}
            isThinking={isThinking}
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


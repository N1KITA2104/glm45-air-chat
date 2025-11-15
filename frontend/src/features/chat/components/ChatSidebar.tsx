import type { Chat } from '../../../types/api';

type Props = {
  chats: Chat[] | undefined;
  activeChatId: string | null;
  onSelect: (chatId: string) => void;
  onCreateChat: () => void;
};

export const ChatSidebar = ({ chats, activeChatId, onSelect, onCreateChat }: Props) => (
  <aside className="chat-sidebar">
    <div className="chat-sidebar-header">
      <h2>Chats</h2>
      <button type="button" onClick={onCreateChat}>
        + New chat
      </button>
    </div>
    <div className="chat-sidebar-list">
      {chats && chats.length > 0 ? (
        chats.map((chat) => (
          <button
            key={chat.id}
            type="button"
            className={chat.id === activeChatId ? 'chat-item active' : 'chat-item'}
            onClick={() => onSelect(chat.id)}
          >
            <span className="chat-item-title">{chat.title}</span>
            <span className="chat-item-meta">
              {new Date(chat.updated_at).toLocaleDateString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </button>
        ))
      ) : (
        <p className="chat-sidebar-empty">No chats yet.</p>
      )}
    </div>
  </aside>
);


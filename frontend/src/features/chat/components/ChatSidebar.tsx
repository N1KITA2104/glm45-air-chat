import { useState, useRef } from 'react';
import { FiUser, FiChevronLeft, FiChevronRight, FiPlus } from 'react-icons/fi';
import { TooltipButton } from '../../../components/TooltipButton';
import { ProfileMenu } from '../../../components/ProfileMenu';
import type { Chat } from '../../../types/api';
import type { User } from '../../../types/api';

type Props = {
  chats: Chat[] | undefined;
  activeChatId: string | null;
  onSelect: (chatId: string) => void;
  onCreateChat: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  user: User | null;
  onSignOut: () => void;
};

export const ChatSidebar = ({
  chats,
  activeChatId,
  onSelect,
  onCreateChat,
  collapsed,
  onToggleCollapse,
  user,
  onSignOut,
}: Props) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <aside className={`chat-sidebar ${collapsed ? 'collapsed' : ''}`}>
    <div className="chat-sidebar-header">
      {!collapsed && <h2>Chats</h2>}
      <div className="chat-sidebar-header-actions">
        {!collapsed && (
          <TooltipButton
            tooltip="New chat"
            onClick={onCreateChat}
            className="sidebar-new-chat-btn"
          >
            <FiPlus />
          </TooltipButton>
        )}
        <TooltipButton
          tooltip={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={onToggleCollapse}
          className="sidebar-collapse-btn"
        >
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </TooltipButton>
      </div>
    </div>
    {!collapsed && (
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
    )}
      <div className="chat-sidebar-footer">
        {collapsed ? (
          <>
            <TooltipButton
              ref={profileButtonRef}
              tooltip="Profile"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="sidebar-profile-btn"
            >
              <FiUser />
            </TooltipButton>
            <ProfileMenu
              isOpen={isProfileMenuOpen}
              onClose={() => setIsProfileMenuOpen(false)}
              onSignOut={onSignOut}
              buttonRef={profileButtonRef}
            />
          </>
        ) : (
          <>
            <div className="chat-sidebar-profile">
              <div className="chat-sidebar-profile-info">
                <h3>{user?.display_name ?? 'Pet Lover'}</h3>
                <span>{user?.email}</span>
              </div>
              <div className="chat-sidebar-profile-actions">
                <TooltipButton
                  ref={profileButtonRef}
                  tooltip="Profile"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="sidebar-profile-btn"
                >
                  <FiUser />
                </TooltipButton>
                <ProfileMenu
                  isOpen={isProfileMenuOpen}
                  onClose={() => setIsProfileMenuOpen(false)}
                  onSignOut={onSignOut}
                  buttonRef={profileButtonRef}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};


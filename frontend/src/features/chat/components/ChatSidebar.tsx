import { useState, useRef, useEffect } from 'react';
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
  width: number;
  onWidthChange: (width: number) => void;
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
  width,
  onWidthChange,
  user,
  onSignOut,
}: Props) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || collapsed) return;
      
      const newWidth = e.clientX;
      const minWidth = 200;
      const maxWidth = 600;
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      onWidthChange(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, collapsed, onWidthChange]);

  const handleResizeStart = (e: React.MouseEvent) => {
    if (collapsed) return;
    e.preventDefault();
    setIsResizing(true);
  };

  return (
    <aside 
      ref={sidebarRef}
      className={`chat-sidebar ${collapsed ? 'collapsed' : ''} ${isResizing ? 'resizing' : ''}`}
      style={{ width: collapsed ? '60px' : `${width}px` }}
    >
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
    <div className={`chat-sidebar-list ${collapsed ? 'collapsed' : ''}`}>
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
      {!collapsed && (
        <div 
          className="chat-sidebar-resize-handle"
          onMouseDown={handleResizeStart}
        />
      )}
    </aside>
  );
};


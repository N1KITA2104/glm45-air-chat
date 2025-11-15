import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import './RenameChatModal.css';

type RenameChatModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newTitle: string) => void;
  currentTitle: string;
  isLoading?: boolean;
};

export const RenameChatModal = ({
  isOpen,
  onClose,
  onConfirm,
  currentTitle,
  isLoading = false,
}: RenameChatModalProps) => {
  const [title, setTitle] = useState(currentTitle);

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
    }
  }, [isOpen, currentTitle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && !isLoading) {
      onConfirm(title.trim());
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setTitle(currentTitle);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Rename chat" size="small">
      <form onSubmit={handleSubmit} className="rename-chat-form">
        <div className="rename-chat-input-group">
          <label htmlFor="chat-title">Chat title</label>
          <input
            id="chat-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter chat title"
            disabled={isLoading}
            autoFocus
          />
        </div>
        <div className="rename-chat-actions">
          <button
            type="button"
            className="rename-chat-button rename-chat-button-cancel"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rename-chat-button rename-chat-button-confirm"
            disabled={!title.trim() || isLoading}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
};


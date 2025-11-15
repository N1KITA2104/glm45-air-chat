import type { Chat } from '../../../types/api';

type Props = {
  chat: Chat | null;
  onRename: () => void;
  onDelete: () => void;
};

export const ChatHeader = ({ chat, onDelete, onRename }: Props) => (
  <div className="chat-header">
    <div>
      <h1>{chat?.title ?? 'Select a chat'}</h1>
      {chat ? (
        <p>
          Model: <span>{chat.model_name}</span>
        </p>
      ) : null}
    </div>
    <div className="chat-header-actions">
      <button type="button" onClick={onRename} disabled={!chat}>
        Rename
      </button>
      <button type="button" onClick={onDelete} disabled={!chat} className="danger">
        Delete
      </button>
    </div>
  </div>
);


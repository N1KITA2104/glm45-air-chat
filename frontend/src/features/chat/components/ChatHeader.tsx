import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { TooltipButton } from '../../../components/TooltipButton';
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
    {chat ? (
      <div className="chat-header-actions">
        <TooltipButton tooltip="Rename" onClick={onRename}>
          <FiEdit2 />
        </TooltipButton>
        <TooltipButton tooltip="Delete" onClick={onDelete} className="danger">
          <FiTrash2 />
        </TooltipButton>
      </div>
    ) : null}
  </div>
);


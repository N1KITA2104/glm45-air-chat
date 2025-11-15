import type { Message } from '../../../types/api';
import { LLMMessage } from './LLMMessage';

type Props = {
  messages: Message[] | undefined;
  isLoading: boolean;
};

export const ChatMessageList = ({ messages, isLoading }: Props) => {
  if (isLoading) {
    return (
      <div className="messages-empty">
        <span>Loading conversation…</span>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="messages-empty">
        <span>No messages yet. Start the conversation!</span>
      </div>
    );
  }

  return (
    <div className="messages-scroll">
      {messages.map((message) => (
        <div
          key={message.id}
          className={message.role === 'user' ? 'message message-user' : 'message message-ai'}
        >
          <div className="message-meta">
            <span>{message.role === 'user' ? 'You' : 'GLM 4.5 Air'}</span>
            <span>{new Date(message.created_at).toLocaleTimeString()}</span>
          </div>
          {message.role === 'user' ? (
            <div className="message-user-content">{message.content}</div>
          ) : (
            <LLMMessage content={message.content} />
          )}
        </div>
      ))}
    </div>
  );
};


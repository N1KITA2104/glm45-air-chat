import { useEffect, useRef } from 'react';
import type { Message } from '../../../types/api';
import { LLMMessage } from './LLMMessage';
import { ThinkingIndicator } from './ThinkingIndicator';

type OptimisticMessage = {
  id: string;
  content: string;
  role: 'user';
  created_at: string;
  isOptimistic: true;
};

type DisplayMessage = Message | OptimisticMessage;

const isOptimisticMessage = (msg: DisplayMessage): msg is OptimisticMessage => {
  return 'isOptimistic' in msg && msg.isOptimistic === true;
};

type Props = {
  messages: Message[] | undefined;
  isLoading: boolean;
  optimisticMessages?: OptimisticMessage[];
  isThinking?: boolean;
};

export const ChatMessageList = ({
  messages,
  isLoading,
  optimisticMessages = [],
  isThinking = false,
}: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  const displayMessages: DisplayMessage[] = [
    ...(messages || []),
    ...optimisticMessages,
  ];

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      shouldAutoScrollRef.current = isNearBottom;
    };

    container.addEventListener('scroll', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    if (optimisticMessages.length > 0 || isThinking) {
      shouldAutoScrollRef.current = true;
    }

    if (!shouldAutoScrollRef.current) return;

    requestAnimationFrame(() => {
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    });
  }, [displayMessages.length, isThinking, optimisticMessages.length]);

  if (isLoading && (!messages || messages.length === 0)) {
    return (
      <div className="messages-empty">
        <span>Loading conversation…</span>
      </div>
    );
  }

  if (displayMessages.length === 0 && !isThinking) {
    return (
      <div className="messages-empty">
        <span>No messages yet. Start the conversation!</span>
      </div>
    );
  }

  return (
    <div className="messages-scroll" ref={scrollRef}>
      {displayMessages.map((message) => {
        const isOptimistic = isOptimisticMessage(message);
        return (
          <div
            key={message.id}
            className={message.role === 'user' ? 'message message-user' : 'message message-ai'}
            data-optimistic={isOptimistic ? 'true' : undefined}
          >
            <div className="message-meta">
              <span>{message.role === 'user' ? 'You' : 'GLM 4.5 Air'}</span>
              <span>
                {isOptimistic
                  ? 'Sending...'
                  : new Date(message.created_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
              </span>
            </div>
            {message.role === 'user' ? (
              <div className="message-user-content">{message.content}</div>
            ) : (
              <LLMMessage content={message.content} />
            )}
          </div>
        );
      })}
      {isThinking && <ThinkingIndicator />}
    </div>
  );
};


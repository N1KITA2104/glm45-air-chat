import { useCallback, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { FiSend } from 'react-icons/fi';

type Props = {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
};

export const ChatMessageInput = ({ onSend, disabled }: Props) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async () => {
    if (disabled) {
      return;
    }
    if (!value.trim()) {
      setError('Please enter a message before sending.');
      return;
    }
    setError(null);
    const content = value.trim();
    setValue('');
    await onSend(content);
  }, [disabled, onSend, value]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendMessage();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!disabled && event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <div className="chat-input-container">
        <textarea
          placeholder="Ask about your pet's health, diet, or mood…"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <button type="submit" disabled={disabled} className="chat-input-send">
          <FiSend />
        </button>
      </div>
      {error ? <span className="chat-input-error">{error}</span> : null}
    </form>
  );
};


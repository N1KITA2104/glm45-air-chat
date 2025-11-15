import { useCallback, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';

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
      <textarea
        placeholder="Ask about your pet's health, diet, or mood…"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        disabled={disabled}
      />
      {error ? <span className="chat-input-error">{error}</span> : null}
      <div className="chat-input-actions">
        <button type="submit" disabled={disabled}>
          {disabled ? 'Thinking…' : 'Send'}
        </button>
      </div>
    </form>
  );
};


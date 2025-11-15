import './ThinkingIndicator.css';

export const ThinkingIndicator = () => {
  return (
    <div className="thinking-indicator">
      <div className="thinking-avatar">🤔</div>
      <div className="thinking-content">
        <div className="thinking-text">Thinking</div>
        <div className="thinking-dots">
          <span className="dot dot-1">.</span>
          <span className="dot dot-2">.</span>
          <span className="dot dot-3">.</span>
        </div>
      </div>
    </div>
  );
};


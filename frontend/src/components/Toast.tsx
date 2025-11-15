import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiAlertCircle, FiCheckCircle, FiInfo, FiAlertTriangle } from 'react-icons/fi';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

type ToastProps = {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
};

export const Toast = ({ message, type, isVisible, onClose, duration = 5000 }: ToastProps) => {
  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const icons = {
    success: FiCheckCircle,
    error: FiAlertCircle,
    warning: FiAlertTriangle,
    info: FiInfo,
  };

  const Icon = icons[type];

  return createPortal(
    <div className={`toast toast-${type}`}>
      <div className="toast-icon">
        <Icon />
      </div>
      <div className="toast-message">{message}</div>
      <button type="button" className="toast-close" onClick={onClose} aria-label="Close">
        <FiX />
      </button>
    </div>,
    document.body
  );
};


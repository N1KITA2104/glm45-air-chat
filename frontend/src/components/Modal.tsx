import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import './Modal.css';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: 'small' | 'medium' | 'large';
};

export const Modal = ({ isOpen, onClose, children, title, size = 'medium' }: ModalProps) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content modal-${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="modal-header">
            <h2>{title}</h2>
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
};


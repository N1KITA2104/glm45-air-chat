import { Modal } from './Modal';
import './ConfirmationModal.css';

type ConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  isLoading?: boolean;
};

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false,
}: ConfirmationModalProps) => {
  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="small">
      <div className="confirmation-modal">
        <p className="confirmation-message">{message}</p>
        <div className="confirmation-actions">
          <button
            type="button"
            className="confirmation-button confirmation-button-cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`confirmation-button confirmation-button-${variant}`}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};


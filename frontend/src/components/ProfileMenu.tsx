import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { FiUser, FiLogOut } from 'react-icons/fi';

type ProfileMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
  buttonRef: React.RefObject<HTMLElement>;
};

export const ProfileMenu = ({ isOpen, onClose, onSignOut, buttonRef }: ProfileMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isOpen || !buttonRef.current || !menuRef.current) return;

    const calculatePosition = () => {
      if (!buttonRef.current || !menuRef.current) return;

      const buttonRect = buttonRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = buttonRect.bottom + 8;
      let left = buttonRect.left;

      if (top + menuRect.height > viewportHeight) {
        top = buttonRect.top - menuRect.height - 8;
      }

      if (left + menuRect.width > viewportWidth) {
        left = viewportWidth - menuRect.width - 8;
      }

      if (left < 8) {
        left = 8;
      }

      setPosition({ top, left });
    };

    calculatePosition();

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition, true);
    };
  }, [isOpen, onClose, buttonRef]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="profile-menu"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <Link to="/profile" className="profile-menu-item" onClick={onClose}>
        <FiUser />
        <span>Profile</span>
      </Link>
      <button type="button" className="profile-menu-item profile-menu-item-danger" onClick={onSignOut}>
        <FiLogOut />
        <span>Sign out</span>
      </button>
    </div>,
    document.body
  );
};


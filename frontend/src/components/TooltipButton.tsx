import { useTooltip } from '../hooks/useTooltip';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

type TooltipButtonProps = {
  tooltip?: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  [key: string]: unknown;
};

export const TooltipButton = ({
  tooltip,
  className = '',
  children,
  onClick,
  type = 'button',
  ...props
}: TooltipButtonProps) => {
  const {
    buttonRef,
    tooltipRef,
    position,
    isVisible,
    tooltipStyle,
    arrowStyle,
    showTooltip,
    hideTooltip,
  } = useTooltip(tooltip);

  const buttonClassName = `tooltip-button ${className}`.trim();

  return (
    <>
      <button
        ref={buttonRef as React.RefObject<HTMLButtonElement>}
        type={type}
        className={buttonClassName}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        onClick={(e) => {
          hideTooltip();
          onClick?.(e);
        }}
        {...props}
      >
        {children}
      </button>
      {tooltip &&
        isVisible &&
        createPortal(
          <div
            ref={tooltipRef}
            className={`tooltip tooltip-${position}`}
            style={tooltipStyle}
          >
            {tooltip}
            <span
              className="tooltip-arrow"
              style={arrowStyle}
            />
          </div>,
          document.body
        )}
    </>
  );
};

export const TooltipLink = ({
  tooltip,
  className = '',
  children,
  to,
  ...props
}: TooltipButtonProps & { to: string }) => {
  const {
    buttonRef,
    tooltipRef,
    position,
    isVisible,
    tooltipStyle,
    arrowStyle,
    showTooltip,
    hideTooltip,
  } = useTooltip(tooltip);

  const linkClassName = `tooltip-button ${className}`.trim();

  return (
    <>
      <Link
        ref={buttonRef as React.RefObject<HTMLAnchorElement>}
        to={to}
        className={linkClassName}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        onClick={() => {
          hideTooltip();
        }}
        {...props}
      >
        {children}
      </Link>
      {tooltip &&
        isVisible &&
        createPortal(
          <div
            ref={tooltipRef}
            className={`tooltip tooltip-${position}`}
            style={tooltipStyle}
          >
            {tooltip}
            <span
              className="tooltip-arrow"
              style={arrowStyle}
            />
          </div>,
          document.body
        )}
    </>
  );
};


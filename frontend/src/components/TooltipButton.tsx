import { forwardRef } from 'react';
import { useTooltip } from '../hooks/useTooltip';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

type TooltipButtonProps = {
  tooltip?: string;
  className?: string;
  children: ReactNode;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'type' | 'className'>;

export const TooltipButton = forwardRef<HTMLButtonElement, TooltipButtonProps>(({
  tooltip,
  className = '',
  children,
  onClick,
  type = 'button',
  ...props
}, ref) => {
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

  const combinedRef = (node: HTMLButtonElement | null) => {
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
    if (buttonRef) {
      (buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
    }
  };

  const { 'aria-label': ariaLabelFromProps, ...restProps } = props;
  const ariaLabel = ariaLabelFromProps || tooltip;

  return (
    <>
      <button
        ref={combinedRef}
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
        aria-label={ariaLabel}
        {...restProps}
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
});

TooltipButton.displayName = 'TooltipButton';

type TooltipLinkProps = {
  tooltip?: string;
  className?: string;
  children: ReactNode;
  to: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'onClick' | 'className' | 'href'>;

export const TooltipLink = ({
  tooltip,
  className = '',
  children,
  to,
  ...props
}: TooltipLinkProps) => {
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


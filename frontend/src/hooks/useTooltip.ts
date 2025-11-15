import { useEffect, useRef, useState, useCallback } from 'react';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

const throttle = <T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

export const useTooltip = (tooltipText: string | undefined) => {
  const buttonRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<TooltipPosition>('top');
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({
    visibility: 'hidden',
  });
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  const rafRef = useRef<number | null>(null);

  const calculatePosition = useCallback(() => {
    if (!buttonRef.current || !tooltipRef.current || !tooltipText) return;

    const button = buttonRef.current;
    const computedStyle = window.getComputedStyle(button);
    
    if (
      computedStyle.display === 'none' ||
      computedStyle.visibility === 'hidden' ||
      computedStyle.opacity === '0'
    ) {
      setIsVisible(false);
      return;
    }

    const buttonRect = button.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const spacing = 8;
    const arrowSize = 4;

    const tooltipHeight = tooltipRect.height || 32;
    const tooltipWidth = tooltipRect.width || tooltipText.length * 7 + 20;

    const buttonCenterX = buttonRect.left + buttonRect.width / 2;
    const buttonCenterY = buttonRect.top + buttonRect.height / 2;

    let newPosition: TooltipPosition = 'top';
    let top = 0;
    let left = 0;
    let arrowLeft = '50%';
    let arrowTop = '';

    const spaceTop = buttonRect.top;
    const spaceBottom = viewportHeight - buttonRect.bottom;
    const spaceLeft = buttonRect.left;
    const spaceRight = viewportWidth - buttonRect.right;

    if (spaceTop >= tooltipHeight + spacing + arrowSize) {
      newPosition = 'top';
      top = buttonRect.top - tooltipHeight - spacing - arrowSize;
      left = buttonCenterX - tooltipWidth / 2;
    } else if (spaceBottom >= tooltipHeight + spacing + arrowSize) {
      newPosition = 'bottom';
      top = buttonRect.bottom + spacing + arrowSize;
      left = buttonCenterX - tooltipWidth / 2;
    } else if (spaceRight >= tooltipWidth + spacing + arrowSize) {
      newPosition = 'right';
      top = buttonCenterY - tooltipHeight / 2;
      left = buttonRect.right + spacing + arrowSize;
    } else if (spaceLeft >= tooltipWidth + spacing + arrowSize) {
      newPosition = 'left';
      top = buttonCenterY - tooltipHeight / 2;
      left = buttonRect.left - tooltipWidth - spacing - arrowSize;
    } else {
      newPosition = 'top';
      top = Math.max(spacing, buttonRect.top - tooltipHeight - spacing);
      left = buttonCenterX - tooltipWidth / 2;
    }

    left = Math.max(spacing, Math.min(left, viewportWidth - tooltipWidth - spacing));
    top = Math.max(spacing, Math.min(top, viewportHeight - tooltipHeight - spacing));

    if (newPosition === 'top' || newPosition === 'bottom') {
      const tooltipCenterX = left + tooltipWidth / 2;
      const offsetX = buttonCenterX - tooltipCenterX;
      const maxOffset = tooltipWidth / 2 - arrowSize - 4;
      const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, offsetX));
      arrowLeft = `calc(50% + ${clampedOffset}px)`;
    } else {
      const tooltipCenterY = top + tooltipHeight / 2;
      const offsetY = buttonCenterY - tooltipCenterY;
      const maxOffset = tooltipHeight / 2 - arrowSize - 4;
      const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, offsetY));
      arrowTop = `calc(50% + ${clampedOffset}px)`;
    }

    setPosition(newPosition);
    setTooltipStyle({
      top: `${top}px`,
      left: `${left}px`,
      visibility: 'visible',
      opacity: 1,
    });
    setArrowStyle({
      left: newPosition === 'top' || newPosition === 'bottom' ? arrowLeft : undefined,
      top: newPosition === 'left' || newPosition === 'right' ? arrowTop : undefined,
    });
  }, [tooltipText]);

  useEffect(() => {
    if (isVisible && tooltipText) {
      setTooltipStyle({
        visibility: 'hidden',
        opacity: 0,
        top: '0px',
        left: '0px',
      });

      const updatePosition = () => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
        rafRef.current = requestAnimationFrame(() => {
          calculatePosition();
        });
      };

      const timeout1 = setTimeout(updatePosition, 0);
      const timeout2 = setTimeout(updatePosition, 10);

      const throttledResize = throttle(() => {
        if (isVisible) {
          updatePosition();
        }
      }, 16);

      const throttledScroll = throttle(() => {
        if (isVisible) {
          updatePosition();
        }
      }, 16);

      window.addEventListener('resize', throttledResize);
      window.addEventListener('scroll', throttledScroll, true);

      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
        window.removeEventListener('resize', throttledResize);
        window.removeEventListener('scroll', throttledScroll, true);
      };
    } else {
      setTooltipStyle({ 
        visibility: 'hidden',
        opacity: 0,
      });
      setArrowStyle({});
    }
  }, [isVisible, tooltipText, calculatePosition]);

  const showTooltip = () => {
    if (tooltipText) {
      setIsVisible(true);
    }
  };

  const hideTooltip = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    if (!buttonRef.current) {
      if (isVisible) {
        setIsVisible(false);
      }
      return;
    }

    const checkVisibility = () => {
      if (!isVisible) return;
      
      if (!buttonRef.current) {
        setIsVisible(false);
        return;
      }

      const button = buttonRef.current;
      const rect = button.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(button);
      
      let parent = button.parentElement;
      while (parent) {
        const parentStyle = window.getComputedStyle(parent);
        if (
          parentStyle.display === 'none' ||
          parentStyle.visibility === 'hidden'
        ) {
          setIsVisible(false);
          return;
        }
        parent = parent.parentElement;
      }
      
      if (
        computedStyle.display === 'none' ||
        computedStyle.visibility === 'hidden' ||
        computedStyle.opacity === '0' ||
        rect.width === 0 ||
        rect.height === 0
      ) {
        setIsVisible(false);
      }
    };

    const observer = new MutationObserver(checkVisibility);
    const resizeObserver = new ResizeObserver(checkVisibility);

    if (buttonRef.current) {
      observer.observe(buttonRef.current, {
        attributes: true,
        attributeFilter: ['style', 'class'],
        childList: false,
        subtree: false,
      });
      resizeObserver.observe(buttonRef.current);
      
      let parent = buttonRef.current.parentElement;
      while (parent && parent !== document.body) {
        observer.observe(parent, {
          attributes: true,
          attributeFilter: ['style', 'class'],
          childList: true,
          subtree: false,
        });
        parent = parent.parentElement;
      }
    }

    checkVisibility();

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, [isVisible]);

  return {
    buttonRef,
    tooltipRef,
    position,
    isVisible,
    tooltipStyle,
    arrowStyle,
    showTooltip,
    hideTooltip,
    tooltipText,
  };
};


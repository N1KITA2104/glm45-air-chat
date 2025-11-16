import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

type Theme = 'light' | 'dark' | 'auto';

const getEffectiveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
};

const applyTheme = (theme: 'light' | 'dark') => {
  const root = document.documentElement;
  
  if (theme === 'light') {
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  } else {
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  }
};

const applyAccentColor = (color: string | undefined) => {
  const root = document.documentElement;
  const isLight = root.getAttribute('data-theme') === 'light';
  
  // Treat empty string as undefined (reset to default)
  const accentColor = color && color.trim() !== '' ? color : undefined;
  
  if (accentColor) {
    root.style.setProperty('--accent', accentColor);
    // Update related colors that depend on accent
    const rgb = hexToRgb(accentColor);
    if (rgb) {
      // Set RGB values as CSS variable for use in rgba()
      root.style.setProperty('--accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
      
      // Dark theme opacity values
      root.style.setProperty('--message-user-bg', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`);
      root.style.setProperty('--message-user-border', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`);
      root.style.setProperty('--blockquote-border', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`);
      
      // Light theme uses different opacity
      if (isLight) {
        root.style.setProperty('--message-user-bg', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`);
        root.style.setProperty('--message-user-border', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`);
        root.style.setProperty('--blockquote-border', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`);
      }
    }
  } else {
    // Reset to default (purple)
    root.style.removeProperty('--accent');
    root.style.setProperty('--accent-rgb', '108, 92, 231');
    root.style.removeProperty('--message-user-bg');
    root.style.removeProperty('--message-user-border');
    root.style.removeProperty('--blockquote-border');
  }
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

export const useTheme = () => {
  const user = useAuthStore((state) => state.user);
  const theme = (user?.settings?.theme || 'dark') as Theme;
  const accentColor = user?.settings?.accent_color;

  useEffect(() => {
    const effectiveTheme = getEffectiveTheme(theme);
    applyTheme(effectiveTheme);
    // Apply accent color after theme is set
    // Use double requestAnimationFrame to ensure theme is fully applied
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        applyAccentColor(accentColor);
      });
    });

    // Listen for system theme changes if theme is 'auto'
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            applyAccentColor(accentColor);
          });
        });
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, accentColor]);

  // Apply theme and accent color on initial mount (for localStorage hydration)
  useEffect(() => {
    // This effect runs once on mount to apply theme/color from localStorage
    const initialTheme = (user?.settings?.theme || 'dark') as Theme;
    const initialAccentColor = user?.settings?.accent_color;
    const effectiveTheme = getEffectiveTheme(initialTheme);
    applyTheme(effectiveTheme);
    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      applyAccentColor(initialAccentColor);
    }, 50);
    return () => clearTimeout(timeoutId);
  }, []); // Only run once on mount

  return theme;
};


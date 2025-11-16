import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { FormEvent } from 'react';

import { updateProfile } from '../../services/auth';
import { useAuthStore } from '../../store/authStore';
import type { UserSettings } from '../../types/api';
import { useTheme } from '../../hooks/useTheme';
import { CustomSelect, type SelectOption } from '../../components/CustomSelect';
import { ColorPicker, type ColorOption } from '../../components/ColorPicker';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/Toast';
import '../../styles/profile.css';

export const ProfilePage = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [displayName, setDisplayName] = useState(user?.display_name ?? '');
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const { toast, showToast, hideToast } = useToast();
  
  // Apply theme changes immediately
  useTheme();

  // Settings state - initialize from user settings or defaults
  const [settings, setSettings] = useState<UserSettings>(() => ({
    default_model: user?.settings?.default_model || 'z-ai/glm-4.5-air:free',
    default_temperature: user?.settings?.default_temperature ?? 0.7,
    theme: user?.settings?.theme || 'dark',
    auto_scroll: user?.settings?.auto_scroll ?? true,
    accent_color: user?.settings?.accent_color,
  }));

  const modelOptions: SelectOption[] = [
    { value: 'z-ai/glm-4.5-air:free', label: 'GLM 4.5 Air (Free)' },
    { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'openai/gpt-4o', label: 'GPT-4o' },
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'google/gemini-pro-1.5', label: 'Gemini Pro 1.5' },
  ];

  const themeOptions: SelectOption[] = [
    { value: 'dark', label: 'Dark' },
    { value: 'light', label: 'Light' },
    { value: 'auto', label: 'Auto (System)' },
  ];

  const accentColorOptions: ColorOption[] = [
    { value: '', name: 'Default (Purple)', color: '#6c5ce7' },
    { value: '#3b82f6', name: 'Blue', color: '#3b82f6' },
    { value: '#10b981', name: 'Green', color: '#10b981' },
    { value: '#f59e0b', name: 'Amber', color: '#f59e0b' },
    { value: '#ef4444', name: 'Red', color: '#ef4444' },
    { value: '#8b5cf6', name: 'Violet', color: '#8b5cf6' },
    { value: '#ec4899', name: 'Pink', color: '#ec4899' },
    { value: '#06b6d4', name: 'Cyan', color: '#06b6d4' },
  ];

  // Sync settings when user changes
  useEffect(() => {
    if (user?.settings) {
      setSettings((prev) => ({
        default_model: user.settings?.default_model || prev.default_model,
        default_temperature: user.settings?.default_temperature ?? prev.default_temperature,
        theme: user.settings?.theme || prev.theme,
        auto_scroll: user.settings?.auto_scroll ?? prev.auto_scroll,
        accent_color: user.settings?.accent_color ?? prev.accent_color,
      }));
    }
  }, [user?.settings]);

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async (updatedUser) => {
      setUser(updatedUser);
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      showToast('Settings saved successfully!', 'success');
    },
    onError: (error) => {
      console.error(error);
      showToast('Unable to save settings. Please try again.', 'error');
    },
  });

  if (!user) {
    return (
      <div className="profile-container">
        <p>You need to be signed in.</p>
        <Link to="/">Back to chats</Link>
      </div>
    );
  }

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate({ display_name: displayName });
  };

  const handleSettingsSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate({ settings });
  };

  const handleSettingChange = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: value };
      // Apply theme immediately if it's being changed
      if (key === 'theme' && user) {
        setUser({
          ...user,
          settings: { ...user.settings, ...newSettings },
        });
      }
      return newSettings;
    });
  };

  return (
    <div className="profile-container">
      <header>
        <h1>Profile & Settings</h1>
        <Link to="/">← Back to chats</Link>
      </header>

      <div className="profile-tabs">
        <button
          type="button"
          className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          type="button"
          className={`profile-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="profile-form">
          <div className="profile-settings-section">
            <h2>Profile Information</h2>
            
            <div className="profile-form-group">
              <label htmlFor="profile-email">Email</label>
              <input 
                id="profile-email" 
                type="email"
                value={user.email} 
                disabled 
              />
              <span className="profile-hint">Email cannot be changed</span>
            </div>

            <div className="profile-form-group">
              <label htmlFor="profile-display-name">Display name</label>
              <input
                id="profile-display-name"
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
                minLength={1}
                maxLength={255}
              />
            </div>
          </div>

          <button type="submit" disabled={mutation.isPending} className="profile-submit-btn">
            {mutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      )}

      {activeTab === 'settings' && (
        <form onSubmit={handleSettingsSubmit} className="profile-form">
          <div className="profile-settings-section">
            <h2>Chat Settings</h2>
            
            <div className="profile-form-group">
              <label htmlFor="settings-default-model">Default Model</label>
              <CustomSelect
                id="settings-default-model"
                value={settings.default_model || 'z-ai/glm-4.5-air:free'}
                onChange={(value) => handleSettingChange('default_model', value)}
                options={modelOptions}
              />
              <span className="profile-hint">Default model for new chats</span>
            </div>

            <div className="profile-form-group">
              <label htmlFor="settings-temperature">
                Default Temperature: {settings.default_temperature?.toFixed(1)}
              </label>
              <input
                id="settings-temperature"
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.default_temperature}
                onChange={(e) =>
                  handleSettingChange('default_temperature', parseFloat(e.target.value))
                }
              />
              <div className="profile-range-labels">
                <span>Focused</span>
                <span>Balanced</span>
                <span>Creative</span>
              </div>
              <span className="profile-hint">Controls randomness in responses (0.0 = deterministic, 2.0 = very creative)</span>
            </div>
          </div>

          <div className="profile-settings-section">
            <h2>Interface Settings</h2>

            <div className="profile-form-group">
              <label htmlFor="settings-theme">Theme</label>
              <CustomSelect
                id="settings-theme"
                value={settings.theme || 'dark'}
                onChange={(value) =>
                  handleSettingChange('theme', value as 'light' | 'dark' | 'auto')
                }
                options={themeOptions}
              />
              <span className="profile-hint">Interface color theme</span>
            </div>

            <div className="profile-form-group">
              <label htmlFor="settings-accent-color">Accent Color</label>
              <ColorPicker
                value={settings.accent_color || ''}
                onChange={(value) => {
                  const colorValue = value || undefined;
                  handleSettingChange('accent_color', colorValue);
                  // Apply immediately for preview
                  const root = document.documentElement;
                  if (colorValue) {
                    root.style.setProperty('--accent', colorValue);
                    const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colorValue);
                    if (rgb) {
                      const r = parseInt(rgb[1], 16);
                      const g = parseInt(rgb[2], 16);
                      const b = parseInt(rgb[3], 16);
                      root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
                      const isLight = root.getAttribute('data-theme') === 'light';
                      root.style.setProperty('--message-user-bg', `rgba(${r}, ${g}, ${b}, ${isLight ? 0.12 : 0.2})`);
                      root.style.setProperty('--message-user-border', `rgba(${r}, ${g}, ${b}, ${isLight ? 0.25 : 0.35})`);
                      root.style.setProperty('--blockquote-border', `rgba(${r}, ${g}, ${b}, ${isLight ? 0.5 : 0.6})`);
                    }
                  } else {
                    root.style.removeProperty('--accent');
                    root.style.setProperty('--accent-rgb', '108, 92, 231');
                    root.style.removeProperty('--message-user-bg');
                    root.style.removeProperty('--message-user-border');
                    root.style.removeProperty('--blockquote-border');
                  }
                }}
                options={accentColorOptions}
              />
              <span className="profile-hint">Primary color used for buttons, links, and highlights</span>
            </div>

            <div className="profile-form-group">
              <label className="profile-checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.auto_scroll ?? true}
                  onChange={(e) => handleSettingChange('auto_scroll', e.target.checked)}
                />
                <span>Auto-scroll to bottom when sending messages</span>
              </label>
            </div>
          </div>

          <button type="submit" disabled={mutation.isPending} className="profile-submit-btn">
            {mutation.isPending ? 'Saving…' : 'Save settings'}
          </button>
        </form>
      )}

      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={hideToast}
        />
      )}
    </div>
  );
};

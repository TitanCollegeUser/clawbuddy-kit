import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AiSettings {
  webhookSecret: string;
  webhookUrl: string;
  onboardingCompleted: boolean;
  themePreference: 'dark' | 'light';
  notificationPreferences: {
    email?: boolean;
    push?: boolean;
  };
}

interface AiSettingsContextType {
  settings: AiSettings;
  loading: boolean;
  updateTheme: (theme: 'dark' | 'light') => Promise<void>;
  updateNotifications: (prefs: { email?: boolean; push?: boolean }) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  regenerateWebhookSecret: () => Promise<string>;
  refetch: () => Promise<void>;
}

const defaultSettings: AiSettings = {
  webhookSecret: '',
  webhookUrl: '',
  onboardingCompleted: false,
  themePreference: 'dark',
  notificationPreferences: {},
};

const AiSettingsContext = createContext<AiSettingsContextType | undefined>(undefined);

export const AiSettingsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AiSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/report-webhook`;

  const fetchSettings = async () => {
    if (!user) {
      setSettings(defaultSettings);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('webhook_secret, onboarding_completed, theme_preference, notification_preferences')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching AI settings:', error);
        setSettings({ ...defaultSettings, webhookUrl });
      } else if (data) {
        setSettings({
          webhookSecret: data.webhook_secret || '',
          webhookUrl,
          onboardingCompleted: data.onboarding_completed || false,
          themePreference: (data.theme_preference as 'dark' | 'light') || 'dark',
          notificationPreferences: (data.notification_preferences as { email?: boolean; push?: boolean }) || {},
        });
      }
    } catch (err) {
      console.error('Error fetching AI settings:', err);
      setSettings({ ...defaultSettings, webhookUrl });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user]);


  const updateTheme = async (theme: 'dark' | 'light') => {
    if (!user) return;

    const { error } = await supabase
      .from('users')
      .update({ theme_preference: theme })
      .eq('id', user.id);

    if (error) throw error;
    setSettings((prev) => ({ ...prev, themePreference: theme }));
  };

  const updateNotifications = async (prefs: { email?: boolean; push?: boolean }) => {
    if (!user) return;

    const newPrefs = { ...settings.notificationPreferences, ...prefs };
    const { error } = await supabase
      .from('users')
      .update({ notification_preferences: newPrefs })
      .eq('id', user.id);

    if (error) throw error;
    setSettings((prev) => ({ ...prev, notificationPreferences: newPrefs }));
  };

  const completeOnboarding = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('users')
      .update({ onboarding_completed: true })
      .eq('id', user.id);

    if (error) throw error;
    setSettings((prev) => ({ ...prev, onboardingCompleted: true }));
  };

  const regenerateWebhookSecret = async (): Promise<string> => {
    if (!user) throw new Error('No user logged in');

    const newSecret = crypto.randomUUID();
    const { error } = await supabase
      .from('users')
      .update({ webhook_secret: newSecret })
      .eq('id', user.id);

    if (error) throw error;
    setSettings((prev) => ({ ...prev, webhookSecret: newSecret }));
    return newSecret;
  };

  return (
    <AiSettingsContext.Provider
      value={{
        settings,
        loading,
        updateTheme,
        updateNotifications,
        completeOnboarding,
        regenerateWebhookSecret,
        refetch: fetchSettings,
      }}
    >
      {children}
    </AiSettingsContext.Provider>
  );
};

export const useAiSettings = () => {
  const context = useContext(AiSettingsContext);
  if (context === undefined) {
    throw new Error('useAiSettings must be used within an AiSettingsProvider');
  }
  return context;
};

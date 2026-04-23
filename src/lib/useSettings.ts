import { useState, useEffect } from 'react';

export interface UserSettings {
  lyricSize: 'small' | 'medium' | 'large';
  lyricAlignment: 'left' | 'center' | 'right';
  brightness: number;
  backgroundBlur: number;
}

const defaultSettings: UserSettings = {
  lyricSize: 'medium',
  lyricAlignment: 'center',
  brightness: 100,
  backgroundBlur: 80,
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const item = window.localStorage.getItem('lyricSyncSettings');
      return item ? JSON.parse(item) : defaultSettings;
    } catch (error) {
      return defaultSettings;
    }
  });

  useEffect(() => {
    window.localStorage.setItem('lyricSyncSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return { settings, updateSetting };
}

import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface Settings {
  apiEndpoint: string;
  apiKey: string;
  liteModel: string;
  mainModel: string;
  cliCommandWindows: string;
  cliCommandMac: string;
  cliCommandLinux: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  isLoading: boolean;
}

const defaultSettings: Settings = {
  apiEndpoint: 'http://localhost:8317/v1/chat/completions',
  apiKey: '',
  liteModel: 'gemini-3-flash-preview',
  mainModel: 'gemini-3.1-pro-preview',
  cliCommandWindows: 'cli-proxy-api.exe --config "%USERPROFILE%\\Downloads\\config.yaml"',
  cliCommandMac: '/opt/homebrew/opt/cliproxyapi/bin/cliproxyapi --config "$HOME/Downloads/config.yaml"',
  cliCommandLinux: 'cli-proxy-api --config "$HOME/Downloads/config.yaml"',
};

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const API_URL = 'http://localhost:8080/api/settings';

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch settings on mount with auto-retry
  useEffect(() => {
    const fetchSettings = () => {
      fetch(API_URL)
        .then(res => {
          if (!res.ok) throw new Error('Network response was not ok');
          return res.json();
        })
        .then(data => {
          setSettings(data);
          setIsLoading(false);
        })
        .catch(() => { // <-- Removed 'err' here
          console.warn("Backend not ready, retrying settings in 1s...");
          setTimeout(fetchSettings, 1000); 
        });
    };

    fetchSettings();
  }, []);

  // Update settings in backend, then local state
  const updateSettings = async (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      
      if (response.ok) {
        const savedSettings = await response.json();
        setSettings(savedSettings);
      } else {
        console.error("Failed to save settings to backend.");
        setSettings(updated); // Optimistic fallback
      }
    } catch (err) {
      console.error("Error saving settings.", err);
      setSettings(updated); // Optimistic fallback
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
};
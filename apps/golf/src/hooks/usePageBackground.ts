import { useState, useEffect } from 'react';

interface BackgroundSettings {
  backgroundImage: string;
  opacity: number;
  overlay: number;
}

const DEFAULT_SETTINGS: BackgroundSettings = {
  backgroundImage: '/backgrounds/golf-course-sunrise.jpg',
  opacity: 0.15,
  overlay: 0.4
};

export function usePageBackground(pageKey: string): BackgroundSettings {
  const [settings, setSettings] = useState<BackgroundSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch(`/api/settings/page-background?page=${pageKey}`);
        if (response.ok) {
          const data = await response.json();
          if (data.backgroundImage || data.backgroundUrl) {
            const newSettings = {
              backgroundImage: data.backgroundImage || data.backgroundUrl,
              opacity: data.opacity ?? DEFAULT_SETTINGS.opacity,
              overlay: data.overlay ?? DEFAULT_SETTINGS.overlay
            };
            setSettings(newSettings);
          }
        }
      } catch (error) {
        // Silently use default settings
      }
    }

    fetchSettings();
  }, [pageKey]);

  return settings;
}

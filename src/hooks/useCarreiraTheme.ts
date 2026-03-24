import { useCallback, useEffect, useState } from 'react';

export type CarreiraTheme = 'dark-orange' | 'light-orange';

const STORAGE_KEY = 'carreira_theme';

function isCarreiraTheme(value: string | null): value is CarreiraTheme {
  return value === 'dark-orange' || value === 'light-orange';
}

export function useCarreiraTheme() {
  const [theme, setTheme] = useState<CarreiraTheme>('dark-orange');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    if (isCarreiraTheme(storedTheme)) {
      setTheme(storedTheme);
    }
  }, []);

  const updateTheme = useCallback((nextTheme: CarreiraTheme) => {
    setTheme(nextTheme);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    }
  }, []);

  const setDarkTheme = useCallback((isDark: boolean) => {
    updateTheme(isDark ? 'dark-orange' : 'light-orange');
  }, [updateTheme]);

  return {
    theme,
    isDarkTheme: theme === 'dark-orange',
    setTheme: updateTheme,
    setDarkTheme,
  };
}

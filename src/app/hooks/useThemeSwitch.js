import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

export const useThemeSwitch = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return {
    mounted,
    theme,
    toggleTheme
  };
}; 
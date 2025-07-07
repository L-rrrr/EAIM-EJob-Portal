import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check current theme on mount
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      const isDarkMode = JSON.parse(savedTheme);
      setIsDark(isDarkMode);
      document.documentElement.classList.toggle('dark', isDarkMode);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
      document.documentElement.classList.toggle('dark', prefersDark);
      localStorage.setItem('darkMode', JSON.stringify(prefersDark));
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('darkMode', JSON.stringify(newTheme));
  };

  return { isDark, toggleTheme };
};
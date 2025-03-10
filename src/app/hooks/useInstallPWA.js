'use client';

import { useState, useEffect } from 'react';

export function useInstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
    };
    
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const installPWA = async () => {
    if (!promptInstall) {
      return;
    }
    
    const result = await promptInstall.prompt();
    console.log('Install prompt result:', result);
    setPromptInstall(null);
  };

  return {
    supportsPWA,
    promptInstall,
    installPWA
  };
} 
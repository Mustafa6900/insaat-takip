'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export function useInstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // iOS kontrolü
    const ios = /iphone|ipad|ipod/.test(
      window.navigator.userAgent.toLowerCase()
    );
    setIsIOS(ios);

    const handler = (e) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
    };
    
    window.addEventListener('beforeinstallprompt', handler);

    // Safari'de PWA yüklü olup olmadığını kontrol et
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isInStandaloneMode) {
      setSupportsPWA(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const installPWA = async () => {
    if (!promptInstall) {
      if (isIOS) {
        toast.info('Safari\'de "Ana Ekrana Ekle" seçeneğini kullanarak uygulamayı yükleyebilirsiniz.', {
          autoClose: 5000
        });
      }
      return;
    }
    
    try {
      const result = await promptInstall.prompt();
      console.log('Install prompt result:', result);
      setPromptInstall(null);
      toast.success('Uygulama başarıyla yüklendi!');
    } catch (error) {
      console.error('PWA yükleme hatası:', error);
      toast.error('Uygulama yüklenirken bir hata oluştu.');
    }
  };

  return {
    supportsPWA,
    promptInstall,
    installPWA,
    isIOS
  };
} 
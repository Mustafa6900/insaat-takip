'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserAuth } from './context/AuthContext';
import { useTheme } from 'next-themes';
import { MdPlayArrow, MdDevices, MdBusiness, MdCode, MdFactory, MdCampaign, MdDownload } from 'react-icons/md';
import { useInstallPWA } from './hooks/useInstallPWA';

export default function Home() {
  const { user, googleSignIn } = UserAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const { supportsPWA, installPWA, isIOS } = useInstallPWA();

  useEffect(() => {
    if (user) {
      router.push('/projects');
    }
  }, [user, router]);

  useEffect(() => {
    const video = document.querySelector('video');
    if (video) {
      video.playbackRate = 1.5; // Videoyu 1.5x hızda oynat
    }
  }, []);

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br pt-14 shadow-lg from-indigo-600 via-blue-700 to-blue-800 dark:from-indigo-700 dark:via-blue-800 dark:to-blue-900">
        <div className="absolute inset-0 bg-grid-white/[0.2] bg-[size:16px_16px]" />
        <div className="relative container mx-auto px-6 py-16 flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 text-left lg:pr-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 animate-fadeInDown">
              İnşaat Projelerinizi Profesyonelce Yönetin
            </h1>
            <p className="text-lg text-blue-50 mb-8 animate-fadeInUp">
              Hakediş takibinden şantiye yönetimine, maliyet kontrolünden iş programına kadar tüm inşaat süreçlerinizi tek platformda yönetin. Türkiye&apos;nin önde gelen müteahhitleri tarafından tercih edilen yazılım çözümü.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={googleSignIn}
                className="flex items-center gap-2 bg-white text-blue-700 px-8 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
               Ücretsiz Deneyin
              </button>
            </div>
          </div>  
          <div className="lg:w-1/2 mt-12 lg:mt-0">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="aspect-video rounded-lg shadow-2xl overflow-hidden">
                <video 
                  className="w-full h-full object-cover"
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  style={{ transform: 'scale(1.01)', playbackRate: 2 }}
                >
                  <source src="/video/kilavuz.mp4" type="video/mp4" />
                  Tarayıcınız video oynatmayı desteklemiyor.
                </video>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-grow container mx-auto px-6 py-12">
        {/* Özellikler */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            İnşaat Yönetiminde Öne Çıkan Özellikler
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <MdPlayArrow className="w-6 h-6" />,
                title: "Hakediş Takibi",
                description: "Hakediş süreçlerinizi otomatikleştirin ve ödemeleri takip edin"
              },
              {
                icon: <MdDevices className="w-6 h-6" />,
                title: "Şantiye Yönetimi",
                description: "Saha operasyonlarını mobil cihazlardan anlık takip edin"
              },
              {
                icon: <MdBusiness className="w-6 h-6" />,
                title: "Maliyet Kontrolü",
                description: "Bütçe planlaması ve gerçek zamanlı maliyet analizi"
              },
              {
                icon: <MdFactory className="w-6 h-6" />,
                title: "İş Programı",
                description: "Detaylı iş programı ve süreç takibi yönetimi"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="text-blue-500 dark:text-blue-400 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* İnşaat Çözümleri */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Kapsamlı İnşaat Çözümleri
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: <MdBusiness className="w-8 h-8" />,
                title: "Konut Projeleri",
                description: "Konut projelerinizin tüm süreçlerini detaylı olarak yönetin. Daire satışlarından şantiye yönetimine kadar her aşamayı kontrol edin."
              },
              {
                icon: <MdFactory className="w-8 h-8" />,
                title: "Ticari İnşaatlar",
                description: "AVM, ofis ve endüstriyel yapı projelerinizi profesyonel araçlarla yönetin. Kiralama ve satış süreçlerini takip edin."
              },
              {
                icon: <MdCode className="w-8 h-8" />,
                title: "Altyapı Projeleri",
                description: "Yol, köprü ve altyapı projelerinizin iş programını oluşturun. İş makinesi ve ekipman yönetimini optimize edin."
              },
              {
                icon: <MdCampaign className="w-8 h-8" />,
                title: "Restorasyon Projeleri",
                description: "Tarihi yapı restorasyonlarında hassas süreç yönetimi. Özel malzeme takibi ve uzman ekip koordinasyonu."
              }
            ].map((sector, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="text-blue-500 dark:text-blue-400 mb-4">
                  {sector.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {sector.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {sector.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Mobil Uygulama */}
        <section className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Mobil Uygulamamızı İndirin
          </h2>
          <p className="text-blue-50 mb-6 max-w-2xl mx-auto">
            {isIOS 
              ? "Safari'de 'Ana Ekrana Ekle' seçeneğini kullanarak uygulamayı yükleyebilirsiniz."
              : supportsPWA 
                ? "Uygulamayı cihazınıza yükleyerek tam ekran deneyimi yaşayın."
                : "İş takip sistemimize mobil tarayıcınızdan erişebilirsiniz."}
          </p>
          <div className="flex justify-center gap-4">
            {isIOS ? (
              <div className="flex flex-col items-center gap-2 text-white">
                <MdDownload className="w-8 h-8 animate-bounce" />
                <p className="text-sm">Safari&apos;de açın ve &quot;Ana Ekrana Ekle&quot;ye dokunun</p>
              </div>
            ) : supportsPWA ? (
              <button 
                onClick={installPWA}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <MdDownload className="w-5 h-5" />
                Uygulamayı Yükle
              </button>
            ) : (
              <div className="text-white">
                <p>Bu tarayıcıda PWA desteği bulunmuyor.</p>
                <p className="text-sm mt-2">Chrome veya Safari kullanarak uygulamayı yükleyebilirsiniz.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            &copy; 2024 İş Takip Sistemi. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  );
}

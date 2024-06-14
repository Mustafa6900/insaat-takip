'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserAuth } from './context/AuthContext';

export default function Home() {
  const { user } = UserAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/projects');
    }
  }, [user, router]);

  if (user) {
    return null; // Kullanıcı varsa yönlendirildiği için herhangi bir içerik render edilmez
  }
  console.log(user);

  return (
    <div className="min-h-screen bg-gradient-to-t from-gray-50 to-gray-200 flex flex-col items-center justify-center relative overflow-hidden ">
      <main className="container   flex-grow p-12 flex flex-col items-center z-10 ">
        <section className="text-center mb-8 ">
          <h2 className="text-4xl font-bold text-white mb-4 animate-fade-in-down text-zinc-700">İş Takip Sistemi Nedir?</h2>
          <p className="text-white text-xl max-w-2xl mx-auto animate-fade-in-up text-zinc-600">
            İş takip sistemi, çeşitli sektörlerde projelerin ve görevlerin yönetimini ve takibini kolaylaştıran bir platformdur. Bu sistem, projeleri ve bu projeler altında oluşturulan iş kalemlerini ayrıntılı bir şekilde yönetmenize olanak tanır. Her iş kalemi için isim, telefon numarası, detay dosyaları, başlangıç ve bitiş tarihleri, toplam iş ücreti, yapılan ödemeler, ödeme taksitleri ve tarihleri, makbuz dosyaları gibi bilgileri ekleyebilirsiniz. Bu sayede projelerinizin her aşamasını ayrıntılı olarak izleyebilir ve yönetebilirsiniz.
          </p>
        </section>
        <section className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-4 animate-fade-in-down text-zinc-700">Özellikler</h2>
          <ul className="text-white text-xl list-disc list-inside animate-fade-in-up text-zinc-600">
            <li>Projeleri yönetme ve izleme</li>
            <li>İş kalemleri oluşturma ve detaylandırma</li>
            <li>PDF, fotoğraf ve AutoCAD dosyaları ekleme</li>
            <li>Bildiriler ve bildirimler</li>
          </ul>
        </section>
        <section className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-4 animate-fade-in-down text-zinc-700">Kullanım Alanları</h2>
          <div className="text-white text-xl max-w-2xl mx-auto animate-fade-in-up space-y-4 text-zinc-600">
            <p><strong>İnşaat Sektörü:</strong> Bir müteahhit, iş takip sistemi ile inşaat projelerindeki tüm iş kalemlerini yönetebilir. Örneğin, fayans döşeme işi için iş kalemi oluşturabilir, işin adını, sorumlu kişinin telefon numarasını, başlangıç ve bitiş tarihlerini, toplam ücreti ve ödeme bilgilerini sistemde takip edebilir. Ayrıca, makbuzları ve diğer önemli dosyaları ekleyerek her aşamayı kontrol altında tutabilir.</p>
            <p><strong>Yazılım Geliştirme:</strong> Yazılım geliştirme projelerinde, her bir görev için iş kalemleri oluşturulabilir. Geliştiriciler, testçiler ve proje yöneticileri için görevler atanabilir, başlangıç ve bitiş tarihleri belirlenebilir ve görev detayları takip edilebilir. İlgili kod dosyaları ve teknik dokümanlar sisteme eklenebilir.</p>
            <p><strong>Üretim ve İmalat:</strong> Üretim hattındaki görevlerin yönetimi iş takip sistemi ile daha kolay hale gelir. Her bir üretim süreci için iş kalemleri oluşturulabilir, makinelerin bakım tarihleri ve sorumlu personelin iletişim bilgileri eklenebilir. Üretim planları ve kalite kontrol raporları sistemde saklanabilir.</p>
            <p><strong>Pazarlama ve Satış:</strong> Pazarlama kampanyaları ve satış süreçleri için iş kalemleri oluşturulabilir. Kampanya detayları, sorumlu kişilerin iletişim bilgileri, başlangıç ve bitiş tarihleri, bütçe ve harcamalar izlenebilir. İlgili pazarlama materyalleri ve raporlar sisteme eklenebilir.</p>
          </div>
        </section>
        <section className="text-center">
          <h2 className="text-4xl font-bold text-white mb-4 animate-fade-in-down text-zinc-700">Ekran Görüntüleri</h2>
          <div className="flex justify-center space-x-4">
            <img src="/path-to-dashboard-image" alt="Dashboard" className="w-64 rounded-lg shadow-md transform hover:scale-105 transition duration-300" />
            <img src="/path-to-project-details-image" alt="Project Details" className="w-64 rounded-lg shadow-md transform hover:scale-105 transition duration-300" />
          </div>
        </section>
      </main>
      <footer className=" p-4 text-center z-10">
        <p className="text-gray-600">&copy; 2024 İş Takip Sistemi. Tüm hakları saklıdır.</p>
      </footer>

      <style jsx>{`
        @keyframes moveBackground {
          0% { transform: translate(0, 0); }
          50% { transform: translate(10px, 10px); }
          100% { transform: translate(0, 0); }
        }

        .animate-fade-in-down {
          animation: fadeInDown 1s ease-out forwards;
        }

        .animate-fade-in-up {
          animation: fadeInUp 1s ease-out forwards;
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1; 
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

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

  return (
    <div className="min-h-screen bg-gradient-to-t from-gray-50 to-gray-200 flex flex-col items-center justify-center relative overflow-hidden ">
      <main className="container   flex-grow flex flex-col items-center z-10 sm:p-1 sm:py-8 lg:py-12">
        <section className="text-center mb-8 ">
          <h2 className="lg:text-4xl font-extrabold	text-white mb-4 animate-fadeInDown text-zinc-700 sm:text-lg">İş Takip Sistemi Nedir?</h2>
          <p className="text-white font-extrabold lg:text-xl max-w-2xl mx-auto animate-fadeInUp text-zinc-500 sm:text-xs ">
            İş takip sistemi, çeşitli sektörlerde projelerin ve görevlerin yönetimini ve takibini kolaylaştıran bir platformdur. Bu sistem, projeleri ve bu projeler altında oluşturulan iş kalemlerini ayrıntılı bir şekilde yönetmenize olanak tanır. Her iş kalemi için isim, telefon numarası, detay dosyaları, başlangıç ve bitiş tarihleri, toplam iş ücreti, yapılan ödemeler, ödeme taksitleri ve tarihleri, makbuz dosyaları gibi bilgileri ekleyebilirsiniz. Bu sayede projelerinizin her aşamasını ayrıntılı olarak izleyebilir ve yönetebilirsiniz.
          </p>
        </section>
        <section className="text-center mb-8">
          <h2 className="lg:text-4xl font-extrabold	 text-white mb-4 animate-fadeInDown text-zinc-700 sm:text-lg">Özellikler</h2>
          <ul className="text-white font-extrabold lg:text-xl  list-inside animate-fadeInUp text-zinc-500 sm:text-xs">
            <li>Projeleri yönetme ve izleme</li>
            <li>İş kalemleri oluşturma ve detaylandırma</li>
            <li>PDF, fotoğraf ve AutoCAD dosyaları ekleme</li>
            <li>Bildiriler ve bildirimler</li>  
          </ul>
        </section>
        <section className="text-center mb-8">
          <h2 className="lg:text-4xl font-extrabold	 text-white mb-4 animate-fadeInDown text-zinc-700 sm:text-lg">Kullanım Alanları</h2>
          <div className="text-white font-extrabold lg:text-xl max-w-2xl mx-auto animate-fadeInUp space-y-4 text-zinc-500 sm:text-xs">
            <p><strong className='text-zinc-700'>İnşaat Sektörü:</strong> Bir müteahhit, iş takip sistemi ile inşaat projelerindeki tüm iş kalemlerini yönetebilir. Örneğin, fayans döşeme işi için iş kalemi oluşturabilir, işin adını, sorumlu kişinin telefon numarasını, başlangıç ve bitiş tarihlerini, toplam ücreti ve ödeme bilgilerini sistemde takip edebilir. Ayrıca, makbuzları ve diğer önemli dosyaları ekleyerek her aşamayı kontrol altında tutabilir.</p>
            <p><strong className='text-zinc-700'>Yazılım Geliştirme:</strong> Yazılım geliştirme projelerinde, her bir görev için iş kalemleri oluşturulabilir. Geliştiriciler, testçiler ve proje yöneticileri için görevler atanabilir, başlangıç ve bitiş tarihleri belirlenebilir ve görev detayları takip edilebilir. İlgili kod dosyaları ve teknik dokümanlar sisteme eklenebilir.</p>
            <p><strong className='text-zinc-700'>Üretim ve İmalat:</strong> Üretim hattındaki görevlerin yönetimi iş takip sistemi ile daha kolay hale gelir. Her bir üretim süreci için iş kalemleri oluşturulabilir, makinelerin bakım tarihleri ve sorumlu personelin iletişim bilgileri eklenebilir. Üretim planları ve kalite kontrol raporları sistemde saklanabilir.</p>
            <p><strong className='text-zinc-700'>Pazarlama ve Satış:</strong> Pazarlama kampanyaları ve satış süreçleri için iş kalemleri oluşturulabilir. Kampanya detayları, sorumlu kişilerin iletişim bilgileri, başlangıç ve bitiş tarihleri, bütçe ve harcamalar izlenebilir. İlgili pazarlama materyalleri ve raporlar sisteme eklenebilir.</p>
          </div>
        </section>
      </main>
      <footer className=" p-4 text-center z-10">
        <p className="text-gray-600 sm:text-xs sm:font-extrabold sm:text-gray-800 lg:text-lg ">&copy; 2024 İş Takip Sistemi. Tüm hakları saklıdır.</p>
      </footer>
    </div>
  );
}

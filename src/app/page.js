"use client";

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
    
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <main className="container mx-auto flex-grow p-4 flex flex-col items-center">
        <section className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">İş Takip Sistemi Nedir?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            İş takip sistemi, müteahhitlerin inşaat projelerindeki iş takibini kolaylaştıran bir platformdur. Projelerinizi ekleyebilir, her bir proje için iş kalemleri oluşturabilir ve bu iş kalemlerine detaylar, dosyalar ve bildirimler ekleyebilirsiniz.
          </p>
        </section>
        <section className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Özellikler</h2>
          <ul className="text-gray-600 list-disc list-inside">
            <li>Projeleri yönetme ve izleme</li>
            <li>İş kalemleri oluşturma ve detaylandırma</li>
            <li>PDF, fotoğraf ve AutoCAD dosyaları ekleme</li>
            <li>Bildiriler ve bildirimler</li>
          </ul>
        </section>
        <section className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Ekran Görüntüleri</h2>
          <div className="flex justify-center space-x-4">
            <img alt="Dashboard" className="w-64 rounded-lg shadow-md transform hover:scale-105 transition duration-300" />
            <img alt="Project Details" className="w-64 rounded-lg shadow-md transform hover:scale-105 transition duration-300" />
          </div>
        </section>
      </main>
      <footer className="bg-white shadow-md p-4 text-center">
        <p className="text-gray-600">&copy; 2024 İş Takip Sistemi. Tüm hakları saklıdır.</p>
      </footer>
    </div>
  );
}

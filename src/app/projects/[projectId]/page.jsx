"use client";

import { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';


const ProjectDetails = ({ params }) => {
  const { projectId } = params;
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(null);

  const router = useRouter();

  useEffect(() => {
    if (projectId) {
      const categoriesCollection = collection(db, 'categories');
      const q = query(categoriesCollection, where('projectId', '==', projectId));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const categoriesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategories(categoriesList);
      });
      return () => unsubscribe();
    }
  }, [projectId]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
        setCategories([]);
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleAddCategory = async () => {
    if (newCategory.trim() && newCategoryColor) {
      try {
        await addDoc(collection(db, 'categories'), { name: newCategory, color: newCategoryColor, projectId });
        setNewCategory('');
        setNewCategoryColor('');
        setIsModalOpen(false);
      } catch (error) {
        console.error('Error adding category:', error);
      }
    }
  };

  return (
    <div className="p-12">
      <h1 className="text-4xl font-bold mb-8">İnşaat Kalemleri</h1>
      <div className="grid grid-cols-3 gap-8 text-xl font-bold">
        {categories.map((category) => (
          <Link key={category.id} href={`/projects/${projectId}/${category.id}`}>
            <div
              className={`h-32 flex items-center justify-center bg-gray-500 ${category.color} rounded-lg shadow-lg hover:bg-teal-400 text-white transition-transform transform hover:scale-105 active:scale-95 cursor-pointer`}
            >
              {category.name}
            </div>
          </Link>
        ))}
        <button
          onClick={() => setIsModalOpen(true)}
          className="h-32 p-6 bg-gray-800 rounded-lg shadow-lg text-white flex items-center justify-center transition-transform transform hover:scale-105 hover:bg-teal-400 active:scale-95"
        >
          <span className="animate-pulse">+ Kategori Ekle</span>
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg">
            <h2 className="text-lg font-bold mb-4">Yeni Kategori Ekle</h2>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="border p-2 mb-4 w-full rounded-lg"
              placeholder="Kategori adı"
            />
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-bold mr-4">Renk Seç:</span>
              <div className="flex">
                <div className={`w-8 h-8 mr-2 bg-blue-500 rounded-full cursor-pointer ${newCategoryColor === "bg-blue-500" ? 'border border-black' : ''}`} onClick={() => setNewCategoryColor("bg-blue-500")}></div>
                <div className={`w-8 h-8 mr-2 bg-green-500 rounded-full cursor-pointer ${newCategoryColor === "bg-green-500" ? 'border border-black' : ''}`} onClick={() => setNewCategoryColor("bg-green-500")}></div>
                <div className={`w-8 h-8 mr-2 bg-red-500 rounded-full cursor-pointer ${newCategoryColor === "bg-red-500" ? 'border border-black' : ''}`} onClick={() => setNewCategoryColor("bg-red-500")}></div>
                <div className={`w-8 h-8 mr-2 bg-yellow-500 rounded-full cursor-pointer ${newCategoryColor === "bg-yellow-500" ? 'border border-black' : ''}`} onClick={() => setNewCategoryColor("bg-yellow-500")}></div>
                <div className={`w-8 h-8 mr-2 bg-indigo-500 rounded-full cursor-pointer ${newCategoryColor === "bg-indigo-500" ? 'border border-black' : ''}`} onClick={() => setNewCategoryColor("bg-indigo-500")}></div>
                <div className={`w-8 h-8 bg-purple-500 rounded-full cursor-pointer ${newCategoryColor === "bg-purple-500" ? 'border border-black' : ''}`} onClick={() => setNewCategoryColor("bg-purple-500")}></div>
              </div>
            </div>
            <button
              onClick={() => {
              if(!newCategory.trim() ) {
              alert('Kategori adı yazmadınız.');
              }else if(!newCategoryColor){
              alert('Renk seçmediniz.');
              }
              else{ handleAddCategory(); }
              }}
              className="bg-blue-500 text-white p-2 rounded-lg"
            >
              Ekle
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
              className="bg-gray-500 text-white p-2 rounded-lg ml-2"
            >
              İptal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;

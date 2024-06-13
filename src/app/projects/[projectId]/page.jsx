'use client';

import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import Link from 'next/link';

const ProjectDetails = ({params}) => {
    const { projectId } = params;
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  console.log(projectId,"projectId");

  useEffect(() => {
    if (projectId) {
      const fetchCategories = async () => {
        const categoriesCollection = collection(db, 'categories');
        const q = query(categoriesCollection, where('projectId', '==', projectId));
        const categoriesSnapshot = await getDocs(q);
        const categoriesList = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategories(categoriesList);
      };
      fetchCategories();
    }
  }, [projectId]);

  const handleAddCategory = async () => {
    if (newCategory.trim()) {
      try {
        await addDoc(collection(db, 'categories'), { name: newCategory, projectId });
        setNewCategory('');
        setIsModalOpen(false);
        fetchCategories(); // fetch categories again to update the list
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
          <Link key={category.id} href={`/project/${projectId}/${category.id}`}>
            <div
              className={`h-32 flex items-center justify-center ${category.color} rounded-lg shadow-lg hover:bg-teal-400 text-white transition-transform transform hover:scale-105 active:scale-95 cursor-pointer`}
            >
              {category.name}
            </div>
          </Link>
        ))}
        <button
          onClick={() => setIsModalOpen(true)}
          className="h-32 p-6 bg-gray-500 rounded-lg shadow-lg text-white flex items-center justify-center transition-transform transform hover:scale-105 hover:bg-teal-400 active:scale-95"
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
            <button
              onClick={handleAddCategory}
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

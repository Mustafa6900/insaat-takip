'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('');
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchProjects(user.uid);
      } else {
        setUser(null);
        setProjects([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchProjects = async (userId) => {
    try {
      const projectsCollection = collection(db, 'projects');
      const q = query(projectsCollection, where('userId', '==', userId));
      const projectsSnapshot = await getDocs(q);
      const projectsList = projectsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setProjects(projectsList);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleAddProject = async () => {
    if (newProjectName.trim() && newProjectColor && user) {
      try {
        await addDoc(collection(db, 'projects'), { name: newProjectName, color: newProjectColor, userId: user.uid });
        setNewProjectName('');
        setNewProjectColor('');
        setIsModalOpen(false);
        fetchProjects(user.uid);
      } catch (error) {
        console.error('Error adding project:', error);
      }
    }
  };

  return (
    <div className="p-12">
      <h1 className="text-4xl font-bold mb-8">Projeler</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 text-2xl font-bold">
        {projects.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`} className={`w-64 h-64 hover:bg-teal-400 flex items-center justify-center ${project.color} rounded-3xl shadow-lg text-white transition-transform transform hover:scale-105 active:scale-95`}>
            {project.name}
          </Link>
        ))}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-64 h-64 p-6 bg-gray-500 rounded-3xl shadow-lg text-white flex items-center justify-center transition-transform transform hover:scale-105 hover:bg-teal-400 active:scale-95"
        >
          <span className="animate-pulse">+ Proje Ekle</span>
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg m-6">
            <h2 className="text-xl font-bold mb-4">Yeni Proje Ekle</h2>
            <input
              type="text"
              placeholder="Proje Adı"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="border p-2 mb-4 w-full rounded-lg "
            />
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-bold mr-4">Renk Seç:</span>
              <div className="flex">
                <div className={`w-8 h-8 mr-2 bg-blue-500 rounded-full cursor-pointer ${newProjectColor === "bg-blue-500" ? 'border border-black' : ''}`} onClick={() => setNewProjectColor("bg-blue-500")}></div>
                <div className={`w-8 h-8 mr-2 bg-green-500 rounded-full cursor-pointer ${newProjectColor === "bg-green-500" ? 'border border-black' : ''}`} onClick={() => setNewProjectColor("bg-green-500")}></div>
                <div className={`w-8 h-8 mr-2 bg-red-500 rounded-full cursor-pointer ${newProjectColor === "bg-red-500" ? 'border border-black' : ''}`} onClick={() => setNewProjectColor("bg-red-500")}></div>
                <div className={`w-8 h-8 mr-2 bg-yellow-500 rounded-full cursor-pointer ${newProjectColor === "bg-yellow-500" ? 'border border-black' : ''}`} onClick={() => setNewProjectColor("bg-yellow-500")}></div>
                <div className={`w-8 h-8 mr-2 bg-indigo-500 rounded-full cursor-pointer ${newProjectColor === "bg-indigo-500" ? 'border border-black' : ''}`} onClick={() => setNewProjectColor("bg-indigo-500")}></div>
                <div className={`w-8 h-8 bg-purple-500 rounded-full cursor-pointer ${newProjectColor === "bg-purple-500" ? 'border border-black' : ''}`} onClick={() => setNewProjectColor("bg-purple-500")}></div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg mr-2"
              >
                İptal
              </button>
              <button
                onClick={handleAddProject}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;

"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MdUnarchive, MdDelete } from "react-icons/md";
import { useSidebar } from "../context/SidebarContext";
import { toast } from "react-toastify";

// Varsayılan tema ve diğer temaları ekleyelim
const defaultTheme = {
  id: "default",
  class: "bg-gradient-to-br from-blue-50 to-blue-100",
  name: "Varsayılan",
  description: "Sade ve modern",
  isLight: true,
};

const Archive = () => {
  const [archivedProjects, setArchivedProjects] = useState([]);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const { isSidebarOpen } = useSidebar();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchArchivedProjects(user.uid);
      } else {
        setUser(null);
        setArchivedProjects([]);
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchArchivedProjects = async (userId) => {
    try {
      const projectsCollection = collection(db, "projects");
      const q = query(
        projectsCollection,
        where("userId", "==", userId),
        where("isArchived", "==", true)
      );
      const projectsSnapshot = await getDocs(q);
      const projectsList = projectsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setArchivedProjects(projectsList);
    } catch (error) {
      console.error("Error fetching archived projects:", error);
    }
  };

  const handleUnarchiveProject = async (projectId) => {
    try {
      await updateDoc(doc(db, "projects", projectId), {
        isArchived: false,
        archivedAt: null,
      });
      fetchArchivedProjects(user.uid);
      toast.success("Proje arşivden çıkarıldı!");
    } catch (error) {
      console.error("Error unarchiving project:", error);
      toast.error("Proje arşivden çıkarılırken bir hata oluştu!");
    }
  };

  const handleDeleteProject = async () => {
    try {
      await deleteDoc(doc(db, "projects", selectedProjectId));
      setDeleteModalOpen(false);
      fetchArchivedProjects(user.uid);
      toast.success("Proje kalıcı olarak silindi!");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Proje silinirken bir hata oluştu!");
    }
  };

  // Renk kontrolü için yardımcı fonksiyon
  const isLightTheme = (gradient) => {
    if (gradient === defaultTheme.class) return true;
    const lightTheme = [...themes, defaultTheme].find(
      (theme) => theme.class === gradient
    );
    return lightTheme ? lightTheme.isLight : false;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div
        className={`transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "pl-64" : "pl-20"
        } w-full`}
      >
        <main className="pt-24 px-6 pb-6">
          <div className="max-w-[2000px] mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Arşiv
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Toplam {archivedProjects.length} arşivlenmiş proje
                </p>
              </div>
            </div>

            {/* Projects Grid */}
            <div
              className={`grid gap-6 ${
                isSidebarOpen
                  ? "grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                  : "grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
              }`}
            >
              {archivedProjects.map((project) => (
                <div key={project.id} className="group relative">
                  <Link
                    href={`/archive/${project.id}`}
                    className={`
                      block p-6 h-48 rounded-2xl
                      ${project.gradient || defaultTheme.class}
                      transform transition-all duration-200
                      hover:shadow-xl hover:scale-[1.02]
                      focus:outline-none focus:ring-2 focus:ring-black/25
                      relative overflow-hidden
                    `}
                  >
                    {/* Koyu gradient için overlay */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-t 
                      ${
                        project.gradient?.includes("from-blue-50") ||
                        project.gradient === defaultTheme.class
                          ? "from-black/5 via-black/0"
                          : "from-black/30 via-black/10"
                      } 
                      to-transparent`}
                    ></div>

                    <div className="h-full flex flex-col justify-between relative z-10">
                      <div>
                        <h3
                          className={`text-xl font-semibold break-words
                          ${
                            project.gradient?.includes("from-blue-50") ||
                            project.gradient === defaultTheme.class
                              ? "text-gray-800"
                              : "text-white"
                          }`}
                        >
                          {project.name}
                        </h3>
                        <p
                          className={`mt-2 text-sm font-medium
                          ${
                            project.gradient?.includes("from-blue-50") ||
                            project.gradient === defaultTheme.class
                              ? "text-gray-600"
                              : "text-white/80"
                          }`}
                        >
                          Arşivlenme: <br />
                          {new Date(project.archivedAt).toLocaleDateString(
                            "tr-TR"
                          )}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <span
                          className={`text-xs md:text-sm font-medium px-3 py-1 rounded-full
                          ${
                            project.gradient?.includes("from-blue-50") ||
                            project.gradient === defaultTheme.class
                              ? "bg-black/5 text-gray-700"
                              : "bg-white/10 text-white"
                          }`}
                        >
                          Projeyi Görüntüle
                        </span>
                        <span
                          className={`text-xs md:text-sm p-2 rounded-full backdrop-blur-sm
                          ${
                            project.gradient?.includes("from-blue-50") ||
                            project.gradient === defaultTheme.class
                              ? "bg-black/5 text-gray-700"
                              : "bg-white/20 text-white"
                          }`}
                        >
                          →
                        </span>
                      </div>
                    </div>
                  </Link>

                  <div
                    className="absolute top-3 right-3 flex flex-col space-y-2 
                    md:opacity-0 md:group-hover:opacity-100 opacity-100 
                    transition-all duration-200"
                  >
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUnarchiveProject(project.id);
                      }}
                      className={`p-2 rounded-full backdrop-blur-sm
                        ${
                          project.gradient?.includes("from-blue-50") ||
                          project.gradient === defaultTheme.class
                            ? "bg-black/5 text-gray-700 hover:bg-black/10"
                            : "bg-black/20 text-white hover:bg-black/30"
                        }`}
                      title="Arşivden Çıkar"
                    >
                      <MdUnarchive size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedProjectId(project.id);
                        setDeleteModalOpen(true);
                      }}
                      className={`p-2 rounded-full backdrop-blur-sm
                        ${
                          project.gradient?.includes("from-blue-50") ||
                          project.gradient === defaultTheme.class
                            ? "bg-black/5 text-gray-700 hover:bg-black/10"
                            : "bg-black/20 text-white hover:bg-black/30"
                        }`}
                      title="Kalıcı Olarak Sil"
                    >
                      <MdDelete size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-sm w-full mx-4">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                  Projeyi Kalıcı Olarak Sil
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Bu projeyi kalıcı olarak silmek istediğinizden emin misiniz?
                  Bu işlem geri alınamaz.
                </p>
              </div>
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-xl flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  İptal
                </button>
                <button
                  onClick={handleDeleteProject}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Kalıcı Olarak Sil
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Archive;

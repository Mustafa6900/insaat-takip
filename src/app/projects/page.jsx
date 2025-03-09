"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MdClose,
  MdMenu,
  MdDashboard,
  MdFolder,
  MdSettings,
  MdColorLens,
  MdArchive,
} from "react-icons/md";
import { useSidebar } from "../context/SidebarContext";
import { toast } from "react-toastify";
import { useTheme } from "next-themes";

const Projects = () => {
  const { theme } = useTheme();
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedGradient, setSelectedGradient] = useState("");
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState(null);
  const { isSidebarOpen } = useSidebar();
  const [colorEditModalOpen, setColorEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Önceden hazırlanmış temalar
  const themes = [
    {
      id: "modern-blue",
      class: "bg-gradient-to-br from-blue-600 to-indigo-700",
      name: "Modern Mavi",
      description: "Modern",
    },
    {
      id: "sunset",
      class: "bg-gradient-to-br from-orange-500 to-pink-500",
      name: "Gün Batımı",
      description: "Sıcak",
    },
    {
      id: "forest",
      class: "bg-gradient-to-br from-emerald-500 to-green-600",
      name: "Orman",
      description: "Huzurlu",
    },
    {
      id: "ocean",
      class: "bg-gradient-to-br from-cyan-500 to-blue-600",
      name: "Okyanus",
      description: "Ferah",
    },
    {
      id: "elegant-dark",
      class: "bg-gradient-to-br from-gray-700 to-gray-900",
      name: "Zarif Siyah",
      description: "Şık",
    },
  ];

  // Varsayılan tema
  const defaultTheme = {
    id: "default",
    class: "bg-gradient-to-br from-blue-50 to-blue-100",
    name: "Varsayılan",
    description: "Sade",
  };

  // Varsayılan inşaat kalemlerini güncelleyelim
  const defaultConstructionCategories = [
    {
      name: "Zemin ve Temel İşleri",
      color: "",
      masterName: "",
      phone: "",
      projectStartDate: "",
      endDate: "",
      totalJobCost: "",
      paymentMade: "",
      paymentStartDate: "",
      paymentInstallments: 0,
      gradient: defaultTheme.class,
      isLight: true,
    },
    {
      name: "Betonarme Karkas İmalatı",
      color: "",
      masterName: "",
      phone: "",
      projectStartDate: "",
      endDate: "",
      totalJobCost: "",
      paymentMade: "",
      paymentStartDate: "",
      paymentInstallments: 0,
      gradient: defaultTheme.class,
      isLight: true,
    },
    {
      name: "Mekanik Tesisat",
      color: "",
      masterName: "",
      phone: "",
      projectStartDate: "",
      endDate: "",
      totalJobCost: "",
      paymentMade: "",
      paymentStartDate: "",
      paymentInstallments: 0,
      gradient: defaultTheme.class,
      isLight: true,
    },
    {
      name: "Elektrik Tesisatı",
      color: "",
      masterName: "",
      phone: "",
      projectStartDate: "",
      endDate: "",
      totalJobCost: "",
      paymentMade: "",
      paymentStartDate: "",
      paymentInstallments: 0,
      gradient: defaultTheme.class,
      isLight: true,
    },
    {
      name: "İnce Yapı İşleri",
      color: "",
      masterName: "",
      phone: "",
      projectStartDate: "",
      endDate: "",
      totalJobCost: "",
      paymentMade: "",
      paymentStartDate: "",
      paymentInstallments: 0,
      gradient: defaultTheme.class,
      isLight: true,
    },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchProjects(user.uid);
      } else {
        setUser(null);
        setProjects([]);
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchProjects = async (userId) => {
    try {
      const projectsCollection = collection(db, "projects");
      const q = query(
        projectsCollection,
        where("userId", "==", userId),
        where("isArchived", "==", false)
      );
      const projectsSnapshot = await getDocs(q);
      const projectsList = projectsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setProjects(projectsList);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewProjectName("");
    setSelectedGradient("");
  };

  const handleOpenModal = () => {
    // Dark mode'da ise zarif siyah, light mode'da varsayılan tema seçili gelsin
    const defaultGradient =
      theme === "dark"
        ? themes.find((t) => t.id === "elegant-dark").class
        : defaultTheme.class;

    setSelectedGradient(defaultGradient);
    setIsModalOpen(true);
  };

  const handleAddProject = async () => {
    if (!newProjectName.trim()) {
      toast.error("Lütfen proje adı giriniz.");
      return;
    }

    setIsLoading(true);
    try {
      const projectRef = await addDoc(collection(db, "projects"), {
        name: newProjectName,
        gradient: selectedGradient || defaultTheme.class,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        isArchived: false,
      });

      const categoriesCollection = collection(db, "categories");

      // Dark mode'da varsayılan kategori teması
      const defaultCategoryGradient =
        theme === "dark"
          ? themes.find((t) => t.id === "elegant-dark").class
          : defaultTheme.class;

      // Varsayılan kategorileri ekle
      for (const category of defaultConstructionCategories) {
        await addDoc(categoriesCollection, {
          projectId: projectRef.id,
          name: category.name,
          color: "",
          masterName: "",
          phone: "",
          projectStartDate: "",
          endDate: "",
          totalJobCost: "",
          paymentMade: "",
          paymentStartDate: "",
          paymentInstallments: 0,
          createdAt: new Date().toISOString(),
          userId: user.uid,
          gradient: defaultCategoryGradient, // Dark/light mode'a göre tema
          isLight: theme !== "dark", // Dark mode'da false, light mode'da true
        });
      }

      handleCloseModal();
      fetchProjects(user.uid);
      toast.success("Proje başarıyla oluşturuldu!");
    } catch (error) {
      console.error("Error adding project:", error);
      toast.error("Proje oluşturulurken bir hata oluştu!");
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteModal = (projectId) => {
    setDeleteProjectId(projectId); // Set the project ID to delete
    setDeleteModalOpen(true); // Open delete modal
  };

  const handleArchiveProject = async () => {
    try {
      await updateDoc(doc(db, "projects", deleteProjectId), {
        isArchived: true,
        archivedAt: new Date().toISOString(),
      });
      setDeleteModalOpen(false);
      fetchProjects(user.uid);
      toast.success("Proje başarıyla arşivlendi!");
    } catch (error) {
      console.error("Error archiving project:", error);
      toast.error("Proje arşivlenirken bir hata oluştu!");
    }
  };

  const handleUpdateProjectColor = async () => {
    if (editingProject && selectedGradient) {
      try {
        await updateDoc(doc(db, "projects", editingProject.id), {
          gradient: selectedGradient,
        });
        setEditingProject(null);
        setSelectedGradient("");
        setColorEditModalOpen(false);
        toast.success("Proje rengi başarıyla güncellendi!");
      } catch (error) {
        console.error("Error updating project color:", error);
        toast.error("Proje rengi güncellenirken bir hata oluştu!");
      }
    }
  };

  const isLightTheme = (gradient) => {
    if (gradient === defaultTheme.class) return true;
    const lightTheme = [...themes, defaultTheme].find(
      (theme) => theme.class === gradient
    );
    return lightTheme ? lightTheme.isLight : false;
  };

  const handleOpenColorEditModal = (project) => {
    const defaultGradient =
      theme === "dark"
        ? themes.find((t) => t.id === "elegant-dark").class
        : defaultTheme.class;

    setEditingProject(project);
    setSelectedGradient(project.gradient || defaultGradient);
    setColorEditModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? "pl-64" : "pl-20"}
          w-full
        `}
      >
        <main className="pt-24 px-6 pb-6">
          <div className="max-w-[2000px] mx-auto">
            {/* Content Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="w-full md:w-auto mb-4 md:mb-0">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Projelerim
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Toplam {projects.length} proje
                </p>
              </div>
              <button
                onClick={handleOpenModal}
                className="w-full md:w-auto group inline-flex items-center justify-center px-6 py-3 rounded-xl 
                bg-gradient-to-br from-blue-500 to-blue-600 
                text-white transition-all duration-300 
                hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/25 
                active:scale-[0.98] relative overflow-hidden"
              >
                <span className="relative flex items-center text-white">
                  <span className="mr-2 text-lg font-bold">+</span>
                  <span className="font-medium">Yeni Proje</span>
                </span>
              </button>
            </div>

            {/* Projects Grid */}
            <div
              className={`
                grid gap-6
                grid-cols-1
                ${
                  isSidebarOpen
                    ? "md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                    : "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                }
              `}
            >
              {projects.map((project) => (
                <div key={project.id} className="group relative">
                  <Link
                    href={`/projects/${project.id}`}
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
                          {new Date(project.createdAt).toLocaleDateString(
                            "tr-TR"
                          )}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span
                          className={`text-sm font-medium px-3 py-1 rounded-full
                          ${
                            project.gradient?.includes("from-blue-50") ||
                            project.gradient === defaultTheme.class
                              ? "bg-black/5 text-gray-700"
                              : "bg-white/10 text-white"
                          }`}
                        >
                          Projeye Git
                        </span>
                        <span
                          className={`p-2 rounded-full backdrop-blur-sm
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
                        setDeleteProjectId(project.id);
                        setDeleteModalOpen(true);
                      }}
                      className={`p-2 rounded-full backdrop-blur-sm
                        ${
                          project.gradient?.includes("from-blue-50") ||
                          project.gradient === defaultTheme.class
                            ? "bg-black/5 text-gray-700 hover:bg-black/10"
                            : "bg-black/20 text-white hover:bg-black/30"
                        }`}
                      aria-label="Projeyi Arşivle"
                    >
                      <MdArchive size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleOpenColorEditModal(project);
                      }}
                      className={`p-2 rounded-full backdrop-blur-sm
                        ${
                          project.gradient?.includes("from-blue-50") ||
                          project.gradient === defaultTheme.class
                            ? "bg-black/5 text-gray-700 hover:bg-black/10"
                            : "bg-black/20 text-white hover:bg-black/30"
                        }`}
                      aria-label="Rengi Düzenle"
                    >
                      <MdColorLens size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Add Project Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Yeni Proje Oluştur
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Proje Adı
                    </label>
                    <input
                      type="text"
                      placeholder="Projenizin adını girin"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                        rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white 
                        focus:border-transparent bg-white dark:bg-gray-700 
                        text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Tema Seçin
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Varsayılan tema */}
                      <button
                        onClick={() => setSelectedGradient(defaultTheme.class)}
                        className={`
                          relative group p-4 rounded-xl border-2 
                          ${
                            selectedGradient === defaultTheme.class
                              ? "border-black"
                              : "border-transparent hover:border-gray-200"
                          }
                          transition-all duration-200
                        `}
                      >
                        <div
                          className={`h-16 rounded-lg ${defaultTheme.class} shadow-sm mb-2`}
                        />
                        <div className="text-left">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {defaultTheme.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {defaultTheme.description}
                          </p>
                        </div>
                        {selectedGradient === defaultTheme.class && (
                          <div className="absolute -top-2 -right-2 bg-black text-white p-1 rounded-full">
                            <MdClose size={16} className="rotate-45" />
                          </div>
                        )}
                      </button>

                      {themes.map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => setSelectedGradient(theme.class)}
                          className={`
                            relative group p-4 rounded-xl border-2 
                            ${
                              selectedGradient === theme.class
                                ? "border-black dark:border-white"
                                : "border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                            }
                            transition-all duration-200
                          `}
                        >
                          <div
                            className={`h-16 rounded-lg ${theme.class} shadow-sm mb-2`}
                          />
                          <div className="text-left">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {theme.name}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {theme.description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-xl flex justify-end space-x-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 
                    border border-gray-300 dark:border-gray-600 rounded-lg 
                    hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  İptal
                </button>
                <button
                  onClick={handleAddProject}
                  disabled={isLoading}
                  className={`px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg 
                    ${
                      isLoading
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-gray-800 dark:hover:bg-gray-100"
                    } 
                    transition-all duration-200`}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Oluşturuluyor...
                    </div>
                  ) : (
                    "Oluştur"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full mx-4">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                  Projeyi Arşivle
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Bu projeyi arşivlemek istediğinizden emin misiniz? Arşivlenen
                  projelere &quot;Arşiv&quot; sayfasından erişebilirsiniz.
                </p>
              </div>
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-xl flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 
                    border border-gray-300 dark:border-gray-600 rounded-lg 
                    hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  İptal
                </button>
                <button
                  onClick={handleArchiveProject}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Arşivle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Renk Düzenleme Modalı */}
        {colorEditModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Proje Rengini Düzenle
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Yeni Tema Seçin
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Varsayılan tema */}
                      <button
                        onClick={() => setSelectedGradient(defaultTheme.class)}
                        className={`
                          relative group p-4 rounded-xl border-2 
                          ${
                            selectedGradient === defaultTheme.class
                              ? "border-black"
                              : "border-transparent hover:border-gray-200"
                          }
                          transition-all duration-200
                        `}
                      >
                        <div
                          className={`h-16 rounded-lg ${defaultTheme.class} shadow-sm mb-2`}
                        />
                        <div className="text-left">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {defaultTheme.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {defaultTheme.description}
                          </p>
                        </div>
                      </button>

                      {/* Diğer temalar */}
                      {themes.map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => setSelectedGradient(theme.class)}
                          className={`
                            relative group p-4 rounded-xl border-2 
                            ${
                              selectedGradient === theme.class
                                ? "border-black dark:border-white"
                                : "border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                            }
                            transition-all duration-200
                          `}
                        >
                          <div
                            className={`h-16 rounded-lg ${theme.class} shadow-sm mb-2`}
                          />
                          <div className="text-left">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {theme.name}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {theme.description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-xl flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setColorEditModalOpen(false);
                    setEditingProject(null);
                    setSelectedGradient("");
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 
                    border border-gray-300 dark:border-gray-600 rounded-lg 
                    hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  İptal
                </button>
                <button
                  onClick={handleUpdateProjectColor}
                  className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg 
                    hover:bg-gray-800 dark:hover:bg-gray-100"
                >
                  Güncelle
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;

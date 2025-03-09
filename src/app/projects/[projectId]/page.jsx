"use client";

import { useState, useEffect } from "react";
import { db, auth, storage } from "../../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  MdAdd,
  MdClose,
  MdColorLens,
  MdEdit,
  MdInsertDriveFile,
  MdDownload,
  MdDescription,
  MdDelete,
} from "react-icons/md";
import { useSidebar } from "../../context/SidebarContext";
import { toast } from "react-toastify";
import { useTheme } from "next-themes";

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
  isLight: true,
};

const ProjectDetails = ({ params }) => {
  const { theme } = useTheme();
  const { projectId } = params;
  const [projectData, setProjectData] = useState({
    name: "",
    description: "",
    files: [],
  });
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [projectName, setProjectName] = useState("");
  const { isSidebarOpen } = useSidebar();
  const [isColorEditModalOpen, setIsColorEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteCategoryId, setDeleteCategoryId] = useState(null);
  const [categoryStats, setCategoryStats] = useState({});
  const [projectSummary, setProjectSummary] = useState({
    totalAmount: 0,
    remainingAmount: 0,
    nextPayments: [],
  });
  const [projectDescription, setProjectDescription] = useState("");
  const [projectFiles, setProjectFiles] = useState([]);
  const [isDescriptionEditing, setIsDescriptionEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const router = useRouter();

  // Proje verilerini tek seferde çekelim
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!projectId) return;

      const projectRef = doc(db, "projects", projectId);
      // Real-time updates için onSnapshot kullanalım
      const unsubscribe = onSnapshot(projectRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setProjectData({
            name: data.name || "",
            description: data.description || "",
            files: data.files || [],
          });
          setProjectName(data.name);
          setProjectDescription(data.description || "");
          setProjectFiles(data.files || []);
        }
      });

      return () => unsubscribe();
    };

    fetchProjectData();
  }, [projectId]);

  // Kategorileri ve istatistikleri birlikte çekelim
  useEffect(() => {
    if (!projectId) return;

    const categoriesCollection = collection(db, "categories");
    const q = query(categoriesCollection, where("projectId", "==", projectId));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const categoriesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(categoriesList);

      // Kategori istatistiklerini paralel olarak çekelim
      const statsPromises = categoriesList.map(async (category) => {
        const categoryRef = doc(db, "categories", category.id);
        const categorySnap = await getDoc(categoryRef);
        const categoryData = categorySnap.data();

        const totalAmount = parseFloat(categoryData.totalJobCost) || 0;
        const remainingAmount =
          categoryData.remainingAmount !== undefined
            ? parseFloat(categoryData.remainingAmount)
            : totalAmount;

        return [
          category.id,
          {
            nextInstallmentDate: null,
            nextInstallmentAmount: null,
            categoryName: category.name,
            totalAmount,
            remainingAmount,
            installments:
              categoryData.installmentDates?.map((date, index) => ({
                date: new Date(date),
                amount:
                  parseFloat(categoryData.installmentAmounts[index]) || null,
              })) || [],
          },
        ];
      });

      const statsResults = await Promise.all(statsPromises);
      const newStats = Object.fromEntries(statsResults);

      // Gelecek taksitleri hesapla
      const now = new Date();
      Object.values(newStats).forEach((stat) => {
        const futureInstallments = (stat.installments || [])
          .filter((item) => item.date > now && item.amount !== null)
          .sort((a, b) => a.date - b.date);

        if (futureInstallments.length > 0) {
          stat.nextInstallmentDate = futureInstallments[0].date;
          stat.nextInstallmentAmount = futureInstallments[0].amount;
        }
      });

      setCategoryStats(newStats);
    });

    return () => unsubscribe();
  }, [projectId]);

  // ProjectSummary'yi categoryStats değiştiğinde hesaplayalım
  useEffect(() => {
    const summary = {
      totalAmount: 0,
      remainingAmount: 0,
      nextPayments: [],
    };

    Object.values(categoryStats).forEach((stat) => {
      summary.totalAmount += stat.totalAmount;
      summary.remainingAmount += stat.remainingAmount;
      if (stat.nextInstallmentDate) {
        summary.nextPayments.push({
          date: stat.nextInstallmentDate,
          amount: stat.nextInstallmentAmount,
          categoryName: stat.categoryName,
        });
      }
    });

    summary.nextPayments.sort((a, b) => a.date - b.date);
    setProjectSummary(summary);
  }, [categoryStats]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
        setCategories([]);
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleAddCategory = async () => {
    if (!newCategory.trim() || !newCategoryColor) {
      toast.error("Lütfen kategori adı ve tema seçiniz.");
      return;
    }

    setIsLoading(true);
    try {
      const selectedTheme = [...themes, defaultTheme].find(
        (theme) => theme.class === newCategoryColor
      );

      await addDoc(collection(db, "categories"), {
        name: newCategory,
        gradient: newCategoryColor || defaultTheme.class,
        projectId,
        createdAt: new Date().toISOString(),
        isLight: selectedTheme ? selectedTheme.isLight : true,
      });

      setNewCategory("");
      setNewCategoryColor("");
      setIsModalOpen(false);
      toast.success("Kategori başarıyla oluşturuldu!");
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Kategori oluşturulurken bir hata oluştu!");
    } finally {
      setIsLoading(false);
    }
  };

  // Modal açıldığında varsayılan tema seçili gelsin
  const handleOpenModal = () => {
    // Dark mode'da ise zarif siyah, light mode'da varsayılan tema seçili gelsin
    const defaultGradient =
      theme === "dark"
        ? themes.find((t) => t.id === "elegant-dark").class
        : defaultTheme.class;

    setNewCategoryColor(defaultGradient);
    setIsModalOpen(true);
  };

  // Modal kapatma fonksiyonunu ayrı bir fonksiyon olarak tanımlayalım
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewCategory(""); // Kategori adını sıfırla
    setNewCategoryColor(""); // Seçili temayı sıfırla
  };

  // Kategori silme fonksiyonunu ekleyelim
  const handleDeleteCategory = async () => {
    try {
      await deleteDoc(doc(db, "categories", deleteCategoryId));
      setDeleteModalOpen(false);
      toast.success("Kategori başarıyla silindi!");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Kategori silinirken bir hata oluştu!");
    }
  };

  // Renk güncelleme fonksiyonu
  const handleUpdateColor = async () => {
    if (editingCategory && newCategoryColor) {
      try {
        await updateDoc(doc(db, "categories", editingCategory.id), {
          gradient: newCategoryColor,
        });
        setIsColorEditModalOpen(false);
        setEditingCategory(null);
        setNewCategoryColor("");
        toast.success("Kategori rengi başarıyla güncellendi!");
      } catch (error) {
        console.error("Error updating category color:", error);
        toast.error("Kategori rengi güncellenirken bir hata oluştu!");
      }
    }
  };

  // Kategori kartlarındaki renk kontrolünü güncelleyelim
  const isLightTheme = (gradient) => {
    if (gradient === defaultTheme.class) return true;
    const lightTheme = [...themes, defaultTheme].find(
      (theme) => theme.class === gradient
    );
    return lightTheme ? lightTheme.isLight : false;
  };

  // Para birimi formatı için yardımcı fonksiyon
  const formatCurrency = (amount) => {
    if (isNaN(amount) || amount === null || amount === undefined) return "0 TL";
    return (
      new Intl.NumberFormat("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount) + " TL"
    );
  };

  // Açıklama güncelleme fonksiyonu
  const handleUpdateDescription = async () => {
    try {
      await updateDoc(doc(db, "projects", projectId), {
        description: editedDescription,
      });
      setProjectDescription(editedDescription);
      setIsDescriptionEditing(false);
      toast.success("Proje açıklaması güncellendi!");
    } catch (error) {
      console.error("Error updating description:", error);
      toast.error("Açıklama güncellenirken bir hata oluştu!");
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        setIsUploading(true);
        const timestamp = new Date().getTime();
        const storageRef = ref(
          storage,
          `projects/${projectId}/files/${timestamp}_${file.name}`
        );

        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        const newFile = {
          name: file.name,
          url: downloadURL,
          path: storageRef.fullPath,
          uploadedAt: new Date().toISOString(),
          size: file.size,
        };

        const projectRef = doc(db, "projects", projectId);
        await updateDoc(projectRef, {
          files: [...projectFiles, newFile],
        });

        setProjectFiles([...projectFiles, newFile]);
        toast.success("Dosya başarıyla yüklendi!");
      } catch (error) {
        console.error("Error uploading file:", error);
        toast.error("Dosya yüklenirken bir hata oluştu!");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleFileDelete = async (file) => {
    try {
      // Storage'dan dosyayı sil
      const storageRef = ref(storage, file.path);
      await deleteObject(storageRef);

      // Firestore'dan dosyayı sil
      const updatedFiles = projectFiles.filter((f) => f.path !== file.path);
      const projectRef = doc(db, "projects", projectId);
      await updateDoc(projectRef, {
        files: updatedFiles,
      });

      setProjectFiles(updatedFiles);
      toast.success("Dosya başarıyla silindi!");
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Dosya silinirken bir hata oluştu!");
    }
  };

  // Dosya türünü belirlemek için yardımcı fonksiyon
  const getFileType = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();

    const imageTypes = ["jpg", "jpeg", "png", "gif", "webp"];
    const documentTypes = ["pdf", "doc", "docx", "xls", "xlsx", "txt"];

    if (imageTypes.includes(extension)) return "image";
    if (documentTypes.includes(extension)) return "document";
    return "other";
  };

  // Dosya önizleme/indirme fonksiyonu
  const handleFileAction = (file) => {
    const fileType = getFileType(file.name);

    if (fileType === "image") {
      // Resim dosyaları için modal aç
      setPreviewFile(file);
      setIsPreviewModalOpen(true);
    } else {
      // Diğer dosyalar için indirme işlemi başlat
      window.open(file.url, "_blank");
    }
  };

  return (
    <div
      className={`
      min-h-screen bg-gray-50 dark:bg-gray-900
      transition-all duration-300 ease-in-out
      ${isSidebarOpen ? "pl-64" : "pl-20"}
    `}
    >
      <main className="pt-24 px-4 sm:px-6 pb-6">
        <div className="space-y-6 max-w-[2000px] mx-auto">
          {/* Content Header */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            {/* Mobil görünüm (320-768px) */}
            <div className="md:hidden">
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {projectName}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Toplam {categories.length} kategori
                  </p>
                </div>

                <div className="flex flex-col gap-3 w-full">
                  <button
                    onClick={() => setIsDetailsModalOpen(true)}
                    className="flex items-center justify-center px-4 py-3 rounded-xl 
                      bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 
                      border border-gray-200 dark:border-gray-600
                      hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200
                      w-full"
                  >
                    <MdDescription className="mr-2" size={20} />
                    <span className="font-medium">Proje Detayları</span>
                  </button>
                  <button
                    onClick={handleOpenModal}
                    className="flex items-center justify-center px-4 py-3 rounded-xl 
                      bg-gradient-to-br from-blue-500 to-blue-600 
                      text-white transition-all duration-300 
                      hover:shadow-lg hover:shadow-blue-500/25 
                      active:scale-[0.98] relative overflow-hidden
                      w-full"
                  >
                    <MdAdd className="mr-2" size={20} />
                    <span className="font-medium">Yeni Kategori</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop görünüm (768px ve üzeri) */}
            <div className="hidden md:flex md:justify-between md:items-start gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {projectName}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Toplam {categories.length} kategori
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsDetailsModalOpen(true)}
                  className="group inline-flex items-center justify-center px-6 py-3 rounded-xl 
                    bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 
                    border border-gray-200 dark:border-gray-600
                    hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200"
                >
                  <MdDescription className="mr-2" size={20} />
                  <span className="font-medium">Proje Detayları</span>
                </button>
                <button
                  onClick={handleOpenModal}
                  className="group inline-flex items-center justify-center px-6 py-3 rounded-xl 
                    bg-gradient-to-br from-blue-500 to-blue-600 
                    text-white transition-all duration-300 
                    hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/25 
                    active:scale-[0.98] relative overflow-hidden"
                >
                  <MdAdd className="mr-2" size={20} />
                  <span className="font-medium">Yeni Kategori</span>
                </button>
              </div>
            </div>

            {/* Proje Özeti */}
            <div className="grid grid-cols-1 mt-6 md:grid-cols-3 gap-4 md:gap-6">
              {/* Toplam Tutar Kartı */}
              <div className="bg-gray-800 dark:bg-gray-700 p-6 rounded-xl">
                <h3 className="text-gray-400 dark:text-gray-300 text-sm font-medium">
                  Toplam Tutar
                </h3>
                <p className="mt-2 text-2xl font-bold text-white">
                  {formatCurrency(projectSummary.totalAmount)}
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  Ödenen:{" "}
                  {formatCurrency(
                    projectSummary.totalAmount - projectSummary.remainingAmount
                  )}
                </p>
              </div>

              {/* Kalan Tutar Kartı */}
              <div className="bg-gray-800 dark:bg-gray-700 p-6 rounded-xl">
                <h3 className="text-gray-400 dark:text-gray-300 text-sm font-medium">
                  Kalan Tutar
                </h3>
                <p className="mt-2 text-2xl font-bold text-white">
                  {formatCurrency(projectSummary.remainingAmount)}
                </p>
                <p className="mt-1 text-sm text-gray-400">Ödenmesi Gereken</p>
              </div>

              {/* Yaklaşan Ödemeler Kartı */}
              <div className="bg-gray-800 dark:bg-gray-700 p-6 rounded-xl">
                <h3 className="text-gray-400 dark:text-gray-300 text-sm font-medium">
                  Yaklaşan Ödemeler
                </h3>
                <div className="mt-2">
                  {projectSummary.nextPayments.length > 0 ? (
                    projectSummary.nextPayments
                      .slice(0, 2)
                      .map((payment, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-white"
                        >
                          <span className="text-sm">
                            {new Date(payment.date).toLocaleDateString("tr-TR")}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(payment.amount)}
                          </span>
                        </div>
                      ))
                  ) : (
                    <p className="text-gray-400 text-sm">Yaklaşan ödeme yok</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((category) => {
              const stats = categoryStats[category.id] || {};
              const isCompleted = stats.remainingAmount === 0;

              return (
                <div key={category.id} className="group relative">
                  <Link
                    href={`/projects/${projectId}/${category.id}`}
                    className={`
                      block p-4 sm:p-6 h-56 md:h-48 rounded-xl
                      ${category.gradient || defaultTheme.class}
                      transform transition-all duration-200
                      hover:shadow-xl hover:scale-[1.02]
                      focus:outline-none focus:ring-2 focus:ring-black/25
                      relative overflow-hidden
                    `}
                  >
                    <div className="flex flex-col h-full justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-col">
                          <h3
                            className={`text-lg sm:text-xl font-bold break-words
                            ${
                              category.gradient?.includes("from-blue-50") ||
                              category.gradient === defaultTheme.class
                                ? "text-gray-900"
                                : "text-white"
                            }
                          `}
                          >
                            {category.name}
                          </h3>
                        </div>

                        <div
                          className={`space-y-1
                          ${
                            category.gradient?.includes("from-blue-50") ||
                            category.gradient === defaultTheme.class
                              ? "text-gray-600"
                              : "text-white/80"
                          }
                        `}
                        >
                          <p className="text-sm">
                            Toplam Tutar: {formatCurrency(stats.totalAmount)}
                          </p>
                          <p
                            className={`text-sm ${
                              category.gradient?.includes("from-blue-50") ||
                              category.gradient === defaultTheme.class
                                ? isCompleted
                                  ? "text-emerald-600 font-medium"
                                  : "text-red-600"
                                : isCompleted
                                ? "text-emerald-300 font-medium"
                                : "text-red-300"
                            }`}
                          >
                            {isCompleted
                              ? "Ödeme Tamamlandı"
                              : `Kalan Tutar: ${formatCurrency(
                                  stats.remainingAmount
                                )}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <span
                          className={`text-sm font-medium px-3 py-1 rounded-full
                          ${
                            category.gradient?.includes("from-blue-50") ||
                            category.gradient === defaultTheme.class
                              ? "bg-black/5 text-gray-700"
                              : "bg-white/10 text-white"
                          }
                        `}
                        >
                          Detayları Gör
                        </span>
                        <span
                          className={`p-2 rounded-full backdrop-blur-sm
                          ${
                            category.gradient?.includes("from-blue-50") ||
                            category.gradient === defaultTheme.class
                              ? "bg-black/5 text-gray-700"
                              : "bg-white/20 text-white"
                          }
                        `}
                        >
                          →
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* İşlem butonları */}
                  <div
                    className={`
                    absolute top-3 right-3 flex flex-col space-y-2 
                    opacity-100 lg:opacity-0 lg:group-hover:opacity-100 
                    transition-opacity duration-200
                  `}
                  >
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setEditingCategory(category);
                        setNewCategoryColor(category.gradient);
                        setIsColorEditModalOpen(true);
                      }}
                      className={`p-2 rounded-full backdrop-blur-sm
                        ${
                          category.gradient?.includes("from-blue-50") ||
                          category.gradient === defaultTheme.class
                            ? "bg-black/5 text-gray-700 hover:bg-black/10"
                            : "bg-white/20 text-white hover:bg-white/30"
                        }
                      `}
                      title="Rengi Düzenle"
                    >
                      <MdColorLens size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setDeleteCategoryId(category.id);
                        setDeleteModalOpen(true);
                      }}
                      className={`p-2 rounded-full backdrop-blur-sm
                        ${
                          category.gradient?.includes("from-blue-50") ||
                          category.gradient === defaultTheme.class
                            ? "bg-black/5 text-gray-700 hover:bg-black/10"
                            : "bg-white/20 text-white hover:bg-white/30"
                        }
                      `}
                      title="Kategoriyi Sil"
                    >
                      <MdDelete size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Add Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Yeni Kategori Oluştur
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kategori Adı
                  </label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 
                      rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Kategori adı giriniz"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Tema Seçin
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Varsayılan tema */}
                    <button
                      onClick={() => setNewCategoryColor(defaultTheme.class)}
                      className={`
                        relative group p-4 rounded-xl border-2 
                        ${
                          newCategoryColor === defaultTheme.class
                            ? "border-black dark:border-white"
                            : "border-transparent hover:border-gray-200 dark:hover:border-gray-700"
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
                        onClick={() => setNewCategoryColor(theme.class)}
                        className={`
                          relative group p-4 rounded-xl border-2 
                          ${
                            newCategoryColor === theme.class
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
                  hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                İptal
              </button>
              <button
                onClick={handleAddCategory}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg 
                  hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Renk Düzenleme Modalı */}
      {isColorEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Kategori Rengini Düzenle
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Yeni Tema Seçin
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Varsayılan tema */}
                    <button
                      onClick={() => setNewCategoryColor(defaultTheme.class)}
                      className={`
                        relative group p-4 rounded-xl border-2 
                        ${
                          newCategoryColor === defaultTheme.class
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
                        onClick={() => setNewCategoryColor(theme.class)}
                        className={`
                          relative group p-4 rounded-xl border-2 
                          ${
                            newCategoryColor === theme.class
                              ? "border-black"
                              : "border-transparent hover:border-gray-200"
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
                  setIsColorEditModalOpen(false);
                  setEditingCategory(null);
                  setNewCategoryColor("");
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 
                  border border-gray-300 dark:border-gray-600 rounded-lg 
                  hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                İptal
              </button>
              <button
                onClick={handleUpdateColor}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg 
                  hover:bg-gray-800 dark:hover:bg-gray-200"
              >
                Güncelle
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
                Kategoriyi Sil
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Bu kategoriyi silmek istediğinizden emin misiniz? Bu işlem geri
                alınamaz.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-xl flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 
                  border border-gray-300 dark:border-gray-600 rounded-lg 
                  hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteCategory}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proje Detayları Modalı */}
      {isDetailsModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {projectName} - Proje Detayları
              </h2>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <MdClose size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-8">
                {/* Açıklama Bölümü */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Proje Açıklaması
                    </h3>
                    {!isDescriptionEditing && (
                      <button
                        onClick={() => {
                          setIsDescriptionEditing(true);
                          setEditedDescription(projectDescription);
                        }}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 flex items-center gap-1"
                      >
                        <MdEdit size={16} />
                        <span>Düzenle</span>
                      </button>
                    )}
                  </div>

                  {isDescriptionEditing ? (
                    <div className="space-y-3">
                      <textarea
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                        placeholder="Proje açıklaması ekleyin..."
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setIsDescriptionEditing(false)}
                          className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400"
                        >
                          İptal
                        </button>
                        <button
                          onClick={handleUpdateDescription}
                          className="px-3 py-1.5 text-sm bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200"
                        >
                          Kaydet
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">
                      {projectDescription || "Henüz bir açıklama eklenmemiş."}
                    </p>
                  )}
                </div>

                {/* Dosyalar Bölümü */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Proje Dosyaları
                    </h3>
                    <label className="relative cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                        disabled={isUploading}
                      />
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        {isUploading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700" />
                            <span>Yükleniyor...</span>
                          </>
                        ) : (
                          <>
                            <MdAdd size={16} />
                            <span>Dosya Ekle</span>
                          </>
                        )}
                      </div>
                    </label>
                  </div>

                  {projectFiles.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {projectFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg group hover:border-gray-300 dark:hover:border-gray-600"
                        >
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => handleFileAction(file)}
                          >
                            <div className="flex items-center gap-2">
                              <MdInsertDriveFile
                                className={`
                                  ${
                                    getFileType(file.name) === "image"
                                      ? "text-blue-500"
                                      : "text-gray-400"
                                  }
                                `}
                                size={20}
                              />
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {file.name}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(file.uploadedAt).toLocaleDateString(
                                "tr-TR"
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => window.open(file.url, "_blank")}
                              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700"
                              title="İndir"
                            >
                              <MdDownload size={18} />
                            </button>
                            <button
                              onClick={() => handleFileDelete(file)}
                              className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-600"
                              disabled={isUploading}
                              title="Sil"
                            >
                              <MdClose size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex justify-center mb-2">
                        <MdInsertDriveFile
                          className="text-gray-400"
                          size={24}
                        />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Henüz dosya yüklenmemiş
                      </p>
                      <label className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileSelect}
                          disabled={isUploading}
                        />
                        {isUploading ? "Yükleniyor..." : "Dosya Yükle"}
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resim Önizleme Modalı */}
      {isPreviewModalOpen && previewFile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-4xl">
            <button
              onClick={() => {
                setIsPreviewModalOpen(false);
                setPreviewFile(null);
              }}
              className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300"
            >
              <MdClose size={24} />
            </button>

            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
              <img
                src={previewFile.url}
                alt={previewFile.name}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {previewFile.name}
                </p>
                <button
                  onClick={() => window.open(previewFile.url, "_blank")}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200"
                >
                  <MdDownload size={16} />
                  <span>İndir</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;

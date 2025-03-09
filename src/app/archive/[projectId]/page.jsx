"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSidebar } from "../../context/SidebarContext";
import {
  MdInsertDriveFile,
  MdDownload,
  MdClose,
  MdFileDownload,
} from "react-icons/md";
import { useTheme } from "next-themes";

// Varsayılan tema
const defaultTheme = {
  id: "default",
  class: "bg-gradient-to-br from-blue-50 to-blue-100",
  name: "Varsayılan",
  description: "Sade ve modern",
  isLight: true,
};

const ArchivedProjectDetails = ({ params }) => {
  const { projectId } = params;
  const [projectData, setProjectData] = useState({
    name: "",
    description: "",
    files: [],
  });
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const { isSidebarOpen } = useSidebar();
  const [categoryStats, setCategoryStats] = useState({});
  const [projectSummary, setProjectSummary] = useState({
    totalAmount: 0,
    remainingAmount: 0,
    nextPayments: [],
  });
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const { theme } = useTheme();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Proje verilerini çek
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!projectId) return;

      const projectRef = doc(db, "projects", projectId);
      const projectSnap = await getDoc(projectRef);

      if (projectSnap.exists()) {
        const data = projectSnap.data();
        setProjectData({
          name: data.name || "",
          description: data.description || "",
          files: data.files || [],
          gradient: data.gradient || defaultTheme.class,
        });
      }
    };

    fetchProjectData();
  }, [projectId]);

  // Kategorileri ve istatistikleri çek
  useEffect(() => {
    const fetchCategories = async () => {
      if (!projectId) return;

      const categoriesCollection = collection(db, "categories");
      const q = query(
        categoriesCollection,
        where("projectId", "==", projectId)
      );
      const querySnapshot = await getDocs(q);

      const categoriesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(categoriesList);

      // Kategori istatistiklerini hesapla
      const stats = {};
      let totalAmount = 0;
      let remainingAmount = 0;
      const nextPayments = [];

      categoriesList.forEach((category) => {
        const total = parseFloat(category.totalJobCost) || 0;
        const remaining = parseFloat(category.remainingAmount) || 0;

        totalAmount += total;
        remainingAmount += remaining;

        if (category.installmentDates && category.installmentAmounts) {
          const now = new Date();
          category.installmentDates.forEach((date, index) => {
            const paymentDate = new Date(date);
            if (paymentDate > now && !category.installmentStatus[index]) {
              nextPayments.push({
                date: paymentDate,
                amount: category.installmentAmounts[index],
                categoryName: category.name,
              });
            }
          });
        }

        stats[category.id] = {
          totalAmount: total,
          remainingAmount: remaining,
          categoryName: category.name,
        };
      });

      setCategoryStats(stats);
      setProjectSummary({
        totalAmount,
        remainingAmount,
        nextPayments: nextPayments.sort((a, b) => a.date - b.date),
      });
    };

    fetchCategories();
  }, [projectId]);

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
      setPreviewFile(file);
      setIsPreviewModalOpen(true);
    } else {
      window.open(file.url, "_blank");
    }
  };

  // Excel export fonksiyonu
  const handleExportToExcel = () => {
    if (!projectData || !categories.length) return;

    let csvContent = [
      ["Proje Detaylari"],
      [""],
      ["Temel Bilgiler"],
      ["Proje Adi", projectData.name],
      ["Aciklama", projectData.description || "-"],
      ["Toplam Kategori", categories.length.toString()],
      ["Toplam Tutar", formatCurrency(projectSummary.totalAmount)],
      [
        "Odenen Tutar",
        formatCurrency(
          projectSummary.totalAmount - projectSummary.remainingAmount
        ),
      ],
      ["Kalan Tutar", formatCurrency(projectSummary.remainingAmount)],
      [""],
    ];

    // Proje dosyalarını ekle
    if (projectData.files?.length > 0) {
      csvContent.push(["Proje Dosyalari"]);
      csvContent.push(["Dosya Adi", "Dosya Linki"]);
      projectData.files.forEach((file) => {
        csvContent.push([file.name, file.url]);
      });
      csvContent.push([""]);
    }

    // Her kategori için detaylı bilgileri ekle
    categories.forEach((category, index) => {
      csvContent.push([`Kategori ${index + 1}: ${category.name}`]);
      csvContent.push(["Firma Adi", category.masterName || "-"]);
      csvContent.push(["Telefon", category.phone || "-"]);
      csvContent.push([
        "Baslangic Tarihi",
        category.projectStartDate
          ? new Date(category.projectStartDate).toLocaleDateString("tr-TR")
          : "-",
      ]);
      csvContent.push([
        "Bitis Tarihi",
        category.endDate
          ? new Date(category.endDate).toLocaleDateString("tr-TR")
          : "-",
      ]);
      csvContent.push([
        "Toplam Is Ucreti",
        formatCurrency(category.totalJobCost),
      ]);
      csvContent.push([
        "Baslangic Odemesi",
        formatCurrency(category.paymentMade),
      ]);
      csvContent.push([
        "Kalan Tutar",
        formatCurrency(category.remainingAmount),
      ]);

      // Kategori dosyalarını ekle
      if (category.files?.length > 0) {
        csvContent.push(["Dosyalar"]);
        csvContent.push(["Dosya Adi", "Dosya Linki"]);
        category.files.forEach((file) => {
          csvContent.push([file.name, file.url]);
        });
      }

      // Taksit bilgilerini ekle
      if (category.installmentDates?.length > 0) {
        csvContent.push(["Taksit Plani"]);
        csvContent.push(["Taksit No", "Tarih", "Tutar", "Durum", "Makbuz"]);
        category.installmentDates.forEach((date, i) => {
          csvContent.push([
            `Taksit ${i + 1}`,
            new Date(date).toLocaleDateString("tr-TR"),
            formatCurrency(category.installmentAmounts?.[i]),
            category.installmentStatus?.[i] ? "Odenildi" : "Odenmedi",
            category.receipts?.[i]?.url || "-",
          ]);
        });
      }

      csvContent.push([""]); // Kategoriler arası boşluk
    });

    // CSV formatına dönüştür
    const csvString = csvContent
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    // Dosyayı indir
    const blob = new Blob(["\ufeff" + csvString], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${projectData.name || "proje"}_rapor.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-all duration-300 ease-in-out ${
        isSidebarOpen ? "pl-64" : "pl-20"
      }`}
    >
      <main className="pt-24 px-6 pb-6">
        <div className="max-w-[2000px] mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {projectData.name}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Toplam {categories.length} kategori
              </p>
            </div>
            <button
              onClick={handleExportToExcel}
              className="group inline-flex items-center px-6 py-3 rounded-xl 
                bg-gradient-to-br from-green-500 to-green-600 
                text-white transition-all duration-300 
                hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/25 
                active:scale-[0.98]"
            >
              <span className="relative flex items-center">
                <MdFileDownload className="w-5 h-5 mr-2" />
                <span className="font-medium">Excel&apos;e Aktar</span>
              </span>
            </button>
          </div>

          {/* Proje Özeti */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Toplam Tutar
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(projectSummary.totalAmount)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Ödenen:{" "}
                {formatCurrency(
                  projectSummary.totalAmount - projectSummary.remainingAmount
                )}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Kalan Tutar
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(projectSummary.remainingAmount)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Ödenmesi Gereken
              </p>
            </div>
          </div>

          {/* Proje Detayları */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
              Proje Detayları
            </h3>
            <div className="space-y-6">
              {/* Açıklama */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Proje Açıklaması
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {projectData.description || "Henüz bir açıklama eklenmemiş."}
                </p>
              </div>

              {/* Proje Dosyaları */}
              {projectData.files?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Proje Dosyaları
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {projectData.files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg group hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
                      >
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => handleFileAction(file)}
                        >
                          <div className="flex items-center gap-2">
                            <MdInsertDriveFile
                              className={`${
                                getFileType(file.name) === "image"
                                  ? "text-blue-500"
                                  : "text-gray-400 dark:text-gray-500"
                              }`}
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => window.open(file.url, "_blank")}
                            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            title="İndir"
                          >
                            <MdDownload size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Kategoriler Grid */}
          <div
            className={`grid gap-6 ${
              isSidebarOpen
                ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
            }`}
          >
            {categories.map((category) => {
              const stats = categoryStats[category.id] || {};
              const isCompleted = stats.remainingAmount === 0;

              return (
                <Link
                  key={category.id}
                  href={`/archive/${projectId}/${category.id}`}
                  className={`
                    block p-6 h-48 rounded-2xl
                    ${category.gradient || defaultTheme.class}
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
                      category.gradient?.includes("from-blue-50") ||
                      category.gradient === defaultTheme.class
                        ? "from-black/5 via-black/0"
                        : "from-black/30 via-black/10"
                    } to-transparent`}
                  />

                  <div className="h-full flex flex-col justify-between relative z-10">
                    <div>
                      <h3
                        className={`text-xl font-semibold break-words
                        ${
                          category.gradient?.includes("from-blue-50") ||
                          category.gradient === defaultTheme.class
                            ? "text-gray-800"
                            : "text-white"
                        }`}
                      >
                        {category.name}
                      </h3>

                      <div
                        className={`mt-2 space-y-1
                        ${
                          category.gradient?.includes("from-blue-50") ||
                          category.gradient === defaultTheme.class
                            ? "text-gray-600"
                            : "text-white/80"
                        }`}
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
                        }`}
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
                        }`}
                      >
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      {/* Resim Önizleme Modalı */}
      {isPreviewModalOpen && previewFile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative w-full max-w-4xl mx-4">
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

export default ArchivedProjectDetails;

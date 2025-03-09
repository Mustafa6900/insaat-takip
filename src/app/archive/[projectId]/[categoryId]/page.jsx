"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useSidebar } from "../../../context/SidebarContext";
import { useTheme } from "next-themes";
import {
  MdInsertDriveFile,
  MdDownload,
  MdClose,
  MdFileDownload,
} from "react-icons/md";

const defaultTheme = {
  id: "default",
  class: "bg-gradient-to-br from-blue-50 to-blue-100",
  name: "Varsayılan",
  description: "Sade ve modern",
  isLight: true,
};

const ArchivedCategoryDetails = ({ params }) => {
  const { projectId, categoryId } = params;
  const [categoryData, setCategoryData] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const { isSidebarOpen } = useSidebar();
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

  useEffect(() => {
    const fetchCategoryDetails = async () => {
      if (!categoryId) return;

      const categoryRef = doc(db, "categories", categoryId);
      const categorySnap = await getDoc(categoryRef);

      if (categorySnap.exists()) {
        setCategoryData(categorySnap.data());
      }
    };

    fetchCategoryDetails();
  }, [categoryId]);

  const formatCurrency = (amount) => {
    if (!amount) return "0 TL";
    return (
      new Intl.NumberFormat("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount) + " TL"
    );
  };

  // Dosya türünü belirlemek için yardımcı fonksiyon
  const getFileType = (fileName) => {
    if (!fileName) return "other";
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
    if (!categoryData) return;

    // Temel bilgileri hazırla
    let csvContent = [
      ["Kategori Detaylari"],
      [""],
      ["Temel Bilgiler"],
      ["Firma Adi", categoryData.masterName || "-"],
      ["Telefon", categoryData.phone || "-"],
      [
        "Baslangic Tarihi",
        categoryData.projectStartDate
          ? new Date(categoryData.projectStartDate).toLocaleDateString("tr-TR")
          : "-",
      ],
      [
        "Bitis Tarihi",
        categoryData.endDate
          ? new Date(categoryData.endDate).toLocaleDateString("tr-TR")
          : "-",
      ],
      [""],
      ["Odeme Bilgileri"],
      ["Toplam Is Ucreti", formatCurrency(categoryData.totalJobCost)],
      ["Baslangic Odemesi", formatCurrency(categoryData.paymentMade)],
      ["Kalan Tutar", formatCurrency(categoryData.remainingAmount)],
      [""],
    ];

    // Proje dosyalarını ekle
    if (categoryData.files?.length > 0) {
      csvContent.push(["Proje Dosyalari"]);
      csvContent.push(["Dosya Adi", "Dosya Linki"]);
      categoryData.files.forEach((file) => {
        csvContent.push([file.name, file.url]);
      });
      csvContent.push([""]);
    }

    // Makbuzları ekle
    if (categoryData.receipts?.length > 0) {
      csvContent.push(["Makbuzlar"]);
      csvContent.push(["Taksit No", "Makbuz Adi", "Makbuz Linki"]);
      categoryData.receipts.forEach((receipt, index) => {
        if (receipt) {
          // Bazı taksitlerde makbuz olmayabilir
          csvContent.push([`Taksit ${index + 1}`, receipt.name, receipt.url]);
        }
      });
      csvContent.push([""]);
    }

    // Taksit bilgilerini ekle
    if (categoryData.installmentDates?.length > 0) {
      csvContent.push(["Taksit Plani"]);
      csvContent.push(["Taksit No", "Tarih", "Tutar", "Durum"]);
      categoryData.installmentDates.forEach((date, index) => {
        csvContent.push([
          `Taksit ${index + 1}`,
          new Date(date).toLocaleDateString("tr-TR"),
          formatCurrency(categoryData.installmentAmounts?.[index]),
          categoryData.installmentStatus?.[index] ? "Odenildi" : "Odenmedi",
        ]);
      });
    }

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
    link.setAttribute(
      "download",
      `${categoryData.name || "kategori"}_rapor.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!categoryData) {
    return null;
  }

  return (
    <div
      className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-all duration-300 ease-in-out ${
        isSidebarOpen ? "pl-64" : "pl-20"
      }`}
    >
      <main className="pt-24 px-6 pb-6 md:pt-20 sm:pt-20 sm:px-3">
        <div className="max-w-[2000px] mx-auto">
          {/* Header - Export butonu eklendi */}
          <div className="flex flex-col sm:flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white dark:bg-gray-800 p-6 sm:p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="mb-4 sm:mb-4 md:mb-0">
              <h2 className="text-2xl sm:text-xl font-bold text-gray-900 dark:text-white">
                {categoryData.name}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Kategori Detayları
              </p>
            </div>
            <button
              onClick={handleExportToExcel}
              className="group w-full sm:w-full md:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl 
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

          <div className="space-y-8">
            {/* Temel Bilgiler */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-4">
              <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
                Temel Bilgiler
              </h3>
              <div className="space-y-6">
                {/* Firma Bilgileri */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Firma Adı
                    </p>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {categoryData.masterName || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Telefon
                    </p>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {categoryData.phone || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Başlangıç Tarihi
                    </p>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {categoryData.projectStartDate
                        ? new Date(
                            categoryData.projectStartDate
                          ).toLocaleDateString("tr-TR")
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Bitiş Tarihi
                    </p>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {categoryData.endDate
                        ? new Date(categoryData.endDate).toLocaleDateString(
                            "tr-TR"
                          )
                        : "-"}
                    </p>
                  </div>
                </div>

                {/* Proje Dosyaları */}
                {categoryData.files?.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                      Proje Dosyaları
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-3">
                      {categoryData.files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center p-3 sm:p-2 border border-gray-200 dark:border-gray-700 rounded-lg group hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
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
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(file.url, "_blank");
                              }}
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

            {/* Ödeme Bilgileri */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-4">
              <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
                Ödeme Bilgileri
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-4">
                <div className="sm:mb-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Toplam İş Ücreti
                  </p>
                  <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(categoryData.totalJobCost)}
                  </p>
                </div>
                <div className="sm:mb-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Başlangıç Ödemesi
                  </p>
                  <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(categoryData.paymentMade)}
                  </p>
                </div>
                <div className="sm:mb-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Kalan Tutar
                  </p>
                  <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(categoryData.remainingAmount)}
                  </p>
                </div>
              </div>

              {/* Taksit Bilgileri */}
              {categoryData.paymentInstallments > 0 && (
                <div className="mt-8">
                  <h4 className="text-md font-semibold mb-4 text-gray-900 dark:text-white">
                    Taksit Planı
                  </h4>
                  <div className="overflow-x-auto -mx-4 sm:-mx-4">
                    <div className="inline-block min-w-full sm:px-4 align-middle">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-700">
                            <th className="px-4 py-3 sm:px-2 sm:py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                              Taksit No
                            </th>
                            <th className="px-4 py-3 sm:px-2 sm:py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                              Tarih
                            </th>
                            <th className="px-4 py-3 sm:px-2 sm:py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                              Tutar
                            </th>
                            <th className="px-4 py-3 sm:px-2 sm:py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                              Durum
                            </th>
                            <th className="px-4 py-3 sm:px-2 sm:py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                              Makbuz
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {categoryData.installmentDates?.map((date, index) => (
                            <tr
                              key={index}
                              className="border-t border-gray-200 dark:border-gray-700"
                            >
                              <td className="px-4 py-3 sm:px-2 sm:py-2 text-sm text-gray-900 dark:text-white">
                                {index + 1}
                              </td>
                              <td className="px-4 py-3 sm:px-2 sm:py-2 text-sm text-gray-900 dark:text-white">
                                {new Date(date).toLocaleDateString("tr-TR")}
                              </td>
                              <td className="px-4 py-3 sm:px-2 sm:py-2 text-sm text-gray-900 dark:text-white">
                                {formatCurrency(
                                  categoryData.installmentAmounts?.[index]
                                )}
                              </td>
                              <td className="px-4 py-3 sm:px-2 sm:py-2 text-sm">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    categoryData.installmentStatus?.[index]
                                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                  }`}
                                >
                                  {categoryData.installmentStatus?.[index]
                                    ? "Ödendi"
                                    : "Ödenmedi"}
                                </span>
                              </td>
                              <td className="px-4 py-3 sm:px-2 sm:py-2 text-sm">
                                {categoryData.receipts?.[index] && (
                                  <button
                                    onClick={() => {
                                      setPreviewFile(
                                        categoryData.receipts[index]
                                      );
                                      setIsPreviewModalOpen(true);
                                    }}
                                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                  >
                                    {categoryData.receipts[index].url.match(
                                      /\.(jpg|jpeg|png|gif|webp)$/i
                                    ) ? (
                                      <img
                                        src={categoryData.receipts[index].url}
                                        alt="Makbuz"
                                        className="w-10 h-10 sm:w-8 sm:h-8 object-cover rounded"
                                      />
                                    ) : (
                                      <div className="p-2 sm:p-1 bg-blue-50 dark:bg-blue-900 rounded">
                                        <svg
                                          className="w-6 h-6 sm:w-5 sm:h-5 text-blue-500 dark:text-blue-400"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                          />
                                        </svg>
                                      </div>
                                    )}
                                    <span className="text-sm sm:text-xs">
                                      Görüntüle
                                    </span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Resim Önizleme Modalı */}
      {isPreviewModalOpen && previewFile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative w-full max-w-4xl mx-4 sm:mx-2">
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
              <div className="p-4 sm:p-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate sm:max-w-[60%]">
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

export default ArchivedCategoryDetails;

"use client";
import { useState, useEffect, useCallback } from "react";
import { db, auth } from "@/app/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-toastify";
import {
  MdDelete,
  MdArchive,
  MdReceipt,
  MdClose,
  MdDownload,
  MdHourglassEmpty,
} from "react-icons/md";
import { useTheme } from "next-themes";

// Silme onay modalı için yeni bileşen
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, isArchive }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">
          {isArchive ? "İşlemi Arşivle" : "İşlemi Sil"}
        </h3>
        <p className="text-gray-600 mb-6">
          {isArchive
            ? "Bu işlemi arşivlemek istediğinizden emin misiniz?"
            : "Bu işlemi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."}
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-lg ${
              isArchive
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {isArchive ? "Arşivle" : "Sil"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function TransactionList() {
  const { theme } = useTheme();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
    type: "all",
    dateRange: "month",
    archived: false,
  });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isArchiveMode, setIsArchiveMode] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState(null);

  const formatCurrency = (amount) => {
    if (!amount) return "0 TL";
    return (
      new Intl.NumberFormat("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount) + " TL"
    );
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      console.log("Kullanıcı oturum açmamış");
      return;
    }

    setLoading(true);
    try {
      const transactionsRef = collection(db, "transactions");
      const conditions = [where("userId", "==", user.uid)];

      // Arşiv filtresi
      if (filters.archived) {
        conditions.push(where("isArchived", "==", true));
      } else {
        conditions.push(where("isArchived", "in", [false, null]));
      }

      // İşlem türü filtresi
      if (filters.type !== "all") {
        conditions.push(where("type", "==", filters.type));
      }

      const q = query(transactionsRef, ...conditions, limit(10));
      const querySnapshot = await getDocs(q);
      let fetchedTransactions = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Tarih filtresi (client-side)
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today);
      thisWeek.setDate(today.getDate() - today.getDay());
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      if (filters.dateRange !== "all") {
        fetchedTransactions = fetchedTransactions.filter((transaction) => {
          const transactionDate = new Date(transaction.date);
          switch (filters.dateRange) {
            case "today":
              return transactionDate >= today;
            case "week":
              return transactionDate >= thisWeek;
            case "month":
              return transactionDate >= thisMonth;
            default:
              return true;
          }
        });
      }

      // Tarihe göre sırala
      fetchedTransactions.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setTransactions(fetchedTransactions);
    } catch (error) {
      console.error("İşlemler yüklenirken hata:", error);
      if (error.code === "permission-denied") {
        toast.error("Erişim izni hatası: Lütfen oturumunuzu kontrol edin");
      } else {
        toast.error("İşlemler yüklenemedi: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [user, filters]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, filters, fetchTransactions]);

  // İşlem silme fonksiyonu
  const handleDelete = async (transaction) => {
    setSelectedTransaction(transaction);
    setIsArchiveMode(false);
    setIsDeleteModalOpen(true);
  };

  // İşlem arşivleme fonksiyonu
  const handleArchive = async (transaction) => {
    setSelectedTransaction(transaction);
    setIsArchiveMode(true);
    setIsDeleteModalOpen(true);
  };

  // Onay sonrası işlem
  const handleConfirmAction = async () => {
    if (!selectedTransaction) return;

    try {
      const transactionRef = doc(db, "transactions", selectedTransaction.id);

      if (isArchiveMode) {
        // Arşivleme işlemi
        await updateDoc(transactionRef, {
          isArchived: true,
          archivedAt: new Date().toISOString(),
        });
        toast.success("İşlem başarıyla arşivlendi!");
      } else {
        // Silme işlemi
        await deleteDoc(transactionRef);
        toast.success("İşlem başarıyla silindi!");
      }

      // Listeyi güncelle
      setTransactions(
        transactions.filter((t) => t.id !== selectedTransaction.id)
      );
    } catch (error) {
      console.error("İşlem hatası:", error);
      toast.error(
        `İşlem ${isArchiveMode ? "arşivlenemedi" : "silinemedi"}: ${
          error.message
        }`
      );
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedTransaction(null);
    }
  };

  // Makbuz önizleme fonksiyonu
  const handleReceiptPreview = (files) => {
    if (Array.isArray(files)) {
      setPreviewReceipt(files);
    } else {
      setPreviewReceipt([{ url: files.url, name: files.name }]);
    }
    setIsPreviewModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <MdHourglassEmpty className="w-8 h-8 mx-auto text-gray-400 animate-spin" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            İşlemler yükleniyor...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtre Seçenekleri */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center gap-3 p-4">
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="w-full md:w-auto px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="all">Tüm İşlemler</option>
            <option value="income">Gelirler</option>
            <option value="expense">Giderler</option>
          </select>

          <select
            value={filters.dateRange}
            onChange={(e) =>
              setFilters({ ...filters, dateRange: e.target.value })
            }
            className="w-full md:w-auto px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="all">Tüm Tarihler</option>
            <option value="today">Bugün</option>
            <option value="week">Bu Hafta</option>
            <option value="month">Bu Ay</option>
          </select>

          <select
            value={filters.archived ? "archived" : "active"}
            onChange={(e) =>
              setFilters({
                ...filters,
                archived: e.target.value === "archived",
              })
            }
            className="w-full md:w-auto px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="active">Aktif İşlemler</option>
            <option value="archived">Arşivlenen İşlemler</option>
          </select>
        </div>
      </div>

      {/* İşlem Listesi */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {/* Mobil Görünümü (768px'e kadar) */}
        <div className="block md:hidden">
          {transactions.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-gray-500 dark:text-gray-400">
                Henüz işlem kaydı bulunmuyor
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {new Date(transaction.date).toLocaleDateString("tr-TR")}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        transaction.type === "income"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {transaction.type === "income" ? "Gelir" : "Gider"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {transaction.category}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        transaction.type === "income"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => handleDelete(transaction)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <MdDelete className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Masaüstü Görünümü (768px ve üzeri) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  TARİH
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  İŞLEM TÜRÜ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  KATEGORİ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  TUTAR
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  İŞLEMLER
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(transaction.date).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.type === "income"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {transaction.type === "income" ? "Gelir" : "Gider"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {transaction.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span
                      className={
                        transaction.type === "income"
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDelete(transaction)}
                        className="text-red-600 hover:text-red-800"
                        title="Sil"
                      >
                        <MdDelete className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sayfalama */}
      <div className="flex justify-between items-center px-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Toplam {transactions.length} işlem gösteriliyor
        </p>
      </div>

      {/* Silme/Arşivleme Onay Modalı */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedTransaction(null);
        }}
        onConfirm={handleConfirmAction}
        isArchive={isArchiveMode}
      />

      {/* Makbuz Önizleme Modalı */}
      {isPreviewModalOpen && previewReceipt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative w-full max-w-4xl mx-4">
            <button
              onClick={() => {
                setIsPreviewModalOpen(false);
                setPreviewReceipt(null);
              }}
              className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300"
            >
              <MdClose size={24} />
            </button>

            <div className="bg-white rounded-lg overflow-hidden">
              <div className="max-h-[80vh] overflow-y-auto p-4">
                {Array.isArray(previewReceipt) ? (
                  previewReceipt.map((file, index) => (
                    <div key={index} className="mb-6 last:mb-0">
                      <div className="bg-gray-50 p-2 mb-2 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-900">
                          {file.name}
                        </h3>
                      </div>
                      {file.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-auto max-h-[60vh] object-contain rounded-lg shadow-lg"
                        />
                      ) : (
                        <div className="w-full h-[60vh] rounded-lg overflow-hidden shadow-lg">
                          <iframe
                            src={file.url}
                            title={file.name}
                            className="w-full h-full"
                          />
                        </div>
                      )}
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => window.open(file.url, "_blank")}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-black text-white rounded-lg hover:bg-gray-800"
                        >
                          <MdDownload size={16} />
                          <span>İndir</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div>
                    <div className="bg-gray-50 p-2 mb-2 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900">
                        {previewReceipt.name}
                      </h3>
                    </div>
                    {previewReceipt.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img
                        src={previewReceipt.url}
                        alt={previewReceipt.name}
                        className="w-full h-auto max-h-[60vh] object-contain rounded-lg shadow-lg"
                      />
                    ) : (
                      <div className="w-full h-[60vh] rounded-lg overflow-hidden shadow-lg">
                        <iframe
                          src={previewReceipt.url}
                          title={previewReceipt.name}
                          className="w-full h-full"
                        />
                      </div>
                    )}
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={() =>
                          window.open(previewReceipt.url, "_blank")
                        }
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-black text-white rounded-lg hover:bg-gray-800"
                      >
                        <MdDownload size={16} />
                        <span>İndir</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

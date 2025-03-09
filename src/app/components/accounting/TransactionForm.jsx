"use client";
import { useState, useEffect } from "react";
import {
  MdAttachMoney,
  MdReceipt,
  MdInsertDriveFile,
  MdDownload,
  MdClose,
} from "react-icons/md";
import { db, storage, auth } from "@/app/firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "react-toastify";
import { onAuthStateChanged } from "firebase/auth";
import { useTheme } from "next-themes";

export default function TransactionForm() {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "expense",
    category: "",
    description: "",
    amount: "",
    paymentMethod: "cash",
    receipt: null,
  });

  const [isLoading, setIsLoading] = useState(false);

  const [user, setUser] = useState(null);

  const [files, setFiles] = useState([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const categories = {
    income: [
      "Nakit Tahsilat",
      "Havale/EFT",
      "Çek Tahsilatı",
      "Senet Tahsilatı",
      "Diğer Gelirler",
    ],
    expense: [
      "Personel Giderleri",
      "Kira Giderleri",
      "Vergi Ödemeleri",
      "SGK Ödemeleri",
      "Elektrik/Su/Doğalgaz",
      "Malzeme Alımı",
      "Diğer Giderler",
    ],
  };

  const paymentMethods = [
    { id: "cash", label: "Nakit" },
    { id: "bank", label: "Havale/EFT" },
    { id: "check", label: "Çek" },
    { id: "credit", label: "Kredi Kartı" },
  ];

  // Para birimi formatlama fonksiyonu
  const formatCurrency = (value) => {
    if (!value) return "0 TL";
    return `${parseFloat(value).toLocaleString("tr-TR", {
      minimumFractionDigits: 0,
    })} TL`;
  };

  // String'den sayıya çevirme fonksiyonu
  const parseCurrency = (value) => {
    if (!value) return 0;
    return parseInt(value.toString().replace(/[^\d]/g, "")) || 0;
  };

  // Tutarı işleyen fonksiyon
  const handleAmountChange = (e) => {
    const input = e.target;
    const selectionStart = input.selectionStart;
    let value = input.value.replace(/[^\d]/g, "");

    // Backspace ile silme işlemi için
    if (
      e.nativeEvent.inputType === "deleteContentBackward" &&
      selectionStart > 0
    ) {
      value = value.slice(0, -1);
    }

    // Boş veya 0 kontrolü
    if (!value || parseInt(value) === 0) {
      setFormData({ ...formData, amount: "0 TL" });
      return;
    }

    // Sayıyı formatla
    const formattedValue =
      new Intl.NumberFormat("tr-TR").format(parseInt(value)) + " TL";
    setFormData({ ...formData, amount: formattedValue });

    // Cursor pozisyonunu ayarla (TL yazısından önce)
    setTimeout(() => {
      const newCursorPos = formattedValue.length - 3; // " TL" uzunluğu kadar geri
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
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

  // Dosya yükleme fonksiyonu
  const handleFileUpload = async (e) => {
    setIsLoading(true);
    try {
      const uploadedFiles = [];
      for (let file of e.target.files) {
        const storageRef = ref(
          storage,
          `transactions/${user.uid}/${Date.now()}_${file.name}`
        );
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        uploadedFiles.push({
          name: file.name,
          url,
          uploadedAt: new Date().toISOString(),
        });
      }
      setFiles([...files, ...uploadedFiles]);
      toast.success("Dosyalar başarıyla yüklendi!");
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Dosyalar yüklenirken bir hata oluştu!");
    } finally {
      setIsLoading(false);
    }
  };

  // Dosya silme fonksiyonu
  const handleFileDelete = async (fileToDelete) => {
    try {
      const updatedFiles = files.filter(
        (file) => file.url !== fileToDelete.url
      );
      setFiles(updatedFiles);
      toast.success("Dosya başarıyla silindi!");
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Dosya silinirken bir hata oluştu!");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Bu işlemi gerçekleştirmek için giriş yapmalısınız!");
      return;
    }

    if (!formData.category) {
      toast.warning("Lütfen bir kategori seçin!");
      return;
    }

    if (!formData.amount || parseCurrency(formData.amount) === 0) {
      toast.warning("Lütfen geçerli bir tutar girin!");
      return;
    }

    setIsLoading(true);

    try {
      let receiptUrl = null;
      if (formData.receipt) {
        const storageRef = ref(
          storage,
          `receipts/${user.uid}/${Date.now()}_${formData.receipt.name}`
        );
        await uploadBytes(storageRef, formData.receipt);
        receiptUrl = await getDownloadURL(storageRef);
      }

      const transactionData = {
        ...formData,
        amount: parseCurrency(formData.amount),
        createdAt: new Date().toISOString(),
        userId: user.uid,
        userName: user.email,
        isArchived: false,
        archivedAt: null,
        files: files,
        receiptUrl: receiptUrl,
        receiptName: formData.receipt?.name || null,
      };

      const transactionsRef = collection(db, "transactions");
      await addDoc(transactionsRef, transactionData);

      // Form sıfırlama
      setFormData({
        date: new Date().toISOString().split("T")[0],
        type: "expense",
        category: "",
        description: "",
        amount: "",
        paymentMethod: "cash",
        receipt: null,
      });
      setFiles([]);

      toast.success(
        `${
          formData.type === "income" ? "Gelir" : "Gider"
        } kaydı başarıyla oluşturuldu!`
      );
    } catch (error) {
      console.error("İşlem kaydedilirken hata:", error);
      toast.error("İşlem kaydedilemedi: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tarih
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            İşlem Türü
          </label>
          <div className="relative flex items-center p-1 border border-gray-200 rounded-lg w-48">
            <div
              className={`absolute h-8 transition-all duration-200 ease-in-out rounded-lg ${
                formData.type === "income"
                  ? "left-1 w-[calc(50%-4px)] bg-gradient-to-r from-green-400 to-emerald-500"
                  : "left-[calc(50%+2px)] w-[calc(50%-4px)] bg-gradient-to-r from-rose-500 to-red-500"
              }`}
            />
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: "income" })}
              className={`relative z-10 flex-1 px-4 py-1.5 text-center text-sm font-medium transition-colors duration-200 ${
                formData.type === "income"
                  ? "text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Gelir
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: "expense" })}
              className={`relative z-10 flex-1 px-4 py-1.5 text-center text-sm font-medium transition-colors duration-200 ${
                formData.type === "expense"
                  ? "text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Gider
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kategori
          </label>
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          >
            <option value="">Kategori Seçiniz</option>
            {categories[formData.type].map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tutar
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.amount}
              onChange={handleAmountChange}
              onKeyDown={(e) => {
                // Sadece sayılar, backspace ve delete tuşlarına izin ver
                if (
                  !/[\d\b]/.test(e.key) &&
                  e.key !== "Backspace" &&
                  e.key !== "Delete" &&
                  !e.ctrlKey // Ctrl+A gibi kombinasyonlara izin ver
                ) {
                  e.preventDefault();
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="0 TL"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Ödeme Yöntemi
          </label>
          <select
            value={formData.paymentMethod}
            onChange={(e) =>
              setFormData({ ...formData, paymentMethod: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          >
            {paymentMethods.map((method) => (
              <option key={method.id} value={method.id}>
                {method.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Açıklama
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="İşlem açıklaması giriniz"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-200 dark:border-gray-700 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">İşlem Dosyaları</h3>
          <label className="relative cursor-pointer">
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              disabled={isLoading}
            />
            <div className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                  <span>Yükleniyor...</span>
                </>
              ) : (
                <>
                  <MdInsertDriveFile size={16} />
                  <span>Dosya Ekle</span>
                </>
              )}
            </div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors duration-200"
            >
              <div
                className="flex items-center space-x-3 min-w-0 cursor-pointer"
                onClick={() => handleFileAction(file)}
              >
                <div className="p-2 bg-white rounded-lg">
                  {getFileType(file.name) === "image" ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-8 h-8 object-cover rounded"
                    />
                  ) : (
                    <MdInsertDriveFile className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(file.uploadedAt).toLocaleDateString("tr-TR")}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.open(file.url, "_blank")}
                  className="p-1 text-gray-500 hover:text-gray-700"
                  title="İndir"
                >
                  <MdDownload size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => handleFileDelete(file)}
                  className="p-1 text-gray-500 hover:text-red-600"
                  disabled={isLoading}
                  title="Sil"
                >
                  <MdClose size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {files.length === 0 && (
          <div className="text-center py-8 px-4 border-2 border-dashed border-gray-200 rounded-lg">
            <MdInsertDriveFile className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              Henüz dosya yüklenmemiş
            </p>
            <label className="mt-2 text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
                disabled={isLoading}
              />
              {isLoading ? "Yükleniyor..." : "Dosya Yükle"}
            </label>
          </div>
        )}
      </div>

      <div className="flex justify-end mt-6">
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg 
            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
            focus:ring-blue-500 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600
            ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
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
              Kaydediliyor...
            </div>
          ) : (
            "İşlemi Kaydet"
          )}
        </button>
      </div>

      {isPreviewModalOpen && previewFile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative w-full max-w-4xl mx-4">
            <button
              type="button"
              onClick={() => {
                setIsPreviewModalOpen(false);
                setPreviewFile(null);
              }}
              className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300"
            >
              <MdClose size={24} />
            </button>

            <div className="bg-white rounded-lg overflow-hidden">
              <img
                src={previewFile.url}
                alt={previewFile.name}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">
                  {previewFile.name}
                </p>
                <button
                  type="button"
                  onClick={() => window.open(previewFile.url, "_blank")}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-black text-white rounded-lg hover:bg-gray-800"
                >
                  <MdDownload size={16} />
                  <span>İndir</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

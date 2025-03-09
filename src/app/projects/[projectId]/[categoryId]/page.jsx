"use client";

import { useState, useEffect } from "react";
import { db, uploadFile, auth } from "../../../firebase";
import { doc, getDoc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { MdClose, MdAdd, MdInsertDriveFile, MdDownload } from "react-icons/md";
import { toast } from "react-toastify";
import { useSidebar } from "../../../context/SidebarContext";
import { useTheme } from "next-themes";

const CategoryDetails = ({ params }) => {
  const { projectId, categoryId } = params;
  const [categoryName, setCategoryName] = useState("");
  const [masterName, setmasterName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [remainingAmount, setRemainingAmount] = useState("");
  const [files, setFiles] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [projectStartDate, setProjectStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalJobCost, setTotalJobCost] = useState("");
  const [paymentMade, setPaymentMade] = useState("");
  const [paymentInstallments, setPaymentInstallments] = useState(0);
  const [installmentDates, setInstallmentDates] = useState([]);
  const [installmentStatus, setInstallmentStatus] = useState([]);
  const [installmentAmounts, setInstallmentAmounts] = useState([]);
  const [paymentStartDate, setPaymentStartDate] = useState("");
  const [isEditable, setIsEditable] = useState(true);

  const router = useRouter();
  const [user, setUser] = useState(null);
  //  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Değişiklikleri takip etmek için yeni state'ler ekleyelim
  const [hasChanges, setHasChanges] = useState(false);
  const [initialData, setInitialData] = useState(null);

  // Yeni state'ler ekleyelim
  const [isLoading, setIsLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInstallmentIndex, setSelectedInstallmentIndex] =
    useState(null);

  // Yeni state ekleyelim
  const [isEditing, setIsEditing] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  // useSidebar hook'unu ekleyelim
  const { isSidebarOpen } = useSidebar();

  // State'e eklenecek
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  // useTheme hook'unu ekleyelim
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
      const categoryRef = doc(db, "categories", categoryId);
      const categorySnap = await getDoc(categoryRef);

      if (categorySnap.exists()) {
        const categoryData = categorySnap.data();
        setCategoryName(categoryData.name || "");
        setmasterName(categoryData.masterName || "");
        setPhoneNumber(categoryData.phone || "");
        setFiles(categoryData.files || []);
        setReceipts(categoryData.receipts || []);
        setProjectStartDate(categoryData.projectStartDate || "");
        setEndDate(categoryData.endDate || "");
        setTotalJobCost(categoryData.totalJobCost || "");
        setPaymentMade(categoryData.paymentMade || "");
        setPaymentInstallments(categoryData.paymentInstallments || 0);
        setRemainingAmount(formatCurrency(categoryData.remainingAmount));
        setPaymentStartDate(categoryData.paymentStartDate || "");
        setInstallmentDates(
          categoryData.installmentDates
            ? categoryData.installmentDates.map((date) => new Date(date))
            : []
        );
        setInstallmentStatus(
          categoryData.installmentStatus ||
            Array(categoryData.paymentInstallments).fill(false)
        );
        setInstallmentAmounts(categoryData.installmentAmounts || []);
        setIsEditable(!categoryData.isEditable);

        // İlk veriyi saklayalım
        setInitialData(categoryData);
      }
    };

    if (categoryId) {
      fetchCategoryDetails();
    }
  }, [categoryId]);

  // Değişiklikleri kontrol eden useEffect
  useEffect(() => {
    if (initialData) {
      const isChanged =
        initialData.masterName !== masterName ||
        initialData.phone !== phoneNumber ||
        initialData.projectStartDate !== projectStartDate ||
        initialData.endDate !== endDate ||
        initialData.totalJobCost !== totalJobCost ||
        initialData.paymentMade !== paymentMade ||
        initialData.paymentInstallments !== paymentInstallments ||
        initialData.paymentStartDate !== paymentStartDate;

      setHasChanges(isChanged);
      if (isChanged) {
        setIsSaved(false);
      }
    }
  }, [
    masterName,
    phoneNumber,
    projectStartDate,
    endDate,
    totalJobCost,
    paymentMade,
    paymentInstallments,
    paymentStartDate,
    initialData,
  ]);

  useEffect(() => {
    if (paymentInstallments > 0 && totalJobCost) {
      const remaining =
        parseCurrency(totalJobCost) - (parseCurrency(paymentMade) || 0);
      const installmentAmount = remaining / paymentInstallments;
      setInstallmentAmounts(Array(paymentInstallments).fill(installmentAmount));
    }
  }, [paymentInstallments, totalJobCost, paymentMade]);

  useEffect(() => {
    if (paymentStartDate && paymentInstallments > 0) {
      calculateInstallmentDates(paymentStartDate, paymentInstallments);
    }
  }, [paymentStartDate, paymentInstallments]);

  {
    /* useEffect(() => {
    const checkInstallmentDates = () => {
      if (!notificationsEnabled) return;
  
      const now = new Date();
      installmentDates.forEach((date, index) => {
        const daysUntilInstallment = (date - now) / (1000 * 60 * 60 * 24);
        if (daysUntilInstallment > 0 && daysUntilInstallment <= 5 && !installmentStatus[index]) {
          new Notification(`Taksit Ödemesi`, {
            body: `Taksit ${index + 1} için ödeme tarihi yaklaşıyor!`,
          });
        }
      });
    };
  
    const intervalId = setInterval(checkInstallmentDates, 24 * 60 * 60 * 1000); // Günde bir kez kontrol eder
    return () => clearInterval(intervalId);
  }, [notificationsEnabled, installmentDates, installmentStatus]); */
  }

  /*const handleNotificationsToggle = () => {
    if (!notificationsEnabled) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          setNotificationsEnabled(true);
        }
      });
    } else {
      setNotificationsEnabled(false);
    }
  };*/

  const handleAddOrUpdateCategory = async () => {
    const saveButton = document.getElementById("saveButton");
    if (saveButton) {
      saveButton.disabled = true;
    }

    try {
      // Firma adı kontrolü
      if (!masterName.trim()) {
        toast.error("Firma adı zorunludur!");
        return;
      }

      // Taksit tarihi kontrolü
      if (paymentInstallments > 0 && !paymentStartDate) {
        toast.error("Taksit başlangıç tarihi zorunludur!");
        return;
      }

      const categoryRef = doc(db, "categories", categoryId);
      const updatedCategory = {
        masterName: masterName || "",
        name: categoryName || "",
        phone: phoneNumber || "",
        projectStartDate: projectStartDate || "",
        endDate: endDate || "",
        totalJobCost: parseCurrency(totalJobCost) || 0,
        paymentMade: parseCurrency(paymentMade) || 0,
        paymentInstallments: paymentInstallments || 0,
        paymentStartDate: paymentStartDate || "",
        files: files || [],
        receipts: receipts || [],
        projectId,
        installmentDates: installmentDates.map(
          (date) => date.toISOString().split("T")[0]
        ),
        installmentStatus: installmentStatus || [],
        remainingAmount: parseCurrency(remainingAmount), // Burada yeni remainingAmount ekliyoruz
        installmentAmounts: installmentAmounts || [],
        isEditable: true,
      };

      await setDoc(categoryRef, updatedCategory, { merge: true });
      setRemainingAmount(
        formatCurrency(parseCurrency(totalJobCost) - parseCurrency(paymentMade))
      );
      setIsSaved(true);
      setIsEditing(false);
      toast.success("Kategori başarıyla güncellendi!");
      setHasChanges(false);
      setInitialData(updatedCategory);
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Kategori güncellenirken bir hata oluştu!");
    } finally {
      if (saveButton) {
        saveButton.disabled = false;
      }
    }
  };

  const handleFileUpload = async (e) => {
    setIsLoading(true);
    try {
      const uploadedFiles = [];
      for (let file of e.target.files) {
        const url = await uploadFile(file);
        uploadedFiles.push({ name: file.name, url });
      }

      // Önce state'i güncelle
      const updatedFiles = [...files, ...uploadedFiles];
      setFiles(updatedFiles);

      // Sonra Firebase'i güncelle
      const categoryRef = doc(db, "categories", categoryId);
      await setDoc(
        categoryRef,
        {
          files: updatedFiles,
          // Diğer verileri de gönderelim ki veri tutarlılığı sağlansın
          masterName,
          name: categoryName,
          phone: phoneNumber,
          projectStartDate,
          endDate,
          totalJobCost: parseCurrency(totalJobCost),
          paymentMade: parseCurrency(paymentMade),
          paymentInstallments,
          paymentStartDate,
          receipts,
          projectId,
          installmentDates: installmentDates.map(
            (date) => date.toISOString().split("T")[0]
          ),
          installmentStatus,
          remainingAmount: parseCurrency(remainingAmount),
          installmentAmounts,
          isEditable: true,
        },
        { merge: true }
      );

      // Initial data'yı da güncelle
      setInitialData((prev) => ({
        ...prev,
        files: updatedFiles,
      }));

      setHasChanges(false); // Değişiklikleri sıfırla
      toast.success("Dosyalar başarıyla yüklendi!");
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Dosyalar yüklenirken bir hata oluştu!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFile = async (index) => {
    try {
      const updatedFiles = files.filter((_, i) => i !== index);
      setFiles(updatedFiles);

      const categoryRef = doc(db, "categories", categoryId);
      await setDoc(categoryRef, { files: updatedFiles }, { merge: true });
      toast.success("Dosya başarıyla silindi!");
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Dosya silinirken bir hata oluştu!");
    }
  };

  const handleDeleteCategory = async () => {
    try {
      const categoryRef = doc(db, "categories", categoryId);
      await deleteDoc(categoryRef);
      toast.success("Kategori başarıyla silindi!");
      router.push(`/projects/${projectId}`);
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Kategori silinirken bir hata oluştu!");
    }
  };

  const handleInstallmentsChange = (e) => {
    const installments = parseInt(e.target.value, 10) || 0;
    setPaymentInstallments(installments);
    calculateInstallmentDates(paymentStartDate, installments);
    setInstallmentStatus(Array(installments).fill(false));

    // Taksit tutarlarını hesapla
    if (installments > 0 && totalJobCost) {
      const totalAmount = parseCurrency(totalJobCost);
      const paidAmount = parseCurrency(paymentMade) || 0; // 0 olarak varsayılan değer
      const remaining = totalAmount - paidAmount;
      const installmentAmount = remaining / installments;
      setInstallmentAmounts(Array(installments).fill(installmentAmount));
    }
  };

  const handleInstallmentStatusChange = async (index) => {
    if (installmentStatus[index]) {
      return;
    }

    const newStatus = [...installmentStatus];
    const newRemainingAmount = parseCurrency(remainingAmount);
    const paidAmount = installmentAmounts[index];

    // Ödeme seçenekleri modalı
    const shouldUploadReceipt = window.confirm(
      "Makbuz yüklemek istiyor musunuz? İptal'e basarsanız makbuzsuz ödeme yapılacaktır."
    );

    if (shouldUploadReceipt) {
      // Mevcut makbuz yükleme mantığı
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "application/pdf,image/*";

      fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          const url = await uploadFile(file);
          await completePayment(
            index,
            newStatus,
            newRemainingAmount,
            paidAmount,
            url
          );
        }
      };

      fileInput.click();
    } else {
      // Makbuzsuz ödeme
      await completePayment(index, newStatus, newRemainingAmount, paidAmount);
    }
  };

  // Ödeme tamamlama yardımcı fonksiyonu
  const completePayment = async (
    index,
    newStatus,
    newRemainingAmount,
    paidAmount,
    receiptUrl
  ) => {
    try {
      if (
        index === undefined ||
        !newStatus ||
        !newRemainingAmount ||
        !paidAmount
      ) {
        throw new Error("Geçersiz ödeme parametreleri");
      }

      newStatus[index] = true;

      // Kalan tutarı yeniden hesapla
      const updatedRemainingAmount = parseCurrency(
        updateRemainingAmount(totalJobCost, paymentMade)
      );

      let newReceipts = [...receipts];
      if (receiptUrl) {
        newReceipts[index] = {
          url: receiptUrl,
          name: `Makbuz ${index + 1}`,
          installmentNumber: index + 1,
        };
      }

      const updateData = {
        remainingAmount: updatedRemainingAmount,
        installmentStatus: newStatus,
        receipts: newReceipts,
      };

      // Veri kontrolü
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const categoryRef = doc(db, "categories", categoryId);
      await setDoc(categoryRef, updateData, { merge: true });

      setInstallmentStatus(newStatus);
      setReceipts(newReceipts);
      setRemainingAmount(formatCurrency(updatedRemainingAmount));
    } catch (error) {
      console.error("Error in completePayment:", error);
      throw error;
    }
  };

  const calculateInstallmentDates = (startDate, installments) => {
    if (!startDate || installments <= 0) return;
    const dates = [];
    let currentDate = new Date(startDate);
    for (let i = 0; i < installments; i++) {
      dates.push(new Date(currentDate));
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    setInstallmentDates(dates);
  };

  const formatCurrency = (value) => {
    if (!value) return "0 TL";
    return `${parseFloat(value).toLocaleString("tr-TR", {
      minimumFractionDigits: 0,
    })} TL`;
  };

  const parseCurrency = (value) => {
    if (!value) return 0;
    // String'den sayıya çevirme
    return parseInt(value.toString().replace(/[^\d]/g, "")) || 0;
  };

  const updateRemainingAmount = (total, paid) => {
    const totalAmount = parseCurrency(total);
    const paidAmount = parseCurrency(paid);

    // Tüm ödenmiş taksitlerin toplamını hesapla
    const paidInstallments = installmentStatus.reduce((sum, status, index) => {
      return status ? sum + (installmentAmounts[index] || 0) : sum;
    }, 0);

    // Toplam ödenmiş miktar (başlangıç ödemesi + ödenen taksitler)
    const totalPaidAmount = paidAmount + paidInstallments;

    // Kalan tutarı hesapla
    const remaining = Math.max(0, totalAmount - totalPaidAmount);

    return formatCurrency(remaining);
  };

  const handleTotalJobCostChange = (e) => {
    const rawValue = parseCurrency(e.target.value);
    setTotalJobCost(rawValue.toString());
    const remaining = updateRemainingAmount(rawValue, paymentMade);
    setRemainingAmount(remaining);

    // Firebase'i güncelle
    const categoryRef = doc(db, "categories", categoryId);
    setDoc(
      categoryRef,
      {
        totalJobCost: rawValue,
        remainingAmount: parseCurrency(remaining),
      },
      { merge: true }
    );
  };

  const handlePaymentMadeChange = (e) => {
    const rawValue = parseCurrency(e.target.value);
    setPaymentMade(rawValue.toString());
    const remaining = updateRemainingAmount(totalJobCost, rawValue);
    setRemainingAmount(remaining);

    // Firebase'i güncelle
    const categoryRef = doc(db, "categories", categoryId);
    setDoc(
      categoryRef,
      {
        paymentMade: rawValue,
        remainingAmount: parseCurrency(remaining),
      },
      { merge: true }
    );
  };

  // Ödeme modalını açan fonksiyon
  const openPaymentModal = (index) => {
    setSelectedInstallmentIndex(index);
    setPaymentModalOpen(true);
  };

  // Ödeme işlemini gerçekleştiren fonksiyon
  const handlePayment = async (withReceipt) => {
    if (selectedInstallmentIndex === null) return;

    try {
      const index = selectedInstallmentIndex;
      const newStatus = [...installmentStatus];
      // Mevcut kalan tutarı sayısal değer olarak al
      const currentRemainingAmount = parseCurrency(remainingAmount);
      const paidAmount = installmentAmounts[index];
      let newReceipts = [...receipts];

      if (!newReceipts[index]) {
        newReceipts[index] = null;
      }

      // Yeni kalan tutarı hesapla
      const updatedRemainingAmount = Math.max(
        0,
        currentRemainingAmount - paidAmount
      );

      if (withReceipt) {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "application/pdf,image/*";

        fileInput.onchange = async (e) => {
          const file = e.target.files[0];
          if (file) {
            setIsLoading(true);
            try {
              const url = await uploadFile(file);
              if (!url) {
                throw new Error("Dosya yükleme başarısız");
              }

              // Makbuz bilgisini güncelle
              newReceipts[index] = {
                name: `Makbuz ${index + 1}`,
                url,
                installmentNumber: index + 1,
              };

              // Ödeme durumunu güncelle
              newStatus[index] = true;

              // Firebase'i güncelle
              const categoryRef = doc(db, "categories", categoryId);
              await setDoc(
                categoryRef,
                {
                  remainingAmount: updatedRemainingAmount,
                  installmentStatus: newStatus,
                  receipts: newReceipts,
                },
                { merge: true }
              );

              // State'leri güncelle
              setRemainingAmount(formatCurrency(updatedRemainingAmount));
              setInstallmentStatus(newStatus);
              setReceipts(newReceipts);
              setPaymentModalOpen(false);
              setSelectedInstallmentIndex(null);
              toast.success("Ödeme ve makbuz yükleme başarılı!");
            } catch (error) {
              console.error("Error in payment process:", error);
              toast.error("Ödeme işlemi sırasında bir hata oluştu!");
            } finally {
              setIsLoading(false);
            }
          }
        };

        fileInput.click();
      } else {
        // Makbuzsuz ödeme işlemi
        setIsLoading(true);
        try {
          newStatus[index] = true;

          // Firebase'i güncelle
          const categoryRef = doc(db, "categories", categoryId);
          await setDoc(
            categoryRef,
            {
              remainingAmount: updatedRemainingAmount,
              installmentStatus: newStatus,
              receipts: newReceipts, // Güncellenmiş receipts dizisini gönder
            },
            { merge: true }
          );

          setRemainingAmount(formatCurrency(updatedRemainingAmount));
          setInstallmentStatus(newStatus);
          setReceipts(newReceipts); // State'i güncelle
          setPaymentModalOpen(false);
          setSelectedInstallmentIndex(null);
          toast.success("Ödeme başarıyla kaydedildi!");
        } catch (error) {
          console.error("Error in payment process:", error);
          toast.error("Ödeme işlemi sırasında bir hata oluştu!");
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Error in payment process:", error);
      toast.error("Ödeme işlemi sırasında bir hata oluştu!");
      setIsLoading(false);
    }
  };

  // Yaklaşan taksiti bulan yardımcı fonksiyon ekleyelim
  const getNextInstallment = () => {
    if (!installmentDates.length) return null;

    const today = new Date();
    const nextInstallment = installmentDates
      .map((date, index) => ({ date, index }))
      .filter((item) => !installmentStatus[item.index])
      .find((item) => item.date >= today);

    return nextInstallment;
  };

  // Tamamlanma yüzdesini hesaplayan yardımcı fonksiyon ekleyelim
  const calculateCompletionPercentage = () => {
    if (!paymentInstallments || paymentInstallments === 0) return 0;

    const completedPayments = installmentStatus.filter(
      (status) => status
    ).length;
    return Math.round((completedPayments / paymentInstallments) * 100);
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

  // Dosya silme fonksiyonu
  const handleFileDelete = async (fileToDelete, fileType) => {
    try {
      setIsLoading(true);
      const updatedFiles =
        fileType === "receipt"
          ? receipts.filter((file) => file.url !== fileToDelete.url)
          : files.filter((file) => file.url !== fileToDelete.url);

      const categoryRef = doc(db, "categories", categoryId);
      await updateDoc(categoryRef, {
        [fileType === "receipt" ? "receipts" : "files"]: updatedFiles,
      });

      if (fileType === "receipt") {
        setReceipts(updatedFiles);
      } else {
        setFiles(updatedFiles);
      }

      toast.success("Dosya başarıyla silindi!");
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Dosya silinirken bir hata oluştu!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? "pl-64" : "pl-20"}
          w-full
        `}
      >
        <main className="pt-24 px-6 pb-6">
          <div className="max-w-[2000px] mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {categoryName}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Kategori Detayları
                </p>
              </div>
              <div className="flex gap-3">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="group inline-flex items-center px-6 py-3 rounded-xl 
                      bg-gradient-to-br from-blue-500 to-blue-600 
                      text-white transition-all duration-300 
                      hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/25 
                      active:scale-[0.98]"
                  >
                    <span className="relative flex items-center">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      <span className="font-medium">Düzenle</span>
                    </span>
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        // Değişiklikleri geri al
                        if (!hasChanges) {
                          setCategoryName(initialData.name || "");
                          setmasterName(initialData.masterName || "");
                          setPhoneNumber(initialData.phone || "");
                          setFiles(initialData.files || []);
                          setReceipts(initialData.receipts || []);
                          setProjectStartDate(
                            initialData.projectStartDate || ""
                          );
                          setEndDate(initialData.endDate || "");
                          setTotalJobCost(initialData.totalJobCost || "");
                          setPaymentMade(initialData.paymentMade || "");
                          setPaymentInstallments(
                            initialData.paymentInstallments || 0
                          );
                          setRemainingAmount(
                            formatCurrency(initialData.remainingAmount)
                          );
                          setPaymentStartDate(
                            initialData.paymentStartDate || ""
                          );
                          setInstallmentDates(
                            initialData.installmentDates
                              ? initialData.installmentDates.map(
                                  (date) => new Date(date)
                                )
                              : []
                          );
                          setInstallmentStatus(
                            initialData.installmentStatus ||
                              Array(initialData.paymentInstallments).fill(false)
                          );
                          setInstallmentAmounts(
                            initialData.installmentAmounts || []
                          );
                          setIsEditable(!initialData.isEditable);
                        }
                      }}
                      className="group inline-flex items-center px-6 py-3 rounded-xl 
                        bg-white border border-gray-300
                        text-gray-700 transition-all duration-300 
                        hover:scale-[1.02] hover:shadow-lg hover:shadow-gray-200/25 
                        active:scale-[0.98]"
                    >
                      <span className="relative flex items-center">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                          />
                        </svg>
                        <span className="font-medium">Özete Dön</span>
                      </span>
                    </button>
                    {hasChanges && (
                      <button
                        id="saveButton"
                        onClick={handleAddOrUpdateCategory}
                        disabled={isLoading}
                        className="group inline-flex items-center px-6 py-3 rounded-xl 
                          bg-gradient-to-br from-green-500 to-green-600 
                          text-white transition-all duration-300 
                          hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/25 
                          active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        <span className="relative flex items-center">
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              <span className="font-medium">
                                Kaydediliyor...
                              </span>
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-5 h-5 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              <span className="font-medium">
                                Değişiklikleri Kaydet
                              </span>
                            </>
                          )}
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Ana İçerik */}
            <div className="grid grid-cols-1 gap-6">
              {/* Form Grid */}
              <div
                className={`
                grid gap-6
                ${
                  isSidebarOpen
                    ? "grid-cols-1 xl:grid-cols-2"
                    : "grid-cols-1 lg:grid-cols-2"
                }
              `}
              >
                {/* Özet Görünüm */}
                {!isEditing && (
                  <>
                    {/* Temel Bilgiler Özeti */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                      <h3 className="text-lg font-semibold mb-4">
                        Temel Bilgiler
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600">Firma Adı:</span>
                          <span className="font-medium">{masterName}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600">Telefon:</span>
                          <span className="font-medium">{phoneNumber}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600">
                            Başlangıç Tarihi:
                          </span>
                          <span className="font-medium">
                            {projectStartDate}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600">Bitiş Tarihi:</span>
                          <span className="font-medium">{endDate}</span>
                        </div>

                        {/* Proje Dosyaları */}
                        <div className="mt-8">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Proje Dosyaları
                            </h3>
                          </div>

                          {files.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {files.map((file, index) => (
                                <div
                                  key={index}
                                  className="flex items-center p-3 border border-gray-200 rounded-lg group hover:border-gray-300"
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
                                            : "text-gray-400"
                                        }`}
                                        size={20}
                                      />
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {file.name}
                                      </p>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {new Date(
                                        file.uploadedAt
                                      ).toLocaleDateString("tr-TR")}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() =>
                                        window.open(file.url, "_blank")
                                      }
                                      className="p-1 text-gray-500 hover:text-gray-700"
                                      title="İndir"
                                    >
                                      <MdDownload size={18} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleFileDelete(file, "file")
                                      }
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
                          ) : (
                            <div className="text-center py-8 px-4 border-2 border-dashed border-gray-200 rounded-lg">
                              <div className="flex justify-center mb-2">
                                <MdInsertDriveFile
                                  className="text-gray-400"
                                  size={24}
                                />
                              </div>
                              <p className="text-sm text-gray-500">
                                Henüz dosya yüklenmemiş
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ödeme Bilgileri Özeti */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                      <h3 className="text-lg font-semibold mb-4">
                        Ödeme Bilgileri
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600">
                            Toplam İş Ücreti:
                          </span>
                          <span className="font-medium">
                            {formatCurrency(totalJobCost)}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600">
                            Başlangıç Ödemesi:
                          </span>
                          <span className="font-medium">
                            {formatCurrency(paymentMade)}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600">Taksit Sayısı:</span>
                          <span className="font-medium">
                            {paymentInstallments} Taksit
                          </span>
                        </div>

                        {/* Kalan Tutar Detayı */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                              Kalan Tutar:
                            </span>
                            <span
                              className={`text-lg font-bold ${
                                parseInt(parseCurrency(remainingAmount)) === 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {remainingAmount || "0 TL"}
                            </span>
                          </div>

                          {/* Ödeme İstatistikleri */}
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  Ödenen Taksit
                                </div>
                                <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                  {
                                    installmentStatus.filter((status) => status)
                                      .length
                                  }{" "}
                                  / {paymentInstallments || 0}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  Tamamlanma
                                </div>
                                <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                  {calculateCompletionPercentage()}%
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Yaklaşan Taksit Bilgisi */}
                          {getNextInstallment() && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Yaklaşan Taksit:
                              </div>
                              <div className="flex flex-col space-y-3">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <span className="text-gray-700 dark:text-gray-300">
                                      {getNextInstallment().date.toLocaleDateString(
                                        "tr-TR"
                                      )}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                      (
                                      {Math.ceil(
                                        (getNextInstallment().date -
                                          new Date()) /
                                          (1000 * 60 * 60 * 24)
                                      )}{" "}
                                      gün kaldı)
                                    </span>
                                  </div>
                                  <span className="font-medium text-blue-600 dark:text-blue-400">
                                    {formatCurrency(
                                      installmentAmounts[
                                        getNextInstallment().index
                                      ]
                                    )}
                                  </span>
                                </div>

                                {/* Ödeme Butonu */}
                                <button
                                  onClick={() =>
                                    openPaymentModal(getNextInstallment().index)
                                  }
                                  className="w-full py-2 px-4 bg-gradient-to-br from-blue-500 to-blue-600 
                                    text-white rounded-lg font-medium
                                    hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/25 
                                    active:scale-[0.98] transition-all duration-200"
                                >
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                      />
                                    </svg>
                                    <span>Yaklaşan Taksiti Öde</span>
                                  </div>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Düzenleme Formu */}
                {isEditing && (
                  <>
                    {/* Temel Bilgiler */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                      <h3 className="text-lg font-semibold mb-6">
                        Temel Bilgiler
                      </h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Firma Adı <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={masterName}
                              onChange={(e) => setmasterName(e.target.value)}
                              className={`w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400`}
                              placeholder="Firma adını girin"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Telefon
                            </label>
                            <input
                              type="tel"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                              placeholder="Telefon numarası"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Başlangıç Tarihi
                            </label>
                            <input
                              type="date"
                              value={projectStartDate}
                              onChange={(e) =>
                                setProjectStartDate(e.target.value)
                              }
                              className={`w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400`}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Bitiş Tarihi
                            </label>
                            <input
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className={`w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400`}
                            />
                          </div>
                        </div>

                        {/* Proje Dosyaları Bölümü - Düzenleme Formuna Taşındı */}
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Proje Dosyaları
                            </label>
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
                                    <MdAdd size={16} />
                                    <span>Dosya Ekle</span>
                                  </>
                                )}
                              </div>
                            </label>
                          </div>

                          {/* Yüklenen Dosyaların Listesi */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {files.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors duration-200"
                              >
                                <div className="flex items-center space-x-3 min-w-0">
                                  <div className="p-2 bg-white rounded-lg">
                                    {file.url.match(
                                      /\.(jpg|jpeg|png|gif|webp)$/i
                                    ) ? (
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
                                      {new Date(
                                        file.uploadedAt
                                      ).toLocaleDateString("tr-TR")}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() =>
                                      window.open(file.url, "_blank")
                                    }
                                    className="p-1 text-gray-500 hover:text-gray-700"
                                    title="İndir"
                                  >
                                    <MdDownload size={18} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleFileDelete(file, "file")
                                    }
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
                                  className="hidden"
                                  onChange={(e) => handleFileUpload(e)}
                                  disabled={isLoading}
                                />
                                {isLoading ? "Yükleniyor..." : "Dosya Yükle"}
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ödeme Bilgileri */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                      <h3 className="text-lg font-semibold mb-6">
                        Ödeme Bilgileri
                      </h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Toplam İş Ücreti
                            </label>
                            <input
                              type="text"
                              value={formatCurrency(totalJobCost)}
                              onChange={handleTotalJobCostChange}
                              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                              placeholder="0 TL"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Başlangıç Ödemesi
                            </label>
                            <input
                              type="text"
                              value={formatCurrency(paymentMade)}
                              onChange={handlePaymentMadeChange}
                              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                              placeholder="0 TL"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Taksit Sayısı
                          </label>
                          <select
                            value={paymentInstallments}
                            onChange={handleInstallmentsChange}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                              bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                              focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                          >
                            <option value="">Seçiniz</option>
                            {Array.from({ length: 36 }, (_, i) => i + 1).map(
                              (num) => (
                                <option key={num} value={num}>
                                  {num} Taksit
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        {paymentInstallments > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Taksit Başlangıç Tarihi{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={paymentStartDate}
                              onChange={(e) =>
                                setPaymentStartDate(e.target.value)
                              }
                              className={`w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400`}
                              required
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Taksit Tablosu Grid */}
              <div
                className={`
                grid gap-6
                ${isSidebarOpen ? "grid-cols-1" : "grid-cols-1"}
              `}
              >
                {/* Taksit Tablosu */}
                {!isEditing &&
                  paymentStartDate &&
                  installmentDates.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 xl:col-span-2">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold">Taksit Planı</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                Taksit No
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                Tarih
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                Tutar
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                Durum
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                Makbuz
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                İşlem
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {installmentDates.map((date, index) => (
                              <tr
                                key={index}
                                className="border-t border-gray-200 dark:border-gray-700"
                              >
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                  {index + 1}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                  {date.toLocaleDateString("tr-TR")}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                  {formatCurrency(installmentAmounts[index])}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                  ${
                                    parseInt(parseCurrency(remainingAmount)) ===
                                    0
                                      ? "bg-green-100 text-green-800"
                                      : installmentStatus[index]
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                  >
                                    {installmentStatus[index]
                                      ? "Ödendi"
                                      : "Ödenmedi"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {receipts[index] && (
                                    <button
                                      onClick={() => {
                                        setPreviewFile(receipts[index]);
                                        setIsPreviewModalOpen(true);
                                      }}
                                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                                    >
                                      {receipts[index].url.match(
                                        /\.(jpg|jpeg|png|gif|webp)$/i
                                      ) ? (
                                        <img
                                          src={receipts[index].url}
                                          alt="Makbuz"
                                          className="w-10 h-10 object-cover rounded"
                                        />
                                      ) : (
                                        <div className="p-2 bg-blue-50 rounded">
                                          <svg
                                            className="w-6 h-6 text-blue-500"
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
                                      <span className="text-sm">Görüntüle</span>
                                    </button>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <button
                                    onClick={() => openPaymentModal(index)}
                                    disabled={installmentStatus[index]}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium
                                  ${
                                    installmentStatus[index]
                                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                      : "bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors duration-200"
                                  }`}
                                  >
                                    {installmentStatus[index]
                                      ? "Ödendi"
                                      : "Ödeme Yap"}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Ödeme Modalı */}
      {paymentModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Ödeme İşlemi
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Taksit Bilgileri
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Taksit No:</span>
                      <span className="font-medium text-gray-900">
                        {selectedInstallmentIndex !== null &&
                          selectedInstallmentIndex + 1}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Vade Tarihi:</span>
                      <span className="font-medium text-gray-900">
                        {selectedInstallmentIndex !== null &&
                          installmentDates[
                            selectedInstallmentIndex
                          ].toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tutar:</span>
                      <span className="font-medium text-gray-900">
                        {selectedInstallmentIndex !== null &&
                          formatCurrency(
                            installmentAmounts[selectedInstallmentIndex]
                          )}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Ödeme Yöntemi Seçin
                  </label>
                  <div className="grid grid-cols-1 gap-4">
                    {/* Makbuzlu Ödeme Seçeneği */}
                    <button
                      onClick={() => handlePayment(true)}
                      disabled={isLoading}
                      className="relative group p-4 rounded-xl border-2 
                        border-transparent hover:border-gray-200
                        transition-all duration-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <svg
                            className="w-6 h-6 text-blue-500"
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
                        <div className="flex-1 text-left">
                          <h4 className="font-medium text-gray-900">
                            Makbuz İle Ödeme
                          </h4>
                          <p className="text-sm text-gray-500">
                            Ödeme makbuzunu yükleyerek işlemi tamamlayın
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Makbuzsuz Ödeme Seçeneği */}
                    <button
                      onClick={() => handlePayment(false)}
                      disabled={isLoading}
                      className="relative group p-4 rounded-xl border-2 
                        border-transparent hover:border-gray-200
                        transition-all duration-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <svg
                            className="w-6 h-6 text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 text-left">
                          <h4 className="font-medium text-gray-900">
                            Makbuzsuz Ödeme
                          </h4>
                          <p className="text-sm text-gray-500">
                            Ödemeyi makbuz olmadan kaydedin
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-xl flex justify-end space-x-3">
              <button
                onClick={() => {
                  setPaymentModalOpen(false);
                  setSelectedInstallmentIndex(null);
                }}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 
                  rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                İptal
              </button>
            </div>

            {/* Loading Durumu */}
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  <span className="text-sm font-medium text-gray-600">
                    İşlem yapılıyor...
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
    </div>
  );
};

export default CategoryDetails;

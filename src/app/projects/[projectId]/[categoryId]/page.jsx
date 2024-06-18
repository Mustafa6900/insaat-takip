"use client";

import { useState, useEffect } from 'react';
import { db, uploadFile, auth } from '../../../firebase';
import { doc, getDoc, setDoc,deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';


const CategoryDetails = ({ params }) => {
  const { projectId, categoryId } = params;
  const [categoryName, setCategoryName] = useState('');
  const [masterName, setmasterName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [files, setFiles] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [projectStartDate, setProjectStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalJobCost, setTotalJobCost] = useState('');
  const [paymentMade, setPaymentMade] = useState('');
  const [paymentInstallments, setPaymentInstallments] = useState(0);
  const [installmentDates, setInstallmentDates] = useState([]);
  const [installmentStatus, setInstallmentStatus] = useState([]);
  const [paymentStartDate, setPaymentStartDate] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const router = useRouter();
  const [user, setUser] = useState(null);
//  const [notificationsEnabled, setNotificationsEnabled] = useState(false);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchCategoryDetails = async () => {
      const categoryRef = doc(db, 'categories', categoryId);
      const categorySnap = await getDoc(categoryRef);
  
      if (categorySnap.exists()) {
        const categoryData = categorySnap.data();
        setCategoryName(categoryData.name || '');
        setmasterName(categoryData.masterName || '');
        setPhoneNumber(categoryData.phone || '');
        setFiles(categoryData.files || []);
        setReceipts(categoryData.receipts || []);
        setProjectStartDate(categoryData.projectStartDate || '');
        setEndDate(categoryData.endDate || '');
        setTotalJobCost(categoryData.totalJobCost || '');
        setPaymentMade(categoryData.paymentMade || '');
        setPaymentInstallments(categoryData.paymentInstallments || 0);
        setRemainingAmount(formatCurrency(categoryData.totalJobCost - categoryData.paymentMade));
        setPaymentStartDate(categoryData.paymentStartDate || '');
        setInstallmentDates(
          categoryData.installmentDates
            ? categoryData.installmentDates.map(date => new Date(date))
            : []
        );
        setInstallmentStatus(categoryData.installmentStatus || Array(categoryData.paymentInstallments).fill(false));
      }
    };
  
    if (categoryId) {
      fetchCategoryDetails();
    }
  }, [categoryId]);
  
    {/* useEffect(() => {
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
  }, [notificationsEnabled, installmentDates, installmentStatus]); */}

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
  const categoryRef = doc(db, 'categories', categoryId);
  const updatedCategory = {
    masterName: masterName || '',
    name: categoryName || '',
    phone: phoneNumber || '',
    projectStartDate: projectStartDate || '',
    endDate: endDate || '',
    totalJobCost: parseCurrency(totalJobCost) || 0,
    paymentMade: parseCurrency(paymentMade) || 0,
    paymentInstallments: paymentInstallments || 0,
    paymentStartDate: paymentStartDate || '',
    files: files || [],
    receipts: receipts || [],
    projectId,
    installmentDates: installmentDates.map(date => date.toISOString().split('T')[0]),
    installmentStatus: installmentStatus || []
  };

  await setDoc(categoryRef, updatedCategory, { merge: true });
  setRemainingAmount(formatCurrency(parseCurrency(totalJobCost) - parseCurrency(paymentMade)));
  alert('Kategori başarıyla güncellendi!');
  };

  const handleFileUpload = async (e) => {
    const uploadedFiles = [];
    for (let file of e.target.files) {
      const url = await uploadFile(file);
      uploadedFiles.push({ name: file.name, url });
    }
    const updatedFiles = [...files, ...uploadedFiles];
    setFiles(updatedFiles);

    // Güncellenmiş dosyaları hemen Firebase'e kaydet
    const categoryRef = doc(db, 'categories', categoryId);
    await setDoc(categoryRef, { files: updatedFiles }, { merge: true });
  };

  const handleReceiptUpload = async (e) => {
    const uploadedReceipts = [];
    for (let file of e.target.files) {
      const url = await uploadFile(file);
      uploadedReceipts.push({ name: file.name, url });
    }
    const updatedReceipts = [...receipts, ...uploadedReceipts];
    setReceipts(updatedReceipts);

    // Güncellenmiş makbuzları hemen Firebase'e kaydet
    const categoryRef = doc(db, 'categories', categoryId);
    await setDoc(categoryRef, { receipts: updatedReceipts }, { merge: true });
  };

  const handleDeleteFile = async (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);

    const categoryRef = doc(db, 'categories', categoryId);
    await setDoc(categoryRef, { files: updatedFiles }, { merge: true });
  };

  const handleDeleteReceipt = async (index) => {
    const updatedReceipts = receipts.filter((_, i) => i !== index);
    setReceipts(updatedReceipts);

    const categoryRef = doc(db, 'categories', categoryId);
    await setDoc(categoryRef, { receipts: updatedReceipts }, { merge: true });
  };

  const handleDeleteCategory = async () => {
    const confirmation = window.confirm("Kategoriyi silmek istiyor musunuz?");
    if (!confirmation) {
      return;
    }
  
    const categoryRef = doc(db, 'categories', categoryId);
    await deleteDoc(categoryRef);
    alert('Kategori başarıyla silindi!');
    router.push('/');
  };

  const handleInstallmentsChange = (e) => {
    const installments = parseInt(e.target.value, 10) || 0;
    setPaymentInstallments(installments);
    calculateInstallmentDates(paymentStartDate, installments);
    setInstallmentStatus(Array(installments).fill(false));
  };

  const handleInstallmentStatusChange = async (index) => {
    const newStatus = [...installmentStatus];
    newStatus[index] = !newStatus[index];
    setInstallmentStatus(newStatus);

    // Ödeme durumunu hemen Firebase'e kaydet
    const categoryRef = doc(db, 'categories', categoryId);
    await setDoc(categoryRef, { installmentStatus: newStatus }, { merge: true });
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

  useEffect(() => {
    calculateInstallmentDates(paymentStartDate, paymentInstallments);
  }, [paymentStartDate, paymentInstallments]);

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    return parseFloat(value).toLocaleString('tr-TR', { minimumFractionDigits: 0 });
  };
  
  const parseCurrency = (value) => {
    return value.replace(/\./g, '');
  };
  
  const handleTotalJobCostChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setTotalJobCost(rawValue);
    setRemainingAmount(formatCurrency(rawValue - parseCurrency(paymentMade)));
  };
  
  const handlePaymentMadeChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setPaymentMade(rawValue);
    setRemainingAmount(formatCurrency(parseCurrency(totalJobCost) - rawValue));
  };
  return (
    <div className="max-w-3xl mx-auto my-12 p-6 bg-white rounded-lg shadow-md mt-12 sm:my-6 ">
        <div className="bg-gray-100 p-4 rounded-lg">
        <h1 className="text-3xl font-bold mb-4 text-center">{categoryName}</h1>
        <div className="space-y-4">
          <div className="flex flex-col">
          <label className="mb-2 font-semibold">Adı:</label>
            <input
              type="text"
              value={masterName}
              readOnly
              placeholder=" Detaylı Bilgiler bölümünden güncelleyebilirsiniz"
              className="border p-2 rounded-lg w-full"
            />
            <label className="mb-2 mt-4 font-semibold">Telefon Numarası:</label>
            <input
              type="text"
              value={phoneNumber}
              readOnly
              placeholder=" Detaylı Bilgiler bölümünden güncelleyebilirsiniz"
              className="border p-2 rounded-lg w-full "
            />
          </div>
          <div className="mt-6">
            <label className="mb-2 font-semibold">Proje Detay Dosyaları:</label>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.isArray(files) && files.length > 0 ? (
                files.map((file, index) => (
                  <div key={index} className="relative flex items-center justify-center bg-white rounded-lg shadow p-4 hover:shadow-lg transition-all">
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="truncate">{file.name}</a>
                    <button onClick={() => handleDeleteFile(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>  
                ))
              ) : (
                <div className="mt-2 flex bg-white rounded-lg shadow p-2 col-span-1 md:col-span-2 lg:col-span-3">
                  <span className="text-gray-400 font-semibold mx-2">Detaylı Bilgiler bölümünden dosya yükleyin</span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-6">
            <label className="mb-2 font-semibold">Makbuzlar:</label>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.isArray(receipts) && receipts.length > 0 ? (
                receipts.map((receipt, index) => (
                  <div key={index} className="relative flex items-center justify-center bg-white rounded-lg shadow p-4 hover:shadow-lg transition-all">
                    <a href={receipt.url} target="_blank" rel="noopener noreferrer" className="truncate">{receipt.name}</a>
                    <button onClick={() => handleDeleteReceipt(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              ) : (
                <div className="mt-2 flex bg-white rounded-lg shadow p-2 col-span-1 md:col-span-2 lg:col-span-3">
                  <span className="text-gray-400 mx-2 font-semibold">Detaylı Bilgiler bölümünden makbuz yükleyin</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col">
      <label className="mb-2 font-semibold">Kalan Tutar:</label>
      <input
        type="text"
        value={remainingAmount}
        readOnly
        className="border p-2 rounded-lg w-full bg-white"
      />
    </div>
        </div>
      </div>
      <div className="mt-6">
        <button
          onClick={handleFlipCard}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-8 rounded-lg shadow"
        >
          Detaylı Bilgileri Görüntüle
        </button>
      </div>
      {isFlipped && (
        <div className="flip-card mt-6">
          <div className="flip-card-inner">
          
            <div className="flip-card-back bg-gray-100 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Detaylı Bilgiler</h2>
              <div className="space-y-4">
              <div className="flex flex-col">
                  <label className="mb-2 font-semibold">Adı:</label>
                  <input
                    type="text"
                    value={masterName}
                    onChange={(e) => setmasterName(e.target.value)}
                    className="border p-2 rounded-lg w-full"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-2 font-semibold">Telefon Numarası:</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="border p-2 rounded-lg w-full"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-2 font-semibold">Proje Detay Dosyası Yükle:</label>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="border p-2 rounded-lg w-full bg-white"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-2 font-semibold">Proje Başlangıç Tarihi:</label>
                  <input
                    type="date"
                    value={projectStartDate}
                    onChange={(e) => setProjectStartDate(e.target.value)}
                    className="border p-2 rounded-lg w-full"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-2 font-semibold">Bitiş Tarihi:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border p-2 rounded-lg w-full"
                  />
                </div>
                <div className="flex flex-col">
      <label className="mb-2 font-semibold">Toplam İş Ücreti:</label>
      <input
        type="text"
        value={formatCurrency(totalJobCost)}
        onChange={handleTotalJobCostChange}
        className="border p-2 rounded-lg w-full"
      />
    </div>
    <div className="flex flex-col">
      <label className="mb-2 font-semibold">Yapılan Ödeme:</label>
      <input
        type="text"
        value={formatCurrency(paymentMade)}
        onChange={handlePaymentMadeChange}
        className="border p-2 rounded-lg w-full"
      />
    </div><div className="flex flex-col">
                  <label className="mb-2 font-semibold">Ödeme Taksitleri (Ay Sayısı):</label>
                  <select
                    value={paymentInstallments}
                    onChange={handleInstallmentsChange}
                    className="border p-2 rounded-lg w-full"
                  >
                    <option value="">Seçiniz</option>
                    {[1, 3, 6, 12, 24, 36].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                {paymentInstallments > 0 && (
                  <div className="flex flex-col mt-4">
                    <label className="mb-2 font-semibold">Ödeme Başlangıç Tarihi:</label>
                    <input
                      type="date"
                      value={paymentStartDate}
                      onChange={(e) => setPaymentStartDate(e.target.value)}
                      className="border p-2 rounded-lg w-full"
                    />
                  </div>
                )}

                {paymentStartDate && (
                  <div className="space-y-2 mt-4">
                    {installmentDates.map((date, index) => (
                      <div key={index} className="flex flex-col">
                        <label className="mb-2 font-semibold">Taksit {index + 1}:</label>
                        <div className="flex items-center">
                          <input
                            type="date"
                            value={date.toISOString().split('T')[0]}
                            readOnly
                            className="border p-2 rounded-lg w-full bg-gray-100"
                          />
                          <button
                            onClick={() => handleInstallmentStatusChange(index)}
                            className={`ml-4 py-2 px-4 rounded-lg shadow ${
                              installmentStatus[index] ? 'bg-green-500' : 'bg-red-500'
                            } text-white`}
                          >
                            {installmentStatus[index] ? 'Ödendi' : 'Ödenmedi'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col">
                  <label className="mb-2 font-semibold">Makbuz Yükle:</label>
                  <input
                    type="file"
                    multiple
                    onChange={handleReceiptUpload}
                    className="border p-2 rounded-lg w-full bg-white"
                  />
                </div>
                <div className="mt-6">
      {/*<button
        onClick={handleNotificationsToggle}
        className={`py-2 px-4 rounded-lg shadow ${notificationsEnabled ? 'bg-green-500' : 'bg-red-500'} text-white`}
      >
        {notificationsEnabled ? 'Bildirimleri Kapat' : 'Bildirimleri Aç'}
      </button>*/}
    </div>
                <div className="mt-6">
                  <button
                    onClick={handleAddOrUpdateCategory}
                    className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg shadow"
                  >
                    Kaydet
                  </button>
                  <button
                    onClick={handleDeleteCategory}
                    className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg shadow ml-2"
                  >
                    Sil
                  </button>

                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



export default CategoryDetails;

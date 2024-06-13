"use client";

import { useState, useEffect } from 'react';
import { db, uploadFile } from '../../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const CategoryDetails = ({ params }) => {
  const { projectId, categoryId } = params;
  const [categoryName, setCategoryName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const fetchCategoryDetails = async () => {
      const categoryRef = doc(db, 'categories', categoryId);
      const categorySnap = await getDoc(categoryRef);
      
      if (categorySnap.exists()) {
        const categoryData = categorySnap.data();
        setCategoryName(categoryData.name);
        setPhoneNumber(categoryData.phone || '');
        setStartDate(categoryData.startDate || '');
        setEndDate(categoryData.endDate || '');
        setPaymentDate(categoryData.paymentDate || '');
        setFiles(categoryData.files || []);
      }
    };

    if (categoryId) {
      fetchCategoryDetails();
    }
  }, [categoryId]);

  const handleAddOrUpdateCategory = async () => {
    const categoryRef = doc(db, 'categories', categoryId);
    const updatedCategory = {
      name: categoryName,
      phone: phoneNumber,
      startDate,
      endDate,
      paymentDate,
      files,
      projectId, // Ensure the projectId is associated with the category
    };
    await setDoc(categoryRef, updatedCategory, { merge: true });
  };

  const handleFileUpload = async (e) => {
    const uploadedFiles = [];
    for (let file of e.target.files) {
      const url = await uploadFile(file);
      uploadedFiles.push({ name: file.name, url });
    }
    setFiles([...files, ...uploadedFiles]);
  };

  return (
    <div className="p-12">
      <h1 className="text-4xl font-bold mb-8">{categoryName}</h1>
      <div className="mb-4">
        <label className="block mb-2">Telefon Numarası:</label>
        <input
          type="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="border p-2 mb-4 w-full rounded-lg"
        />
        <label className="block mb-2">Başlangıç Tarihi:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border p-2 mb-4 w-full rounded-lg"
        />
        <label className="block mb-2">Bitiş Tarihi:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border p-2 mb-4 w-full rounded-lg"
        />
        <label className="block mb-2">Ödeme Tarihi:</label>
        <input
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          className="border p-2 mb-4 w-full rounded-lg"
        />
        <label className="block mb-2">Dosya Yükle:</label>
        <input
          type="file"
          multiple
          onChange={handleFileUpload}
          className="border p-2 mb-4 w-full rounded-lg"
        />
        <button onClick={handleAddOrUpdateCategory} className="bg-blue-500 text-white p-2 rounded-lg">
          Kaydet
        </button>
      </div>
      <div className="grid grid-cols-3 gap-8 text-xl font-bold">
        {files.map((file, index) => (
          <a key={index} href={file.url} target="_blank" rel="noopener noreferrer" className="h-32 flex items-center justify-center bg-gray-500 rounded-lg shadow-lg text-white transition-transform transform hover:scale-105 active:scale-95">
            {file.name}
          </a>
        ))}
      </div>
    </div>
  );
};

export default CategoryDetails;

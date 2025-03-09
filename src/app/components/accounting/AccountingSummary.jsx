"use client";
import { useState, useEffect } from "react";
import { MdTrendingUp, MdTrendingDown, MdAccountBalance } from "react-icons/md";
import { db, auth } from "@/app/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-toastify";
import { useTheme } from "next-themes";

export default function AccountingSummary() {
  const { theme } = useTheme();
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    recentTransactions: [],
  });

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

  useEffect(() => {
    if (user) {
      fetchSummary();
    }
  }, [user]); // user değiştiğinde fetch işlemini tekrarla

  const fetchSummary = async () => {
    if (!user) return;

    try {
      const transactionsRef = collection(db, "transactions");
      const q = query(
        transactionsRef,
        where("userId", "==", user.uid),
        where("isArchived", "in", [false, null])
      );

      const querySnapshot = await getDocs(q);
      let totalIncome = 0;
      let totalExpense = 0;
      const allTransactions = [];

      querySnapshot.forEach((doc) => {
        const transaction = doc.data();
        if (transaction.type === "income") {
          totalIncome += transaction.amount;
        } else {
          totalExpense += transaction.amount;
        }
        allTransactions.push({
          id: doc.id,
          ...transaction,
        });
      });

      // JavaScript'te sırala ve son 5 işlemi al
      const recentTransactions = allTransactions
        .sort((a, b) => {
          // createdAt'in tipini kontrol et ve uygun şekilde işle
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return dateB - dateA;
        })
        .slice(0, 5);

      setSummary({
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        recentTransactions,
      });
    } catch (error) {
      console.error("Özet bilgileri yüklenirken hata:", error);
      toast.error("Özet bilgileri yüklenemedi: " + error.message);
    }
  };

  // Tarih gösterimi için yardımcı fonksiyon
  const formatDate = (dateValue) => {
    try {
      const date = dateValue?.toDate?.() || new Date(dateValue);
      return date.toLocaleString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Tarih formatlanırken hata:", error);
      return "Geçersiz tarih";
    }
  };

  return (
    <div className="space-y-8">
      {/* Finansal Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-xl p-6 border border-green-200 dark:border-green-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-green-800 dark:text-green-100 font-medium">
              Toplam Gelir
            </h3>
            <MdTrendingUp className="text-2xl text-green-600 dark:text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-200">
            {formatCurrency(summary.totalIncome)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800 rounded-xl p-6 border border-red-200 dark:border-red-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-red-800 dark:text-red-100 font-medium">
              Toplam Gider
            </h3>
            <MdTrendingDown className="text-2xl text-red-600 dark:text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-700 dark:text-red-200">
            {formatCurrency(summary.totalExpense)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-blue-800 dark:text-blue-100 font-medium">
              Bakiye
            </h3>
            <MdAccountBalance className="text-2xl text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-200">
            {formatCurrency(summary.balance)}
          </p>
        </div>
      </div>

      {/* Son İşlemler */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-white">
            Son İşlemler
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {summary.recentTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {transaction.description}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(transaction.createdAt)}
                  </p>
                </div>
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

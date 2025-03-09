"use client";
import { useState } from "react";
import TransactionList from "./TransactionList";
import TransactionForm from "./TransactionForm";
import AccountingSummary from "./AccountingSummary";
import { useTheme } from "next-themes";

export default function AccountingDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { theme } = useTheme();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex space-x-4 mb-6">
        <button
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === "overview"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
          onClick={() => setActiveTab("overview")}
        >
          Genel Bakış
        </button>
        <button
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === "transactions"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
          onClick={() => setActiveTab("transactions")}
        >
          İşlemler
        </button>
        <button
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === "new"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
          onClick={() => setActiveTab("new")}
        >
          Yeni İşlem
        </button>
      </div>

      <div className="transition-all duration-300">
        {activeTab === "overview" && <AccountingSummary />}
        {activeTab === "transactions" && <TransactionList />}
        {activeTab === "new" && <TransactionForm />}
      </div>
    </div>
  );
}

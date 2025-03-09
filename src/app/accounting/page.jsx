"use client";

import AccountingDashboard from "../components/accounting/AccountingDashboard";
import { Protected } from "../components/Protected";
import { MdAccountBalance } from "react-icons/md";
import { useSidebar } from "../context/SidebarContext";
import { useTheme } from "next-themes";

export default function AccountingPage() {
  // useSidebar hook'unu kullanarak sidebar durumunu alıyoruz
  const { isSidebarOpen } = useSidebar();
  const { theme } = useTheme();

  return (
    <Protected>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div
          className={`
            transition-all duration-300 ease-in-out
            ${isSidebarOpen ? "pl-64" : "pl-20"}
            w-full
          `}
        >
          <div className="max-w-[2000px] mx-auto px-6">
            {/* Header */}
            <div className="w-full bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mt-24 mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Muhasebe Yönetimi
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Gelir ve gider takibi, nakit akışı yönetimi
                  </p>
                </div>
                <MdAccountBalance className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
            </div>

            {/* Ana İçerik */}
            <div className="mb-8">
              <AccountingDashboard />
            </div>
          </div>
        </div>
      </div>
    </Protected>
  );
}

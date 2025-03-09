'use client';

import './globals.css';
import { AuthContextProvider } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import { ThemeProvider } from 'next-themes';
import Header from './components/Header';
import ClientSideLogic from './layout.client';
import { JetBrains_Mono } from "next/font/google";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-jetbrainsMono",
});

function ToastContainerWithTheme({ theme }) {
  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={theme === 'dark' ? 'dark' : 'light'}
    />
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/x-icon" href="/icons/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <meta name="theme-color" content="#000000" />
        <title>MYS - Müteahhit Yönetim Sistemi</title>
        <meta name="description" content="Müteahhit Yönetim Sistemi" />
      </head>
      <body className={jetbrainsMono.className} suppressHydrationWarning>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="light"
          enableSystem={true}
          disableTransitionOnChange
        >
          <AuthContextProvider>
            <SidebarProvider>
              <div className="flex min-h-screen bg-white dark:bg-gray-900 relative">
                <Header />
                <div className="flex-1 bg-gray-50 dark:bg-gray-900 relative">
                  {children}
                </div>
              </div>
              <ToastContainerWithTheme />
            </SidebarProvider>
          </AuthContextProvider>
        </ThemeProvider>
        <ClientSideLogic />
      </body>
    </html>
  );
}

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
        <title>MYS - Müteahhit Yönetim Sistemi | İnşaat Proje Yönetimi</title>
        <meta name="description" content="İnşaat projelerinizi profesyonelce yönetin. Hakediş takibi, şantiye yönetimi, maliyet kontrolü ve iş programı takibi için özel tasarlanmış yazılım." />
        
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-1TPRE61TEX" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-1TPRE61TEX');
            `,
          }}
        />
        
        {/* SEO Meta Etiketleri */}
        <meta name="keywords" content="müteahhit yazılımı, inşaat yönetim sistemi, hakediş takibi, şantiye yönetimi, proje yönetimi, maliyet kontrolü, iş programı, inşaat yazılımı, yapı takip sistemi" />
        <meta name="author" content="MYS - Müteahhit Yönetim Sistemi" />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph Meta Etiketleri */}
        <meta property="og:title" content="MYS - Müteahhit Yönetim Sistemi | İnşaat Proje Yönetimi" />
        <meta property="og:description" content="İnşaat projelerinizi profesyonelce yönetin. Hakediş takibi, şantiye yönetimi, maliyet kontrolü ve iş programı takibi için özel tasarlanmış yazılım." />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="tr_TR" />
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

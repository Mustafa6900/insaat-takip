'use client';

import './globals.css';
import { AuthContextProvider } from './context/AuthContext'; 
import Header from './components/Header';
import ClientSideLogic from './layout.client';
import { JetBrains_Mono } from "next/font/google";

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-jetbrainsMono",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="theme-color" content="#000000" />
        <title>ITS - İş Takip Sistemi</title>
        <meta name="description" content="İş Takip Sistemi" />
      </head>
      <body className={jetbrainsMono.className}>
        <AuthContextProvider>
          <Header />
          {children}
        </AuthContextProvider>
        <ClientSideLogic />
      </body>
    </html>
  );
}

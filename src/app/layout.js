"use client";

import { useEffect } from 'react';
import { JetBrains_Mono } from "next/font/google";
import './globals.css';
import { AuthContextProvider } from './context/AuthContext'; 
import Header from './components/Header';
import { getToken, onMessageListener } from './firebase';

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-jetbrainsMono",
});

export default function RootLayout({ children }) {
  useEffect(() => {
    getToken();

    onMessageListener()
      .then(payload => {
        console.log('Message received. ', payload);
        // Mesaj alındığında yapılacak işlemler
      })
      .catch(err => console.log('failed: ', err));
  }, []);

  return (
    <html lang="en">
      <body className={jetbrainsMono.className}>
        <AuthContextProvider>
          <Header />
          {children}
        </AuthContextProvider>
      </body>
    </html>
  );
}

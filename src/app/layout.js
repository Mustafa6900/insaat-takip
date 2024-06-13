import { JetBrains_Mono } from "next/font/google";
import './globals.css';
import { AuthContextProvider } from './context/AuthContext'; 
import Header from './components/Header';

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  weight:["100", "200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-jetbrainsMono",
});

export const metadata = {
  title: "ITS - İş Takip Sistemi",
  description: "İş Takip Sistemi",
};

export default function RootLayout({ children }) {
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

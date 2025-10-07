
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "../context/authContext";
import { LoadingProvider } from "../context/loadingContext";
import "./globals.css";
import Image from "next/image";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Invitect",
  description: "AI-powered investment research platform.",
  icons: {
    icon: "/stalking.svg",            // your main favicon  
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black`}
      >
        <AuthProvider>
          <LoadingProvider>
            {children}
          </LoadingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

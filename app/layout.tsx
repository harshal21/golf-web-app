import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Home, PlusCircle, Trophy, Users, Menu } from "lucide-react";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Golf Tracker",
  description: "Track scrambles, solo rounds, and metrics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-slate-900 pb-20 md:pb-0`}>
        
        {/* Top Mobile Header */}
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-50">
          <h1 className="text-xl font-bold text-slate-800">Golf Tracker</h1>
          <button className="p-2 bg-gray-100 rounded-full active:bg-gray-200 transition">
            <Menu size={20} className="text-slate-600" />
          </button>
        </header>

        {/* Main Page Content */}
        <main className="max-w-md mx-auto min-h-screen">
          {children}
        </main>

        {/* Bottom Mobile Navigation */}
        <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around items-center p-3 pb-safe z-50 md:hidden">
          <Link href="/" className="flex flex-col items-center text-slate-400 hover:text-emerald-600 active:text-emerald-700">
            <Home size={24} />
            <span className="text-[10px] mt-1 font-medium">Home</span>
          </Link>
          
          <Link href="/sessions" className="flex flex-col items-center text-slate-400 hover:text-emerald-600 active:text-emerald-700">
            <PlusCircle size={24} />
            <span className="text-[10px] mt-1 font-medium">Sessions</span>
          </Link>

          <Link href="/rankings" className="flex flex-col items-center text-slate-400 hover:text-emerald-600 active:text-emerald-700">
            <Trophy size={24} />
            <span className="text-[10px] mt-1 font-medium">Rankings</span>
          </Link>

          <Link href="/analytics" className="flex flex-col items-center text-slate-400 hover:text-emerald-600 active:text-emerald-700">
            <Users size={24} />
            <span className="text-[10px] mt-1 font-medium">Analytics</span>
          </Link>
        </nav>

      </body>
    </html>
  );
}
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { FileText, PlusCircle, Package, ReceiptText, Building2 } from "lucide-react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Siddharth Medical Agency - Medical Billing & Stock System",
  description: "GST Medical Invoice Billing & Pharmaceutical Stock Management System for Siddharth Medical Agency, Pratapgarh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased flex flex-col">
        {/* Navigation Bar - Clean Light Header (Hidden in Print) */}
        <header className="no-print sticky top-0 z-40 w-full border-b border-[#E2E8F0] bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Logo & Agency Name */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[#2563EB] text-white transition-transform group-hover:scale-105">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-bold text-[#0F172A] tracking-tight">
                      Siddharth Medical Agency
                    </span>
                    <span className="hidden sm:inline-flex rounded bg-blue-50 px-1.5 py-0.2 text-[10px] font-semibold text-[#2563EB] border border-blue-200">
                      Pratapgarh
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] -mt-0.5">
                    GSTIN: 09BDGPD0167D1Z2
                  </p>
                </div>
              </Link>
            </div>

            {/* Nav Links */}
            <nav className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-[6px] transition-colors"
              >
                <FileText className="h-4 w-4" />
                <span>Dashboard / Import</span>
              </Link>

              <Link
                href="/stock"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-[6px] transition-colors"
              >
                <Package className="h-4 w-4" />
                <span>Stock View</span>
              </Link>

              <Link
                href="/bills"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-[6px] transition-colors"
              >
                <ReceiptText className="h-4 w-4" />
                <span>Bill History</span>
              </Link>

              <Link
                href="/bill/new"
                className="ml-2 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[6px] bg-[#2563EB] text-white text-xs font-medium hover:bg-[#1D4ED8] transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Create Bill</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer (Hidden in Print) */}
        <footer className="no-print mt-auto border-t border-[#E2E8F0] bg-white py-4 text-center text-xs text-[#64748B]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              © {new Date().getFullYear()} <strong>Siddharth Medical Agency</strong>, Pratapgarh (U.P.). All rights reserved.
            </div>
            <div className="text-[11px] text-[#94A3B8]">
              Drug Lic. No: UP-PRT-20B-182390 • State Code: 09
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

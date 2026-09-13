"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  UploadCloud,
  Package,
  PlusCircle,
  ReceiptText,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Building2,
  TrendingUp,
} from "lucide-react";
import { StockItem, Bill } from "@/lib/types";
import {
  getStoredStocks,
  saveStoredStocks,
  getStoredBills,
  parseStocksCsv,
  fetchFullCatalogStocks,
} from "@/lib/storage";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { StockTable } from "@/components/StockTable";

export default function DashboardPage() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<{
    success?: boolean;
    message?: string;
    count?: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    const existing = getStoredStocks();
    setBills(getStoredBills());
    if (existing.length <= 15) {
      // Auto-load full catalog from /data/STOCKS.csv
      fetchFullCatalogStocks().then((full) => {
        setStocks(full);
      });
    } else {
      setStocks(existing);
    }
  }, []);

  // Handle CSV file processing
  const handleProcessFile = async (file: File) => {
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      setImportStatus({
        success: false,
        message: "Please upload a valid .csv file.",
      });
      return;
    }

    setIsParsing(true);
    setImportStatus(null);

    try {
      const text = await file.text();
      const { stocks: parsedStocks, errors } = await parseStocksCsv(text);

      if (errors.length > 0 && parsedStocks.length === 0) {
        setImportStatus({
          success: false,
          message: `Failed to parse CSV: ${errors.join(", ")}`,
        });
      } else if (parsedStocks.length === 0) {
        setImportStatus({
          success: false,
          message: "No valid medicine product rows found in the uploaded CSV file.",
        });
      } else {
        // Merge or replace stocks:
        // Update existing matching by code, append new ones
        const currentStocks = getStoredStocks();
        const stockMap = new Map<string, StockItem>();

        // First index existing stocks
        currentStocks.forEach((s) => stockMap.set(s.code.toUpperCase(), s));

        // Overwrite or add newly imported stocks
        parsedStocks.forEach((newS) => {
          stockMap.set(newS.code.toUpperCase(), newS);
        });

        const mergedStocks = Array.from(stockMap.values());
        saveStoredStocks(mergedStocks);
        setStocks(mergedStocks);

        setImportStatus({
          success: true,
          message: `Successfully imported ${parsedStocks.length} medicine products from ${file.name}!`,
          count: parsedStocks.length,
        });
      }
    } catch (err: unknown) {
      setImportStatus({
        success: false,
        message: err instanceof Error ? err.message : "Error reading CSV file.",
      });
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDownloadFullCsv = () => {
    const a = document.createElement("a");
    a.href = "/STOCKS.csv";
    a.download = "STOCKS.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleLoadAllStocksFromData = async () => {
    setIsParsing(true);
    try {
      const full = await fetchFullCatalogStocks();
      setStocks(full);
      setImportStatus({
        success: true,
        message: `Loaded all ${full.length} medicine products from data/STOCKS.csv!`,
        count: full.length,
      });
    } catch {
      setImportStatus({
        success: false,
        message: "Failed to load full stock catalog.",
      });
    } finally {
      setIsParsing(false);
    }
  };

  const totalRevenue = bills.reduce((acc, b) => acc + (b.summary.grandTotal || 0), 0);
  const lowStockCount = stocks.filter((s) => s.currentStock < 10).length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-[8px] border border-[#E2E8F0] bg-white p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[#2563EB]">
              <Building2 className="h-3.5 w-3.5" />
            </span>
            <h1 className="text-xl font-bold text-[#0F172A]">
              Siddharth Medical Agency
            </h1>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-[#475569]">
              Pratapgarh (U.P.)
            </span>
          </div>
          <p className="text-xs text-[#64748B]">
            GSTIN: <span className="font-mono font-medium text-[#0F172A]">09BDGPD0167D1Z2</span> • D.L. No: UP-PRT-20B-182390 • State Code: 09
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/bill/new">
            <Button variant="primary" size="md">
              <PlusCircle className="h-4 w-4 mr-1.5" />
              Create New Bill
            </Button>
          </Link>
          <Link href="/bills">
            <Button variant="outline" size="md">
              <ReceiptText className="h-4 w-4 mr-1.5" />
              View Bills ({bills.length})
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-[8px] border border-[#E2E8F0] bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#64748B]">Total Medicine Stock</span>
            <Package className="h-4 w-4 text-[#2563EB]" />
          </div>
          <div className="text-2xl font-bold text-[#0F172A] mt-2 font-mono">
            {stocks.length}
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">Unique items in catalog</p>
        </div>

        <div className="rounded-[8px] border border-[#E2E8F0] bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#64748B]">Low Stock Alerts</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2 font-mono">
            {lowStockCount}
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">Items below 10 quantity</p>
        </div>

        <div className="rounded-[8px] border border-[#E2E8F0] bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#64748B]">Total Invoices</span>
            <ReceiptText className="h-4 w-4 text-[#2563EB]" />
          </div>
          <div className="text-2xl font-bold text-[#0F172A] mt-2 font-mono">
            {bills.length}
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">Generated this session</p>
        </div>

        <div className="rounded-[8px] border border-[#E2E8F0] bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#64748B]">Total Revenue</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2 font-mono">
            {formatCurrency(totalRevenue)}
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">Billed gross total</p>
        </div>
      </div>

      {/* Stock Import (CSV) Section */}
      <div className="rounded-[8px] border border-[#E2E8F0] bg-white p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A] flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-[#2563EB]" />
              <span>Import Medicine Stock (STOCKS.csv)</span>
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Upload your pharmaceutical inventory CSV to update stock quantities, schemes, and MRP.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadFullCsv}
              title="Download the full STOCKS.csv file"
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              Download STOCKS.csv
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleLoadAllStocksFromData}
              title="Load all 2,693 medicines from STOCKS.csv"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Load Full STOCKS.csv (2,693 Items)
            </Button>
          </div>
        </div>

        {/* Expected CSV Columns notice */}
        <div className="rounded-[6px] bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-xs text-[#64748B]">
          <span className="font-semibold text-[#0F172A]">Supported CSV Columns: </span>
          <code className="bg-white px-1.5 py-0.5 rounded border border-[#E2E8F0] text-[#2563EB] font-mono text-[11px]">
            Code, Product Name, Unit, Current Stock, Sales Scheme Deal, Sales Scheme Free, Purch Scheme Deal, Purch Scheme Free
          </code>
          <span className="ml-1 text-[11px] text-[#94A3B8]">
            (Optional: MRP, Pack, Batch, Expiry, HSN, GST%)
          </span>
        </div>

        {/* Drag & Drop Box */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-[8px] cursor-pointer transition-colors text-center ${
            isDragOver
              ? "border-[#2563EB] bg-blue-50/40"
              : "border-[#CBD5E1] bg-[#F8FAFC]/50 hover:bg-[#F1F5F9]/60"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="h-12 w-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB] mb-3">
            <UploadCloud className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-[#0F172A]">
            {isParsing ? "Parsing STOCKS.csv..." : "Click to browse or drag & drop STOCKS.csv here"}
          </p>
          <p className="text-xs text-[#64748B] mt-1">
            Supports comma-separated .csv files up to 10MB
          </p>
        </div>

        {/* Import Status Alert */}
        {importStatus && (
          <div
            className={`flex items-center gap-2 p-3 rounded-[6px] text-xs ${
              importStatus.success
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {importStatus.success ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
            )}
            <span>{importStatus.message}</span>
          </div>
        )}
      </div>

      {/* Searchable Product List Table After Import */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A]">
              Current Stock Catalog ({stocks.length})
            </h2>
            <p className="text-xs text-[#64748B]">
              Searchable live inventory list available for bill generation.
            </p>
          </div>
          <Link href="/stock" className="text-xs font-medium text-[#2563EB] hover:underline flex items-center gap-1">
            View full stock manager
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <StockTable
          stocks={stocks}
          onUpdateStocks={(updated) => {
            setStocks(updated);
            saveStoredStocks(updated);
          }}
        />
      </div>
    </div>
  );
}

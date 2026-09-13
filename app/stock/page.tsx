"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { UploadCloud, PlusCircle } from "lucide-react";
import { StockItem } from "@/lib/types";
import { getStoredStocks, saveStoredStocks, fetchFullCatalogStocks } from "@/lib/storage";
import { StockTable } from "@/components/StockTable";
import { Button } from "@/components/ui/Button";

export default function StockPage() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loaded = getStoredStocks();
    if (loaded.length <= 15) {
      fetchFullCatalogStocks().then((full) => {
        setStocks(full);
        setIsLoaded(true);
      });
    } else {
      setStocks(loaded);
      setIsLoaded(true);
    }
  }, []);

  const handleUpdateStocks = (updated: StockItem[]) => {
    setStocks(updated);
    saveStoredStocks(updated);
  };

  const lowStockCount = stocks.filter((s) => s.currentStock < 10).length;
  const outOfStockCount = stocks.filter((s) => s.currentStock <= 0).length;
  const totalStockUnits = stocks.reduce((acc, s) => acc + (s.currentStock || 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#0F172A]">
              Pharmaceutical Stock Inventory
            </h1>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#2563EB] border border-blue-200">
              {stocks.length} Products
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Manage your medicine catalog, stock levels, batches, and export updated stocks as CSV.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="outline" size="sm">
              <UploadCloud className="h-4 w-4 mr-1.5" />
              Import STOCKS.csv
            </Button>
          </Link>
          <Link href="/bill/new">
            <Button variant="primary" size="sm">
              <PlusCircle className="h-4 w-4 mr-1.5" />
              New Bill
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-[8px] border border-[#E2E8F0] bg-white p-4">
          <div className="text-xs text-[#64748B]">Total Unique Medicines</div>
          <div className="text-2xl font-bold text-[#0F172A] mt-1 font-mono">
            {stocks.length}
          </div>
        </div>

        <div className="rounded-[8px] border border-[#E2E8F0] bg-white p-4">
          <div className="text-xs text-[#64748B]">Total Units in Stock</div>
          <div className="text-2xl font-bold text-[#2563EB] mt-1 font-mono">
            {totalStockUnits.toLocaleString("en-IN")}
          </div>
        </div>

        <div className="rounded-[8px] border border-[#E2E8F0] bg-white p-4">
          <div className="text-xs text-[#64748B]">Low Stock Alerts (&lt;10)</div>
          <div className="text-2xl font-bold text-amber-600 mt-1 font-mono flex items-center gap-2">
            {lowStockCount}
            {lowStockCount > 0 && (
              <span className="text-[10px] font-normal text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                Action Required
              </span>
            )}
          </div>
        </div>

        <div className="rounded-[8px] border border-[#E2E8F0] bg-white p-4">
          <div className="text-xs text-[#64748B]">Out of Stock (0)</div>
          <div className="text-2xl font-bold text-rose-600 mt-1 font-mono">
            {outOfStockCount}
          </div>
        </div>
      </div>

      {/* Stock Table with 50/page pagination, low-stock badges, search, export */}
      {isLoaded && (
        <StockTable stocks={stocks} onUpdateStocks={handleUpdateStocks} />
      )}
    </div>
  );
}

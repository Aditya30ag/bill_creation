"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, Package, X } from "lucide-react";
import { StockItem } from "@/lib/types";
import { Badge } from "./ui/Badge";
import { cn, formatCurrency } from "@/lib/utils";

interface ProductSearchProps {
  stocks: StockItem[];
  onSelectProduct: (product: StockItem) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function ProductSearch({
  stocks,
  onSelectProduct,
  placeholder = "Search product by medicine name or code (e.g. AZITHRAL, DOLO, AUGMENTIN)...",
  autoFocus = false,
}: ProductSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter stocks based on query (code or name)
  const filteredStocks = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return stocks
      .filter((s) => {
        const codeMatch = s.code.toLowerCase().includes(q);
        const nameMatch = s.productName.toLowerCase().includes(q);
        return codeMatch || nameMatch;
      })
      .slice(0, 15); // limit to 15 for fast performance
  }, [stocks, query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredStocks]);

  const handleSelect = (stock: StockItem) => {
    onSelectProduct(stock);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredStocks.length === 0) {
      if (e.key === "ArrowDown" && filteredStocks.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredStocks.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredStocks.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredStocks[highlightedIndex]) {
        handleSelect(filteredStocks[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative flex items-center">
        <div className="pointer-events-none absolute left-3 flex items-center text-[#64748B]">
          <Search className="h-4 w-4" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="h-10 w-full rounded-[6px] border border-[#E2E8F0] bg-white pl-9 pr-8 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB] transition-colors"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 text-[#94A3B8] hover:text-[#0F172A]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && query.trim().length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-80 w-full overflow-y-auto rounded-[8px] border border-[#E2E8F0] bg-white shadow-lg">
          {filteredStocks.length === 0 ? (
            <div className="p-4 text-center text-sm text-[#64748B]">
              <Package className="mx-auto mb-1 h-6 w-6 text-[#94A3B8]" />
              No matching products found in stock for &quot;{query}&quot;
            </div>
          ) : (
            <div className="py-1">
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#64748B] bg-[#F8FAFC] border-b border-[#E2E8F0] flex justify-between">
                <span>Select Medicine / Stock Item</span>
                <span>Matches: {filteredStocks.length}</span>
              </div>
              {filteredStocks.map((stock, index) => {
                const isSelected = index === highlightedIndex;
                const isLow = stock.currentStock < 10;
                const isOut = stock.currentStock <= 0;

                return (
                  <div
                    key={stock.id || stock.code}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => handleSelect(stock)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors border-b border-slate-100 last:border-0",
                      isSelected ? "bg-[#EFF6FF] text-[#1D4ED8]" : "hover:bg-[#F8FAFC] text-[#0F172A]"
                    )}
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#2563EB] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                          {stock.code}
                        </span>
                        <span className="font-medium text-[#0F172A] truncate">
                          {stock.productName}
                        </span>
                        {stock.pack && (
                          <span className="text-xs text-[#64748B] bg-slate-100 px-1.5 py-0.5 rounded">
                            {stock.pack}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-[#64748B]">
                        <span>Unit: <strong>{stock.unit}</strong></span>
                        {stock.batch && <span>Batch: {stock.batch}</span>}
                        {stock.expiry && <span>Exp: {stock.expiry}</span>}
                        {stock.salesSchemeDeal > 0 && stock.salesSchemeFree > 0 && (
                          <span className="text-emerald-600 font-medium">
                            Scheme: {stock.salesSchemeDeal}+{stock.salesSchemeFree}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right shrink-0">
                      <div>
                        <div className="font-semibold text-[#0F172A]">
                          {formatCurrency(stock.mrp ?? 0)}
                        </div>
                        <div className="text-[11px] text-[#64748B]">MRP</div>
                      </div>

                      <div className="w-24 text-right">
                        {isOut ? (
                          <Badge variant="danger" className="text-[11px]">
                            Out of Stock
                          </Badge>
                        ) : isLow ? (
                          <Badge variant="low-stock" className="text-[11px]">
                            {stock.currentStock} left
                          </Badge>
                        ) : (
                          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {stock.currentStock} in stock
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

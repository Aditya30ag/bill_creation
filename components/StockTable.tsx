"use client";

import React, { useState, useMemo } from "react";
import { Search, Download, Plus, AlertTriangle, ChevronLeft, ChevronRight, Edit2, Check, X } from "lucide-react";
import { StockItem } from "@/lib/types";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { formatCurrency } from "@/lib/utils";
import { exportStocksToCsv, downloadFile } from "@/lib/storage";

interface StockTableProps {
  stocks: StockItem[];
  onUpdateStocks: (stocks: StockItem[]) => void;
}

export function StockTable({ stocks, onUpdateStocks }: StockTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Quick inline stock edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStockValue, setEditStockValue] = useState<number>(0);
  const [editMrpValue, setEditMrpValue] = useState<number>(0);

  // Add Product Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<StockItem>>({
    code: "",
    productName: "",
    unit: "1x10's",
    pack: "10 Tab",
    currentStock: 100,
    mrp: 120,
    batch: "BT" + Math.floor(1000 + Math.random() * 9000),
    expiry: "12/26",
    hsn: "300490",
    salesSchemeDeal: 10,
    salesSchemeFree: 1,
    purchSchemeDeal: 10,
    purchSchemeFree: 1,
    gstPercent: 12,
  });

  // Filtered list
  const filteredStocks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return stocks.filter((item) => {
      const matchesSearch =
        !q ||
        item.code.toLowerCase().includes(q) ||
        item.productName.toLowerCase().includes(q) ||
        (item.batch && item.batch.toLowerCase().includes(q));

      const matchesLow = onlyLowStock ? item.currentStock < 10 : true;

      return matchesSearch && matchesLow;
    });
  }, [stocks, searchQuery, onlyLowStock]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredStocks.length / pageSize));
  const paginatedStocks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStocks.slice(start, start + pageSize);
  }, [filteredStocks, currentPage, pageSize]);

  const lowStockCount = useMemo(() => {
    return stocks.filter((s) => s.currentStock < 10).length;
  }, [stocks]);

  const handleExportCsv = () => {
    const csvData = exportStocksToCsv(stocks);
    const dateStr = new Date().toISOString().split("T")[0];
    downloadFile(csvData, `STOCKS_EXPORT_${dateStr}.csv`);
  };

  const handleStartEdit = (item: StockItem) => {
    setEditingId(item.id);
    setEditStockValue(item.currentStock);
    setEditMrpValue(item.mrp ?? 0);
  };

  const handleSaveEdit = (itemId: string) => {
    const updated = stocks.map((s) => {
      if (s.id === itemId) {
        return {
          ...s,
          currentStock: Math.max(0, editStockValue),
          mrp: Math.max(0, editMrpValue),
        };
      }
      return s;
    });
    onUpdateStocks(updated);
    setEditingId(null);
  };

  const handleAddNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.code || !newProduct.productName) {
      alert("Please enter product code and name");
      return;
    }

    const itemToAdd: StockItem = {
      id: `stk-${Date.now()}`,
      code: newProduct.code.trim().toUpperCase(),
      productName: newProduct.productName.trim(),
      unit: newProduct.unit || "1x10's",
      pack: newProduct.pack || "10 Tab",
      currentStock: Number(newProduct.currentStock) || 0,
      mrp: Number(newProduct.mrp) || 0,
      batch: newProduct.batch || "BT100",
      expiry: newProduct.expiry || "12/26",
      hsn: newProduct.hsn || "300490",
      salesSchemeDeal: Number(newProduct.salesSchemeDeal) || 0,
      salesSchemeFree: Number(newProduct.salesSchemeFree) || 0,
      purchSchemeDeal: Number(newProduct.purchSchemeDeal) || 0,
      purchSchemeFree: Number(newProduct.purchSchemeFree) || 0,
      gstPercent: Number(newProduct.gstPercent) || 12,
    };

    onUpdateStocks([itemToAdd, ...stocks]);
    setShowAddModal(false);
    setNewProduct({
      code: "",
      productName: "",
      unit: "1x10's",
      pack: "10 Tab",
      currentStock: 100,
      mrp: 120,
      batch: "BT" + Math.floor(1000 + Math.random() * 9000),
      expiry: "12/26",
      hsn: "300490",
      salesSchemeDeal: 10,
      salesSchemeFree: 1,
      purchSchemeDeal: 10,
      purchSchemeFree: 1,
      gstPercent: 12,
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-[8px] border border-[#E2E8F0]">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search by name, code, or batch..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 w-full rounded-[6px] border border-[#E2E8F0] bg-white pl-9 pr-3 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setOnlyLowStock(!onlyLowStock);
              setCurrentPage(1);
            }}
            className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-[6px] text-xs font-medium border transition-colors ${
              onlyLowStock
                ? "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]"
                : "bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Low Stock (&lt;10)</span>
            <span className="ml-1 rounded-full bg-amber-200/60 px-1.5 py-0.2 text-[10px] font-bold">
              {lowStockCount}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="h-3.5 w-3.5 mr-1" />
            Export CSV
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="overflow-hidden rounded-[8px] border border-[#E2E8F0] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase font-semibold text-[11px]">
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3">Unit / Pack</th>
                <th className="py-2.5 px-3">Batch &amp; Exp</th>
                <th className="py-2.5 px-3 text-right">MRP</th>
                <th className="py-2.5 px-3 text-center">Sales Scheme</th>
                <th className="py-2.5 px-3 text-center">Current Stock</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {paginatedStocks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#64748B]">
                    No stock products found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedStocks.map((item) => {
                  const isEditing = editingId === item.id;
                  const isLow = item.currentStock < 10;
                  const isOut = item.currentStock <= 0;

                  return (
                    <tr key={item.id || item.code} className="hover:bg-[#F8FAFC]/80 transition-colors">
                      {/* Code */}
                      <td className="py-2.5 px-3 font-mono font-semibold text-[#2563EB]">
                        {item.code}
                      </td>

                      {/* Name */}
                      <td className="py-2.5 px-3 font-medium text-[#0F172A] max-w-[280px]">
                        <div>{item.productName}</div>
                        {item.hsn && (
                          <div className="text-[10px] text-[#64748B]">HSN: {item.hsn} • GST: {item.gstPercent || 12}%</div>
                        )}
                      </td>

                      {/* Unit / Pack */}
                      <td className="py-2.5 px-3 text-[#64748B]">
                        <span className="font-medium text-[#0F172A]">{item.unit}</span>
                        {item.pack && <span className="text-[11px] block">{item.pack}</span>}
                      </td>

                      {/* Batch & Exp */}
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        <div>{item.batch || "-"}</div>
                        <div className="text-[11px] text-[#64748B]">Exp: {item.expiry || "-"}</div>
                      </td>

                      {/* MRP */}
                      <td className="py-2.5 px-3 text-right font-medium text-[#0F172A]">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editMrpValue}
                            onChange={(e) => setEditMrpValue(parseFloat(e.target.value) || 0)}
                            className="w-20 h-7 text-right px-1 border border-[#2563EB] rounded"
                          />
                        ) : (
                          formatCurrency(item.mrp ?? 0)
                        )}
                      </td>

                      {/* Sales Scheme */}
                      <td className="py-2.5 px-3 text-center text-[#64748B]">
                        {item.salesSchemeDeal > 0 && item.salesSchemeFree > 0 ? (
                          <span className="inline-block bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700">
                            {item.salesSchemeDeal} + {item.salesSchemeFree}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Current Stock */}
                      <td className="py-2.5 px-3 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editStockValue}
                            onChange={(e) => setEditStockValue(parseInt(e.target.value, 10) || 0)}
                            className="w-16 h-7 text-center px-1 border border-[#2563EB] rounded font-bold"
                          />
                        ) : (
                          <span className={`font-bold ${isLow ? "text-amber-600" : "text-[#0F172A]"}`}>
                            {item.currentStock}
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-2.5 px-3 text-center">
                        {isOut ? (
                          <Badge variant="danger" className="text-[10px]">
                            Out of Stock
                          </Badge>
                        ) : isLow ? (
                          <Badge variant="low-stock" className="text-[10px]">
                            Low (&lt;10)
                          </Badge>
                        ) : (
                          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            In Stock
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSaveEdit(item.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Save"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="inline-flex items-center gap-1 text-[11px] text-[#64748B] hover:text-[#2563EB] hover:bg-slate-100 px-2 py-1 rounded transition-colors"
                          >
                            <Edit2 className="h-3 w-3" />
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Count footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#E2E8F0] px-4 py-3 bg-[#F8FAFC] text-xs text-[#64748B]">
          <div>
            Showing <span className="font-medium text-[#0F172A]">{filteredStocks.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to{" "}
            <span className="font-medium text-[#0F172A]">{Math.min(currentPage * pageSize, filteredStocks.length)}</span> of{" "}
            <span className="font-medium text-[#0F172A]">{filteredStocks.length}</span> products
            {stocks.length !== filteredStocks.length && ` (filtered from ${stocks.length} total)`}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <span className="text-xs px-2">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-[8px] bg-white border border-[#E2E8F0] shadow-lg overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-3.5">
              <h3 className="font-semibold text-sm text-[#0F172A]">Add Medicine / Product to Stock</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewProduct} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#475569] font-medium mb-1">Product Code *</label>
                  <Input
                    required
                    value={newProduct.code}
                    onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })}
                    placeholder="e.g. AZI500"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-medium mb-1">Product Name *</label>
                  <Input
                    required
                    value={newProduct.productName}
                    onChange={(e) => setNewProduct({ ...newProduct, productName: e.target.value })}
                    placeholder="e.g. Azithral 500mg Tab"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#475569] font-medium mb-1">Unit</label>
                  <Input
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    placeholder="1x10's"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-medium mb-1">Current Stock</label>
                  <Input
                    type="number"
                    value={newProduct.currentStock}
                    onChange={(e) => setNewProduct({ ...newProduct, currentStock: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-medium mb-1">MRP (₹)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newProduct.mrp}
                    onChange={(e) => setNewProduct({ ...newProduct, mrp: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#475569] font-medium mb-1">Batch</label>
                  <Input
                    value={newProduct.batch}
                    onChange={(e) => setNewProduct({ ...newProduct, batch: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-medium mb-1">Expiry (MM/YY)</label>
                  <Input
                    value={newProduct.expiry}
                    onChange={(e) => setNewProduct({ ...newProduct, expiry: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-medium mb-1">GST %</label>
                  <select
                    value={newProduct.gstPercent}
                    onChange={(e) => setNewProduct({ ...newProduct, gstPercent: parseFloat(e.target.value) || 12 })}
                    className="w-full h-9 rounded-[6px] border border-[#E2E8F0] px-2 text-xs bg-white"
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[#475569] font-medium mb-1">Sales Scheme Deal</label>
                  <Input
                    type="number"
                    value={newProduct.salesSchemeDeal}
                    onChange={(e) => setNewProduct({ ...newProduct, salesSchemeDeal: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-medium mb-1">Sales Scheme Free</label>
                  <Input
                    type="number"
                    value={newProduct.salesSchemeFree}
                    onChange={(e) => setNewProduct({ ...newProduct, salesSchemeFree: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#E2E8F0]">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Add to Stock
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

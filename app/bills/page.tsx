"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ReceiptText,
  Search,
  Eye,
  Printer,
  Trash2,
  PlusCircle,
} from "lucide-react";
import { Bill } from "@/lib/types";
import { getStoredBills, deleteBill } from "@/lib/storage";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { InvoicePrint } from "@/components/InvoicePrint";

export default function BillListPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Selected Bill for View / Print Modal
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);

  useEffect(() => {
    const loaded = getStoredBills();
    setBills(loaded);
  }, []);

  const filteredBills = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bills.filter((bill) => {
      const matchSearch =
        !q ||
        bill.invoiceNo.toLowerCase().includes(q) ||
        bill.customer.name.toLowerCase().includes(q) ||
        (bill.customer.phone && bill.customer.phone.toLowerCase().includes(q));

      const matchStatus =
        statusFilter === "all" ||
        bill.status.toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchStatus;
    });
  }, [bills, searchQuery, statusFilter]);

  const handleDelete = (bill: Bill) => {
    deleteBill(bill.id);
    setBills((prev) => prev.filter((b) => b.id !== bill.id));
    setBillToDelete(null);
  };

  const totalRevenue = useMemo(() => {
    return bills.reduce((sum, b) => sum + (b.summary.grandTotal || 0), 0);
  }, [bills]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#0F172A]">
              Bill History &amp; Invoices
            </h1>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-[#475569]">
              {bills.length} Total Bills
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            View, print, and manage all generated GST pharmaceutical invoices for Siddharth Medical Agency.
          </p>
        </div>

        <Link href="/bill/new">
          <Button variant="primary" size="sm">
            <PlusCircle className="h-4 w-4 mr-1.5" />
            Create New Bill
          </Button>
        </Link>
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-[8px] border border-[#E2E8F0] bg-white p-4">
          <div className="text-xs text-[#64748B]">Total Invoices Generated</div>
          <div className="text-2xl font-bold text-[#0F172A] mt-1 font-mono">
            {bills.length}
          </div>
        </div>
        <div className="rounded-[8px] border border-[#E2E8F0] bg-white p-4">
          <div className="text-xs text-[#64748B]">Total Revenue Billed</div>
          <div className="text-2xl font-bold text-[#2563EB] mt-1 font-mono">
            {formatCurrency(totalRevenue)}
          </div>
        </div>
        <div className="rounded-[8px] border border-[#E2E8F0] bg-white p-4">
          <div className="text-xs text-[#64748B]">Latest Invoice Issued</div>
          <div className="text-2xl font-bold text-slate-800 mt-1 font-mono">
            {bills[0]?.invoiceNo || "None"}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-[8px] border border-[#E2E8F0]">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search by Invoice No (e.g. A006603) or Customer Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-[6px] border border-[#E2E8F0] bg-white pl-9 pr-3 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748B]">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-[6px] border border-[#E2E8F0] px-3 text-xs bg-white text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="overflow-hidden rounded-[8px] border border-[#E2E8F0] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold text-[11px] uppercase">
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer / Pharmacy</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-right">Taxable Val</th>
                <th className="py-3 px-4 text-right">GST</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#64748B]">
                    <ReceiptText className="mx-auto mb-2 h-8 w-8 text-[#94A3B8]" />
                    <p className="font-semibold text-sm text-[#0F172A]">No bills found</p>
                    <p className="text-xs mt-1 text-[#94A3B8]">
                      {bills.length === 0
                        ? "You haven't generated any bills yet. Click 'Create New Bill' to start."
                        : "No invoices matched your search criteria."}
                    </p>
                    {bills.length === 0 && (
                      <Link href="/bill/new" className="inline-block mt-3">
                        <Button variant="primary" size="sm">
                          <PlusCircle className="h-4 w-4 mr-1.5" />
                          Create First Bill
                        </Button>
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-[#F8FAFC] transition-colors">
                    {/* Invoice No */}
                    <td className="py-3 px-4 font-mono font-bold text-[#2563EB]">
                      {bill.invoiceNo}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-[#64748B]">
                      {bill.date}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4 font-medium text-[#0F172A]">
                      <div>{bill.customer.name}</div>
                      {bill.customer.phone && (
                        <div className="text-[10px] text-[#64748B]">{bill.customer.phone}</div>
                      )}
                    </td>

                    {/* Items count */}
                    <td className="py-3 px-4 text-center text-[#64748B]">
                      {bill.items.length} items
                    </td>

                    {/* Taxable */}
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      ₹{formatNumber(bill.summary.taxableAmount)}
                    </td>

                    {/* GST */}
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      ₹{formatNumber(bill.summary.totalGst)}
                    </td>

                    {/* Grand Total */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#0F172A] text-sm">
                      {formatCurrency(bill.summary.grandTotal)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant={
                          bill.status === "Paid"
                            ? "success"
                            : bill.status === "Pending"
                            ? "low-stock"
                            : "danger"
                        }
                      >
                        {bill.status}
                      </Badge>
                    </td>

                    {/* Actions: View, Print, Delete */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedBill(bill);
                            setShowPrintModal(true);
                          }}
                          className="p-1.5 text-[#64748B] hover:text-[#2563EB] hover:bg-slate-100 rounded transition-colors"
                          title="View Invoice"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedBill(bill);
                            setShowPrintModal(true);
                          }}
                          className="p-1.5 text-[#64748B] hover:text-[#2563EB] hover:bg-slate-100 rounded transition-colors"
                          title="Print Invoice (A4)"
                        >
                          <Printer className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => setBillToDelete(bill)}
                          className="p-1.5 text-[#64748B] hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Bill"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print / View Modal */}
      {showPrintModal && selectedBill && (
        <Dialog
          open={showPrintModal}
          onOpenChange={setShowPrintModal}
          maxWidth="4xl"
          title={`Invoice ${selectedBill.invoiceNo}`}
          description={`Customer: ${selectedBill.customer.name} | Date: ${selectedBill.date}`}
        >
          <InvoicePrint
            bill={selectedBill}
            onBack={() => setShowPrintModal(false)}
          />
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      {billToDelete && (
        <Dialog
          open={!!billToDelete}
          onOpenChange={() => setBillToDelete(null)}
          maxWidth="sm"
          title="Delete Invoice"
          description="Are you sure you want to delete this invoice? This action cannot be undone."
        >
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-red-50 text-xs text-red-800 rounded border border-red-200">
              Invoice No: <strong>{billToDelete.invoiceNo}</strong>
              <br />
              Customer: <strong>{billToDelete.customer.name}</strong>
              <br />
              Amount: <strong>{formatCurrency(billToDelete.summary.grandTotal)}</strong>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBillToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(billToDelete)}
              >
                Delete Permanently
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

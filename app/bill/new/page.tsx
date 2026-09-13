"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  User,
  Plus,
  Save,
  Printer,
  FileCheck,
  RefreshCw,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import { StockItem, CustomerInfo, LineItem, Bill } from "@/lib/types";
import {
  DEFAULT_SUPPLIER,
  DEFAULT_TERMS,
  calculateInvoiceSummary,
  calculateLineItem,
  getNextInvoiceNumber,
  formatCurrency,
  formatNumber,
} from "@/lib/utils";
import {
  getStoredStocks,
  getStoredBills,
  saveBillAndDeductStock,
  fetchFullCatalogStocks,
} from "@/lib/storage";
import { ProductSearch } from "@/components/ProductSearch";
import { LineItemRow } from "@/components/LineItemRow";
import { InvoicePrint } from "@/components/InvoicePrint";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";

export default function NewBillPage() {
  const router = useRouter();

  // Stock items from localStorage
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");

  // Customer details
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: "",
    address: "",
    phone: "",
    gstin: "",
    dlNumber: "",
    state: "Uttar Pradesh",
    stateCode: "09",
  });

  // Invoice metadata
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMode, setPaymentMode] = useState<"Cash" | "Credit" | "UPI" | "Cheque">("Credit");
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  });

  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Terms & conditions
  const [terms] = useState<string[]>(DEFAULT_TERMS);

  // Print Dialog after save
  const [savedBill, setSavedBill] = useState<Bill | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>("");

  // Initialize data from localStorage
  useEffect(() => {
    const loadedStocks = getStoredStocks();
    const loadedBills = getStoredBills();
    if (loadedStocks.length <= 15) {
      fetchFullCatalogStocks().then((full) => {
        setStocks(full);
      });
    } else {
      setStocks(loadedStocks);
    }

    const nextInv = getNextInvoiceNumber(loadedBills.map((b) => b.invoiceNo));
    setInvoiceNumber(nextInv);
  }, []);

  // Summary calculation
  const summary = calculateInvoiceSummary(lineItems);

  // Add Product to line items from search
  const handleSelectProduct = (product: StockItem) => {
    setFormError("");
    const defaultQty = 1;
    const defaultDisPercent = 0;
    const defaultGstPercent = product.gstPercent ?? 12;
    const mrp = product.mrp ?? 100;

    const calc = calculateLineItem(mrp, defaultQty, defaultDisPercent, defaultGstPercent);

    const newItem: LineItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sr: lineItems.length + 1,
      productCode: product.code,
      productName: product.productName,
      pack: product.pack || product.unit || "1x10",
      batch: product.batch || `BT${Math.floor(1000 + Math.random() * 9000)}`,
      expiry: product.expiry || "12/26",
      hsn: product.hsn || "300490",
      mrp: mrp,
      qty: defaultQty,
      freeQty: 0,
      rate: calc.rate,
      discountPercent: defaultDisPercent,
      gstPercent: defaultGstPercent,
      amount: calc.amount,
      taxableValue: calc.taxableValue,
      cgstAmount: calc.cgstAmount,
      sgstAmount: calc.sgstAmount,
    };

    setLineItems((prev) => [...prev, newItem]);
  };

  // Update a line item
  const handleUpdateItem = (updated: LineItem) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
  };

  // Remove a line item
  const handleRemoveItem = (id: string) => {
    setLineItems((prev) =>
      prev.filter((item) => item.id !== id).map((item, idx) => ({ ...item, sr: idx + 1 }))
    );
  };

  // Add a blank row if user wants manual entry
  const handleAddBlankRow = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sr: lineItems.length + 1,
      productCode: "MANUAL",
      productName: "New Item",
      pack: "1x10",
      batch: "BT001",
      expiry: "12/26",
      hsn: "300490",
      mrp: 0,
      qty: 1,
      rate: 0,
      discountPercent: 0,
      gstPercent: 12,
      amount: 0,
      taxableValue: 0,
      cgstAmount: 0,
      sgstAmount: 0,
    };
    setLineItems((prev) => [...prev, newItem]);
  };

  // Save Bill
  const handleSaveBill = (andPrint: boolean = false) => {
    setFormError("");

    if (!customer.name.trim()) {
      setFormError("Please enter customer / pharmacy name.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (lineItems.length === 0) {
      setFormError("Please add at least one product line item to generate bill.");
      return;
    }

    // Check invalid quantities
    const invalidQty = lineItems.find((item) => item.qty <= 0);
    if (invalidQty) {
      setFormError(`Please enter a valid quantity for ${invalidQty.productName}.`);
      return;
    }

    setIsSaving(true);

    const newBill: Bill = {
      id: `bill-${Date.now()}`,
      invoiceNo: invoiceNumber,
      date: invoiceDate,
      dueDate: paymentMode === "Credit" ? dueDate : undefined,
      paymentMode,
      supplier: DEFAULT_SUPPLIER,
      customer,
      items: lineItems,
      summary,
      terms,
      status: "Paid",
      createdAt: new Date().toISOString(),
    };

    const result = saveBillAndDeductStock(newBill);

    if (result.success) {
      // Reload stocks and generate next sequence
      const updatedStocks = getStoredStocks();
      setStocks(updatedStocks);
      setSavedBill(newBill);

      if (andPrint) {
        setShowPrintModal(true);
      } else {
        // Redirect to bill list after short toast
        router.push("/bills");
      }
    } else {
      setFormError(result.error || "Failed to save bill. Please try again.");
    }
    setIsSaving(false);
  };

  const handleResetForm = () => {
    if (lineItems.length > 0 && !confirm("Clear current bill draft?")) {
      return;
    }
    setLineItems([]);
    setCustomer({
      name: "",
      address: "",
      phone: "",
      gstin: "",
      dlNumber: "",
      state: "Uttar Pradesh",
      stateCode: "09",
    });
    const loadedBills = getStoredBills();
    setInvoiceNumber(getNextInvoiceNumber(loadedBills.map((b) => b.invoiceNo)));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#0F172A]">
              Create New GST Medical Bill
            </h1>
            <span className="font-mono font-semibold text-xs text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Invoice #{invoiceNumber}
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Create pharmaceutical tax invoice with live stock lookup, GST calculation, and auto stock deduction.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={handleResetForm}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleSaveBill(false)}
            disabled={isSaving}
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            Save Draft
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSaveBill(true)}
            disabled={isSaving}
          >
            <Printer className="h-3.5 w-3.5 mr-1" />
            Save &amp; Print
          </Button>
        </div>
      </div>

      {formError && (
        <div className="flex items-center gap-2 rounded-[6px] border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Grid: Supplier Banner & Invoice Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Supplier Info Card */}
        <div className="md:col-span-2 rounded-[8px] border border-[#E2E8F0] bg-white p-4 text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#2563EB]" />
              <span className="font-bold text-sm text-[#0F172A]">
                {DEFAULT_SUPPLIER.name}
              </span>
            </div>
            <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
              Supplier Verified
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#64748B]">
            <div>
              <p className="text-[#0F172A] font-medium">{DEFAULT_SUPPLIER.address}</p>
              <p className="mt-0.5">Phone: {DEFAULT_SUPPLIER.phone}</p>
              <p>Email: {DEFAULT_SUPPLIER.email}</p>
            </div>
            <div className="space-y-0.5">
              <p>GSTIN: <span className="font-mono font-semibold text-[#0F172A]">{DEFAULT_SUPPLIER.gstin}</span></p>
              <p>D.L. No: <span className="font-mono text-[#0F172A]">{DEFAULT_SUPPLIER.dlNo}</span></p>
              <p>State: <span className="text-[#0F172A]">{DEFAULT_SUPPLIER.state} (Code: {DEFAULT_SUPPLIER.stateCode})</span></p>
            </div>
          </div>
        </div>

        {/* Invoice Metadata Card */}
        <div className="rounded-[8px] border border-[#E2E8F0] bg-white p-4 text-xs space-y-3">
          <div className="font-semibold text-xs text-[#0F172A] border-b border-[#E2E8F0] pb-1.5 flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-[#2563EB]" />
            <span>Invoice Details</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-[#64748B] block mb-1">Invoice Date</label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] text-[#64748B] block mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as "Cash" | "Credit" | "UPI" | "Cheque")}
                className="w-full h-9 rounded-[6px] border border-[#E2E8F0] px-2 text-xs bg-white text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
              >
                <option value="Cash">Cash</option>
                <option value="Credit">Credit</option>
                <option value="UPI">UPI</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          {paymentMode === "Credit" && (
            <div>
              <label className="text-[11px] text-[#64748B] block mb-1">Credit Due Date</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Customer Section */}
      <div className="rounded-[8px] border border-[#E2E8F0] bg-white p-4 space-y-3">
        <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
          <User className="h-4 w-4 text-[#2563EB]" />
          <h2 className="text-sm font-semibold text-[#0F172A]">
            Customer / Pharmacy Details
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-[#475569] mb-1">
              Customer / Chemist Name *
            </label>
            <Input
              required
              placeholder="e.g. Anand Medical Stores"
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#475569] mb-1">
              Phone Number
            </label>
            <Input
              placeholder="e.g. +91 98765 43210"
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#475569] mb-1">
              GSTIN (Optional)
            </label>
            <Input
              placeholder="e.g. 09AABCA1234F1Z5"
              className="uppercase font-mono"
              value={customer.gstin}
              onChange={(e) => setCustomer({ ...customer, gstin: e.target.value.toUpperCase() })}
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#475569] mb-1">
              Drug License (D.L.) No (Optional)
            </label>
            <Input
              placeholder="e.g. 20B/21B-49210"
              className="uppercase font-mono"
              value={customer.dlNumber}
              onChange={(e) => setCustomer({ ...customer, dlNumber: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[#475569] mb-1">
            Address / City
          </label>
          <Input
            placeholder="e.g. Main Market, Lalganj, Pratapgarh - 230132"
            value={customer.address}
            onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
          />
        </div>
      </div>

      {/* Product Autocomplete Search & Add Line Item */}
      <div className="rounded-[8px] border border-[#E2E8F0] bg-white p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-[#0F172A]">
              Add Products from Stock
            </h2>
            <p className="text-xs text-[#64748B]">
              Type medicine name or product code to search and auto-fill line items.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleAddBlankRow}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Custom Row
          </Button>
        </div>

        <ProductSearch stocks={stocks} onSelectProduct={handleSelectProduct} />
      </div>

      {/* Line Items Table */}
      <div className="rounded-[8px] border border-[#E2E8F0] bg-white overflow-hidden">
        <div className="border-b border-[#E2E8F0] px-4 py-3 bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-[#2563EB]" />
            <h3 className="font-semibold text-xs uppercase tracking-wider text-[#475569]">
              Bill Line Items ({lineItems.length})
            </h3>
          </div>
          <span className="text-xs text-[#64748B]">
            Formula: Rate = MRP − (MRP × Dis%), Amount = Rate × Qty + GST
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold text-[11px] uppercase">
                <th className="py-2 px-3 text-center w-10">Sr</th>
                <th className="py-2 px-3 min-w-[180px]">Product Name</th>
                <th className="py-2 px-2 w-20">Pack</th>
                <th className="py-2 px-2 w-24">Batch</th>
                <th className="py-2 px-2 w-20">Expiry</th>
                <th className="py-2 px-2 text-right w-24">MRP (₹)</th>
                <th className="py-2 px-2 text-center w-20">Qty</th>
                <th className="py-2 px-3 text-right w-24">Rate (₹)</th>
                <th className="py-2 px-2 text-right w-20">Dis %</th>
                <th className="py-2 px-2 text-center w-20">GST %</th>
                <th className="py-2 px-3 text-right w-28">Amount (₹)</th>
                <th className="py-2 px-2 text-center w-10"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-10 text-center text-[#64748B]">
                    <p className="font-medium text-sm text-[#0F172A]">No products added yet</p>
                    <p className="text-xs mt-1 text-[#94A3B8]">
                      Use the search bar above to select medicines from stock, or click &quot;Add Custom Row&quot;.
                    </p>
                  </td>
                </tr>
              ) : (
                lineItems.map((item, index) => (
                  <LineItemRow
                    key={item.id}
                    item={item}
                    index={index}
                    onUpdate={handleUpdateItem}
                    onRemove={handleRemoveItem}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Section: Terms & Conditions on Left, Invoice Summary on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Terms & Conditions (Left 6 Cols) */}
        <div className="lg:col-span-6 rounded-[8px] border border-[#E2E8F0] bg-white p-4 space-y-3">
          <h3 className="font-semibold text-xs uppercase tracking-wider text-[#475569] border-b border-[#E2E8F0] pb-2">
            Terms &amp; Conditions
          </h3>
          <div className="space-y-1.5 text-xs text-[#64748B]">
            {terms.map((term, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[#2563EB] font-bold">•</span>
                <span>{term}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#E2E8F0] text-[11px] text-[#64748B]">
            <strong>Bank Account:</strong> State Bank of India | <strong>A/c:</strong> 38920109923 | <strong>IFSC:</strong> SBIN0000160
          </div>
        </div>

        {/* Calculations & Grand Total (Right 6 Cols) */}
        <div className="lg:col-span-6 rounded-[8px] border border-[#E2E8F0] bg-white p-5 space-y-3">
          <h3 className="font-semibold text-xs uppercase tracking-wider text-[#475569] border-b border-[#E2E8F0] pb-2">
            Bill Summary &amp; Tax Calculation
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-[#64748B]">
              <span>Gross MRP Total:</span>
              <span className="font-mono text-[#0F172A]">₹{formatNumber(summary.grossAmount)}</span>
            </div>

            <div className="flex justify-between text-[#64748B]">
              <span>Total Discount:</span>
              <span className="font-mono text-emerald-600 font-medium">
                -₹{formatNumber(summary.totalDiscount)}
              </span>
            </div>

            <div className="flex justify-between text-[#64748B] border-t border-[#E2E8F0] pt-1.5">
              <span>Subtotal (Taxable Value):</span>
              <span className="font-mono font-medium text-[#0F172A]">
                ₹{formatNumber(summary.taxableAmount)}
              </span>
            </div>

            {/* CGST & SGST Split */}
            <div className="flex justify-between text-[#64748B]">
              <span>CGST (Central Tax 50%):</span>
              <span className="font-mono text-[#0F172A]">₹{formatNumber(summary.cgst)}</span>
            </div>

            <div className="flex justify-between text-[#64748B]">
              <span>SGST (State Tax 50%):</span>
              <span className="font-mono text-[#0F172A]">₹{formatNumber(summary.sgst)}</span>
            </div>

            {summary.roundOff !== 0 && (
              <div className="flex justify-between text-[#64748B]">
                <span>Round Off:</span>
                <span className="font-mono text-[#0F172A]">
                  {summary.roundOff > 0 ? `+₹${summary.roundOff}` : `-₹${Math.abs(summary.roundOff)}`}
                </span>
              </div>
            )}

            {/* Grand Total */}
            <div className="flex items-center justify-between border-t-2 border-[#0F172A] pt-2 text-base font-bold text-[#0F172A]">
              <span>Grand Total:</span>
              <span className="text-xl text-[#2563EB] font-mono">
                {formatCurrency(summary.grandTotal)}
              </span>
            </div>

            {/* Grand Total in Words (Indian Numbering) */}
            <div className="rounded-[6px] bg-[#F8FAFC] p-2.5 border border-[#E2E8F0] text-xs text-[#0F172A] font-medium mt-2">
              <span className="text-[#64748B] text-[11px] block uppercase font-semibold">
                Amount in Words (Indian Currency):
              </span>
              <span className="font-bold uppercase tracking-wide text-slate-900">
                {summary.totalWords}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
            <Button
              variant="outline"
              size="md"
              onClick={() => handleSaveBill(false)}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-1.5" />
              Save Bill
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => handleSaveBill(true)}
              disabled={isSaving}
            >
              <Printer className="h-4 w-4 mr-1.5" />
              Save &amp; Print Invoice
            </Button>
          </div>
        </div>
      </div>

      {/* Print Preview Modal */}
      {showPrintModal && savedBill && (
        <Dialog
          open={showPrintModal}
          onOpenChange={(open) => {
            setShowPrintModal(open);
            if (!open) {
              router.push("/bills");
            }
          }}
          maxWidth="4xl"
          title={`Print Invoice - ${savedBill.invoiceNo}`}
          description="Print or save as PDF matching Indian pharma GST wholesale invoice format."
        >
          <InvoicePrint
            bill={savedBill}
            onBack={() => {
              setShowPrintModal(false);
              router.push("/bills");
            }}
          />
        </Dialog>
      )}
    </div>
  );
}

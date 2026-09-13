"use client";

import React, { useState } from "react";
import { Printer, ArrowLeft, Download, ExternalLink, Loader2, Check } from "lucide-react";
import { Bill } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { exportInvoiceToPdf } from "@/lib/pdf";
import { Button } from "./ui/Button";

interface InvoicePrintProps {
  bill: Bill;
  onBack?: () => void;
  showActions?: boolean;
}

export function InvoicePrint({
  bill,
  onBack,
  showActions = true,
}: InvoicePrintProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  const handlePrint = () => {
    // Ensure body overflow isn't restricted by modal dialogs during printing
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "visible";

    window.print();

    // Restore overflow after print dialog closes
    setTimeout(() => {
      document.body.style.overflow = prevOverflow;
    }, 500);
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfSuccess(false);
    try {
      await exportInvoiceToPdf("printable-invoice", `Invoice_${bill.invoiceNo}.pdf`);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("Could not generate PDF. You can also use the 'Print Invoice' button and choose 'Save as PDF'.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const { supplier, customer, items, summary, terms } = bill;

  return (
    <div className="w-full">
      {/* Screen Action Bar (Hidden on Print) */}
      {showActions && (
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[#E2E8F0] bg-white p-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="outline" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <div>
              <h2 className="text-base font-semibold text-[#0F172A]">
                Tax Invoice: {bill.invoiceNo}
              </h2>
              <p className="text-xs text-[#64748B]">
                Created on {bill.date} • Customer: {customer.name}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/bill/print/${bill.invoiceNo || bill.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" title="Open full-page invoice in a new tab">
                <ExternalLink className="h-4 w-4 mr-1.5" />
                Open Full Tab
              </Button>
            </a>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              title="Download PDF directly to your device"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin text-[#2563EB]" />
                  Generating PDF...
                </>
              ) : pdfSuccess ? (
                <>
                  <Check className="h-4 w-4 mr-1.5 text-emerald-600" />
                  PDF Saved!
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1.5 text-[#2563EB]" />
                  Download PDF
                </>
              )}
            </Button>

            <Button variant="primary" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1.5" />
              Print Invoice (A4)
            </Button>
          </div>
        </div>
      )}

      {/* Printable Invoice Container */}
      <div
        id="printable-invoice"
        className="print-container mx-auto max-w-[850px] bg-white text-[#0F172A] border border-[#E2E8F0] rounded-[8px] p-6 text-xs leading-normal shadow-sm"
      >
        {/* Title & Badge */}
        <div className="border-b-2 border-slate-800 pb-3 mb-3 text-center relative">
          <div className="inline-block border border-slate-800 px-3 py-0.5 font-bold uppercase tracking-wider text-[11px]">
            TAX INVOICE / CASH MEMO
          </div>
          <div className="absolute right-0 top-0 text-[10px] text-right font-mono text-slate-600">
            Original for Recipient
          </div>
        </div>

        {/* Company Header */}
        <div className="text-center pb-3 border-b border-slate-300">
          <h1 className="text-xl font-black uppercase tracking-wide text-slate-950">
            {supplier.name}
          </h1>
          <p className="text-[11px] font-medium text-slate-700 mt-0.5">
            {supplier.tagline || "Wholesale Medicine Distributor & Pharmaceutical Stockist"}
          </p>
          <p className="text-[11px] text-slate-600 mt-0.5">
            {supplier.address}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-0.5 mt-1 text-[11px] font-semibold text-slate-800">
            <span>GSTIN: <span className="font-mono">{supplier.gstin}</span></span>
            <span>D.L. No: <span className="font-mono">{supplier.dlNo}</span></span>
            <span>Phone: {supplier.phone}</span>
          </div>
        </div>

        {/* Two-Panel Box: Left = Supplier & Invoice Details, Right = Buyer Details */}
        <div className="grid grid-cols-2 border border-slate-300 divide-x divide-slate-300 my-3 text-[11px]">
          {/* Left Panel: Invoice & Transport Details */}
          <div className="p-3 space-y-1 bg-slate-50/40">
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="text-slate-600">Invoice No:</span>
              <span className="font-bold font-mono text-slate-900 text-xs">{bill.invoiceNo}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="text-slate-600">Invoice Date:</span>
              <span className="font-medium text-slate-900">{bill.date}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="text-slate-600">Payment Mode:</span>
              <span className="font-semibold text-slate-900">{bill.paymentMode || "Credit"}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="text-slate-600">State &amp; Code:</span>
              <span className="font-medium text-slate-900">
                {supplier.state} ({supplier.stateCode})
              </span>
            </div>
            {bill.dueDate && (
              <div className="flex justify-between pt-0.5">
                <span className="text-slate-600">Due Date:</span>
                <span className="font-medium text-slate-900">{bill.dueDate}</span>
              </div>
            )}
          </div>

          {/* Right Panel: Buyer / Consignee Details */}
          <div className="p-3 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
              Billed To / Buyer
            </div>
            <div className="font-bold text-slate-900 text-xs mt-1">
              {customer.name}
            </div>
            <div className="text-slate-700 whitespace-pre-line text-[11px] leading-tight min-h-[30px]">
              {customer.address || "Local Pharmacy / Retailer"}
            </div>
            <div className="pt-1 flex flex-col gap-0.5 border-t border-slate-200 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">Phone:</span>
                <span className="font-medium text-slate-900">{customer.phone || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">GSTIN:</span>
                <span className="font-mono font-medium text-slate-900">{customer.gstin || "URP (Unregistered)"}</span>
              </div>
              {customer.dlNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-600">D.L. No:</span>
                  <span className="font-mono font-medium text-slate-900">{customer.dlNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-300 my-3 overflow-hidden">
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                <th className="py-1.5 px-2 text-center border-r border-slate-300 w-7">Sr</th>
                <th className="py-1.5 px-2 border-r border-slate-300">Product Description</th>
                <th className="py-1.5 px-1.5 text-center border-r border-slate-300 w-12">Pack</th>
                <th className="py-1.5 px-1.5 text-center border-r border-slate-300 w-16">Batch</th>
                <th className="py-1.5 px-1.5 text-center border-r border-slate-300 w-12">Exp</th>
                <th className="py-1.5 px-1.5 text-center border-r border-slate-300 w-14">HSN</th>
                <th className="py-1.5 px-1.5 text-right border-r border-slate-300 w-14">MRP</th>
                <th className="py-1.5 px-1.5 text-center border-r border-slate-300 w-10">Qty</th>
                <th className="py-1.5 px-1.5 text-right border-r border-slate-300 w-14">Rate</th>
                <th className="py-1.5 px-1 text-center border-r border-slate-300 w-10">Dis%</th>
                <th className="py-1.5 px-1 text-center border-r border-slate-300 w-10">GST%</th>
                <th className="py-1.5 px-2 text-right w-16">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/50">
                  <td className="py-1 px-2 text-center border-r border-slate-200 text-slate-600">
                    {idx + 1}
                  </td>
                  <td className="py-1 px-2 border-r border-slate-200 font-medium text-slate-900">
                    {item.productName}
                  </td>
                  <td className="py-1 px-1.5 text-center border-r border-slate-200 text-slate-700">
                    {item.pack || "-"}
                  </td>
                  <td className="py-1 px-1.5 text-center border-r border-slate-200 font-mono text-slate-700">
                    {item.batch || "-"}
                  </td>
                  <td className="py-1 px-1.5 text-center border-r border-slate-200 font-mono text-slate-700">
                    {item.expiry || "-"}
                  </td>
                  <td className="py-1 px-1.5 text-center border-r border-slate-200 font-mono text-slate-700">
                    {item.hsn || "3004"}
                  </td>
                  <td className="py-1 px-1.5 text-right border-r border-slate-200 text-slate-800">
                    {formatNumber(item.mrp)}
                  </td>
                  <td className="py-1 px-1.5 text-center border-r border-slate-200 font-bold text-slate-900">
                    {item.qty}
                  </td>
                  <td className="py-1 px-1.5 text-right border-r border-slate-200 font-mono text-slate-800">
                    {formatNumber(item.rate)}
                  </td>
                  <td className="py-1 px-1 text-center border-r border-slate-200 text-slate-700">
                    {item.discountPercent > 0 ? `${item.discountPercent}%` : "-"}
                  </td>
                  <td className="py-1 px-1 text-center border-r border-slate-200 text-slate-700">
                    {item.gstPercent}%
                  </td>
                  <td className="py-1 px-2 text-right font-semibold text-slate-900 font-mono">
                    {formatNumber(item.amount)}
                  </td>
                </tr>
              ))}

              {/* Pad empty rows if items < 4 to maintain nice print height */}
              {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, padIdx) => (
                <tr key={`pad-${padIdx}`} className="h-6 text-transparent select-none">
                  <td className="border-r border-slate-200">&nbsp;</td>
                  <td className="border-r border-slate-200">&nbsp;</td>
                  <td className="border-r border-slate-200">&nbsp;</td>
                  <td className="border-r border-slate-200">&nbsp;</td>
                  <td className="border-r border-slate-200">&nbsp;</td>
                  <td className="border-r border-slate-200">&nbsp;</td>
                  <td className="border-r border-slate-200">&nbsp;</td>
                  <td className="border-r border-slate-200">&nbsp;</td>
                  <td className="border-r border-slate-200">&nbsp;</td>
                  <td className="border-r border-slate-200">&nbsp;</td>
                  <td className="border-r border-slate-200">&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              ))}
            </tbody>
            {/* Total items bar */}
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-800">
                <td colSpan={7} className="py-1.5 px-3 border-r border-slate-300 text-right">
                  Total Items: {items.length} | Total Qty:
                </td>
                <td className="py-1.5 px-1.5 border-r border-slate-300 text-center font-bold">
                  {summary.totalQuantity}
                </td>
                <td colSpan={3} className="py-1.5 px-2 border-r border-slate-300 text-right">
                  Subtotal:
                </td>
                <td className="py-1.5 px-2 text-right font-mono font-bold">
                  ₹{formatNumber(summary.grossAmount || summary.subtotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Middle Section: GST Breakup on Left, Summary Calculation on Right */}
        <div className="grid grid-cols-12 gap-3 my-3">
          {/* Left 7 Columns: GST Rate Breakup Table */}
          <div className="col-span-7 border border-slate-300 p-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              GST Tax Breakup Details (INR)
            </div>
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-slate-700">
                  <th className="py-1 px-1 border-r border-slate-300">GST %</th>
                  <th className="py-1 px-1.5 text-right border-r border-slate-300">Taxable Val</th>
                  <th className="py-1 px-1.5 text-right border-r border-slate-300">CGST</th>
                  <th className="py-1 px-1.5 text-right border-r border-slate-300">SGST</th>
                  <th className="py-1 px-1.5 text-right">Total Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {summary.gstBreakup.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-1 text-slate-500">
                      No GST applicable
                    </td>
                  </tr>
                ) : (
                  summary.gstBreakup.map((b) => (
                    <tr key={b.gstRate}>
                      <td className="py-1 px-1 border-r border-slate-200 font-medium">
                        {b.gstRate}%
                      </td>
                      <td className="py-1 px-1.5 text-right border-r border-slate-200 font-mono">
                        {formatNumber(b.taxableValue)}
                      </td>
                      <td className="py-1 px-1.5 text-right border-r border-slate-200 font-mono">
                        {formatNumber(b.cgstAmount)}
                      </td>
                      <td className="py-1 px-1.5 text-right border-r border-slate-200 font-mono">
                        {formatNumber(b.sgstAmount)}
                      </td>
                      <td className="py-1 px-1.5 text-right font-mono font-medium">
                        {formatNumber(b.totalTax)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Right 5 Columns: Summary Calculations */}
          <div className="col-span-5 border border-slate-300 p-2.5 bg-slate-50/40 text-[11px] space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Gross Total:</span>
              <span className="font-mono text-slate-900">₹{formatNumber(summary.grossAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Discount:</span>
              <span className="font-mono text-slate-900">-₹{formatNumber(summary.totalDiscount)}</span>
            </div>
            <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1">
              <span>Taxable Value:</span>
              <span className="font-mono text-slate-900">₹{formatNumber(summary.taxableAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>CGST (Central Tax):</span>
              <span className="font-mono text-slate-900">₹{formatNumber(summary.cgst)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>SGST (State Tax):</span>
              <span className="font-mono text-slate-900">₹{formatNumber(summary.sgst)}</span>
            </div>
            {summary.roundOff !== 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Round Off:</span>
                <span className="font-mono text-slate-900">
                  {summary.roundOff > 0 ? `+₹${summary.roundOff}` : `-₹${Math.abs(summary.roundOff)}`}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t-2 border-slate-800 pt-1 text-sm font-black text-slate-950">
              <span>Grand Total:</span>
              <span className="font-mono">{formatCurrency(summary.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Amount In Words (Indian Numbering) */}
        <div className="border border-slate-300 p-2 my-2 bg-slate-50/50 text-[11px]">
          <span className="font-bold text-slate-800">Amount Chargeable (in words): </span>
          <span className="font-semibold text-slate-950 uppercase">{summary.totalWords}</span>
        </div>

        {/* Bottom Section: Bank details, Terms & Conditions, and Signature */}
        <div className="grid grid-cols-12 gap-3 border border-slate-300 p-3 mt-3 text-[10px]">
          {/* Bank & Terms */}
          <div className="col-span-8 space-y-2 border-r border-slate-300 pr-3">
            <div>
              <span className="font-bold uppercase text-slate-800 block mb-0.5">
                Bank Details for NEFT / RTGS / UPI:
              </span>
              <div className="grid grid-cols-2 gap-x-2 text-slate-700">
                <span>Bank: <strong>{supplier.bankName || "State Bank of India"}</strong></span>
                <span>A/c No: <strong className="font-mono">{supplier.bankAccountNo || "38920109923"}</strong></span>
                <span>IFSC: <strong className="font-mono">{supplier.bankIfsc || "SBIN0000160"}</strong></span>
                <span>Branch: <strong>{supplier.bankBranch || "Pratapgarh Main"}</strong></span>
              </div>
            </div>

            <div>
              <span className="font-bold uppercase text-slate-800 block mb-0.5">
                Terms &amp; Conditions:
              </span>
              <ul className="list-none space-y-0.5 text-slate-600">
                {(terms && terms.length > 0 ? terms : [
                  "1. Goods once sold will not be taken back or exchanged.",
                  "2. All disputes subject to Pratapgarh jurisdiction only.",
                  "3. Interest @ 18% p.a. will be charged if bill is not paid on due date."
                ]).map((term, i) => (
                  <li key={i}>{term}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Signature Box */}
          <div className="col-span-4 flex flex-col justify-between text-right pl-2">
            <div>
              <span className="text-[10px] text-slate-600 block">For</span>
              <span className="font-bold text-xs uppercase text-slate-900 block">
                {supplier.name}
              </span>
            </div>
            <div className="mt-12 pt-2 border-t border-slate-300">
              <span className="font-semibold text-slate-800 block text-[10px]">
                Authorized Signatory
              </span>
            </div>
          </div>
        </div>

        <div className="text-center text-[9px] text-slate-500 mt-2">
          This is a Computer Generated Tax Invoice.
        </div>
      </div>
    </div>
  );
}

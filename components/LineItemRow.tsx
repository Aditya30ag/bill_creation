"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { LineItem } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

interface LineItemRowProps {
  item: LineItem;
  index: number;
  onUpdate: (updated: LineItem) => void;
  onRemove: (id: string) => void;
}

export function LineItemRow({
  item,
  index,
  onUpdate,
  onRemove,
}: LineItemRowProps) {
  // Re-calculate when inputs change
  const handleFieldChange = (
    field: "qty" | "discountPercent" | "gstPercent" | "mrp" | "batch" | "expiry" | "pack",
    value: string | number
  ) => {
    let nextMrp = item.mrp;
    let nextQty = item.qty;
    let nextDis = item.discountPercent;
    let nextGst = item.gstPercent;
    let nextBatch = item.batch;
    let nextExpiry = item.expiry;
    let nextPack = item.pack;

    if (field === "mrp") nextMrp = Math.max(0, parseFloat(value as string) || 0);
    if (field === "qty") nextQty = Math.max(1, parseInt(value as string, 10) || 0);
    if (field === "discountPercent") nextDis = Math.max(0, Math.min(100, parseFloat(value as string) || 0));
    if (field === "gstPercent") nextGst = Math.max(0, parseFloat(value as string) || 0);
    if (field === "batch") nextBatch = String(value);
    if (field === "expiry") nextExpiry = String(value);
    if (field === "pack") nextPack = String(value);

    // Rate = MRP - Discount
    const unitDiscount = (nextMrp * nextDis) / 100;
    const rate = Number((nextMrp - unitDiscount).toFixed(2));
    const taxableValue = Number((rate * nextQty).toFixed(2));
    const cgstAmount = Number(((taxableValue * (nextGst / 2)) / 100).toFixed(2));
    const sgstAmount = Number(((taxableValue * (nextGst / 2)) / 100).toFixed(2));
    const amount = Number((taxableValue + cgstAmount + sgstAmount).toFixed(2));

    onUpdate({
      ...item,
      mrp: nextMrp,
      qty: nextQty,
      discountPercent: nextDis,
      gstPercent: nextGst,
      batch: nextBatch,
      expiry: nextExpiry,
      pack: nextPack,
      rate,
      taxableValue,
      cgstAmount,
      sgstAmount,
      amount,
    });
  };

  return (
    <tr className="border-b border-[#E2E8F0] hover:bg-slate-50/70 transition-colors text-xs">
      {/* Sr */}
      <td className="py-2.5 px-3 font-semibold text-[#64748B] text-center w-10">
        {index + 1}
      </td>

      {/* Product Name & Code */}
      <td className="py-2.5 px-3 min-w-[180px]">
        <div className="font-medium text-[#0F172A] leading-tight">
          {item.productName}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#64748B]">
          <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-[10px]">
            {item.productCode}
          </span>
          {item.hsn && <span>HSN: {item.hsn}</span>}
        </div>
      </td>

      {/* Pack */}
      <td className="py-2.5 px-2 w-20">
        <input
          type="text"
          value={item.pack}
          onChange={(e) => handleFieldChange("pack", e.target.value)}
          placeholder="Pack"
          className="w-full h-8 px-2 text-xs rounded-[6px] border border-[#E2E8F0] bg-white text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
        />
      </td>

      {/* Batch */}
      <td className="py-2.5 px-2 w-24">
        <input
          type="text"
          value={item.batch}
          onChange={(e) => handleFieldChange("batch", e.target.value)}
          placeholder="Batch"
          className="w-full h-8 px-2 text-xs uppercase font-mono rounded-[6px] border border-[#E2E8F0] bg-white text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
        />
      </td>

      {/* Expiry */}
      <td className="py-2.5 px-2 w-20">
        <input
          type="text"
          value={item.expiry}
          onChange={(e) => handleFieldChange("expiry", e.target.value)}
          placeholder="MM/YY"
          className="w-full h-8 px-2 text-xs font-mono rounded-[6px] border border-[#E2E8F0] bg-white text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
        />
      </td>

      {/* MRP */}
      <td className="py-2.5 px-2 w-24">
        <input
          type="number"
          step="0.01"
          min="0"
          value={item.mrp || ""}
          onChange={(e) => handleFieldChange("mrp", e.target.value)}
          className="w-full h-8 px-2 text-xs text-right font-medium rounded-[6px] border border-[#E2E8F0] bg-white text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
        />
      </td>

      {/* Qty */}
      <td className="py-2.5 px-2 w-20">
        <input
          type="number"
          min="1"
          value={item.qty || ""}
          onChange={(e) => handleFieldChange("qty", e.target.value)}
          className="w-full h-8 px-2 text-xs text-center font-semibold rounded-[6px] border border-[#2563EB]/40 bg-blue-50/20 text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
        />
      </td>

      {/* Rate (MRP - Discount) */}
      <td className="py-2.5 px-3 text-right font-mono font-medium text-[#0F172A] w-24">
        ₹{formatNumber(item.rate)}
      </td>

      {/* Discount % */}
      <td className="py-2.5 px-2 w-20">
        <div className="relative flex items-center">
          <input
            type="number"
            step="0.5"
            min="0"
            max="100"
            value={item.discountPercent}
            onChange={(e) => handleFieldChange("discountPercent", e.target.value)}
            className="w-full h-8 pl-2 pr-4 text-xs text-right rounded-[6px] border border-[#E2E8F0] bg-white text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
          />
          <span className="absolute right-1 text-[10px] text-[#64748B] pointer-events-none">%</span>
        </div>
      </td>

      {/* GST % */}
      <td className="py-2.5 px-2 w-20">
        <select
          value={item.gstPercent}
          onChange={(e) => handleFieldChange("gstPercent", e.target.value)}
          className="w-full h-8 px-1 text-xs rounded-[6px] border border-[#E2E8F0] bg-white text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
        >
          <option value={0}>0%</option>
          <option value={5}>5%</option>
          <option value={12}>12%</option>
          <option value={18}>18%</option>
          <option value={28}>28%</option>
        </select>
      </td>

      {/* Amount (Rate * Qty + Taxes) */}
      <td className="py-2.5 px-3 text-right font-semibold text-[#0F172A] w-28">
        ₹{formatNumber(item.amount)}
      </td>

      {/* Delete Action */}
      <td className="py-2.5 px-2 text-center w-10">
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          title="Remove item"
          className="rounded p-1 text-[#64748B] hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

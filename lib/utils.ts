import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { LineItem, InvoiceSummary, GSTBreakupItem } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(amount: number, decimals: number = 2): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

const singleDigits = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eightteen",
  "Nineteen",
];

const tens = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function convertBelowThousand(n: number): string {
  let word = "";
  if (n >= 100) {
    word += singleDigits[Math.floor(n / 100)] + " Hundred ";
    n %= 100;
  }
  if (n > 0) {
    if (n < 20) {
      word += singleDigits[n] + " ";
    } else {
      word += tens[Math.floor(n / 10)] + " ";
      if (n % 10 > 0) {
        word += singleDigits[n % 10] + " ";
      }
    }
  }
  return word.trim();
}

/**
 * Converts numbers into words using the Indian Numbering System (Crores, Lakhs, Thousands, Hundreds).
 * e.g., 45678.50 -> "Forty-Five Thousand Six Hundred Seventy-Eight Rupees and Fifty Paise Only"
 */
export function numberToWordsIndian(num: number): string {
  if (isNaN(num) || num === 0) return "Zero Rupees Only";

  const isNegative = num < 0;
  num = Math.abs(num);

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  if (integerPart === 0 && decimalPart === 0) return "Zero Rupees Only";

  const crore = Math.floor(integerPart / 10000000);
  let remainder = integerPart % 10000000;

  const lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;

  const thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  const hundredPart = remainder;

  let result = "";

  if (crore > 0) {
    result += convertBelowThousand(crore) + " Crore ";
  }
  if (lakh > 0) {
    result += convertBelowThousand(lakh) + " Lakh ";
  }
  if (thousand > 0) {
    result += convertBelowThousand(thousand) + " Thousand ";
  }
  if (hundredPart > 0) {
    result += convertBelowThousand(hundredPart) + " ";
  }

  result = result.trim();
  const rupeeString = result ? result + " Rupees" : "";

  let paiseString = "";
  if (decimalPart > 0) {
    paiseString = convertBelowThousand(decimalPart) + " Paise";
  }

  let finalWords = "";
  if (rupeeString && paiseString) {
    finalWords = `${rupeeString} and ${paiseString} Only`;
  } else if (rupeeString) {
    finalWords = `${rupeeString} Only`;
  } else if (paiseString) {
    finalWords = `${paiseString} Only`;
  } else {
    finalWords = "Zero Rupees Only";
  }

  return isNegative ? "Minus " + finalWords : finalWords;
}

/**
 * Calculates line item amounts:
 * Rate = MRP - Discount amount (calculated from discountPercent or manual discount)
 * Taxable Value = Rate * Qty
 * CGST = Taxable Value * (GST% / 2) / 100
 * SGST = Taxable Value * (GST% / 2) / 100
 * Total Amount = Taxable Value + CGST + SGST (inclusive in pharma billing)
 */
export function calculateLineItem(
  mrp: number,
  qty: number,
  discountPercent: number,
  gstPercent: number
): {
  rate: number;
  amount: number;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
} {
  const safeMrp = Math.max(0, Number(mrp) || 0);
  const safeQty = Math.max(0, Number(qty) || 0);
  const safeDis = Math.max(0, Math.min(100, Number(discountPercent) || 0));
  const safeGst = Math.max(0, Number(gstPercent) || 0);

  // Discount per unit
  const unitDiscount = (safeMrp * safeDis) / 100;
  // Effective selling Rate after discount
  const rate = Number((safeMrp - unitDiscount).toFixed(2));

  // In standard pharmaceutical wholesale billing, rate is exclusive of GST (taxable rate)
  // Taxable Value = Rate * Qty
  const taxableValue = Number((rate * safeQty).toFixed(2));

  const cgstRate = safeGst / 2;
  const sgstRate = safeGst / 2;

  const cgstAmount = Number(((taxableValue * cgstRate) / 100).toFixed(2));
  const sgstAmount = Number(((taxableValue * sgstRate) / 100).toFixed(2));

  // Total Line Amount including Tax
  const amount = Number((taxableValue + cgstAmount + sgstAmount).toFixed(2));

  return {
    rate,
    amount,
    taxableValue,
    cgstAmount,
    sgstAmount,
  };
}

/**
 * Calculates complete invoice totals, GST breakups, round-off and Indian words
 */
export function calculateInvoiceSummary(items: LineItem[]): InvoiceSummary {
  let grossAmount = 0;
  let totalDiscount = 0;
  let taxableAmount = 0;
  let totalQuantity = 0;

  // Track GST rates for breakup table
  const gstBreakupMap = new Map<
    number,
    { taxable: number; cgst: number; sgst: number }
  >();

  items.forEach((item) => {
    const itemQty = Number(item.qty) || 0;
    const itemMrp = Number(item.mrp) || 0;
    const itemDisPercent = Number(item.discountPercent) || 0;
    const itemGstPercent = Number(item.gstPercent) || 0;

    const itemGross = itemMrp * itemQty;
    const itemDisAmount = (itemGross * itemDisPercent) / 100;
    const itemTaxable = item.taxableValue || (item.rate * itemQty);

    grossAmount += itemGross;
    totalDiscount += itemDisAmount;
    taxableAmount += itemTaxable;
    totalQuantity += itemQty;

    const currentGst = gstBreakupMap.get(itemGstPercent) || {
      taxable: 0,
      cgst: 0,
      sgst: 0,
    };
    currentGst.taxable += itemTaxable;
    currentGst.cgst += item.cgstAmount;
    currentGst.sgst += item.sgstAmount;
    gstBreakupMap.set(itemGstPercent, currentGst);
  });

  grossAmount = Number(grossAmount.toFixed(2));
  totalDiscount = Number(totalDiscount.toFixed(2));
  taxableAmount = Number(taxableAmount.toFixed(2));

  let totalCgst = 0;
  let totalSgst = 0;
  const gstBreakup: GSTBreakupItem[] = [];

  gstBreakupMap.forEach((val, gstRate) => {
    const cgstRate = gstRate / 2;
    const sgstRate = gstRate / 2;
    const cgstAmt = Number(val.cgst.toFixed(2));
    const sgstAmt = Number(val.sgst.toFixed(2));
    const totalTax = Number((cgstAmt + sgstAmt).toFixed(2));

    totalCgst += cgstAmt;
    totalSgst += sgstAmt;

    gstBreakup.push({
      gstRate,
      taxableValue: Number(val.taxable.toFixed(2)),
      cgstRate,
      cgstAmount: cgstAmt,
      sgstRate,
      sgstAmount: sgstAmt,
      totalTax,
    });
  });

  // Sort GST breakup ascending by rate
  gstBreakup.sort((a, b) => a.gstRate - b.gstRate);

  totalCgst = Number(totalCgst.toFixed(2));
  totalSgst = Number(totalSgst.toFixed(2));
  const totalGst = Number((totalCgst + totalSgst).toFixed(2));

  const rawGrandTotal = taxableAmount + totalGst;
  const roundedGrandTotal = Math.round(rawGrandTotal);
  const roundOff = Number((roundedGrandTotal - rawGrandTotal).toFixed(2));

  return {
    grossAmount,
    subtotal: taxableAmount, // standard pharma wholesale invoice subtotal
    totalDiscount,
    taxableAmount,
    cgst: totalCgst,
    sgst: totalSgst,
    totalGst,
    roundOff,
    grandTotal: roundedGrandTotal,
    totalWords: numberToWordsIndian(roundedGrandTotal),
    totalQuantity,
    gstBreakup,
  };
}

/**
 * Generate next auto-incrementing invoice number
 * Format: A006603, A006604, etc.
 */
export function getNextInvoiceNumber(existingInvoices: string[]): string {
  const prefix = "A";
  let maxSeq = 6602; // Initial seed from user example A006603

  for (const inv of existingInvoices) {
    const match = inv.match(/^[A-Za-z]+(\d+)$/);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  return `${prefix}${nextSeq.toString().padStart(6, "0")}`;
}

export const DEFAULT_SUPPLIER = {
  name: "Siddharth Medical Agency",
  tagline: "Wholesale Medicine Distributor & Pharmaceutical Stockist",
  address: "Station Road, Opp. District Hospital, Pratapgarh - 230001 (U.P.)",
  phone: "+91 94151 23456, 05342-220123",
  email: "siddharthmedagency@gmail.com",
  gstin: "09BDGPD0167D1Z2",
  dlNo: "UP-PRT-20B-182390, 21B-182391",
  fssai: "12720052000142",
  state: "Uttar Pradesh",
  stateCode: "09",
  bankName: "State Bank of India",
  bankAccountNo: "38920109923",
  bankIfsc: "SBIN0000160",
  bankBranch: "Main Branch, Pratapgarh",
};

export const DEFAULT_TERMS = [
  "1. Goods once sold will not be taken back or exchanged under any circumstances.",
  "2. All disputes are subject to Pratapgarh (U.P.) jurisdiction only.",
  "3. Interest @ 18% p.a. will be charged if the bill is not paid on or before the due date.",
  "4. Any discrepancy, breakage or shortage must be reported within 24 hours of delivery.",
  "5. Expired or near-expiry medicine claims must be informed strictly 3 months in advance.",
];

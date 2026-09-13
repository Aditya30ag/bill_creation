export interface StockItem {
  id: string;
  code: string;
  productName: string;
  unit: string;
  currentStock: number;
  salesSchemeDeal: number;
  salesSchemeFree: number;
  purchSchemeDeal: number;
  purchSchemeFree: number;
  mrp?: number;
  pack?: string;
  batch?: string;
  expiry?: string;
  hsn?: string;
  gstPercent?: number;
}

export interface CustomerInfo {
  name: string;
  address: string;
  phone: string;
  gstin?: string;
  dlNumber?: string;
  state?: string;
  stateCode?: string;
}

export interface SupplierInfo {
  name: string;
  tagline?: string;
  address: string;
  phone: string;
  email?: string;
  gstin: string;
  dlNo: string;
  fssai?: string;
  state: string;
  stateCode: string;
  bankName?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  bankBranch?: string;
}

export interface LineItem {
  id: string;
  sr: number;
  productCode: string;
  productName: string;
  pack: string;
  batch: string;
  expiry: string;
  hsn: string;
  mrp: number;
  qty: number;
  freeQty?: number;
  rate: number;
  discountPercent: number;
  gstPercent: number;
  amount: number;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
}

export interface GSTBreakupItem {
  gstRate: number;
  taxableValue: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  totalTax: number;
}

export interface InvoiceSummary {
  grossAmount: number;
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  totalGst: number;
  roundOff: number;
  grandTotal: number;
  totalWords: string;
  totalQuantity: number;
  gstBreakup: GSTBreakupItem[];
}

export interface Bill {
  id: string;
  invoiceNo: string;
  date: string;
  dueDate?: string;
  paymentMode: "Cash" | "Credit" | "UPI" | "Cheque";
  supplier: SupplierInfo;
  customer: CustomerInfo;
  items: LineItem[];
  summary: InvoiceSummary;
  terms: string[];
  status: "Paid" | "Pending" | "Cancelled";
  createdAt: string;
}

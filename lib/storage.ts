import Papa from "papaparse";
import { StockItem, Bill } from "./types";
import { SAMPLE_STOCK_ITEMS } from "./sample-data";

const STOCKS_STORAGE_KEY = "sma_stocks";
const BILLS_STORAGE_KEY = "sma_bills";

export function getStoredStocks(): StockItem[] {
  if (typeof window === "undefined") return SAMPLE_STOCK_ITEMS;
  try {
    const raw = localStorage.getItem(STOCKS_STORAGE_KEY);
    if (!raw) {
      // Seed default sample items so user has instant data
      localStorage.setItem(STOCKS_STORAGE_KEY, JSON.stringify(SAMPLE_STOCK_ITEMS));
      return SAMPLE_STOCK_ITEMS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SAMPLE_STOCK_ITEMS;
  } catch (err) {
    console.error("Failed to load stocks from localStorage", err);
    return SAMPLE_STOCK_ITEMS;
  }
}

export async function fetchFullCatalogStocks(): Promise<StockItem[]> {
  try {
    const res = await fetch("/api/stocks");
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.stocks) && data.stocks.length > 0) {
        saveStoredStocks(data.stocks);
        return data.stocks;
      }
    }
  } catch (err) {
    console.error("Failed to fetch stocks from /api/stocks", err);
  }
  return getStoredStocks();
}

export function saveStoredStocks(stocks: StockItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STOCKS_STORAGE_KEY, JSON.stringify(stocks));
  } catch (err) {
    console.error("Failed to save stocks to localStorage", err);
  }
}

export function getStoredBills(): Bill[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BILLS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load bills from localStorage", err);
    return [];
  }
}

export function saveStoredBills(bills: Bill[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(bills));
  } catch (err) {
    console.error("Failed to save bills to localStorage", err);
  }
}

export function saveBillAndDeductStock(newBill: Bill): { success: boolean; error?: string } {
  try {
    const currentBills = getStoredBills();
    const currentStocks = getStoredStocks();

    // Deduct stock for each line item
    const updatedStocks = currentStocks.map((stock) => {
      const soldItem = newBill.items.find(
        (item) => item.productCode.toLowerCase() === stock.code.toLowerCase()
      );
      if (soldItem) {
        const totalDeduction = (soldItem.qty || 0) + (soldItem.freeQty || 0);
        return {
          ...stock,
          currentStock: Math.max(0, stock.currentStock - totalDeduction),
        };
      }
      return stock;
    });

    // Save updated bills (newest first)
    const updatedBills = [newBill, ...currentBills.filter((b) => b.id !== newBill.id)];
    saveStoredBills(updatedBills);
    saveStoredStocks(updatedStocks);

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to save bill" };
  }
}

export function deleteBill(billId: string): void {
  const currentBills = getStoredBills();
  const updatedBills = currentBills.filter((b) => b.id !== billId);
  saveStoredBills(updatedBills);
}

export function getBillById(billId: string): Bill | undefined {
  const currentBills = getStoredBills();
  return currentBills.find((b) => b.id === billId || b.invoiceNo === billId);
}

/**
 * Parses STOCKS.csv file according to specifications:
 * Columns: Code, Product Name, Unit, Current Stock, Sales Scheme Deal, Sales Scheme Free, Purch Scheme Deal, Purch Scheme Free
 * Also flexibly supports optional columns if present: MRP, Pack, Batch, Expiry, HSN, GST%
 */
export function parseStocksCsv(csvText: string): Promise<{
  stocks: StockItem[];
  errors: string[];
  totalRows: number;
}> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, unknown>>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        const stocks: StockItem[] = [];
        const errors: string[] = [];

        (results.data || []).forEach((row: Record<string, unknown>, index: number) => {
          // Normalize column lookups (case-insensitive & whitespace tolerant)
          const getVal = (candidates: string[]): string => {
            for (const key of Object.keys(row)) {
              const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
              for (const cand of candidates) {
                const cleanCand = cand.toLowerCase().replace(/[^a-z0-9]/g, "");
                if (cleanKey === cleanCand) {
                  return String(row[key] ?? "").trim();
                }
              }
            }
            return "";
          };

          const code = getVal(["Code", "Item Code", "Product Code"]);
          const productName = getVal(["Product Name", "ProductName", "Description", "Item Name"]);

          if (!code && !productName) {
            return; // Skip empty row
          }

          const unit = getVal(["Unit", "Packaging", "UOM"]) || "10's";
          const currentStock = parseFloat(getVal(["Current Stock", "Stock", "Qty", "Quantity"])) || 0;
          const salesSchemeDeal = parseFloat(getVal(["Sales Scheme Deal", "Sales Scheme D", "Deal"])) || 10;
          const salesSchemeFree = parseFloat(getVal(["Sales Scheme Free", "Sales Scheme F", "Free"])) || 0;
          const purchSchemeDeal = parseFloat(getVal(["Purch Scheme Deal", "Purch Deal"])) || 10;
          const purchSchemeFree = parseFloat(getVal(["Purch Scheme Free", "Purch Free"])) || 0;

          // Optional extra columns with sensible defaults
          const mrpVal = parseFloat(getVal(["MRP", "M.R.P."]));
          const mrp = !isNaN(mrpVal) && mrpVal > 0 ? mrpVal : 100.0;

          const pack = getVal(["Pack", "Packing"]) || unit;
          const batch = getVal(["Batch", "Batch No"]) || `BT${Math.floor(1000 + Math.random() * 9000)}`;
          const expiry = getVal(["Expiry", "Exp Date", "Exp"]) || "12/26";
          const hsn = getVal(["HSN", "HSN Code"]) || "300490";
          const gstPercent = parseFloat(getVal(["GST", "GST%", "Tax%"])) || 12;

          stocks.push({
            id: `stk-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
            code: code || `ITM${index + 1}`,
            productName: productName || "Unnamed Product",
            unit,
            currentStock,
            salesSchemeDeal,
            salesSchemeFree,
            purchSchemeDeal,
            purchSchemeFree,
            mrp,
            pack,
            batch,
            expiry,
            hsn,
            gstPercent,
          });
        });

        resolve({
          stocks,
          errors,
          totalRows: results.data.length,
        });
      },
      error: (err: Error) => {
        resolve({
          stocks: [],
          errors: [err.message],
          totalRows: 0,
        });
      },
    });
  });
}

/**
 * Export current stocks list to CSV string
 */
export function exportStocksToCsv(stocks: StockItem[]): string {
  const rows = stocks.map((item) => ({
    Code: item.code,
    "Product Name": item.productName,
    Unit: item.unit,
    "Current Stock": item.currentStock,
    "Sales Scheme Deal": item.salesSchemeDeal,
    "Sales Scheme Free": item.salesSchemeFree,
    "Purch Scheme Deal": item.purchSchemeDeal,
    "Purch Scheme Free": item.purchSchemeFree,
    MRP: item.mrp ?? "",
    Pack: item.pack ?? "",
    Batch: item.batch ?? "",
    Expiry: item.expiry ?? "",
    HSN: item.hsn ?? "",
    "GST%": item.gstPercent ?? 12,
  }));

  return Papa.unparse(rows);
}

/**
 * Trigger browser file download
 */
export function downloadFile(content: string, filename: string, mimeType: string = "text/csv;charset=utf-8;") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

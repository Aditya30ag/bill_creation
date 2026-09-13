import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { StockItem } from "@/lib/types";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "stocks.json");
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, "utf-8");
      const stocks: StockItem[] = JSON.parse(fileData);
      return NextResponse.json({ success: true, stocks, total: stocks.length });
    }

    return NextResponse.json({ success: false, stocks: [], total: 0 }, { status: 404 });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load stocks" },
      { status: 500 }
    );
  }
}

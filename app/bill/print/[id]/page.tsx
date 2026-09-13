"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Bill } from "@/lib/types";
import { getStoredBills } from "@/lib/storage";
import { InvoicePrint } from "@/components/InvoicePrint";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function DedicatedInvoicePrintPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params?.id as string;

  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (invoiceId) {
      const bills = getStoredBills();
      const found = bills.find(
        (b) =>
          b.id === invoiceId ||
          b.invoiceNo.toLowerCase() === invoiceId.toLowerCase()
      );
      setBill(found || null);
    }
    setLoading(false);
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-xs text-[#64748B]">
        Loading invoice...
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center bg-white rounded-[8px] border border-[#E2E8F0] mt-10 space-y-4">
        <AlertCircle className="mx-auto h-10 w-10 text-amber-500" />
        <h2 className="text-base font-semibold text-[#0F172A]">Invoice Not Found</h2>
        <p className="text-xs text-[#64748B]">
          Could not find invoice #{invoiceId}. It may have been deleted or the link is invalid.
        </p>
        <Button variant="outline" size="sm" onClick={() => router.push("/bills")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Bill History
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <InvoicePrint
          bill={bill}
          onBack={() => router.push("/bills")}
          showActions={true}
        />
      </div>
    </div>
  );
}

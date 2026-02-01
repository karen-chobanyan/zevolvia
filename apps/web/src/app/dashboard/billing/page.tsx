import BillingPageClient from "@/components/billing/BillingPageClient";
import { Suspense } from "react";

export default function BillingPage() {
  return (
    <Suspense fallback={null}>
      <BillingPageClient />
    </Suspense>
  );
}

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SupportTicketsPageClient from "@/components/support/SupportTicketsPageClient";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Support Tickets",
  description: "Manage and track your support requests.",
};

export default function SupportListPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Support List" />
      <SupportTicketsPageClient />
    </div>
  );
}

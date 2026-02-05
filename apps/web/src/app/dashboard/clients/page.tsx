import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ClientsPageClient from "@/components/clients/ClientsPageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clients",
  description: "Manage your client database",
};

export default function ClientsPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Clients" />
      <ClientsPageClient />
    </div>
  );
}

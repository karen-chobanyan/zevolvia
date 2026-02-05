import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ServicesPageClient from "@/components/services/ServicesPageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services",
  description: "Manage your service catalog",
};

export default function ServicesPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Services" />
      <ServicesPageClient />
    </div>
  );
}

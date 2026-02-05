import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import CalendarPageClient from "@/components/calendar/CalendarPageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendar",
  description: "Manage appointments and bookings",
};

export default function CalendarPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Calendar" />
      <CalendarPageClient />
    </div>
  );
}

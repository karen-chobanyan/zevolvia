import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import UserManagement from "@/components/org/UserManagement";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Management | KitchenDocs",
  description: "Manage users, roles, and invites for your organization.",
};

export default function UsersPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="User Management" />
      <UserManagement />
    </div>
  );
}

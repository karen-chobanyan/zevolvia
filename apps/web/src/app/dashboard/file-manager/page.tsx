import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import FileManagerClient from "@/components/file-manager/FileManagerClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "File Manager",
  description: "Manage your salon's documentation and files.",
  // other metadata
};

export default function FileManager() {
  return (
    <div>
      <PageBreadcrumb pageTitle="File Manager" />
      <FileManagerClient />
    </div>
  );
}

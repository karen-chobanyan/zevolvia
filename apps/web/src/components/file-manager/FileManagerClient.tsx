"use client";

import { useMemo, useState } from "react";
import AllFolders from "@/components/file-manager/AllFolders";
import RecentFileTable from "@/components/file-manager/RecentFileTable";
import StorageDetailsChart from "@/components/file-manager/StorageDetailsChart";

type FolderCrumb = { id: string; name: string };

export default function FileManagerClient() {
  const [folderStack, setFolderStack] = useState<FolderCrumb[]>([]);
  const currentFolder = folderStack[folderStack.length - 1] ?? null;
  const currentFolderId = currentFolder?.id ?? null;

  const pathLabel = useMemo(() => {
    if (folderStack.length === 0) {
      return "Root";
    }
    return `Root / ${folderStack.map((folder) => folder.name).join(" / ")}`;
  }, [folderStack]);

  const handleOpenFolder = (folder: FolderCrumb) => {
    setFolderStack((prev) => [...prev, folder]);
  };

  const handleBreadcrumbClick = (index: number) => {
    setFolderStack((prev) => prev.slice(0, index + 1));
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <button type="button" onClick={() => setFolderStack([])} className="hover:text-brand-500">
          Root
        </button>
        {folderStack.map((folder, index) => (
          <div key={folder.id} className="flex items-center gap-2">
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <button
              type="button"
              onClick={() => handleBreadcrumbClick(index)}
              className="hover:text-brand-500"
            >
              {folder.name}
            </button>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-12">
          <AllFolders
            parentId={currentFolderId}
            pathLabel={pathLabel}
            onOpenFolder={handleOpenFolder}
          />
        </div>

        {/* <div className="col-span-12 xl:col-span-4">
          <StorageDetailsChart />
        </div> */}

        <div className="col-span-12">
          <RecentFileTable />
        </div>
      </div>
    </>
  );
}

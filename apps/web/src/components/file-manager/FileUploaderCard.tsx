"use client";

import { useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";
import { AudioIcon, DownloadIcon, FileIcon, FolderIcon, GridIcon, VideoIcon } from "../../icons";
import api from "@/lib/axios";
import FileCard from "./FileCard";
import { addUploadedFiles, type UploadedFileItem } from "./uploads-store";
import { UploadCloudIcon } from "lucide-react";

const fileData = [
  {
    icon: <FolderIcon />,
    title: "Image",
    usage: "17% Used",
    fileCount: 245,
    storageUsed: "26.40 GB",
    iconStyle: "bg-success-500/[0.08] text-success-500",
  },
  {
    icon: <VideoIcon />,
    title: "Videos",
    usage: "22% Used",
    fileCount: 245,
    storageUsed: "26.40 GB",
    iconStyle: "bg-theme-pink-500/[0.08] text-theme-pink-500",
  },
  {
    icon: <AudioIcon />,
    title: "Audios",
    usage: "23% Used",
    fileCount: 830,
    storageUsed: "18.90 GB",
    iconStyle: "bg-blue-500/[0.08] text-blue-light-500",
  },
  {
    icon: <GridIcon />,
    title: "Apps",
    usage: "65% Used",
    fileCount: 1200,
    storageUsed: "85.30 GB",
    iconStyle: "bg-orange-500/[0.08] text-orange-500",
  },
  {
    icon: <FileIcon />,
    title: "Documents",
    usage: "10% Used",
    fileCount: 78,
    storageUsed: "5.40 GB",
    iconStyle: "bg-warning-500/[0.08] text-warning-500",
  },
  {
    icon: <DownloadIcon />,
    title: "Downloads",
    usage: "16% Used",
    fileCount: 245,
    storageUsed: "26.40 GB",
    iconStyle: "bg-theme-purple-500/[0.08] text-theme-purple-500",
  },
];

type FileUploaderCardProps = {
  folderId?: string | null;
  pathLabel?: string;
  onUploaded?: (items: UploadedFileItem[]) => void;
};

export default function FileUploaderCard({
  folderId,
  pathLabel,
  onUploaded,
}: FileUploaderCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [uploadState, setUploadState] = useState<{
    status: "idle" | "uploading" | "success" | "error";
    message?: string;
  }>({ status: "idle" });
  const [isDragging, setIsDragging] = useState(false);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const isUploading = uploadState.status === "uploading";

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0 || isUploading) {
      return;
    }

    setUploadState({ status: "uploading", message: "Uploading..." });

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("file", file));
      if (folderId) {
        formData.append("folderId", folderId);
      }

      const response = await api.post("/file-manager/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const uploadedItems = Array.isArray(response.data)
        ? response.data
        : response.data
          ? [response.data]
          : [];
      const nowIso = new Date().toISOString();
      const normalizedItems = files.map((file, index) => {
        const item = uploadedItems[index];
        return {
          id: item?.id,
          key: item?.key,
          name: item?.name ?? file.name,
          size: item?.size ?? file.size,
          url: item?.url,
          createdAt: item?.createdAt ?? nowIso,
          mimeType: item?.mimeType ?? file.type,
          folderId: item?.folderId ?? folderId ?? null,
        };
      });
      addUploadedFiles(normalizedItems);
      onUploaded?.(normalizedItems);
      const message =
        normalizedItems.length === 1
          ? `Uploaded ${normalizedItems[0].name}`
          : `Uploaded ${normalizedItems.length} files`;
      setUploadState({
        status: "success",
        message,
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error ?? "Upload failed. Please try again.";
      setUploadState({
        status: "error",
        message: errorMessage,
      });
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const files = Array.from(input.files ?? []);
    await uploadFiles(files);
    input.value = "";
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isUploading) {
      return;
    }
    dragDepth.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isUploading) {
      return;
    }
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isUploading) {
      return;
    }
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isUploading) {
      return;
    }
    dragDepth.current = 0;
    setIsDragging(false);
    const files = Array.from(event.dataTransfer.files ?? []);
    void uploadFiles(files);
  };

  const handleDropzoneKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!isUploading) {
        handleUploadClick();
      }
    }
  };

  const statusMessageClass =
    uploadState.status === "error"
      ? "text-error-600 dark:text-error-400"
      : uploadState.status === "success"
        ? "text-success-600 dark:text-success-400"
        : "text-gray-500 dark:text-gray-400";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-4 flex flex-col items-center center-content py-4 sm:pl-6 sm:pr-4">
        <div className="flex flex-col items-center center-content gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-2 sm:w-auto">
            {pathLabel ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">Uploading to: {pathLabel}</p>
            ) : null}
            <div
              className={`flex w-full flex-col items-center center-content  justify-center gap-4 rounded-xl border-2 border-dashed px-4 py-7 transition sm:w-[620px] ${
                isDragging
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-500/15"
                  : "border-gray-200 bg-gray-50 hover:border-brand-300 dark:border-gray-700 dark:bg-gray-900/40"
              } ${isUploading ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
              onClick={() => {
                if (!isUploading) {
                  handleUploadClick();
                }
              }}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onKeyDown={handleDropzoneKeyDown}
              role="button"
              tabIndex={isUploading ? -1 : 0}
              aria-disabled={isUploading}
              aria-busy={isUploading}
            >
              <div
                className={`flex h-20 w-20 opacity-50 items-center justify-center rounded-full ${
                  isDragging
                    ? "bg-brand-100 text-brand-500 dark:bg-brand-500/20"
                    : " text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                <UploadCloudIcon className="size-12" />
              </div>
              <div className="flex flex-col items-center justify-center">
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {isDragging ? "Drop files to upload" : "Drag & drop files here"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">or click to browse</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            {uploadState.message && (
              <p className={`text-xs font-medium ${statusMessageClass}`}>{uploadState.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

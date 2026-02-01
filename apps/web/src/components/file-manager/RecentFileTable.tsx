"use client";

import { useEffect, useState, type DragEvent } from "react";
import { ArrowRightIcon } from "../../icons";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/axios";
import {
  removeUploadedFile,
  setUploadedFiles,
  useUploadedFiles,
  type UploadedFileItem,
} from "./uploads-store";
import { FILE_DRAG_TYPE } from "./drag-constants";

const fileIcons = {
  image: {
    light: "/images/icons/file-image.svg",
    dark: "/images/icons/file-image-dark.svg",
  },
  video: {
    light: "/images/icons/file-video.svg",
    dark: "/images/icons/file-video-dark.svg",
  },
  document: {
    light: "/images/icons/file-pdf.svg",
    dark: "/images/icons/file-pdf-dark.svg",
  },
};

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  const rounded = value >= 10 || index === 0 ? Math.round(value) : value.toFixed(1);
  return `${rounded} ${units[index]}`;
}

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleDateString();
}

function getExtension(name: string) {
  const parts = name.split(".");
  if (parts.length < 2) {
    return "";
  }
  return parts[parts.length - 1].toLowerCase();
}

function getCategory(file: UploadedFileItem) {
  const mime = file.mimeType?.toLowerCase();
  if (mime?.startsWith("image/")) {
    return "Image";
  }
  if (mime?.startsWith("video/")) {
    return "Video";
  }
  if (mime?.startsWith("audio/")) {
    return "Audio";
  }
  const ext = getExtension(file.name);
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
    return "Image";
  }
  if (["mp4", "mov", "mkv", "webm"].includes(ext)) {
    return "Video";
  }
  if (["mp3", "wav", "m4a", "flac"].includes(ext)) {
    return "Audio";
  }
  if (["pdf", "doc", "docx", "txt", "md", "rtf", "csv", "xlsx", "ppt", "pptx"].includes(ext)) {
    return "Document";
  }
  return "File";
}

function getIcon(category: string) {
  if (category === "Image") {
    return fileIcons.image;
  }
  if (category === "Video") {
    return fileIcons.video;
  }
  return fileIcons.document;
}

export default function RecentFileTable() {
  const files = useUploadedFiles();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDragStart = (event: DragEvent<HTMLDivElement>, file: UploadedFileItem) => {
    if (!file.id) {
      return;
    }
    const payload = {
      id: file.id,
      key: file.key,
      name: file.name,
      size: file.size,
      folderId: file.folderId ?? null,
    };
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(FILE_DRAG_TYPE, JSON.stringify(payload));
    event.dataTransfer.setData("text/plain", file.id ?? file.name);
  };

  useEffect(() => {
    let isMounted = true;
    const loadFiles = async () => {
      try {
        const response = await api.get("/file-manager/files");
        const data = Array.isArray(response.data) ? response.data : [];
        const visible = data.filter((item) => item?.status !== "DELETED");
        if (isMounted) {
          setUploadedFiles(
            visible.map((item: any) => ({
              id: item?.id,
              key: item?.key,
              name: item?.name ?? "file",
              size: item?.size ?? 0,
              url: item?.url,
              createdAt: item?.createdAt,
              mimeType: item?.mimeType,
              folderId: item?.folderId ?? null,
            })),
          );
        }
      } catch (error) {
        console.error("Failed to load files", error);
      }
    };
    loadFiles();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDelete = async (file: UploadedFileItem) => {
    if (!file.id) {
      return;
    }
    setDeletingId(file.id);
    try {
      await api.delete(`/file-manager/files/${file.id}`);
      removeUploadedFile(file.id, file.key);
    } catch (error) {
      console.error("Failed to delete file", error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white pt-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between px-6 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Uploaded Files</h3>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-500"
        >
          View All
          <ArrowRightIcon />
        </Link>
      </div>

      <div className="max-w-full overflow-x-auto">
        <table className="w-full border-collapse table-auto">
          {/* Table Header */}
          <thead>
            <tr className="border-t border-gray-200 dark:border-gray-800">
              <th className="px-6 py-3 font-medium text-left text-gray-500 text-theme-sm dark:text-gray-400">
                File Name
              </th>
              <th className="px-6 py-3 font-medium text-left text-gray-500 text-theme-sm dark:text-gray-400">
                Category
              </th>
              <th className="px-6 py-3 font-medium text-left text-gray-500 text-theme-sm dark:text-gray-400">
                Size
              </th>
              <th className="px-6 py-3 font-medium text-left text-gray-500 text-theme-sm dark:text-gray-400">
                Date Modified
              </th>
              <th className="px-6 py-3 font-medium text-center text-gray-500 text-theme-sm dark:text-gray-400">
                Action
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {files.length === 0 ? (
              <tr className="border-t border-gray-100 dark:border-gray-800">
                <td colSpan={5} className="px-6 py-[18px] text-sm text-gray-500 dark:text-gray-400">
                  No uploads yet.
                </td>
              </tr>
            ) : (
              files.map((file, index) => {
                const category = getCategory(file);
                const icon = getIcon(category);
                return (
                  <tr
                    key={`${file.id ?? file.name}-${index}`}
                    className="border-t border-gray-100 dark:border-gray-800"
                  >
                    <td className="px-6 py-[18px] text-sm text-gray-700 dark:text-gray-400">
                      <div
                        className={`flex items-center gap-2 ${
                          file.id ? "cursor-grab active:cursor-grabbing" : "cursor-default"
                        }`}
                        draggable={Boolean(file.id)}
                        onDragStart={(event) => handleDragStart(event, file)}
                        title={file.id ? "Drag to move" : "Upload to move"}
                      >
                        <Image
                          width={20}
                          height={20}
                          src={icon.light}
                          alt="icon"
                          className="dark:hidden"
                        />
                        <Image
                          width={20}
                          height={20}
                          src={icon.dark}
                          alt="icon"
                          className="hidden dark:block"
                        />
                        {file.name}
                      </div>
                    </td>
                    <td className="px-6 py-[18px] text-gray-700 text-theme-sm dark:text-gray-400">
                      {category}
                    </td>
                    <td className="px-6 py-[18px] text-gray-700 text-theme-sm dark:text-gray-400">
                      {formatBytes(file.size)}
                    </td>
                    <td className="px-6 py-[18px] text-gray-700 text-theme-sm dark:text-gray-400">
                      {formatDate(file.createdAt)}
                    </td>
                    <td className="px-6 py-[18px] text-center">
                      <div className="flex items-center justify-center gap-2">
                        {file.url ? (
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
                            title="Open"
                          >
                            <svg
                              className="fill-current"
                              width="21"
                              height="20"
                              viewBox="0 0 21 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M10.8749 13.8619C8.10837 13.8619 5.74279 12.1372 4.79804 9.70241C5.74279 7.26761 8.10837 5.54297 10.8749 5.54297C13.6415 5.54297 16.0071 7.26762 16.9518 9.70243C16.0071 12.1372 13.6415 13.8619 10.8749 13.8619ZM10.8749 4.04297C7.35666 4.04297 4.36964 6.30917 3.29025 9.4593C3.23626 9.61687 3.23626 9.78794 3.29025 9.94552C4.36964 13.0957 7.35666 15.3619 10.8749 15.3619C14.3932 15.3619 17.3802 13.0957 18.4596 9.94555C18.5136 9.78797 18.5136 9.6169 18.4596 9.45932C17.3802 6.30919 14.3932 4.04297 10.8749 4.04297ZM10.8663 7.84413C9.84002 7.84413 9.00808 8.67606 9.00808 9.70231C9.00808 10.7286 9.84002 11.5605 10.8663 11.5605H10.8811C11.9074 11.5605 12.7393 10.7286 12.7393 9.70231C12.7393 8.67606 11.9074 7.84413 10.8811 7.84413H10.8663Z"
                                fill=""
                              />
                            </svg>
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                        <button
                          type="button"
                          disabled={!file.id || deletingId === file.id}
                          onClick={() => handleDelete(file)}
                          className="text-gray-500 hover:text-error-500 disabled:cursor-not-allowed disabled:text-gray-300 dark:text-gray-400 dark:hover:text-error-500 dark:disabled:text-gray-500"
                          title="Delete"
                        >
                          <svg
                            className="fill-current"
                            width="21"
                            height="20"
                            viewBox="0 0 21 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M7.4163 3.79199C7.4163 2.54935 8.42366 1.54199 9.6663 1.54199H12.083C13.3256 1.54199 14.333 2.54935 14.333 3.79199V4.04199H16.5H17.5409C17.9551 4.04199 18.2909 4.37778 18.2909 4.79199C18.2909 5.20621 17.9551 5.54199 17.5409 5.54199H17.25V8.24687V13.2469V16.2087C17.25 17.4513 16.2427 18.4587 15 18.4587H6.75004C5.5074 18.4587 4.50004 17.4513 4.50004 16.2087V13.2469V8.24687V5.54199H4.20837C3.79416 5.54199 3.45837 5.20621 3.45837 4.79199C3.45837 4.37778 3.79416 4.04199 4.20837 4.04199H5.25004H7.4163V3.79199ZM15.75 13.2469V8.24687V5.54199H14.333H13.583H8.1663H7.4163H6.00004V8.24687V13.2469V16.2087C6.00004 16.6229 6.33583 16.9587 6.75004 16.9587H15C15.4143 16.9587 15.75 16.6229 15.75 16.2087V13.2469ZM8.9163 4.04199H12.833V3.79199C12.833 3.37778 12.4972 3.04199 12.083 3.04199H9.6663C9.25209 3.04199 8.9163 3.37778 8.9163 3.79199V4.04199ZM9.20837 8.00033C9.62259 8.00033 9.95837 8.33611 9.95837 8.75033V13.7503C9.95837 14.1645 9.62259 14.5003 9.20837 14.5003C8.79416 14.5003 8.45837 14.1645 8.45837 13.7503V8.75033C8.45837 8.33611 8.79416 8.00033 9.20837 8.00033ZM13.2917 8.75033C13.2917 8.33611 12.9559 8.00033 12.5417 8.00033C12.1275 8.00033 11.7917 8.33611 11.7917 8.75033V13.7503C11.7917 14.1645 12.1275 14.5003 12.5417 14.5003C12.9559 14.5003 13.2917 14.1645 13.2917 13.7503V8.75033Z"
                              fill=""
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

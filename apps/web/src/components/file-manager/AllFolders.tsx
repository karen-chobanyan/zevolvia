"use client";
import React, { useEffect, useState } from "react";
import FolderCard from "./FolderCard";
import { PlusIcon, UploadCloudIcon } from "lucide-react";
import api from "@/lib/axios";
import { updateUploadedFileFolder } from "./uploads-store";
import FileUploaderCard from "./FileUploaderCard";

type FileItem = {
  id?: string;
  name?: string;
  size?: number;
  mimeType?: string;
  folderId?: string | null;
};

type AllFoldersProps = {
  parentId?: string | null;
  pathLabel?: string;
  onOpenFolder?: (folder: { id: string; name: string }) => void;
};

export default function AllFolders({ parentId, pathLabel, onOpenFolder }: AllFoldersProps) {
  const [folders, setFolders] = useState<Array<{ id: string; name: string }>>([]);
  const [stats, setStats] = useState<Record<string, { count: number; size: number }>>({});
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);

  const formatBytes = (bytes: number) => {
    if (!Number.isFinite(bytes) || bytes <= 0) {
      return "0 B";
    }
    const units = ["B", "KB", "MB", "GB", "TB"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, index);
    const rounded = value >= 10 || index === 0 ? Math.round(value) : value.toFixed(1);
    return `${rounded} ${units[index]}`;
  };

  const loadFolders = async () => {
    setIsLoading(true);
    setError(null);
    const [foldersResult, filesResult] = await Promise.allSettled([
      api.get("/file-manager/folders", {
        params: { parentId: parentId ?? "root" },
      }),
      api.get("/file-manager/files"),
    ]);

    if (foldersResult.status === "fulfilled") {
      const data = Array.isArray(foldersResult.value.data) ? foldersResult.value.data : [];
      setFolders(data.map((item: any) => ({ id: item?.id, name: item?.name ?? "Untitled" })));
    } else {
      setFolders([]);
      setError("Failed to load folders.");
    }

    if (filesResult.status === "fulfilled") {
      const files = Array.isArray(filesResult.value.data) ? filesResult.value.data : [];
      setFiles(files);
      const nextStats: Record<string, { count: number; size: number }> = {};
      files.forEach((file: any) => {
        const folderId = file?.folderId;
        if (!folderId) return;
        if (!nextStats[folderId]) {
          nextStats[folderId] = { count: 0, size: 0 };
        }
        nextStats[folderId].count += 1;
        nextStats[folderId].size += Number(file?.size) || 0;
      });
      setStats(nextStats);
    } else {
      setFiles([]);
      setStats({});
    }

    setIsLoading(false);
  };

  useEffect(() => {
    void loadFolders();
    setShowCreate(false);
    setNewName("");
    setError(null);
    setShowUploader(false);
  }, [parentId]);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setError("Folder name is required.");
      return;
    }
    setError(null);
    try {
      const response = await api.post("/file-manager/folders", {
        name: trimmed,
        parentId: parentId ?? null,
      });
      const created = response?.data;
      if (created?.id) {
        setFolders((prev) => [{ id: created.id, name: created.name ?? trimmed }, ...prev]);
        setStats((prev) => ({ ...prev, [created.id]: { count: 0, size: 0 } }));
      }
      setNewName("");
      setShowCreate(false);
    } catch (err) {
      console.error("Failed to create folder", err);
      setError("Failed to create folder.");
    }
  };

  const handleRename = async (id: string, name: string) => {
    setError(null);
    setBusyId(id);
    try {
      await api.patch(`/file-manager/folders/${id}`, { name });
      setFolders((prev) => prev.map((folder) => (folder.id === id ? { ...folder, name } : folder)));
    } catch (err) {
      console.error("Failed to rename folder", err);
      setError("Failed to rename folder.");
      throw err;
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete folder "${name}"? This will delete files inside it.`)) {
      return;
    }
    setError(null);
    setBusyId(id);
    try {
      await api.delete(`/file-manager/folders/${id}`);
      setFolders((prev) => prev.filter((folder) => folder.id !== id));
      setStats((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      console.error("Failed to delete folder", err);
      setError("Failed to delete folder.");
      throw err;
    } finally {
      setBusyId(null);
    }
  };

  const handleDropFile = async (
    target: { id: string; name: string },
    payload: { id?: string; key?: string; size?: number; folderId?: string | null },
  ) => {
    if (!payload.id) {
      return;
    }
    if (payload.folderId && payload.folderId === target.id) {
      return;
    }
    setError(null);
    setBusyId(target.id);
    try {
      await api.patch(`/file-manager/files/${payload.id}`, {
        folderId: target.id,
      });
      updateUploadedFileFolder(payload.id, payload.key, target.id);
      setFiles((prev) =>
        prev.map((file) => (file.id === payload.id ? { ...file, folderId: target.id } : file)),
      );
      const deltaSize = Number(payload.size) || 0;
      setStats((prev) => {
        const next = { ...prev };
        const fromId = payload.folderId;
        if (fromId && next[fromId]) {
          next[fromId] = {
            count: Math.max(0, next[fromId].count - 1),
            size: Math.max(0, next[fromId].size - deltaSize),
          };
        }
        if (!next[target.id]) {
          next[target.id] = { count: 0, size: 0 };
        }
        next[target.id] = {
          count: next[target.id].count + 1,
          size: next[target.id].size + deltaSize,
        };
        return next;
      });
    } catch (err) {
      console.error("Failed to move file", err);
      setError("Failed to move file.");
    } finally {
      setBusyId(null);
    }
  };

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

  const getExtension = (name: string) => {
    const parts = name.split(".");
    if (parts.length < 2) {
      return "";
    }
    return parts[parts.length - 1].toLowerCase();
  };

  const getCategory = (file: FileItem) => {
    const mime = file?.mimeType?.toLowerCase();
    if (mime?.startsWith("image/")) {
      return "Image";
    }
    if (mime?.startsWith("video/")) {
      return "Video";
    }
    if (mime?.startsWith("audio/")) {
      return "Audio";
    }
    const ext = getExtension(file?.name ?? "");
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
  };

  const getIcon = (category: string) => {
    if (category === "Image") {
      return fileIcons.image;
    }
    if (category === "Video") {
      return fileIcons.video;
    }
    return fileIcons.document;
  };

  const currentFiles = files.filter((file) => (file.folderId ?? null) === (parentId ?? null));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-4 py-4 sm:pl-6 sm:pr-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Folders</h3>
          {pathLabel ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">in {pathLabel}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowUploader((prev) => !prev)}
              aria-expanded={showUploader}
              aria-controls="folder-uploader-panel"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-500"
            >
              <UploadCloudIcon size={16} />
              Upload
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreate((prev) => !prev);
                setError(null);
              }}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-500"
            >
              <PlusIcon size={16} />
              New Folder
            </button>
          </div>
        </div>
      </div>
      {showUploader ? (
        <div id="folder-uploader-panel" className="px-4 pb-4 sm:px-6">
          <FileUploaderCard
            folderId={parentId ?? null}
            pathLabel={pathLabel}
            onUploaded={(items) => {
              if (!items.length) {
                return;
              }
              setFiles((prev) => {
                const map = new Map<string, FileItem>();
                prev.forEach((file) => {
                  const key = file.id ?? file.name ?? "";
                  if (key) {
                    map.set(key, file);
                  }
                });
                items.forEach((item) => {
                  const key = item.id ?? item.name;
                  if (!key) {
                    return;
                  }
                  map.set(key, {
                    id: item.id,
                    name: item.name,
                    size: item.size,
                    mimeType: item.mimeType,
                    folderId: item.folderId ?? null,
                  });
                });
                return Array.from(map.values());
              });
              setStats((prev) => {
                const next = { ...prev };
                items.forEach((item) => {
                  const folderId = item.folderId ?? null;
                  if (!folderId) {
                    return;
                  }
                  if (!next[folderId]) {
                    next[folderId] = { count: 0, size: 0 };
                  }
                  next[folderId] = {
                    count: next[folderId].count + 1,
                    size: next[folderId].size + (Number(item.size) || 0),
                  };
                });
                return next;
              });
            }}
          />
        </div>
      ) : null}
      {showCreate ? (
        <div className="px-4 pb-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Folder name"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-100"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCreate}
                className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setNewName("");
                  setError(null);
                }}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:border-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {error ? <div className="px-4 pb-2 text-sm text-error-500 sm:px-6">{error}</div> : null}
      <div className="p-5 border-t border-gray-100 dark:border-gray-800 sm:p-6">
        {isLoading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading folders...</div>
        ) : (
          <>
            {folders.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">No folders yet.</div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
                {folders.map((folder) => {
                  const info = stats[folder.id] ?? { count: 0, size: 0 };
                  return (
                    <FolderCard
                      key={folder.id}
                      title={folder.name}
                      fileCount={`${info.count}`}
                      size={formatBytes(info.size)}
                      onRename={(name) => handleRename(folder.id, name)}
                      onDelete={() => handleDelete(folder.id, folder.name)}
                      onOpen={onOpenFolder ? () => onOpenFolder(folder) : undefined}
                      onDropFile={(payload) => handleDropFile(folder, payload)}
                      busy={busyId === folder.id}
                    />
                  );
                })}
              </div>
            )}
            {currentFiles.length > 0 ? (
              <div className="mt-6 border-t border-gray-100 pt-4 dark:border-gray-800">
                <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
                  Files
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {currentFiles.map((file) => {
                    const category = getCategory(file);
                    const icon = getIcon(category);
                    return (
                      <div
                        key={file.id ?? file.name}
                        className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-200"
                      >
                        <img src={icon.light} alt="" className="h-5 w-5 dark:hidden" />
                        <img src={icon.dark} alt="" className="hidden h-5 w-5 dark:block" />
                        <span className="truncate">{file.name ?? "Untitled"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

"use client";
import React, { useEffect, useState } from "react";

import { MoreDotIcon } from "@/icons";
import { FILE_DRAG_TYPE } from "./drag-constants";
import { DropdownItem } from "@/ui/dropdown/DropdownItem";
import { Dropdown } from "@/ui/dropdown/Dropdown";
interface FolderCardProps {
  title: string;
  fileCount: string;
  size: string;
  onRename?: (name: string) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  onOpen?: () => void;
  onDropFile?: (payload: {
    id?: string;
    key?: string;
    size?: number;
    folderId?: string | null;
  }) => Promise<void> | void;
  busy?: boolean;
}

const FolderCard: React.FC<FolderCardProps> = ({
  title,
  fileCount,
  size,
  onRename,
  onDelete,
  onOpen,
  onDropFile,
  busy = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(title);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  useEffect(() => {
    setDraftName(title);
  }, [title]);

  const handleRenameStart = () => {
    if (!onRename || busy) {
      return;
    }
    setIsEditing(true);
    setError(null);
    closeDropdown();
  };

  const handleRenameCancel = () => {
    setIsEditing(false);
    setDraftName(title);
    setError(null);
  };

  const handleRenameSave = async () => {
    if (!onRename || busy) {
      return;
    }
    const trimmed = draftName.trim();
    if (!trimmed) {
      setError("Folder name is required.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onRename(trimmed);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to rename folder", err);
      setError("Failed to rename folder.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || busy) {
      return;
    }
    closeDropdown();
    try {
      await onDelete();
    } catch (err) {
      console.error("Failed to delete folder", err);
      setError("Failed to delete folder.");
    }
  };

  const handleOpen = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onOpen || busy || isEditing) {
      return;
    }
    const target = event.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("textarea")) {
      return;
    }
    onOpen();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onOpen || busy || isEditing) {
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      onOpen();
    }
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    if (!onDropFile || busy || isEditing) {
      return;
    }
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!onDropFile || busy || isEditing) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (!onDropFile) {
      return;
    }
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    if (!onDropFile || busy || isEditing) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    const raw =
      event.dataTransfer.getData(FILE_DRAG_TYPE) || event.dataTransfer.getData("text/plain");
    if (!raw) {
      return;
    }
    let payload: {
      id?: string;
      key?: string;
      size?: number;
      folderId?: string | null;
    } = {};
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = { id: raw };
    }
    await onDropFile(payload);
  };

  return (
    <div
      className={`rounded-2xl border border-gray-100 bg-gray-50 px-6 py-6 dark:border-gray-800 dark:bg-white/[0.03] xl:py-[27px] ${
        onOpen && !isEditing
          ? "cursor-pointer hover:border-brand-200 dark:hover:border-brand-400/40"
          : ""
      } ${
        isDragOver
          ? "border-brand-400 bg-brand-50/70 dark:border-brand-500/60 dark:bg-brand-500/10"
          : ""
      }`}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : -1}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex justify-between mb-6">
        <div>
          <svg
            width="36"
            height="36"
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M13.3986 4.40674C12.9265 3.77722 12.1855 3.40674 11.3986 3.40674H2.5C1.11929 3.40674 0 4.52602 0 5.90674V30.0959C0 31.4766 1.11929 32.5959 2.5 32.5959H33.5C34.8807 32.5959 36 31.4766 36 30.0959V11.7446C36 10.3639 34.8807 9.24458 33.5 9.24458H18.277C17.4901 9.24458 16.7492 8.87409 16.277 8.24458L13.3986 4.40674Z"
              fill="url(#paint0_linear_2816_28044)"
            />
            <defs>
              <linearGradient
                id="paint0_linear_2816_28044"
                x1="18"
                y1="3.40674"
                x2="18"
                y2="32.5959"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#FFDC78" />
                <stop offset="1" stopColor="#FBBC1A" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="relative">
          <button
            onClick={toggleDropdown}
            className="dropdown-toggle"
            disabled={busy}
            type="button"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          <Dropdown isOpen={isOpen} onClose={closeDropdown} className="w-40 p-2">
            {onRename && (
              <DropdownItem
                onItemClick={handleRenameStart}
                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Rename
              </DropdownItem>
            )}
            {onDelete && (
              <DropdownItem
                onItemClick={handleDelete}
                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Delete
              </DropdownItem>
            )}
          </Dropdown>
        </div>
      </div>
      {isEditing ? (
        <div className="space-y-2">
          <input
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-100"
            disabled={busy || isSaving}
            onClick={(event) => event.stopPropagation()}
          />
          {error ? <p className="text-xs text-error-500">{error}</p> : null}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRenameSave}
              disabled={busy || isSaving}
              className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
              onMouseDown={(event) => event.stopPropagation()}
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleRenameCancel}
              disabled={busy || isSaving}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:border-gray-700 dark:text-gray-300"
              onMouseDown={(event) => event.stopPropagation()}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <h4 className="mb-1 text-sm font-medium text-gray-800 dark:text-white/90">{title}</h4>
          <div className="flex items-center justify-between">
            <span className="block text-sm text-gray-500 dark:text-gray-400">
              {fileCount} Files
            </span>
            <span className="block text-sm text-right text-gray-500 dark:text-gray-400">
              {size}
            </span>
          </div>
          {error ? <p className="mt-2 text-xs text-error-500">{error}</p> : null}
        </>
      )}
    </div>
  );
};

export default FolderCard;

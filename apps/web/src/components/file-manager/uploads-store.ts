"use client";

import { useEffect, useState } from "react";

export type UploadedFileItem = {
  id?: string;
  key?: string;
  name: string;
  size: number;
  url?: string;
  createdAt?: string;
  mimeType?: string;
  folderId?: string | null;
};

type Listener = () => void;

const listeners = new Set<Listener>();
let uploadedFiles: UploadedFileItem[] = [];

function notify() {
  listeners.forEach((listener) => listener());
}

export function addUploadedFiles(files: UploadedFileItem[]) {
  if (!files.length) {
    return;
  }
  const existing = new Map<string, UploadedFileItem>();
  uploadedFiles.forEach((file) => {
    const key = file.id ?? file.key ?? file.name;
    existing.set(key, file);
  });
  files.forEach((file) => {
    const key = file.id ?? file.key ?? file.name;
    existing.set(key, file);
  });
  uploadedFiles = Array.from(existing.values()).sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
  notify();
}

export function setUploadedFiles(files: UploadedFileItem[]) {
  uploadedFiles = [...files];
  notify();
}

export function removeUploadedFile(id?: string, key?: string) {
  if (!id && !key) {
    return;
  }
  uploadedFiles = uploadedFiles.filter((file) => {
    if (id && file.id === id) {
      return false;
    }
    if (key && file.key === key) {
      return false;
    }
    return true;
  });
  notify();
}

export function updateUploadedFileFolder(id?: string, key?: string, folderId?: string | null) {
  if (!id && !key) {
    return;
  }
  uploadedFiles = uploadedFiles.map((file) => {
    if (id && file.id === id) {
      return { ...file, folderId: folderId ?? null };
    }
    if (key && file.key === key) {
      return { ...file, folderId: folderId ?? null };
    }
    return file;
  });
  notify();
}

export function useUploadedFiles() {
  const [files, setFiles] = useState(uploadedFiles);

  useEffect(() => {
    const listener = () => setFiles(uploadedFiles);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return files;
}

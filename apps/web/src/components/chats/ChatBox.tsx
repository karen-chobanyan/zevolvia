"use client";

import api from "@/lib/axios";
import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import type { ChatMessage } from "./chat-types";
import ChatBoxHeader from "./ChatBoxHeader";
import ChatBoxSendForm from "./ChatBoxSendForm";
import PdfPreviewModal from "./PdfPreviewModal";

interface ChatBoxProps {
  messages: ChatMessage[];
  sessionTitle: string;
  loading?: boolean;
  error?: string | null;
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  sending?: boolean;
  onNewChat: () => void;
  useGlobalKnowledge?: boolean;
  onGlobalKnowledgeChange?: (checked: boolean) => void;
}

function formatRelative(value: string) {
  const now = Date.now();
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) {
    return "";
  }
  const diff = Math.max(0, now - time);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

type CitationItem = {
  id?: string;
  distance?: number;
  metadata?: Record<string, any> | null;
};

function extractCitations(metadata?: Record<string, unknown> | null): CitationItem[] {
  const raw = (metadata as any)?.citations_raw;
  if (Array.isArray(raw)) {
    return raw;
  }
  return [];
}

function buildCitationTitle(meta?: Record<string, any> | null) {
  if (!meta) {
    return "Source";
  }
  return meta.title || meta.filename || meta.source || meta.doc_id || "Source";
}

function getCitationFileId(meta?: Record<string, any> | null) {
  if (!meta) {
    return null;
  }
  return meta.file_id || meta.fileId || null;
}

function getCitationUrl(meta?: Record<string, any> | null) {
  if (!meta) {
    return null;
  }
  const url: string | null =
    meta.url ||
    meta.publicUrl ||
    meta.sourceUrl ||
    (typeof meta.source === "string" && meta.source.startsWith("http") ? meta.source : null);
  return url;
}

function buildCitationLink(baseUrl: string | null, page?: number) {
  if (!baseUrl) {
    return null;
  }
  if (page) {
    const anchor = baseUrl.includes("#") ? `&page=${page}` : `#page=${page}`;
    return `${baseUrl}${anchor}`;
  }
  return baseUrl;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

function buildApiUrl(path: string) {
  if (!API_BASE_URL) {
    return path;
  }
  return `${API_BASE_URL.replace(/\/$/, "")}${path}`;
}

function buildPreviewUrl(fileId?: string | null) {
  if (!fileId) {
    return null;
  }
  return buildApiUrl(`/file-manager/files/${fileId}/pdf`);
}

function isPdfFile(item?: { mimeType?: string; name?: string }) {
  if (!item) {
    return false;
  }
  if (item.mimeType === "application/pdf") {
    return true;
  }
  return Boolean(item.name?.toLowerCase().endsWith(".pdf"));
}

export default function ChatBox({
  messages,
  sessionTitle,
  loading,
  error,
  draft,
  onDraftChange,
  onSend,
  sending,
  onNewChat,
  useGlobalKnowledge,
  onGlobalKnowledgeChange,
}: ChatBoxProps) {
  const [activeCitationId, setActiveCitationId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    url: string;
    externalUrl?: string;
    title: string;
    page?: number;
  } | null>(null);
  const [fileUrlById, setFileUrlById] = useState<Record<string, string>>({});
  const [loadingFileUrls, setLoadingFileUrls] = useState(false);
  const hasLoadedFileUrls = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const lastMessageCountRef = useRef(0);
  const [citationPosition, setCitationPosition] = useState<{
    align: "left" | "right";
    vertical: "above" | "below";
  }>({ align: "left", vertical: "below" });
  const citationRef = useRef<HTMLDivElement | null>(null);
  const citationAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!activeCitationId) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (citationRef.current?.contains(target)) return;
      setActiveCitationId(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [activeCitationId]);

  useLayoutEffect(() => {
    if (!activeCitationId) {
      return;
    }

    const updatePosition = () => {
      const anchor = citationAnchorRef.current;
      const popover = citationRef.current;
      if (!anchor || !popover) {
        return;
      }

      const anchorRect = anchor.getBoundingClientRect();
      const popoverRect = popover.getBoundingClientRect();
      const isNarrow = window.innerWidth < 640;
      let align: "left" | "right" = isNarrow ? "right" : "left";

      if (!isNarrow) {
        const overflowRight = anchorRect.left + popoverRect.width > window.innerWidth - 12;
        const overflowLeft = anchorRect.right - popoverRect.width < 12;
        if (overflowRight && !overflowLeft) {
          align = "right";
        }
      }

      let vertical: "above" | "below" = "below";
      const spaceBelow = window.innerHeight - anchorRect.bottom;
      const spaceAbove = anchorRect.top;
      if (spaceBelow < popoverRect.height + 12 && spaceAbove > popoverRect.height + 12) {
        vertical = "above";
      }

      setCitationPosition({ align, vertical });
    };

    const frame = requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [activeCitationId]);

  useEffect(() => {
    if (!activeCitationId || loadingFileUrls || hasLoadedFileUrls.current) {
      return;
    }
    const activeMessage = messages.find((message) => message.id === activeCitationId);
    if (!activeMessage) {
      return;
    }
    const citations = extractCitations(activeMessage.metadata);
    const needsLookup = citations.some((item) => {
      const meta = item.metadata || {};
      const fileId = getCitationFileId(meta);
      return !getCitationUrl(meta) && fileId && !fileUrlById[fileId];
    });
    if (!needsLookup) {
      return;
    }

    let isMounted = true;
    setLoadingFileUrls(true);
    hasLoadedFileUrls.current = true;
    api
      .get("/file-manager/files")
      .then((response) => {
        const data = Array.isArray(response.data) ? response.data : [];
        const next: Record<string, string> = {};
        data.forEach((item) => {
          if (!item?.id) {
            return;
          }
          if (item?.url) {
            next[item.id] = item.url;
            return;
          }
          if (isPdfFile(item)) {
            next[item.id] = buildApiUrl(`/file-manager/files/${item.id}/pdf`);
          }
        });
        if (isMounted) {
          setFileUrlById((prev) => ({ ...prev, ...next }));
        }
      })
      .catch((error) => {
        console.error("Failed to load file URLs for citations", error);
      })
      .finally(() => {
        if (isMounted) {
          setLoadingFileUrls(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeCitationId, loadingFileUrls, messages, fileUrlById]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    const hasNewMessage = messages.length > lastMessageCountRef.current;
    lastMessageCountRef.current = messages.length;
    const behavior: ScrollBehavior = hasNewMessage || sending ? "smooth" : "auto";
    const frame = requestAnimationFrame(() => {
      container.scrollTo({ top: container.scrollHeight, behavior });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, sending]);

  const citationPositionClass = `${
    citationPosition.align === "right" ? "right-0" : "left-0"
  } ${citationPosition.vertical === "above" ? "bottom-full mb-2" : "top-full mt-2"}`;

  const openPreview = (
    event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
    baseUrl: string | null,
    externalUrl: string | null,
    title: string,
    page?: number,
  ) => {
    if (!baseUrl) {
      return;
    }
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    setActiveCitationId(null);
    setPreview({
      url: baseUrl,
      externalUrl: externalUrl ?? undefined,
      title,
      page,
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] xl:w-3/4">
      <ChatBoxHeader sessionTitle={sessionTitle} onNewChat={onNewChat} sending={sending} />
      <div
        ref={scrollContainerRef}
        className="flex-1 max-h-full p-5 space-y-6 overflow-auto custom-scrollbar xl:space-y-8 xl:p-6"
      >
        {error && (
          <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-2  text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-lg border border-dashed border-gray-200 px-4 py-6  text-gray-500 dark:border-gray-800 dark:text-gray-400">
            Loading conversation...
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 px-4 py-6  text-gray-500 dark:border-gray-800 dark:text-gray-400">
            Ask a question to start the conversation.
          </div>
        ) : (
          messages.map((chat) => {
            const isUser = chat.role === "user";
            const citations = extractCitations(chat.metadata);
            const isOpen = activeCitationId === chat.id;
            return (
              <div key={chat.id} className={`flex ${isUser ? "justify-end" : "items-start gap-4"}`}>
                {!isUser && (
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white p-1 shadow-sm dark:bg-gray-900">
                    <Image
                      src="/images/logo/DWavatar.jpg"
                      alt="Zevolvia"
                      width={32}
                      height={32}
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}

                <div className={`${isUser ? "text-right" : ""} max-w-[80%]`}>
                  <div
                    className={`px-3 py-2 rounded-lg ${
                      isUser
                        ? "bg-brand-500 text-white dark:bg-brand-500"
                        : "bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-white/90"
                    } ${isUser ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                  >
                    <p className=" whitespace-pre-line">{chat.message}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        {sending && !loading && (
          <div className="flex items-start gap-4 " role="status" aria-live="polite">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white p-1 shadow-sm dark:bg-gray-900">
              <Image
                src="/images/logo/DWavatar.jpg"
                alt="Zevolvia"
                width={32}
                height={32}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="max-w-[80%]">
              <div className="flex items-center gap-2 rounded-lg rounded-tl-sm bg-gray-100 px-3 py-2 text-gray-800 dark:bg-white/5 dark:text-white/90">
                <span className="sr-only">Zevolvia is typing</span>
                <div className="flex items-center gap-1" aria-hidden="true">
                  <span
                    className="h-2 w-2 rounded-full bg-gray-400/80 animate-bounce"
                    style={{ animationDelay: "0ms", animationDuration: "1s" }}
                  />
                  <span
                    className="h-2 w-2 rounded-full bg-gray-400/80 animate-bounce"
                    style={{ animationDelay: "150ms", animationDuration: "1s" }}
                  />
                  <span
                    className="h-2 w-2 rounded-full bg-gray-400/80 animate-bounce"
                    style={{ animationDelay: "300ms", animationDuration: "1s" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <ChatBoxSendForm
        value={draft}
        onChange={onDraftChange}
        onSubmit={onSend}
        disabled={sending || loading}
        isSending={sending}
        checked={useGlobalKnowledge}
        onCheckedChange={onGlobalKnowledgeChange}
      />
      <PdfPreviewModal
        isOpen={Boolean(preview)}
        url={preview?.url}
        title={preview?.title}
        initialPage={preview?.page}
        onClose={() => setPreview(null)}
      />
      {/* <!-- ====== Chat Box End --> */}
    </div>
  );
}

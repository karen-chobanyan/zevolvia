"use client";

import { Modal } from "@/ui/modal";
import { DownloadIcon } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

type PdfPreviewModalProps = {
  isOpen: boolean;
  url?: string | null;
  title?: string | null;
  initialPage?: number;
  onClose: () => void;
};

type PdfjsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

function isRenderCancelError(err: any) {
  const msg = String(err?.message || "").toLowerCase();
  const name = String(err?.name || "").toLowerCase();
  return (
    name.includes("renderingcancel") ||
    msg.includes("rendering cancelled") ||
    msg.includes("rendering canceled") ||
    msg.includes("cancelled") ||
    msg.includes("canceled")
  );
}

export default function PdfPreviewModal({
  isOpen,
  url,
  title,
  initialPage,
  onClose,
}: PdfPreviewModalProps) {
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfjsRef = useRef<PdfjsModule | null>(null);
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);

  const measureContainerWidth = () => {
    const container = containerRef.current;
    if (!container) return;
    const nextWidth = container.getBoundingClientRect().width;
    if (nextWidth) setContainerWidth(nextWidth);
  };

  const shouldSendCredentials = (value?: string | null) => {
    if (!value) return false;
    if (value.startsWith("/")) return true;

    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) return false;

    return value.startsWith(base.replace(/\/$/, ""));
  };

  const getDownloadUrl = (value?: string | null) => {
    if (!value) return null;
    const [base, hash] = value.split("#");
    const separator = base.includes("?") ? "&" : "?";
    const next = `${base}${separator}download=1`;
    return hash ? `${next}#${hash}` : next;
  };

  const canDownload = (value?: string | null) => {
    if (!value) return false;
    if (value.startsWith("/")) return true;
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) return false;
    return value.startsWith(base.replace(/\/$/, ""));
  };

  // Reset page when opening / url changes
  useEffect(() => {
    if (!isOpen) return;

    const startPage =
      initialPage && Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1;
    setPage(startPage);
  }, [isOpen, initialPage, url]);

  // ResizeObserver with rAF throttling
  useLayoutEffect(() => {
    if (!isOpen) return;

    let raf = 0;
    const updateWidth = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        measureContainerWidth();
      });
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [isOpen]);

  // Load PDF
  useEffect(() => {
    if (!isOpen || !url) return;

    let cancelled = false;

    // Reset state for new doc
    setLoading(true);
    setError(null);
    setPageCount(0);

    // Clear canvas (prevents old page flashing)
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }

    const loadPdf = async () => {
      try {
        if (!pdfjsRef.current) {
          pdfjsRef.current = await import("pdfjs-dist/legacy/build/pdf.mjs");
        }
        const pdfjs = pdfjsRef.current;
        if (!pdfjs) throw new Error("Unable to load PDF renderer.");

        // Worker setup
        if (!pdfjs.GlobalWorkerOptions.workerSrc) {
          pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
            import.meta.url,
          ).toString();

          // If workerSrc ever fails in your deployment, the most robust option is:
          // pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
          // (copy the worker file into /public)
        }

        const loadingTask = pdfjs.getDocument({
          url,
          withCredentials: shouldSendCredentials(url),
        });

        const doc = await loadingTask.promise;
        if (cancelled) {
          await doc.destroy();
          return;
        }

        pdfDocRef.current = doc;
        setPageCount(doc.numPages);

        const start = initialPage && initialPage > 0 ? initialPage : 1;
        setPage(Math.min(Math.max(start, 1), doc.numPages));

        requestAnimationFrame(measureContainerWidth);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load PDF.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel?.();
      if (pdfDocRef.current?.destroy) pdfDocRef.current.destroy();
      pdfDocRef.current = null;
    };
  }, [isOpen, url, initialPage]);

  // Render current page
  useEffect(() => {
    if (!isOpen || !pdfDocRef.current || !canvasRef.current) return;
    if (pageCount > 0 && (page < 1 || page > pageCount)) return;

    let cancelled = false;
    setRendering(true);

    const renderPage = async () => {
      try {
        const doc = pdfDocRef.current;
        const pageObj = await doc.getPage(page);
        if (cancelled) return;

        const unscaled = pageObj.getViewport({ scale: 1 });

        // Fit-to-width scaling with a cap
        const baseWidth = containerWidth > 0 ? containerWidth : unscaled.width;
        const scale = Math.min(2, baseWidth / unscaled.width);
        const viewport = pageObj.getViewport({ scale });

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // HiDPI / retina fix
        const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

        // Set CSS size (logical pixels)
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        // Set backing store size (device pixels)
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);

        // Reset transforms and scale for DPR
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        renderTaskRef.current?.cancel?.();
        const task = pageObj.render({
          canvasContext: ctx,
          viewport,
        });
        renderTaskRef.current = task;

        await task.promise;

        // Release page resources
        pageObj.cleanup?.();
      } catch (err: any) {
        if (!cancelled && !isRenderCancelError(err)) {
          setError(err?.message || "Failed to render PDF.");
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    };

    renderPage();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel?.();
    };
  }, [isOpen, page, containerWidth, pageCount]);

  const canPrev = page > 1;
  const canNext = pageCount > 0 && page < pageCount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-5xl mx-4 my-6 p-6 max-h-[90vh] overflow-hidden"
    >
      <div className="flex h-[80vh] flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">PDF Preview</p>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90">
              {title || "Document"}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => canPrev && setPage((p) => Math.max(1, p - 1))}
              disabled={!canPrev || loading}
              className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 disabled:opacity-50 dark:border-gray-800 dark:text-gray-200"
            >
              Prev
            </button>

            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {pageCount ? `${page} / ${pageCount}` : `${page}`}
            </span>

            <button
              type="button"
              onClick={() => canNext && setPage((p) => Math.min(pageCount, p + 1))}
              disabled={!canNext || loading}
              className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 disabled:opacity-50 dark:border-gray-800 dark:text-gray-200"
            >
              Next
            </button>

            {url && (
              <a
                download={title || "document"}
                href={url}
                className="flex mr-12 items-center rounded-full border border-transparent px-3 py-1.5 text-xs font-semibold text-pink-700 hover:text-pink-900 dark:text-gray-300 dark:hover:text-white"
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                Download
              </a>
            )}
          </div>
        </div>

        <div
          ref={containerRef}
          className="relative flex-1 overflow-x-hidden overflow-auto rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950"
        >
          {loading && (
            <div className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              Loading PDF...
            </div>
          )}

          {error && !loading && (
            <div className="flex h-full items-center justify-center text-sm text-error-600 dark:text-error-400">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="flex justify-center">
              <canvas ref={canvasRef} className="rounded-xl bg-white shadow-md" />
            </div>
          )}

          {rendering && !loading && (
            <div className="absolute inset-x-0 bottom-4 text-center text-xs text-gray-500 dark:text-gray-400">
              Rendering page...
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Loader2,
  FileText,
  Calendar,
  HardDrive,
  BookOpen,
  Hash,
  CheckCircle,
  Clock,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { DocumentData } from '@/lib/api';

// Configure pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DocumentViewerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [doc, setDoc] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // PDF viewer state
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fetchDocument = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getDocument(id);
      setDoc(res.data);
    } catch {
      setError('Document not found or you do not have access.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPdfLoading(false);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= numPages) {
      setCurrentPage(page);
    }
  };

  const zoomIn = () => setScale((s) => Math.min(s + 0.2, 3));
  const zoomOut = () => setScale((s) => Math.max(s - 0.2, 0.5));

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goToPage(currentPage - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goToPage(currentPage + 1);
      } else if (e.key === '+' || e.key === '=') {
        zoomIn();
      } else if (e.key === '-') {
        zoomOut();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, numPages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
          <p className="text-sm text-muted">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="text-center py-32">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Document Not Found
        </h2>
        <p className="text-sm text-muted mb-6">{error}</p>
        <Link
          href="/dashboard"
          className="btn-primary !py-2 !px-4 !text-sm no-underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Documents
        </Link>
      </div>
    );
  }

  const isPdf = doc.format === 'pdf';
  const pdfUrl = doc.fileUrl;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-brand-blue transition-colors no-underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Documents
      </Link>

      {/* Document Header */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-brand-blue-50 dark:bg-brand-blue-50/20 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-brand-blue" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground line-clamp-2">
              {doc.title}
            </h1>
            {doc.author && (
              <p className="text-sm text-muted mt-1">by {doc.author}</p>
            )}

            {/* Meta Grid */}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                {doc.format.toUpperCase()}
              </span>
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5" />
                {formatFileSize(doc.fileSize)}
              </span>
              {doc.totalPages && (
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  {doc.totalPages} pages
                </span>
              )}
              {doc.wordsCount && (
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" />
                  {doc.wordsCount.toLocaleString()} words
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(doc.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                {doc.isProcessed ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600">Processed</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-amber-500">Processing...</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      {isPdf ? (
        <div
          className={`bg-surface border border-border rounded-2xl overflow-hidden ${
            isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : ''
          }`}
        >
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 text-sm">
                <input
                  type="number"
                  min={1}
                  max={numPages || 1}
                  value={currentPage}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) goToPage(val);
                  }}
                  className="w-12 text-center px-1 py-0.5 rounded-md border border-border bg-background text-sm text-foreground"
                />
                <span className="text-muted">of {numPages || '...'}</span>
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= numPages}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={zoomOut}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs text-muted w-12 text-center font-medium">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={zoomIn}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-border mx-1" />
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* PDF Canvas */}
          <div
            className={`overflow-auto bg-gray-100 dark:bg-gray-950 flex justify-center ${
              isFullscreen ? 'h-[calc(100vh-52px)]' : 'h-[70vh]'
            }`}
          >
            {pdfLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
                  <p className="text-sm text-muted">Loading PDF...</p>
                </div>
              </div>
            )}
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={() => setPdfLoading(false)}
              loading={null}
              className="py-6"
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                className="shadow-xl rounded-sm"
                loading={
                  <div className="flex items-center justify-center py-40">
                    <Loader2 className="w-6 h-6 text-brand-blue animate-spin" />
                  </div>
                }
              />
            </Document>
          </div>
        </div>
      ) : (
        /* Non-PDF placeholder */
        <div className="bg-surface border border-border rounded-2xl p-12 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-gray-900 flex items-center justify-center mx-auto mb-5">
            <FileText className="w-8 h-8 text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {doc.format.toUpperCase()} Viewer
          </h3>
          <p className="text-sm text-muted max-w-md mx-auto">
            In-browser rendering for {doc.format.toUpperCase()} files is coming
            soon. For now, you can still use the AI Q&A feature to ask questions
            about this document once it&apos;s processed.
          </p>
        </div>
      )}
    </div>
  );
}

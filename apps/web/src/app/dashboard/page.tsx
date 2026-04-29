'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Upload,
  Search,
  FileText,
  Trash2,
  Clock,
  HardDrive,
  BookOpen,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  File,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { DocumentData } from '@/lib/api';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const formatBadgeColor: Record<string, string> = {
  pdf: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
  epub: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
  txt: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export default function DashboardPage() {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDocuments = useCallback(
    async (searchQuery?: string, pageNum?: number) => {
      setLoading(true);
      try {
        const res = await api.getDocuments({
          search: searchQuery || undefined,
          page: pageNum || 1,
          limit: 12,
        });
        setDocuments(res.data);
      } catch {
        // Silently fail for now
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setPage(1);
      fetchDocuments(value, 1);
    }, 400);
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    // Validate
    const validTypes = [
      'application/pdf',
      'application/epub+zip',
      'text/plain',
    ];
    if (!validTypes.includes(file.type)) {
      setUploadError(
        'Invalid file type. Please upload a PDF, EPUB, or TXT file.',
      );
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File too large. Maximum size is 10MB.');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      await api.uploadDocument(file);
      setUploadSuccess(
        'Document uploaded successfully! Processing will begin shortly.',
      );
      fetchDocuments(search, page);
      // Clear success after 5s
      setTimeout(() => setUploadSuccess(''), 5000);
    } catch (err) {
      if (err instanceof ApiError) {
        setUploadError(err.message);
      } else {
        setUploadError('Upload failed. Please try again.');
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setDeleteConfirm(null);
    } catch {
      // Could show error toast
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleUpload(e.dataTransfer.files);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchDocuments(search, newPage);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Documents</h1>
        <p className="text-sm text-muted mt-1">
          Upload and manage your reading library
        </p>
      </div>

      {/* Upload Zone */}
      <div
        className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 mb-8 ${
          dragActive
            ? 'border-brand-blue bg-brand-blue-50 dark:bg-brand-blue-50/10'
            : 'border-gray-200 dark:border-gray-800 hover:border-brand-blue/50 hover:bg-gray-50 dark:hover:bg-gray-900'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.epub,.txt"
          onChange={(e) => handleUpload(e.target.files)}
          className="hidden"
          id="file-upload"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
            <p className="text-sm font-medium text-foreground">
              Uploading your document...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="w-14 h-14 rounded-2xl bg-brand-blue-50 dark:bg-brand-blue-50/20 flex items-center justify-center">
              <Upload className="w-6 h-6 text-brand-blue" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Drag and drop your file here, or{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-brand-blue font-semibold hover:underline"
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-muted mt-1">
                PDF, EPUB, or TXT — up to 10MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      {uploadError && (
        <div className="mb-6 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {uploadError}
          <button
            onClick={() => setUploadError('')}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {uploadSuccess && (
        <div className="mb-6 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {uploadSuccess}
          <button
            onClick={() => setUploadSuccess('')}
            className="ml-auto text-emerald-400 hover:text-emerald-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search documents by title or author..."
          className="input-field !pl-11 !rounded-xl"
        />
        {search && (
          <button
            onClick={() => {
              setSearch('');
              fetchDocuments('', 1);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Document Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
            <p className="text-sm text-muted">Loading documents...</p>
          </div>
        </div>
      ) : documents.length === 0 ? (
        /* Empty State */
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-gray-900 flex items-center justify-center mx-auto mb-5">
            <BookOpen className="w-8 h-8 text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {search ? 'No documents found' : 'Your library is empty'}
          </h3>
          <p className="text-sm text-muted max-w-sm mx-auto">
            {search
              ? `No documents match "${search}". Try a different search.`
              : 'Upload your first document to get started. Drag and drop a PDF, EPUB, or text file above.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="group relative bg-surface border border-border rounded-xl p-5 hover:shadow-md hover:border-brand-blue/20 transition-all duration-200"
              >
                {/* Delete confirm overlay */}
                {deleteConfirm === doc.id && (
                  <div className="absolute inset-0 bg-surface/95 rounded-xl flex flex-col items-center justify-center gap-3 z-10 animate-fade-in">
                    <p className="text-sm font-medium text-foreground">
                      Delete this document?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="px-4 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 text-foreground text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3.5">
                  {/* File icon */}
                  <div className="w-11 h-11 rounded-xl bg-brand-blue-50 dark:bg-brand-blue-50/20 flex items-center justify-center flex-shrink-0">
                    {doc.format === 'pdf' ? (
                      <File className="w-5 h-5 text-red-500" />
                    ) : (
                      <FileText className="w-5 h-5 text-brand-blue" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/dashboard/documents/${doc.id}`}
                      className="text-sm font-semibold text-foreground hover:text-brand-blue transition-colors no-underline line-clamp-1"
                    >
                      {doc.title}
                    </Link>
                    {doc.author && (
                      <p className="text-xs text-muted mt-0.5 line-clamp-1">
                        by {doc.author}
                      </p>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => setDeleteConfirm(doc.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                    aria-label="Delete document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Meta */}
                <div className="mt-4 flex items-center gap-3 flex-wrap">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      formatBadgeColor[doc.format] || formatBadgeColor.txt
                    }`}
                  >
                    {doc.format}
                  </span>

                  {doc.isProcessed ? (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                      <CheckCircle className="w-3 h-3" />
                      Ready
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-amber-500">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Processing
                    </span>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-border-subtle flex items-center gap-4 text-[11px] text-muted">
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3 h-3" />
                    {formatFileSize(doc.fileSize)}
                  </span>
                  {doc.totalPages && (
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {doc.totalPages} pages
                    </span>
                  )}
                  <span className="flex items-center gap-1 ml-auto">
                    <Clock className="w-3 h-3" />
                    {formatDate(doc.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-border hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 text-sm font-medium text-foreground">
              Page {page}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={documents.length < 12}
              className="p-2 rounded-lg border border-border hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

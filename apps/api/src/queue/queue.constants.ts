export const CLEANUP_QUEUE = 'cleanup';
export const DOCUMENT_PROCESSING_QUEUE = 'document-processor';

export enum CleanupJob {
  CLEANUP_FILE = 'cleanup-file',
}

export enum DocumentProcessingJob {
  PROCESS_DOCUMENT = 'process-document',
}

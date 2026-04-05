export type JobStatus =
  | 'uploaded'
  | 'pending_confirmation'
  | 'processing'
  | 'waiting_user_input'
  | 'reprocessing'
  | 'completed'
  | 'failed'
  | 'queued_overload';

export type TargetLanguage = 'hebrew' | 'english' | 'french';
export type TranslationStyle = 'accurate' | 'fluent';
export type ProcessingMode = 'first_page' | 'full';
export type Confidence = 'high' | 'medium' | 'low';

export interface UncertainTerm {
  id: string;
  snippet: string;
  context: string;
  reason: string;
  suggested_guess?: string;
  question: string;
}

export interface AIPageResult {
  transcription: string;
  translation: string;
  confidence: Confidence;
  uncertain_terms: UncertainTerm[];
}

export interface DocumentRecord {
  id: string;
  fileName: string;
  fileSize: number;
  filePath: string;
  mimeType: string;
  pageCount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobPageRecord {
  id: string;
  jobId: string;
  pageNumber: number;
  imagePath: string | null;
  transcription: string | null;
  translation: string | null;
  confidence: string | null;
  uncertainTerms: UncertainTerm[] | null;
  status: string;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobRecord {
  id: string;
  documentId: string;
  status: JobStatus;
  targetLanguage: TargetLanguage;
  style: TranslationStyle;
  mode: ProcessingMode;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  document?: DocumentRecord;
  pages?: JobPageRecord[];
}

export interface CorrectionRecord {
  id: string;
  jobId: string;
  termId: string;
  pageNumber: number;
  originalSnippet: string;
  userCorrection: string;
  createdAt: string;
}

export interface DebugLogRecord {
  id: string;
  jobId: string;
  pageId: string | null;
  stage: string;
  request: Record<string, unknown> | null;
  response: Record<string, unknown> | null;
  error: string | null;
  createdAt: string;
}

export interface UploadFormData {
  targetLanguage: TargetLanguage;
  style: TranslationStyle;
  mode: ProcessingMode;
}

export interface UserCorrection {
  termId: string;
  pageNumber: number;
  originalSnippet: string;
  correction: string;
}

export interface ExportOptions {
  format: 'pdf' | 'docx';
  includeOriginal: boolean;
  includeTranscription: boolean;
}

export interface PageVersionRecord {
  id: string;
  pageId: string;
  version: number;
  transcription: string | null;
  translation: string | null;
  confidence: string | null;
  uncertainTerms: UncertainTerm[] | null;
  corrections: UserCorrection[] | null;
  createdAt: string;
}

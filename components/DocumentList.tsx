'use client';

import { useState } from 'react';
import Link from 'next/link';
import JobStatusBadge from './JobStatusBadge';
import type { JobStatus } from '@/types';

interface DocumentJob {
  id: string;
  status: JobStatus;
  targetLanguage: string;
  createdAt: string;
}

interface DocumentWithJob {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  pageCount: number | null;
  createdAt: string;
  updatedAt: string;
  jobs: DocumentJob[];
}

interface DocumentListProps {
  documents: DocumentWithJob[];
  onDelete: (docId: string) => Promise<void>;
  onTranslate: (docId: string) => void;
}

type SortKey = 'createdAt' | 'fileName' | 'fileSize' | 'status';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const LANGUAGE_LABELS: Record<string, string> = {
  hebrew: 'Hebrew',
  english: 'English',
  french: 'Modern French',
};

export default function DocumentList({ documents, onDelete, onTranslate }: DocumentListProps) {
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  }

  const sorted = [...documents].sort((a, b) => {
    let aVal: string | number = 0;
    let bVal: string | number = 0;

    if (sortKey === 'createdAt') {
      aVal = new Date(a.createdAt).getTime();
      bVal = new Date(b.createdAt).getTime();
    } else if (sortKey === 'fileName') {
      aVal = a.fileName.toLowerCase();
      bVal = b.fileName.toLowerCase();
    } else if (sortKey === 'fileSize') {
      aVal = a.fileSize;
      bVal = b.fileSize;
    } else if (sortKey === 'status') {
      aVal = a.jobs[0]?.status ?? 'z';
      bVal = b.jobs[0]?.status ?? 'z';
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  async function handleDelete(docId: string) {
    if (!confirm('Delete this document and all associated translations?')) return;
    setDeletingId(docId);
    try {
      await onDelete(docId);
    } finally {
      setDeletingId(null);
    }
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-16 text-ink-700/40">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
        <p>No documents yet. Upload a document to get started.</p>
      </div>
    );
  }

  function SortButton({ label, sortId }: { label: string; sortId: SortKey }) {
    const active = sortKey === sortId;
    return (
      <button
        onClick={() => handleSort(sortId)}
        className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wider
          transition-colors ${active ? 'text-ink-800' : 'text-ink-700/40 hover:text-ink-700/70'}`}
      >
        {label}
        <span className="opacity-60">
          {active ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </button>
    );
  }

  return (
    <div>
      {/* Sort controls */}
      <div className="flex items-center gap-4 mb-4 px-1">
        <span className="text-xs text-ink-700/40">Sort by:</span>
        <SortButton label="Date" sortId="createdAt" />
        <SortButton label="Name" sortId="fileName" />
        <SortButton label="Size" sortId="fileSize" />
        <SortButton label="Status" sortId="status" />
      </div>

      {/* Document cards */}
      <div className="space-y-3">
        {sorted.map((doc) => {
          const latestJob = doc.jobs[0];
          const isTranslated = latestJob?.status === 'completed';

          return (
            <div
              key={doc.id}
              className="border border-parchment-200 rounded-xl p-4 hover:border-parchment-300
                transition-colors bg-white group"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 w-10 h-12 rounded border border-parchment-200
                  bg-parchment-50 flex items-center justify-center">
                  {doc.mimeType === 'application/pdf' ? (
                    <span className="text-xs font-bold text-red-500">PDF</span>
                  ) : (
                    <svg className="w-5 h-5 text-parchment-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-ink-800 font-medium truncate max-w-xs">{doc.fileName}</h3>
                    {isTranslated && (
                      <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full border border-green-200">
                        Translated → {LANGUAGE_LABELS[latestJob.targetLanguage] ?? latestJob.targetLanguage}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-ink-700/50">
                    <span>{formatBytes(doc.fileSize)}</span>
                    {doc.pageCount && <span>{doc.pageCount} page{doc.pageCount !== 1 ? 's' : ''}</span>}
                    <span>{formatDate(doc.createdAt)}</span>
                  </div>
                  {latestJob && (
                    <div className="mt-2">
                      <JobStatusBadge status={latestJob.status} size="sm" />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {latestJob && ['completed', 'waiting_user_input', 'processing', 'reprocessing'].includes(latestJob.status) ? (
                    <Link
                      href={`/jobs/${latestJob.id}`}
                      className="px-3 py-1.5 bg-ink-900 text-parchment-100 rounded-lg text-xs
                        font-medium hover:bg-ink-800 transition-colors"
                    >
                      {latestJob.status === 'completed' ? 'View Results' : 'View Status'}
                    </Link>
                  ) : (
                    <button
                      onClick={() => onTranslate(doc.id)}
                      className="px-3 py-1.5 bg-parchment-200 text-ink-800 rounded-lg text-xs
                        font-medium hover:bg-parchment-300 transition-colors"
                    >
                      Translate
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="p-1.5 text-ink-700/30 hover:text-red-500 transition-colors rounded-lg
                      hover:bg-red-50 disabled:opacity-50"
                    title="Delete document"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

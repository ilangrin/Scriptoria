'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DocumentList from '@/components/DocumentList';

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<never[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/documents');
      if (!res.ok) throw new Error('Failed to fetch documents');
      const data = await res.json();
      setDocuments(data.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  async function handleDelete(docId: string) {
    const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? 'Delete failed');
    }
    await fetchDocuments();
  }

  function handleTranslate(docId: string) {
    router.push(`/upload?docId=${docId}`);
  }

  const translated = documents.filter(
    (d: { jobs: { status: string }[] }) => d.jobs?.[0]?.status === 'completed'
  );
  const untranslated = documents.filter(
    (d: { jobs: { status: string }[] }) => d.jobs?.[0]?.status !== 'completed'
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink-800">Documents</h1>
          <p className="text-ink-700/50 text-sm mt-1">
            {documents.length} document{documents.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link
          href="/upload"
          className="px-4 py-2 bg-ink-900 text-parchment-100 rounded-xl text-sm font-medium
            hover:bg-ink-800 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          New Translation
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-ink-700/40">
          <svg className="w-8 h-8 animate-spin mx-auto mb-3 opacity-40" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading documents...
        </div>
      ) : (
        <div className="space-y-10">
          {/* My Documents */}
          <section>
            <h2 className="text-lg font-semibold text-ink-800 mb-4 flex items-center gap-2">
              My Documents
              <span className="text-sm font-normal text-ink-700/40">
                ({documents.length})
              </span>
            </h2>
            <DocumentList
              documents={documents}
              onDelete={handleDelete}
              onTranslate={handleTranslate}
            />
          </section>

          {/* Translated Documents */}
          {translated.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-ink-800 mb-4 flex items-center gap-2">
                Translated Documents
                <span className="text-sm font-normal text-ink-700/40">
                  ({translated.length})
                </span>
              </h2>
              <DocumentList
                documents={translated}
                onDelete={handleDelete}
                onTranslate={handleTranslate}
              />
            </section>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import JobStatusBadge from '@/components/JobStatusBadge';
import LoadingAnimation from '@/components/LoadingAnimation';
import ResultsViewer from '@/components/ResultsViewer';
import type { JobRecord, JobStatus, CorrectionRecord } from '@/types';

const POLL_INTERVAL_MS = 3000;

const ACTIVE_STATUSES: JobStatus[] = ['processing', 'reprocessing', 'queued_overload'];

export default function JobPage({ params }: { params: { jobId: string } }) {
  const router = useRouter();
  const { jobId } = params;

  const [job, setJob] = useState<(JobRecord & { corrections?: CorrectionRecord[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Job not found');
          return;
        }
        throw new Error('Failed to fetch job');
      }
      const data = await res.json();
      setJob(data.job);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load job');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  // Poll while in active status
  useEffect(() => {
    if (!job) return;
    if (!ACTIVE_STATUSES.includes(job.status)) return;

    const interval = setInterval(() => {
      fetchJob();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [job, fetchJob]);

  async function handleExport(format: 'pdf' | 'docx') {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, includeTranscription: true }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Export failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `translation.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <LoadingAnimation message="Loading job..." />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600 mb-4">{error ?? 'Job not found'}</p>
        <Link href="/documents" className="text-parchment-500 hover:underline">
          Back to Documents
        </Link>
      </div>
    );
  }

  const isActive = ACTIVE_STATUSES.includes(job.status);
  const isQueued = job.status === 'queued_overload';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-ink-700/50 mb-1">
            <Link href="/documents" className="hover:text-ink-700 transition-colors">
              Documents
            </Link>
            <span>/</span>
            <span>Job {jobId.slice(0, 8)}...</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-ink-800">
            {job.document?.fileName ?? 'Translation Job'}
          </h1>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <JobStatusBadge status={job.status} />
          <Link
            href={`/debug?jobId=${jobId}`}
            className="px-3 py-1.5 border border-parchment-200 text-ink-700/60 rounded-lg
              text-xs hover:bg-parchment-50 transition-colors font-mono"
          >
            Debug
          </Link>
        </div>
      </div>

      {/* Active processing */}
      {isActive && (
        <div className="bg-white border border-parchment-200 rounded-2xl p-8 mb-8">
          <LoadingAnimation
            message={isQueued ? 'Your job is queued...' : 'Processing your document...'}
            type={isQueued ? 'queued' : 'processing'}
          />
          <p className="text-center text-ink-700/40 text-xs mt-4">
            Refreshing automatically every {POLL_INTERVAL_MS / 1000}s
          </p>
        </div>
      )}

      {/* Waiting for user input */}
      {job.status === 'waiting_user_input' && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-8 flex items-start gap-4">
          <svg
            className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h2 className="font-semibold text-orange-800">Your input is needed</h2>
            <p className="text-orange-700 text-sm mt-1">
              The AI found unclear parts of the text that need your clarification before
              the translation can be finalized.
            </p>
            <Link
              href={`/jobs/${jobId}/review`}
              className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-orange-600
                text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
            >
              Review Unclear Terms
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      )}

      {/* Failed */}
      {job.status === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
          <h2 className="font-semibold text-red-800 mb-1">Processing Failed</h2>
          <p className="text-red-700 text-sm">{job.errorMessage ?? 'An unexpected error occurred.'}</p>
        </div>
      )}

      {/* Job metadata */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          {
            label: 'Language',
            value: { hebrew: 'Hebrew', english: 'English', french: 'Modern French' }[
              job.targetLanguage
            ] ?? job.targetLanguage,
          },
          {
            label: 'Style',
            value: job.style === 'accurate' ? 'Accurate' : 'Fluent',
          },
          {
            label: 'Mode',
            value: job.mode === 'first_page' ? 'First page' : 'Full document',
          },
          {
            label: 'Pages',
            value: (job.pages ?? []).length || '—',
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white border border-parchment-200 rounded-xl px-4 py-3"
          >
            <p className="text-xs text-ink-700/40 font-medium uppercase tracking-wider">
              {item.label}
            </p>
            <p className="text-ink-800 font-medium mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Results */}
      {job.status === 'completed' && (job.pages ?? []).length > 0 && (
        <div className="bg-white border border-parchment-200 rounded-2xl p-6">
          <h2 className="text-xl font-serif font-bold text-ink-800 mb-6">Translation Results</h2>
          <ResultsViewer
            job={job}
            onExport={handleExport}
            isExporting={isExporting}
          />
        </div>
      )}

      {/* Pages summary */}
      {(job.pages ?? []).length > 0 && job.status !== 'completed' && (
        <div className="bg-white border border-parchment-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-ink-800 mb-4">Page Progress</h2>
          <div className="space-y-2">
            {(job.pages ?? []).map((page) => (
              <div
                key={page.id}
                className="flex items-center gap-3 px-4 py-2 bg-parchment-50 rounded-lg"
              >
                <span className="text-sm text-ink-700/60 w-16">Page {page.pageNumber}</span>
                <div className="flex-1 bg-parchment-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      page.status === 'completed'
                        ? 'bg-green-500 w-full'
                        : page.status === 'processing'
                        ? 'bg-amber-400 w-1/2'
                        : page.status === 'uncertain'
                        ? 'bg-orange-400 w-full'
                        : page.status === 'failed'
                        ? 'bg-red-500 w-full'
                        : 'bg-parchment-300 w-0'
                    }`}
                  />
                </div>
                <span
                  className={`text-xs w-20 text-right ${
                    page.status === 'completed'
                      ? 'text-green-600'
                      : page.status === 'uncertain'
                      ? 'text-orange-600'
                      : page.status === 'failed'
                      ? 'text-red-600'
                      : 'text-ink-700/40'
                  }`}
                >
                  {page.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

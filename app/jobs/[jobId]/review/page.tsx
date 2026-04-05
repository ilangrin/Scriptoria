'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReviewPanel from '@/components/ReviewPanel';
import LoadingAnimation from '@/components/LoadingAnimation';
import type { JobRecord, UserCorrection } from '@/types';

export default function ReviewPage({ params }: { params: { jobId: string } }) {
  const router = useRouter();
  const { jobId } = params;

  const [job, setJob] = useState<JobRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) {
        setError('Job not found');
        return;
      }
      const data = await res.json();
      setJob(data.job);
    } catch {
      setError('Failed to load job');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  async function handleSubmitCorrections(corrections: UserCorrection[]) {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/corrections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corrections }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to submit corrections');
      }

      // Navigate back to job page to see reprocessing/results
      router.push(`/jobs/${jobId}`);
    } catch (err) {
      setIsSubmitting(false);
      throw err;
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <LoadingAnimation message="Loading review..." />
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

  if (job.status !== 'waiting_user_input') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-ink-700/60 mb-4">
          This job is not currently waiting for input (status: {job.status})
        </p>
        <Link
          href={`/jobs/${jobId}`}
          className="px-4 py-2 bg-ink-900 text-parchment-100 rounded-lg text-sm font-medium hover:bg-ink-800"
        >
          Back to Job
        </Link>
      </div>
    );
  }

  const pagesWithUncertainTerms = (job.pages ?? []).filter(
    (p) => (p.uncertainTerms ?? []).length > 0
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-ink-700/50 mb-1">
          <Link href="/documents" className="hover:text-ink-700">Documents</Link>
          <span>/</span>
          <Link href={`/jobs/${jobId}`} className="hover:text-ink-700">
            Job {jobId.slice(0, 8)}...
          </Link>
          <span>/</span>
          <span>Review</span>
        </div>
        <h1 className="text-2xl font-serif font-bold text-ink-800">
          Review Unclear Terms
        </h1>
        <p className="text-ink-700/60 text-sm mt-1">
          Reviewing: <span className="font-medium">{job.document?.fileName}</span>
        </p>
      </div>

      {/* Explanation card */}
      <div className="bg-parchment-50 border border-parchment-200 rounded-xl p-5 mb-8">
        <h2 className="font-semibold text-ink-800 mb-2">Why am I being asked this?</h2>
        <p className="text-ink-700/70 text-sm leading-relaxed">
          The AI transcribed your document but found parts of the text that are ambiguous
          or unclear — such as faded ink, unusual handwriting, or archaic abbreviations.
          Rather than making silent guesses, we surface these to you for verification.
          Your corrections will be used to regenerate a more accurate translation.
        </p>
      </div>

      <div className="bg-white border border-parchment-200 rounded-2xl p-6">
        <ReviewPanel
          pages={pagesWithUncertainTerms}
          onSubmit={handleSubmitCorrections}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}

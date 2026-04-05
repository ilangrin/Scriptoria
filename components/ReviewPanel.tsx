'use client';

import { useState } from 'react';
import type { UncertainTerm, UserCorrection, JobPageRecord } from '@/types';

interface ReviewPanelProps {
  pages: JobPageRecord[];
  onSubmit: (corrections: UserCorrection[]) => Promise<void>;
  isSubmitting: boolean;
}

interface TermState {
  pageNumber: number;
  term: UncertainTerm;
  correction: string;
}

export default function ReviewPanel({ pages, onSubmit, isSubmitting }: ReviewPanelProps) {
  const allTerms: TermState[] = pages.flatMap((page) =>
    (page.uncertainTerms ?? []).map((term) => ({
      pageNumber: page.pageNumber,
      term,
      correction: term.suggested_guess ?? '',
    }))
  );

  const [termStates, setTermStates] = useState<TermState[]>(allTerms);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (termStates.length === 0) {
    return (
      <div className="text-center py-8 text-ink-700/50">
        No uncertain terms to review.
      </div>
    );
  }

  function updateCorrection(termId: string, pageNumber: number, value: string) {
    setTermStates((prev) =>
      prev.map((ts) =>
        ts.term.id === termId && ts.pageNumber === pageNumber
          ? { ...ts, correction: value }
          : ts
      )
    );
  }

  async function handleSubmit() {
    setSubmitError(null);

    const corrections: UserCorrection[] = termStates
      .filter((ts) => ts.correction.trim() !== '')
      .map((ts) => ({
        termId: ts.term.id,
        pageNumber: ts.pageNumber,
        originalSnippet: ts.term.snippet,
        correction: ts.correction.trim(),
      }));

    if (corrections.length === 0) {
      setSubmitError('Please provide at least one correction before submitting.');
      return;
    }

    try {
      await onSubmit(corrections);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed');
    }
  }

  // Group by page
  const byPage = new Map<number, TermState[]>();
  for (const ts of termStates) {
    const existing = byPage.get(ts.pageNumber) ?? [];
    existing.push(ts);
    byPage.set(ts.pageNumber, existing);
  }

  const filledCount = termStates.filter((ts) => ts.correction.trim() !== '').length;
  const totalCount = termStates.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
        <svg
          className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5"
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
          <p className="font-medium text-orange-800">
            {totalCount} unclear {totalCount === 1 ? 'term' : 'terms'} found
          </p>
          <p className="text-orange-700 text-sm mt-0.5">
            The AI identified parts of the text that are unclear or ambiguous. Please
            review each term and provide corrections where possible.
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${(filledCount / totalCount) * 100}%` }}
          />
        </div>
        <span className="text-sm text-ink-700/60">
          {filledCount}/{totalCount} addressed
        </span>
      </div>

      {/* Terms grouped by page */}
      {Array.from(byPage.entries()).map(([pageNum, terms]) => (
        <div key={pageNum}>
          <h3 className="text-sm font-semibold text-ink-700/60 uppercase tracking-wider mb-3">
            Page {pageNum}
          </h3>
          <div className="space-y-4">
            {terms.map((ts) => (
              <TermReviewCard
                key={`${ts.pageNumber}-${ts.term.id}`}
                termState={ts}
                onChange={(val) => updateCorrection(ts.term.id, ts.pageNumber, val)}
              />
            ))}
          </div>
        </div>
      ))}

      {submitError && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {submitError}
        </p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || filledCount === 0}
        className="w-full py-3 px-6 bg-ink-900 text-parchment-100 rounded-xl font-medium
          hover:bg-ink-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Reprocessing with corrections...
          </>
        ) : (
          <>
            Submit Corrections & Regenerate Translation
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </>
        )}
      </button>
    </div>
  );
}

interface TermReviewCardProps {
  termState: TermState;
  onChange: (value: string) => void;
}

function TermReviewCard({ termState, onChange }: TermReviewCardProps) {
  const { term, correction } = termState;

  return (
    <div className="border border-parchment-200 rounded-xl overflow-hidden">
      {/* Term header */}
      <div className="bg-parchment-50 px-4 py-3 border-b border-parchment-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-mono text-parchment-400 uppercase tracking-wider">
              Unclear Term
            </span>
            <p className="text-ink-800 font-mono font-medium mt-0.5">
              &ldquo;{term.snippet}&rdquo;
            </p>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
              correction ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'
            }`}
          >
            {correction ? 'Addressed' : 'Needs review'}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Context */}
        <div>
          <p className="text-xs font-medium text-ink-700/50 uppercase tracking-wider mb-1">
            Context
          </p>
          <p className="text-sm text-ink-800 italic bg-parchment-50 rounded-lg px-3 py-2 border border-parchment-100">
            {term.context}
          </p>
        </div>

        {/* Reason */}
        <div>
          <p className="text-xs font-medium text-ink-700/50 uppercase tracking-wider mb-1">
            Why it&apos;s unclear
          </p>
          <p className="text-sm text-ink-700/70">{term.reason}</p>
        </div>

        {/* AI guess */}
        {term.suggested_guess && (
          <div>
            <p className="text-xs font-medium text-ink-700/50 uppercase tracking-wider mb-1">
              AI&apos;s best guess
            </p>
            <button
              onClick={() => onChange(term.suggested_guess!)}
              className="text-sm text-blue-600 underline underline-offset-2 hover:text-blue-800 transition-colors"
            >
              &ldquo;{term.suggested_guess}&rdquo; — click to use this guess
            </button>
          </div>
        )}

        {/* Question */}
        <div>
          <label className="text-xs font-medium text-ink-700/50 uppercase tracking-wider mb-1 block">
            {term.question}
          </label>
          <input
            type="text"
            value={correction}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type the correct word or phrase..."
            className="w-full px-3 py-2 border border-parchment-300 rounded-lg text-ink-800
              focus:outline-none focus:ring-2 focus:ring-parchment-400 focus:border-transparent
              text-sm placeholder:text-ink-700/30"
          />
        </div>
      </div>
    </div>
  );
}

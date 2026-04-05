'use client';

import { useState } from 'react';
import DebugPanel from '@/components/DebugPanel';

export default function DebugPage() {
  const [jobId, setJobId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    job: Parameters<typeof DebugPanel>[0]['job'];
    debugLogs: Parameters<typeof DebugPanel>[0]['logs'];
  } | null>(null);

  async function handleSearch() {
    if (!jobId.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`/api/debug?jobId=${encodeURIComponent(jobId.trim())}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Not found');
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load debug info');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-mono rounded border border-amber-200">
            DEV
          </span>
          <h1 className="text-2xl font-serif font-bold text-ink-800">Debug Panel</h1>
        </div>
        <p className="text-ink-700/50 text-sm">
          Inspect AI requests, responses, and processing stages for any job.
          API keys and image data are automatically redacted.
        </p>
      </div>

      {/* Job ID input */}
      <div className="bg-white border border-parchment-200 rounded-2xl p-6 mb-6">
        <label className="block text-sm font-semibold text-ink-800 mb-2">
          Job ID
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Paste a Job ID here..."
            className="flex-1 px-4 py-2 border border-parchment-300 rounded-xl text-sm font-mono
              text-ink-800 focus:outline-none focus:ring-2 focus:ring-parchment-400
              focus:border-transparent placeholder:text-ink-700/30"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !jobId.trim()}
            className="px-6 py-2 bg-ink-900 text-parchment-100 rounded-xl text-sm font-medium
              hover:bg-ink-800 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading...
              </>
            ) : (
              'Inspect'
            )}
          </button>
        </div>
        <p className="text-xs text-ink-700/30 mt-2 font-mono">
          You can find Job IDs in the URL when viewing a job: /jobs/[jobId]
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm mb-6">
          {error}
        </div>
      )}

      {data && (
        <div className="bg-white border border-parchment-200 rounded-2xl p-6">
          <DebugPanel job={data.job} logs={data.debugLogs} />
        </div>
      )}

      {!data && !loading && !error && (
        <div className="text-center py-16 text-ink-700/30">
          <svg
            className="w-12 h-12 mx-auto mb-3 opacity-30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          Enter a Job ID to inspect processing logs
        </div>
      )}
    </div>
  );
}

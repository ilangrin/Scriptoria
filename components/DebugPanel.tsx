'use client';

import { useState } from 'react';
import type { DebugLogRecord } from '@/types';

interface JobDebugInfo {
  id: string;
  status: string;
  targetLanguage: string;
  style: string;
  mode: string;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  document: {
    id: string;
    fileName: string;
    mimeType: string;
    pageCount: number | null;
  };
  pages: {
    id: string;
    pageNumber: number;
    status: string;
    confidence: string | null;
    currentVersion: number;
  }[];
}

interface DebugPanelProps {
  job: JobDebugInfo;
  logs: DebugLogRecord[];
}

type LogSection = 'request' | 'response';

export default function DebugPanel({ job, logs }: DebugPanelProps) {
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<LogSection>('response');

  function toggleLog(id: string) {
    setExpandedLog((prev) => (prev === id ? null : id));
  }

  const stageColors: Record<string, string> = {
    process_page: 'bg-blue-50 text-blue-700 border-blue-200',
    process_page_error: 'bg-red-50 text-red-700 border-red-200',
    reprocess_page: 'bg-purple-50 text-purple-700 border-purple-200',
    reprocess_page_error: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="space-y-6 font-mono text-sm">
      {/* Job Info */}
      <section>
        <h2 className="text-xs font-sans font-semibold text-ink-700/50 uppercase tracking-wider mb-3">
          Job Info
        </h2>
        <div className="bg-ink-900 text-parchment-200 rounded-xl p-4 overflow-auto">
          <pre className="text-xs leading-relaxed">
            {JSON.stringify(
              {
                jobId: job.id,
                status: job.status,
                targetLanguage: job.targetLanguage,
                style: job.style,
                mode: job.mode,
                errorMessage: job.errorMessage,
                createdAt: job.createdAt,
                updatedAt: job.updatedAt,
                document: job.document,
                pages: job.pages,
              },
              null,
              2
            )}
          </pre>
        </div>
      </section>

      {/* Processing Stages */}
      <section>
        <h2 className="text-xs font-sans font-semibold text-ink-700/50 uppercase tracking-wider mb-3">
          Processing Log ({logs.length} entries)
        </h2>

        {logs.length === 0 ? (
          <p className="text-ink-700/40 text-xs font-sans">No log entries yet.</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const isExpanded = expandedLog === log.id;
              const hasError = !!log.error;

              return (
                <div
                  key={log.id}
                  className={`border rounded-lg overflow-hidden ${
                    hasError ? 'border-red-200' : 'border-parchment-200'
                  }`}
                >
                  {/* Log header */}
                  <button
                    onClick={() => toggleLog(log.id)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-parchment-50
                      transition-colors text-left"
                  >
                    <span
                      className={`text-xs px-2 py-0.5 rounded border font-sans font-medium flex-shrink-0
                        ${stageColors[log.stage] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}
                    >
                      {log.stage}
                    </span>

                    {log.pageId && (
                      <span className="text-ink-700/50 text-xs">
                        page: {job.pages.find((p) => p.id === log.pageId)?.pageNumber ?? '?'}
                      </span>
                    )}

                    {log.error && (
                      <span className="text-red-600 text-xs truncate max-w-xs">
                        Error: {log.error}
                      </span>
                    )}

                    <span className="ml-auto text-ink-700/30 text-xs flex-shrink-0">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>

                    <svg
                      className={`w-4 h-4 text-ink-700/40 transition-transform flex-shrink-0 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-parchment-200">
                      {/* Section tabs */}
                      <div className="flex border-b border-parchment-200 px-4">
                        {(['request', 'response'] as LogSection[]).map((section) => (
                          <button
                            key={section}
                            onClick={() => setExpandedSection(section)}
                            className={`px-3 py-2 text-xs font-sans font-medium border-b-2 -mb-px capitalize
                              transition-colors ${
                                expandedSection === section
                                  ? 'border-ink-800 text-ink-800'
                                  : 'border-transparent text-ink-700/50 hover:text-ink-700'
                              }`}
                          >
                            {section}
                          </button>
                        ))}
                        {log.error && (
                          <button
                            onClick={() => setExpandedSection('request')}
                            className="px-3 py-2 text-xs font-sans font-medium text-red-600"
                          >
                            Error
                          </button>
                        )}
                      </div>

                      <div className="bg-ink-900 p-4 max-h-96 overflow-auto">
                        {log.error && (
                          <div className="bg-red-900/50 text-red-300 rounded-lg p-3 mb-3 text-xs">
                            {log.error}
                          </div>
                        )}

                        {expandedSection === 'request' && log.request ? (
                          <pre className="text-parchment-200 text-xs leading-relaxed whitespace-pre-wrap">
                            {JSON.stringify(log.request, null, 2)}
                          </pre>
                        ) : expandedSection === 'response' && log.response ? (
                          <pre className="text-parchment-200 text-xs leading-relaxed whitespace-pre-wrap">
                            {JSON.stringify(log.response, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-parchment-400 text-xs">
                            No {expandedSection} data available.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Warning */}
      <div className="text-xs font-sans text-ink-700/40 border-t border-parchment-100 pt-4">
        API keys and base64 image data are automatically redacted from all log entries.
      </div>
    </div>
  );
}

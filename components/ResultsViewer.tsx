'use client';

import { useState } from 'react';
import type { JobPageRecord, JobRecord } from '@/types';

interface ResultsViewerProps {
  job: JobRecord;
  onExport: (format: 'pdf' | 'docx') => void;
  isExporting: boolean;
}

type TabType = 'translation' | 'transcription' | 'corrections';

export default function ResultsViewer({ job, onExport, isExporting }: ResultsViewerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('translation');
  const [currentPage, setCurrentPage] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [fullscreen, setFullscreen] = useState<'original' | 'translation' | null>(null);

  const pages = job.pages ?? [];
  const currentPageData = pages[currentPage];
  const totalPages = pages.length;

  const hasCorrections = (job.corrections ?? []).length > 0;

  const tabs: { id: TabType; label: string; available: boolean }[] = [
    { id: 'translation', label: 'Translation', available: true },
    { id: 'transcription', label: 'Transcription', available: true },
    { id: 'corrections', label: 'User Corrections', available: hasCorrections },
  ];

  function getConfidenceColor(confidence: string | null | undefined) {
    if (confidence === 'high') return 'text-green-600 bg-green-50 border-green-200';
    if (confidence === 'medium') return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  }

  const languageLabels: Record<string, string> = {
    hebrew: 'Hebrew',
    english: 'English',
    french: 'Modern French',
  };

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="bg-ink-900 px-4 py-2 flex items-center justify-between">
          <span className="text-parchment-200 text-sm font-medium">
            {fullscreen === 'original' ? 'Original Document' : 'Translation'} — Page{' '}
            {currentPage + 1}/{totalPages}
          </span>
          <button
            onClick={() => setFullscreen(null)}
            className="text-parchment-300 hover:text-white p-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-auto p-8">
          {fullscreen === 'translation' && currentPageData?.translation && (
            <div className="max-w-3xl mx-auto bg-white rounded-lg p-8 shadow-lg text-ink-800 text-lg leading-relaxed font-serif">
              {currentPageData.translation}
            </div>
          )}
          {fullscreen === 'original' && (
            <div className="flex items-center justify-center h-full text-parchment-300">
              Original image preview — upload file served via /api/files
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink-700/60">Export as:</span>
          <button
            onClick={() => onExport('pdf')}
            disabled={isExporting}
            className="px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm
              font-medium hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                clipRule="evenodd"
              />
            </svg>
            PDF
          </button>
          <button
            onClick={() => onExport('docx')}
            disabled={isExporting}
            className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm
              font-medium hover:bg-blue-100 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                clipRule="evenodd"
              />
            </svg>
            Word (DOCX)
          </button>
          {isExporting && (
            <span className="text-sm text-ink-700/50 flex items-center gap-1">
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating...
            </span>
          )}
        </div>

        {/* Language badge */}
        <span className="px-3 py-1 bg-parchment-100 text-parchment-500 text-sm rounded-full font-medium">
          {languageLabels[job.targetLanguage] ?? job.targetLanguage}
        </span>
      </div>

      {/* Page navigation */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-2 rounded-lg border border-parchment-200 hover:bg-parchment-50
              disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="text-sm text-ink-700/60 min-w-[100px] text-center">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
            className="p-2 rounded-lg border border-parchment-200 hover:bg-parchment-50
              disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Zoom */}
          <div className="ml-4 flex items-center gap-2 border-l border-parchment-200 pl-4">
            <button
              onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
              className="p-1 text-ink-700/50 hover:text-ink-800 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="text-xs text-ink-700/50 w-10 text-center">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}
              className="p-1 text-ink-700/50 hover:text-ink-800 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-parchment-200">
        {tabs
          .filter((t) => t.available)
          .map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-ink-800 text-ink-800'
                  : 'border-transparent text-ink-700/50 hover:text-ink-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
      </div>

      {/* Content */}
      {currentPageData && (
        <div
          className="transition-all"
          style={{ fontSize: `${zoomLevel}%` }}
        >
          {/* Confidence indicator */}
          {currentPageData.confidence && (
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border mb-4 ${getConfidenceColor(
                currentPageData.confidence
              )}`}
            >
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                <circle cx="6" cy="6" r="5" />
              </svg>
              Confidence: {currentPageData.confidence}
            </div>
          )}

          {activeTab === 'translation' && (
            <div className="relative">
              <button
                onClick={() => setFullscreen('translation')}
                className="absolute top-2 right-2 p-1.5 bg-white border border-parchment-200
                  rounded-lg text-ink-700/50 hover:text-ink-800 transition-colors z-10"
                title="Fullscreen"
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <div
                className="bg-white border border-parchment-200 rounded-xl p-6 text-ink-800
                  leading-relaxed font-serif min-h-48 whitespace-pre-wrap"
                dir={job.targetLanguage === 'hebrew' ? 'rtl' : 'ltr'}
              >
                {currentPageData.translation ?? 'Translation not yet available.'}
              </div>
            </div>
          )}

          {activeTab === 'transcription' && (
            <div className="bg-parchment-50 border border-parchment-200 rounded-xl p-6 text-ink-800
              leading-relaxed font-serif italic min-h-48 whitespace-pre-wrap">
              {currentPageData.transcription ?? 'Transcription not yet available.'}
            </div>
          )}

          {activeTab === 'corrections' && hasCorrections && (
            <div className="space-y-3">
              {(job.corrections ?? [])
                .filter((c) => c.pageNumber === currentPageData.pageNumber)
                .map((correction) => (
                  <div
                    key={correction.id}
                    className="bg-white border border-parchment-200 rounded-lg px-4 py-3"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <p className="text-xs text-ink-700/50 font-medium uppercase tracking-wider mb-1">
                          Original (unclear)
                        </p>
                        <p className="font-mono text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                          {correction.originalSnippet}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-ink-700/30 mt-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-xs text-ink-700/50 font-medium uppercase tracking-wider mb-1">
                          Corrected
                        </p>
                        <p className="font-mono text-sm text-green-700 bg-green-50 px-2 py-1 rounded">
                          {correction.userCorrection}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              {(job.corrections ?? []).filter((c) => c.pageNumber === currentPageData.pageNumber)
                .length === 0 && (
                <p className="text-ink-700/40 text-sm">No corrections for this page.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

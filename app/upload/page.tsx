'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UploadZone from '@/components/UploadZone';
import FilePreview from '@/components/FilePreview';
import type { TargetLanguage, TranslationStyle, ProcessingMode } from '@/types';

interface UploadOptions {
  targetLanguage: TargetLanguage;
  style: TranslationStyle;
  mode: ProcessingMode;
}

type Step = 'upload' | 'configure' | 'confirm';

export default function UploadPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState<UploadOptions>({
    targetLanguage: 'english',
    style: 'accurate',
    mode: 'full',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileSelected(selectedFile: File) {
    setFile(selectedFile);
    setStep('configure');
    setError(null);
  }

  function handleRemoveFile() {
    setFile(null);
    setStep('upload');
  }

  async function handleConfirm() {
    if (!file) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Upload file
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error ?? 'Upload failed');
      }

      const { document } = await uploadRes.json();

      // Step 2: Create job
      const jobRes = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id,
          targetLanguage: options.targetLanguage,
          style: options.style,
          mode: options.mode,
        }),
      });

      if (!jobRes.ok) {
        const err = await jobRes.json();
        throw new Error(err.error ?? 'Failed to create job');
      }

      const { job } = await jobRes.json();

      // Step 3: Start processing
      const processRes = await fetch(`/api/jobs/${job.id}/process`, {
        method: 'POST',
      });

      if (!processRes.ok) {
        const err = await processRes.json();
        throw new Error(err.error ?? 'Processing failed');
      }

      // Navigate to job page
      router.push(`/jobs/${job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {(['upload', 'configure', 'confirm'] as Step[]).map((s, idx) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s
                  ? 'bg-ink-900 text-parchment-100'
                  : idx < ['upload', 'configure', 'confirm'].indexOf(step)
                  ? 'bg-parchment-300 text-ink-800'
                  : 'bg-parchment-100 text-ink-700/40'
              }`}
            >
              {idx + 1}
            </div>
            <span
              className={`text-sm font-medium capitalize transition-colors ${
                step === s ? 'text-ink-800' : 'text-ink-700/40'
              }`}
            >
              {s}
            </span>
            {idx < 2 && <div className="w-8 h-0.5 bg-parchment-200 mx-1" />}
          </div>
        ))}
      </div>

      <div className="bg-white border border-parchment-200 rounded-2xl p-8 space-y-6">
        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="animate-fade-in space-y-4">
            <div>
              <h1 className="text-2xl font-serif font-bold text-ink-800">
                Upload Your Document
              </h1>
              <p className="text-ink-700/60 text-sm mt-1">
                JPG, PNG, or PDF — up to 50MB, maximum 10 pages
              </p>
            </div>
            <UploadZone onFileSelected={handleFileSelected} />
          </div>
        )}

        {/* Step 2: Configure */}
        {step === 'configure' && file && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h1 className="text-2xl font-serif font-bold text-ink-800">
                Configure Translation
              </h1>
              <p className="text-ink-700/60 text-sm mt-1">
                Choose how you want your document translated
              </p>
            </div>

            <FilePreview file={file} onRemove={handleRemoveFile} />

            {/* Target language */}
            <div>
              <label className="block text-sm font-semibold text-ink-800 mb-3">
                Target Language
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'hebrew', label: 'Hebrew', flag: '🇮🇱', sub: 'עברית' },
                  { value: 'english', label: 'English', flag: '🇬🇧', sub: 'English' },
                  { value: 'french', label: 'Modern French', flag: '🇫🇷', sub: 'Français moderne' },
                ].map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() =>
                      setOptions((o) => ({
                        ...o,
                        targetLanguage: lang.value as TargetLanguage,
                      }))
                    }
                    className={`p-4 border-2 rounded-xl text-center transition-all ${
                      options.targetLanguage === lang.value
                        ? 'border-ink-900 bg-parchment-50'
                        : 'border-parchment-200 hover:border-parchment-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{lang.flag}</div>
                    <div className="font-medium text-ink-800 text-sm">{lang.label}</div>
                    <div className="text-ink-700/40 text-xs mt-0.5">{lang.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Translation style */}
            <div>
              <label className="block text-sm font-semibold text-ink-800 mb-3">
                Translation Style
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    value: 'accurate',
                    label: 'Accurate',
                    desc: 'Faithful to the original meaning and structure',
                  },
                  {
                    value: 'fluent',
                    label: 'Fluent',
                    desc: 'Natural writing style in the target language',
                  },
                ].map((style) => (
                  <button
                    key={style.value}
                    onClick={() =>
                      setOptions((o) => ({ ...o, style: style.value as TranslationStyle }))
                    }
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      options.style === style.value
                        ? 'border-ink-900 bg-parchment-50'
                        : 'border-parchment-200 hover:border-parchment-300'
                    }`}
                  >
                    <div className="font-medium text-ink-800 text-sm">{style.label}</div>
                    <div className="text-ink-700/40 text-xs mt-1">{style.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Processing mode */}
            <div>
              <label className="block text-sm font-semibold text-ink-800 mb-3">
                Processing Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    value: 'first_page',
                    label: 'First Page Only',
                    desc: 'Quick sample — process just the first page',
                  },
                  {
                    value: 'full',
                    label: 'Full Document',
                    desc: 'Process all pages (up to 10)',
                  },
                ].map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() =>
                      setOptions((o) => ({ ...o, mode: mode.value as ProcessingMode }))
                    }
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      options.mode === mode.value
                        ? 'border-ink-900 bg-parchment-50'
                        : 'border-parchment-200 hover:border-parchment-300'
                    }`}
                  >
                    <div className="font-medium text-ink-800 text-sm">{mode.label}</div>
                    <div className="text-ink-700/40 text-xs mt-1">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep('confirm')}
              className="w-full py-3 bg-ink-900 text-parchment-100 rounded-xl font-medium
                hover:bg-ink-800 transition-colors"
            >
              Continue to Review
            </button>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && file && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h1 className="text-2xl font-serif font-bold text-ink-800">
                Confirm & Start
              </h1>
              <p className="text-ink-700/60 text-sm mt-1">
                Review your settings before processing
              </p>
            </div>

            <FilePreview file={file} onRemove={handleRemoveFile} />

            <div className="bg-parchment-50 border border-parchment-200 rounded-xl divide-y divide-parchment-200">
              {[
                {
                  label: 'Target Language',
                  value: { hebrew: 'Hebrew (עברית)', english: 'English', french: 'Modern French' }[
                    options.targetLanguage
                  ],
                },
                {
                  label: 'Style',
                  value: options.style === 'accurate' ? 'Accurate (faithful)' : 'Fluent (natural)',
                },
                {
                  label: 'Mode',
                  value: options.mode === 'first_page' ? 'First page only' : 'Full document',
                },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between px-4 py-3">
                  <span className="text-ink-700/60 text-sm">{row.label}</span>
                  <span className="text-ink-800 text-sm font-medium">{row.value}</span>
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('configure')}
                disabled={isSubmitting}
                className="flex-1 py-3 border border-parchment-300 text-ink-800 rounded-xl font-medium
                  hover:bg-parchment-50 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="flex-[2] py-3 bg-ink-900 text-parchment-100 rounded-xl font-medium
                  hover:bg-ink-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Uploading & Processing...
                  </>
                ) : (
                  'Start Translation'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

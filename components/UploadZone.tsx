'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

const MAX_SIZE_MB = 50;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function UploadZone({ onFileSelected, disabled }: UploadZoneProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: { file: File; errors: { code: string; message: string }[] }[]) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const firstError = rejectedFiles[0].errors[0];
        if (firstError.code === 'file-too-large') {
          setError(`File too large. Maximum size is ${MAX_SIZE_MB}MB.`);
        } else if (firstError.code === 'file-invalid-type') {
          setError('Invalid file type. Please upload JPG, PNG, or PDF.');
        } else {
          setError(firstError.message);
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        onFileSelected(acceptedFiles[0]);
      }
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf'],
    },
    maxSize: MAX_SIZE_BYTES,
    maxFiles: 1,
    disabled,
  });

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
          ${isDragReject ? 'border-red-400 bg-red-50' : ''}
          ${isDragActive && !isDragReject ? 'border-parchment-400 bg-parchment-50 scale-[1.01]' : ''}
          ${!isDragActive && !isDragReject ? 'border-parchment-300 hover:border-parchment-400 hover:bg-parchment-50' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-parchment-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-parchment-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>

          {isDragActive ? (
            <p className="text-parchment-500 font-medium">Drop your document here...</p>
          ) : (
            <>
              <div>
                <p className="text-ink-800 font-medium text-lg">
                  Drag & drop your document
                </p>
                <p className="text-ink-700/60 text-sm mt-1">
                  or click to browse files
                </p>
              </div>
              <div className="flex gap-2">
                {['JPG', 'PNG', 'PDF'].map((fmt) => (
                  <span
                    key={fmt}
                    className="px-2 py-1 bg-parchment-100 text-parchment-500 text-xs font-mono rounded"
                  >
                    {fmt}
                  </span>
                ))}
              </div>
              <p className="text-ink-700/40 text-xs">
                Max {MAX_SIZE_MB}MB · Up to 10 pages
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="text-red-600 text-sm flex items-center gap-1">
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

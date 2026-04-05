'use client';

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilePreview({ file, onRemove }: FilePreviewProps) {
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';
  const previewUrl = isImage ? URL.createObjectURL(file) : null;

  return (
    <div className="border border-parchment-200 rounded-xl p-4 bg-parchment-50 flex items-start gap-4">
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden bg-white border border-parchment-200 flex items-center justify-center">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-cover"
            onLoad={() => URL.revokeObjectURL(previewUrl)}
          />
        ) : isPdf ? (
          <svg
            className="w-8 h-8 text-red-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        ) : (
          <svg
            className="w-8 h-8 text-gray-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-ink-800 font-medium truncate text-sm">{file.name}</p>
        <p className="text-ink-700/50 text-xs mt-0.5">{formatBytes(file.size)}</p>
        <div className="mt-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-parchment-200 text-parchment-500">
            {file.type === 'application/pdf' ? 'PDF Document' : 'Image'}
          </span>
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="flex-shrink-0 p-1 text-ink-700/40 hover:text-red-500 transition-colors rounded"
        aria-label="Remove file"
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
  );
}

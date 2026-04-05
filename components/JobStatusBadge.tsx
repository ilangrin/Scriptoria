import type { JobStatus } from '@/types';

interface JobStatusBadgeProps {
  status: JobStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<
  JobStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  uploaded: {
    label: 'Uploaded',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
  },
  pending_confirmation: {
    label: 'Awaiting Confirmation',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    dot: 'bg-blue-400',
  },
  processing: {
    label: 'Processing',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    dot: 'bg-amber-400',
  },
  waiting_user_input: {
    label: 'Needs Your Input',
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    dot: 'bg-orange-400',
  },
  reprocessing: {
    label: 'Reprocessing',
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    dot: 'bg-purple-400',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-500',
  },
  failed: {
    label: 'Failed',
    bg: 'bg-red-50',
    text: 'text-red-600',
    dot: 'bg-red-500',
  },
  queued_overload: {
    label: 'Queued',
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    dot: 'bg-gray-400',
  },
};

const ANIMATED_STATUSES: JobStatus[] = ['processing', 'reprocessing', 'queued_overload'];

export default function JobStatusBadge({ status, size = 'md' }: JobStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.failed;
  const isAnimated = ANIMATED_STATUSES.includes(status);

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bg} ${config.text} ${sizeClasses}`}
    >
      <span
        className={`${dotSize} rounded-full ${config.dot} ${isAnimated ? 'animate-pulse' : ''}`}
      />
      {config.label}
    </span>
  );
}

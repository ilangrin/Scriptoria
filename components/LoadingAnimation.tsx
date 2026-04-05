'use client';

interface LoadingAnimationProps {
  message?: string;
  type?: 'processing' | 'queued';
}

export default function LoadingAnimation({
  message,
  type = 'processing',
}: LoadingAnimationProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-8">
      {type === 'processing' ? (
        <ElephantMouseAnimation />
      ) : (
        <QueuedAnimation />
      )}
      <div className="text-center">
        <p className="text-ink-800 font-medium text-lg">
          {message ?? 'Processing your document...'}
        </p>
        <p className="text-ink-700/50 text-sm mt-1">
          {type === 'queued'
            ? 'The system is busy. Your request is in the queue.'
            : 'This may take a moment. Please wait.'}
        </p>
      </div>
    </div>
  );
}

function ElephantMouseAnimation() {
  return (
    <div className="relative w-80 h-48 overflow-hidden">
      {/* Sand clock / hourglass effect background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <HourglassSvg />
      </div>

      {/* Track */}
      <div className="absolute bottom-8 left-0 right-0 h-0.5 bg-parchment-200 rounded-full" />

      {/* Mouse - running ahead */}
      <div
        className="absolute bottom-8 left-12"
        style={{
          animation: 'mouseFloat 1.5s ease-in-out infinite',
        }}
      >
        <MouseSvg />
      </div>

      {/* Elephant - chasing behind */}
      <div
        className="absolute bottom-8 left-4"
        style={{
          animation: 'elephantWobble 2s ease-in-out infinite',
        }}
      >
        <ElephantSvg />
      </div>

      {/* Sand particles */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col gap-1 opacity-50">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-0.5 h-2 bg-parchment-400 rounded-full mx-auto"
            style={{
              animation: `sandDrop 2s ease-in ${i * 0.5}s infinite`,
              opacity: 1 - i * 0.2,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes mouseFloat {
          0%, 100% { transform: translateX(0px) translateY(0px); }
          25% { transform: translateX(20px) translateY(-4px); }
          50% { transform: translateX(40px) translateY(0px); }
          75% { transform: translateX(20px) translateY(-2px); }
        }
        @keyframes elephantWobble {
          0%, 100% { transform: translateX(0px) translateY(0px); }
          25% { transform: translateX(15px) translateY(-2px); }
          50% { transform: translateX(30px) translateY(0px); }
          75% { transform: translateX(15px) translateY(-1px); }
        }
        @keyframes sandDrop {
          0% { transform: translateY(-20px); opacity: 0; }
          50% { opacity: 0.8; }
          100% { transform: translateY(60px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function QueuedAnimation() {
  return (
    <div className="relative w-24 h-24">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Hourglass body */}
        <g className="text-parchment-400">
          <polygon
            points="20,10 80,10 50,50"
            fill="currentColor"
            opacity="0.3"
            style={{ animation: 'pulse 2s infinite' }}
          />
          <polygon
            points="20,90 80,90 50,50"
            fill="currentColor"
            opacity="0.7"
            style={{ animation: 'pulse 2s infinite 1s' }}
          />
          <rect x="18" y="8" width="64" height="4" rx="2" fill="currentColor" />
          <rect x="18" y="88" width="64" height="4" rx="2" fill="currentColor" />
        </g>
        {/* Sand falling */}
        <circle
          cx="50"
          cy="55"
          r="3"
          fill="#d9a04a"
          opacity="0.8"
          style={{
            animation: 'sandFall 1.5s ease-in infinite',
          }}
        />
      </svg>
    </div>
  );
}

function MouseSvg() {
  return (
    <svg width="32" height="20" viewBox="0 0 32 20" fill="none">
      {/* Body */}
      <ellipse cx="14" cy="12" rx="10" ry="7" fill="#9ca3af" />
      {/* Head */}
      <ellipse cx="25" cy="10" rx="6" ry="5" fill="#9ca3af" />
      {/* Ear */}
      <circle cx="28" cy="6" r="3" fill="#f9a8d4" />
      {/* Eye */}
      <circle cx="27" cy="9" r="1" fill="#1f2937" />
      {/* Tail */}
      <path d="M4 14 Q0 8 2 4" stroke="#9ca3af" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Legs */}
      <path d="M10 18 L8 20 M14 19 L14 21 M18 19 L20 21 M22 18 L24 20" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ElephantSvg() {
  return (
    <svg width="48" height="36" viewBox="0 0 48 36" fill="none">
      {/* Body */}
      <ellipse cx="22" cy="20" rx="18" ry="12" fill="#6b7280" />
      {/* Head */}
      <ellipse cx="38" cy="16" rx="10" ry="9" fill="#6b7280" />
      {/* Ear */}
      <ellipse cx="42" cy="12" rx="6" ry="8" fill="#9ca3af" opacity="0.8" />
      {/* Trunk */}
      <path d="M44 22 Q48 26 46 32 Q44 36 42 34" stroke="#6b7280" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* Eye */}
      <circle cx="40" cy="14" r="1.5" fill="#1f2937" />
      {/* Tusk */}
      <path d="M40 22 Q44 24 44 28" stroke="#f5f5f4" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Tail */}
      <path d="M5 18 Q2 14 4 10" stroke="#6b7280" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Legs */}
      <rect x="10" y="28" width="5" height="8" rx="2" fill="#4b5563" />
      <rect x="17" y="29" width="5" height="7" rx="2" fill="#4b5563" />
      <rect x="24" y="29" width="5" height="7" rx="2" fill="#4b5563" />
      <rect x="31" y="28" width="5" height="8" rx="2" fill="#4b5563" />
    </svg>
  );
}

function HourglassSvg() {
  return (
    <svg width="120" height="140" viewBox="0 0 120 140" fill="none" opacity="0.15">
      <polygon points="10,10 110,10 60,70" fill="#d9a04a" />
      <polygon points="10,130 110,130 60,70" fill="#d9a04a" />
      <rect x="8" y="6" width="104" height="8" rx="4" fill="#d9a04a" />
      <rect x="8" y="126" width="104" height="8" rx="4" fill="#d9a04a" />
      <circle cx="60" cy="72" r="6" fill="#d9a04a">
        <animate attributeName="cy" values="30;72" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

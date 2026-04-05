import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <div className="text-center mb-16 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-parchment-100 border border-parchment-300
          rounded-full text-parchment-500 text-sm font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-parchment-400 inline-block" />
          AI-Powered Paleography
        </div>
        <h1 className="text-5xl font-serif font-bold text-ink-900 mb-6 leading-tight">
          Old French Documents,
          <br />
          <span className="text-parchment-500">Translated with Precision</span>
        </h1>
        <p className="text-xl text-ink-700/60 max-w-2xl mx-auto leading-relaxed">
          Upload handwritten manuscripts or printed historical documents. Our AI transcribes,
          identifies uncertainties, and translates — asking you to clarify only what matters.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/upload"
            className="px-8 py-3 bg-ink-900 text-parchment-100 rounded-xl font-medium
              hover:bg-ink-800 transition-colors text-lg"
          >
            Start Translating
          </Link>
          <Link
            href="/documents"
            className="px-8 py-3 border border-parchment-300 text-ink-800 rounded-xl font-medium
              hover:bg-parchment-100 transition-colors text-lg"
          >
            My Documents
          </Link>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {[
          {
            icon: (
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ),
            title: 'Accurate Transcription',
            desc: 'Preserves original French spelling, abbreviations, and historical context from handwritten or printed sources.',
          },
          {
            icon: (
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            title: 'Smart Uncertainty Detection',
            desc: 'Never silently guesses unclear text. Surfaces every ambiguity and asks you to clarify before finalizing.',
          },
          {
            icon: (
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            ),
            title: 'Multi-Language Output',
            desc: 'Translate into Hebrew, English, or clean modern French. Choose between accurate or fluent style.',
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="bg-white border border-parchment-200 rounded-xl p-6 hover:shadow-sm transition-shadow"
          >
            <div className="text-parchment-500 mb-3">{feature.icon}</div>
            <h3 className="font-semibold text-ink-800 mb-2">{feature.title}</h3>
            <p className="text-ink-700/60 text-sm leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="bg-white border border-parchment-200 rounded-2xl p-8">
        <h2 className="text-2xl font-serif font-bold text-ink-800 mb-8 text-center">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: '1', title: 'Upload', desc: 'Upload a JPG, PNG, or PDF (up to 10 pages)' },
            { step: '2', title: 'Configure', desc: 'Choose your target language and translation style' },
            { step: '3', title: 'Review', desc: 'Clarify any unclear handwriting or ambiguous terms' },
            { step: '4', title: 'Export', desc: 'Download the final translation as PDF or Word' },
          ].map((item, idx) => (
            <div key={item.step} className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-parchment-100 border-2 border-parchment-300
                flex items-center justify-center text-parchment-500 font-bold font-serif text-lg mb-3">
                {item.step}
              </div>
              {idx < 3 && (
                <div className="hidden md:block absolute translate-x-32 w-16 h-0.5 bg-parchment-200 mt-5" />
              )}
              <h4 className="font-medium text-ink-800 mb-1">{item.title}</h4>
              <p className="text-ink-700/50 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <p className="text-center text-ink-700/30 text-sm mt-12">
        Powered by GPT-4o vision. Designed for researchers, archivists, and genealogists.
      </p>
    </div>
  );
}

import './index.css'

function App() {
  return (
    <div className="min-h-screen bg-canvas text-ink font-jakarta">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="border-b border-paper-border bg-card-linen/80 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-6 py-5 flex items-center justify-between">
          <h1 className="font-lora text-2xl font-medium tracking-tight">
            The Last-Minute Life Saver
          </h1>
          <span className="text-sm text-charcoal">
            Proactive AI Companion
          </span>
        </div>
      </header>

      {/* ── Main Content Area ───────────────────────────── */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="rounded-2xl border border-paper-border bg-card-linen p-8 shadow-sm">
          <h2 className="font-lora text-xl font-medium text-ink mb-3">
            Welcome
          </h2>
          <p className="text-charcoal leading-relaxed max-w-prose">
            Your proactive AI productivity companion is initializing.
            This scaffold confirms that the Zen-Editorial design system
            is rendering correctly with custom typography and colors.
          </p>

          {/* ── Token Swatches ──────────────────────────── */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: 'Canvas',      color: 'bg-canvas',      border: true },
              { name: 'Card Linen',  color: 'bg-card-linen',  border: true },
              { name: 'Ink',         color: 'bg-ink',          dark: true },
              { name: 'Charcoal',    color: 'bg-charcoal',     dark: true },
              { name: 'Sage',        color: 'bg-sage',         dark: true },
              { name: 'Terracotta',  color: 'bg-terracotta',   dark: true },
              { name: 'Horizon',     color: 'bg-horizon',      dark: true },
              { name: 'Paper Border', color: 'bg-paper-border', border: true },
            ].map(({ name, color, dark, border }) => (
              <div
                key={name}
                className={`
                  rounded-lg p-4 text-xs font-medium
                  ${color}
                  ${dark ? 'text-white' : 'text-ink'}
                  ${border ? 'border border-paper-border' : ''}
                `}
              >
                {name}
              </div>
            ))}
          </div>

          {/* ── Typography Preview ─────────────────────── */}
          <div className="mt-8 space-y-3">
            <p className="font-lora text-lg italic text-charcoal">
              Lora Serif — Editorial warmth and personality
            </p>
            <p className="font-jakarta text-base font-medium text-ink">
              Plus Jakarta Sans — Clean humanist readability
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App

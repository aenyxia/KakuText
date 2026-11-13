import { useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>('light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="min-h-dvh bg-canvas text-ink px-4 py-6 md:px-8">
      <div className="mx-auto max-w-3xl space-y-4">
        <header className="flex items-center justify-between gap-3">
          <span className="text-xl font-extrabold tracking-tight">KakuText</span>
          <button
            type="button"
            onClick={toggleTheme}
            aria-pressed={theme === 'dark'}
            className="min-h-11 min-w-11 rounded-pill border border-line bg-accent px-4 py-2 text-sm font-bold text-accent-fg shadow-soft transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            {theme === 'light' ? 'Switch to Dark Pastel' : 'Switch to Light Pastel'}
          </button>
        </header>

        <main className="overflow-hidden rounded-paper border border-line bg-paper shadow-paper">
          <div className="border-b border-line bg-toolbar px-4 py-2.5 text-xs font-bold text-muted">
            Toolbar Surface • Nunito Variable Loaded
          </div>
          <div className="p-4 md:p-6">
            <div className="rounded-card border border-dashed border-(--border-dashed) p-4 md:p-6 space-y-2">
              <h1 className="text-2xl font-extrabold">Design Tokens Active</h1>
              <p className="text-base text-ink">
                Warm stationery paper, WCAG AA espresso ink, and self-hosted Nunito font are ready.
              </p>
              <p className="text-sm text-muted">
                Secondary cocoa metadata text and{' '}
                <a
                  href="#verify"
                  className="font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  accessible link contrast
                </a>
                .
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
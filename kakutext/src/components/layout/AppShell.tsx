import type { ReactNode } from 'react';

export interface AppShellProps {
  children: ReactNode;
  header: ReactNode;
  sidebar: ReactNode;
  statusBar?: ReactNode;
}

export function AppShell({ children, header, sidebar, statusBar }: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <a
        href="#main-workspace"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-pill focus:border-[1.5px] focus:border-ink focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-extrabold focus:text-accent-fg focus:shadow-paper"
      >
        Skip to editor
      </a>

      {header}

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-4 px-3 py-4 sm:px-6">
        {sidebar}

        <main
          id="main-workspace"
          tabIndex={-1}
          className="flex min-w-0 flex-1 flex-col focus:outline-none"
        >
          <div className="flex flex-1 flex-col rounded-paper border-[1.5px] border-ink bg-toolbar/75 p-2 shadow-paper sm:p-3">
            {children}
            {statusBar && (
              <div className="mt-2 overflow-hidden rounded-b-paper border-[1.5px] border-t-0 border-ink">
                {statusBar}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
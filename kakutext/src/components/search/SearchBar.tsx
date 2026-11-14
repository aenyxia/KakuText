import { Search, X } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';

export interface SearchBarProps {
  scopeLabel?: string;
}

export function SearchBar({ scopeLabel }: SearchBarProps) {
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);

  return (
    <div className="space-y-1">
      <div className="relative flex items-center">
        <Search
          className="pointer-events-none absolute left-3 h-4 w-4 text-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          value={searchQuery}
          maxLength={100}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={scopeLabel ? `Search in ${scopeLabel}...` : 'Search notes...'}
          aria-label="Search notes"
          className="min-h-11 w-full rounded-pill border-[1.5px] border-ink bg-paper py-2 pr-10 pl-9 text-base font-bold text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:text-sm"
        />
        {searchQuery.length > 0 && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
            className="absolute right-1.5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-tab-active hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
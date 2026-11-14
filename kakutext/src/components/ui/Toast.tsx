import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { X } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/lib/cn';

export type ToastVariant = 'info' | 'success' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  info: 'border-ink bg-paper text-ink',
  success: 'border-ink bg-tab-active text-ink',
  error: 'border-ink bg-danger text-danger-fg',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Record<string, number>>({});

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current[id];
    if (timer !== undefined) {
      window.clearTimeout(timer);
      delete timersRef.current[id];
    }
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-2), { id, message, variant }]);

      const timer = window.setTimeout(() => {
        dismissToast(id);
      }, 4000);
      timersRef.current[id] = timer;
    },
    [dismissToast]
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      Object.values(timers).forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 md:inset-x-auto md:right-6 md:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-center justify-between gap-3 rounded-card border-[1.5px] px-4 py-2 text-sm font-bold shadow-paper',
              VARIANT_CLASSES[toast.variant]
            )}
          >
            <span>{toast.message}</span>
            <IconButton
              aria-label="Dismiss notification"
              variant="toolbar"
              onClick={() => dismissToast(toast.id)}
              className="hover:bg-toolbar/60"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </IconButton>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return ctx;
}
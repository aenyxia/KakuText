import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type IconButtonVariant = 'default' | 'toolbar' | 'danger';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  variant?: IconButtonVariant;
  isActive?: boolean;
}

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  default: 'border-ink bg-paper text-ink shadow-soft hover:bg-toolbar',
  toolbar: 'border-transparent bg-transparent text-ink hover:bg-tab-active',
  danger: 'border-ink bg-danger text-danger-fg shadow-soft hover:brightness-95',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    variant = 'default',
    isActive = false,
    type = 'button',
    className,
    children,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={props['aria-pressed'] ?? (isActive ? true : undefined)}
      className={cn(
        'inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-card border-[1.5px] transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
        VARIANT_CLASSES[variant],
        isActive && 'border-ink bg-tab-active font-bold shadow-soft',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
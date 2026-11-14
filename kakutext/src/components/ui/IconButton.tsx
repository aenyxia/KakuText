import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type IconButtonVariant = 'default' | 'toolbar' | 'ghost' | 'danger' | 'active';
export type IconButtonSize = 'sm' | 'md';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  isActive?: boolean;
}

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  default: 'border-line bg-paper text-ink shadow-soft hover:bg-toolbar',
  toolbar: 'border-transparent bg-transparent text-ink hover:bg-tab-active',
  ghost: 'border-transparent bg-transparent text-muted hover:bg-toolbar/50 hover:text-ink',
  danger: 'border-line bg-danger text-danger-fg shadow-soft hover:brightness-95',
  active: 'border-line bg-tab-active font-bold text-ink shadow-soft',
};

const SIZE_CLASSES: Record<IconButtonSize, string> = {
  sm: 'min-h-11 min-w-11 p-2 text-sm',
  md: 'min-h-11 min-w-11 p-2.5 text-base',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    variant = 'default',
    size = 'md',
    isActive = false,
    type = 'button',
    className,
    children,
    ...props
  },
  ref
) {
  const effectiveActive = isActive || variant === 'active';

  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={props['aria-pressed'] ?? (effectiveActive ? true : undefined)}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-card border transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        isActive && 'border-line bg-tab-active font-bold shadow-soft',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
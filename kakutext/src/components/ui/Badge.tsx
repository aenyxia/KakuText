import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant = 'default' | 'accent' | 'muted' | 'danger';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: 'border-line bg-paper text-ink',
  accent: 'border-ink bg-accent text-accent-fg shadow-soft',
  muted: 'border-line bg-tab-active text-muted',
  danger: 'border-ink bg-danger text-danger-fg',
};

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill border-[1.5px] px-3 py-0.5 text-xs font-extrabold tracking-tight',
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
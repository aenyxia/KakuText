import { cn } from '@/lib/cn';

export interface KakuLogoProps {
  className?: string;
}

export function KakuLogo({ className }: KakuLogoProps) {
  return (
    <img
      src="/logo.svg"
      alt=""
      aria-hidden="true"
      className={cn('h-30 w-30 shrink-0 object-contain', className)}
    />
  );
}
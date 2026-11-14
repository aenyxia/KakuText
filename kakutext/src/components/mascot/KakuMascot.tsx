import { motion, useReducedMotion } from 'framer-motion';
import { CheeringPose } from '@/components/mascot/CheeringPose';
import { HappyPose } from '@/components/mascot/HappyPose';
import { SleepyPose } from '@/components/mascot/SleepyPose';
import { ThinkingPose } from '@/components/mascot/ThinkingPose';
import { cn } from '@/lib/cn';

export type MascotMood = 'happy' | 'saving' | 'sleepy' | 'thinking' | 'cheering' | 'slowdown';

export interface KakuMascotProps {
  mood: MascotMood;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<KakuMascotProps['size']>, string> = {
  sm: 'h-12 w-12',
  md: 'h-20 w-20',
  lg: 'h-28 w-28',
};

export function KakuMascot({
  mood,
  size = 'md',
  label,
  className,
}: KakuMascotProps) {
  const prefersReducedMotion = useReducedMotion();

  const renderPose = () => {
    switch (mood) {
      case 'sleepy':
      case 'slowdown':
        return <SleepyPose className="h-full w-full" />;
      case 'thinking':
      case 'saving':
        return <ThinkingPose className="h-full w-full" />;
      case 'cheering':
        return <CheeringPose className="h-full w-full" />;
      case 'happy':
      default:
        return <HappyPose className="h-full w-full" />;
    }
  };

  return (
    <motion.div
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      initial={prefersReducedMotion ? false : { scale: 0.96, opacity: 0.92 }}
      animate={
        prefersReducedMotion
          ? { scale: 1, opacity: 1 }
          : { scale: 1, opacity: 1, y: mood === 'cheering' ? [0, -4, 0] : 0 }
      }
      transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: 'easeOut' }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        SIZE_CLASSES[size],
        className
      )}
    >
      {renderPose()}
    </motion.div>
  );
}
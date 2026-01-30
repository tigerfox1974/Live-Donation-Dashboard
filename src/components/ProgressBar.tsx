import React from 'react';
import { cn } from '../lib/utils';
interface ProgressBarProps {
  current: number;
  target: number;
  className?: string;
  height?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}
export function ProgressBar({
  current,
  target,
  className,
  height = 'md',
  showLabel = false
}: ProgressBarProps) {
  // Overflow rule: if current > target, we treat target as current (100%)
  // but we might want to show the original target in text.
  // The visual bar should be 100% if current >= target.
  const displayTarget = Math.max(target, current);
  const percentage = Math.min(100, Math.max(0, current / displayTarget * 100));
  const heights = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-8',
    xl: 'h-16'
  };
  return (
    <div className={cn('w-full', className)}>
      {showLabel &&
      <div className="flex justify-between mb-2 text-sm font-medium text-gray-600">
          <span>İlerleme</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      }
      <div
        className={cn(
          'w-full bg-gray-200 rounded-full overflow-hidden relative',
          heights[height]
        )}>

        <div
          className="h-full bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] transition-all duration-1000 ease-out relative"
          style={{
            width: `${percentage}%`
          }}>

          {/* Glow effect */}
          <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/30 blur-sm transform translate-x-1" />
        </div>
      </div>
    </div>);

}
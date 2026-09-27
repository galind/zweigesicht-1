import type { ComponentProps } from 'react';
import { FlipHorizontal2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Native controls shared by the explorer and assembly route. */
export function TextButton({ className, ...props }: ComponentProps<'button'>) {
  return <button className={cn('text-button', className)} {...props} />;
}

export function FlipButton(props: ComponentProps<'button'>) {
  return (
    <TextButton aria-label="Flip movement" title="Flip movement" {...props}>
      <FlipHorizontal2
        className="dock-icon"
        style={{ transform: 'rotate(90deg)' }}
        aria-hidden="true"
      />
      <span>Flip</span>
    </TextButton>
  );
}

export function ResetViewButton(props: ComponentProps<'button'>) {
  return (
    <TextButton aria-label="Reset view" {...props}>
      <RotateCcw className="dock-icon" aria-hidden="true" />
      <span className="reset-desktop-label">Reset view</span>
      <span className="reset-mobile-label" aria-hidden="true">
        Reset
      </span>
    </TextButton>
  );
}

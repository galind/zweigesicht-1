import type { ComponentProps } from 'react';
import { makerUrl } from '@/src/content/about';
import { cn } from '@/lib/utils';

type SiteHeaderProps = ComponentProps<'header'> & {
  identityClassName?: string;
};

/** Shared brand and header frame used by both movement experiences. */
export function SiteHeader({
  className,
  identityClassName,
  children,
  ...props
}: SiteHeaderProps) {
  return (
    <header className={cn('site-header', className)} {...props}>
      <SiteIdentity className={identityClassName} />
      {children}
    </header>
  );
}

export function SiteIdentity({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('site-identity site-glass', className)} {...props}>
      <h1>Zweigesicht-1</h1>
      <a
        className="site-maker-credit maker-credit"
        href={makerUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="by Marco Lang — official website, opens in a new tab"
      >
        by Marco Lang
      </a>
    </div>
  );
}

export function SiteHeaderActions({
  className,
  ...props
}: ComponentProps<'nav'>) {
  return (
    <nav
      className={cn('site-header-actions site-glass', className)}
      {...props}
    />
  );
}

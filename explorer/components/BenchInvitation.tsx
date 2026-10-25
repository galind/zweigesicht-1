'use client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useBenchAccess } from '@/src/bench/useBenchAccess';

export function BenchInvitation() {
  const access = useBenchAccess();
  if (access === 'ready')
    return (
      <Link className="bench-trigger site-glass" href="/bench" prefetch={false}>
        <span className="bench-invitation-heading">
          Explore it in first person <ArrowRight aria-hidden="true" />
        </span>
      </Link>
    );
  return (
    <div className="bench-unavailable site-glass">
      <span className="bench-invitation-heading">
        {access === 'checking'
          ? 'Explore it in first person'
          : 'Explore on desktop'}
      </span>
      <span className="bench-invitation-note">
        {access === 'unsupported'
          ? 'Use a desktop browser with mouse capture support.'
          : 'Keyboard and mouse required.'}
      </span>
    </div>
  );
}

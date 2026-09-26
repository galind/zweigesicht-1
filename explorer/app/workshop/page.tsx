import type { Metadata } from 'next';
import Play from '../../src/play/Play';
import { ORIGIN } from '../../src/content/seo';

export const metadata: Metadata = {
  title: 'Workshop — Assemble Zweigesicht-1',
  description:
    'Assemble the Zweigesicht-1 movement in Easy or Hard mode using the original ML-01 components.',
  robots: { index: false, follow: false },
  alternates: { canonical: `${ORIGIN}/workshop` },
  openGraph: {
    title: 'Workshop — Assemble Zweigesicht-1',
    description: 'A quiet watch-movement assembly workshop.',
    url: `${ORIGIN}/workshop`,
  },
  twitter: {
    title: 'Workshop — Assemble Zweigesicht-1',
    description: 'A quiet watch-movement assembly workshop.',
  },
};

export default function WorkshopPage() {
  return <Play />;
}

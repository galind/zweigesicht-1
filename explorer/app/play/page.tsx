import type { Metadata } from 'next';
import Play from '../../src/play/Play';
import { ORIGIN } from '../../src/content/seo';

export const metadata: Metadata = {
  title: 'Assemble Zweigesicht-1',
  description:
    'A quiet, guided watch-assembly puzzle using the original ML-01 components.',
  robots: { index: false, follow: false },
  alternates: { canonical: `${ORIGIN}/play` },
  openGraph: {
    title: 'Assemble Zweigesicht-1',
    description: 'A quiet watch-assembly puzzle.',
    url: `${ORIGIN}/play`,
  },
  twitter: {
    title: 'Assemble Zweigesicht-1',
    description: 'A quiet watch-assembly puzzle.',
  },
};
export default function PlayPage() {
  return <Play />;
}

import type { Metadata } from 'next';
import Bench from '../../src/bench/Bench';
export const metadata: Metadata = {
  title: 'Explore the workbench · Zweigesicht-1',
  description:
    'Explore a first-person workbench with the static Zweigesicht-1 movement, its holders and detached watch parts.',
  alternates: { canonical: '/bench' },
  robots: { index: false, follow: false },
};
export default function BenchPage() {
  return <Bench />;
}

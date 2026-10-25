import type { Metadata } from 'next';
import Bench from '../../src/bench/Bench';
export const metadata: Metadata = {
  title: 'Walk inside the movement · Zweigesicht-1',
  description: 'A tiny walk across the static Zweigesicht-1 movement.',
  alternates: { canonical: '/bench' },
  robots: { index: false, follow: false },
};
export default function BenchPage() {
  return <Bench />;
}

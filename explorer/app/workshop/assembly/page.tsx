import type { Metadata } from 'next';
import Assembly from '../../../src/assembly/Assembly';

export const metadata: Metadata = {
  title: 'Be a watchmaker: Assembly · Zweigesicht-1',
  description:
    'A first playable chapter assembling the winding mechanism in fifteen operations.',
  robots: { index: false, follow: false },
};
export default function AssemblyPage() {
  return <Assembly />;
}

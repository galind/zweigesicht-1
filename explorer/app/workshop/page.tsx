import type { Metadata } from 'next';
import Assembly from '../../src/assembly/Assembly';
import { workshopMetadata } from '../../src/content/seo';

export const metadata: Metadata = workshopMetadata;

export default function WorkshopPage() {
  return <Assembly />;
}

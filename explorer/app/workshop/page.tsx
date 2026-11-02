import type { Metadata } from 'next';
import Workshop from '../../src/assembly/Workshop';
import { workshopMetadata } from '../../src/content/seo';

export const metadata: Metadata = workshopMetadata;

export default function WorkshopPage() {
  return <Workshop />;
}

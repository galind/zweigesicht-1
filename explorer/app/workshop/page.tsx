import type { Metadata } from 'next';
import Play from '../../src/play/Play';
import { workshopMetadata } from '../../src/content/seo';

export const metadata: Metadata = workshopMetadata;

export default function WorkshopPage() {
  return <Play />;
}

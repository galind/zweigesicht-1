import type { Metadata } from 'next';
import Prototype from '../../../src/assembly/prototype/Prototype';
import { workshopMetadata } from '../../../src/content/seo';
export const metadata: Metadata = {
  ...workshopMetadata,
  title: 'Be a watchmaker! — presentation prototype',
};
export default function PrototypePage() {
  return <Prototype />;
}

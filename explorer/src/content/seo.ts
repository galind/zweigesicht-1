import type { Metadata } from 'next';
import { aboutDescription } from './about';

export const ORIGIN = 'https://zweigesicht-1.guillemgalindo.com';
const title = 'Marco Lang Zweigesicht-1 — Interactive ML-01 Movement';
const description =
  "Explore Marco Lang's Zweigesicht-1 and Calibre ML-01 in an interactive 3D movement viewer. Inspect its components, construction and movement architecture.";
const image = `${ORIGIN}/images/zweigesicht-1-separated-71ba2d171225.jpg`;
const imageAlt =
  'Exploded CAD view of the Zweigesicht-1 Calibre ML-01 movement with authored surface finishes';

// Route metadata replaces nested social objects rather than merging them.
// Keep each route's card complete in the initial HTML, without client JS.
function pageMetadata(
  title: string,
  description: string,
  pathname: string,
): Metadata {
  const url = `${ORIGIN}${pathname}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title,
      description,
      url,
      siteName: 'Marco Lang Zweigesicht-1',
      images: [
        {
          url: image,
          width: 2560,
          height: 1440,
          type: 'image/jpeg',
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [{ url: image, alt: imageAlt }],
    },
  };
}

export const homepageMetadata = pageMetadata(title, description, '/');

export const workshopMetadata: Metadata = {
  ...pageMetadata(
    'Workshop — Assemble Zweigesicht-1',
    'Assemble the Zweigesicht-1 movement in Easy or Hard mode using the original ML-01 components.',
    '/workshop',
  ),
  robots: { index: false, follow: false },
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${ORIGIN}/#website`,
      url: `${ORIGIN}/`,
      name: title,
    },
    {
      '@type': 'WebApplication',
      url: `${ORIGIN}/`,
      name: 'Marco Lang Zweigesicht-1 — Calibre ML-01 interactive movement viewer',
      description: aboutDescription,
      image,
      isPartOf: { '@id': `${ORIGIN}/#website` },
      about: [
        { '@type': 'Thing', name: 'Marco Lang Zweigesicht-1' },
        { '@type': 'Thing', name: 'Calibre ML-01' },
      ],
    },
  ],
};

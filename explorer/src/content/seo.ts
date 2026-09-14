import type { Metadata } from 'next';
import { aboutDescription } from './about';

export const ORIGIN = 'https://zweigesicht-1.guillemgalindo.com';
const title = 'Marco Lang Zweigesicht-1 — Interactive ML-01 Movement';
const description =
  "Explore Marco Lang's Zweigesicht-1 and Calibre ML-01 in an interactive 3D movement viewer. Inspect its components, construction and movement architecture.";
const image = `${ORIGIN}/images/marco-lang-ml01-movement.webp`;

export const homepageMetadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${ORIGIN}/` },
  openGraph: {
    type: 'website',
    title,
    description,
    url: `${ORIGIN}/`,
    siteName: 'Marco Lang Zweigesicht-1',
    images: [
      {
        url: image,
        width: 1200,
        height: 900,
        alt: 'CAD-based view of Calibre ML-01 with authored surface finishes',
      },
    ],
  },
  twitter: { card: 'summary_large_image', title, description, images: [image] },
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
      creator: {
        '@type': 'Person',
        name: 'Guillem Galindo',
        url: 'https://guillemgalindo.com',
      },
      image,
      isPartOf: { '@id': `${ORIGIN}/#website` },
      about: [
        { '@type': 'Thing', name: 'Marco Lang Zweigesicht-1' },
        { '@type': 'Thing', name: 'Calibre ML-01' },
      ],
    },
  ],
};

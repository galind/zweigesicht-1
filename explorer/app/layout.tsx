import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Zweigesicht · Marco Lang',
  description: 'Explore the construction of the Marco Lang ml-01 movement in real CAD.',
};
export default function RootLayout({children}: {children: React.ReactNode}) {
  return <html lang="en" className="dark"><body>{children}</body></html>;
}

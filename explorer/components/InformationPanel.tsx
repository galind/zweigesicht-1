'use client';
import { useRef, type ReactNode } from 'react';
import { ChevronRight, ExternalLink } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  cadUrl,
  watchSourceUrl,
  watchFeatures,
  movementSpecs,
} from '@/src/content/about';

export function InformationPanel({
  open,
  onOpenChange,
  children,
  onViewerSettings,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  onViewerSettings: () => void;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const openingSettings = useRef(false);
  return (
    <>
      <button
        ref={trigger}
        className="about-toggle text-button"
        aria-expanded={open}
        aria-controls="watch-information"
        onClick={() => {
          openingSettings.current = false;
          onOpenChange(!open);
        }}
      >
        Learn about the watch
      </button>
      <Sheet modal={false} open={open} onOpenChange={onOpenChange}>
        <SheetContent
          id="watch-information"
          className="explorer-panel information-panel"
          showOverlay={false}
          scrollContent
          finalFocus={() => (openingSettings.current ? false : trigger.current)}
        >
          <SheetHeader>
            <SheetTitle>Two ways to look at time.</SheetTitle>
            <SheetDescription>
              Zweigesicht–1 by Marco Lang. Two faces share a single movement,
              Calibre ML–01.
            </SheetDescription>
          </SheetHeader>
          <div className="about-copy">
            {watchFeatures.map(({ title, text }) => (
              <section key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </section>
            ))}
            <details className="watch-specifications">
              <summary>Movement specifications</summary>
              <p className="secondary">Reported by Marco Lang.</p>
              <table className="movement-specs">
                <caption className="sr-only">
                  Calibre ML–01 specifications
                </caption>
                <tbody>
                  {movementSpecs.map(([label, value]) => (
                    <tr key={label}>
                      <th scope="row">{label}</th>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
            <footer className="information-footer">
              <nav className="information-sources" aria-label="Watch sources">
                <a
                  href={watchSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Watch details <ExternalLink aria-hidden="true" />
                  <span className="sr-only">
                    {' '}
                    — Marco Lang, opens in a new tab
                  </span>
                </a>
                <a href={cadUrl} target="_blank" rel="noopener noreferrer">
                  Original CAD files <ExternalLink aria-hidden="true" />
                  <span className="sr-only">
                    {' '}
                    — Marco Lang, opens in a new tab
                  </span>
                </a>
              </nav>
              <details className="viewer-credit">
                <summary>About this independent viewer</summary>
                <p>
                  Created by{' '}
                  <a
                    href="https://guillemgalindo.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Guillem Galindo
                  </a>{' '}
                  using{' '}
                  <a href={cadUrl} target="_blank" rel="noopener noreferrer">
                    Marco Lang’s CAD
                  </a>
                  . Not affiliated with Marco Lang.
                </p>
                {children}
              </details>
              <button
                className="viewer-settings-link menu-link"
                onClick={() => {
                  openingSettings.current = true;
                  onViewerSettings();
                }}
              >
                Viewer settings <ChevronRight aria-hidden="true" />
              </button>
            </footer>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

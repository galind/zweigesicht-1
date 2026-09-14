'use client';
import { useRef, useState, type ReactNode } from 'react';
import { ChevronRight, ExternalLink } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  makerUrl,
  cadUrl,
  watchSourceUrl,
  watchFeatures,
  movementSpecs,
} from '@/src/content/about';
type Panel = 'menu' | 'different' | 'specs' | null;
export function InformationRail({
  panel,
  onPanelChange,
  children,
  onViewerSettings,
}: {
  panel: Panel;
  onPanelChange: (panel: Panel) => void;
  children: ReactNode;
  onViewerSettings: () => void;
}) {
  const mobileTrigger = useRef<HTMLButtonElement>(null);
  const differentTrigger = useRef<HTMLButtonElement>(null);
  const specsTrigger = useRef<HTMLButtonElement>(null);
  const [lastPanel, setLastPanel] = useState<Panel>(panel);
  const popup = useRef<HTMLDivElement>(null);
  const open = (next: Panel) => {
    // Move focus off the outgoing menu item before React removes it. The
    // persistent scroll area then retains keyboard scrolling across pages.
    popup.current?.querySelector<HTMLElement>('.sheet-scroll-area')?.focus();
    if (next) setLastPanel(next);
    onPanelChange(next);
  };
  const contentPanel = panel ?? lastPanel;
  const links = (mobile = false) => (
    <>
      <a
        href={makerUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Marco Lang — official website, opens in a new tab"
      >
        Marco Lang <ExternalLink aria-hidden="true" />
      </a>
      <a
        href={cadUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="CAD files — maker’s original files, opens in a new tab"
      >
        CAD files <ExternalLink aria-hidden="true" />
      </a>
      <div className="rail-divider" />
      <button
        ref={mobile ? undefined : differentTrigger}
        aria-expanded={panel === 'different'}
        aria-controls="watch-information"
        onClick={() => open('different')}
      >
        What makes it different <ChevronRight aria-hidden="true" />
      </button>
      <button
        ref={mobile ? undefined : specsTrigger}
        aria-expanded={panel === 'specs'}
        aria-controls="watch-information"
        onClick={() => open('specs')}
      >
        Movement specs <ChevronRight aria-hidden="true" />
      </button>
    </>
  );
  return (
    <>
      <button
        ref={mobileTrigger}
        className="about-toggle text-button"
        aria-expanded={!!panel}
        aria-controls="watch-information"
        onClick={() => open(panel ? null : 'menu')}
      >
        About
      </button>
      <nav
        hidden={!!panel}
        className="information-rail"
        aria-label="About Zweigesicht-1"
      >
        {links()}
      </nav>
      <Sheet
        modal={false}
        open={!!panel}
        onOpenChange={(isOpen) => {
          if (!isOpen) onPanelChange(null);
        }}
      >
        <SheetContent
          ref={popup}
          id="watch-information"
          className="explorer-panel information-panel"
          showOverlay={false}
          scrollContent
          finalFocus={() =>
            lastPanel === 'menu' ||
            window.matchMedia('(max-width: 1000px)').matches
              ? mobileTrigger.current
              : lastPanel === 'specs'
                ? specsTrigger.current
                : differentTrigger.current
          }
        >
          <SheetHeader>
            <SheetTitle>
              {contentPanel === 'menu'
                ? 'About Zweigesicht–1'
                : contentPanel === 'specs'
                  ? 'Calibre ML–01'
                  : 'Two ways to look at time.'}
            </SheetTitle>
            <SheetDescription>
              {contentPanel === 'specs'
                ? 'Movement specifications reported by Marco Lang.'
                : contentPanel === 'different'
                  ? 'The watch by Marco Lang.'
                  : 'The watch, its maker and this independent viewer.'}
            </SheetDescription>
          </SheetHeader>
          {contentPanel === 'menu' ? (
            <nav className="information-menu" aria-label="About Zweigesicht-1">
              {links(true)}
              <section className="viewer-help">
                <h3>Using the viewer</h3>
                <button
                  className="viewer-settings-link"
                  onClick={onViewerSettings}
                >
                  Viewer settings <ChevronRight aria-hidden="true" />
                </button>
              </section>
            </nav>
          ) : (
            <div className="about-copy">
              {contentPanel === 'different' ? (
                watchFeatures.map(({ title, text }) => (
                  <section key={title}>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </section>
                ))
              ) : (
                <table className="movement-specs">
                  <tbody>
                    {movementSpecs.map(([label, value]) => (
                      <tr key={label}>
                        <th scope="row">{label}</th>
                        <td>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <a
                className="source-link"
                href={watchSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Marco Lang · Watch details <ExternalLink aria-hidden="true" />
              </a>
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
                className="menu-link info-back"
                onClick={() => open('menu')}
              >
                All About links
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

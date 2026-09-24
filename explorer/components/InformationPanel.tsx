'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowUpRight } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  cadUrl,
  watchDescription,
  watchSourceUrl,
  watchPressLinks,
} from '@/src/content/about';

export function InformationPanel({
  open,
  onOpenChange,
  restoreFocus = true,
  style,
}: {
  style?: CSSProperties;
  open: boolean;
  restoreFocus?: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 600px)');
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return (
    <>
      <button
        ref={trigger}
        className="about-toggle text-button"
        aria-expanded={open}
        aria-controls="watch-information"
        onClick={() => onOpenChange(!open)}
      >
        Learn about the watch
      </button>
      <Sheet modal={mobile} open={open} onOpenChange={onOpenChange}>
        <SheetContent
          style={style}
          id="watch-information"
          className="explorer-panel information-panel"
          showOverlay={mobile}
          scrollContent
          finalFocus={() => (restoreFocus ? trigger.current : false)}
        >
          <SheetHeader>
            <SheetTitle>Learn about the watch</SheetTitle>
            <SheetDescription>Zweigesicht–1 by Marco Lang</SheetDescription>
          </SheetHeader>
          <div className="watch-reading">
            <p className="watch-description">{watchDescription}</p>
            <a
              className="watch-official-link"
              href={watchSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Explore the watch on Marco Lang’s website</span>
              <ArrowUpRight aria-hidden="true" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <h3 className="watch-press-heading" id="watch-press-heading">
              Press coverage
            </h3>
            <ul
              className="watch-reading-links"
              aria-labelledby="watch-press-heading"
            >
              {watchPressLinks.map(({ publisher, title, url }) => (
                <li key={url}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <span>
                      <span className="watch-reading-publisher">{publisher}</span>
                      <span className="watch-reading-title">{title}</span>
                    </span>
                    <ArrowUpRight aria-hidden="true" />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
            <footer className="watch-sources" aria-label="Watch sources">
              <a
                href={cadUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Original CAD — Marco Lang’s files, opens in a new tab"
              >
                Original CAD
              </a>
            </footer>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

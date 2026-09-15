'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
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
  watchParagraphs,
  movementSpecs,
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
            <SheetTitle>Zweigesicht–1</SheetTitle>
            <SheetDescription>By Marco Lang</SheetDescription>
          </SheetHeader>
          <div className="watch-reading">
            {watchParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <table className="watch-facts">
              <caption className="sr-only">
                Movement specifications reported by Marco Lang
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
            <footer className="watch-sources" aria-label="Watch sources">
              <a
                href={watchSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Marco Lang — watch details, opens in a new tab"
              >
                Marco Lang
              </a>
              <span aria-hidden="true">·</span>
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

'use client';

import {
  useRef,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { ChevronRight } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from './ui/sheet';

/** Shared choices stay available on Workshop when the homepage entry is hidden. */
export function WorkshopChooser({
  open,
  onOpenChange,
  style,
  finalFocus,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  style?: CSSProperties;
  finalFocus?: RefObject<HTMLButtonElement | null>;
  children?: ReactNode;
}) {
  const easyModeButton = useRef<HTMLButtonElement>(null);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {children}
      <SheetContent
        side="top"
        style={style}
        className="explorer-panel settings-panel header-panel assembly-chooser"
        scrollContent
        initialFocus={easyModeButton}
        finalFocus={finalFocus}
      >
        <SheetHeader>
          <SheetTitle>Be a watchmaker</SheetTitle>
          <SheetDescription>
            Choose how much of the movement you want to build.
          </SheetDescription>
        </SheetHeader>
        <div className="panel-body assembly-mode-list">
          <button
            ref={easyModeButton}
            type="button"
            onClick={() => location.assign('/workshop?mode=easy')}
          >
            <span>
              <strong>Easy</strong>
              <small>83 prepared fits · Best for a first build</small>
            </span>
            <ChevronRight aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => location.assign('/workshop?mode=hard')}
          >
            <span>
              <strong>Hard</strong>
              <small>243 individual parts · 35 subassemblies</small>
            </span>
            <ChevronRight aria-hidden="true" />
          </button>
          <p>Progress is saved on this device.</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

'use client';
import {
  useRef,
  type CSSProperties,
  type RefObject,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { BenchControls } from '@/src/bench/BenchControls';
import { requestBenchEntry } from '@/src/bench/entryIntent';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from './ui/sheet';
import '@/src/bench/bench.css';

export function BenchEntry({
  open,
  onOpenChange,
  style,
  finalFocus,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  style?: CSSProperties;
  finalFocus: RefObject<HTMLButtonElement | null>;
  children: ReactNode;
}) {
  const router = useRouter();
  const enter = useRef<HTMLButtonElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {children}
      <SheetContent
        side="top"
        style={style}
        className="bench-entry-popup"
        initialFocus={() => {
          const popup = enter.current?.closest('[data-slot="sheet-content"]');
          // Keep the introduction visible when large text needs a scrollable panel.
          return popup && popup.scrollHeight > popup.clientHeight
            ? title.current
            : enter.current;
        }}
        finalFocus={finalFocus}
      >
        <SheetHeader>
          <SheetTitle ref={title} tabIndex={-1}>
            Before you begin
          </SheetTitle>
          <SheetDescription>
            Keyboard and mouse required. Esc releases the pointer and opens the
            menu.
          </SheetDescription>
        </SheetHeader>
        <BenchControls />
        <button
          className="bench-enter"
          ref={enter}
          onClick={() => {
            requestBenchEntry();
            router.push('/bench');
          }}
        >
          Enter workbench
        </button>
      </SheetContent>
    </Sheet>
  );
}

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
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {children}
      <SheetContent
        side="top"
        showOverlay={false}
        style={style}
        className="bench-entry-popup"
        initialFocus={enter}
        finalFocus={finalFocus}
      >
        <SheetHeader>
          <SheetTitle>Walk inside the movement</SheetTitle>
          <SheetDescription>
            Use a keyboard and mouse to explore.
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
          Enter the movement
        </button>
      </SheetContent>
    </Sheet>
  );
}

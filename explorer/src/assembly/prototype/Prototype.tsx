"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, PackageOpen, X, RotateCcw, Settings2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { SiteHeaderActions } from "@/components/site-chrome";
import { matchesPart, normalizeSearch } from "../../experience/catalog";
import {
  PARTS,
  LABELS,
  OPERATIONS,
  componentIds,
  type PartItem,
  type Side,
  type Tool,
} from "../lesson";
import { createSession, commitAttempt, type Session } from "../session";
import { PrototypeViewer, type AssemblyView, type Seat } from "./PrototypeViewer";
import "./prototype.css";

const ITEMS = Object.keys(PARTS) as PartItem[];
const stemItems = new Set<PartItem>(["stem", "wheel", "coupling"]);
function checkpoint(): Session {
  // Explicit review fixture, never a lesson transition or a persisted chapter save.
  return { ...createSession("menu-prototype"), cursor: 7, awarded: 7 };
}
export default function Prototype() {
  const host = useRef<HTMLDivElement>(null),
    viewer = useRef<PrototypeViewer | null>(null);
  const partsButton = useRef<HTMLButtonElement>(null),
    cancelButton = useRef<HTMLButtonElement>(null);
  const [session, setSession] = useState(checkpoint);
  const [view, setView] = useState<AssemblyView>("movement");
  const [selected, setSelected] = useState<PartItem>();
  const [tool, setTool] = useState<Tool | null>(null);
  const [side, setSide] = useState<Side>("movement");
  const [support, setSupport] = useState<Side | null>(null);
  const [panel, setPanel] = useState<"parts" | "setup" | null>(null);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  const [thumbnails, setThumbnails] = useState<Partial<Record<PartItem, string>>>({});
  const [seat, setSeat] = useState<Seat>({ x: 0, y: 0, width: 1, height: 1 });
  const [feedback, setFeedback] = useState(
    "Choose an assembly to inspect. Browse Parts to try fitting the coupling wheel.",
  );
  const [dragPoint, setDragPoint] = useState<{ x: number; y: number }>();
  const gesture = useRef<{
    pointer: number;
    item: PartItem;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const commitRef = useRef<(item: PartItem, destination: AssemblyView, distance: number) => void>(
    () => {},
  );
  const cancelRef = useRef<() => void>(() => {});
  const finished = session.cursor >= 9;
  const installed = new Set(componentIds(session.cursor));
  const available = (item: PartItem) => !PARTS[item].every((id) => installed.has(id));

  function cancel(message = "Placement cancelled. No attempt counted.") {
    gesture.current = null;
    viewer.current?.movePreview();
    setDragPoint(undefined);
    setSelected(undefined);
    setFeedback(message);
    partsButton.current?.focus();
  }
  function choose(item: PartItem) {
    if (!ready || finished || !available(item)) return;
    setSelected(item);
    setPanel(null);
    setFeedback(`${LABELS[item]} selected. Drag to an assembly or choose a destination below.`);
  }
  function attempt(item: PartItem, destination: AssemblyView, distanceMm: number) {
    if (!ready || finished) return;
    const result = commitAttempt(session, {
      id: crypto.randomUUID(),
      runId: session.runId,
      revision: session.revision,
      item,
      destination,
      distanceMm,
      kind: "place",
      tool,
      side,
      support,
    });
    setSession(result.session);
    setFeedback(
      result.accepted
        ? `${LABELS[item]} fitted. ${result.session.cursor === 9 ? "Prototype complete — the full chapter has not been migrated." : "Choose the next part from Parts."}`
        : result.message,
    );
    if (result.accepted) {
      setSelected(undefined);
      partsButton.current?.focus();
    }
  }
  useLayoutEffect(() => {
    commitRef.current = attempt;
    cancelRef.current = () => cancel();
  });
  useLayoutEffect(() => {
    viewer.current?.update(session.cursor, view, selected, side);
  }, [session.cursor, view, selected, side, ready]);
  useEffect(() => {
    let live = true;
    let instance: PrototypeViewer | undefined;
    setReady(false);
    setError("");
    try {
      instance = new PrototypeViewer(host.current!, setSeat, (message) => {
        if (live) {
          setReady(false);
          setError(message);
          gesture.current = null;
          setDragPoint(undefined);
        }
      });
      viewer.current = instance;
      void instance
        .load()
        .then((images) => {
          if (live) {
            setThumbnails(images);
            setReady(true);
          }
        })
        .catch((reason: unknown) => {
          if (live)
            setError(reason instanceof Error ? reason.message : "Unable to load prototype.");
        });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Graphics unavailable.");
    }
    return () => {
      live = false;
      instance?.dispose();
      viewer.current = null;
    };
  }, [retry]);
  useEffect(() => {
    const move = (event: PointerEvent) => {
      const drag = gesture.current;
      if (!drag || drag.pointer !== event.pointerId) return;
      drag.moved ||= Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 6;
      if (!drag.moved) return;
      const point = { x: event.clientX, y: event.clientY };
      setDragPoint(point);
      viewer.current?.movePreview(point);
    };
    const release = (event: PointerEvent) => {
      const drag = gesture.current;
      if (!drag || drag.pointer !== event.pointerId) return;
      gesture.current = null;
      const instance = viewer.current,
        rect = host.current!.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (drag.moved && inside && instance)
        commitRef.current(
          drag.item,
          instance.view,
          instance.distance({ x: event.clientX, y: event.clientY }),
        );
      else if (drag.moved) cancelRef.current();
      else cancelButton.current?.focus();
      instance?.movePreview();
      setDragPoint(undefined);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.querySelector(".prototype-panel"))
        cancelRef.current();
    };
    const abort = () => {
      if (gesture.current) cancelRef.current();
    };
    const hidden = () => {
      if (document.hidden) abort();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", abort);
    window.addEventListener("blur", abort);
    window.addEventListener("keydown", escape);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", abort);
      window.removeEventListener("blur", abort);
      window.removeEventListener("keydown", escape);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, []);

  return (
    <main
      className="watchmaker-prototype"
      data-cursor={session.cursor}
      data-mistakes={session.mistakes}
    >
      <header className="prototype-header">
        <Link href="/workshop" aria-label="Back to full chapter">
          <ArrowLeft />
        </Link>
        <div>
          <h1>Be a watchmaker!</h1>
          <small>Presentation prototype · unsaved review checkpoint</small>
        </div>
        <SiteHeaderActions />
      </header>
      <section className="prototype-context">
        <p>
          {finished
            ? "Two placements complete. Review the prototype before migrating the chapter."
            : OPERATIONS[session.cursor].label}
        </p>
        <nav aria-label="Active assembly">
          {(["movement", "stem"] as const).map((assembly) => (
            <button
              key={assembly}
              aria-pressed={view === assembly}
              onClick={() => {
                if (gesture.current) cancel();
                setView(assembly);
              }}
            >
              {assembly === "movement" ? "Movement" : "Separate stem"}
            </button>
          ))}
        </nav>
      </section>
      <section className="prototype-workspace">
        <div className="prototype-surface" ref={host} />
        <span className="prototype-assembly-label">
          {view === "movement"
            ? "Movement · set aside at this checkpoint"
            : "Separate stem · working assembly"}
        </span>
        {selected && ready && (
          <button
            className="prototype-seat"
            aria-label={`Place ${LABELS[selected]} on ${view}`}
            style={{
              left: Math.max(24, Math.min(seat.width - 24, seat.x)),
              top: Math.max(24, Math.min(seat.height - 24, seat.y)),
            }}
            onClick={() => attempt(selected, view, 0)}
          >
            <span>+</span>
          </button>
        )}
        {!ready && (
          <div className="prototype-loading" role={error ? "alert" : "status"}>
            {error || "Loading original components…"}
            {error && <button onClick={() => setRetry((value) => value + 1)}>Retry</button>}
          </div>
        )}
      </section>
      <footer className="prototype-dock">
        <p role="status" aria-live="polite">
          {feedback}
        </p>
        <div className="prototype-selection">
          {selected ? (
            <>
              <img src={thumbnails[selected]} alt="" />
              <strong>{LABELS[selected]}</strong>
              <button ref={cancelButton} aria-label="Cancel placement" onClick={() => cancel()}>
                <X />
              </button>
            </>
          ) : (
            <span>{finished ? "Review checkpoint complete" : "Pick a part to begin"}</span>
          )}
        </div>
        {selected && (
          <div className="prototype-destinations" aria-label="Choose placement destination">
            <button disabled={!ready} onClick={() => attempt(selected, "movement", 0)}>
              Place on movement
            </button>
            <button disabled={!ready} onClick={() => attempt(selected, "stem", 0)}>
              Place on stem
            </button>
          </div>
        )}
        <div className="prototype-actions">
          <button
            ref={partsButton}
            disabled={!ready}
            aria-expanded={panel === "parts"}
            onClick={() => setPanel("parts")}
          >
            <PackageOpen />
            Parts
          </button>
          <button
            disabled={!ready || finished}
            aria-label="Placement setup"
            onClick={() => setPanel("setup")}
          >
            <Settings2 />
            {tool ?? "Choose tool"}
          </button>
          <button
            aria-label="Reset prototype checkpoint"
            onClick={() => {
              cancel("Review checkpoint reset. Chapter saves are untouched.");
              setSession(checkpoint());
              setTool(null);
              setSide("movement");
              setSupport(null);
            }}
          >
            <RotateCcw />
          </button>
        </div>
      </footer>
      {dragPoint && selected && (
        <div
          className="prototype-drag-label"
          style={{
            left: Math.max(8, Math.min(window.innerWidth - 210, dragPoint.x + 16)),
            top: Math.max(8, dragPoint.y - 48),
          }}
        >
          {LABELS[selected]}
        </div>
      )}
      <Sheet
        modal={false}
        open={panel !== null}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
      >
        <SheetContent
          side="bottom"
          className="prototype-panel"
          showOverlay={false}
          finalFocus={() =>
            gesture.current ? false : selected ? cancelButton.current : partsButton.current
          }
        >
          <SheetHeader>
            <SheetTitle>{panel === "setup" ? "Placement setup" : "Parts"}</SheetTitle>
            <SheetDescription>
              {panel === "setup"
                ? "Choices are retained until you change them. Tool and support rules are provisional."
                : "Tap a part to select it, or drag its preview onto the active assembly."}
            </SheetDescription>
          </SheetHeader>
          {panel === "setup" ? (
            <div className="prototype-setup">
              <fieldset>
                <legend>Tool</legend>
                {(["hands", "tweezers", "screwdriver"] as const).map((value) => (
                  <button key={value} aria-pressed={tool === value} onClick={() => setTool(value)}>
                    {value}
                  </button>
                ))}
              </fieldset>
              <fieldset>
                <legend>Part side upward</legend>
                {(["movement", "dial"] as const).map((value) => (
                  <button key={value} aria-pressed={side === value} onClick={() => setSide(value)}>
                    {value}
                  </button>
                ))}
              </fieldset>
              <fieldset>
                <legend>Support</legend>
                {([null, "movement", "dial"] as const).map((value) => (
                  <button
                    key={value ?? "none"}
                    aria-pressed={support === value}
                    onClick={() => setSupport(value)}
                  >
                    {value ?? "None"}
                  </button>
                ))}
              </fieldset>
              <button onClick={() => setPanel(null)}>Done</button>
            </div>
          ) : (
            <>
              <div className="component-finder prototype-filters">
                <label className="catalog-search">
                  <span className="sr-only">Search parts</span>
                  <input
                    type="search"
                    placeholder="Search parts…"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>
                <nav aria-label="Part groups">
                  {["all", "movement", "stem"].map((value) => (
                    <button
                      key={value}
                      aria-pressed={group === value}
                      onClick={() => setGroup(value)}
                    >
                      {value === "all" ? "All parts" : value}
                    </button>
                  ))}
                </nav>
              </div>
              <div className="catalog-index prototype-parts">
                {ITEMS.filter(
                  (item) =>
                    matchesPart(normalizeSearch(LABELS[item]), query) &&
                    (group === "all" || stemItems.has(item) === (group === "stem")),
                ).map((item) => (
                  <div className="prototype-part-row" key={item}>
                    <button
                      data-item={item}
                      disabled={!available(item) || finished}
                      onPointerDown={(event) => {
                        if (!event.isPrimary || event.button !== 0 || !ready) return;
                        event.preventDefault();
                        choose(item);
                        gesture.current = {
                          pointer: event.pointerId,
                          item,
                          x: event.clientX,
                          y: event.clientY,
                          moved: false,
                        };
                        // Capture on the persistent surface before the outgoing sheet unmounts.
                        host.current?.setPointerCapture(event.pointerId);
                      }}
                      onClick={(event) => {
                        if (event.detail === 0) choose(item);
                      }}
                      aria-label={`Pick ${LABELS[item]}`}
                    >
                      <img src={thumbnails[item]} alt="" />
                      <span className="sr-only">Pick up</span>
                    </button>
                    <button disabled={!available(item) || finished} onClick={() => choose(item)}>
                      <span>
                        {LABELS[item]}
                        <small>
                          {available(item) ? "Available" : "Installed"} ·{" "}
                          {stemItems.has(item) ? "Stem" : "Movement"}
                        </small>
                      </span>
                    </button>
                  </div>
                ))}
                {!ITEMS.some(
                  (item) =>
                    matchesPart(normalizeSearch(LABELS[item]), query) &&
                    (group === "all" || stemItems.has(item) === (group === "stem")),
                ) && <p>No matching parts.</p>}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </main>
  );
}

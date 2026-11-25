"use client";

import "@glowhop/styles-tour/default.css";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  GlowTourAdvanceTrigger,
  GlowTourCancelTrigger,
  GlowTourContent,
  GlowTourFooter,
  GlowTourHeader,
  GlowTourOverlay,
  GlowTourPointer,
  GlowTourPopover,
  GlowTourPreviousTrigger,
  GlowTourRoot,
  useGlowTour,
} from "@glowhop/react-tour";
import type { TourId, TourStepDef } from "@/lib/tour/types";
import { useTourStore } from "@/store/use-tour-store";
import { findFirstVisibleTarget } from "./target-resolver";
import { getTourSteps } from "./tour-registry";

type Placement = NonNullable<TourStepDef["placement"]>;

const DEFAULT_PLACEMENT_ORDER: readonly Placement[] = [
  "bottom",
  "top",
  "right",
  "left",
];

function buildPlacementOrder(preferred?: Placement): readonly Placement[] {
  if (!preferred) return DEFAULT_PLACEMENT_ORDER;
  return [
    preferred,
    ...DEFAULT_PLACEMENT_ORDER.filter((dir) => dir !== preferred),
  ];
}

function resolveHtmlTarget(selector: string): HTMLElement | null {
  const el = findFirstVisibleTarget(selector);
  if (!el) return null;
  if (el instanceof HTMLElement) return el;
  return el.parentElement;
}

export interface TourEngineContextValue {
  startTour: (id: TourId, overrideSteps?: TourStepDef[]) => boolean;
  cancelTour: () => void;
  getStepsForTour: (id: TourId) => TourStepDef[];
  activeTourId: TourId | null;
  isTourActive: boolean;
}

const TourEngineContext = createContext<TourEngineContextValue | null>(null);

export function useTourEngine(): TourEngineContextValue {
  const ctx = useContext(TourEngineContext);
  if (!ctx) {
    throw new Error("useTourEngine must be used within a <TourProvider>.");
  }
  return ctx;
}

export interface TourProviderProps {
  children: ReactNode;
  /** Optional tour definitions map (overrides or supplements registered TOUR_DEFS). */
  defs?: Partial<Record<TourId, TourStepDef[]>>;
}

export function TourProvider({ children, defs }: TourProviderProps) {
  const pathname = usePathname();
  const markSeen = useTourStore((state) => state.markSeen);

  const [activeTourId, setActiveTourId] = useState<TourId | null>(null);
  const activeTourIdRef = useRef<TourId | null>(null);
  const suppressMarkSeenOnCancelRef = useRef(false);
  const lastPathnameRef = useRef(pathname);

  const { tour, create, start, cancel, status, currentStepIndex, totalSteps } =
    useGlowTour({
      onEvent: (event) => {
        if (event.type === "tour:error") {
          activeTourIdRef.current = null;
          setActiveTourId(null);
        }
      },
    });

  const isTourActive =
    status === "starting" || status === "transitioning" || status === "active";

  const getStepsForTour = useCallback(
    (id: TourId): TourStepDef[] => {
      if (defs && Array.isArray(defs[id])) {
        return defs[id];
      }
      return getTourSteps(id);
    },
    [defs],
  );

  // Cancel any running tour cleanly when navigating to a different route
  // (one tour = one page; do not mark seen on accidental navigation).
  useEffect(() => {
    if (lastPathnameRef.current !== pathname) {
      lastPathnameRef.current = pathname;
      if (activeTourIdRef.current !== null) {
        suppressMarkSeenOnCancelRef.current = true;
        activeTourIdRef.current = null;
        setActiveTourId(null);
        void cancel();
      }
    }
  }, [pathname, cancel]);

  const cancelTour = useCallback(() => {
    if (activeTourIdRef.current !== null) {
      void cancel();
    }
  }, [cancel]);

  const startTour = useCallback(
    (id: TourId, overrideSteps?: TourStepDef[]): boolean => {
      const rawSteps = overrideSteps ?? getStepsForTour(id);
      if (!rawSteps.length) return false;

      // Filter to steps that currently have a visible target in the DOM.
      // If all steps are skipped, do not start the tour and do not mark seen.
      const visibleSteps = rawSteps.filter(
        (step) => resolveHtmlTarget(step.target) !== null,
      );
      if (visibleSteps.length === 0) {
        return false;
      }

      // If another tour is already running, cancel it without marking it seen.
      if (activeTourIdRef.current !== null) {
        suppressMarkSeenOnCancelRef.current = true;
        void cancel();
      }

      const builder = create(`caloria-tour-${id}`, {
        overlay: {
          opacity: 0.45,
          padding: 8,
          radius: 16,
        },
        popover: {
          gap: 14,
          arrow: {
            size: 10,
            borderWidth: 1,
          },
        },
        behavior: {
          allowScroll: true,
          autoScroll: true,
          autoFocus: true,
          overlayClick: "none",
          missingTarget: {
            strategy: "skip",
          },
        },
        onFinish: () => {
          markSeen(id);
          activeTourIdRef.current = null;
          setActiveTourId(null);
        },
        onCancel: () => {
          if (!suppressMarkSeenOnCancelRef.current) {
            markSeen(id);
          }
          suppressMarkSeenOnCancelRef.current = false;
          activeTourIdRef.current = null;
          setActiveTourId(null);
        },
      });

      for (const step of visibleSteps) {
        builder.step({
          id: step.id,
          target: () => resolveHtmlTarget(step.target),
          title: step.title,
          content: step.content,
          popover: step.placement
            ? {
                placementTryOrder: buildPlacementOrder(step.placement),
              }
            : undefined,
        });
      }

      const workflow = builder.build();
      activeTourIdRef.current = id;
      setActiveTourId(id);
      suppressMarkSeenOnCancelRef.current = false;

      void start(workflow).catch(() => {
        activeTourIdRef.current = null;
        setActiveTourId(null);
      });

      return true;
    },
    [cancel, create, getStepsForTour, markSeen, start],
  );

  const contextValue = useMemo<TourEngineContextValue>(
    () => ({
      startTour,
      cancelTour,
      getStepsForTour,
      activeTourId,
      isTourActive,
    }),
    [activeTourId, cancelTour, getStepsForTour, isTourActive, startTour],
  );

  const showProgress = totalSteps > 0 && currentStepIndex >= 0;
  const progressPercent = showProgress
    ? ((currentStepIndex + 1) / totalSteps) * 100
    : 0;

  return (
    <TourEngineContext.Provider value={contextValue}>
      {children}
      <GlowTourRoot tour={tour} idPrefix="caloria-tour">
        <GlowTourOverlay />
        <GlowTourPointer />
        <GlowTourPopover>
          {showProgress && (
            <div
              className="caloria-tour-progress flex flex-col gap-1.5"
              aria-live="off"
            >
              <span className="text-[11px] font-medium tabular-nums leading-none text-text-muted">
                {currentStepIndex + 1} / {totalSteps}
              </span>
              <div className="h-1 w-full overflow-hidden rounded-full bg-border-divider">
                <div
                  className="h-full rounded-full bg-accent-green transition-[width] duration-200 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
          <GlowTourHeader />
          <GlowTourContent />
          <GlowTourFooter>
            <GlowTourCancelTrigger cancelLabel="Lewati" />
            <GlowTourPreviousTrigger previousLabel="Kembali" />
            <GlowTourAdvanceTrigger
              advanceLabel="Lanjut"
              finishLabel="Selesai"
            />
          </GlowTourFooter>
        </GlowTourPopover>
      </GlowTourRoot>
    </TourEngineContext.Provider>
  );
}

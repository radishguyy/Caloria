import type { TourStepDef } from "@/lib/tour/types";

export interface ResolvedTourStep {
  step: TourStepDef;
  element: Element;
  /** Temporary attribute selector bound to the exact visible element */
  resolvedSelector: string;
}

export interface ResolvedTourStepsResult {
  resolved: ResolvedTourStep[];
  cleanup: () => void;
}

/**
 * Checks whether a DOM element is actually visible in the viewport layout.
 * Works reliably for `position: fixed` (e.g. BottomNav) and `sticky` (Navbar)
 * as well as Tailwind responsive classes (`hidden lg:flex`, `lg:hidden`).
 */
export function isElementVisible(el: Element): boolean {
  if (typeof window === "undefined") return false;
  if (!el.isConnected) return false;

  if (
    "checkVisibility" in el &&
    typeof (el as HTMLElement).checkVisibility === "function"
  ) {
    const visible = (el as HTMLElement).checkVisibility({
      checkOpacity: true,
      checkVisibilityCSS: true,
    });
    if (!visible) return false;
  } else {
    const style = window.getComputedStyle(el);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      Number.parseFloat(style.opacity) === 0
    ) {
      return false;
    }
  }

  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

/**
 * Finds the first visible DOM element matching `selector`.
 * Returns `null` if none are found, none are visible, or the selector is invalid.
 */
export function findFirstVisibleTarget(selector: string): Element | null {
  if (typeof document === "undefined" || !selector.trim()) return null;

  try {
    const matches = document.querySelectorAll(selector);
    for (const el of matches) {
      if (isElementVisible(el)) {
        return el;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Resolves a list of tour step definitions against the current DOM:
 * - Picks the first visible element when a selector matches multiple nodes
 *   (e.g. desktop Navbar + mobile BottomNav both present in DOM).
 * - Skips steps whose target is missing or hidden, without throwing.
 * - Tags each resolved element with a temporary `data-tour-active-<idx>`
 *   attribute so GlowTour always highlights the exact visible element.
 *   Call `cleanup()` when the tour finishes, is skipped, or unmounts.
 */
export function resolveTourSteps(
  steps: TourStepDef[],
): ResolvedTourStepsResult {
  const resolved: ResolvedTourStep[] = [];
  const tagged: Array<{ el: Element; attr: string }> = [];

  steps.forEach((step, index) => {
    const el = findFirstVisibleTarget(step.target);
    if (!el) return;

    const attr = `data-tour-active-${index}`;
    el.setAttribute(attr, "true");
    tagged.push({ el, attr });

    resolved.push({
      step,
      element: el,
      resolvedSelector: `[${attr}="true"]`,
    });
  });

  const cleanup = () => {
    for (const { el, attr } of tagged) {
      el.removeAttribute(attr);
    }
    tagged.length = 0;
  };

  return { resolved, cleanup };
}

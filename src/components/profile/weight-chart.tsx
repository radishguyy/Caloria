"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  ProfileWeightLog,
  formatDayMonth,
  formatLogDate,
  formatWeightValue,
  getWeekNumber,
} from "@/lib/dummy/profile-overview";

interface WeightChartProps {
  logs: ProfileWeightLog[];
  targetWeightKg: number;
  programStartDate: string;
  className?: string;
}

const CHART_HEIGHT = 200;
const MARGIN = { top: 14, right: 14, bottom: 28, left: 44 };

function niceStep(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  const power = Math.pow(10, Math.floor(Math.log10(raw)));
  const normalized = raw / power;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * power;
}

export function WeightChart({
  logs,
  targetWeightKg,
  programStartDate,
  className,
}: WeightChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const update = () => setWidth(node.clientWidth);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (logs.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-xs text-text-muted">
        Belum ada data timbangan.
      </div>
    );
  }

  const weights = logs.map((log) => log.weightKg);
  const rawMin = Math.min(targetWeightKg, ...weights);
  const rawMax = Math.max(...weights);
  const pad = Math.max(0.8, (rawMax - rawMin) * 0.12);
  const step = niceStep((rawMax - rawMin + pad * 2) / 4);
  const yMin = Math.floor((rawMin - pad) / step) * step;
  const yMax = Math.ceil((rawMax + pad) / step) * step;

  const ticks: number[] = [];
  for (let value = yMin; value <= yMax + 1e-9; value += step) {
    ticks.push(Math.round(value * 10) / 10);
  }

  const plotWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const plotHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;
  const domain = Math.max(1e-6, yMax - yMin);

  const xFor = (index: number) =>
    logs.length === 1
      ? MARGIN.left + plotWidth / 2
      : MARGIN.left + (index / (logs.length - 1)) * plotWidth;

  const yFor = (value: number) =>
    MARGIN.top + plotHeight * (1 - (value - yMin) / domain);

  const linePoints = logs
    .map((log, index) => `${xFor(index)},${yFor(log.weightKg)}`)
    .join(" ");

  const labelStride = logs.length <= 6 ? 1 : Math.ceil(logs.length / 5);
  const activeLog = activeIndex === null ? null : logs[activeIndex];
  const activeX = activeIndex === null ? 0 : xFor(activeIndex);
  const activeY = activeLog ? yFor(activeLog.weightKg) : 0;

  return (
    <div ref={containerRef} className={cn("w-full", className)}>
      <div className="mb-2 flex items-center gap-4 text-[11px] font-medium text-neutral-10">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-sm bg-accent-orange" aria-hidden="true" />
          Aktual
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-0 w-4 border-t-2 border-dashed border-accent-green"
            aria-hidden="true"
          />
          Target
        </span>
      </div>

      <div className="relative">
        {width > 0 && (
          <svg
            width={width}
            height={CHART_HEIGHT}
            viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
            role="img"
            aria-label={`Grafik berat badan menuju target ${targetWeightKg} kg`}
            className="overflow-visible"
          >
            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={MARGIN.left}
                  x2={width - MARGIN.right}
                  y1={yFor(tick)}
                  y2={yFor(tick)}
                  stroke="var(--color-border-divider)"
                  strokeWidth="1"
                  opacity="0.7"
                />
                <text
                  x={MARGIN.left - 8}
                  y={yFor(tick) + 3.5}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--color-text-muted)"
                >
                  {formatWeightValue(tick)}
                </text>
              </g>
            ))}

            <line
              x1={MARGIN.left}
              x2={width - MARGIN.right}
              y1={yFor(targetWeightKg)}
              y2={yFor(targetWeightKg)}
              stroke="var(--color-accent-green)"
              strokeWidth="1.5"
              strokeDasharray="5 4"
            />
            <text
              x={width - MARGIN.right}
              y={Math.max(11, yFor(targetWeightKg) - 6)}
              textAnchor="end"
              fontSize="10"
              fontWeight="700"
              fill="var(--color-text-primary)"
            >
              Target {formatWeightValue(targetWeightKg)} kg
            </text>

            <polyline
              points={linePoints}
              fill="none"
              stroke="var(--color-accent-orange)"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {logs.map((log, index) => (
              <g
                key={log.id}
                tabIndex={0}
                role="img"
                aria-label={`Minggu ${getWeekNumber(programStartDate, log.date)} - ${formatWeightValue(log.weightKg)} kg`}
                className="cursor-pointer outline-none"
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onFocus={() => setActiveIndex(index)}
                onBlur={() => setActiveIndex(null)}
                onClick={() => setActiveIndex(index)}
              >
                <circle cx={xFor(index)} cy={yFor(log.weightKg)} r="11" fill="transparent" />
                <circle
                  cx={xFor(index)}
                  cy={yFor(log.weightKg)}
                  r="3.5"
                  fill="var(--color-accent-orange)"
                  stroke="var(--color-surface)"
                  strokeWidth="2"
                />
              </g>
            ))}

            {logs.map((log, index) => {
              const isLast = index === logs.length - 1;
              if (!isLast && index % labelStride !== 0) return null;
              if (!isLast) {
                const gapToLast =
                  (logs.length - 1 - index) *
                  (logs.length > 1 ? plotWidth / (logs.length - 1) : plotWidth);
                if (gapToLast < 42) return null;
              }

              const anchor = index === 0 ? "start" : isLast ? "end" : "middle";

              return (
                <text
                  key={`label-${log.id}`}
                  x={xFor(index)}
                  y={CHART_HEIGHT - 8}
                  textAnchor={anchor}
                  fontSize="10"
                  fill="var(--color-text-muted)"
                >
                  {formatDayMonth(log.date)}
                </text>
              );
            })}
          </svg>
        )}

        {activeLog && width > 0 && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-text-primary px-2 py-1 text-[10px] font-semibold text-text-inverse shadow-md"
            style={{
              left: Math.min(Math.max(activeX, 78), width - 78),
              top: Math.max(activeY - 10, 16),
            }}
          >
            Minggu {getWeekNumber(programStartDate, activeLog.date)} -{" "}
            {formatWeightValue(activeLog.weightKg)} kg - {formatLogDate(activeLog.date)}
          </div>
        )}
      </div>
    </div>
  );
}

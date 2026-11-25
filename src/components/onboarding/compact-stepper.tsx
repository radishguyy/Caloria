"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";

export interface CompactStepperProps {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  subLabel?: string;
  disabled?: boolean;
  onChange: (val: number) => void;
}

export function CompactStepper({
  label,
  unit,
  value,
  min,
  max,
  step = 1,
  subLabel,
  disabled = false,
  onChange,
}: CompactStepperProps) {
  const [textValue, setTextValue] = useState<string>(String(value));
  const [isFocused, setIsFocused] = useState(false);

  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopStepping = () => {
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }
    if (stepIntervalRef.current) {
      clearInterval(stepIntervalRef.current);
      stepIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopStepping();
  }, []);

  const applyDelta = (delta: number) => {
    if (disabled) return;
    const rawNext = valueRef.current + delta;
    const rounded =
      step === 1 ? Math.round(rawNext) : Math.round(rawNext * 10) / 10;
    const clamped = Math.min(max, Math.max(min, rounded));
    valueRef.current = clamped;
    onChange(clamped);
  };

  const startStepping = (delta: number) => {
    if (disabled) return;
    stopStepping();
    applyDelta(delta);
    stepTimerRef.current = setTimeout(() => {
      stepIntervalRef.current = setInterval(() => {
        applyDelta(delta);
      }, 90);
    }, 350);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    delta: number,
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      applyDelta(delta);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const raw = e.target.value;
    if (raw === "" || /^[0-9]*\.?[0-9]*$/.test(raw)) {
      setTextValue(raw);
      const parsed = parseFloat(raw);
      if (!isNaN(parsed)) {
        const clamped = Math.min(max, Math.max(min, parsed));
        valueRef.current = clamped;
        onChange(clamped);
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseFloat(textValue);
    if (isNaN(parsed) || parsed < min) {
      valueRef.current = min;
      onChange(min);
      setTextValue(String(min));
    } else if (parsed > max) {
      valueRef.current = max;
      onChange(max);
      setTextValue(String(max));
    } else {
      const rounded =
        step === 1 ? Math.round(parsed) : Math.round(parsed * 10) / 10;
      valueRef.current = rounded;
      onChange(rounded);
      setTextValue(String(rounded));
    }
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle border border-border-divider gap-2">
      <div className="min-w-0">
        <span className="text-xs sm:text-sm font-bold text-text-primary block">
          {label}
        </span>
        {subLabel && (
          <span className="text-[11px] text-text-muted block">{subLabel}</span>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            startStepping(-step);
          }}
          onPointerUp={stopStepping}
          onPointerLeave={stopStepping}
          onPointerCancel={stopStepping}
          onKeyDown={(e) => handleKeyDown(e, -step)}
          disabled={disabled || value <= min}
          aria-label={`Kurangi ${label}`}
          className="w-8 h-8 rounded-full border border-border-default bg-surface hover:bg-surface-subtle text-text-primary hover:border-accent-green flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer select-none"
        >
          <Minus className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
        </button>

        <div className="h-8 px-2 rounded-full border border-border-default bg-surface flex items-center justify-center gap-1 focus-within:border-accent-green focus-within:ring-2 focus-within:ring-accent-green/20">
          <input
            type="text"
            inputMode="decimal"
            disabled={disabled}
            aria-label={`${label} dalam ${unit}`}
            value={isFocused ? textValue : String(value)}
            onFocus={() => {
              setIsFocused(true);
              setTextValue(String(value));
            }}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className="w-9 sm:w-10 text-center text-sm font-extrabold text-text-primary bg-transparent outline-none tabular-nums disabled:opacity-60"
          />
          <span className="text-[11px] font-semibold text-text-muted select-none">
            {unit}
          </span>
        </div>

        <button
          type="button"
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            startStepping(step);
          }}
          onPointerUp={stopStepping}
          onPointerLeave={stopStepping}
          onPointerCancel={stopStepping}
          onKeyDown={(e) => handleKeyDown(e, step)}
          disabled={disabled || value >= max}
          aria-label={`Tambah ${label}`}
          className="w-8 h-8 rounded-full border border-border-default bg-surface hover:bg-surface-subtle text-text-primary hover:border-accent-green flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer select-none"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

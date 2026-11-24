/**
 * Caloria Date Utilities
 * Pure functions for calendar rendering, date navigation, and day formatting.
 * Designed with zero external dependencies to keep the bundle lightweight.
 */

export interface CalendarDayCell {
  date: Date;
  dateKey: string; // "YYYY-MM-DD"
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
  dayOfWeek: number; // 0 = Mon, 6 = Sun
}

export interface CalendarWeekDay {
  date: Date;
  dateKey: string;
  dayNumber: number;
  dayOfWeek: number; // 0 = Mon, 6 = Sun
  dayShortName: string; // "Sen", "Sel", etc.
  dayFullName: string;
  isToday: boolean;
  isFuture: boolean;
}

export const INDONESIAN_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

export const INDONESIAN_MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

export const INDONESIAN_DAYS_SHORT = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"] as const;

export const INDONESIAN_DAYS_FULL = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
] as const;

/**
 * Formats a Date object to "YYYY-MM-DD" in local time.
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parses a "YYYY-MM-DD" string into a local Date object.
 */
export function parseDateKey(dateKey: string): Date {
  const parts = dateKey.split("-");
  if (parts.length !== 3) {
    return new Date();
  }
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day);
}

/**
 * Gets today's date key string in "YYYY-MM-DD" format.
 */
export function getTodayKey(): string {
  return formatDateKey(new Date());
}

/**
 * Checks if two dates/dateKeys are on the same calendar day.
 */
export function isSameDay(
  d1: Date | string,
  d2: Date | string
): boolean {
  const k1 = typeof d1 === "string" ? d1 : formatDateKey(d1);
  const k2 = typeof d2 === "string" ? d2 : formatDateKey(d2);
  return k1 === k2;
}

/**
 * Checks if a given date or dateKey is today.
 */
export function isToday(date: Date | string): boolean {
  return isSameDay(date, new Date());
}

/**
 * Checks if a date or dateKey is strictly in the future compared to today.
 */
export function isFuture(date: Date | string): boolean {
  const key = typeof date === "string" ? date : formatDateKey(date);
  const todayKey = getTodayKey();
  return key > todayKey;
}

/**
 * Checks if a date or dateKey is in the past compared to today.
 */
export function isPast(date: Date | string): boolean {
  const key = typeof date === "string" ? date : formatDateKey(date);
  const todayKey = getTodayKey();
  return key < todayKey;
}

/**
 * Adds days to a date without mutating original date.
 */
export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/**
 * Subtracts days from a date.
 */
export function subDays(date: Date, days: number): Date {
  return addDays(date, -days);
}

/**
 * Adds months to a date without mutating original date.
 */
export function addMonths(date: Date, months: number): Date {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

/**
 * Subtracts months from a date.
 */
export function subMonths(date: Date, months: number): Date {
  return addMonths(date, -months);
}

/**
 * Returns Monday-first day of week index (0 = Monday, 6 = Sunday).
 */
export function getMondayFirstDayOfWeek(date: Date): number {
  const jsDay = date.getDay(); // 0 = Sunday, 1 = Monday
  return (jsDay + 6) % 7;
}

/**
 * Generates all day cells for a calendar month (Monday start).
 * Pads with trailing days from the previous month and leading days from the next month.
 * Returns either 35 or 42 cells to ensure a complete rectangular grid.
 *
 * @param year full year (e.g. 2026)
 * @param month 0-indexed month (0 = January, 11 = December)
 */
export function getDaysInMonth(year: number, month: number): CalendarDayCell[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInCurrentMonth = lastDayOfMonth.getDate();

  const startDayOfWeek = getMondayFirstDayOfWeek(firstDayOfMonth); // 0 (Mon) to 6 (Sun)

  const cells: CalendarDayCell[] = [];

  // 1. Previous month trailing days
  if (startDayOfWeek > 0) {
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const cellDate = new Date(year, month - 1, dayNum);
      const key = formatDateKey(cellDate);
      cells.push({
        date: cellDate,
        dateKey: key,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: isToday(key),
        isFuture: isFuture(key),
        dayOfWeek: getMondayFirstDayOfWeek(cellDate),
      });
    }
  }

  // 2. Current month days
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const cellDate = new Date(year, month, day);
    const key = formatDateKey(cellDate);
    cells.push({
      date: cellDate,
      dateKey: key,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: isToday(key),
      isFuture: isFuture(key),
      dayOfWeek: getMondayFirstDayOfWeek(cellDate),
    });
  }

  // 3. Next month leading days to complete full rows (total % 7 === 0)
  const remainingCells = (7 - (cells.length % 7)) % 7;
  // If only 35 days and month needs 42 for balance, or just pad to nearest row of 7
  const targetTotal = cells.length + remainingCells < 35 ? 35 : cells.length + remainingCells;
  const needToAdd = targetTotal - cells.length;

  for (let day = 1; day <= needToAdd; day++) {
    const cellDate = new Date(year, month + 1, day);
    const key = formatDateKey(cellDate);
    cells.push({
      date: cellDate,
      dateKey: key,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: isToday(key),
      isFuture: isFuture(key),
      dayOfWeek: getMondayFirstDayOfWeek(cellDate),
    });
  }

  return cells;
}

/**
 * Returns Monday-to-Sunday days of the week containing the specified baseDate.
 */
export function getWeekDays(baseDate: Date): CalendarWeekDay[] {
  const dayOfWeek = getMondayFirstDayOfWeek(baseDate);
  // Monday is baseDate - dayOfWeek
  const monday = addDays(baseDate, -dayOfWeek);

  const week: CalendarWeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = addDays(monday, i);
    const key = formatDateKey(dayDate);
    week.push({
      date: dayDate,
      dateKey: key,
      dayNumber: dayDate.getDate(),
      dayOfWeek: i,
      dayShortName: INDONESIAN_DAYS_SHORT[i],
      dayFullName: INDONESIAN_DAYS_FULL[i],
      isToday: isToday(key),
      isFuture: isFuture(key),
    });
  }

  return week;
}

/**
 * Formats a date string "YYYY-MM-DD" or Date object into human-readable Indonesian text.
 */
export function formatDateDisplay(
  date: Date | string,
  format: "short" | "full" | "monthYear" | "dayDate" = "full"
): string {
  const d = typeof date === "string" ? parseDateKey(date) : date;
  const dayOfWeek = getMondayFirstDayOfWeek(d);
  const dayName = INDONESIAN_DAYS_FULL[dayOfWeek];
  const dayNumber = d.getDate();
  const monthName = INDONESIAN_MONTHS[d.getMonth()];
  const monthShort = INDONESIAN_MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();

  switch (format) {
    case "short":
      return `${dayNumber} ${monthShort}`;
    case "dayDate":
      return `${dayName}, ${dayNumber} ${monthShort}`;
    case "monthYear":
      return `${monthName} ${year}`;
    case "full":
    default:
      return `${dayName}, ${dayNumber} ${monthName} ${year}`;
  }
}


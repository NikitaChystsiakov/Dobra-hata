import { fromISODate, toISODate } from "./pricing.ts";

export function addDays(iso: string, n: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

/** Ближайшая свободная суббота не раньше, чем через 2 дня */
export function defaultDate(todayISO: string, busy: ReadonlySet<string> = new Set()): string {
  let iso = addDays(todayISO, 2);
  while (fromISODate(iso).getDay() !== 6 || busy.has(iso)) iso = addDays(iso, 1);
  return iso;
}

const DOW_SHORT = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
export const MONTHS_GEN = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

/** «сб, 3 октября 2026» */
export function dateLabel(iso: string): string {
  const d = fromISODate(iso);
  return `${DOW_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}`;
}

/** «сб, 3 октября» */
export function dateShort(iso: string): string {
  const d = fromISODate(iso);
  return `${DOW_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
}

/** Разница в днях: end − start */
export function daysBetween(startISO: string, endISO: string): number {
  return Math.round((fromISODate(endISO).getTime() - fromISODate(startISO).getTime()) / 86_400_000);
}

/** «1 сутки», «2 суток» — для формата с ночёвкой; «1 день», «2 дня» — для дневных */
export function daysWord(n: number, overnight: boolean): string {
  const m10 = n % 10;
  const m100 = n % 100;
  const form = m10 === 1 && m100 !== 11 ? 0 : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 1 : 2;
  const w = overnight ? ["сутки", "суток", "суток"] : ["день", "дня", "дней"];
  return `${n} ${w[form]}`;
}

/** «сб, 3 — вс, 4 октября» · «чт, 31 декабря — пт, 1 января» · один день — как dateShort */
export function rangeShort(startISO: string, endISO: string): string {
  if (startISO === endISO) return dateShort(startISO);
  const a = fromISODate(startISO);
  const b = fromISODate(endISO);
  const left = a.getMonth() === b.getMonth() ? `${DOW_SHORT[a.getDay()]}, ${a.getDate()}` : dateShort(startISO);
  return `${left} — ${dateShort(endISO)}`;
}

/** «3–4 октября» · «31 декабря — 1 января» — для кнопок */
export function rangeCompact(startISO: string, endISO: string): string {
  const a = fromISODate(startISO);
  const b = fromISODate(endISO);
  if (startISO === endISO) return `${a.getDate()} ${MONTHS_GEN[a.getMonth()]}`;
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${b.getDate()} ${MONTHS_GEN[a.getMonth()]}`;
  return `${a.getDate()} ${MONTHS_GEN[a.getMonth()]} — ${b.getDate()} ${MONTHS_GEN[b.getMonth()]}`;
}

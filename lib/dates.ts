import { fromISODate, toISODate } from "./pricing.ts";

export function addDays(iso: string, n: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

/** Ближайшая суббота не раньше, чем через 2 дня */
export function defaultDate(todayISO: string): string {
  let iso = addDays(todayISO, 2);
  while (fromISODate(iso).getDay() !== 6) iso = addDays(iso, 1);
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

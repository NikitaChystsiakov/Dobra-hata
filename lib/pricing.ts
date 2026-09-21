import {
  BATH,
  DAY_MINIMUM,
  DEPOSIT,
  FORMATS,
  HOLIDAYS_BY_YEAR,
  HOLIDAYS_FIXED,
  NEW_YEAR_DATES,
  WEEKEND_DAYS,
  type DayType,
  type FormatId,
  type RentalFormat,
} from "./pricing.config.ts";

/** «YYYY-MM-DD» в локальном времени, без сдвигов часовых поясов */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function isHoliday(iso: string): boolean {
  const mmdd = iso.slice(5);
  if (HOLIDAYS_FIXED.includes(mmdd)) return true;
  const year = Number(iso.slice(0, 4));
  return (HOLIDAYS_BY_YEAR[year] ?? []).includes(iso);
}

export function isNewYearTariff(iso: string): boolean {
  return NEW_YEAR_DATES.includes(iso.slice(5));
}

export function getDayType(iso: string): DayType {
  if (isHoliday(iso)) return "holiday";
  const dow = fromISODate(iso).getDay();
  return WEEKEND_DAYS.includes(dow) ? "weekend" : "weekday";
}

export function getFormat(id: FormatId): RentalFormat {
  const f = FORMATS.find((x) => x.id === id);
  if (!f) throw new Error(`Unknown format ${id}`);
  return f;
}

export function rentFor(format: RentalFormat, dayType: DayType, guests: number): number {
  return Math.max(DAY_MINIMUM[dayType], format.perGuest * guests);
}

export function bathFor(guests: number): number {
  return Math.max(BATH.minimum, BATH.perGuest * guests);
}

/** С какого числа гостей расчёт по головам обгоняет минимум */
export function rentThreshold(format: RentalFormat, dayType: DayType): number {
  return Math.ceil(DAY_MINIMUM[dayType] / format.perGuest) + (DAY_MINIMUM[dayType] % format.perGuest === 0 ? 1 : 0);
}

export function bathThreshold(): number {
  return Math.ceil(BATH.minimum / BATH.perGuest) + (BATH.minimum % BATH.perGuest === 0 ? 1 : 0);
}

export interface Quote {
  format: RentalFormat;
  dayType: DayType;
  guests: number;
  bath: boolean;
  rent: number;
  /** Платим по головам (true) или упёрлись в минимум (false) */
  rentByHeads: boolean;
  bathCost: number;
  bathByHeads: boolean;
  total: number;
  deposit: number;
  newYear: boolean;
}

export function quote(formatId: FormatId, dateISO: string, guests: number, bath: boolean): Quote {
  const format = getFormat(formatId);
  const dayType = getDayType(dateISO);
  const byHeads = format.perGuest * guests;
  const rent = Math.max(DAY_MINIMUM[dayType], byHeads);
  const bathCost = bath ? bathFor(guests) : 0;
  return {
    format,
    dayType,
    guests,
    bath,
    rent,
    rentByHeads: byHeads > DAY_MINIMUM[dayType],
    bathCost,
    bathByHeads: bath && BATH.perGuest * guests > BATH.minimum,
    total: rent + bathCost,
    deposit: DEPOSIT,
    newYear: isNewYearTariff(dateISO),
  };
}

export function formatRub(n: number): string {
  // 9000 → «9 000»
  return n.toLocaleString("ru-RU").replace(/ /g, " ");
}

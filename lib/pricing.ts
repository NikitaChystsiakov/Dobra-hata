import {
  BATH,
  DAY_MINIMUM,
  DEPOSIT,
  FORMATS,
  HOLIDAYS_BY_YEAR,
  HOLIDAYS_FIXED,
  GUESTS,
  LAST_MINUTE,
  LOW_SEASON,
  NEW_YEAR,
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

export function isNewYearDate(iso: string): boolean {
  return NEW_YEAR_DATES.includes(iso.slice(5));
}

/** Даты заезда: `days` дней подряд начиная с `startISO` */
export function stayDates(startISO: string, days: number): string[] {
  const d = fromISODate(startISO);
  return Array.from({ length: Math.max(1, days) }, (_, i) => {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
    return toISODate(x);
  });
}

/** Новогодний тариф действует на весь заезд, если в него попала хотя бы одна новогодняя дата */
export function isNewYearStay(dates: readonly string[]): boolean {
  return dates.some(isNewYearDate);
}

/** 7 000 за двое суток, третьи +2 500, каждые следующие +1 600 */
export function newYearRent(days: number): number {
  const n = Math.max(NEW_YEAR.minDays, days);
  let sum = NEW_YEAR.twoDays;
  if (n >= 3) sum += NEW_YEAR.thirdDay;
  if (n > 3) sum += (n - 3) * NEW_YEAR.extraDay;
  return sum;
}

/** Межсезонье (1 ноября — 15 апреля): вместимость меньше */
export function isLowSeason(iso: string): boolean {
  const mmdd = iso.slice(5);
  return mmdd >= LOW_SEASON.from || mmdd <= LOW_SEASON.to;
}

/** Сколько гостей можно на эти даты: если хоть один день в межсезонье — его лимит */
export function maxGuestsFor(dates: readonly string[]): number {
  return dates.some(isLowSeason) ? LOW_SEASON.maxGuests : GUESTS.max;
}

/** Через сколько дней от сегодня заезд */
function daysFrom(todayISO: string, iso: string): number {
  return Math.round((fromISODate(iso).getTime() - fromISODate(todayISO).getTime()) / 86_400_000);
}

/** Заезд завтра или послезавтра — скидка */
export function isLastMinute(todayISO: string, startISO: string): boolean {
  return (LAST_MINUTE.daysAhead as readonly number[]).includes(daysFrom(todayISO, startISO));
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

/** Аренда за несколько дней: каждый день по своему типу */
export function stayRent(format: RentalFormat, dates: readonly string[], guests: number): number {
  return dates.reduce((sum, iso) => sum + rentFor(format, getDayType(iso), guests), 0);
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

export interface DayQuote {
  date: string;
  dayType: DayType;
  rent: number;
  /** Платим по головам (true) или упёрлись в минимум (false) */
  byHeads: boolean;
}

export interface Quote {
  format: RentalFormat;
  /** Тип первого дня заезда */
  dayType: DayType;
  guests: number;
  bath: boolean;
  /** Первый день заезда */
  start: string;
  /** Последний оплачиваемый день */
  end: string;
  days: number;
  dates: string[];
  perDay: DayQuote[];
  rent: number;
  /** Все дни считаются по головам */
  rentByHeads: boolean;
  bathCost: number;
  bathByHeads: boolean;
  /** Аренда + баня до скидки */
  subtotal: number;
  /** Скидка за бронь на завтра/послезавтра, руб. */
  discount: number;
  lastMinute: boolean;
  total: number;
  deposit: number;
  newYear: boolean;
  /** Выбрано меньше новогоднего минимума — считаем за минимум */
  newYearShort: boolean;
}

export function quote(
  formatId: FormatId,
  startISO: string,
  guests: number,
  bath: boolean,
  days = 1,
  /** Сегодня — для скидки «завтра/послезавтра». Не передан — скидки нет. */
  todayISO?: string,
): Quote {
  const dates = stayDates(startISO, days);
  const newYear = isNewYearStay(dates);
  // Несколько дней подряд и Новый год — только посуточно, с домом
  const format = getFormat(dates.length > 1 || newYear ? "a" : formatId);
  const perDay: DayQuote[] = dates.map((date) => {
    const dayType = getDayType(date);
    const byHeads = format.perGuest * guests;
    return { date, dayType, rent: Math.max(DAY_MINIMUM[dayType], byHeads), byHeads: byHeads > DAY_MINIMUM[dayType] };
  });
  const rent = newYear ? newYearRent(dates.length) : perDay.reduce((s, d) => s + d.rent, 0);
  const bathCost = bath ? bathFor(guests) : 0;
  const subtotal = rent + bathCost;
  const lastMinute = !!todayISO && !newYear && isLastMinute(todayISO, dates[0]);
  const discountBase = LAST_MINUTE.withBath ? subtotal : rent;
  const discount = lastMinute ? Math.round((discountBase * LAST_MINUTE.percent) / 100) : 0;
  return {
    format,
    dayType: perDay[0].dayType,
    guests,
    bath,
    start: dates[0],
    end: dates[dates.length - 1],
    days: dates.length,
    dates,
    perDay,
    rent,
    rentByHeads: !newYear && perDay.every((d) => d.byHeads),
    bathCost,
    bathByHeads: bath && BATH.perGuest * guests > BATH.minimum,
    subtotal,
    discount,
    lastMinute,
    total: subtotal - discount,
    deposit: DEPOSIT,
    newYear,
    newYearShort: newYear && dates.length < NEW_YEAR.minDays,
  };
}

export function formatRub(n: number): string {
  // 9000 → «9 000»
  return n.toLocaleString("ru-RU").replace(/ /g, " ");
}

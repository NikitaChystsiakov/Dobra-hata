/**
 * Все тарифы, минимумы, праздники и пороги — в одном месте.
 * С 1 мая 2027 г. у клиента меняются тарифы: правится только этот файл.
 */

export type FormatId = "a" | "b" | "c";

export interface RentalFormat {
  id: FormatId;
  letter: string;
  name: string;
  /** Ставка за человека, руб. */
  perGuest: number;
  checkIn: string;
  checkOut: string;
  /** Выселение на следующий день */
  overnight: boolean;
  /** Что входит: зоны плана */
  zones: readonly ZoneId[];
}

export type ZoneId =
  | "parking"
  | "court"
  | "kitchen"
  | "pagoda"
  | "garden"
  | "playground"
  | "pool"
  | "house"
  | "bath"
  | "ash";

export const FORMATS: readonly RentalFormat[] = [
  {
    id: "a",
    letter: "А",
    name: "Территория с домом на сутки",
    perGuest: 180,
    checkIn: "15:00",
    checkOut: "12:00",
    overnight: true,
    zones: ["parking", "court", "kitchen", "pagoda", "garden", "playground", "pool", "house", "ash"],
  },
  {
    id: "b",
    letter: "Б",
    name: "Территория с домом на день",
    perGuest: 140,
    checkIn: "15:00",
    checkOut: "24:00",
    overnight: false,
    zones: ["parking", "court", "kitchen", "pagoda", "garden", "playground", "pool", "house", "ash"],
  },
  {
    id: "c",
    letter: "В",
    name: "Территория на день",
    perGuest: 100,
    checkIn: "15:00",
    checkOut: "24:00",
    overnight: false,
    zones: ["parking", "court", "kitchen", "pagoda", "garden", "playground", "pool", "ash"],
  },
] as const;

/** Минимальная сумма за день, руб. */
export const DAY_MINIMUM = {
  weekday: 1100,
  weekend: 1800,
  holiday: 1800,
} as const;

export type DayType = keyof typeof DAY_MINIMUM;

/** Выходные: 0 = воскресенье … 6 = суббота. Пятница — выходной (подтверждено клиентом). */
export const WEEKEND_DAYS: readonly number[] = [5, 6];

export const BATH = {
  minimum: 450,
  perGuest: 45,
  hours: 3,
} as const;

export const DEPOSIT = 1600;

/** Дети до этого возраста гостями не считаются */
export const CHILD_FREE_UNDER = 5;

export const GUESTS = { min: 1, max: 100, default: 10 } as const;

/**
 * Межсезонье: с 1 ноября по 15 апреля включительно — не больше 25 гостей
 * (летние зоны закрыты). В остальное время — до GUESTS.max.
 * Даты в формате «MM-DD».
 */
export const LOW_SEASON = { from: "11-01", to: "04-15", maxGuests: 25 } as const;

/**
 * Скидка «в последний момент»: заезд завтра или послезавтра.
 * daysAhead — через сколько дней от сегодня заезд. На новогодний тариф не действует.
 */
export const LAST_MINUTE = { daysAhead: [1, 2], percent: 10, withBath: true } as const;

/** Пометки под расчётом */
export const EXTRA_NOTES: readonly string[] = [
  "Возможен ранний и/или поздний заезд за доплату.",
  "Возможна скидка нешумным компаниям и для семейного отдыха — уточняйте по телефону.",
];

/**
 * Государственные праздники Республики Беларусь.
 * Фиксированные — «MM-DD»; Радуница — по годам.
 */
export const HOLIDAYS_FIXED: readonly string[] = [
  "01-01",
  "01-07",
  "03-08",
  "05-01",
  "05-09",
  "07-03",
  "11-07",
  "12-25",
];

export const HOLIDAYS_BY_YEAR: Readonly<Record<number, readonly string[]>> = {
  2026: ["2026-04-21"],
  2027: ["2027-05-11"],
  2028: ["2028-04-25"],
};

/** Сколько дней подряд можно выбрать в календаре */
export const STAY_MAX_DAYS = 10;

/**
 * Новогодний тариф — если в заезд попадает хотя бы одна из этих дат («MM-DD»).
 * Считается за весь заезд целиком, от числа гостей не зависит (по прайсу).
 */
export const NEW_YEAR_DATES: readonly string[] = ["12-31", "01-01"];

export const NEW_YEAR = {
  /** Минимум суток */
  minDays: 2,
  /** За первые двое суток, руб. */
  twoDays: 7000,
  /** Третьи сутки, руб. */
  thirdDay: 2500,
  /** Каждые следующие сутки, руб. */
  extraDay: 1600,
} as const;

export const NEW_YEAR_NOTE =
  "Новогодние даты бронируются по телефону — подтвердим условия и наличие.";

/**
 * Демонстрация занятости: пока нет синхронизации с календарём,
 * несколько дат помечены занятыми, чтобы показать, как это будет выглядеть.
 * Смещения в днях от сегодняшнего.
 */
export const DEMO_BUSY_OFFSETS: readonly number[] = []; // занятость пока не показываем (по просьбе клиента)

export const CONTACTS = {
  phones: ["+375 (29) 857-67-68", "+375 (29) 643-67-68"],
  phoneHref: "tel:+375298576768",
  instagram: "https://www.instagram.com/dobrahata/",
  email: "dobra_hata@tut.by",
  address: "д. Прилепы, пер. Школьный, 1 · Смолевичский р-н, Минская обл.",
  gps: "54.075906, 27.83404",
} as const;

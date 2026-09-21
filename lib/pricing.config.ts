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
    name: "Сутки",
    perGuest: 180,
    checkIn: "15:00",
    checkOut: "12:00",
    overnight: true,
    zones: ["parking", "court", "kitchen", "pagoda", "garden", "playground", "pool", "house", "ash"],
  },
  {
    id: "b",
    letter: "Б",
    name: "День с коттеджем",
    perGuest: 140,
    checkIn: "15:00",
    checkOut: "24:00",
    overnight: false,
    zones: ["parking", "court", "kitchen", "pagoda", "garden", "playground", "pool", "house", "ash"],
  },
  {
    id: "c",
    letter: "В",
    name: "Только территория",
    perGuest: 100,
    checkIn: "15:00",
    checkOut: "23:00",
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

/** До какой даты действует этот прайс (с 1 мая 2027 у клиента другие тарифы) */
export const TARIFF_VALID_UNTIL = "2027-04-30";

/** Дети до этого возраста гостями не считаются */
export const CHILD_FREE_UNDER = 14;

export const GUESTS = { min: 1, max: 100, default: 10 } as const;

/** Вместимость — предупреждения, не запрет */
export const CAPACITY = {
  livingRoom: 25,
  terraceSummer: 70,
  buffet: 100,
} as const;

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

/** Новогодний тариф считается отдельно — на эти даты калькулятор показывает пометку */
export const NEW_YEAR_DATES: readonly string[] = ["12-31", "01-01", "01-02"];

export const NEW_YEAR_NOTE =
  "Новогодний тариф: 7 000 руб. за двое суток, третьи сутки +2 500, каждые следующие +1 600. Минимум двое суток. Уточняйте по телефону.";

/**
 * Демонстрация занятости: пока нет синхронизации с календарём,
 * несколько дат помечены занятыми, чтобы показать, как это будет выглядеть.
 * Смещения в днях от сегодняшнего.
 */
export const DEMO_BUSY_OFFSETS: readonly number[] = [3, 4, 11, 18, 19, 26];

export const CONTACTS = {
  phones: ["+375 (29) 857-67-68", "+375 (29) 643-67-68"],
  phoneHref: "tel:+375298576768",
  instagram: "https://www.instagram.com/dobrahata/",
  email: "dobra_hata@tut.by",
  address: "д. Прилепы, пер. Школьный, 1 · Смолевичский р-н, Минская обл.",
  gps: "54.075906, 27.83404",
} as const;

/** Оплачивается отдельно по договорённости — в расчёт не входит */
export const NOT_INCLUDED: readonly string[] = [
  "Питание и банкетное обслуживание",
  "Фотосессии",
  "Продление аренды по часам",
];

import { test } from "node:test";
import assert from "node:assert/strict";
import { quote, getDayType, rentThreshold, bathThreshold, getFormat, newYearRent, isLowSeason, maxGuestsFor } from "./pricing.ts";

// Контрольные примеры из ТЗ.md. Даты подобраны по дню недели в 2026 году.
const cases = [
  { n: 1, f: "a", d: "2026-10-03", g: 40, b: true,  rent: 7200, bath: 1800, total: 9000 }, // суббота
  { n: 2, f: "a", d: "2026-10-06", g: 12, b: false, rent: 2160, bath: 0,    total: 2160 }, // вторник
  { n: 3, f: "a", d: "2026-10-07", g: 5,  b: false, rent: 1100, bath: 0,    total: 1100 }, // среда
  { n: 4, f: "a", d: "2026-10-02", g: 10, b: true,  rent: 1800, bath: 450,  total: 2250 }, // пятница
  { n: 5, f: "b", d: "2026-10-02", g: 20, b: false, rent: 2800, bath: 0,    total: 2800 }, // пятница
  { n: 6, f: "b", d: "2026-10-02", g: 10, b: false, rent: 1800, bath: 0,    total: 1800 }, // пятница
  { n: 7, f: "c", d: "2026-10-07", g: 8,  b: true,  rent: 1100, bath: 450,  total: 1550 }, // среда
] as const;

for (const c of cases) {
  test(`контрольный пример ${c.n}`, () => {
    const q = quote(c.f, c.d, c.g, c.b);
    assert.equal(q.rent, c.rent);
    assert.equal(q.bathCost, c.bath);
    assert.equal(q.total, c.total);
    assert.equal(q.deposit, 1600);
  });
}

test("тип дня: пт/сб выходные, праздник — праздничный", () => {
  assert.equal(getDayType("2026-10-01"), "weekday"); // четверг
  assert.equal(getDayType("2026-10-02"), "weekend"); // пятница
  assert.equal(getDayType("2026-10-04"), "weekday"); // воскресенье
  assert.equal(getDayType("2026-11-07"), "holiday");
  assert.equal(getDayType("2026-04-21"), "holiday"); // Радуница 2026
});

test("пороги совпадают с таблицей ТЗ", () => {
  assert.equal(rentThreshold(getFormat("a"), "weekday"), 7);
  assert.equal(rentThreshold(getFormat("a"), "weekend"), 11); // 180×10 = 1800 = минимум, по головам дороже с 11
  assert.equal(rentThreshold(getFormat("b"), "weekday"), 8);
  assert.equal(rentThreshold(getFormat("b"), "weekend"), 13);
  assert.equal(rentThreshold(getFormat("c"), "weekday"), 12);
  assert.equal(rentThreshold(getFormat("c"), "weekend"), 19);
  assert.equal(bathThreshold(), 11); // 45×10 = 450 = минимум
});

test("несколько дней: каждый день по своему типу", () => {
  // чт 1 окт (будни) + пт 2 окт (выходной) + сб 3 окт (выходной), 5 гостей — везде минимум
  const q = quote("a", "2026-10-01", 5, false, 3);
  assert.deepEqual(q.dates, ["2026-10-01", "2026-10-02", "2026-10-03"]);
  assert.equal(q.rent, 1100 + 1800 + 1800);
  assert.equal(q.rentByHeads, false);
  // 40 гостей — по головам каждый день, баня одна на заезд
  const q2 = quote("a", "2026-10-01", 40, true, 2);
  assert.equal(q2.rent, 7200 * 2);
  assert.equal(q2.rentByHeads, true);
  assert.equal(q2.bathCost, 1800);
  assert.equal(q2.total, 7200 * 2 + 1800);
});

test("новый год: 7 000 за двое суток, +2 500, +1 600, минимум двое", () => {
  assert.equal(newYearRent(2), 7000);
  assert.equal(newYearRent(3), 9500);
  assert.equal(newYearRent(4), 11100);
  assert.equal(newYearRent(5), 12700);
  const q = quote("a", "2026-12-31", 30, false, 2);
  assert.equal(q.newYear, true);
  assert.equal(q.newYearShort, false);
  assert.equal(q.rent, 7000);
  // одни сутки на новогоднюю дату — считаем за минимум и помечаем
  const short = quote("a", "2027-01-01", 30, false, 1);
  assert.equal(short.newYearShort, true);
  assert.equal(short.rent, 7000);
  // заезд 30 декабря на трое суток задевает 31-е — новогодний
  assert.equal(quote("a", "2026-12-30", 10, false, 3).newYear, true);
  // 2 января — обычный день
  assert.equal(quote("a", "2027-01-02", 10, false, 1).newYear, false);
});

test("межсезонье 1 ноября — 15 апреля: до 25 гостей", () => {
  assert.equal(isLowSeason("2026-10-31"), false);
  assert.equal(isLowSeason("2026-11-01"), true);
  assert.equal(isLowSeason("2027-02-10"), true);
  assert.equal(isLowSeason("2027-04-15"), true);
  assert.equal(isLowSeason("2027-04-16"), false);
  assert.equal(maxGuestsFor(["2026-10-31"]), 100);
  assert.equal(maxGuestsFor(["2026-10-31", "2026-11-01"]), 25);
});

test("скидка 10% на завтра и послезавтра", () => {
  const today = "2026-10-07"; // среда
  // завтра, чт, 12 гостей, сутки, с баней: 2160 + 540 = 2700 → −270
  const q1 = quote("a", "2026-10-08", 12, true, 1, today);
  assert.equal(q1.lastMinute, true);
  assert.equal(q1.subtotal, 2700);
  assert.equal(q1.discount, 270);
  assert.equal(q1.total, 2430);
  assert.equal(quote("a", "2026-10-09", 12, false, 1, today).lastMinute, true); // послезавтра
  assert.equal(quote("a", "2026-10-10", 12, false, 1, today).lastMinute, false); // через 3 дня
  assert.equal(quote("a", "2026-10-07", 12, false, 1, today).lastMinute, false); // сегодня
  // на новогодний тариф не действует
  assert.equal(quote("a", "2026-12-31", 10, false, 2, "2026-12-30").discount, 0);
});

test("несколько дней — только посуточно", () => {
  const q = quote("c", "2026-10-01", 10, false, 2);
  assert.equal(q.format.id, "a");
  assert.equal(quote("c", "2026-10-01", 10, false, 1).format.id, "c");
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { quote, getDayType, rentThreshold, bathThreshold, getFormat } from "./pricing.ts";

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

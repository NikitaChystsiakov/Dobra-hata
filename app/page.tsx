import Calculator, { type InitialState } from "@/components/Calculator";
import { addDays, defaultDate } from "@/lib/dates";
import { isNewYearStay, maxGuestsFor, stayDates } from "@/lib/pricing";
import { DEMO_BUSY_OFFSETS, GUESTS, NEW_YEAR, STAY_MAX_DAYS, type FormatId } from "@/lib/pricing.config";

// Сегодняшняя дата считается на сервере в минском времени и передаётся вниз,
// чтобы календарь совпадал на сервере и в браузере.
export const dynamic = "force-dynamic";

function todayMinsk(): string {
  // en-CA даёт YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Minsk",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

type SP = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Расчёт из ссылки: ?f=a&d=2026-10-03&n=2&g=40&b=1 (n есть — значит «несколько суток») */
function readInitial(sp: SP, todayISO: string): InitialState {
  const busy = new Set(DEMO_BUSY_OFFSETS.map((n) => addDays(todayISO, n)));
  const f = first(sp.f);
  const dRaw = first(sp.d);
  const nRaw = Number(first(sp.n));
  const g = Number(first(sp.g));
  const b = first(sp.b);
  const d = dRaw && /^\d{4}-\d{2}-\d{2}$/.test(dRaw) && dRaw >= todayISO && !busy.has(dRaw) ? dRaw : defaultDate(todayISO, busy);
  const stayWanted = Number.isInteger(nRaw) && nRaw >= 1;
  // Несколько суток — только если весь диапазон свободен
  const nWanted = stayWanted ? Math.min(nRaw, STAY_MAX_DAYS) : 1;
  let n = stayDates(d, nWanted).every((x) => !busy.has(x)) ? nWanted : 1;
  const newYear = isNewYearStay(stayDates(d, n));
  if (newYear) n = Math.max(n, NEW_YEAR.minDays);
  const m = stayWanted || newYear ? "stay" : "day";
  return {
    f: (m === "stay" ? "a" : ["a", "b", "c"].includes(f ?? "") ? f : "a") as FormatId,
    m,
    d,
    n,
    g: Number.isInteger(g) && g >= GUESTS.min ? Math.min(g, maxGuestsFor(stayDates(d, n))) : GUESTS.default,
    b: b === "1",
  };
}

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const today = todayMinsk();
  const sp = await searchParams;
  const font = ["a", "b", "c"].includes(first(sp.font) ?? "") ? (first(sp.font) as string) : "";
  return <Calculator todayISO={today} initial={readInitial(sp, today)} font={font} />;
}

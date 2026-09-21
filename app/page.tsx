import Calculator, { type InitialState } from "@/components/Calculator";
import { addDays, defaultDate } from "@/lib/dates";
import { DEMO_BUSY_OFFSETS, GUESTS, type FormatId } from "@/lib/pricing.config";

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

/** Расчёт из ссылки: ?f=a&d=2026-10-03&g=40&b=1 */
function readInitial(sp: SP, todayISO: string): InitialState {
  const busy = new Set(DEMO_BUSY_OFFSETS.map((n) => addDays(todayISO, n)));
  const f = first(sp.f);
  const d = first(sp.d);
  const g = Number(first(sp.g));
  const b = first(sp.b);
  return {
    f: (["a", "b", "c"].includes(f ?? "") ? f : "a") as FormatId,
    d: d && /^\d{4}-\d{2}-\d{2}$/.test(d) && d >= todayISO && !busy.has(d) ? d : defaultDate(todayISO),
    g: Number.isInteger(g) && g >= GUESTS.min && g <= GUESTS.max ? g : GUESTS.default,
    b: b === "1",
  };
}

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const today = todayMinsk();
  const sp = await searchParams;
  const font = ["a", "b", "c"].includes(first(sp.font) ?? "") ? (first(sp.font) as string) : "";
  return <Calculator todayISO={today} initial={readInitial(sp, today)} font={font} />;
}

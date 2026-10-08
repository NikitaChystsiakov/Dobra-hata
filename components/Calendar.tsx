"use client";

import { useState } from "react";
import { fromISODate, getDayType, isNewYearDate, toISODate } from "@/lib/pricing";
import { addDays, dateShort, daysBetween, daysWord } from "@/lib/dates";

export type StayMode = "day" | "stay";

interface Props {
  mode: StayMode;
  /** День заезда */
  start: string;
  /** Оплачиваемых дней (суток) */
  days: number;
  onPick: (start: string, days: number) => void;
  onMode: (mode: StayMode) => void;
  busy: ReadonlySet<string>;
  /** Даты со скидкой «в последний момент» */
  deal?: ReadonlySet<string>;
  dealPercent?: number;
  todayISO: string;
  maxDays: number;
  /** Время заезда и выезда для подписей, «15:00» / «12:00» */
  checkIn: string;
  checkOut: string;
  /** Подпись под датой в режиме одного дня: «выходной, минимум 1 800 руб.» */
  dayNote: React.ReactNode;
  warm?: boolean;
}

const MONTHS = [
  "январь", "февраль", "март", "апрель", "май", "июнь",
  "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь",
];
const DOW = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

/**
 * Один день — один клик по дате.
 * Несколько суток — как в сервисах бронирования: дата заезда, затем дата выезда.
 * Какую дату ждём следующей, видно по подсвеченному полю над календарём.
 */
export default function Calendar({
  mode, start, days, onPick, onMode, busy, deal, dealPercent, todayISO, maxDays, checkIn, checkOut, dayNote, warm,
}: Props) {
  const selected = fromISODate(start);
  const [view, setView] = useState({ y: selected.getFullYear(), m: selected.getMonth() });
  // Несколько суток: что выбирает следующий клик — заезд или выезд
  const [target, setTarget] = useState<"in" | "out">("in");
  const [hover, setHover] = useState<string | null>(null);
  // Дату сменили снаружи (кнопка «завтра») — показываем её месяц
  const [shownStart, setShownStart] = useState(start);
  if (shownStart !== start) {
    setShownStart(start);
    if (selected.getFullYear() !== view.y || selected.getMonth() !== view.m) {
      setView({ y: selected.getFullYear(), m: selected.getMonth() });
    }
  }
  const today = fromISODate(todayISO);
  const atMin = view.y === today.getFullYear() && view.m === today.getMonth();
  const stay = mode === "stay";
  const out = addDays(start, days);

  const first = new Date(view.y, view.m, 1);
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // понедельник — первый
  const cells: (Date | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(view.y, view.m, i + 1)),
  ];
  while (cells.length % 7) cells.push(null);

  const step = (d: number) => {
    const n = new Date(view.y, view.m + d, 1);
    setView({ y: n.getFullYear(), m: n.getMonth() });
  };

  /** Можно ли выехать в iso: не дальше maxDays и без занятых ночей между */
  const canCheckOut = (iso: string): boolean => {
    const n = daysBetween(start, iso);
    if (n < 1 || n > maxDays) return false;
    for (let i = 1; i < n; i++) if (busy.has(addDays(start, i))) return false;
    return true;
  };

  const pick = (iso: string) => {
    if (!stay) return onPick(iso, 1);
    if (target === "out" && canCheckOut(iso)) {
      onPick(start, daysBetween(start, iso));
      setTarget("in");
      return;
    }
    // Новый заезд: длину сохраняем, пока не выберут выезд
    onPick(iso, days);
    setTarget("out");
  };

  const switchMode = (m: StayMode) => {
    if (m === mode) return;
    setTarget(m === "stay" ? "out" : "in");
    onMode(m);
  };

  // Предпросмотр выезда при наведении
  const preview = stay && target === "out" && hover && canCheckOut(hover) ? hover : null;
  const shownOut = preview ?? out;
  const shownDays = daysBetween(start, shownOut);
  const nyStart = isNewYearDate(start);

  return (
    <div className="cal">
      <div className="seg" role="radiogroup" aria-label="Сколько дней">
        <button
          type="button"
          role="radio"
          aria-checked={!stay}
          className="seg__opt"
          disabled={nyStart}
          title={nyStart ? "Новый год — только посуточно" : undefined}
          onClick={() => switchMode("day")}
        >
          Один день
        </button>
        <button type="button" role="radio" aria-checked={stay} className="seg__opt" onClick={() => switchMode("stay")}>
          Несколько суток
        </button>
      </div>

      {stay ? (
        <div className="slots">
          <button
            type="button"
            className={`slot${target === "in" ? " is-active" : ""}`}
            onClick={() => setTarget("in")}
            aria-pressed={target === "in"}
          >
            <span className="slot__k">Заезд</span>
            <span className="slot__v">{dateShort(start)}</span>
            <span className="slot__s">с {checkIn}</span>
          </button>
          <span className={`slots__n${preview ? " is-preview" : ""}`} aria-live="polite">
            {daysWord(shownDays, true)}
          </span>
          <button
            type="button"
            className={`slot${target === "out" ? " is-active" : ""}${preview ? " is-preview" : ""}`}
            onClick={() => setTarget("out")}
            aria-pressed={target === "out"}
          >
            <span className="slot__k">Выезд</span>
            <span className="slot__v">{dateShort(shownOut)}</span>
            <span className="slot__s">до {checkOut}</span>
          </button>
        </div>
      ) : (
        <div className="slots slots--one">
          <div className="slot is-static">
            <span className="slot__k">Дата</span>
            <span className="slot__v">{dateShort(start)}</span>
            <span className={`slot__s${warm ? " is-warm" : ""}`}>{dayNote}</span>
          </div>
        </div>
      )}

      <div className="cal__bar">
        <div className="cal__month" aria-live="polite">
          {MONTHS[view.m]} {view.y}
        </div>
        <div className="cal__nav">
          <button type="button" onClick={() => step(-1)} disabled={atMin} aria-label="Предыдущий месяц">
            <svg viewBox="0 0 14 14" aria-hidden="true"><path d="M9 2 L4 7 L9 12" /></svg>
          </button>
          <button type="button" onClick={() => step(1)} aria-label="Следующий месяц">
            <svg viewBox="0 0 14 14" aria-hidden="true"><path d="M5 2 L10 7 L5 12" /></svg>
          </button>
        </div>
      </div>

      <div
        className={`cal__grid${stay ? " is-stay" : ""}`}
        role="grid"
        aria-label={stay ? "Даты заезда и выезда" : "Дата"}
        onMouseLeave={() => setHover(null)}
      >
        {DOW.map((d, i) => (
          <div key={d} className={`cal__dow${i >= 4 && i <= 5 ? " is-weekend" : ""}`} role="columnheader">
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} className="day day--empty" aria-hidden="true" />;
          const iso = toISODate(d);
          const past = iso < todayISO;
          const isBusy = busy.has(iso);
          const dt = getDayType(iso);
          const ny = isNewYearDate(iso);
          const isDeal = !!deal?.has(iso) && !ny;
          const isIn = iso === start;
          const isOut = stay && iso === shownOut;
          const isMid = stay && iso > start && iso < shownOut;
          const tag = stay ? (isIn ? "заезд" : isOut ? "выезд" : "") : "";
          // Ждём выезд: дальше лимита суток — приглушаем (клик начнёт новый заезд)
          const far = stay && target === "out" && daysBetween(start, iso) > maxDays;
          const cls = [
            "day",
            dt !== "weekday" ? "is-weekend" : "",
            ny ? "is-ny" : "",
            isDeal ? "is-deal" : "",
            isBusy ? "is-busy" : "",
            isIn ? "is-in" : "",
            isMid ? "is-mid" : "",
            isOut ? "is-out" : "",
            isOut && preview ? "is-preview" : "",
            far ? "is-far" : "",
            iso === todayISO ? "is-today" : "",
          ]
            .filter(Boolean)
            .join(" ");
          const label = `${d.getDate()} ${MONTHS[view.m]}${ny ? ", новогодний тариф" : dt === "holiday" ? ", праздник" : dt === "weekend" ? ", выходной" : ""}${isDeal ? `, скидка ${dealPercent}%` : ""}${isBusy ? ", занято" : ""}${tag ? `, ${tag}` : ""}`;
          return (
            <button
              key={iso}
              type="button"
              role="gridcell"
              className={cls}
              disabled={past || isBusy}
              aria-selected={isIn || isMid || isOut}
              aria-label={label}
              onClick={() => pick(iso)}
              onMouseEnter={() => setHover(iso)}
            >
              {d.getDate()}
              {tag && <span className="day__tag" aria-hidden="true">{tag}</span>}
            </button>
          );
        })}
      </div>

      {stay && (
        <p className="cal__hint" aria-live="polite">
          {target === "out"
            ? `Теперь отметьте день выезда — до ${daysWord(maxDays, true)} подряд.`
            : "Чтобы изменить даты, отметьте новый день заезда."}
        </p>
      )}

      <div className="cal__foot">
        {busy.size > 0 && <span><i className="k-busy" /> занято</span>}
        {deal && deal.size > 0 && <span><i className="k-deal">−{dealPercent}%</i> заезд завтра и послезавтра</span>}
        <span><i className="k-we" /> выходной, праздник</span>
        <span><i className="k-ny" /> новогодний тариф</span>
      </div>
    </div>
  );
}

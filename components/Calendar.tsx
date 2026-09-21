"use client";

import { useState } from "react";
import { fromISODate, getDayType, toISODate } from "@/lib/pricing";

interface Props {
  value: string;
  onChange: (iso: string) => void;
  busy: ReadonlySet<string>;
  todayISO: string;
}

const MONTHS = [
  "январь", "февраль", "март", "апрель", "май", "июнь",
  "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь",
];
const DOW = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

export default function Calendar({ value, onChange, busy, todayISO }: Props) {
  const selected = fromISODate(value);
  const [view, setView] = useState({ y: selected.getFullYear(), m: selected.getMonth() });
  const today = fromISODate(todayISO);
  const minView = { y: today.getFullYear(), m: today.getMonth() };
  const atMin = view.y === minView.y && view.m === minView.m;

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

  return (
    <div className="cal">
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

      <div className="cal__grid" role="grid" aria-label="Выбор даты заезда">
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
          const cls = [
            "day",
            dt !== "weekday" ? "is-weekend" : "",
            isBusy ? "is-busy" : "",
            iso === value ? "is-selected" : "",
            iso === todayISO ? "is-today" : "",
          ]
            .filter(Boolean)
            .join(" ");
          const label = `${d.getDate()} ${MONTHS[view.m]}${dt === "holiday" ? ", праздник" : dt === "weekend" ? ", выходной" : ""}${isBusy ? ", занято" : ""}`;
          return (
            <button
              key={iso}
              type="button"
              role="gridcell"
              className={cls}
              disabled={past || isBusy}
              aria-selected={iso === value}
              aria-label={label}
              onClick={() => onChange(iso)}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      <div className="cal__foot">
        <span><i className="k-sel" /> выбрано</span>
        <span><i className="k-busy" /> занято</span>
        <span><i className="k-we" /> выходной, праздник</span>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { Quote } from "@/lib/pricing";
import { formatRub, isLowSeason } from "@/lib/pricing";
import { CHILD_FREE_UNDER, LOW_SEASON, NEW_YEAR_NOTE } from "@/lib/pricing.config";

interface Props {
  open: boolean;
  onClose: () => void;
  q: Quote;
  dateLabel: string;
}

export default function BookingSheet({ open, onClose, q, dateLabel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [done, setDone] = useState<number | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      setDone(null);
    }
    if (!open && d.open) d.close();
  }, [open]);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    // Заглушка: пока нет бэкенда, заявка не отправляется — только показываем результат.
    // TODO: POST /api/booking → запись в календарь занятости
    const n = 40 + (Date.now() % 900);
    console.info("booking (demo)", Object.fromEntries(fd), q);
    setDone(n);
  };

  return (
    <dialog ref={ref} className="booking" onClose={onClose} aria-labelledby="booking-title">
      <div className="booking__in">
        <div className="booking__head">
          <h2 id="booking-title">{done ? "Заявка принята" : "Заявка на бронирование"}</h2>
          <button type="button" className="x" onClick={onClose} aria-label="Закрыть">
            <svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2 L12 12 M12 2 L2 12" fill="none" /></svg>
          </button>
        </div>

        {done ? (
          <div className="booking__ok">
            <div className="n">№ {String(done).padStart(4, "0")}</div>
            <p style={{ margin: 0 }}>
              Перезвоним в течение часа, чтобы подтвердить {q.days > 1 ? "даты" : "дату"} <b>{dateLabel}</b> для {q.guests}{" "}
              {plural(q.guests, "гостя", "гостей", "гостей")}.
            </p>
            <p className="booking__demo">
              Демонстрация: заявка пока не отправляется владельцам и не блокирует дату в календаре.
            </p>
            <button type="button" className="btn btn--primary" onClick={onClose}>Готово</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="rows">
              <div className="row"><span className="row__k">Формат</span><span className="row__v">{q.newYear ? "Новый год, посуточно" : q.format.name} · {q.format.checkIn} → {q.format.checkOut}</span></div>
              <div className="row"><span className="row__k">{q.days > 1 ? "Даты" : "Дата"}</span><span className="row__v">{dateLabel}</span></div>
              <div className="row"><span className="row__k">Гостей</span><span className="row__v">{q.guests}</span></div>
              <div className="row"><span className="row__k">Баня</span><span className="row__v">{q.bath ? `да, ${formatRub(q.bathCost)} руб.` : "нет"}</span></div>
              {q.discount > 0 && <div className="row row--deal"><span className="row__k">Скидка</span><span className="row__v">−{formatRub(q.discount)} руб.</span></div>}
              <div className="row"><span className="row__k">Итого</span><span className="row__v"><b>{formatRub(q.total)} руб.</b> + залог {formatRub(q.deposit)}</span></div>
            </div>
            <div className="brief">
              <span className="brief__k">Важно знать</span>
              <ul>
                <li>
                  Заезд с {q.format.checkIn}, выезд до {q.format.checkOut}{q.format.overnight ? " следующего дня" : ""}.
                  Ранний и/или поздний заезд — за доплату.
                </li>
                <li>Залог {formatRub(q.deposit)} руб. за сохранность имущества — возвращаем при выселении.</li>
                <li>
                  Дети до {CHILD_FREE_UNDER} лет не считаются.
                  {q.dates.some(isLowSeason) && ` С 1 ноября по 15 апреля — до ${LOW_SEASON.maxGuests} гостей.`}
                </li>
                {q.newYear && <li>{NEW_YEAR_NOTE}</li>}
              </ul>
              <a href="#terms" className="brief__more" onClick={onClose}>Все условия аренды</a>
            </div>
            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
              <label className="fld">
                <span>Как к вам обращаться</span>
                <input name="name" required autoComplete="name" placeholder="Имя" />
              </label>
              <label className="fld">
                <span>Телефон</span>
                <input name="phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="+375 29 000-00-00" />
              </label>
              <label className="consent">
                <input name="consent" type="checkbox" required />
                <span>
                  Согласен на обработку персональных данных (имя и телефон) для связи по заявке —{" "}
                  <a href="/privacy" target="_blank" rel="noopener">политика обработки</a>.
                </span>
              </label>
              <button type="submit" className="btn btn--primary btn--block">Отправить заявку</button>
              <p className="booking__demo">Ничего не списывается. Владельцы перезвонят и подтвердят дату.</p>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}

export function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

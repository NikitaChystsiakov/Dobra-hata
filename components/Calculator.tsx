"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BATH,
  CAPACITY,
  CHILD_FREE_UNDER,
  CONTACTS,
  DAY_MINIMUM,
  DEMO_BUSY_OFFSETS,
  DEPOSIT,
  FORMATS,
  GUESTS,
  NEW_YEAR_NOTE,
  NOT_INCLUDED,
  TARIFF_VALID_UNTIL,
  type FormatId,
} from "@/lib/pricing.config";
import { formatRub, quote, rentFor, rentThreshold } from "@/lib/pricing";
import { PHOTOS } from "@/lib/photos";
import { addDays, dateLabel, dateShort } from "@/lib/dates";
import Calendar from "./Calendar";
import ThemeToggle from "./ThemeToggle";
import BookingSheet, { plural } from "./BookingSheet";

export interface InitialState {
  f: FormatId;
  d: string;
  g: number;
  b: boolean;
}

interface Props {
  todayISO: string;
  initial: InitialState;
  font: string;
}

const DAY_TYPE_LABEL = { weekday: "будний день", weekend: "выходной", holiday: "праздник" } as const;

export default function Calculator({ todayISO, initial, font }: Props) {
  const [formatId, setFormatId] = useState<FormatId>(initial.f);
  const [date, setDate] = useState(initial.d);
  const [guests, setGuests] = useState<number>(initial.g);
  const [bath, setBath] = useState(initial.b);
  const [booking, setBooking] = useState(false);
  const [copied, setCopied] = useState(false);

  const busy = useMemo(() => new Set(DEMO_BUSY_OFFSETS.map((n) => addDays(todayISO, n))), [todayISO]);

  // Состояние живёт в URL: ссылку можно переслать, сервер читает её при открытии
  useEffect(() => {
    const p = new URLSearchParams({ f: formatId, d: date, g: String(guests), b: bath ? "1" : "0" });
    if (font) p.set("font", font);
    window.history.replaceState(null, "", `?${p}`);
  }, [formatId, date, guests, bath, font]);

  const q = quote(formatId, date, guests, bath);
  const dayType = q.dayType;
  const thr = rentThreshold(q.format, dayType);

  const clampGuests = (n: number) => Math.min(GUESTS.max, Math.max(GUESTS.min, Math.round(n) || GUESTS.min));

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Скопируйте ссылку на расчёт", window.location.href);
    }
  };

  const capacityHint =
    guests > CAPACITY.terraceSummer
      ? `Больше ${CAPACITY.terraceSummer} гостей — только фуршетом, до ${CAPACITY.buffet}. Уточните по телефону.`
      : guests > CAPACITY.livingRoom
        ? `В гостиной до ${CAPACITY.livingRoom} гостей; летом до ${CAPACITY.terraceSummer} — на террасе у бассейна и в «Пагоде».`
        : null;

  const tariffUntil = dateLabel(TARIFF_VALID_UNTIL).replace(/^[^,]+, /, "");

  return (
    <main className="page" data-font={font || undefined}>
      <header className="top">
        <div className="brand">
          <span className="brand__name">Усадьба «Добра Хата»</span>
          <span className="brand__sub">Раубичи, 20 км от Минска</span>
        </div>
        <div className="top__tools">
          <ThemeToggle />
          <a className="btn btn--phone" href={CONTACTS.phoneHref}>Позвонить</a>
        </div>
      </header>

      <section className="intro">
        <h1>Сколько выйдет на вашу компанию</h1>
        <p>Выберите формат, дату и число гостей — сумма считается сразу, без звонка.</p>
      </section>

      <div className="grid">
        <div className="fields">
          {/* Формат */}
          <div className="field">
            <div className="field__head">
              <span className="field__label">Формат аренды</span>
              <p className="field__hint">Цены — на {guests} {plural(guests, "гостя", "гостей", "гостей")}, {dateShort(date)}</p>
            </div>
            <div className="variants" role="radiogroup" aria-label="Формат аренды">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={f.id === formatId}
                  className="variant"
                  onClick={() => setFormatId(f.id)}
                >
                  <span className="variant__name">{f.name}</span>
                  <span className="variant__time">
                    {f.checkIn} → {f.checkOut}{f.overnight ? " следующего дня" : ""}
                  </span>
                  <span className="variant__sum">{formatRub(rentFor(f, dayType, guests))} руб.</span>
                </button>
              ))}
            </div>
          </div>

          {/* Дата */}
          <div className="field">
            <div className="field__head">
              <span className="field__label">Дата заезда</span>
              <p className={`field__hint${dayType !== "weekday" ? " field__hint--warm" : ""}`}>
                {dateLabel(date)} · {DAY_TYPE_LABEL[dayType]}, минимум {formatRub(DAY_MINIMUM[dayType])} руб.
              </p>
            </div>
            <Calendar value={date} onChange={setDate} busy={busy} todayISO={todayISO} />
          </div>

          {/* Гости */}
          <div className="field">
            <div className="field__head">
              <span className="field__label">Гостей</span>
              <p className="field__hint">Дети до {CHILD_FREE_UNDER} лет не считаются</p>
            </div>
            <div className="guests">
              <div className="stepper">
                <button type="button" onClick={() => setGuests(clampGuests(guests - 1))} disabled={guests <= GUESTS.min} aria-label="Меньше">−</button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={GUESTS.min}
                  max={GUESTS.max}
                  value={guests}
                  aria-label="Количество гостей"
                  onChange={(e) => setGuests(clampGuests(Number(e.target.value)))}
                />
                <button type="button" onClick={() => setGuests(clampGuests(guests + 1))} disabled={guests >= GUESTS.max} aria-label="Больше">+</button>
              </div>
              <div className="scale">
                <input
                  type="range"
                  min={GUESTS.min}
                  max={GUESTS.max}
                  value={guests}
                  aria-label="Количество гостей"
                  aria-valuetext={`${guests} ${plural(guests, "гость", "гостя", "гостей")}`}
                  onChange={(e) => setGuests(clampGuests(Number(e.target.value)))}
                />
                <div className="scale__ends" aria-hidden="true"><span>1</span><span>{GUESTS.max}</span></div>
              </div>
            </div>
            <p className="field__hint">
              {q.rentByHeads
                ? <>По {q.format.perGuest} руб. с человека: <b>{q.format.perGuest} × {guests} = {formatRub(q.rent)} руб.</b></>
                : <>До {thr - 1} гостей действует минимум <b>{formatRub(DAY_MINIMUM[dayType])} руб.</b>, дальше — по {q.format.perGuest} руб. с человека.</>}
            </p>
            {capacityHint && <p className="field__hint field__hint--warm">{capacityHint}</p>}
          </div>

          {/* Баня */}
          <div className="field">
            <label className="switch">
              <input type="checkbox" checked={bath} onChange={(e) => setBath(e.target.checked)} />
              <span className="switch__box" aria-hidden="true" />
              <span className="switch__text">
                <b>Банный комплекс, {BATH.hours} часа</b>
                <span>
                  Финская, русская, хаммам. {BATH.perGuest} руб. с каждого гостя, минимум {BATH.minimum}.
                  {bath && <> Сейчас — <b>{formatRub(q.bathCost)} руб.</b></>}
                </span>
              </span>
            </label>
          </div>
        </div>

        {/* Итог */}
        <aside className="summary" aria-label="Итог расчёта">
          <h2>Ваш расчёт</h2>
          <div className="rows">
            <div className="row">
              <span className="row__k">Формат</span>
              <span className="row__v">{q.format.name}<small>{q.format.checkIn} → {q.format.checkOut}{q.format.overnight ? " след. дня" : ""}</small></span>
            </div>
            <div className="row">
              <span className="row__k">Дата</span>
              <span className="row__v">{dateShort(date)}<small>{DAY_TYPE_LABEL[dayType]}</small></span>
            </div>
            <div className="row">
              <span className="row__k">Гостей</span>
              <span className="row__v">{guests}</span>
            </div>
            {!q.newYear && (
              <>
                <div className="row">
                  <span className="row__k">Аренда</span>
                  <span className="row__v">{formatRub(q.rent)} руб.<small>{q.rentByHeads ? `${q.format.perGuest} × ${guests}` : "минимум за день"}</small></span>
                </div>
                <div className="row">
                  <span className="row__k">Баня, {BATH.hours} ч</span>
                  <span className="row__v">{bath ? <>{formatRub(q.bathCost)} руб.<small>{q.bathByHeads ? `${BATH.perGuest} × ${guests}` : "минимум"}</small></> : <span style={{ color: "var(--text-3)" }}>не выбрана</span>}</span>
                </div>
              </>
            )}
          </div>

          {q.newYear ? (
            <p className="ny">{NEW_YEAR_NOTE}</p>
          ) : (
            <div className="total">
              <span className="total__k">Итого</span>
              <span className="total__v" aria-live="polite">{formatRub(q.total)}<small>руб.</small></span>
            </div>
          )}

          <p className="deposit">
            Залог <b>{formatRub(DEPOSIT)} руб.</b> — возвращается после проживания, в итог не входит.
          </p>

          <div className="summary__actions">
            <button type="button" className="btn btn--primary btn--block" onClick={() => setBooking(true)}>
              Забронировать {dateShort(date)}
            </button>
            <button type="button" className="btn btn--block" onClick={copyLink}>
              {copied ? "Ссылка скопирована" : "Скопировать ссылку на расчёт"}
            </button>
          </div>
          <p className="summary__note">
            Цены действуют до {tariffUntil}. Отдельно: {NOT_INCLUDED.map((s) => s.toLowerCase()).join(", ")}.
          </p>
        </aside>
      </div>

      <section className="photos-sec" aria-label="Усадьба">
        <h2>Что вас ждёт</h2>
        <ul className="photos">
          {PHOTOS.map((p) => (
            <li key={p.src}>
              <figure>
                <Image src={p.src} alt={p.alt} width={1200} height={712} sizes="(max-width: 767px) 50vw, 33vw" />
                <figcaption>{p.caption}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </section>

      <footer className="foot">
        <section aria-label="Условия">
          <h2>Условия</h2>
          <ul>
            <li>Сутки: заезд 15:00, выезд 12:00 следующего дня. День с коттеджем — до 24:00, только территория — до 23:00.</li>
            <li>Будни (вс–чт) — минимум {formatRub(DAY_MINIMUM.weekday)} руб., пятница, суббота и праздники — {formatRub(DAY_MINIMUM.weekend)} руб.</li>
            <li>Баня считается на всех, кто на усадьбе. Дети до {CHILD_FREE_UNDER} лет гостями не считаются.</li>
            <li>Залог {formatRub(DEPOSIT)} руб. возвращается после проживания.</li>
            <li>Занятые даты в календаре показаны для примера — календарь занятости подключается отдельно.</li>
          </ul>
        </section>
        <section aria-label="Контакты">
          <h2>Контакты</h2>
          <div className="contact">
            {CONTACTS.phones.map((p) => (
              <a key={p} href={`tel:${p.replace(/[^\d+]/g, "")}`}>{p}</a>
            ))}
            <a href={CONTACTS.instagram} target="_blank" rel="noopener">Instagram @dobrahata</a>
            <a href={`mailto:${CONTACTS.email}`}>{CONTACTS.email}</a>
            <p>{CONTACTS.address}</p>
            <p><Link href="/privacy">Политика обработки персональных данных</Link></p>
          </div>
        </section>
      </footer>

      <div className="mini">
        <div>
          <div className="mini__lbl">Итого{bath ? " с баней" : ""}, залог отдельно</div>
          <div className="mini__sum">{q.newYear ? "Уточняйте" : <>{formatRub(q.total)}<small>руб.</small></>}</div>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setBooking(true)}>Забронировать</button>
      </div>

      <BookingSheet open={booking} onClose={() => setBooking(false)} q={q} dateLabel={dateLabel(date)} />
    </main>
  );
}

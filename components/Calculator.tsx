"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BATH,
  CHILD_FREE_UNDER,
  CONTACTS,
  DAY_MINIMUM,
  DEMO_BUSY_OFFSETS,
  DEPOSIT,
  EXTRA_NOTES,
  FORMATS,
  GUESTS,
  LAST_MINUTE,
  LOW_SEASON,
  NEW_YEAR,
  NEW_YEAR_NOTE,
  STAY_MAX_DAYS,
  type FormatId,
} from "@/lib/pricing.config";
import { formatRub, isNewYearDate, isNewYearStay, maxGuestsFor, newYearRent, quote, rentThreshold, stayDates, stayRent } from "@/lib/pricing";
import { PHOTOS } from "@/lib/photos";
import { addDays, dateLabel, dateShort, daysWord, rangeCompact, rangeShort } from "@/lib/dates";
import Calendar, { type StayMode } from "./Calendar";
import ThemeToggle from "./ThemeToggle";
import BookingSheet, { plural } from "./BookingSheet";

export interface InitialState {
  f: FormatId;
  /** Один день или несколько суток */
  m: StayMode;
  d: string;
  /** Дней подряд */
  n: number;
  g: number;
  b: boolean;
}

interface Props {
  todayISO: string;
  initial: InitialState;
  font: string;
}

const DAY_TYPE_LABEL = { weekday: "будний день", weekend: "выходной", holiday: "праздник" } as const;
const DAY_TYPE_SHORT = { weekday: "будни", weekend: "выходной", holiday: "праздник" } as const;

export default function Calculator({ todayISO, initial, font }: Props) {
  const [formatId, setFormatId] = useState<FormatId>(initial.f);
  const [mode, setMode] = useState<StayMode>(initial.m);
  const [date, setDate] = useState(initial.d);
  const [days, setDays] = useState(initial.n);
  const [guests, setGuests] = useState<number>(initial.g);
  // Что сейчас напечатано в поле гостей; null — показываем число из состояния.
  // Нужно, чтобы поле можно было очистить и набрать заново, не упираясь в минимум.
  const [guestsDraft, setGuestsDraft] = useState<string | null>(null);
  const [bath, setBath] = useState(initial.b);
  const [booking, setBooking] = useState(false);
  const [copied, setCopied] = useState(false);

  const busy = useMemo(() => new Set(DEMO_BUSY_OFFSETS.map((n) => addDays(todayISO, n))), [todayISO]);
  // Даты со скидкой «в последний момент»; на новогодний тариф скидка не действует
  const dealDates = useMemo(
    () => LAST_MINUTE.daysAhead.map((n) => addDays(todayISO, n)).filter((d) => !isNewYearDate(d) && !busy.has(d)),
    [todayISO, busy],
  );
  const deal = useMemo(() => new Set(dealDates), [dealDates]);

  // Состояние живёт в URL: ссылку можно переслать, сервер читает её при открытии
  useEffect(() => {
    const p = new URLSearchParams({ f: formatId, d: date, g: String(guests), b: bath ? "1" : "0" });
    if (mode === "stay") p.set("n", String(days));
    if (font) p.set("font", font);
    window.history.replaceState(null, "", `?${p}`);
  }, [formatId, mode, date, days, guests, bath, font]);

  const q = quote(formatId, date, guests, bath, days, todayISO);
  const maxGuests = maxGuestsFor(q.dates);
  const stay = mode === "stay";
  const dayType = q.dayType;
  const thr = rentThreshold(q.format, dayType);
  const sameType = q.perDay.every((d) => d.dayType === dayType);

  const clampGuests = (n: number) => Math.min(maxGuests, Math.max(GUESTS.min, Math.round(n) || GUESTS.min));

  /** Применить даты. Несколько суток и Новый год — только посуточно; Новый год — минимум двое суток. */
  const applyDates = (start: string, n: number, m: StayMode) => {
    n = m === "day" ? 1 : Math.min(STAY_MAX_DAYS, Math.max(1, n));
    if (isNewYearStay(stayDates(start, n)) && n < NEW_YEAR.minDays) {
      // Дотягиваем до минимума, если следующие дни свободны
      if (stayDates(start, NEW_YEAR.minDays).every((d) => !busy.has(d))) n = NEW_YEAR.minDays;
      m = "stay";
    }
    if (m === "stay") setFormatId("a");
    // Межсезонье — не больше 25 гостей
    const cap = maxGuestsFor(stayDates(start, n));
    setGuests((g) => Math.min(g, cap));
    setMode(m);
    setDate(start);
    setDays(n);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Скопируйте ссылку на расчёт", window.location.href);
    }
  };

  const stayWord = daysWord(q.days, q.format.overnight);
  const checkOutDay = addDays(q.end, 1);
  // Несколько суток показываем как «заезд — выезд», один день — одной датой
  const rangeText = stay ? rangeShort(q.start, checkOutDay) : rangeShort(q.start, q.end);

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
        <h1>Рассчитайте стоимость аренды</h1>
        <p>Выберите даты, формат и число гостей — сумма считается сразу.</p>
      </section>

      {dealDates.length > 0 && (
        <section className="deal" aria-label={`Скидка ${LAST_MINUTE.percent}%`}>
          <span className="deal__pct">−{LAST_MINUTE.percent}%</span>
          <div className="deal__text">
            <b>Собрались спонтанно? Так даже выгоднее</b>
            <span>При заезде завтра или послезавтра аренда{LAST_MINUTE.withBath ? " и баня" : ""} — на {LAST_MINUTE.percent}% дешевле.</span>
          </div>
          <div className="deal__go">
            {dealDates.map((d) => (
              <button
                key={d}
                type="button"
                className="btn"
                aria-pressed={q.start === d}
                onClick={() => applyDates(d, days, mode)}
              >
                <b>{d === addDays(todayISO, 1) ? "Завтра" : "Послезавтра"}</b>
                <span>{dateShort(d)}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="grid">
        <div className="fields">
          {/* Даты */}
          <div className="field">
            <div className="field__head">
              <span className="field__label">Даты</span>
              {q.newYear && <p className="field__hint field__hint--warm">Новогодний тариф</p>}
            </div>
            <Calendar
              mode={mode}
              start={q.start}
              days={q.days}
              onPick={(s, n) => applyDates(s, n, mode)}
              onMode={(m) => applyDates(q.start, m === "stay" ? Math.max(2, q.days) : 1, m)}
              busy={busy}
              deal={deal}
              dealPercent={LAST_MINUTE.percent}
              todayISO={todayISO}
              maxDays={STAY_MAX_DAYS}
              checkIn={q.format.checkIn}
              checkOut={q.format.checkOut}
              dayNote={<>{DAY_TYPE_LABEL[dayType]}, минимум {formatRub(DAY_MINIMUM[dayType])} руб.</>}
              warm={dayType !== "weekday"}
            />
          </div>

          {/* Формат */}
          <div className="field">
            <div className="field__head">
              <span className="field__label">Формат аренды</span>
              <p className="field__hint">
                {q.newYear
                  ? "Новый год — только посуточно, с домом"
                  : stay
                    ? "Несколько суток — только с домом"
                    : <>Цены — на {guests} {plural(guests, "гостя", "гостей", "гостей")}, {rangeText}{q.days > 1 ? `, ${stayWord}` : ""}</>}
              </p>
            </div>
            <div className="variants" role="radiogroup" aria-label="Формат аренды">
              {FORMATS.map((f) => {
                const off = (q.newYear || stay) && !f.overnight;
                return (
                  <button
                    key={f.id}
                    type="button"
                    role="radio"
                    aria-checked={f.id === formatId}
                    className="variant"
                    disabled={off}
                    onClick={() => setFormatId(f.id)}
                  >
                    <span className="variant__name">{f.name}</span>
                    <span className="variant__time">
                      {off ? (q.newYear ? "на Новый год недоступно" : "только для одного дня") : <>{f.checkIn} → {f.checkOut}{f.overnight ? " следующего дня" : ""}</>}
                    </span>
                    <span className="variant__sum">
                      {off ? "—" : `${formatRub(q.newYear ? newYearRent(q.days) : stayRent(f, q.dates, guests))} руб.`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Баня */}
          <div className="field">
            <label className="switch">
              <input type="checkbox" checked={bath} onChange={(e) => setBath(e.target.checked)} />
              <span className="switch__box" aria-hidden="true" />
              <span className="switch__text">
                <b>Банный комплекс, {BATH.hours} часа</b>
                <span>
                  Русская баня и хаммам. {BATH.perGuest} руб. с каждого гостя, минимум {BATH.minimum}.
                  {q.days > 1 && " Одно посещение за заезд."}
                  {bath && <> Сейчас — <b>{formatRub(q.bathCost)} руб.</b></>}
                </span>
              </span>
            </label>
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
                  max={maxGuests}
                  value={guestsDraft ?? guests}
                  aria-label="Количество гостей"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const v = e.target.value;
                    setGuestsDraft(v);
                    // Пока печатают — применяем только осмысленное число; пустое поле не трогаем
                    const n = Number(v);
                    if (v !== "" && Number.isFinite(n) && n >= GUESTS.min) setGuests(clampGuests(n));
                  }}
                  onBlur={() => setGuestsDraft(null)}
                  onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                />
                <button type="button" onClick={() => setGuests(clampGuests(guests + 1))} disabled={guests >= maxGuests} aria-label="Больше">+</button>
              </div>
              <div className="scale">
                <input
                  type="range"
                  min={GUESTS.min}
                  max={maxGuests}
                  value={guests}
                  aria-label="Количество гостей"
                  aria-valuetext={`${guests} ${plural(guests, "гость", "гостя", "гостей")}`}
                  onChange={(e) => setGuests(clampGuests(Number(e.target.value)))}
                />
                <div className="scale__ends" aria-hidden="true"><span>1</span><span>{maxGuests}</span></div>
              </div>
            </div>
            <p className="field__hint">
              {q.newYear
                ? <>Новогодний тариф от числа гостей не зависит — по гостям считается только баня.</>
                : q.rentByHeads
                  ? <>По {q.format.perGuest} руб. с человека: <b>{q.format.perGuest} × {guests}{q.days > 1 ? ` × ${q.days}` : ""} = {formatRub(q.rent)} руб.</b></>
                  : sameType
                    ? <>До {thr - 1} гостей действует минимум <b>{formatRub(DAY_MINIMUM[dayType])} руб.</b>{q.days > 1 ? " за день" : ""}, дальше — по {q.format.perGuest} руб. с человека.</>
                    : q.perDay.some((d) => d.byHeads)
                      ? <>В будни — по {q.format.perGuest} руб. с человека (<b>{q.format.perGuest} × {guests}</b>), в выходные и праздники действует минимум <b>{formatRub(DAY_MINIMUM.weekend)} руб.</b></>
                      : <>Пока действует минимум за день: <b>{formatRub(DAY_MINIMUM.weekday)}</b> в будни, <b>{formatRub(DAY_MINIMUM.weekend)}</b> в выходные. Дальше — по {q.format.perGuest} руб. с человека.</>}
            </p>
            {maxGuests < GUESTS.max && (
              <p className="field__hint">С 1 ноября по 15 апреля — до {LOW_SEASON.maxGuests} гостей.</p>
            )}
          </div>

        </div>

        {/* Итог */}
        <aside className="summary" aria-label="Итог расчёта">
          <h2>Ваш расчёт</h2>
          <div className="rows">
            <div className="row">
              <span className="row__k">Формат</span>
              <span className="row__v">{q.newYear ? "Новый год, посуточно" : q.format.name}<small>{q.format.checkIn} → {q.format.checkOut}{q.format.overnight ? " след. дня" : ""}</small></span>
            </div>
            <div className="row">
              <span className="row__k">{stay ? "Даты" : "Дата"}</span>
              <span className="row__v">
                {rangeText}
                <small>
                  {stay
                    ? `${stayWord}${q.newYear ? " · новогодний тариф" : ""}`
                    : DAY_TYPE_LABEL[dayType]}
                </small>
              </span>
            </div>
            <div className="row">
              <span className="row__k">Гостей</span>
              <span className="row__v">{guests}</span>
            </div>
            <div className="row">
              <span className="row__k">Аренда</span>
              <span className="row__v">
                {formatRub(q.rent)} руб.
                {q.newYear ? (
                  <small>
                    {formatRub(NEW_YEAR.twoDays)} за двое суток
                    {q.days >= 3 && ` + ${formatRub(NEW_YEAR.thirdDay)} третьи`}
                    {q.days > 3 && ` + ${formatRub(NEW_YEAR.extraDay)} × ${q.days - 3}`}
                  </small>
                ) : q.days > 1 ? (
                  <small className="row__days">
                    {q.perDay.map((d) => (
                      <span key={d.date}>{dateShort(d.date)} · {formatRub(d.rent)}{d.byHeads ? "" : ` (мин., ${DAY_TYPE_SHORT[d.dayType]})`}</span>
                    ))}
                  </small>
                ) : (
                  <small>{q.rentByHeads ? `${q.format.perGuest} × ${guests}` : "минимум за день"}</small>
                )}
              </span>
            </div>
            <div className="row">
              <span className="row__k">Баня, {BATH.hours} ч</span>
              <span className="row__v">{bath ? <>{formatRub(q.bathCost)} руб.<small>{q.bathByHeads ? `${BATH.perGuest} × ${guests}` : "минимум"}</small></> : <span style={{ color: "var(--text-3)" }}>не выбрана</span>}</span>
            </div>
            {q.lastMinute && (
              <div className="row row--deal">
                <span className="row__k">Скидка {LAST_MINUTE.percent}%</span>
                <span className="row__v">−{formatRub(q.discount)} руб.<small>спонтанный заезд</small></span>
              </div>
            )}
          </div>

          <div className="total">
            <span className="total__k">Итого</span>
            <span className="total__v" aria-live="polite">{formatRub(q.total)}<small>руб.</small></span>
          </div>

          {q.newYear && (
            <p className="ny">
              {q.newYearShort ? `Новогодний заезд — минимум ${daysWord(NEW_YEAR.minDays, true)}, посчитали за ${daysWord(NEW_YEAR.minDays, true)}. ` : ""}
              {NEW_YEAR_NOTE}
            </p>
          )}

          <p className="deposit">
            Залоговый депозит за сохранность имущества — <b>{formatRub(DEPOSIT)} руб.</b> Возвращается при выселении, в итог не входит.
          </p>

          <div className="summary__actions">
            <button type="button" className="btn btn--primary btn--block" onClick={() => setBooking(true)}>
              Забронировать {stay ? rangeCompact(q.start, checkOutDay) : rangeCompact(q.start, q.end)}
            </button>
            <button type="button" className="btn btn--block" onClick={copyLink}>
              {copied ? "Ссылка скопирована" : "Скопировать ссылку на расчёт"}
            </button>
          </div>
          <p className="summary__note">
            {EXTRA_NOTES.join(" ")}
          </p>
        </aside>
      </div>

      <section className="terms" id="terms" aria-labelledby="terms-title">
        <div className="terms__head">
          <h2 id="terms-title">Условия аренды</h2>
          <p>Остались вопросы — <a href={CONTACTS.phoneHref}>позвоните</a>, подскажем и подберём вариант.</p>
        </div>
        <dl className="terms__grid">
          <div className="term">
            <dt>Заезд и выезд</dt>
            <dd>
              На сутки — с {FORMATS[0].checkIn} до {FORMATS[0].checkOut} следующего дня. На день — с {FORMATS[1].checkIn} до {FORMATS[1].checkOut}.
              Ранний и/или поздний заезд — за доплату.
            </dd>
          </div>
          <div className="term">
            <dt>Минимальная сумма</dt>
            <dd>
              Вс–чт — {formatRub(DAY_MINIMUM.weekday)} руб. за день, пт, сб и праздники — {formatRub(DAY_MINIMUM.weekend)} руб.
              Когда гостей больше, считаем по ставке за человека.
            </dd>
          </div>
          <div className="term">
            <dt>Гости</dt>
            <dd>
              С 1 ноября по 15 апреля — до {LOW_SEASON.maxGuests} человек, в остальное время — до {GUESTS.max}.
              Дети до {CHILD_FREE_UNDER} лет не считаются.
            </dd>
          </div>
          <div className="term">
            <dt>Несколько суток</dt>
            <dd>Только с домом, посуточно. Каждые сутки — по своему тарифу: будни, выходной или праздник.</dd>
          </div>
          <div className="term">
            <dt>Банный комплекс</dt>
            <dd>
              Русская баня и хаммам, {BATH.hours} часа. {BATH.perGuest} руб. с каждого гостя на усадьбе, минимум {formatRub(BATH.minimum)} руб.
            </dd>
          </div>
          <div className="term">
            <dt>Новый год</dt>
            <dd>
              31 декабря и 1 января — от двух суток: {formatRub(NEW_YEAR.twoDays)} руб., третьи +{formatRub(NEW_YEAR.thirdDay)}, дальше +{formatRub(NEW_YEAR.extraDay)} за сутки.
            </dd>
          </div>
          <div className="term">
            <dt>Залог</dt>
            <dd>{formatRub(DEPOSIT)} руб. за сохранность имущества — возвращаем при выселении.</dd>
          </div>
          <div className="term term--accent">
            <dt>Скидки</dt>
            <dd>
              −{LAST_MINUTE.percent}% при заезде завтра или послезавтра. Тихим компаниям и семейному отдыху — тоже возможна скидка, уточняйте по телефону.
            </dd>
          </div>
        </dl>
      </section>

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
        <div className="foot__brand">
          <span className="brand__name">Усадьба «Добра Хата»</span>
          <p>{CONTACTS.address}</p>
          <p><Link href="/privacy">Политика обработки персональных данных</Link></p>
        </div>
        <div className="contact" aria-label="Контакты">
          {CONTACTS.phones.map((p) => (
            <a key={p} href={`tel:${p.replace(/[^\d+]/g, "")}`}>{p}</a>
          ))}
          <a href={CONTACTS.instagram} target="_blank" rel="noopener">Instagram @dobrahata</a>
          <a href={`mailto:${CONTACTS.email}`}>{CONTACTS.email}</a>
        </div>
      </footer>

      <div className="mini">
        <div>
          <div className="mini__lbl">Итого{bath ? " с баней" : ""}{q.lastMinute ? `, −${LAST_MINUTE.percent}%` : ""}{stay ? `, ${stayWord}` : ""}, залог отдельно</div>
          <div className="mini__sum">{formatRub(q.total)}<small>руб.</small></div>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setBooking(true)}>Забронировать</button>
      </div>

      <BookingSheet
        open={booking}
        onClose={() => setBooking(false)}
        q={q}
        dateLabel={stay ? `${rangeText} (${stayWord})` : dateLabel(date)}
      />
    </main>
  );
}

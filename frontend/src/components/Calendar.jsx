import { useEffect, useMemo, useState } from 'react';
import { toIsoDate, todayIso } from '../utils/format';

const DOW = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Month picker. Past dates and anything in `unavailable` are disabled.
 * `unavailable` is a Set of yyyy-mm-dd strings.
 */
export default function Calendar({ value, onChange, unavailable, checking, onMonthChange }) {
  const today = todayIso();
  const initial = value ? new Date(`${value}T00:00:00`) : new Date();
  const [cursor, setCursor] = useState({
    year: initial.getFullYear(),
    month: initial.getMonth(),
  });

  // Lets the parent load availability for exactly the month on screen.
  useEffect(() => {
    onMonthChange?.(cursor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor.year, cursor.month]);

  const cells = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    // Monday-first offset
    const leading = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();

    const list = Array.from({ length: leading }, () => null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      list.push(toIsoDate(new Date(cursor.year, cursor.month, day)));
    }
    return list;
  }, [cursor]);

  const atFirstMonth = useMemo(() => {
    const now = new Date();
    return cursor.year === now.getFullYear() && cursor.month === now.getMonth();
  }, [cursor]);

  const shift = (delta) => {
    setCursor((prev) => {
      const next = new Date(prev.year, prev.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  return (
    <div className="calendar">
      <div className="calendar__head">
        <button
          type="button"
          className="calendar__nav"
          onClick={() => shift(-1)}
          disabled={atFirstMonth}
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="calendar__month">
          {MONTHS[cursor.month]} {cursor.year}
        </span>
        <button
          type="button"
          className="calendar__nav"
          onClick={() => shift(1)}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="calendar__grid">
        {DOW.map((d) => (
          <div className="calendar__dow" key={d}>
            {d}
          </div>
        ))}

        {cells.map((iso, i) => {
          if (!iso) {
            return <div className="calendar__day is-empty" key={`empty-${i}`} />;
          }
          const isPast = iso < today;
          const isTaken = unavailable?.has(iso);
          const day = Number(iso.slice(8, 10));

          return (
            <button
              type="button"
              key={iso}
              className={`calendar__day${value === iso ? ' is-selected' : ''}`}
              disabled={isPast || isTaken}
              onClick={() => onChange(iso)}
              title={isTaken ? 'Already booked' : undefined}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="calendar__legend">
        <span>
          <span className="legend-dot" style={{ background: 'var(--gold)' }} />
          Selected
        </span>
        <span>
          <span className="legend-dot" style={{ background: 'var(--offwhite)' }} />
          Unavailable
        </span>
        {checking && <span style={{ marginLeft: 'auto' }}>Checking dates…</span>}
      </div>
    </div>
  );
}

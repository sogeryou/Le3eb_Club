import { useState } from 'react';
import { latestBirthDate } from '@shared/registration';
import type { WelcomeCopy } from './welcomeCopy';

const dayCount = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();
const numberRange = (count: number) => Array.from({ length: count }, (_, i) => i + 1);
const pad = (value: number) => String(value).padStart(2, '0');

export function BirthDatePicker({ copy, language, value, onClose, onConfirm }: {
  copy: WelcomeCopy; language: 'ar' | 'en'; value: string; onClose: () => void; onConfirm: (value: string) => void;
}) {
  const [maxYear, maxMonth, maxDay] = latestBirthDate().split('-').map(Number);
  const [date, setDate] = useState(() => (value || latestBirthDate()).split('-').map(Number));
  const [year, month, day] = date;
  const months = year === maxYear ? maxMonth : 12;
  const days = year === maxYear && month === maxMonth ? maxDay : dayCount(year, month);
  const choose = (nextYear: number, nextMonth: number, nextDay: number) => {
    const clampedMonth = Math.min(nextMonth, nextYear === maxYear ? maxMonth : 12);
    const clampedDay = Math.min(nextDay,
      nextYear === maxYear && clampedMonth === maxMonth ? maxDay : dayCount(nextYear, clampedMonth));
    setDate([nextYear, clampedMonth, clampedDay]);
  };
  return <div className="wa-scrim" onClick={onClose}>
    <section className="wa-sheet" role="dialog" aria-modal="true" aria-labelledby="wa-date-title"
      onClick={event => event.stopPropagation()} onKeyDown={event => { if (event.key === 'Escape') onClose(); }}>
      <div className="wa-sheet-handle" />
      <h2 id="wa-date-title">{copy.birth}</h2>
      <div className="wa-date-fields" dir="ltr">
        <label>{copy.day}<select autoFocus value={day} onChange={event => choose(year, month, Number(event.target.value))}>
          {numberRange(days).map(item => <option key={item}>{item}</option>)}
        </select></label>
        <label>{copy.month}<select value={month} onChange={event => choose(year, Number(event.target.value), day)}>
          {numberRange(months).map(item => <option key={item} value={item}>
            {new Intl.DateTimeFormat(language, { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2000, item - 1, 1)))}
          </option>)}
        </select></label>
        <label>{copy.year}<select value={year} onChange={event => choose(Number(event.target.value), month, day)}>
          {numberRange(maxYear - 1899).map((_, i) => maxYear - i).map(item => <option key={item}>{item}</option>)}
        </select></label>
      </div>
      <button className="wa-primary" type="button" onClick={() => onConfirm(`${year}-${pad(month)}-${pad(day)}`)}>{copy.confirmDate}</button>
    </section>
  </div>;
}

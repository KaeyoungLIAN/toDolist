import React, { useState, useRef, useEffect, useCallback } from "react";
import { t, monthNames, weekdayShort } from "../i18n";

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function DateBar({ dateStr, weekday, onPrev, onNext, onToday, onRefresh, onGoToDate, lang, yesterdayCompleted, weekCompleted }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Calendar popup state
  const parts = dateStr ? dateStr.split("-") : [];
  const selDate = parts.length === 3
    ? { y: parseInt(parts[0], 10), m: parseInt(parts[1], 10) - 1, d: parseInt(parts[2], 10) }
    : null;
  const [viewYear, setViewYear] = useState(selDate?.y ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(selDate?.m ?? new Date().getMonth());

  // Sync viewport when date changes externally
  useEffect(() => {
    if (selDate) { setViewYear(selDate.y); setViewMonth(selDate.m); }
  }, [dateStr]);

  // Click-outside
  useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const dim = daysInMonth(viewYear, viewMonth);
  const fd = firstDayOfMonth(viewYear, viewMonth);
  const wd = weekdayShort(lang);
  const mn = monthNames(lang);

  const cells = [];
  for (let i = 0; i < fd; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);

  const handleDayClick = useCallback((day) => {
    const d = new Date(viewYear, viewMonth, day);
    onGoToDate(d);
    setOpen(false);
  }, [viewYear, viewMonth, onGoToDate]);

  const goPrevMonth = () => {
    if (viewMonth === 0) { setViewYear((v) => v - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const goNextMonth = () => {
    if (viewMonth === 11) { setViewYear((v) => v + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  return (
    <div id="datebar">
      <div id="date-nav">
        <button className="nav-btn" onClick={onPrev} aria-label="Previous day">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div id="date-display-wrapper" ref={wrapperRef}>
          <span id="date-display" onClick={() => setOpen((v) => !v)}>{dateStr}  {weekday}</span>
          {open && (
            <div className="datebar-popup">
              <div className="datebar-popup-header">
                <button type="button" className="datebar-nav-btn" onClick={goPrevMonth} aria-label="Previous month">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <span className="datebar-popup-title">{mn[viewMonth]} {viewYear}</span>
                <button type="button" className="datebar-nav-btn" onClick={goNextMonth} aria-label="Next month">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
              <div className="datebar-weekdays">
                {wd.map((name, i) => (<span key={i} className="datebar-weekday">{name}</span>))}
              </div>
              <div className="datebar-grid">
                {cells.map((day, i) => {
                  if (day === null) return <span key={`e-${i}`} className="datebar-empty" />;
                  const dayKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const isToday = dayKey === todayStr;
                  const isSel = selDate && day === selDate.d && viewMonth === selDate.m && viewYear === selDate.y;
                  return (
                    <button key={day} type="button"
                      className={`datebar-day${isToday ? " today" : ""}${isSel ? " selected" : ""}`}
                      onClick={() => handleDayClick(day)}
                    >{day}</button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <button className="nav-btn" onClick={onNext} aria-label="Next day">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        {dateStr !== todayStr && (
          <button id="today-btn" onClick={onToday}>{t(lang, "today")}</button>
        )}
      </div>
      {(yesterdayCompleted > 0 || weekCompleted > 0) && (
        <span className="datebar-stats">
          {yesterdayCompleted > 0 && <span>{t(lang, "yesterday")} {yesterdayCompleted}</span>}
          {yesterdayCompleted > 0 && weekCompleted > 0 && <span className="stats-dot">·</span>}
          {weekCompleted > 0 && <span>{t(lang, "thisWeek")} {weekCompleted}</span>}
        </span>
      )}
      <div id="datebar-right">
        <button id="refresh-btn" onClick={onRefresh}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      </button>
      </div>
    </div>
  );
}

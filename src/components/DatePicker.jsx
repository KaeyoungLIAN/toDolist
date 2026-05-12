import React, { useState, useRef, useEffect } from "react";
import { t, weekdayNames } from "../i18n";

const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

/**
 * DatePicker — Custom calendar popup replacing <input type="date">
 * Props: value (string "YYYY-MM-DD"), onChange (fn), lang (string)
 */
export default function DatePicker({ value, onChange, lang }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(null);
  const [viewMonth, setViewMonth] = useState(null);
  const wrapperRef = useRef(null);

  // Parse selected date
  const parts = value ? value.split("-") : [];
  const selected =
    parts.length === 3
      ? { y: parseInt(parts[0], 10), m: parseInt(parts[1], 10) - 1, d: parseInt(parts[2], 10) }
      : null;

  // Init viewport on open
  useEffect(() => {
    if (open) {
      if (selected) {
        setViewYear(selected.y);
        setViewMonth(selected.m);
      } else {
        const now = new Date();
        setViewYear(now.getFullYear());
        setViewMonth(now.getMonth());
      }
    }
  }, [open]);

  // Click-outside close
  useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const dim = viewYear !== null && viewMonth !== null ? daysInMonth(viewYear, viewMonth) : 0;
  const fd = viewYear !== null && viewMonth !== null ? firstDayOfMonth(viewYear, viewMonth) : 0;

  const wd = weekdayNames(lang);

  // Build grid cells
  const cells = [];
  for (let i = 0; i < fd; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);

  const handleDayClick = (day) => {
    const y = viewYear;
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    onChange(`${y}-${m}-${d}`);
    setOpen(false);
  };

  const goPrev = () => {
    if (viewMonth === 0) {
      setViewYear((v) => v - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (viewMonth === 11) {
      setViewYear((v) => v + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  return (
    <div className="datepicker-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="datepicker-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-label="Pick date"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span>{value || ""}</span>
      </button>

      {open && (
        <div className="datepicker-popup">
          {/* Header */}
          <div className="datepicker-header">
            <button type="button" className="datepicker-nav-btn" onClick={goPrev} aria-label="Previous month">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="datepicker-title">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" className="datepicker-nav-btn" onClick={goNext} aria-label="Next month">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Weekday headers */}
          <div className="datepicker-weekdays">
            {wd.map((name, i) => (
              <span key={i} className="datepicker-weekday">{name}</span>
            ))}
          </div>

          {/* Day grid */}
          <div className="datepicker-grid">
            {cells.map((day, i) => {
              if (day === null) {
                return <span key={`e-${i}`} className="datepicker-empty" />;
              }
              const dayKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isToday = dayKey === todayKey;
              const isSel = selected && day === selected.d && viewMonth === selected.m && viewYear === selected.y;
              return (
                <button
                  key={day}
                  type="button"
                  className={`datepicker-day${isToday ? " today" : ""}${isSel ? " selected" : ""}`}
                  onClick={() => handleDayClick(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

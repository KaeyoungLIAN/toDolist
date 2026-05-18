import React, { useState, useRef, useEffect, useCallback } from "react";
import { t } from "../i18n";

/**
 * TimePicker — Custom time picker replacing <input type="time">
 * Props: value (string "HH:MM"), onChange (fn)
 */
export default function TimePicker({ value, onChange, lang }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const prevOpenRef = useRef(false);
  const inputRef = useRef(null);
  const [editing, setEditing] = useState(null); // 'hour', 'minute', or null

  // Parse current value
  const parts = value ? value.split(":") : [];
  const initHour = parts.length === 2 ? parseInt(parts[0], 10) : 0;
  const initMin = parts.length === 2 ? parseInt(parts[1], 10) : 0;

  const [editHour, setEditHour] = useState(initHour);
  const [editMin, setEditMin] = useState(initMin);

  // Wheel handler: scroll up (deltaY<0) decrements, scroll down increments
  const handleWheel = useCallback((setter, maxVal) => (e) => {
    e.preventDefault();
    setter((v) => {
      if (e.deltaY < 0) return (v - 1 + maxVal) % maxVal;
      return (v + 1) % maxVal;
    });
  }, []);

  // Sync edit state when value changes externally
  useEffect(() => {
    setEditHour(initHour);
    setEditMin(initMin);
  }, [value]);

  // Reset edit values on open
  useEffect(() => {
    if (open) {
      setEditHour(initHour);
      setEditMin(initMin);
      setEditing(null);
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

  // Auto-focus and select input content when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // Auto-commit edit state when popup closes
  useEffect(() => {
    if (prevOpenRef.current && !open) {
      const h = String(editHour).padStart(2, "0");
      const m = String(editMin).padStart(2, "0");
      onChange(`${h}:${m}`);
    }
    prevOpenRef.current = open;
  }, [open, editHour, editMin, onChange]);

  const wrapInc = (val, max) => (val + 1) % max;
  const wrapDec = (val, max) => (val - 1 + max) % max;

  const handleSelect = () => {
    const h = String(editHour).padStart(2, "0");
    const m = String(editMin).padStart(2, "0");
    onChange(`${h}:${m}`);
    setOpen(false);
  };

  const handleInputChange = (e, setter, maxVal) => {
    const raw = e.target.value;
    // Allow empty for clearing
    if (raw === "") {
      setter(0);
      return;
    }
    const num = parseInt(raw.replace(/\D/g, ""), 10);
    if (isNaN(num)) return;
    if (num >= maxVal) {
      setter(maxVal - 1);
    } else {
      setter(num);
    }
  };

  const handleInputKeyDown = (e, field) => {
    if (e.key === "Enter") {
      setEditing(null);
    }
  };

  const hStr = String(editHour).padStart(2, "0");
  const mStr = String(editMin).padStart(2, "0");

  const renderValueCell = (field, valueStr, setter, maxVal) => {
    if (editing === field) {
      return (
        <input
          ref={inputRef}
          className="timepicker-input"
          type="text"
          inputMode="numeric"
          value={valueStr}
          onChange={(e) => handleInputChange(e, setter, maxVal)}
          onKeyDown={(e) => handleInputKeyDown(e, field)}
          onBlur={() => setEditing(null)}
          maxLength={2}
          autoComplete="off"
        />
      );
    }
    return (
      <span
        className="timepicker-value"
        onClick={() => setEditing(field)}
        onWheel={handleWheel(setter, maxVal)}
      >
        {valueStr}
      </span>
    );
  };

  return (
    <div className="timepicker-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="timepicker-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-label={t(lang, "pickTime")}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>{value || ""}</span>
      </button>

      {open && (
        <div className="timepicker-popup">
          <div className="timepicker-columns">
            {/* Hour column */}
            <div className="timepicker-column">
              <button
                type="button"
                className="timepicker-arrow"
                onClick={() => setEditHour((h) => wrapInc(h, 24))}
                aria-label={t(lang, "increaseHour")}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </button>
              {renderValueCell("hour", hStr, setEditHour, 24)}
              <button
                type="button"
                className="timepicker-arrow"
                onClick={() => setEditHour((h) => wrapDec(h, 24))}
                aria-label={t(lang, "decreaseHour")}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>

            <span className="timepicker-sep">:</span>

            {/* Minute column */}
            <div className="timepicker-column">
              <button
                type="button"
                className="timepicker-arrow"
                onClick={() => setEditMin((m) => wrapInc(m, 60))}
                aria-label={t(lang, "increaseMinute")}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </button>
              {renderValueCell("minute", mStr, setEditMin, 60)}
              <button
                type="button"
                className="timepicker-arrow"
                onClick={() => setEditMin((m) => wrapDec(m, 60))}
                aria-label={t(lang, "decreaseMinute")}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useRef, useEffect } from "react";
import { t } from "../i18n";
import DatePicker from "./DatePicker";
import TimePicker from "./TimePicker";

function fmt(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const DAYS = [
  { key: 1, label: "M" }, { key: 2, label: "T" }, { key: 3, label: "W" },
  { key: 4, label: "T" }, { key: 5, label: "F" }, { key: 6, label: "S" },
  { key: 0, label: "S" },
];
const DAYS_MAP = { 0: "S", 1: "M", 2: "T", 3: "W", 4: "T", 5: "F", 6: "S" };

export default function BottomPanel({ editingId, editText, editRtype, editRdata, onSave, onCancelEdit, dateStr, lang }) {
  const [content, setContent] = useState("");
  const [taskMode, setTaskMode] = useState("normal"); // "normal" | "scheduled"
  const [rtype, setRtype] = useState("once");
  const [onceDate, setOnceDate] = useState(dateStr);
  const [onceTime, setOnceTime] = useState("14:30");
  const [activeDays, setActiveDays] = useState(new Set());
  const [weeklyTime, setWeeklyTime] = useState("09:00");
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef(null);

  // Auto-expand when editing
  useEffect(() => {
    if (editingId !== null) {
      setContent(editText);
      setTaskMode("scheduled");
      setRtype(editRtype);
      if (editRtype === "once" && editRdata?.datetime) {
        const p = editRdata.datetime.split("T");
        setOnceDate(p[0]);
        setOnceTime(p[1]?.substring(0, 5) || "14:30");
      } else if (editRtype === "weekly") {
        setActiveDays(new Set(editRdata?.days || []));
        setWeeklyTime(editRdata?.time || "09:00");
      }
      setExpanded(true);
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [editingId]);

  useEffect(() => { if (!onceDate) setOnceDate(dateStr); }, [dateStr]);

  const toggleDay = (d) => {
    setActiveDays((prev) => {
      const next = new Set(prev);
      next.has(d) ? next.delete(d) : next.add(d);
      return next;
    });
  };

  const handleSubmit = () => {
    const text = content.trim();
    if (!text) return;

    if (editingId === null && taskMode === "normal") {
      // Normal task: no reminder, due today
      const rd = { datetime: `${dateStr}T23:59:00`, days: [], time: "09:00" };
      onSave(text, "once", rd);
      setContent("");
      inputRef.current?.focus();
      return;
    }

    // Scheduled task
    const rd =
      rtype === "once"
        ? { datetime: `${onceDate || dateStr}T${onceTime}:00`, days: [], time: "09:00" }
        : { datetime: null, days: activeDays.size ? [...activeDays] : [1], time: weeklyTime };
    onSave(text, rtype, rd);
    setContent("");
    if (editingId === null) {
      setRtype("once");
      setActiveDays(new Set());
      setExpanded(false);
      setTaskMode("normal");
    }
    inputRef.current?.focus();
  };

  const handleKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  // Switch mode
  const switchMode = (mode) => {
    setTaskMode(mode);
    if (mode === "scheduled" && !expanded) {
      setExpanded(true);
    }
    if (mode === "normal") {
      setExpanded(false);
    }
    inputRef.current?.focus();
  };

  // Summary text for collapsed state
  const summaryLabel = rtype === "once"
    ? `${onceDate || dateStr} ${onceTime}`
    : `${[...activeDays].sort().map((d) => DAYS_MAP[d]).filter(Boolean).join(" ") || "Mon"} ${weeklyTime}`;

  const summaryIcon = rtype === "once" ? (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ) : (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-9-9" /><path d="M12 6v6l3 2" />
    </svg>
  );

  return (
    <div id="bottom-panel" className={taskMode === "scheduled" ? "has-reminder" : ""}>
      <div id="input-row">
        <input
          ref={inputRef}
          type="text"
          id="task-input"
          placeholder={t(lang, "whatNeedsDone")}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKey}
          autoComplete="off"
        />
        <button id="add-btn" className={editingId ? "editing" : ""} onClick={handleSubmit}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>{editingId ? t(lang, "update") : t(lang, "add")}</span>
        </button>
      </div>

      {/* Mode toggle pills */}
      <div id="mode-toggle">
        <button
          className={"mode-pill" + (taskMode === "normal" ? " active" : "")}
          onClick={() => switchMode("normal")}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          <span>Normal</span>
        </button>
        <button
          className={"mode-pill" + (taskMode === "scheduled" ? " active" : "")}
          onClick={() => switchMode("scheduled")}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>Scheduled</span>
        </button>
      </div>

      {/* Scheduled reminder options — collapsible */}
      <div id="reminder-collapse" className={taskMode === "scheduled" ? "open" : ""}>
        <div id="reminder-inner">
            <button
              id="reminder-summary"
              className={expanded ? "options-open" : ""}
              onClick={() => setExpanded(!expanded)}
              aria-label="Toggle reminder options"
            >
            <span id="reminder-summary-icon">{summaryIcon}</span>
            <span id="reminder-summary-text">{summaryLabel}</span>
            <svg
              id="reminder-chevron"
              width="12" height="12"
              viewBox="0 0 24 24"
              fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <div id="reminder-options" className={expanded ? "open" : ""}>
            <div id="reminder-type">
              <label className="radio-label">
                <input type="radio" name="rtype" value="once" checked={rtype === "once"} onChange={() => setRtype("once")} />
                <span className="radio-dot" />
                <span>{t(lang, "oneTime")}</span>
              </label>
              <label className="radio-label">
                <input type="radio" name="rtype" value="weekly" checked={rtype === "weekly"} onChange={() => setRtype("weekly")} />
                <span className="radio-dot" />
                <span>{t(lang, "weekly")}</span>
              </label>
            </div>
            {rtype === "once" ? (
              <div id="once-options">
                <DatePicker value={onceDate} onChange={setOnceDate} lang={lang} />
                <TimePicker value={onceTime} onChange={setOnceTime} />
              </div>
            ) : (
              <div id="weekly-options">
                <div id="day-picker">
                  {DAYS.map((d) => (
                    <button
                      key={d.key}
                      className={"day-btn" + (activeDays.has(d.key) ? " active" : "")}
                      onClick={() => toggleDay(d.key)}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <TimePicker value={weeklyTime} onChange={setWeeklyTime} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

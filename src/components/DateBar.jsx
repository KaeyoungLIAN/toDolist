import React from "react";
import { t } from "../i18n";

export default function DateBar({ dateStr, weekday, onPrev, onNext, onToday, onRefresh, lang }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  return (
    <div id="datebar">
      <div id="date-nav">
        <button className="nav-btn" onClick={onPrev}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span id="date-display">{dateStr}  {weekday}</span>
        <button className="nav-btn" onClick={onNext}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        {dateStr !== todayStr && (
          <button id="today-btn" onClick={onToday}>{t(lang, "today")}</button>
        )}
      </div>
      <button id="refresh-btn" onClick={onRefresh}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      </button>
    </div>
  );
}

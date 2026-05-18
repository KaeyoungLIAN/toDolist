import React, { useState, useRef, useEffect } from "react";
import DatePicker from "./DatePicker";
import TimePicker from "./TimePicker";
import { t, dayLabels } from "../i18n";

const DAY_KEYS = [1, 2, 3, 4, 5, 6, 0];

export default function ScheduledOptions({
  lang, rtype, onRtypeChange,
  onceDate, onOnceDateChange, onceTime, onOnceTimeChange,
  activeDays, onToggleDay, weeklyTime, onWeeklyTimeChange,
  linkType, onLinkTypeChange, linkUrl, onLinkUrlChange,
  meetingCode, onMeetingCodeChange,
  advanceMin, onAdvanceMinChange,
}) {
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const advanceRef = useRef(null);
  const ADVANCE_OPTIONS = [0, 5, 10, 15, 30, 60];

  // Click-outside close for advance popup
  useEffect(() => {
    if (!advanceOpen) return;
    const handle = (e) => {
      if (advanceRef.current && !advanceRef.current.contains(e.target)) {
        setAdvanceOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [advanceOpen]);

  // Close advance popup when switching reminder type
  useEffect(() => {
    setAdvanceOpen(false);
  }, [rtype]);

  const advanceLabel = (m) => {
    if (m === 0) return t(lang, "remindOnTime");
    return t(lang, "advanceFormat").replace("{0}", String(m));
  };

  return (
    <div id="reminder-inner">
      <div id="scheduled-row">
        <div className="segmented">
          <button
            className={"seg-btn" + (rtype === "once" ? " active" : "")}
            onClick={() => onRtypeChange("once")}
          >
            {t(lang, "oneTime")}
          </button>
          <button
            className={"seg-btn" + (rtype === "weekly" ? " active" : "")}
            onClick={() => onRtypeChange("weekly")}
          >
            {t(lang, "weekly")}
          </button>
        </div>
        {rtype === "once" ? (
          <div className="picker-line">
            <DatePicker value={onceDate} onChange={onOnceDateChange} lang={lang} />
            <span className="picker-sep">–</span>
            <TimePicker value={onceTime} onChange={onOnceTimeChange} lang={lang} />
            <div className="advance-wrapper" ref={advanceRef}>
              <button className="advance-trigger" onClick={() => setAdvanceOpen(!advanceOpen)}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {advanceLabel(advanceMin)}
              </button>
              {advanceOpen && (
                <div className="advance-popup">
                  {ADVANCE_OPTIONS.map((m) => (
                    <button key={m} className={"advance-option" + (m === advanceMin ? " active" : "")}
                      onClick={() => { onAdvanceMinChange(m); setAdvanceOpen(false); }}
                    >{advanceLabel(m)}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="picker-line">
            <div id="day-picker">
              {(() => {
                const labels = dayLabels(lang);
                return DAY_KEYS.map((key, i) => (
                  <button
                    key={key}
                    className={"day-btn" + (activeDays.has(key) ? " active" : "")}
                    onClick={() => onToggleDay(key)}
                  >
                    {labels[i]}
                  </button>
                ));
              })()}
            </div>
            <TimePicker value={weeklyTime} onChange={onWeeklyTimeChange} lang={lang} />
            <div className="advance-wrapper" ref={advanceRef}>
              <button className="advance-trigger" onClick={() => setAdvanceOpen(!advanceOpen)}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {advanceLabel(advanceMin)}
              </button>
              {advanceOpen && (
                <div className="advance-popup">
                  {ADVANCE_OPTIONS.map((m) => (
                    <button key={m} className={"advance-option" + (m === advanceMin ? " active" : "")}
                      onClick={() => { onAdvanceMinChange(m); setAdvanceOpen(false); }}
                    >{advanceLabel(m)}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Link type segmented + inline input */}
      <div className="picker-line" style={{ marginTop: 8 }}>
        <div className="segmented">
          <button
            className={"seg-btn" + (linkType === "url" ? " active" : "")}
            onClick={() => onLinkTypeChange("url")}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            {t(lang, "webLink")}
          </button>
          <button
            className={"seg-btn" + (linkType === "meeting" ? " active" : "")}
            onClick={() => onLinkTypeChange("meeting")}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            {t(lang, "meetingLink")}
          </button>
        </div>
        {linkType === "url" ? (
          <input
            type="url"
            className="link-url-input"
            placeholder={t(lang, "linkPlaceholder")}
            value={linkUrl}
            onChange={(e) => onLinkUrlChange(e.target.value)}
            autoComplete="off"
          />
        ) : (
          <input
            type="text"
            className="link-url-input"
            placeholder={t(lang, "meetingCode")}
            value={meetingCode}
            onChange={(e) => onMeetingCodeChange(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
            autoComplete="off"
          />
        )}
      </div>
    </div>
  );
}

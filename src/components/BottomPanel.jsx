import React, { useState, useRef, useEffect } from "react";
import { t } from "../i18n";
import ScheduledOptions from "./ScheduledOptions";

function fmt(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function BottomPanel({ editingId, editText, editRtype, editRdata, editLinkUrl, onSave, onCancelEdit, dateStr, lang, onEmptySubmit, showToast }) {
  const [content, setContent] = useState("");
  const [taskMode, setTaskMode] = useState("normal");
  const [rtype, setRtype] = useState("once");
  const [onceDate, setOnceDate] = useState(dateStr);
  const [onceTime, setOnceTime] = useState("14:30");
  const [activeDays, setActiveDays] = useState(new Set());
  const [weeklyTime, setWeeklyTime] = useState("09:00");
  const [linkType, setLinkType] = useState("url");
  const [linkUrl, setLinkUrl] = useState("");
  const [meetingCode, setMeetingCode] = useState("");
  const [advanceMinutes, setAdvanceMinutes] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef(null);
  const userSetOnceRef = useRef(false);

  // Auto-expand when editing
  useEffect(() => {
    if (editingId !== null) {
      setContent(editText);
      setTaskMode("scheduled");
      setRtype(editRtype);
      const wxMatch = (editLinkUrl || "").match(/wemeet:\/\/page\/inmeeting\?meeting_code=([a-zA-Z0-9]+)/);
      if (wxMatch) {
        setLinkType("meeting");
        setMeetingCode(wxMatch[1]);
        setLinkUrl("");
      } else {
        setLinkType("url");
        setLinkUrl(editLinkUrl || "");
        setMeetingCode("");
      }
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

  useEffect(() => { if (!userSetOnceRef.current) setOnceDate(dateStr); }, [dateStr]);

  const toggleDay = (d) => {
    setActiveDays((prev) => {
      const next = new Set(prev);
      next.has(d) ? next.delete(d) : next.add(d);
      return next;
    });
  };

  const isValidUrl = (url) => {
    try {
      const u = new URL(url);
      return ['https:', 'http:', 'mailto:', 'tel:'].includes(u.protocol);
    } catch {
      return url.startsWith('wemeet://');
    }
  };

  const handleSubmit = () => {
    const text = content.trim();
    if (!text) {
      if (onEmptySubmit) onEmptySubmit();
      return;
    }

    const rawUrl = linkType === "meeting" && meetingCode.trim()
      ? `wemeet://page/inmeeting?meeting_code=${meetingCode.trim()}`
      : linkType === "meeting" ? ""
      : linkUrl;
    if (rawUrl && !isValidUrl(rawUrl)) {
      showToast(t(lang, "invalidLink"));
      return;
    }

    const finalLinkUrl = linkType === "meeting" && meetingCode.trim()
      ? `wemeet://page/inmeeting?meeting_code=${meetingCode.trim()}`
      : linkType === "meeting" ? ""
      : linkUrl;

    if (editingId === null && taskMode === "normal") {
      const rd = { datetime: `${dateStr}T23:59:00`, days: [], time: "09:00" };
      onSave(text, "once", rd);
      setContent("");
      setLinkUrl("");
      setMeetingCode("");
      inputRef.current?.focus();
      return;
    }

    const rd =
      rtype === "once"
        ? { datetime: `${onceDate || dateStr}T${onceTime}:00`, days: [], time: "09:00", advance_minutes: advanceMinutes }
        : { datetime: null, days: activeDays.size ? [...activeDays] : [1], time: weeklyTime, advance_minutes: advanceMinutes };
    onSave(text, rtype, rd, finalLinkUrl);
    setContent("");
    setLinkUrl("");
    setMeetingCode("");
    if (editingId === null) {
      setRtype("once");
      setActiveDays(new Set());
      setAdvanceMinutes(0);
      setExpanded(false);
      setTaskMode("normal");
      setOnceDate(dateStr);
      setOnceTime("14:30");
      userSetOnceRef.current = false;
    }
    inputRef.current?.focus();
  };

  const handleKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  const switchMode = (mode) => {
    setTaskMode(mode);
    if (mode === "scheduled" && !expanded) setExpanded(true);
    if (mode === "normal") setExpanded(false);
    inputRef.current?.focus();
  };

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
          <span>{editingId ? t(lang, "updateTask") : t(lang, "addTask")}</span>
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
          <span>{t(lang, "normal")}</span>
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
          <span>{t(lang, "scheduled")}</span>
        </button>
      </div>

      {/* Scheduled options — collapsible */}
      <div id="reminder-collapse" className={taskMode === "scheduled" ? "open" : ""}>
        <ScheduledOptions
          lang={lang}
          rtype={rtype}
          onRtypeChange={setRtype}
          onceDate={onceDate}
          onOnceDateChange={(v) => { userSetOnceRef.current = true; setOnceDate(v); }}
          onceTime={onceTime}
          onOnceTimeChange={setOnceTime}
          activeDays={activeDays}
          onToggleDay={toggleDay}
          weeklyTime={weeklyTime}
          onWeeklyTimeChange={setWeeklyTime}
          linkType={linkType}
          onLinkTypeChange={setLinkType}
          linkUrl={linkUrl}
          onLinkUrlChange={setLinkUrl}
          meetingCode={meetingCode}
          onMeetingCodeChange={setMeetingCode}
          advanceMin={advanceMinutes}
          onAdvanceMinChange={setAdvanceMinutes}
        />
      </div>
    </div>
  );
}

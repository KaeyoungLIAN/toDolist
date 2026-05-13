import React, { useState, useRef, useEffect, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

const HELP_EN = {
  title: "Task Operations",
  items: [
    { icon: "check", label: "Checkbox — mark complete / undo" },
    { icon: "pin", label: "Pin — keep at top of list" },
    { icon: "edit", label: "Edit — modify text or reminder" },
    { icon: "delete", label: "Delete — swipe away, 5s undo" },
  ],
  footer: "Enter add · Esc close edit · swipe delete with undo",
};
const HELP_ZH = {
  title: "任务操作说明",
  items: [
    { icon: "check", label: "勾选 — 标记完成 / 撤销" },
    { icon: "pin", label: "置顶 — 固定在列表顶部" },
    { icon: "edit", label: "编辑 — 修改内容或提醒" },
    { icon: "delete", label: "删除 — 滑出屏幕，5秒内可撤销" },
  ],
  footer: "Enter 添加 · Esc 关闭编辑 · 删除可撤销",
};

const SVG_ICONS = {
  check: <polyline points="20 6 9 17 4 12" />,
  pin: <><line x1="12" y1="3" x2="12" y2="16" /><polyline points="7 10 12 3 17 10" /></>,
  edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
  delete: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
};

export default function TitleBar({ onOpenSettings, showSearch, onToggleSearch, lang }) {
  const [isPinned, setIsPinned] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const helpRef = useRef(null);

  const handleCloseHelp = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => { setShowHelp(false); setIsClosing(false); }, 150);
  }, []);

  useEffect(() => {
    if (!showHelp || isClosing) return;
    const handler = (e) => {
      if (helpRef.current && !helpRef.current.contains(e.target)) handleCloseHelp();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showHelp, isClosing, handleCloseHelp]);

  const handlePin = async () => {
    try {
      const w = getCurrentWindow();
      const current = await w.isAlwaysOnTop();
      await w.setAlwaysOnTop(!current);
      setIsPinned(!current);
    } catch (_) {}
  };
  const handleMin = async () => { try { await getCurrentWindow().minimize(); } catch (_) {} };
  const handleClose = async () => { try { await getCurrentWindow().hide(); } catch (_) {} };

  const help = lang === "zh" ? HELP_ZH : HELP_EN;

  return (
    <div id="titlebar" data-tauri-drag-region>
      <div id="title-left">
        <span id="title-dot" />
        <span id="title-text">GlassTodo</span>
        <button className="title-btn help-btn" title={lang === "zh" ? "使用说明" : "How to use"}
          onClick={(e) => { e.stopPropagation(); showHelp ? handleCloseHelp() : setShowHelp(true); }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>
        {(showHelp || isClosing) && (
          <div className={"help-popover" + (isClosing ? " closing" : " open")} ref={helpRef}>
            <div className="help-popover-title">{help.title}</div>
            <div className="help-popover-list">
              {help.items.map((item, i) => (
                <div className="help-item" key={i}>
                  <svg className="help-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    {SVG_ICONS[item.icon]}
                  </svg>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <div className="help-popover-footer">{help.footer}</div>
          </div>
        )}
        <button className={"title-btn search-toggle" + (showSearch ? " active" : "")} id="search-toggle-btn" title="Search" onClick={onToggleSearch}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </div>
      <div id="title-controls">
        <button className="title-btn" id="settings-btn" title="Settings" onClick={onOpenSettings}>
          <svg className="gear-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
        <button className={"title-btn" + (isPinned ? " active" : "")} id="pin-btn" title="Always on top" onClick={handlePin}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a5 5 0 0 0-5 5c0 3 5 8 5 8s5-5 5-8a5 5 0 0 0-5-5z" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="8" y1="22" x2="16" y2="22" />
          </svg>
        </button>
        <button className="title-btn" id="min-btn" title="Minimize" onClick={handleMin}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button className="title-btn close-btn" id="close-btn" title="Hide to tray" onClick={handleClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

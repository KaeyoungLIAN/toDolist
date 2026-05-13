import React, { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

export default function TitleBar({ onOpenSettings, showSearch, onToggleSearch, lang }) {
  const [showHelp, setShowHelp] = useState(false);
  const [helpClosing, setHelpClosing] = useState(false);
  const helpRef = useRef(null);
  const handleMin = async () => { try { await invoke("minimize_window"); } catch (e) { console.error("minimize:", e); } };
  const handleClose = async () => { try { await invoke("hide_window"); } catch (e) { console.error("hide:", e); } };

  const closeHelp = () => {
    setHelpClosing(true);
    setTimeout(() => { setShowHelp(false); setHelpClosing(false); }, 150);
  };

  // Click-outside close for help popover
  useEffect(() => {
    if (!showHelp) return;
    const handle = (e) => {
      if (helpRef.current && !helpRef.current.contains(e.target) && e.target.id !== "help-btn") {
        closeHelp();
      }
    };
    const handleKey = (e) => { if (e.key === "Escape") closeHelp(); };
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", handleKey);
    };
  }, [showHelp]);

  return (
    <>
      <div id="titlebar" data-tauri-drag-region>
        <div id="title-left">
          <span id="title-dot" />
          <span id="title-text">GlassTodo</span>
          <button
            className="title-btn help-btn"
            id="help-btn"
            title={lang === "zh" ? "如何使用" : "How to use"}
            onClick={(e) => { e.stopPropagation(); showHelp ? closeHelp() : setShowHelp(true); }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>
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

      {showHelp && (
        <div
          ref={helpRef}
          className={"help-popover" + (helpClosing ? " closing" : " open")}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="help-popover-title">{lang === "zh" ? "如何使用" : "How to use"}</div>
          <div className="help-popover-list">
            <div className="help-item">
              <svg className="help-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              <span>{lang === "zh" ? "点击复选框标记完成" : "Click checkbox to mark complete"}</span>
            </div>
            <div className="help-item">
              <svg className="help-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span>{lang === "zh" ? "点击铅笔编辑任务" : "Click pencil to edit task"}</span>
            </div>
            <div className="help-item">
              <svg className="help-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="20" x2="20" y2="20" /><line x1="12" y1="3" x2="12" y2="16" /><polyline points="7 10 12 3 17 10" />
              </svg>
              <span>{lang === "zh" ? "点击置顶到最前" : "Click pin to keep task on top"}</span>
            </div>
            <div className="help-item">
              <svg className="help-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              <span>{lang === "zh" ? "点击删除（可撤销）" : "Click trash to delete (undo available)"}</span>
            </div>
            <div className="help-item">
              <svg className="help-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-9-9" /><path d="M12 6v6l3 2" />
              </svg>
              <span>{lang === "zh" ? "拖拽排序任务" : "Drag task to reorder"}</span>
            </div>
            <div className="help-item">
              <svg className="help-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{lang === "zh" ? "使用定时模式设置提醒" : "Use Scheduled mode for reminders"}</span>
            </div>
          </div>
          <div className="help-popover-footer">
            {lang === "zh" ? "点击外部或按 Esc 键关闭" : "Click outside or press Esc to close"}
          </div>
        </div>
      )}
    </>
  );
}

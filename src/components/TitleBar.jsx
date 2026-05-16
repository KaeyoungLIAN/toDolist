import React, { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

export default function TitleBar({ onOpenSettings, showSearch, onToggleSearch, lang, onToggleCollapsed }) {
  const [showHelp, setShowHelp] = useState(false);
  const [helpClosing, setHelpClosing] = useState(false);
  const helpRef = useRef(null);
  const handleMin = async () => { try { await invoke("minimize_window"); } catch (e) { console.error("minimize:", e); } };
  const handleClose = async () => { try { await getCurrentWindow().close(); } catch (e) { console.error("close:", e); } };

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
          <button className="title-btn collapse-btn" id="collapse-btn" title={lang === "zh" ? "折叠" : "Collapse"} onClick={onToggleCollapsed}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <path d="M12 14l-3 3h6l-3-3z" />
            </svg>
          </button>
          <button className="title-btn close-btn" id="close-btn" title={lang === "zh" ? "关闭" : "Close"} onClick={handleClose}>
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
          <div className="help-popover-title">{lang === "zh" ? "操作说明" : "Quick guide"}</div>
          <div className="help-popover-list">
            <div className="help-item top">
              <svg className="help-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              <div className="help-item-content">
                <div>{lang === "zh" ? "创建任务：底部输入栏打字后按回车创建" : "Create tasks: Type in the bar and press Enter"}</div>
                <div className="help-sub-item">{lang === "zh" ? "普通任务：无时间限制，不会到期提醒" : "Normal: No due date, no reminder"}</div>
                <div className="help-sub-item">{lang === "zh" ? "定时任务：可选单次（日期+时间）或每周（星期+时间），到期自动提醒" : "Scheduled: Once (date+time) or Weekly (day+time), auto-remind"}</div>
              </div>
            </div>
            <div className="help-item">
              <svg className="help-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{lang === "zh" ? "标记完成：点复选框，自动淡化。设置中可隐藏已完成" : "Mark complete: Check the box, fades. Toggle in Settings"}</span>
            </div>
            <div className="help-item">
              <svg className="help-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>{lang === "zh" ? "全局搜索：搜索所有日期结果，按日期分组" : "Global search: Search across all dates, grouped by date"}</span>
            </div>
            <div className="help-item">
              <svg className="help-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span>{lang === "zh" ? "编辑 / 删除：点铅笔编辑，回车保存；点垃圾桶删除，5 秒内可撤销" : "Edit / Delete: Pencil to edit, Enter to save. Trash to delete, 5 sec undo"}</span>
            </div>
            <div className="help-item">
              <svg className="help-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="20" x2="20" y2="20" /><line x1="12" y1="3" x2="12" y2="16" /><polyline points="7 10 12 3 17 10" />
              </svg>
              <span>{lang === "zh" ? "置顶：点大头针置顶，始终排在最前" : "Pin: Keep at top regardless of date"}</span>
            </div>
            <div className="help-item">
              <svg className="help-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
              </svg>
              <span>{lang === "zh" ? "储留任务：开启后跨日期可见，持续显示直至完成为止" : "Persist: Visible across dates, stays on screen until completed"}</span>
            </div>
            <div className="help-item">
              <svg className="help-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span>{lang === "zh" ? "链接会议/网页：填入会议号或网址，卡片点链接一键打开" : "Link meetings/URLs: Enter code or URL, click link on card to open"}</span>
            </div>
            <div className="help-item">
              <svg className="help-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 10l5-5 5 5" /><path d="M7 14l5 5 5-5" />
              </svg>
              <span>{lang === "zh" ? "调整顺序：点卡片左侧上下箭头，顺序持久保存" : "Reorder: Up/down arrows on card. Order is saved"}</span>
            </div>
            <div className="help-item">
              <svg className="help-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><path d="M12 14l-3 3h6l-3-3z" />
              </svg>
              <span>{lang === "zh" ? "折叠窗口：点标题栏折叠按钮或按反引号键(`)折叠为迷你条；点迷你条或再按反引号展开" : "Collapse: Click collapse button or press ` to mini-bar; click bar or press ` again to restore"}</span>
            </div>
            <div className="help-item">
              <svg className="help-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <span>{lang === "zh" ? "置顶开关：折叠状态下点左侧大头针按钮切换窗口置顶/不置顶" : "Always on top: While collapsed, click the pin button on the left to toggle always-on-top"}</span>
            </div>
            <div className="help-item">
              <svg className="help-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{lang === "zh" ? "日期切换：左右翻日期，点日期打开日历，一键回今天" : "Navigate dates: Arrow to switch, click date for calendar, one-click today"}</span>
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

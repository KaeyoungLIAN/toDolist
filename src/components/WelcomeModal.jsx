import React from "react";
import { t } from "../i18n";

export default function WelcomeModal({ lang, onClose, showWelcome, onToggleWelcome }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="welcome-modal" onClick={(e) => e.stopPropagation()}>
        <div className="welcome-header">
          <span id="title-dot" style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "var(--accent)", marginRight: 10 }} />
          <span className="welcome-title">{t(lang, "welcomeTitle")}</span>
        </div>

        <div className="welcome-desc">
          {t(lang, "welcomeDesc")}
        </div>

        <div className="welcome-guide-title">{t(lang, "quickGuide")}</div>

        <div className="welcome-list">
          <div className="welcome-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <span>{lang === "zh" ? "在输入栏打字，选[普通]快速创建当天待办，选[定时]设定截止日期或每周重复提醒" : "Type in the input bar. [Normal] creates a today-task; [Scheduled] sets deadlines or weekly reminders"}</span>
          </div>
          <div className="welcome-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{lang === "zh" ? "点复选框标记完成，完成项自动淡化。可在设置中切换是否隐藏已完成" : "Check to mark complete — fades automatically. Toggle visibility in Settings"}</span>
          </div>
          <div className="welcome-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
            </svg>
            <span>{lang === "zh" ? "点垃圾桶删除，5 秒内可从底部撤销栏恢复，无需弹窗确认" : "Delete with 5-sec undo from the bottom bar — no confirmation dialogs"}</span>
          </div>
          <div className="welcome-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span>{lang === "zh" ? "点铅笔编辑文字或修改提醒类型/时间。修改后回车保存" : "Click pencil to edit content or change reminder settings. Enter to save"}</span>
          </div>
          <div className="welcome-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="20" x2="20" y2="20" /><line x1="12" y1="3" x2="12" y2="16" /><polyline points="7 10 12 3 17 10" />
            </svg>
            <span>{lang === "zh" ? "置顶任务始终排在最前，不受日期切换影响。适合标记当日最重要的待办" : "Pinned items stay at top regardless of date. Mark your most important task"}</span>
          </div>
          <div className="welcome-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
            <span>{lang === "zh" ? "储留任务不会随日期切换消失。配合每周提醒使用，日常固定待办每天自动出现" : "Persisted tasks survive date switches. Pair with weekly reminder for daily recurring to-dos"}</span>
          </div>
          <div className="welcome-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 10l5-5 5 5" /><path d="M7 14l5 5 5-5" />
            </svg>
            <span>{lang === "zh" ? "点上下箭头调整任务顺序，顺序持久保存。长按也可拖拽排序" : "Reorder with arrows — order is saved. Long-press to drag-and-drop"}</span>
          </div>
        </div>

        <div className="welcome-footer">
          <label className="welcome-toggle-row" onClick={onToggleWelcome}>
            <div className={`toggle-track${!showWelcome ? " on" : ""}`}>
              <div className="toggle-thumb" />
            </div>
            <span className="welcome-toggle-label">{lang === "zh" ? "不再显示" : "Don't show again"}</span>
          </label>
          <button className="welcome-start-btn" onClick={onClose}>
            {lang === "zh" ? "开始使用" : "Get Started"}
          </button>
        </div>
      </div>
    </div>
  );
}
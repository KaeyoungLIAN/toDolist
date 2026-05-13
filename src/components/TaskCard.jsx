import React from "react";
import { t } from "../i18n";

const WN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function TaskCard({ task, index, onToggle, onDelete, onEdit, onPin, lang, deletingId, completingId, isFirst, isLast, onMoveUp, onMoveDown, onTogglePersist }) {
  const isDeleting = task.id === deletingId;
  const isCompleting = task.id === completingId;
  return (
    <div
      className={"task-card" + (task.completed ? " completed" : "") + (isDeleting ? " deleting" : "") + (isCompleting ? " completing" : "")}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="reorder-btns">
        <button
          className={"reorder-btn up" + (isFirst ? " disabled" : "")}
          onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
          disabled={isFirst}
          title="Move up"
          tabIndex={-1}
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
        <button
          className={"reorder-btn down" + (isLast ? " disabled" : "")}
          onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
          disabled={isLast}
          title="Move down"
          tabIndex={-1}
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
      <input
        type="checkbox"
        className="task-checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
      />
      <div className="task-body">
        <div className="task-content">{task.content}</div>
        <div className="task-meta">
          {task.pinned && (
            <span className="reminder-badge pinned">{t(lang, "pinned")}</span>
          )}
          {task.completed ? (
            <span className="reminder-badge once">{t(lang, "done")}</span>
          ) : task.reminder_type === "once" && task.reminder_data.datetime ? (
            <span className="reminder-badge once">
              {task.reminder_data.datetime.endsWith("T23:59:00")
                ? t(lang, "todayToDo")
                : task.reminder_data.datetime.replace("T", " ").slice(0, -3)}
            </span>
          ) : task.reminder_type === "weekly" ? (
            <span className="reminder-badge weekly">
              {task.reminder_data.days.map((d) => WN[d]).join(", ")} {task.reminder_data.time}
            </span>
          ) : null}
        </div>
      </div>
      <button className={"action-btn pin-btn" + (task.pinned ? " active" : "")} onClick={() => onPin(task.id)} title={task.pinned ? "Unpin" : "Pin to top"}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="20" x2="20" y2="20" />
          <line x1="12" y1="3" x2="12" y2="16" />
          <polyline points="7 10 12 3 17 10" />
        </svg>
      </button>
      <button className={"action-btn persist-btn" + (task.persist ? " active" : "")} onClick={onTogglePersist} title={t(lang, "persist")}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </button>
      <button className="action-btn edit-btn" onClick={() => onEdit(task)} title="Edit">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      <button className="action-btn delete-btn" onClick={() => onDelete(task.id, task.content, task)} title="Delete">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </button>
    </div>
  );
}

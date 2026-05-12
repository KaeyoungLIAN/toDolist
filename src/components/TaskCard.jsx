import React from "react";
import { t } from "../i18n";

const WN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function TaskCard({ task, index, onToggle, onDelete, onEdit, lang, deletingId }) {
  const isDeleting = task.id === deletingId;
  return (
    <div
      className={"task-card" + (task.completed ? " completed" : "") + (isDeleting ? " deleting" : "")}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <input
        type="checkbox"
        className="task-checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
      />
      <div className="task-body">
        <div className="task-content">{task.content}</div>
        <div className="task-meta">
          {task.completed ? (
            <span className="reminder-badge once">{t(lang, "done")}</span>
          ) : task.reminder_type === "once" && task.reminder_data.datetime ? (
            <span className="reminder-badge once">
              {task.reminder_data.datetime.replace("T", " ")}
            </span>
          ) : task.reminder_type === "weekly" ? (
            <span className="reminder-badge weekly">
              {task.reminder_data.days.map((d) => WN[d]).join(", ")} {task.reminder_data.time}
            </span>
          ) : null}
        </div>
      </div>
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

import React, { useState, useCallback } from "react";
import TaskCard from "./TaskCard";
import { t } from "../i18n";

export default function TaskList({ tasks, onToggle, onDelete, onEdit, onPin, onReorder, undoId, undoContent, onUndo, lang, deletingId, completingId, onTogglePersist, dateStr }) {
  const moveTask = useCallback((idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= tasks.length) return;
    const ids = tasks.map((t) => t.id);
    [ids[idx], ids[targetIdx]] = [ids[targetIdx], ids[idx]];
    onReorder(ids);
  }, [tasks, onReorder]);

  if (!tasks.length) {
    return (
      <div id="task-area">
        <div id="task-list">
          <div className="empty-state">
            <svg className="empty-icon" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <span className="empty-text">{t(lang, "noTasks")}</span>
            <hr className="empty-divider" />
            <span className="empty-hint">{t(lang, "noTasksHint")}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="task-area">
      <div id="task-list">
        {undoId && (
          <div className="undo-bar">
            <span>{t(lang, "deletePrefix")}: {undoContent}</span>
            <button className="undo-btn" onClick={onUndo}>{t(lang, "undo")}</button>
          </div>
        )}
        {tasks.map((t, i) => (
          <div key={t.id} className="drag-wrapper">
            <TaskCard
              task={t}
              dateStr={dateStr}
              index={i}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
              onPin={onPin}
              lang={lang}
              deletingId={deletingId}
              completingId={completingId}
              isFirst={i === 0}
              isLast={i === tasks.length - 1}
              onMoveUp={() => moveTask(i, -1)}
              onMoveDown={() => moveTask(i, 1)}
              onTogglePersist={() => onTogglePersist(t.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

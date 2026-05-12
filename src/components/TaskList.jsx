import React, { useState, useCallback } from "react";
import TaskCard from "./TaskCard";
import { t } from "../i18n";

export default function TaskList({ tasks, onToggle, onDelete, onEdit, onPin, onReorder, undoId, undoContent, onUndo, lang, deletingId, completingId }) {
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [dragIdx, setDragIdx] = useState(null);

  const handleDragStart = useCallback((e, idx) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(idx));
    setDragIdx(idx);
    // Make the drag image semi-transparent
    if (e.target) {
      setTimeout(() => {
        if (e.target) e.target.style.opacity = "0.4";
      }, 0);
    }
  }, []);

  const handleDragEnd = useCallback((e) => {
    setDragIdx(null);
    setDragOverIdx(null);
    if (e.target) e.target.style.opacity = "";
  }, []);

  const handleDragOver = useCallback((e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIdx(idx);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIdx(null);
  }, []);

  const handleDrop = useCallback((e, dropIdx) => {
    e.preventDefault();
    setDragOverIdx(null);
    setDragIdx(null);
    const srcIdx = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (isNaN(srcIdx) || srcIdx === dropIdx) return;

    const ids = tasks.map((t) => t.id);
    const [moved] = ids.splice(srcIdx, 1);
    ids.splice(dropIdx, 0, moved);
    onReorder(ids);
  }, [tasks, onReorder]);

  const handleKeyDown = useCallback((e, idx) => {
    if (e.key === "ArrowUp" && idx > 0) {
      const ids = tasks.map((t) => t.id);
      [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
      onReorder(ids);
    } else if (e.key === "ArrowDown" && idx < tasks.length - 1) {
      const ids = tasks.map((t) => t.id);
      [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
      onReorder(ids);
    }
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
            <button className="undo-btn" onClick={onUndo}>Undo</button>
          </div>
        )}
        {tasks.map((t, i) => (
          <div
            key={t.id}
            className={"drag-wrapper" + (dragOverIdx === i ? " drag-over" : "") + (dragIdx === i ? " dragging" : "")}
            draggable={!undoId}
            onDragStart={(e) => handleDragStart(e, i)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, i)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, i)}
          >
            <TaskCard
              task={t}
              index={i}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
              onPin={onPin}
              lang={lang}
              deletingId={deletingId}
              completingId={completingId}
              onDragStart={(e) => handleDragStart(e, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

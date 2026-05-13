import React, { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import TitleBar from "./components/TitleBar";
import DateBar from "./components/DateBar";
import TaskList from "./components/TaskList";
import BottomPanel from "./components/BottomPanel";
import SettingsModal from "./components/SettingsModal";
import { t, weekdayNames } from "./i18n";

const WN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmt(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editRtype, setEditRtype] = useState("once");
  const [editRdata, setEditRdata] = useState(null);
  const [toast, setToast] = useState(null);
  const [undoId, setUndoId] = useState(null);
  const [undoContent, setUndoContent] = useState("");
  const [undoTask, setUndoTask] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [lang, setLang] = useState("en");
  const [showCompleted, setShowCompleted] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      const t = await invoke("get_tasks");
      setTasks(t);
      await invoke("check_and_notify").catch(() => {});
    } catch (_) {}
  }, []);

  // Load settings on mount
  useEffect(() => {
    invoke("get_settings")
      .then((s) => {
        if (s.language) setLang(s.language);
        if (s.show_completed !== undefined) setShowCompleted(s.show_completed);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { loadTasks(); const iv = setInterval(() => invoke("check_and_notify").catch(() => {}), 60000); return () => clearInterval(iv); }, [loadTasks]);
  useEffect(() => { const cb = () => { if (!document.hidden) loadTasks(); }; document.addEventListener("visibilitychange", cb); return () => document.removeEventListener("visibilitychange", cb); }, [loadTasks]);

  // ── filtering ──
  const dateStr = fmt(currentDate);
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const yesterdayStr = fmt(yesterday);

  // Week start (Monday)
  const weekStart = new Date(today);
  const day = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));
  const weekStartStr = fmt(weekStart);

  const taskDate = (t) => {
    if (t.reminder_data?.datetime && t.reminder_data.datetime.length >= 10)
      return t.reminder_data.datetime.slice(0, 10);
    return t.created_at.slice(0, 10);
  };

  const yesterdayCompleted = tasks.filter((t) => t.completed && taskDate(t) === yesterdayStr).length;
  const weekCompleted = tasks.filter((t) => t.completed && taskDate(t) >= weekStartStr && taskDate(t) <= dateStr).length;

  const q = searchQuery.toLowerCase().trim();
  const filtered = tasks
    .filter(
      (t) => {
        if (completingId === t.id) return true;
        if (!showCompleted && t.completed) return false;
        if (q && !t.content.toLowerCase().includes(q)) return false;
        return t.completed || t.reminder_type === "weekly" ||
          (t.reminder_data.datetime && t.reminder_data.datetime.startsWith(dateStr));
      }
    )
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.position - b.position;
    });

  // ── CRUD ──
  const addTask = useCallback(
    async (content, rtype, rdata) => {
      try {
        if (editingId !== null) {
          const task = tasks.find((x) => x.id === editingId);
          if (task) {
            task.content = content;
            task.reminder_type = rtype;
            task.reminder_data = rdata;
            await invoke("update_task", { task });
          }
          setEditingId(null);
          showToast(t(lang, "taskUpdated"));
        } else {
          await invoke("add_task", {
            content,
            reminderType: rtype,
            reminderData: rdata,
          });
          showToast(t(lang, "taskAdded"));
        }
        await loadTasks();
      } catch (e) {
        showToast(t(lang, "error") + ": " + String(e));
      }
    },
    [editingId, tasks, loadTasks, showToast, lang]
  );

  const deleteTask = useCallback(
    async (id, content, taskData) => {
      setDeletingId(id);
      // Wait for fly-left animation, then actually remove
      setTimeout(() => {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        setDeletingId(null);
        setUndoId(id);
        setUndoContent(content.length > 30 ? content.slice(0, 30) + "..." : content);
        setUndoTask(taskData);
        const timer = setTimeout(async () => {
          try {
            await invoke("delete_task", { id });
          } catch (_) {}
          setUndoId(null);
          setUndoTask(null);
        }, 5000);
        window.__undoTimer = timer;
      }, 380);
    },
    []
  );

  const cancelDelete = useCallback(async () => {
    clearTimeout(window.__undoTimer);
    if (deletingId) {
      setDeletingId(null);
    }
    if (undoTask) {
      try {
        await invoke("add_task", {
          content: undoTask.content,
          reminderType: undoTask.reminder_type,
          reminderData: undoTask.reminder_data,
        });
      } catch (_) {}
    }
    setUndoId(null);
    setUndoTask(null);
    showToast(t(lang, "deleteCancelled"));
    await loadTasks();
  }, [undoTask, showToast, loadTasks, lang, deletingId]);

  const toggleComplete = useCallback(
    async (id) => {
      try {
        await invoke("toggle_complete", { id });
        if (!showCompleted) {
          setCompletingId(id);
          setTimeout(() => {
            loadTasks();
            setCompletingId(null);
          }, 500);
        } else {
          await loadTasks();
        }
      } catch (_) {}
    },
    [loadTasks, showCompleted]
  );

  const startEdit = useCallback((t) => {
    setEditingId(t.id);
    setEditText(t.content);
    setEditRtype(t.reminder_type);
    setEditRdata(t.reminder_data);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const togglePin = useCallback(
    async (id) => {
      try {
        const t = tasks.find((x) => x.id === id);
        if (t) {
          await invoke("update_task", { task: { ...t, pinned: !t.pinned } });
          await loadTasks();
        }
      } catch (_) {}
    },
    [tasks, loadTasks]
  );

  const handleReorder = useCallback(
    async (ids) => {
      try {
        await invoke("reorder_tasks", { ids });
        await loadTasks();
      } catch (_) {}
    },
    [loadTasks]
  );

  // ── navigation ──
  const goPrev = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
  const goNext = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));
  const goToday = () => setCurrentDate(new Date());

  const handleRefresh = useCallback(() => {
    const btn = document.getElementById("refresh-btn");
    if (btn) {
      btn.classList.add("spinning");
      setTimeout(() => btn.classList.remove("spinning"), 1200);
    }
    loadTasks();
  }, [loadTasks]);

  const handleSettingsChange = useCallback((newLang, _dataDir, showComp) => {
    setLang(newLang);
    if (showComp !== undefined) setShowCompleted(showComp);
  }, []);

  return (
    <>
      <TitleBar
        onOpenSettings={() => setShowSettings(true)}
        showSearch={showSearch}
        onToggleSearch={() => setShowSearch((s) => !s)}
      />
      <DateBar
        dateStr={dateStr}
        weekday={WN[currentDate.getDay()]}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        onRefresh={handleRefresh}
        lang={lang}
      />
      {showSearch && (
        <div className="search-bar">
          <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="search-input"
            type="text"
            placeholder={t(lang, "searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => { setSearchQuery(""); setShowSearch(false); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      )}
      {(yesterdayCompleted > 0 || weekCompleted > 0) && !showSearch && (
        <div className="stats-line">
          {yesterdayCompleted > 0 && <span>{t(lang, "yesterday")} {yesterdayCompleted}</span>}
          {yesterdayCompleted > 0 && weekCompleted > 0 && <span className="stats-dot">·</span>}
          {weekCompleted > 0 && <span>{t(lang, "thisWeek")} {weekCompleted}</span>}
        </div>
      )}
      <TaskList
        tasks={filtered}
        onToggle={toggleComplete}
        onDelete={deleteTask}
        onEdit={startEdit}
        onPin={togglePin}
        onReorder={handleReorder}
        undoId={undoId}
        undoContent={undoContent}
        onUndo={cancelDelete}
        lang={lang}
        deletingId={deletingId}
        completingId={completingId}
      />
      <BottomPanel
        editingId={editingId}
        editText={editText}
        editRtype={editRtype}
        editRdata={editRdata}
        onSave={addTask}
        onCancelEdit={cancelEdit}
        dateStr={dateStr}
        lang={lang}
      />
      {toast && <div className="toast">{toast}</div>}
      {showSettings && (
        <SettingsModal
          lang={lang}
          showCompleted={showCompleted}
          onClose={() => setShowSettings(false)}
          onSettingsChange={handleSettingsChange}
        />
      )}
    </>
  );
}

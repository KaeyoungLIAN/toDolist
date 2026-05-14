import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import TitleBar from "./components/TitleBar";
import DateBar from "./components/DateBar";
import TaskList from "./components/TaskList";
import TaskCard from "./components/TaskCard";
import BottomPanel from "./components/BottomPanel";
import SettingsModal from "./components/SettingsModal";
import WelcomeModal from "./components/WelcomeModal";
import { t } from "./i18n";

const WN = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

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
  const [editLinkUrl, setEditLinkUrl] = useState("");
  const [toast, setToast] = useState(null);
  const [undoId, setUndoId] = useState(null);
  const [undoContent, setUndoContent] = useState("");
  const [undoTask, setUndoTask] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [lang, setLang] = useState("en");
  const [showCompleted, setShowCompleted] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [completingId, setCompletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const undoTimerRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      const data = await invoke("get_tasks");
      setTasks(data);
      await invoke("check_and_notify").catch((e) => console.error("check_and_notify:", e));
    } catch (e) { console.error("loadTasks:", e); }
  }, []);

  // Load settings on mount
  useEffect(() => {
    invoke("get_settings")
      .then((s) => {
        if (s.language) setLang(s.language);
        if (s.show_completed !== undefined) setShowCompleted(s.show_completed);
        if (s.theme) setTheme(s.theme);
        if (s.show_welcome !== false) setShowWelcome(true);
        else setShowWelcome(false);
        // Show welcome modal on first launch
        if (s.show_welcome !== false) {
          setShowWelcomeModal(true);
        }
      })
      .catch((e) => console.error("get_settings:", e));
  }, []);

  useEffect(() => { loadTasks(); const iv = setInterval(loadTasks, 60000); return () => clearInterval(iv); }, [loadTasks]);
  useEffect(() => { const cb = () => { if (!document.hidden) loadTasks(); }; document.addEventListener("visibilitychange", cb); return () => document.removeEventListener("visibilitychange", cb); }, [loadTasks]);

  // Sync theme to <html> classList
  useEffect(() => {
    document.documentElement.classList.toggle("theme-light", theme === "light");
  }, [theme]);

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

  // Helper: is a task completed on a given date (supports completed_dates for weekly)
  const isTaskCompletedOn = (t, d) => t.completed || t.completed_dates?.includes(d);

  const yesterdayCompleted = tasks.filter((t) => isTaskCompletedOn(t, yesterdayStr)).length;
  const weekCompleted = tasks.filter((t) => {
    // Weekly: check completed_dates entries within week range
    if (t.completed_dates?.some((d) => d >= weekStartStr && d <= dateStr)) return true;
    // Non-weekly: completed flag + task date within week
    return t.completed && taskDate(t) >= weekStartStr && taskDate(t) <= dateStr;
  }).length;

  const q = searchQuery.toLowerCase().trim();
  const filtered = tasks
    .filter(
      (t) => {
        if (completingId === t.id) return true;
        if (!showCompleted && (t.completed || t.completed_dates?.includes(dateStr))) return false;
        if (q && !t.content.toLowerCase().includes(q)) return false;
        return (t.persist && !t.completed && dateStr >= t.created_at.slice(0, 10)) ||
          (t.reminder_type === "weekly" && t.reminder_data.days.includes(currentDate.getDay())) ||
          (t.reminder_data.datetime && t.reminder_data.datetime.startsWith(dateStr));
      }
    )
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.position - b.position;
    });

  // Global search: match all tasks, group by date
  const searchResults = useMemo(() => {
    if (!q) return [];
    const matched = tasks.filter((t) => t.content.toLowerCase().includes(q));
    const groups = {};
    for (const t of matched) {
      const d = taskDate(t);
      if (!groups[d]) groups[d] = [];
      groups[d].push(t);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a)); // newest first
  }, [tasks, q]);

  // ── CRUD ──
  const addTask = useCallback(
    async (content, rtype, rdata, linkUrl) => {
      try {
        if (editingId !== null) {
          const task = tasks.find((x) => x.id === editingId);
          if (task) {
            task.content = content;
            task.reminder_type = rtype;
            task.reminder_data = rdata;
            task.link_url = linkUrl || null;
            await invoke("update_task", { task });
          }
          setEditingId(null);
          showToast(t(lang, "taskUpdated"));
        } else {
          await invoke("add_task", {
            content,
            reminderType: rtype,
            reminderData: rdata,
            linkUrl: linkUrl || null,
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
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      setDeletingId(id);

      // Delete from BACKEND first — eliminates race with reorder
      try {
        await invoke("delete_task", { id });
      } catch (e) {
        console.error("delete_task:", e);
        setDeletingId(null);
        showToast(t(lang, "error"));
        return;
      }

      // Backend done — now animate frontend
      setTimeout(() => {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        setDeletingId(null);
        setUndoId(id);
        setUndoContent(content.length > 30 ? content.slice(0, 30) + "..." : content);
        setUndoTask(taskData);

        // 5s undo window — re-add to backend if user clicks Undo
        undoTimerRef.current = setTimeout(() => {
          setUndoId(null);
          setUndoTask(null);
          undoTimerRef.current = null;
        }, 5000);
      }, 380);
    },
    [showToast, lang]
  );

  const cancelDelete = useCallback(async () => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    if (undoTask) {
      try {
        await invoke("add_task", {
          content: undoTask.content,
          reminderType: undoTask.reminder_type,
          reminderData: undoTask.reminder_data,
          linkUrl: undoTask.link_url || null,
        });
        showToast(t(lang, "deleteCancelled"));
      } catch (e) { console.error("add_task (undo):", e); }
    }
    setUndoId(null);
    setUndoTask(null);
    await loadTasks();
  }, [undoTask, showToast, loadTasks, lang]);

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
      } catch (e) { console.error("toggle_complete:", e); }
    },
    [loadTasks, showCompleted]
  );

  const startEdit = useCallback((t) => {
    setEditingId(t.id);
    setEditText(t.content);
    setEditRtype(t.reminder_type);
    setEditRdata(t.reminder_data);
    setEditLinkUrl(t.link_url || "");
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
      } catch (e) { console.error("toggle_pin:", e); }
    },
    [tasks, loadTasks]
  );

  const togglePersist = useCallback(
    async (id) => {
      try {
        const task = tasks.find((x) => x.id === id);
        if (task) {
          await invoke("update_task", { task: { ...task, persist: !task.persist } });
          await loadTasks();
        }
      } catch (e) { console.error("toggle_persist:", e); }
    },
    [tasks, loadTasks]
  );

  const handleReorder = useCallback(
    async (ids) => {
      try {
        await invoke("reorder_tasks", { ids });
        await loadTasks();
      } catch (e) { console.error("reorder_tasks:", e); }
    },
    [loadTasks]
  );

  // ── navigation ──
  const goPrev = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
  const goNext = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));
  const goToday = () => setCurrentDate(new Date());
  const goToDate = (d) => setCurrentDate(d);

  const handleRefresh = useCallback(() => {
    const btn = document.getElementById("refresh-btn");
    if (btn) {
      btn.classList.add("spinning");
      setTimeout(() => btn.classList.remove("spinning"), 1200);
    }
    loadTasks();
  }, [loadTasks]);

  const handleSettingsChange = useCallback((newLang, _dataDir, showComp, newTheme, showWelcomeVal) => {
    setLang(newLang);
    if (showComp !== undefined) setShowCompleted(showComp);
    if (newTheme) setTheme(newTheme);
    if (showWelcomeVal !== undefined) setShowWelcome(showWelcomeVal);
  }, []);

  const handleEmptySubmit = useCallback(() => {
    setToast(t(lang, "emptyInput"));
    setTimeout(() => setToast(null), 2500);
  }, [lang]);

  return (
    <>
      <TitleBar
        onOpenSettings={() => setShowSettings(true)}
        showSearch={showSearch}
        onToggleSearch={() => setShowSearch((s) => !s)}
        lang={lang}
      />
      <DateBar
        dateStr={dateStr}
        weekday={t(lang, WN[currentDate.getDay()])}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        onRefresh={handleRefresh}
        onGoToDate={goToDate}
        lang={lang}
        yesterdayCompleted={yesterdayCompleted}
        weekCompleted={weekCompleted}
      />
      {showSearch ? (
        <div className="search-overlay">
          <div className={"search-overlay-header" + (q ? " has-query" : "")}>
            <svg className="search-overlay-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="search-overlay-input"
              type="text"
              placeholder={t(lang, "searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button className="search-overlay-close" onClick={() => { setSearchQuery(""); setShowSearch(false); }} title={t(lang, "close")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
          {q && (
            <div className="search-overlay-results">
              {searchResults.length === 0 ? (
                <div className="search-overlay-empty">{t(lang, "noTasks")}</div>
              ) : (
                searchResults.map(([date, tasks]) => (
                  <div key={date} className="search-date-group">
                    <div className="search-date-label">{date}</div>
                    {tasks.map((t) => (
                      <TaskCard
                        key={t.id}
                        task={t}
                        dateStr={taskDate(t)}
                        index={0}
                        onToggle={toggleComplete}
                        onDelete={deleteTask}
                        onEdit={startEdit}
                        onPin={togglePin}
                        onTogglePersist={togglePersist}
                        lang={lang}
                        deletingId={deletingId}
                        completingId={completingId}
                        isFirst={false} isLast={false}
                        onMoveUp={()=>{}} onMoveDown={()=>{}}
                      />
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        <TaskList
          tasks={filtered}
        dateStr={dateStr}
        onToggle={toggleComplete}
        onDelete={deleteTask}
        onEdit={startEdit}
        onPin={togglePin}
        onReorder={handleReorder}
        onTogglePersist={togglePersist}
        undoId={undoId}
        undoContent={undoContent}
        onUndo={cancelDelete}
        lang={lang}
        deletingId={deletingId}
        completingId={completingId}
      />)}
      <BottomPanel
        editingId={editingId}
        editText={editText}
        editRtype={editRtype}
        editRdata={editRdata}
        editLinkUrl={editLinkUrl}
        onSave={addTask}
        onCancelEdit={cancelEdit}
        dateStr={dateStr}
        lang={lang}
        onEmptySubmit={handleEmptySubmit}
      />
      {toast && <div className="toast">{toast}</div>}
      {showSettings && (
        <SettingsModal
          lang={lang}
          theme={theme}
          showCompleted={showCompleted}
          showWelcome={showWelcome}
          onClose={() => setShowSettings(false)}
          onSettingsChange={handleSettingsChange}
        />
      )}
      {showWelcomeModal && (
        <WelcomeModal
          lang={lang}
          onClose={() => setShowWelcomeModal(false)}
          showWelcome={showWelcome}
          onToggleWelcome={() => {
            const newVal = !showWelcome;
            setShowWelcome(newVal);
            // Persist the setting
            invoke("get_settings").then((s) => {
              invoke("update_settings", { settings: { ...s, show_welcome: newVal } });
            }).catch(console.error);
          }}
        />
      )}
    </>
  );
}

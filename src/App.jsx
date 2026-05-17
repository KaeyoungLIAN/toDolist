import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import TitleBar from "./components/TitleBar";
import CollapsedBar from "./components/CollapsedBar";
import DateBar from "./components/DateBar";
import TaskList from "./components/TaskList";
import TaskCard from "./components/TaskCard";
import BottomPanel from "./components/BottomPanel";
import SettingsModal from "./components/SettingsModal";
import WelcomeModal from "./components/WelcomeModal";
import { t } from "./i18n";
import useTasks from "./hooks/useTasks";
import useDateNavigation from "./hooks/useDateNavigation";
import useSearch from "./hooks/useSearch";

const WN = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export default function App() {
  // ── Settings state ──
  const [lang, setLang] = useState("en");
  const [showCompleted, setShowCompleted] = useState(true);
  const [theme, setTheme] = useState("dark");
  const [showSettings, setShowSettings] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);

  const COLLAPSED_HEIGHT = 40;
  const originalSizeRef = useRef(null);
  const taskApi = useTasks(lang);
  const {
    loadTasks, addTask, deleteTask, toggleComplete,
    startEdit, cancelEdit, togglePin, togglePersist, handleReorder,
    editingId, editText, editRtype, editRdata, editLinkUrl,
    deletingId, completingId,
    undoId, undoContent, onUndo, toast, showToast,
  } = taskApi;

  const nav = useDateNavigation(taskApi.tasks);
  const { currentDate, dateStr, goPrev, goNext, goToday, goToDate, yesterdayCompleted, weekCompleted } = nav;

  const search = useSearch(taskApi.tasks);
  const { searchQuery, setSearchQuery, showSearch, searchResults, toggleSearch } = search;

  // ── Effects ──
  useEffect(() => {
    invoke("get_settings")
      .then((s) => {
        if (s.language) setLang(s.language);
        if (s.show_completed !== undefined) setShowCompleted(s.show_completed);
        if (s.theme) setTheme(s.theme);
        if (s.show_welcome !== false) {
          setShowWelcome(true);
          setShowWelcomeModal(true);
        } else {
          setShowWelcome(false);
        }
      })
      .catch((e) => console.error("get_settings:", e));
  }, []);

  useEffect(() => {
    let locked = false;
    const poll = async () => {
      if (locked) return;
      locked = true;
      try { await loadTasks(); } finally { locked = false; }
    };
    poll();
    const iv = setInterval(poll, 60000);
    return () => clearInterval(iv);
  }, [loadTasks]);

  useEffect(() => {
    const cb = () => { if (!document.hidden) loadTasks(); };
    document.addEventListener("visibilitychange", cb);
    return () => document.removeEventListener("visibilitychange", cb);
  }, [loadTasks]);

  useEffect(() => {
    document.documentElement.classList.toggle("theme-light", theme === "light");
  }, [theme]);

  // ── Filtered tasks ──
  const filtered = useMemo(() => taskApi.tasks
    .filter((t) => {
      if (completingId === t.id) return true;
      if (!showCompleted && (t.completed || t.completed_dates?.includes(dateStr))) return false;
      const q = searchQuery.toLowerCase().trim();
      if (q && !t.content.toLowerCase().includes(q)) return false;
      return (t.persist && !t.completed && dateStr >= t.created_at.slice(0, 10)) ||
        (t.reminder_type === "weekly" && t.reminder_data.days.includes(currentDate.getDay())) ||
        (t.reminder_data.datetime && t.reminder_data.datetime.startsWith(dateStr));
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.position - b.position;
    }), [taskApi.tasks, showCompleted, dateStr, currentDate, completingId, searchQuery]);

  // ── Handlers ──
  const handleSettingsChange = useCallback((newLang, _dataDir, showComp, newTheme, showWelcomeVal) => {
    if (newLang) setLang(newLang);
    if (showComp !== undefined) setShowCompleted(showComp);
    if (newTheme) setTheme(newTheme);
    if (showWelcomeVal !== undefined) setShowWelcome(showWelcomeVal);
  }, []);

  const handleEmptySubmit = useCallback(() => {
    showToast(t(lang, "emptyInput"));
  }, [lang, showToast]);

  const handleRefresh = useCallback(() => {
    const btn = document.getElementById("refresh-btn");
    if (btn) {
      btn.classList.add("spinning");
      setTimeout(() => btn.classList.remove("spinning"), 1200);
    }
    loadTasks();
  }, [loadTasks]);

  // ── Collapse ──
  const todayRemaining = useMemo(() =>
    taskApi.tasks.filter((t) => {
      if (t.completed) return false;
      const matchesToday = (t.persist && !t.completed && dateStr >= t.created_at.slice(0, 10)) ||
        (t.reminder_type === "weekly" && t.reminder_data.days.includes(currentDate.getDay())) ||
        (t.reminder_data.datetime && t.reminder_data.datetime.startsWith(dateStr));
      return matchesToday;
    }).length,
    [taskApi.tasks, dateStr, currentDate]
  );

  const handleToggleCollapse = useCallback(async () => {
    const win = getCurrentWindow();
    const size = await win.outerSize();
    originalSizeRef.current = { width: size.width, height: size.height };
    await win.setMinSize(new LogicalSize(400, COLLAPSED_HEIGHT));
    await win.setResizable(false);
    await win.setSize(new LogicalSize(size.width, COLLAPSED_HEIGHT));
    setCollapsed(true);
  }, []);

  const handleTogglePin = useCallback(async () => {
    try {
      const win = getCurrentWindow();
      const next = !alwaysOnTop;
      await win.setAlwaysOnTop(next);
      setAlwaysOnTop(next);
    } catch (e) { console.error("toggle pin:", e); }
  }, [alwaysOnTop]);

  const handleExpand = useCallback(async () => {
    const win = getCurrentWindow();
    if (originalSizeRef.current) {
      await win.setSize(new LogicalSize(originalSizeRef.current.width, originalSizeRef.current.height));
      await win.setMinSize(new LogicalSize(400, 400));
      await win.setResizable(true);
    }
    setCollapsed(false);
  }, []);

  return (
    <>
      {collapsed ? (
        <CollapsedBar
          lang={lang}
          alwaysOnTop={alwaysOnTop}
          onTogglePin={handleTogglePin}
          onExpand={handleExpand}
          remaining={todayRemaining}
        />
      ) : (
        <>
      <TitleBar
        onOpenSettings={() => setShowSettings(true)}
        showSearch={showSearch}
        onToggleSearch={toggleSearch}
        lang={lang}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
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
          <div className={"search-overlay-header" + (searchQuery ? " has-query" : "")}>
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
          {searchQuery && (
            <div className="search-overlay-results">
              {searchResults.length === 0 ? (
                <div className="search-overlay-empty">{t(lang, "noTasks")}</div>
              ) : (
                searchResults.map(([date, stasks]) => (
                  <div key={date} className="search-date-group">
                    <div className="search-date-label">{date}</div>
                    {stasks.map((t) => (
                      <TaskCard
                        key={t.id}
                        task={t}
                        dateStr={date}
                        index={0}
                        onToggle={(id) => toggleComplete(id, showCompleted)}
                        onDelete={deleteTask}
                        onEdit={startEdit}
                        onPin={togglePin}
                        onTogglePersist={togglePersist}
                        lang={lang}
                        deletingId={deletingId}
                        completingId={completingId}
                        reorder={null}
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
          onToggle={(id) => toggleComplete(id, showCompleted)}
          onDelete={deleteTask}
          onEdit={startEdit}
          onPin={togglePin}
          onReorder={handleReorder}
          onTogglePersist={togglePersist}
          undoId={undoId}
          undoContent={undoContent}
          onUndo={onUndo}
          lang={lang}
          deletingId={deletingId}
          completingId={completingId}
        />
      )}
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
        showToast={showToast}
      />
      {toast && <div className="toast">{toast}</div>}
        </> 
      ) /* end: not collapsed */}
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
            invoke("get_settings").then((s) => {
              invoke("update_settings", { settings: { ...s, show_welcome: newVal } });
            }).catch(console.error);
          }}
        />
      )}
    </>
  );
}

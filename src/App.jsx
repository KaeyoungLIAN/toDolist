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
  const [showSettings, setShowSettings] = useState(false);

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
      .then((s) => { if (s.language) setLang(s.language); })
      .catch(() => {});
  }, []);

  useEffect(() => { loadTasks(); const iv = setInterval(() => invoke("check_and_notify").catch(() => {}), 60000); return () => clearInterval(iv); }, [loadTasks]);
  useEffect(() => { const cb = () => { if (!document.hidden) loadTasks(); }; document.addEventListener("visibilitychange", cb); return () => document.removeEventListener("visibilitychange", cb); }, [loadTasks]);

  // ── filtering ──
  const dateStr = fmt(currentDate);
  const filtered = tasks
    .filter(
      (t) =>
        t.completed ||
        t.reminder_type === "weekly" ||
        (t.reminder_data.datetime && t.reminder_data.datetime.startsWith(dateStr))
    )
    .sort((a, b) => a.completed - b.completed);

  // ── CRUD ──
  const addTask = useCallback(
    async (content, rtype, rdata) => {
      try {
        if (editingId !== null) {
          const t = tasks.find((x) => x.id === editingId);
          if (t) {
            t.content = content;
            t.reminder_type = rtype;
            t.reminder_data = rdata;
            await invoke("update_task", { task: t });
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
    // If the task is still in mid-animation, restore it
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
        await loadTasks();
      } catch (_) {}
    },
    [loadTasks]
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

  const handleSettingsChange = useCallback((newLang, _dataDir) => {
    setLang(newLang);
  }, []);

  return (
    <>
      <TitleBar onOpenSettings={() => setShowSettings(true)} />
      <DateBar
        dateStr={dateStr}
        weekday={WN[currentDate.getDay()]}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        onRefresh={handleRefresh}
        lang={lang}
      />
      <TaskList
        tasks={filtered}
        onToggle={toggleComplete}
        onDelete={deleteTask}
        onEdit={startEdit}
        undoId={undoId}
        undoContent={undoContent}
        onUndo={cancelDelete}
        lang={lang}
        deletingId={deletingId}
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
          onClose={() => setShowSettings(false)}
          onSettingsChange={handleSettingsChange}
        />
      )}
    </>
  );
}

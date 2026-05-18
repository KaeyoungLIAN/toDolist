use chrono::{Datelike, Local, NaiveDateTime, NaiveTime};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{
    AppHandle, Manager, State,
    window::{Effect, EffectsBuilder},
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReminderData {
    pub datetime: Option<String>,
    pub days: Vec<u8>,
    pub time: String,
    #[serde(default)]
    pub advance_minutes: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskItem {
    pub id: u32, pub content: String, pub completed: bool,
    #[serde(default)]
    pub pinned: bool,
    #[serde(default)]
    pub persist: bool,
    #[serde(default)]
    pub position: u32,
    pub reminder_type: String, pub reminder_data: ReminderData,
    pub last_reminded: Option<String>, pub created_at: String,
    #[serde(default)]
    pub completed_dates: Vec<String>,
    #[serde(default)]
    pub link_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TodoData { pub tasks: Vec<TaskItem>, pub next_id: u32 }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub language: String,
    pub data_dir: Option<String>,
    #[serde(default = "default_true")]
    pub show_completed: bool,
    #[serde(default = "default_theme")]
    pub theme: String,
    #[serde(default = "default_true")]
    pub show_welcome: bool,
    #[serde(default)]
    pub glass_effect: bool,
}

fn default_true() -> bool { true }
fn default_theme() -> String { "dark".to_string() }

impl Default for Settings {
    fn default() -> Self {
        Settings {
            language: "zh".to_string(),
            data_dir: None,
            show_completed: true,
            theme: "dark".to_string(),
            show_welcome: true,
            glass_effect: true,
        }
    }
}

// ── Persistence module ──

fn settings_path(app: &AppHandle) -> PathBuf {
    let dir = app.path().app_data_dir().expect("app data dir");
    fs::create_dir_all(&dir).ok();
    dir.join("settings.json")
}

fn load_settings(path: &PathBuf) -> Settings {
    if path.exists() {
        if let Ok(c) = fs::read_to_string(path) {
            if let Ok(s) = serde_json::from_str(&c) { return s; }
        }
    }
    Settings::default()
}

fn save_settings(path: &PathBuf, settings: &Settings) -> Result<(), String> {
    let json = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    let tmp = path.with_extension("json.tmp");
    fs::write(&tmp, &json).map_err(|e| e.to_string())?;
    fs::rename(&tmp, path).map_err(|e| e.to_string())?;
    Ok(())
}

fn data_path(app: &AppHandle, settings: &Settings) -> PathBuf {
    if let Some(ref dir) = settings.data_dir {
        let p = PathBuf::from(dir);
        fs::create_dir_all(&p).ok();
        p.join("data.json")
    } else {
        let dir = app.path().app_data_dir().expect("app data dir");
        fs::create_dir_all(&dir).ok();
        dir.join("data.json")
    }
}

fn load_tasks(path: &PathBuf) -> TodoData {
    if path.exists() {
        if let Ok(c) = fs::read_to_string(path) {
            if let Ok(d) = serde_json::from_str(&c) { return d; }
        }
    }
    TodoData::default()
}

fn save_tasks(path: &PathBuf, data: &TodoData) -> Result<(), String> {
    let json = serde_json::to_string_pretty(data).map_err(|e| e.to_string())?;
    let tmp = path.with_extension("json.tmp");
    fs::write(&tmp, &json).map_err(|e| e.to_string())?;
    fs::rename(&tmp, path).map_err(|e| e.to_string())?;
    Ok(())
}

fn load_tasks_with_settings(app: &AppHandle) -> (PathBuf, TodoData) {
    let sp = settings_path(app);
    let settings = load_settings(&sp);
    let path = data_path(app, &settings);
    let data = load_tasks(&path);
    (path, data)
}

/// Load, modify, save, and sync state in one call.
/// Reduces the load→modify→save→sync pattern from 4 lines to 1.
fn modify_tasks<F>(state: &State<AppState>, app: &AppHandle, f: F) -> Result<(), String>
where F: FnOnce(&mut Vec<TaskItem>)
{
    let (path, mut data) = load_tasks_with_settings(app);
    f(&mut data.tasks);
    save_tasks(&path, &data)?;
    *state.data.lock().map_err(|e| e.to_string())? = data.tasks;
    Ok(())
}

// ── Reminder helpers ──

/// Check whether a task's reminder is due at the given time.
/// Pure function — no side effects, no I/O.
fn is_reminder_due(task: &TaskItem, now: NaiveDateTime) -> bool {
    if task.completed { return false; }
    match task.reminder_type.as_str() {
        "once" => {
            let dt = match task.reminder_data.datetime.as_ref() {
                Some(d) => d,
                None => return false,
            };
            let parsed = match NaiveDateTime::parse_from_str(dt, "%Y-%m-%dT%H:%M:%S") {
                Ok(p) => p,
                Err(_) => return false,
            };
            let advance = chrono::Duration::minutes(task.reminder_data.advance_minutes as i64);
            parsed - advance <= now
        }
        "weekly" => {
            let wd = now.weekday().num_days_from_sunday() as u8;
            if !task.reminder_data.days.contains(&wd) { return false; }
            let rt = match NaiveTime::parse_from_str(&task.reminder_data.time, "%H:%M") {
                Ok(t) => t,
                Err(_) => return false,
            };
            let advance = chrono::Duration::minutes(task.reminder_data.advance_minutes as i64);
            now.date().and_time(rt) - advance <= now
        }
        _ => false,
    }
}

/// Update last_reminded for tasks whose reminder has passed.
fn update_last_reminded(tasks: &mut [TaskItem]) {
    let now = Local::now().naive_local();
    for t in tasks.iter_mut() {
        if t.completed { continue; }
        match t.reminder_type.as_str() {
            "once" => {
                if is_reminder_due(t, now) && t.last_reminded.is_none() {
                    t.last_reminded = Some(Local::now().format("%Y-%m-%d %H:%M:%S").to_string());
                }
            }
            "weekly" => {
                let today = Local::now().format("%Y-%m-%d").to_string();
                if is_reminder_due(t, now) && t.last_reminded.as_deref() != Some(&today) {
                    t.last_reminded = Some(today);
                }
            }
            _ => {}
        }
    }
}

/// Fire notifications for tasks whose reminders are newly due.
fn notify_due_tasks(app: &AppHandle, tasks: &[TaskItem]) -> Vec<String> {
    let now = Local::now().naive_local();
    let mut alerts = vec![];
    use tauri_plugin_notification::NotificationExt;
    for t in tasks {
        if !is_reminder_due(t, now) { continue; }
        let already_notified = match t.reminder_type.as_str() {
            "once" => t.last_reminded.is_some(),
            "weekly" => t.last_reminded.as_deref() == Some(&Local::now().format("%Y-%m-%d").to_string()),
            _ => true,
        };
        if already_notified { continue; }
        alerts.push(t.content.clone());
        let body = if t.reminder_type == "weekly" { "Weekly reminder" } else { "Single reminder" };
        app.notification().builder().title(&t.content).body(body).show().ok();
    }
    alerts
}

// ── Settings commands ──

#[tauri::command]
fn get_settings(app: AppHandle) -> Result<Settings, String> {
    let path = settings_path(&app);
    Ok(load_settings(&path))
}

#[tauri::command]
fn update_settings(app: AppHandle, state: State<'_, AppState>, settings: Settings) -> Result<(), String> {
    let path = settings_path(&app);
    save_settings(&path, &settings)?;
    // Re-load tasks from potentially new data directory
    modify_tasks(&state, &app, |_| {})?;
    Ok(())
}

#[tauri::command]
fn pick_directory(app: AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let file = app.dialog()
        .file()
        .blocking_pick_folder();
    Ok(file.map(|p| p.to_string()))
}

// ── Window commands ──

#[tauri::command]
fn minimize_window(app: AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("main") {
        w.minimize().map_err(|e| e.to_string())?;
    }
    Ok(())
}

// ── Task commands ──

#[tauri::command]
fn get_tasks(state: State<'_, AppState>, _app: AppHandle) -> Result<Vec<TaskItem>, String> {
    Ok(state.data.lock().map_err(|e| e.to_string())?.clone())
}

#[tauri::command]
fn add_task(state: State<'_, AppState>, app: AppHandle, content: String,
    reminder_type: String, reminder_data: ReminderData,
    link_url: Option<String>) -> Result<TaskItem, String> {
    let (path, mut data) = load_tasks_with_settings(&app);
    let position = data.tasks.len() as u32;
    let task = TaskItem {
        id: data.next_id, content, completed: false,
        pinned: false, persist: false, position,
        reminder_type, reminder_data, last_reminded: None,
        created_at: Local::now().format("%Y-%m-%dT%H:%M:%S").to_string(),
        completed_dates: Vec::new(),
        link_url,
    };
    data.next_id += 1;
    let _task_id = task.id;
    data.tasks.push(task.clone());
    save_tasks(&path, &data)?;
    *state.data.lock().map_err(|e| e.to_string())? = data.tasks;
    Ok(task)
}

#[tauri::command]
fn update_task(state: State<'_, AppState>, app: AppHandle, task: TaskItem) -> Result<(), String> {
    modify_tasks(&state, &app, |tasks| {
        if let Some(t) = tasks.iter_mut().find(|t| t.id == task.id) {
            *t = task;
        }
    })
}

#[tauri::command]
fn delete_task(state: State<'_, AppState>, app: AppHandle, id: u32) -> Result<(), String> {
    modify_tasks(&state, &app, |tasks| {
        tasks.retain(|t| t.id != id);
    })
}

#[tauri::command]
fn toggle_complete(state: State<'_, AppState>, app: AppHandle, id: u32) -> Result<(), String> {
    modify_tasks(&state, &app, |tasks| {
        if let Some(t) = tasks.iter_mut().find(|t| t.id == id) {
            if t.reminder_type == "weekly" {
                let today = Local::now().format("%Y-%m-%d").to_string();
                if let Some(pos) = t.completed_dates.iter().position(|d| d == &today) {
                    t.completed_dates.remove(pos);
                } else {
                    t.completed_dates.push(today.clone());
                    t.last_reminded = Some(today);
                }
            } else {
                t.completed = !t.completed;
            }
        }
    })
}

#[tauri::command]
fn check_and_notify(state: State<'_, AppState>, app: AppHandle) -> Result<Vec<String>, String> {
    let (path, mut data) = load_tasks_with_settings(&app);
    let alerts = notify_due_tasks(&app, &data.tasks);
    update_last_reminded(&mut data.tasks);
    save_tasks(&path, &data)?;
    *state.data.lock().map_err(|e| e.to_string())? = data.tasks.clone();
    Ok(alerts)
}

#[tauri::command]
fn reorder_tasks(state: State<'_, AppState>, app: AppHandle, ids: Vec<u32>) -> Result<(), String> {
    modify_tasks(&state, &app, |tasks| {
        for (i, id) in ids.iter().enumerate() {
            if let Some(t) = tasks.iter_mut().find(|t| t.id == *id) {
                t.position = i as u32;
            }
        }
    })
}

struct AppState { data: Mutex<Vec<TaskItem>> }

/// Open a URL using the system protocol handler.
#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    let allowed = ["https://", "http://", "mailto:", "tel:", "wemeet://"];
    if !allowed.iter().any(|s| url.starts_with(s)) {
        return Err(format!("URL scheme not allowed: {}", url));
    }
    open::that(&url).map_err(|e| format!("Failed to open URL: {}", e))
}

/// Apply or clear the Windows acrylic effect at runtime.
/// More reliable than calling setEffects/clearEffects from JS.
#[tauri::command]
fn set_glass_effect(app: AppHandle, enabled: bool) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("main") {
        #[cfg(target_os = "windows")]
        if enabled {
            w.set_effects(EffectsBuilder::new()
                .effect(Effect::Acrylic)
                .build()).map_err(|e| e.to_string())?;
        } else {
            // Empty Effects clears any existing window effect
            w.set_effects(EffectsBuilder::new()
                .build()).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let s_path = settings_path(&app.handle());
            let settings = load_settings(&s_path);
            let path = data_path(&app.handle(), &settings);
            let data = load_tasks(&path);
            app.manage(AppState { data: Mutex::new(data.tasks.clone()) });

            if let Some(w) = app.get_webview_window("main") {

                if settings.glass_effect {
                    #[cfg(target_os = "windows")]
                    w.set_effects(EffectsBuilder::new()
                        .effect(Effect::Acrylic)
                        .build())?;
                }

                // Close → hide (minimize to taskbar) on Windows
                let handle = app.handle().clone();
                w.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { .. } = event {
                        if let Some(w) = handle.get_webview_window("main") {
                            w.hide().ok();
                        }
                    }
                });
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_tasks, add_task, update_task, delete_task, toggle_complete, check_and_notify,
            get_settings, update_settings, pick_directory, reorder_tasks,
            minimize_window, open_url, set_glass_effect,
        ])
        .run(tauri::generate_context!())
        .expect("error running GlassTodo");
}

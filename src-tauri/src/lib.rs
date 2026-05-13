use chrono::{Datelike, Local};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{
    AppHandle, Manager, State, WindowEvent,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    window::{Effect, EffectsBuilder},
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReminderData {
    pub datetime: Option<String>,
    pub days: Vec<u8>,
    pub time: String,
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
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TodoData { pub tasks: Vec<TaskItem>, pub next_id: u32 }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub language: String,
    pub data_dir: Option<String>,
    #[serde(default = "default_true")]
    pub show_completed: bool,
}

fn default_true() -> bool { true }

impl Default for Settings {
    fn default() -> Self {
        Settings {
            language: "en".to_string(),
            data_dir: None,
            show_completed: true,
        }
    }
}

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

fn update_last_reminded(tasks: &mut [TaskItem]) {
    let now = Local::now();
    let today = now.format("%Y-%m-%d").to_string();
    let now_ts = now.format("%Y-%m-%d %H:%M:%S").to_string();
    for t in tasks.iter_mut() {
        if t.completed { continue; }
        if t.reminder_type == "once" {
            if let Some(ref dt) = t.reminder_data.datetime.clone() {
                if let Ok(dt) = chrono::NaiveDateTime::parse_from_str(&dt, "%Y-%m-%dT%H:%M:%S") {
                    if dt <= now.naive_local() && t.last_reminded.is_none() {
                        t.last_reminded = Some(now_ts.clone());
                    }
                }
            }
        } else if t.reminder_type == "weekly" {
            let wd = now.weekday().num_days_from_sunday() as u8;
            if t.reminder_data.days.contains(&wd) {
                if let Ok(rt) = chrono::NaiveTime::parse_from_str(&t.reminder_data.time, "%H:%M") {
                    if now.date_naive().and_time(rt) <= now.naive_local() && t.last_reminded.as_deref() != Some(&today) {
                        t.last_reminded = Some(today.clone());
                    }
                }
            }
        }
    }
}

// ── Settings commands ──

#[tauri::command]
fn get_settings(app: AppHandle) -> Result<Settings, String> {
    let path = settings_path(&app);
    Ok(load_settings(&path))
}

#[tauri::command]
fn update_settings(app: AppHandle, settings: Settings) -> Result<(), String> {
    let path = settings_path(&app);
    // If data_dir changed, reload tasks from new location into state
    let _old = load_settings(&path);

    save_settings(&path, &settings)?;

    let state: State<'_, AppState> = app.state();
    let new_path = data_path(&app, &settings);
    let data = load_tasks(&new_path);
    *state.data.lock().map_err(|e| e.to_string())? = data.tasks.clone();

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

// ── Task commands ──

// ── Window commands ──

#[tauri::command]
fn minimize_window(app: AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("main") {
        w.minimize().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn hide_window(app: AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("main") {
        w.hide().map_err(|e| e.to_string())?;
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
    reminder_type: String, reminder_data: ReminderData) -> Result<TaskItem, String> {
    let s_path = settings_path(&app);
    let settings = load_settings(&s_path);
    let path = data_path(&app, &settings);
    let mut data = load_tasks(&path);
    let position = data.tasks.len() as u32;
    let task = TaskItem {
        id: data.next_id, content, completed: false,
        pinned: false, persist: false, position,
        reminder_type, reminder_data, last_reminded: None,
        created_at: Local::now().format("%Y-%m-%dT%H:%M:%S").to_string(),
    };
    data.next_id += 1; data.tasks.push(task.clone());
    save_tasks(&path, &data)?;
    *state.data.lock().map_err(|e| e.to_string())? = data.tasks.clone();
    Ok(task)
}

#[tauri::command]
fn update_task(state: State<'_, AppState>, app: AppHandle, task: TaskItem) -> Result<(), String> {
    let s_path = settings_path(&app);
    let settings = load_settings(&s_path);
    let path = data_path(&app, &settings);
    let mut data = load_tasks(&path);
    if let Some(t) = data.tasks.iter_mut().find(|t| t.id == task.id) { *t = task; }
    save_tasks(&path, &data)?;
    *state.data.lock().map_err(|e| e.to_string())? = data.tasks.clone();
    Ok(())
}

#[tauri::command]
fn delete_task(state: State<'_, AppState>, app: AppHandle, id: u32) -> Result<(), String> {
    let s_path = settings_path(&app);
    let settings = load_settings(&s_path);
    let path = data_path(&app, &settings);
    let mut data = load_tasks(&path);
    data.tasks.retain(|t| t.id != id);
    save_tasks(&path, &data)?;
    *state.data.lock().map_err(|e| e.to_string())? = data.tasks.clone();
    Ok(())
}

#[tauri::command]
fn toggle_complete(state: State<'_, AppState>, app: AppHandle, id: u32) -> Result<(), String> {
    let s_path = settings_path(&app);
    let settings = load_settings(&s_path);
    let path = data_path(&app, &settings);
    let mut data = load_tasks(&path);
    if let Some(t) = data.tasks.iter_mut().find(|t| t.id == id) { t.completed = !t.completed; }
    save_tasks(&path, &data)?;
    *state.data.lock().map_err(|e| e.to_string())? = data.tasks.clone();
    Ok(())
}

#[tauri::command]
fn check_and_notify(state: State<'_, AppState>, app: AppHandle) -> Result<Vec<String>, String> {
    let s_path = settings_path(&app);
    let settings = load_settings(&s_path);
    let path = data_path(&app, &settings);
    let mut data = load_tasks(&path);
    let now = Local::now(); let mut alerts = vec![];
    let today_wd = now.weekday().num_days_from_sunday() as u8;
    use tauri_plugin_notification::NotificationExt;
    for t in &data.tasks {
        if t.completed { continue; }
        if t.reminder_type == "once" {
            if let Some(ref dt) = t.reminder_data.datetime {
                if let Ok(dt) = chrono::NaiveDateTime::parse_from_str(dt, "%Y-%m-%dT%H:%M:%S") {
                    if dt <= now.naive_local() && t.last_reminded.is_none() {
                        alerts.push(t.content.clone());
                        app.notification().builder().title(&t.content).body("Single reminder").show().ok();
                    }
                }
            }
        } else if t.reminder_type == "weekly" && t.reminder_data.days.contains(&today_wd) {
            if let Ok(rt) = chrono::NaiveTime::parse_from_str(&t.reminder_data.time, "%H:%M") {
                if now.date_naive().and_time(rt) <= now.naive_local()
                    && t.last_reminded.as_deref() != Some(&now.format("%Y-%m-%d").to_string()) {
                    alerts.push(t.content.clone());
                    app.notification().builder().title(&t.content).body("Weekly reminder").show().ok();
                }
            }
        }
    }
    update_last_reminded(&mut data.tasks);
    save_tasks(&path, &data)?;
    *state.data.lock().map_err(|e| e.to_string())? = data.tasks.clone();
    Ok(alerts)
}

#[tauri::command]
fn reorder_tasks(state: State<'_, AppState>, app: AppHandle, ids: Vec<u32>) -> Result<(), String> {
    let s_path = settings_path(&app);
    let settings = load_settings(&s_path);
    let path = data_path(&app, &settings);
    let mut data = load_tasks(&path);

    for (i, id) in ids.iter().enumerate() {
        if let Some(t) = data.tasks.iter_mut().find(|t| t.id == *id) {
            t.position = i as u32;
        }
    }
    save_tasks(&path, &data)?;
    *state.data.lock().map_err(|e| e.to_string())? = data.tasks.clone();
    Ok(())
}

struct AppState { data: Mutex<Vec<TaskItem>> }

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

            let show = MenuItemBuilder::with_id("show", "Show window").build(app)?;
            let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;
            let menu = MenuBuilder::new(app).item(&show).item(&quit).build()?;
            TrayIconBuilder::new()
                .menu(&menu)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "show" => { if let Some(w) = app.get_webview_window("main") { w.show().ok(); w.set_focus().ok(); } }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;

            if let Some(w) = app.get_webview_window("main") {
                let w2 = w.clone();
                w.clone().on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { .. } = event { w2.hide().ok(); }
                });

                #[cfg(target_os = "windows")]
                w.set_effects(EffectsBuilder::new()
                    .effect(Effect::Acrylic)
                    .build())?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_tasks, add_task, update_task, delete_task, toggle_complete, check_and_notify,
            get_settings, update_settings, pick_directory, reorder_tasks,
            minimize_window, hide_window,
        ])
        .run(tauri::generate_context!())
        .expect("error running GlassTodo");
}

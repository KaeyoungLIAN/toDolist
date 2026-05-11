# GlassTodo

**Version**: v2.1 · **Stack**: Tauri 2 (Rust + HTML/CSS/JS) · **Binary**: ~5MB, zero runtime deps · **Platform**: Windows / macOS / Linux

A premium, dark-glass todo app with reminder scheduling. Built with Tauri's Rust backend for notification and system tray support, and a vanilla frontend with **taste-ui** design principles — no emojis, no AI purple, no generic cards.

---

## Features

- **CRUD** — Add, edit, delete, and complete tasks
- **One-time reminders** — Set a specific date and time, native OS notification fires
- **Weekly reminders** — Select days of the week + time, repeats weekly
- **Date navigation** — Browse any date's tasks, quick-jump to today
- **Liquid glass UI** — `backdrop-filter: blur` + 1px inner border + inner shadow for true refraction
- **Pin window** — Toggle always-on-top mode
- **System tray** — Close hides to tray, background reminder checking
- **Inline undo** — Deletion shows a 5-second undo bar instead of a confirm dialog
- **Spring physics** — Custom `cubic-bezier(0.16, 1, 0.3, 1)` on all interactive elements

---

## Setup

Install two tools (once):

### 1. Rust

Download from [rustup.rs](https://rustup.rs/) or the [official installer](https://www.rust-lang.org/tools/install).

**Chinese mirror** — Create `~/.cargo/config.toml`:

```toml
[source.crates-io]
replace-with = "tuna"

[source.tuna]
registry = "https://mirrors.tuna.tsinghua.edu.cn/git/crates.io-index.git"
```

Verify: `rustc --version && cargo --version`

### 2. Node.js

Download LTS from [nodejs.org](https://nodejs.org/).

**Chinese mirror:**

```bash
npm config set registry https://registry.npmmirror.com
```

Verify: `node --version && npm --version`

### 3. WebView2

Windows 10/11 includes WebView2. If missing, install from [Microsoft](https://developer.microsoft.com/en-us/microsoft-edge/webview2/).

---

## Build & Run

```bash
git clone https://github.com/KaeyoungLIAN/toDolist.git
cd toDolist
npm install
cd src-tauri
cargo tauri dev         # Dev mode (hot reload)
cargo tauri build       # Production build
```

### Output

```
src-tauri/target/release/
  GlassTodo.exe         ← Standalone binary (~5MB)
  bundle/msi/           ← MSI installer
```

Copy `GlassTodo.exe` to any Windows 10/11 machine — double-click to run. No runtime required.

### One-click build

Double-click `build.bat` — checks Rust, runs npm install, builds.

---

## Project Structure

```
toDolist/
├── src/                    ← Frontend (vanilla HTML/CSS/JS)
│   ├── index.html          ← Layout
│   ├── style.css           ← Dark glass theme (taste-ui)
│   └── main.js             ← Tauri API calls + interactivity
├── src-tauri/              ← Tauri + Rust backend
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── capabilities/default.json
│   ├── icons/
│   └── src/
│       ├── main.rs
│       └── lib.rs          ← CRUD, notifications, tray
├── package.json
├── build.bat
└── README.md
```

## Data

Stored at `%APPDATA%/com.glasstodo.app/data.json`:

```json
{
  "tasks": [
    {
      "id": 1,
      "content": "Buy groceries",
      "completed": false,
      "reminder_type": "once",
      "reminder_data": { "datetime": "2026-05-15T14:30:00", "days": [], "time": "09:00" },
      "last_reminded": null,
      "created_at": "2026-05-11T10:00:00"
    }
  ],
  "next_id": 2
}
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Slow crate download | Configure Tsinghua mirror (see Setup) |
| `x86_64-pc-windows-msvc not installed` | `rustup default stable-msvc` |
| WebView2 missing | Install from Microsoft link above |
| `npm install` fails | Delete `node_modules` + `package-lock.json`, retry |

---

**GitHub**: [github.com/KaeyoungLIAN/toDolist](https://github.com/KaeyoungLIAN/toDolist)

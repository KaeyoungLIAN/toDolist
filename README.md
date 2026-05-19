# GlassTodo

<kbd>![GitHub release](https://img.shields.io/github/v/release/KaeyoungLIAN/GlassToDo)</kbd>
<kbd>![Built with Tauri](https://img.shields.io/badge/Tauri-2.11-%23FFC131)</kbd>
<kbd>![React 19](https://img.shields.io/badge/React-19-%2361DAFB)</kbd>
<kbd>![Windows/macOS/Linux](https://img.shields.io/badge/Windows%20%7C%20macOS%20%7C%20Linux-all-%23808080)</kbd>

> **窗口级毛玻璃待办 · Liquid glass meets everyday productivity**  
> 一款极致的毛玻璃待办应用 —— 弹簧物理、单色系、逐项交错入场、零 emoji。  
> 约 **5MB** 单文件，零运行时依赖，起于 Tauri 2.11 (Rust) + React 19。

---

## 产品概览

**GlassTodo** 不是又一款"漂亮但用不起来"的待办。它在 5MB 的单文件中打包了：

- 完整的任务管理（添加 / 编辑 / 删除 / 完成 / 置顶 / 排序 / 搜索）
- **单次提醒**（指定日期 + 时间 → 系统通知弹窗）
- **每周重复提醒**（选一周中的几天 + 时间，到点自动通知）
- 窗口级毛玻璃效果（Windows Acrylic）
- **暗色 + 亮色主题**，随心切换
- 三语界面（中文 / English / 日本語）
- **原子写入 + 自动备份**，崩溃不丢数据

| 暗色主题 | 亮色主题 |
|----------|----------|
| ![Dark mockup placeholder](https://via.placeholder.com/480x320/0c0c10/34d399?text=GlassTodo+Dark) | ![Light mockup placeholder](https://via.placeholder.com/480x320/ecedf0/059669?text=GlassTodo+Light) |

---

## 功能

### 任务管理

| 功能 | 说明 |
|------|------|
| 添加任务 | 输入文字 → 按 Enter。**普通模式** = 当天待办；**定时模式** = 可选日期/重复 |
| 编辑任务 | 点击铅笔图标，面板自动展开回填，修改后保存 |
| 标记完成 | 点击复选框 → `check-fade` 动画（克制 fade，无弹跳）→ 自动淡出 |
| 删除任务 | 点击垃圾桶 → `fly-left` 飞走动画 → **移入回收站，可恢复** |
| 置顶 / 储留 | 单个按钮切换状态，active = accent 色高亮 |
| 排序 | 每张卡片左侧的上下箭头 → `reorder_tasks` 持久化到 JSON |
| 搜索 | 标题栏放大镜按钮 → 实时过滤任务列表 |

### 提醒系统

- **单次提醒**：选择日期 (`DatePicker`) + 时间 (`TimePicker`)，到点触发系统通知
- **每周提醒**：选择周几（`日` 到 `六`）+ 时间，每周重复
- `check_and_notify` 每分钟轮询 + 窗口可见性变化时重新检查
- `last_reminded` 标记防止重复推送
- 依赖 `tauri-plugin-notification`

### 日期导航

- **DateBar**：当日日期居中显示，左右箭头前后翻页，一键「今天」返回
- **DatePicker 弹出日历**：点击日期文字弹出，选择任意日期跳转
- **智能过滤**：只显示当天的任务 + 已过期的 sustain 任务 + 每周任务

### 主题

> 在 **设置 → 主题** 中自由切换暗色/亮色。

- **CSS 变量体系**：23 个 `--xxx` 变量，`.theme-light` 类名一次切换全局
- **暗色**：`#0c0c10` 基底 + emerald 强调，适合弱光环境
- **亮色**：`#ecedf0` 基底 + 深绿强调，高对比度，适合白天场景
- 选择持久化到 Rust `settings.json`，重启保留
- body 带有 emerald 径向渐变光晕 → 毛玻璃元素有 *可折射的内容*，视觉效果不扁平
- 所有弹出框（DatePicker / TimePicker / Help / Settings）均已适配双主题

### 国际化

| 语言 | 代码 | 条目 |
|------|------|------|
| 中文 | `zh` | 默认 — 完整 UI + 日历标签 + 操作说明 |
| English | `en` | 回退语言 |
| 日本語 | `ja` | 全部 UI 字符串翻译 |

在设置中一键切换，无需重启。下次启动保留选择。

---

## 设计理念

GlassTodo 遵循 **[taste-ui 设计规范](https://github.com/KaeyoungLIAN/GlassToDo)**——一套消除 AI 通用 UI 痕迹的设计系统。

### 液体玻璃

```
background: rgba(24, 24, 30, 0.42);       /* 深色半透明玻璃底色 */
backdrop-filter: blur(24px);               /* 模糊底层内容 */
box-shadow: inset 0 1px 0 rgba(255,255,255,0.07);  /* 边缘高光 */
border: 1px solid rgba(255,255,255,0.10);          /* 折射边缘 */
```

- 所有玻璃元素使用与背景色同色调的阴影（`rgba(12,12,16,0.X)` 而非 `rgba(0,0,0,0.X)`）
- body 层叠 emerald 径向渐变，提供 backgrop-filter 可折射的色差
- 亮色主题下保留相同的玻璃结构，仅调整色值和透明度

### 弹簧物理

所有交互使用 `cubic-bezier(0.16, 1, 0.3, 1)` —— 没有 linear 过渡，没有平淡的 ease-in-out。

**Lift + Press 系统**：每个可点击元素都有
- Hover：`translateY(-1px)` + 背景/颜色变化
- Active：`scale(0.96)` + `translateY(0)`（复位提升，防止与悬停相争）

### 克制动画

| 动画 | 持续时间 | 特性 |
|------|---------|------|
| 任务入场（stagger） | 350ms | `translateY(8px) scale(0.97) → 1`，逐项延迟 40ms |
| 勾选（check-fade） | 200ms | `ease-out`，无弹跳 |
| 删除（fly-left） | 380ms | `translateX(-120%)`，快速且方向明确 |
| 完成（complete-sink） | 500ms | 含 `blur(2px)` 下沉效果，语义优雅 |
| 折叠面板 | 450ms | `grid-template-rows: 0fr → 1fr`，零布局震荡 |
| gear 回弹 | 400ms | 设置齿轮悬停时旋转，纯旋转无缩放 |

### 视觉规范

- **单色系**：所有强调色共用 emerald（暗色 `#10b981` / 亮色 `#059669`），无第二个强调
- **无 AI 紫**：无紫色按钮、无霓虹渐变、无蓝色光晕
- **无纯黑**：最深的颜色是 `#0c0c10`
- **无 emoji**：全部图标使用内联 SVG，`currentColor` + 16px 网格
- **无 Inter 字体**：系统字体栈 `-apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif`
- **100dvh**：全屏使用 `100dvh`，非 `100vh`

---

## 快速入门

### 下载

从 [Releases](https://github.com/KaeyoungLIAN/GlassToDo/releases) 页面下载对应平台的安装包：

- **Windows**: `GlassToDo_x64.msi`（或直接下载 `GlassTodo.exe`）
- **macOS**: `.dmg` 安装包
- **Linux**: `.deb` / `.AppImage`

解压后双击运行，无需额外配置。

### 首次使用

1. 启动后，底部输入框已获得焦点
2. 输入「今天要做的事」，按 Enter —— 创建一个当天待办
3. 点击复选框标记完成
4. 点击齿轮图标打开设置 → 切换语言/主题/数据目录
5. 关闭窗口 → 应用自动隐藏到系统托盘。右键托盘图标 → Show window / Quit

### 使用提醒

```
添加任务时：

普通模式 ──── 输入文字 → 按 Enter = 当天23:59截止

定时模式 ──── 切换[Scheduled]后：
  ├── 单次：选日期 → 选时间 → 按 Enter
  └── 每周：选天数 → 选时间 → 按 Enter
```

提醒到点后会弹出 **系统通知**（需允许通知权限）。

---

## 构建指南

> **生产用户**：直接下载 [Releases](https://github.com/KaeyoungLIAN/GlassToDo/releases) 页面编译好的安装包，无需自行构建。

### 前置条件

#### Windows

| 依赖 | 版本要求 | 用途 |
|------|----------|------|
| Rust | 1.80+ | 编译 Tauri 后端 |
| Node.js | 18+ LTS | Vite 构建前端 |
| Visual Studio 2022 | Community 版，勾选 **"使用 C++ 的桌面开发"** | MSVC 链接器 + Windows SDK |
| WebView2 | Windows 10/11 内置 | 渲染前端界面 |

> ⚠️ **必须**：安装 VS 2022 时选中 **"Desktop development with C++"** 工作负载，否则 `cargo build` 会报 `link.exe not found`。
>
> 如果漏装了，打开 Visual Studio Installer → 修改 → 勾选"使用 C++ 的桌面开发" → 安装（约 2GB）。

#### Linux

```bash
# Debian/Ubuntu
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
  libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev

# Arch Linux
sudo pacman -S webkit2gtk-4.1 base-devel curl wget file \
  openssl appmenu-gtk-module gtk3 libappindicator-gtk3 librsvg
```

#### macOS

```bash
xcode-select --install
```

### 安装工具链

#### 1. Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

**中国镜像加速** —— 创建 `~/.cargo/config.toml`：

```toml
[source.crates-io]
replace-with = "tuna"

[source.tuna]
registry = "https://mirrors.tuna.tsinghua.edu.cn/git/crates.io-index.git"
```

验证：

```bash
rustc --version   # 应 >= 1.80
cargo --version
```

**Windows MSVC（重要）**：

```bash
rustup default stable-msvc
rustup target list --installed | grep msvc   # 应显示 x86_64-pc-windows-msvc
```

#### 2. Node.js

从 [nodejs.org](https://nodejs.org/) 下载 LTS 版本（18+）。

**中国镜像：**

```bash
npm config set registry https://registry.npmmirror.com
```

验证：

```bash
node --version   # 应 >= 18
npm --version
```

#### 3. WebView2

Windows 10/11 已内置。如有问题，从 [Microsoft 官方页面](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) 下载安装独立运行时。

---

### 快速构建

#### 克隆并安装依赖

```bash
git clone https://github.com/KaeyoungLIAN/GlassToDo.git
cd GlassToDo
npm install
```

> `npm install` 安装约 15 秒。如果失败，删除 `node_modules` 和 `package-lock.json` 重试。

#### 开发模式

```bash
npm run tauri dev
```

首次运行会下载 Rust crate（约 100+ 个依赖，中国镜像约 3-8 分钟），之后增量编译约 30 秒。修改 React 代码自动热更新。

#### 生产构建

```bash
npm run tauri build
```

构建产物在：

```
src-tauri/target/release/
├── GlassTodo.exe              ← 独立 exe (~5MB)
└── bundle/
    └── GlassTodo_2.0.0_x64.msi  ← MSI 安装包
```

> `npm run tauri build -- --bundles none` 跳过 MSI 打包，仅生成 `.exe`，构建更快。

#### 一键构建（Windows）

双击 `build.bat` — 自动检查 Rust → npm install → tauri build。

#### 更新到最新版

```bash
cd GlassToDo
git pull
npm install
npm run tauri build
```

---

## 技术栈

| 层 | 技术 | 版本 |
|----|------|------|
| 框架 | Tauri 2 | ^2.0.0 |
| 前端 | React + Vite | 19 / 6 |
| 后端 | Rust | 2021 edition |
| 持久化 | JSON 文件（atomic write） | — |
| 通知 | tauri-plugin-notification | 2 |
| 文件对话框 | tauri-plugin-dialog | 2 |
| Shell | tauri-plugin-shell | 2 |
| 序列化 | serde / serde_json | 1 |
| 日期 | chrono | 0.4 |
| 图标 | 内联 SVG | — |

---

## 项目结构

```
GlassToDo/
├── src/                    ← React 19 前端
│   ├── index.html
│   ├── main.jsx            ← React 入口
│   ├── App.jsx             ← 主应用（状态管理）
│   ├── i18n.js             ← 国际化（en/zh/ja）
│   ├── components/
│   │   ├── TitleBar.jsx    ← 窗口控制（设置/置顶/最小化/关闭）
│   │   ├── DateBar.jsx     ← 日期导航
│   │   ├── TaskList.jsx    ← 任务列表容器
│   │   ├── TaskCard.jsx    ← 单条任务卡片
│   │   ├── BottomPanel.jsx ← 输入面板 + 提醒配置
│   │   ├── SettingsModal.jsx ← 设置弹窗（语言/主题/数据目录）
│   │   ├── WelcomeModal.jsx ← 首次使用引导弹窗
│   │   ├── TrashModal.jsx  ← 回收站弹窗（恢复/清空）
│   │   ├── DatePicker.jsx  ← 自定义日历选择器
│   │   └── TimePicker.jsx  ← 自定义时间选择器
│   └── styles/
│       ├── main.css         ← 入口样式
│       ├── variables.css    ← CSS 变量（颜色/半径/缓动）
│       ├── animations.css   ← 关键帧动画
│       └── components/      ← 各组件 CSS
│           ├── trash-modal.css  ← 回收站样式
├── src-tauri/              ← Tauri + Rust 后端
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── capabilities/default.json
│   ├── icons/
│   └── src/
│       ├── main.rs
│       └── lib.rs          ← CRUD、通知、窗口毛玻璃、托盘菜单
├── package.json
├── vite.config.js
├── build.bat
└── README.md
```

---

## 数据存储

任务和设置存储为本地 JSON 文件。设置位于 `%APPDATA%/com.glasstodo.app/`，可在设置弹窗中自定义数据目录。

```json
{
  "tasks": [
    {
      "id": 1,
      "content": "买菜",
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

所有写操作使用 **原子写入**（写 tmp 文件 → rename），崩溃不会损坏数据。

---

## 常见构建问题

| 错误 | 原因 | 解决 |
|------|------|------|
| `link.exe not found` | 未安装 Visual Studio C++ 工作负载 | 安装 VS 2022，勾选"使用 C++ 的桌面开发" |
| `crate 'tauri' feature 'xxx' not found` | Tauri 版本 features 不匹配 | 对照 `Cargo.toml` 确认 feature 名 |
| `tauri::utils::config::WindowEffect not found` | 导入路径对不上 Tauri 版本 | 新版用 `WindowEffect`，旧版用 `Effect` |
| `pick_folder()` 参数缺失 | tauri-plugin-dialog API 变更 | 改用 `blocking_pick_folder()` |
| `x86_64-pc-windows-msvc not installed` | 未设 MSVC 工具链 | `rustup default stable-msvc` |
| cargo crate 下载超时 | 国内网络问题 | 配置清华大学镜像 |
| `npm install` 失败 | npm 缓存或网络 | 删 `node_modules` + `package-lock.json` 重试 |
| WebView2 运行时错误 | 系统缺失 WebView2 | 从 Microsoft 下载安装 |
| `GLib-GIO` 警告（Linux） | 缺失 appindicator | `sudo apt install libayatana-appindicator3-dev` |

---

## 常见问题

**Q: 如何开机自启？**  
A: 当前版本未内置开机自启。Windows 上可以将其添加到 `C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup\`。

**Q: 数据会丢失吗？**  
A: 使用原子写入 + 自动 `.json.bak` 备份，崩溃不会损坏数据。每次保存自动创建备份，主文件损坏时自动尝试恢复。

**Q: 可以导出数据吗？**  
A: 目前可以直接复制 `data.json` 文件。未来版本会加入导出功能。

**Q: 为什么关闭窗口不会退出？**  
A: 这是设计使然 —— GlassTodo 隐藏到系统托盘，在后台继续检查提醒。右键托盘图标 → Quit 彻底退出。

**Q: 支持跨平台同步吗？**  
A: 不支持。数据存储在本地 JSON 文件中，可通过手动复制实现基本同步。

---

## 许可

MIT License — 详见 [LICENSE](LICENSE)。

---

## 版本历史

| 日期 | 版本 | 内容 |
|------|------|------|
| 2026-05-19 | — | **回收站系统**：移除撤销栏，改为回收站模态框（FIFO 最多 10 条），支持逐条恢复 / 清空；**数据自动备份**：每次保存原子写入后备份 `.json.bak`，主文件损坏自动读取备份；**文件互斥锁**：并发操作防 TOCTOU 竞态；**通知权限**：检查 Denied / Prompt 状态，按需请求；**每周提醒**：当天已完成则跳过推送；**缓存修复**：`check_and_notify` 后自动刷新任务列表 |
| 2026-05-18 | — | **提前提醒**：支持设置提前 N 分钟通知；**TimePicker**：滚轮方向修正、键盘数字输入、分钟按钮修复；**动画 CSS** 增加 `undo-enter`、`complete-sink`、`fly-left` |
| 2026-05-17 | — | **窗口折叠模式**：按 `` ` `` 键折叠为迷你栏，可拖拽 / 置顶 / 显示剩余数，再次按 `` ` `` 恢复原大小；**玻璃效果开关**：设置中可关闭/开启毛玻璃（Windows Acrylic），通过 Rust 命令可靠切换；**置顶按钮**：折叠栏 + 标题栏支持窗口置顶；**代码深化**：5 处架构重构 |
| 2026-05-16 | — | **折叠栏初版 + 回滚**：初始实现后删除，第二天用 Tauri resize 重做；**代码审计修复**：权限 / CSP / 竞态 / 性能优化 |
| 2026-05-14 | — | **全局搜索**：全屏覆盖层，按内容搜索所有日期，结果按日期分组；**链接 / 会议整合**：任务支持链接（网页 / 腾讯会议），腾讯会议自动 `wemeet://` 原生协议一键入会；**open_url 命令**：自定义 Rust 命令替代 shell 插件，绕过权限弹窗；**搜索覆盖层重构**：搜索时隐藏 TaskList 显示搜索面板 |
| 2026-05-13 | — | **亮色主题**：CSS 变量体系全量适配，暗色/亮色可切换并持久化；**欢迎弹窗**：首次使用引导，可勾选"不再显示"；**帮助弹窗**：`?` 按钮打开操作说明列表，SVG 图标与 TaskCard 控件一致；**i18n 完善**：全部 UI 字符串中英双语，默认中文；**毛玻璃全面优化**：弹窗透明度 / 对比度 / 圆角迭代至稳定；**圆角 + 边框**：窗口 16px 圆角、玻璃可见边框；**日语移除** |
| 2026-05-12 | — | **taste-ui 全面改造**：液体玻璃（`backdrop-filter: blur(24px)` + 边缘高光 + 内阴影）、弹簧物理（`cubic-bezier(0.16,1,0.3,1)`）、内联撤销栏；**存档系统**：过去任务自动归档，可恢复；**DWM Acrylic**：窗口级毛玻璃 + CSS 重构；**9 项修复**：窗口圆角、拖拽漂移、日期过滤、i18n、日期选择器溢出、拖拽排序、更新突变、标题栏按钮；**7 项修复**：底部面板折叠、下拉菜单、TimePicker 居中、储留功能、拖拽区域 |
| 2026-05-11 | v2.0 | **GlassTodo v2.0 初始发布**：从 Tauri 1 迁移至 Tauri 2.11，Rust + React 19 + Vite 6；约 5MB 单文件，零运行时依赖；支持单次/每周提醒、日期导航、置顶、排序、暗色主题、中英双语 |

---

**GitHub**: [github.com/KaeyoungLIAN/GlassToDo](https://github.com/KaeyoungLIAN/GlassToDo)  
**作者**: [@KaeyoungLIAN](https://github.com/KaeyoungLIAN)

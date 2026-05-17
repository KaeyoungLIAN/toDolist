const i18n = {
  en: {
    appName: "GlassTodo",
    whatNeedsDone: "What needs to be done?",
    addTask: "Add Task",
    updateTask: "Update Task",
    emptyInput: "Please enter text",
    quickGuide: "Quick Guide",
    showWelcome: "Show welcome guide",
    welcomeTitle: "Welcome to GlassTodo",
    welcomeDesc: "A frosted-glass desktop to-do app with instant task creation, scheduled reminders, global search, and meeting link support.",
    oneTime: "One-time",
    weekly: "Weekly",
    done: "Done",
    deleteCancelled: "Delete cancelled",
    taskUpdated: "Task updated",
    taskAdded: "Task added",
    error: "Error",
    today: "Today",
    settings: "Settings",
    language: "Language",
    dataDir: "Data directory",
    chooseFolder: "Choose folder",
    defaultLocation: "Default (app data)",
    close: "Close",
    deletePrefix: "Deleted",
    sun: "Sun", mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat",
    noTasks: "No tasks yet",
    noTasksHint: "Type below and press Enter to add one",
    showCompleted: "Show completed tasks",
    normal: "Normal",
    scheduled: "Scheduled",
    persist: "Keep as template",
    undo: "Undo",
    yes: "Yes",
    no: "No",
    pinned: "Pinned",
    searchPlaceholder: "Search tasks...",
    yesterday: "Yesterday",
    thisWeek: "This week",
    theme: "Theme",
    dark: "Dark",
    light: "Light",
    todayToDo: "Today to-do",
    linkPlaceholder: "Link URL",
    meetingCode: "Meeting code",
    invalidLink: "Invalid link URL",
    moveUp: "Move up",
    moveDown: "Move down",
    pinToTop: "Pin to top",
    unpin: "Unpin",
    edit: "Edit",
    delete: "Delete",
    openLink: "Open link",
    search: "Search",
    minimize: "Minimize",
    resetDir: "Reset to default",
    pickDate: "Pick date",
    prevMonth: "Previous month",
    nextMonth: "Next month",
    prevDay: "Previous day",
    nextDay: "Next day",
    pickTime: "Pick time",
    increaseHour: "Increase hour",
    decreaseHour: "Decrease hour",
    increaseMinute: "Increase minute",
    decreaseMinute: "Decrease minute",
    webLink: "Web link",
    meetingLink: "Tencent Meeting",
    glassEffect: "Glass effect",
    glassEffectWarning: "Enabling may cause dragging to feel slower",
  },
  zh: {
    appName: "玻璃待办",
    whatNeedsDone: "需要做什么？",
    addTask: "添加任务",
    updateTask: "更新任务",
    emptyInput: "请输入文本",
    quickGuide: "操作指南",
    showWelcome: "显示欢迎引导",
    welcomeTitle: "欢迎使用 GlassTodo",
    welcomeDesc: "GlassTodo 是一款毛玻璃风格桌面待办应用，支持即时创建、定时提醒、全局搜索、会议链接绑定。",
    oneTime: "单次",
    weekly: "每周",
    done: "已完成",
    deleteCancelled: "已取消删除",
    taskUpdated: "任务已更新",
    taskAdded: "任务已添加",
    error: "错误",
    today: "今天",
    settings: "设置",
    language: "语言",
    dataDir: "数据目录",
    chooseFolder: "选择文件夹",
    defaultLocation: "默认（应用数据）",
    close: "关闭",
    deletePrefix: "已删除",
    sun: "星期日", mon: "星期一", tue: "星期二", wed: "星期三", thu: "星期四", fri: "星期五", sat: "星期六",
    noTasks: "暂无任务",
    noTasksHint: "在下方输入并按回车添加",
    showCompleted: "显示已完成任务",
    normal: "普通",
    scheduled: "定时",
    persist: "保留为模板",
    undo: "撤销",
    yes: "是",
    no: "否",
    pinned: "已置顶",
    searchPlaceholder: "搜索任务...",
    yesterday: "昨日完成",
    thisWeek: "本周完成",
    theme: "主题",
    dark: "暗色",
    light: "亮色",
    todayToDo: "今日待完成",
    linkPlaceholder: "网页链接",
    meetingCode: "会议号",
    invalidLink: "链接格式无效",
    moveUp: "上移",
    moveDown: "下移",
    pinToTop: "置顶",
    unpin: "取消置顶",
    edit: "编辑",
    delete: "删除",
    openLink: "打开链接",
    search: "搜索",
    minimize: "最小化",
    resetDir: "恢复默认",
    pickDate: "选择日期",
    prevMonth: "上个月",
    nextMonth: "下个月",
    prevDay: "前一天",
    nextDay: "后一天",
    pickTime: "选择时间",
    increaseHour: "增加小时",
    decreaseHour: "减少小时",
    increaseMinute: "增加分钟",
    decreaseMinute: "减少分钟",
    webLink: "网页链接",
    meetingLink: "腾讯会议",
    glassEffect: "毛玻璃效果",
    glassEffectWarning: "开启后拖拽窗口可能变慢",
  },
};

const LANG_NAMES = {
  en: "English",
  zh: "中文",
};

export function t(lang, key) {
  const dict = i18n[lang] || i18n.en;
  return dict[key] !== undefined ? dict[key] : i18n.en[key] || key;
}

export function weekdayNames(lang) {
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map((k) => t(lang, k));
}

/** Day labels for the weekly picker buttons — short form */
export function dayLabels(lang) {
  if (lang === "zh") return ["一","二","三","四","五","六","日"];
  return ["M","T","W","T","F","S","S"]; // en default
}

/** Month names for the DatePicker calendar header */
export function monthNames(lang) {
  if (lang === "zh") return ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"];
  return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
}

/** Short weekday labels in Sun-Sat order for calendar grids */
export function weekdayShort(lang) {
  if (lang === "zh") return ["日","一","二","三","四","五","六"];
  return ["S","M","T","W","T","F","S"];
}

export function availableLangs() {
  // zh first per user preference
  const order = ["zh", "en"];
  return order.filter((code) => i18n[code]).map((code) => ({ code, name: LANG_NAMES[code] || code }));
}

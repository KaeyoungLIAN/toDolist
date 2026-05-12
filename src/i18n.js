export const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

const i18n = {
  en: {
    appName: "GlassTodo",
    whatNeedsDone: "What needs to be done?",
    add: "Add",
    update: "Update",
    normal: "Normal",
    scheduled: "Scheduled",
    oneTime: "One-time",
    weekly: "Weekly",
    done: "Done",
    undo: "Undo",
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
    yes: "Yes",
    no: "No",
    pinned: "Pinned",
    persist: "Persist",
    searchPlaceholder: "Search tasks...",
    yesterday: "Yesterday",
    thisWeek: "This week",
  },
  zh: {
    appName: "玻璃待办",
    whatNeedsDone: "需要做什么？",
    add: "添加",
    update: "更新",
    normal: "普通",
    scheduled: "定时",
    oneTime: "单次",
    weekly: "每周",
    done: "已完成",
    undo: "撤销",
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
    sun: "日", mon: "一", tue: "二", wed: "三", thu: "四", fri: "五", sat: "六",
    noTasks: "暂无任务",
    noTasksHint: "在下方输入并按回车添加",
    showCompleted: "显示已完成任务",
    yes: "是",
    no: "否",
    pinned: "已置顶",
    persist: "持久化",
    searchPlaceholder: "搜索任务...",
    yesterday: "昨日完成",
    thisWeek: "本周完成",
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

export function availableLangs() {
  return Object.keys(i18n).map((code) => ({ code, name: LANG_NAMES[code] || code }));
}

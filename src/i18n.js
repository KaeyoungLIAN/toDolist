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
  },
  zh: {
    appName: "玻璃待办",
    whatNeedsDone: "需要做什么？",
    add: "添加",
    update: "更新",
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
    sun: "日", mon: "一", tue: "二", wed: "三", thu: "四", fri: "五", sat: "六",
  },
  ja: {
    appName: "グラスTodo",
    whatNeedsDone: "何をしますか？",
    add: "追加",
    update: "更新",
    oneTime: "一回",
    weekly: "毎週",
    done: "完了",
    deleteCancelled: "削除をキャンセル",
    taskUpdated: "タスクを更新",
    taskAdded: "タスクを追加",
    error: "エラー",
    today: "今日",
    settings: "設定",
    language: "言語",
    dataDir: "データディレクトリ",
    chooseFolder: "フォルダを選択",
    defaultLocation: "デフォルト（アプリデータ）",
    close: "閉じる",
    deletePrefix: "削除しました",
    sun: "日", mon: "月", tue: "火", wed: "水", thu: "木", fri: "金", sat: "土",
  },
};

const LANG_NAMES = {
  en: "English",
  zh: "中文",
  ja: "日本語",
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

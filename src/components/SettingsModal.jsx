import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { t, availableLangs } from "../i18n";

export default function SettingsModal({ lang, theme, showCompleted, showWelcome, onClose, onSettingsChange }) {
  const [settings, setSettings] = useState({ language: lang, theme: "dark", data_dir: null, show_completed: true, show_welcome: true });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke("get_settings")
      .then((s) => {
        setSettings(s);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const update = async (updated) => {
    setSettings(updated);
    await invoke("update_settings", { settings: updated }).catch(console.error);
    onSettingsChange(updated.language, updated.data_dir, updated.show_completed, updated.theme, updated.show_welcome, updated.glass_effect);
  };

  const handleLangChange = (code) => {
    update({ ...settings, language: code });
  };

  const handlePickDir = async () => {
    try {
      const dir = await invoke("pick_directory");
      if (dir) {
        update({ ...settings, data_dir: dir });
      }
    } catch (e) {
      console.error("pick directory error:", e);
    }
  };

  const handleResetDir = async () => {
    update({ ...settings, data_dir: null });
  };

  const toggleShowCompleted = () => {
    update({ ...settings, show_completed: !settings.show_completed });
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
          <div className="settings-loading" />
        </div>
      </div>
    );
  }

  const langs = availableLangs();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>{t(settings.language, "settings")}</span>
        </div>

        <div className="settings-body">
          {/* Language */}
          <div className="settings-field">
            <label className="settings-label">{t(settings.language, "language")}</label>
            <div className="settings-lang-options">
              {langs.map((l) => (
                <button
                  key={l.code}
                  className={`lang-btn${settings.language === l.code ? " active" : ""}`}
                  onClick={() => handleLangChange(l.code)}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </div>

          {/* Show completed tasks */}
          <div className="settings-field">
            <label className="settings-label">{t(settings.language, "showCompleted")}</label>
            <label className="toggle-row" onClick={toggleShowCompleted}>
              <div className={`toggle-track${settings.show_completed ? " on" : ""}`}>
                <div className="toggle-thumb" />
              </div>
              <span className="toggle-label">{settings.show_completed ? t(settings.language, "yes") : t(settings.language, "no")}</span>
            </label>
          </div>

          {/* Show welcome guide */}
          <div className="settings-field">
            <label className="settings-label">{t(settings.language, "showWelcome")}</label>
            <label className="toggle-row" onClick={() => update({ ...settings, show_welcome: !settings.show_welcome })}>
              <div className={`toggle-track${settings.show_welcome ? " on" : ""}`}>
                <div className="toggle-thumb" />
              </div>
              <span className="toggle-label">{settings.show_welcome ? t(settings.language, "yes") : t(settings.language, "no")}</span>
            </label>
          </div>

          {/* Glass effect */}
          <div className="settings-field">
            <label className="settings-label">{t(settings.language, "glassEffect")}</label>
            <label className="toggle-row" onClick={() => update({ ...settings, glass_effect: !settings.glass_effect })}>
              <div className={`toggle-track${settings.glass_effect ? " on" : ""}`}>
                <div className="toggle-thumb" />
              </div>
              <span className="toggle-label">{settings.glass_effect ? t(settings.language, "yes") : t(settings.language, "no")}</span>
            </label>
            {settings.glass_effect && (
              <div className="settings-hint">{t(settings.language, "glassEffectWarning")}</div>
            )}
          </div>

          {/* Theme */}
          <div className="settings-field">
            <label className="settings-label">{t(settings.language, "theme")}</label>
            <div className="settings-lang-options">
              {["dark", "light"].map((th) => (
                <button
                  key={th}
                  className={`lang-btn${settings.theme === th ? " active" : ""}`}
                  onClick={() => update({ ...settings, theme: th })}
                >
                  {t(settings.language, th)}
                </button>
              ))}
            </div>
          </div>

          {/* Data directory */}
          <div className="settings-field">
            <label className="settings-label">{t(settings.language, "dataDir")}</label>
            <div className="settings-dir-row">
              <span className="settings-dir-path">
                {settings.data_dir || t(settings.language, "defaultLocation")}
              </span>
              <button className="settings-dir-btn" onClick={handlePickDir}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                <span>{t(settings.language, "chooseFolder")}</span>
              </button>
              {settings.data_dir && (
                <button className="settings-dir-btn reset" onClick={handleResetDir} title={t(settings.language, "resetDir")}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button className="settings-close-btn" onClick={onClose}>
            {t(settings.language, "close")}
          </button>
        </div>
      </div>
    </div>
  );
}

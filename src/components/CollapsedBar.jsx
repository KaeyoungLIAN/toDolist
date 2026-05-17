import React, { useRef, useCallback } from "react";
import { LogicalPosition, getCurrentWindow } from "@tauri-apps/api/window";

export default function CollapsedBar({ lang, alwaysOnTop, onTogglePin, onExpand, remaining }) {
  const barRef = useRef(null);
  const draggingRef = useRef(false);
  const capturedRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const winPosRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback(async (e) => {
    // Don't drag if user clicked the pin button
    if (e.target.closest(".collapse-bar-pin-btn")) return;
    capturedRef.current = true;
    draggingRef.current = false;
    startPosRef.current = { x: e.screenX, y: e.screenY };
    try {
      const win = getCurrentWindow();
      const pos = await win.outerPosition();
      winPosRef.current = { x: pos.x, y: pos.y };
    } catch {
      capturedRef.current = false;
      return;
    }
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!capturedRef.current) return;
    const dx = e.screenX - startPosRef.current.x;
    const dy = e.screenY - startPosRef.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      draggingRef.current = true;
      try {
        getCurrentWindow().setPosition(
          new LogicalPosition(
            winPosRef.current.x + dx,
            winPosRef.current.y + dy
          )
        );
      } catch { /* ignore */ }
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    capturedRef.current = false;
    draggingRef.current = false;
  }, []);

  return (
    <div
      id="collapse-bar"
      ref={barRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ touchAction: "none" }}
    >
      <div className="collapse-bar-inner">
        {/* Pin (always-on-top) toggle */}
        <button
          className={"collapse-bar-pin-btn" + (alwaysOnTop ? " active" : "")}
          onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
          title={lang === "zh" ? "窗口置顶" : "Always on top"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={alwaysOnTop ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="20" x2="20" y2="20" />
            <line x1="12" y1="3" x2="12" y2="16" />
            <polyline points="7 10 12 3 17 10" />
          </svg>
        </button>

        {/* Logo (draggable area) */}
        <div className="collapse-bar-logo">
          <span className="collapse-bar-dot" />
          <span className="collapse-bar-title">GlassTodo</span>
        </div>

        {/* Remaining tasks — click to expand */}
        <div className="collapse-bar-remaining" onClick={onExpand}>
          {lang === "zh"
            ? `剩余 ${remaining} 项`
            : `${remaining} remaining`
          }
        </div>
      </div>
    </div>
  );
}

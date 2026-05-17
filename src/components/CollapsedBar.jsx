import React, { useRef, useCallback } from "react";
import { PhysicalPosition, getCurrentWindow } from "@tauri-apps/api/window";

export default function CollapsedBar({ lang, alwaysOnTop, onTogglePin, onExpand, remaining }) {
  const barRef = useRef(null);
  const draggingRef = useRef(false);
  const capturedRef = useRef(false);
  const readyRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const winPosRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const pendingPosRef = useRef(null);

  const handlePointerDown = useCallback(async (e) => {
    // Don't drag if user clicked the pin button or remaining-tasks text
    if (e.target.closest(".collapse-bar-pin-btn") || e.target.closest(".collapse-bar-remaining")) return;
    capturedRef.current = true;
    readyRef.current = false;
    draggingRef.current = false;
    startPosRef.current = { x: e.screenX, y: e.screenY };
    // Capture pointer so move/up events fire even when mouse leaves the element
    try { barRef.current?.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    try {
      const win = getCurrentWindow();
      const pos = await win.outerPosition();
      const sf = await win.scaleFactor();
      winPosRef.current = { x: pos.x, y: pos.y, sf };
      readyRef.current = true;
      barRef.current?.classList.add("dragging");
    } catch {
      capturedRef.current = false;
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      pendingPosRef.current = null;
      try { barRef.current?.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
      return;
    }
  }, []);

  const flushPosition = useCallback(() => {
    rafRef.current = null;
    const pos = pendingPosRef.current;
    if (!pos) return;
    pendingPosRef.current = null;
    try {
      getCurrentWindow().setPosition(new PhysicalPosition(pos.x, pos.y));
    } catch { /* ignore */ }
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!capturedRef.current || !readyRef.current) return;
    const dx = e.screenX - startPosRef.current.x;
    const dy = e.screenY - startPosRef.current.y;
    if (Math.abs(dx) <= 3 && Math.abs(dy) <= 3) return;
    draggingRef.current = true;
    pendingPosRef.current = {
      x: Math.round(winPosRef.current.x + dx * winPosRef.current.sf),
      y: Math.round(winPosRef.current.y + dy * winPosRef.current.sf),
    };
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(flushPosition);
    }
  }, [flushPosition]);

  const handlePointerUp = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    pendingPosRef.current = null;
    capturedRef.current = false;
    readyRef.current = false;
    draggingRef.current = false;
    barRef.current?.classList.remove("dragging");
  }, []);

  return (
    <div
      id="collapse-bar"
      ref={barRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onLostPointerCapture={handlePointerUp}
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

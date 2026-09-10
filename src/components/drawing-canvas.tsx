"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Drawing } from "@/lib/db/drawings";

const W = 1280;
const H = 800;
const COLOURS = ["#0F172A", "#7C3AED", "#2563EB", "#16A34A", "#DC2626", "#F59E0B"];

export function DrawingCanvas({ drawing }: { drawing: Drawing }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const dirtyRef = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [colour, setColour] = useState(COLOURS[0]);
  const [size, setSize] = useState(4);
  const [erase, setErase] = useState(false);
  const [title, setTitle] = useState(drawing.title);
  const [status, setStatus] = useState<"saved" | "dirty" | "saving" | "error">("saved");

  const ctx = () => canvasRef.current?.getContext("2d") ?? null;

  // Load the existing PNG (or a white canvas).
  useEffect(() => {
    const c = ctx();
    if (!c) return;
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, W, H);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => c.drawImage(img, 0, 0, W, H);
    img.src = `/api/drawings/${drawing.id}/download?t=${Date.now()}`;
  }, [drawing.id]);

  const save = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !dirtyRef.current) return;
    setStatus("saving");
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
    if (!blob) {
      setStatus("error");
      return;
    }
    const form = new FormData();
    form.set("file", new File([blob], "drawing.png", { type: "image/png" }));
    form.set("width", String(W));
    form.set("height", String(H));
    try {
      const res = await fetch(`/api/drawings/${drawing.id}`, { method: "PATCH", body: form });
      if (!res.ok) throw new Error();
      dirtyRef.current = false;
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, [drawing.id]);

  const scheduleSave = useCallback(() => {
    dirtyRef.current = true;
    setStatus("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void save(), 1500);
  }, [save]);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H
    };
  }
  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastRef.current = pos(e);
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const c = ctx();
    const p = pos(e);
    const from = lastRef.current;
    if (!c || !from) return;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.lineWidth = erase ? size * 4 : size;
    c.strokeStyle = erase ? "#ffffff" : colour;
    c.beginPath();
    c.moveTo(from.x, from.y);
    c.lineTo(p.x, p.y);
    c.stroke();
    lastRef.current = p;
  }
  function up() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastRef.current = null;
    scheduleSave();
  }

  function clear() {
    const c = ctx();
    if (!c) return;
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, W, H);
    scheduleSave();
  }

  async function saveTitle() {
    const t = title.trim();
    if (!t || t === drawing.title) return;
    await fetch(`/api/drawings/${drawing.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: t })
    }).catch(() => {});
  }

  async function del() {
    await fetch(`/api/drawings/${drawing.id}`, { method: "DELETE" }).catch(() => {});
    router.push("/drawings");
    router.refresh();
  }

  useEffect(() => {
    const flush = () => {
      if (dirtyRef.current) void save();
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [save]);

  const label = { saved: "Saved", dirty: "Unsaved", saving: "Saving…", error: "Couldn’t save" }[status];

  return (
    <div className="drawing">
      <div className="topbar">
        <input
          className="note-title"
          aria-label="Drawing title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
        />
        <div className="note-actions">
          <span className={`save-state save-${status === "dirty" ? "saving" : status}`}>{label}</span>
          <button className="linkish" type="button" onClick={() => void save()}>
            Save
          </button>
          <button className="linkish danger" type="button" onClick={del}>
            Delete
          </button>
        </div>
      </div>

      <div className="draw-toolbar">
        {COLOURS.map((c) => (
          <button
            key={c}
            type="button"
            className={`swatch${colour === c && !erase ? " sel" : ""}`}
            style={{ background: c }}
            aria-label={`Colour ${c}`}
            onClick={() => {
              setColour(c);
              setErase(false);
            }}
          />
        ))}
        <button
          type="button"
          className={`btn-plain${erase ? " on" : ""}`}
          aria-pressed={erase}
          onClick={() => setErase((v) => !v)}
        >
          Eraser
        </button>
        <label className="meta-field">
          <span className="muted">Size</span>
          <input type="range" min={1} max={24} value={size} onChange={(e) => setSize(Number(e.target.value))} />
        </label>
        <button type="button" className="btn-plain" onClick={clear}>
          Clear
        </button>
      </div>

      <canvas
        ref={canvasRef}
        className="draw-surface"
        width={W}
        height={H}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
      />
    </div>
  );
}

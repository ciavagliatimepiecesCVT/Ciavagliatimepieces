"use client";

import { useCallback, useRef, useState } from "react";
import { setAboutImagePosition } from "@/app/[locale]/account/admin/actions";

type Props = {
  src: string;
  alt: string;
  initialPosition: string; // e.g. "50% 30%"
  isFr?: boolean;
};

function parsePosition(pos: string): { x: number; y: number } {
  const parts = pos.trim().split(/\s+/);
  const parse = (v: string) => parseFloat(v.replace("%", "")) || 50;
  return { x: parse(parts[0] ?? "50%"), y: parse(parts[1] ?? "50%") };
}

export default function AboutImageReposition({ src, alt, initialPosition, isFr }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pos, setPos] = useState(() => parsePosition(initialPosition));
  const [savedPos, setSavedPos] = useState(() => parsePosition(initialPosition));
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const positionString = `${pos.x.toFixed(1)}% ${pos.y.toFixed(1)}%`;

  const getRelativePos = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));
    return { x, y };
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!editing) return;
    e.preventDefault();
    dragging.current = true;
    const p = getRelativePos(e.clientX, e.clientY);
    if (p) setPos(p);
  }, [editing, getRelativePos]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!editing || !dragging.current) return;
    e.preventDefault();
    const p = getRelativePos(e.clientX, e.clientY);
    if (p) setPos(p);
  }, [editing, getRelativePos]);

  const onMouseUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!editing) return;
    dragging.current = true;
    const t = e.touches[0];
    const p = getRelativePos(t.clientX, t.clientY);
    if (p) setPos(p);
  }, [editing, getRelativePos]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!editing || !dragging.current) return;
    e.preventDefault();
    const t = e.touches[0];
    const p = getRelativePos(t.clientX, t.clientY);
    if (p) setPos(p);
  }, [editing, getRelativePos]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setAboutImagePosition(positionString);
      setSavedPos(pos);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPos(savedPos);
    setEditing(false);
  };

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-foreground/10">
      {/* image container */}
      <div
        ref={containerRef}
        className="relative"
        style={{ cursor: editing ? "crosshair" : "default" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onMouseUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="max-h-[min(480px,70vh)] w-full object-cover select-none"
          style={{ objectPosition: positionString }}
        />

        {/* focal point crosshair */}
        {editing && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <div className="relative flex h-8 w-8 items-center justify-center">
              <div className="absolute h-px w-8 bg-white opacity-90" />
              <div className="absolute h-8 w-px bg-white opacity-90" />
              <div className="h-3 w-3 rounded-full border-2 border-white bg-white/30" />
            </div>
          </div>
        )}

        {/* edit mode hint */}
        {editing && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-black/50 px-3 py-1 text-xs text-white/80">
              {isFr ? "Cliquez ou faites glisser pour repositionner" : "Click or drag to reposition"}
            </span>
          </div>
        )}
      </div>

      {/* admin toolbar */}
      {editing ? (
        <div className="flex items-center gap-2 border-t border-foreground/10 bg-foreground/5 px-4 py-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-background disabled:opacity-50"
          >
            {saving ? "…" : isFr ? "Enregistrer" : "Save"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-full border border-foreground/20 px-4 py-1.5 text-xs uppercase tracking-wider text-foreground hover:bg-foreground/5"
          >
            {isFr ? "Annuler" : "Cancel"}
          </button>
        </div>
      ) : (
        <div className="flex justify-end border-t border-foreground/10 bg-foreground/5 px-4 py-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-full border border-foreground/20 px-4 py-1.5 text-xs uppercase tracking-wider text-foreground hover:bg-foreground/5"
          >
            {isFr ? "Recadrer" : "Reposition"}
          </button>
        </div>
      )}
    </div>
  );
}

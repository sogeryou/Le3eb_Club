import { useCallback, useEffect, useRef, useState } from 'react';
import { AVATAR_MAX_ZOOM, AVATAR_OUTPUT_SIZE, clampAvatarOffset, getAvatarCrop, type CropOffset } from './avatarCrop';
import type { WelcomeCopy } from './welcomeCopy';

const centered: CropOffset = { x: 0, y: 0 };
const midpoint = (a: CropOffset, b: CropOffset) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const distance = (a: CropOffset, b: CropOffset) => Math.hypot(a.x - b.x, a.y - b.y);
const pointInFrame = (box: DOMRect, x: number, y: number) => ({
  x: (x - box.left) / box.width - .5,
  y: (y - box.top) / box.height - .5,
});
const keyboardOffsets: Record<string, CropOffset> = {
  ArrowLeft: { x: -.045, y: 0 }, ArrowRight: { x: .045, y: 0 },
  ArrowUp: { x: 0, y: -.045 }, ArrowDown: { x: 0, y: .045 },
};

export function AvatarCropDialog({ file, copy, onCancel, onApply }: {
  file: File; copy: WelcomeCopy; onCancel: () => void; onApply: (file: File) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pointers = useRef(new Map<number, CropOffset>());
  const active = useRef(false);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [{ zoom, offset }, setCrop] = useState({ zoom: 1, offset: centered });
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    active.current = true;
    return () => { active.current = false; node?.close(); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const url = URL.createObjectURL(file);
    const source = new Image();
    source.src = url;
    void source.decode().then(() => {
      if (!cancelled) setImage(source);
    }).catch(() => {
      if (!cancelled) setError(true);
    });
    return () => { cancelled = true; URL.revokeObjectURL(url); };
  }, [file]);

  const draw = () => {
    const context = canvas.current?.getContext('2d');
    if (!context || !image) return false;
    const crop = getAvatarCrop(image.naturalWidth, image.naturalHeight, zoom, offset);
    const size = AVATAR_OUTPUT_SIZE;
    context.clearRect(0, 0, size, size);
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, crop.x, crop.y, crop.size, crop.size, 0, 0, size, size);
    return true;
  };

  useEffect(() => { draw(); }, [image, zoom, offset]);

  const transform = useCallback((factor: number, from: CropOffset, to: CropOffset) => {
    if (!image || saving) return;
    setCrop(previous => {
      const nextZoom = Math.max(1, Math.min(AVATAR_MAX_ZOOM, previous.zoom * factor));
      const ratio = nextZoom / previous.zoom;
      return {
        zoom: nextZoom,
        offset: clampAvatarOffset(image.naturalWidth, image.naturalHeight, nextZoom, {
          x: to.x + (previous.offset.x - from.x) * ratio,
          y: to.y + (previous.offset.y - from.y) * ratio,
        }),
      };
    });
  }, [image, saving]);

  useEffect(() => {
    const node = canvas.current;
    if (!node) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const box = node.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const anchor = pointInFrame(box, event.clientX, event.clientY);
      const units = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? box.height : 1;
      transform(Math.exp(-event.deltaY * units * .002), anchor, anchor);
    };
    node.addEventListener('wheel', wheel, { passive: false });
    return () => node.removeEventListener('wheel', wheel);
  }, [transform]);

  const apply = () => {
    if (!canvas.current || !draw() || saving) return;
    setSaving(true);
    setError(false);
    canvas.current.toBlob(blob => {
      if (!active.current) return;
      if (!blob) {
        setError(true);
        setSaving(false);
        return;
      }
      const extension = blob.type === 'image/webp' ? 'webp' : 'png';
      onApply(new File([blob], `avatar.${extension}`, { type: blob.type }));
    }, 'image/webp', .9);
  };

  return <dialog ref={dialog} className="wa-crop-dialog" aria-labelledby="wa-crop-title"
    onCancel={event => { event.preventDefault(); if (!saving) onCancel(); }}>
    <h2 id="wa-crop-title">{copy.cropPhoto}</h2>
    <p id="wa-crop-help" className="wa-muted">{copy.cropHelp}</p>
    {error && <p className="wa-error" role="alert">{copy.cropError}</p>}
    <div className="wa-crop-frame">
      <canvas ref={canvas} width={AVATAR_OUTPUT_SIZE} height={AVATAR_OUTPUT_SIZE}
        tabIndex={image ? 0 : -1} aria-label={copy.cropPreview} aria-describedby="wa-crop-help"
        onKeyDown={event => {
          const delta = keyboardOffsets[event.key];
          if (delta) { event.preventDefault(); transform(1, centered, delta); }
          else if (['+', '=', '-', '_'].includes(event.key)) {
            event.preventDefault();
            transform(event.key === '+' || event.key === '=' ? 1.12 : 1 / 1.12, centered, centered);
          }
        }}
        onPointerDown={event => {
          if (!image || saving || pointers.current.size >= 2 || event.button !== 0) return;
          const box = event.currentTarget.getBoundingClientRect();
          if (!box.width || !box.height) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          pointers.current.set(event.pointerId, pointInFrame(box, event.clientX, event.clientY));
        }}
        onPointerMove={event => {
          const previous = pointers.current.get(event.pointerId);
          if (!previous) return;
          const box = event.currentTarget.getBoundingClientRect();
          if (!box.width || !box.height) return;
          const next = pointInFrame(box, event.clientX, event.clientY);
          const other = Array.from(pointers.current).find(([id]) => id !== event.pointerId)?.[1];
          pointers.current.set(event.pointerId, next);
          if (!other) { transform(1, previous, next); return; }
          const oldDistance = distance(previous, other);
          const newDistance = distance(next, other);
          if (oldDistance > .005 && newDistance > .005) {
            transform(newDistance / oldDistance, midpoint(previous, other), midpoint(next, other));
          }
        }}
        onPointerUp={event => { pointers.current.delete(event.pointerId); }}
        onPointerCancel={event => { pointers.current.delete(event.pointerId); }}
        onLostPointerCapture={event => { pointers.current.delete(event.pointerId); }} />
      <span className="wa-crop-circle" aria-hidden="true" />
    </div>
    <div className="wa-crop-actions">
      <button type="button" className="wa-secondary" onClick={onCancel} disabled={saving}>{copy.cancel}</button>
      <button type="button" className="wa-primary" onClick={apply} disabled={!image || saving}>{copy.applyCrop}</button>
    </div>
  </dialog>;
}

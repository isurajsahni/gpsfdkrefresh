import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuCamera, LuDownload, LuImagePlus, LuRotateCcw, LuX } from 'react-icons/lu';
import toast from 'react-hot-toast';
import { artworkSource, isInchSize, orient, parseSize, sizeLabel, storyKind } from './story/storyData';

/* ── View on your wall ────────────────────────────────────────────────────────
   The phone's back camera full screen, with the artwork laid over it: drag it
   into place, pinch to match it to the wall. Sizes are kept in inches and
   drawn at `ppi` screen pixels per inch, so once the buyer has pinched one size
   to fit, switching size grows or shrinks the piece true to scale. Without a
   camera (a desktop, or permission refused) a photo of the wall stands in.
   "Save photo" flattens the scene into an image to share or keep. */

// A sensible first guess: about 6 feet of wall across the screen
const WALL_INCHES_ACROSS = 72;
// Used to draw a custom or unreadable size, at the artwork's proportions
const FALLBACK_LONG = 36;

const STRETCHED_SHADOW = '4px 6px 0 rgba(0,0,0,0.28), 0 22px 40px -12px rgba(0,0,0,0.55)';
const FLAT_SHADOW = '0 14px 28px -12px rgba(0,0,0,0.5)';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Where `source` lands when drawn to cover a `w` × `h` box, like object-fit: cover
const coverRect = (sw, sh, w, h) => {
  const scale = Math.max(w / sw, h / sh);
  return { x: (w - sw * scale) / 2, y: (h - sh * scale) / 2, w: sw * scale, h: sh * scale };
};

export default function WallView({ product, selectedVariation, sizes, onPickSize, onClose }) {
  const art = artworkSource(product, storyKind(product));
  const stretched = /stretch/i.test(selectedVariation?.frame || '');

  const stageRef = useRef(null);
  const videoRef = useRef(null);
  const artRef = useRef(null);
  const fileRef = useRef(null);
  const pointers = useRef(new Map());
  const gesture = useRef(null);

  const [mode, setMode] = useState('starting'); // starting | camera | photo | none
  const [photo, setPhoto] = useState('');
  const [ratio, setRatio] = useState(null);
  const [ppi, setPpi] = useState(() => window.innerWidth / WALL_INCHES_ACROSS);
  const [pos, setPos] = useState(() => ({ x: window.innerWidth / 2, y: window.innerHeight * 0.4 }));
  const [saving, setSaving] = useState(false);

  // The back camera, released when the viewer closes
  useEffect(() => {
    let stream;
    let alive = true;
    if (!navigator.mediaDevices?.getUserMedia) {
      setMode('none');
      return undefined;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then((s) => {
        stream = s;
        if (!alive) return s.getTracks().forEach((t) => t.stop());
        if (videoRef.current) videoRef.current.srcObject = s;
        setMode('camera');
      })
      .catch(() => alive && setMode('none'));
    return () => {
      alive = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // No page scroll behind the viewer, and Escape closes it
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  useEffect(() => () => photo && URL.revokeObjectURL(photo), [photo]);

  // The piece in inches, hung the way the artwork is shaped
  const size = selectedVariation?.size;
  const dims = parseSize(size);
  const orientation = ratio && ratio < 0.95 ? 'portrait' : 'landscape';
  const shape = dims
    ? orient(dims, orientation)
    : { w: ratio && ratio < 1 ? FALLBACK_LONG * ratio : FALLBACK_LONG, h: ratio && ratio < 1 ? FALLBACK_LONG : FALLBACK_LONG / (ratio || 1.5) };
  const width = shape.w * ppi;
  const height = shape.h * ppi;

  /* ── Drag with one finger; pinch and move with two. Always hung straight. ── */
  const startGesture = () => {
    const pts = [...pointers.current.values()];
    if (pts.length === 1) {
      gesture.current = { kind: 'drag', from: pts[0], pos };
    } else if (pts.length >= 2) {
      const [a, b] = pts;
      gesture.current = {
        kind: 'pinch',
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        ppi,
        pos,
      };
    }
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    startGesture();
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    const pts = [...pointers.current.values()];
    if (g?.kind === 'drag' && pts.length === 1) {
      setPos({ x: g.pos.x + pts[0].x - g.from.x, y: g.pos.y + pts[0].y - g.from.y });
    } else if (g?.kind === 'pinch' && pts.length >= 2) {
      const [a, b] = pts;
      setPpi(clamp(g.ppi * (Math.hypot(a.x - b.x, a.y - b.y) / g.dist), 0.5, 40));
      setPos({ x: g.pos.x + (a.x + b.x) / 2 - g.mid.x, y: g.pos.y + (a.y + b.y) / 2 - g.mid.y });
    }
  };

  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    startGesture();
  };

  // Desktop: the wheel stands in for a pinch
  const onWheel = (e) => setPpi((p) => clamp(p * (e.deltaY < 0 ? 1.08 : 1 / 1.08), 0.5, 40));

  const reset = () => {
    setPpi(window.innerWidth / WALL_INCHES_ACROSS);
    setPos({ x: window.innerWidth / 2, y: window.innerHeight * 0.4 });
  };

  const choosePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(URL.createObjectURL(file));
    setMode('photo');
  };

  /* ── Flatten the scene into a photo ── */
  const savePhoto = async () => {
    const stage = stageRef.current;
    const artImg = artRef.current;
    if (!stage || !artImg) return;
    setSaving(true);
    try {
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      const sw = stage.clientWidth;
      const sh = stage.clientHeight;
      const canvas = document.createElement('canvas');
      canvas.width = sw * scale;
      canvas.height = sh * scale;
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);

      if (mode === 'camera') {
        const v = videoRef.current;
        const r = coverRect(v.videoWidth, v.videoHeight, sw, sh);
        ctx.drawImage(v, r.x, r.y, r.w, r.h);
      } else if (mode === 'photo') {
        const bg = new Image();
        bg.src = photo;
        await bg.decode();
        const r = coverRect(bg.naturalWidth, bg.naturalHeight, sw, sh);
        ctx.drawImage(bg, r.x, r.y, r.w, r.h);
      } else {
        const wall = ctx.createLinearGradient(0, 0, 0, sh);
        wall.addColorStop(0, '#e9e4dc');
        wall.addColorStop(1, '#d8d1c6');
        ctx.fillStyle = wall;
        ctx.fillRect(0, 0, sw, sh);
      }

      // The piece: its shadow, then the art
      const x = pos.x - width / 2;
      const y = pos.y - height / 2;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 28;
      ctx.shadowOffsetY = 14;
      ctx.fillStyle = '#ddd';
      ctx.fillRect(x, y, width, height);
      ctx.restore();
      const r = coverRect(artImg.naturalWidth, artImg.naturalHeight, width, height);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.clip();
      ctx.drawImage(artImg, x + r.x, y + r.y, r.w, r.h);
      ctx.restore();

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) throw new Error('No image');
      const file = new File([blob], `${product.slug || 'artwork'}-on-my-wall.jpg`, { type: 'image/jpeg' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: product.name }).catch(() => {});
      } else {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = file.name;
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      }
    } catch {
      toast.error("Couldn't save the photo. Try a screenshot instead.");
    } finally {
      setSaving(false);
    }
  };

  const sizeText = (s) => `${sizeLabel(s)}${isInchSize(s) ? ' in' : ''}`;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-neutral-900 text-white select-none" role="dialog" aria-modal="true" aria-label="View on your wall">
      {/* The wall: camera, photo, or a plain backdrop with a prompt */}
      <div
        ref={stageRef}
        className="absolute inset-0 overflow-hidden touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 size-full object-cover ${mode === 'camera' ? '' : 'hidden'}`}
        />
        {mode === 'photo' && <img src={photo} alt="" className="absolute inset-0 size-full object-cover" />}
        {mode === 'none' && (
          <div className="absolute inset-0 bg-gradient-to-b from-[#e9e4dc] to-[#d8d1c6]" />
        )}

        {art.url && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: pos.x - width / 2,
              top: pos.y - height / 2,
              width,
              height,
              boxShadow: stretched ? STRETCHED_SHADOW : FLAT_SHADOW,
            }}
          >
            <img
              ref={artRef}
              src={art.url}
              crossOrigin="anonymous"
              alt={product.name}
              draggable={false}
              onLoad={(e) => setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
              className="size-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <div className="pointer-events-auto max-w-[70%]">
          <p className="font-semibold leading-tight truncate">{product.name}</p>
          <p className="text-xs text-white/80 mt-1">
            {mode === 'starting' ? 'Starting the camera…' : 'Drag to move · pinch to fit your wall'}
          </p>
        </div>
        <button onClick={onClose} aria-label="Close" className="pointer-events-auto p-2 rounded-full bg-black/40 hover:bg-black/60">
          <LuX className="w-6 h-6" />
        </button>
      </div>

      {mode === 'none' && (
        <div className="absolute inset-x-6 bottom-40 mx-auto max-w-sm text-center text-secondary pointer-events-none">
          <div className="rounded-2xl bg-white/90 p-5 shadow-lg pointer-events-auto">
            <LuCamera className="w-8 h-8 mx-auto mb-2" />
            <p className="font-semibold">Camera not available</p>
            <p className="text-sm text-gray-600 mt-1">Allow camera access, or take a photo of your wall to place the artwork on it.</p>
            <button onClick={() => fileRef.current?.click()} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
              <LuImagePlus className="w-5 h-5" /> Use a photo of my wall
            </button>
          </div>
        </div>
      )}

      {/* Bottom bar: sizes, then actions */}
      <div className="absolute inset-x-0 bottom-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black/70 to-transparent">
        {sizes.length > 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-3 justify-start sm:justify-center">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => onPickSize(s)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${s === size ? 'bg-white text-secondary border-white' : 'border-white/50 bg-black/30 hover:bg-black/50'}`}
              >
                {sizeText(s)}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center justify-center gap-3">
          <button onClick={reset} aria-label="Reset size and position" className="p-3 rounded-full bg-black/40 hover:bg-black/60">
            <LuRotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={savePhoto}
            disabled={saving || mode === 'starting'}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-secondary font-semibold disabled:opacity-60"
          >
            <LuDownload className="w-5 h-5" /> {saving ? 'Saving…' : 'Save photo'}
          </button>
          <button onClick={() => fileRef.current?.click()} aria-label="Use a photo of my wall" className="p-3 rounded-full bg-black/40 hover:bg-black/60">
            <LuImagePlus className="w-5 h-5" />
          </button>
        </div>
        {size && dims && (
          <p className="text-center text-xs text-white/70 mt-2">
            Showing {sizeText(size)}. Tip: a standard door is about 80 in tall, use it to judge the scale.
          </p>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={choosePhoto} />
    </div>,
    document.body,
  );
}

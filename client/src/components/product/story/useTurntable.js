import { useCallback, useEffect, useRef, useState } from 'react';
import {
  animate, useInView, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, useTransform,
} from 'framer-motion';

/* ── Turntable ────────────────────────────────────────────────────────────────
   Drag-to-turn for the finish explorer's 3D mockups. Dragging sideways spins
   the piece round (with momentum if it's flicked), dragging up and down with a
   mouse tilts it, and with the pointer just resting over the stage it leans a
   little towards it. Arrow keys turn and tilt it, Home or a double-click puts
   it back. On touch screens only sideways drags turn it, so the page still
   scrolls (touch-action: pan-y on the stage).

   The first time the stage comes into view the piece makes one slow full turn,
   back and all, so it's obvious it can be spun; each new finish after that
   swings in from square-on. */

export const REST = { x: 6, y: -24 };
const TURN_PER_PX = 0.5;
const TILT_PER_PX = 0.3;
const MAX_TILT = 38;
const SETTLE = { type: 'spring', stiffness: 60, damping: 14 };
const SNAP = { type: 'spring', stiffness: 90, damping: 18 };

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
// `target` plus whole turns, as close as possible to `current`: going to the
// back never spins round more than half a turn
const nearest = (current, target) => target + 360 * Math.round((current - target) / 360);
const heading = (degrees) => Math.round(((degrees % 360) + 360) % 360);

export default function useTurntable(resetKey) {
  const reduce = useReducedMotion();
  const stageRef = useRef(null);
  const seen = useInView(stageRef, { once: true, amount: 0.5 });
  const spinY = useMotionValue(0);
  const spinX = useMotionValue(0);
  const leanY = useSpring(0, { stiffness: 150, damping: 20 });
  const leanX = useSpring(0, { stiffness: 150, damping: 20 });
  const rotateY = useTransform([spinY, leanY], ([spin, lean]) => spin + lean);
  const rotateX = useTransform([spinX, leanX], ([spin, lean]) => clamp(spin + lean, -MAX_TILT, MAX_TILT));

  const drag = useRef(null);
  const introduced = useRef(false);
  const [turned, setTurned] = useState(false);
  const [backOn, setBackOn] = useState(false);
  const backRef = useRef(false);

  // Only re-render when the back comes round (for the button's label). The
  // slider's value is written straight to the stage, without a render.
  useMotionValueEvent(rotateY, 'change', (y) => {
    const back = Math.cos((y * Math.PI) / 180) < 0;
    if (back !== backRef.current) {
      backRef.current = back;
      setBackOn(back);
    }
    stageRef.current?.setAttribute('aria-valuenow', String(heading(y)));
    stageRef.current?.setAttribute('aria-valuetext', `Turned ${heading(y)} degrees${back ? ', showing the back' : ''}`);
  });

  useEffect(() => {
    spinY.stop();
    spinX.stop();
    if (reduce) {
      spinY.set(REST.y);
      spinX.set(REST.x);
      return undefined;
    }
    // Square-on until it's been seen
    if (!seen) {
      spinY.set(0);
      spinX.set(0);
      return undefined;
    }
    const first = !introduced.current;
    introduced.current = true;
    spinY.set(0);
    spinX.set(0);
    const y = first
      ? animate(spinY, REST.y + 360, { duration: 2.4, ease: [0.45, 0, 0.15, 1], delay: 0.2 })
      : animate(spinY, REST.y, SETTLE);
    const x = animate(spinX, REST.x, SETTLE);
    return () => {
      y.stop();
      x.stop();
    };
  }, [resetKey, seen, reduce, spinX, spinY]);

  const turnTo = useCallback((y, x = spinX.get()) => {
    if (reduce) {
      spinY.set(y);
      spinX.set(x);
      return;
    }
    animate(spinY, y, SNAP);
    animate(spinX, x, SNAP);
  }, [reduce, spinX, spinY]);

  const showSide = useCallback((back) => {
    setTurned(true);
    turnTo(nearest(spinY.get(), REST.y + (back ? 180 : 0)), REST.x);
  }, [spinY, turnTo]);

  const reset = useCallback(() => turnTo(nearest(spinY.get(), REST.y), REST.x), [spinY, turnTo]);

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    spinY.stop();
    spinX.stop();
    leanY.set(0);
    leanX.set(0);
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, speed: 0, mouse: e.pointerType === 'mouse' };
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) {
      // Resting over the stage: lean towards the pointer
      if (e.pointerType === 'mouse' && !reduce) {
        const box = e.currentTarget.getBoundingClientRect();
        leanY.set(((e.clientX - box.left) / box.width - 0.5) * 12);
        leanX.set(-((e.clientY - box.top) / box.height - 0.5) * 8);
      }
      return;
    }
    if (d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    const dt = Math.max(1, e.timeStamp - d.t);
    spinY.set(spinY.get() + dx * TURN_PER_PX);
    if (d.mouse) spinX.set(clamp(spinX.get() - dy * TILT_PER_PX, -MAX_TILT, MAX_TILT));
    // Smoothed speed in degrees a second, for the flick
    d.speed = d.speed * 0.6 + ((dx * TURN_PER_PX) / dt) * 1000 * 0.4;
    d.x = e.clientX;
    d.y = e.clientY;
    d.t = e.timeStamp;
    if (!turned && Math.abs(dx) > 0) setTurned(true);
  };

  const onPointerUp = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    // A drag that had stopped before letting go doesn't fling
    const stillMoving = e.timeStamp - d.t < 80;
    if (!reduce && stillMoving && Math.abs(d.speed) > 30) {
      animate(spinY, spinY.get(), { type: 'inertia', velocity: d.speed, power: 0.35, timeConstant: 420 });
    }
  };

  const onPointerLeave = () => {
    if (drag.current) return;
    leanY.set(0);
    leanX.set(0);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Home') {
      e.preventDefault();
      reset();
      return;
    }
    const step = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, 10], ArrowDown: [0, -10] }[e.key];
    if (!step) return;
    e.preventDefault();
    setTurned(true);
    turnTo(spinY.get() + step[0], clamp(spinX.get() + step[1], -MAX_TILT, MAX_TILT));
  };

  return {
    rotateX,
    rotateY,
    turned,
    backOn,
    showSide,
    stageProps: {
      ref: stageRef,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onPointerLeave,
      onKeyDown,
      onDoubleClick: reset,
    },
  };
}

<!--
  One sheet on screen (./Sheet.vue decides when there is one).

  It is a vertical ScrollGesture (sides [1]): with the 'scroll' driver dragging it is native scrolling, so it follows
  the finger and snaps like a system sheet; with the 'js' driver a mouse drags it. It comes in with enter(), an
  animation and not a gesture.

  What is fixed here, and what the style decides (look.sheet, styles/<name>/look.js):
    fixed   the gesture; what follows the sheet (what lies under it, the veil, the handle's two halves) is moved by
            the entrance's own animations while it comes up and tied to the sheet's timeline once it is up; after the
            sheet has gone it stays where it is (off screen, taking no touches) until things are quiet, and only then
            is it unmounted and the ties taken off, so nothing changes under a finger that is by then scrolling the
            page again. @cover(f) tells how far up the sheet is (0 .. 1), for what it covers outside `under`.
    look    { over, ms, ease, back: { s, y, blur, o }, blur, handle: { bend, straight } | null }
            back     what lies under looks like this while the sheet is up (scale, shift in %, blur in px, opacity)
            handle   the line at the top: two halves, each turned `bend` degrees at rest (a shallow arrow pointing
                     down), straight from the timeline point `straight` on; null for no handle
-->
<script>
import { tf, veilKeyframes } from './stack.js';

// The keyframes of one look, written once.
const written = new Map();           // look -> prefix
function styles(look) {
  if (written.has(look)) return written.get(look);
  const k = written.size ? `sh${written.size + 1}` : 'sh';
  written.set(look, k);
  const { over: OVER, back: BACK, handle } = look;
  const hold = (100 * OVER / (1 + OVER)).toFixed(2) + '%';
  // "At rest" is held from 99% on: at rest the sheet's timeline is one pixel short of its end (the gesture keeps it
  // there, so that these animations can run on the compositor), and everything must show exactly its resting state.
  const rest = '99%,100%';
  const st = document.createElement('style');
  st.setAttribute('data-sheet', k);
  st.textContent =
    `.app{--${k}-t:${tf(BACK)};--${k}-blur:${BACK.blur}px;--${k}-o:${BACK.o}}` +
    // what lies under: with its own blur (technique 'filter'), and without (transform and opacity only)
    `@keyframes ${k}-f{0%,${hold}{transform:none;filter:none;opacity:1}${rest}{transform:var(--${k}-t);filter:blur(var(--${k}-blur));opacity:var(--${k}-o)}}` +
    `@keyframes ${k}-g{0%,${hold}{transform:none;opacity:1}${rest}{transform:var(--${k}-t);opacity:var(--${k}-o)}}` +
    `.under.${k}-back{transform:var(--${k}-t);opacity:var(--${k}-o)}.under.${k}-back.${k}-bf{filter:blur(var(--${k}-blur))}` +
    // the veil over it
    veilKeyframes(`${k}-v`, OVER, BACK.blur) +
    // the handle's two halves: straight once the sheet has been pulled a little, bent into the arrow at rest
    (handle ? `@keyframes ${k}-hl{0%,${handle.straight}{transform:none}${rest}{transform:rotate(${handle.bend}deg)}}` +
      `@keyframes ${k}-hr{0%,${handle.straight}{transform:none}${rest}{transform:rotate(-${handle.bend}deg)}}` : '');
  document.head.appendChild(st);
  return k;
}
</script>

<script setup>
import { watch, onMounted, onBeforeUnmount, useTemplateRef } from 'vue';
import '../gesture/scroll-gesture.js';
import { getDriver } from '../gesture/driver.js';
import { blurMode } from './blur-mode.js';
import { frame, glass, glassFrame, veilAt } from './stack.js';
import { reduced, supportsTimeline, tapSwitch } from '../platform/env.js';

const ScrollGesture = window.ScrollGesture;
const FRONT = { s: 1, x: 0, y: 0, blur: 0, o: 1 };

const props = defineProps({
  look: { type: Object, required: true },
  label: String,
  closeLabel: String,
  open: Boolean,
  under: { default: null },
  veil: { default: null },
});
const emit = defineEmits(['cover', 'gone', 'away']);

const elRef = useTemplateRef('el');
const bodyRef = useTemplateRef('body');
const handleRef = useTemplateRef('handle');
let g = null;                    // the gesture
let left = false;                // the sheet has gone
let cleanup = null;

onMounted(() => {
  const look = props.look;
  const K = styles(look);
  const { over: OVER, ms: MS, ease: EASE, back: BACK } = look;
  const u = props.under;
  const el = elRef.value, handle = handleRef.value;
  const gesture = ScrollGesture(el, { driver: getDriver(), axis: 'y', sides: [1], cssVar: null, body: bodyRef.value, overshoot: OVER });
  g = gesture;
  const tied = supportsTimeline && !!gesture.timeline;
  const tie = (node, name) => { node.style.animation = name + ' linear both'; node.style.animationTimeline = gesture.timeline; };
  const depth = blurMode(look.blur);
  const blur = depth === 'filter';                          // what lies under carries the blur itself
  const v = depth === 'veil' && props.veil ? props.veil : null;      // or a veil over it does
  // how far up the sheet is, for what it covers outside `under` (0 .. 1); told only when it changes
  let shown = -1, coverRaf = 0;
  const cover = (f) => { f = Math.max(0, Math.min(1, f)); if (f !== shown) { shown = f; emit('cover', f); } };
  // While the sheet is coming up, nothing is tied to its timeline: what follows it is moved by animations on the
  // entrance's clock that hold their end, and tied once the entrance is over. (Chromium can run a scroll-driven
  // animation on the compositor only if it could start it there, and it cannot under another animation of the
  // same properties; having failed once it does not try again.)
  const clocks = [];
  const ties = [];                                          // [node, keyframes name]
  let entering = true;
  const entered = () => {
    if (!entering) return;
    entering = false;
    if (tied) ties.forEach(([node, name]) => tie(node, name));
    clocks.splice(0).forEach((c) => c.cancel());
    cancelAnimationFrame(coverRaf);                         // from here on, the sheet's own position tells
    if (!left) cover(1 - Math.min(1, (1 + OVER) * Math.max(0, gesture.p)));
  };

  // ---- what lies under is tied to the sheet from the start: it comes back into focus as the sheet is pulled down
  if (u) {
    u.classList.add(`${K}-back`); u.classList.toggle(`${K}-bf`, blur);
    u.inert = true;
    ties.push([u, blur ? `${K}-f` : `${K}-g`]);
  }
  const veilTo = (o) => { v.style.webkitBackdropFilter = glass(BACK.blur, o); v.style.backdropFilter = glass(BACK.blur, o); };
  if (v) { v.style.visibility = 'visible'; veilTo(1); ties.push([v, `${K}-v`]); }

  // ---- the handle follows the sheet: by its scroll timeline, or else by a class set when the state changes
  const halves = handle ? handle.querySelectorAll('i') : [];
  if (tied && look.handle) halves.forEach((h, i) => tie(h, i ? `${K}-hr` : `${K}-hl`));
  let flat = false;

  const gone = () => {
    if (left) return;
    left = true;
    if (entering) entered();
    if (u && u.inert) u.inert = false;
    cover(0);                                               // what it covered is whole again at once
    el.inert = true;
    emit('away', true);
    emit('gone');
  };
  // A mouse drags the sheet (the 'scroll' driver moves its body meanwhile, not its scroll position): what follows
  // it stops following the timeline and follows 'change'; handed back at the very same place, it follows the
  // timeline again.
  let manual = false;
  const offManual = gesture.on('manual', (on) => {
    manual = on;
    if (!tied || entering) return;
    if (on) {
      ties.forEach(([node]) => { node.style.removeProperty('animation'); node.style.removeProperty('animation-timeline'); });
      halves.forEach((h) => { h.style.removeProperty('animation'); h.style.removeProperty('animation-timeline'); });
      return;
    }
    if (u) ['transform', 'filter', 'opacity'].forEach((k) => u.style.removeProperty(k));
    if (v) { v.style.removeProperty('-webkit-backdrop-filter'); v.style.removeProperty('backdrop-filter'); }
    if (handle) handle.classList.remove('flat');
    flat = false;
    ties.forEach(([node, name]) => tie(node, name));
    if (look.handle) halves.forEach((h, i) => tie(h, i ? `${K}-hr` : `${K}-hl`));
  });
  const offChange = gesture.on('change', (p) => {
    if ((!tied || manual) && handle && flat !== p > 0.03) { flat = p > 0.03; handle.classList.toggle('flat', flat); }
    if (entering && p > 0.02) entered();                   // the finger took the sheet while it was coming up
    // The page under it takes taps as soon as the sheet is pulled off the top (where it shows, past the panel: the
    // sheet's own box lets taps through, core.css), not only once the sheet has gone.
    const off = !entering && (p > 0.02 || gesture.passing);
    if (u && !left && u.inert === off) u.inert = !off;
    if (!left) emit('away', off);
    if (!entering && !left) cover(1 - Math.min(1, (1 + OVER) * Math.max(0, p)));
    if ((tied && !manual) || entering) return;
    const k = Math.min(1, (1 + OVER) * Math.max(0, p)), L = (from, to) => from + (to - from) * k;
    if (u) {
      u.style.transform = tf({ s: L(BACK.s, 1), x: L(BACK.x || 0, 0), y: L(BACK.y || 0, 0) });
      if (blur) u.style.filter = L(BACK.blur, 0) > 0.05 ? `blur(${L(BACK.blur, 0)}px)` : 'none';
      u.style.opacity = String(L(BACK.o, 1));
    }
    if (v) veilTo(veilAt(k));
  });
  const offSettle = gesture.on('settle', (side) => { if (side === 1) gone(); });
  // A sheet that has gone down out of sight and is then left alone has gone, whether or not its scroller reported
  // coming to rest: on a phone it can stop a pixel or two short of the end (sizes in fractions of a pixel) and never
  // say so. The app would then believe the sheet still up, and whatever opens it would seem to do nothing.
  let fingers = 0, mouseDown = false, idleT = 0;
  const lookLater = () => {
    clearTimeout(idleT);
    idleT = setTimeout(() => {
      if (left || entering || fingers || mouseDown || gesture.p < 0.9) return;
      if (gesture.p < 1) gesture.go(1);
      gone();
    }, 450);
  };
  const onTouch = (e) => { fingers = e.touches.length; if (!fingers) lookLater(); else clearTimeout(idleT); };
  ['touchstart', 'touchend', 'touchcancel'].forEach((t) => document.addEventListener(t, onTouch, { passive: true, capture: true }));
  // a mouse holding the sheet counts as a finger does (a touch's pointer events do not: they end when it starts to scroll)
  const onMouse = (e) => { if (e.pointerType === 'touch') return; mouseDown = e.type === 'pointerdown'; if (!mouseDown) lookLater(); else clearTimeout(idleT); };
  ['pointerdown', 'pointerup', 'pointercancel'].forEach((t) => document.addEventListener(t, onMouse, { passive: true, capture: true }));
  const offIdle = gesture.on('change', lookLater);
  if (reduced()) { cover(1); entered(); }
  else {
    // they recede on the entrance's clock and hold their end until the ties take over
    const run = (node, frames, ms) => clocks.push(node.animate(frames, { duration: ms, easing: EASE, fill: 'forwards' }));
    if (u) run(u, [frame(FRONT, blur), frame(BACK, blur)], MS);
    if (v) run(v, [glassFrame(BACK.blur, 0), glassFrame(BACK.blur, 1)], MS);
    // how far up it is, on the same clock, frame by frame
    const clock = clocks[0], t0 = performance.now();
    const step = () => {
      if (!entering) return;
      const t = clock && clock.effect ? clock.effect.getComputedTiming() : null;
      cover(t && t.progress != null ? t.progress : Math.min(1, (performance.now() - t0) / MS));
      coverRaf = requestAnimationFrame(step);
    };
    step();
    gesture.enter(1, { duration: MS, easing: EASE, travel: 1 / (1 + OVER) }).then(entered);
  }
  const onKey = (e) => { if (e.key === 'Escape' && !left) gesture.go(1); };
  document.addEventListener('keydown', onKey);

  cleanup = () => {
    offChange(); offSettle(); offIdle(); offManual();
    clearTimeout(idleT);
    ['touchstart', 'touchend', 'touchcancel'].forEach((t) => document.removeEventListener(t, onTouch, { passive: true, capture: true }));
    ['pointerdown', 'pointerup', 'pointercancel'].forEach((t) => document.removeEventListener(t, onMouse, { passive: true, capture: true }));
    document.removeEventListener('keydown', onKey);
    cancelAnimationFrame(coverRaf);
    cover(0);
    entering = false;
    clocks.splice(0).forEach((c) => c.cancel());
    gesture.destroy();
    g = null;
    const untie = (node, list) => list.forEach((k) => node.style.removeProperty(k));
    if (u) { untie(u, ['animation', 'animation-timeline', 'transform', 'filter', 'opacity']); u.classList.remove(`${K}-back`, `${K}-bf`); if (u.inert) u.inert = false; }
    if (v) untie(v, ['animation', 'animation-timeline', 'visibility', '-webkit-backdrop-filter', 'backdrop-filter']);
  };
});
onBeforeUnmount(() => { if (cleanup) cleanup(); cleanup = null; });

// closed from outside: slide down first; it is unmounted later, like after a swipe
watch(() => props.open, (open) => {
  if (open || !g || left) return;
  if (reduced()) {
    left = true;
    if (props.under && props.under.inert) props.under.inert = false;
    emit('cover', 0);
    emit('gone');
  } else g.go(1);
});

const close = () => { if (g && !left) g.go(1); };
const onHandle = (e) => { if (!(e.target.matches && e.target.matches('.hsw'))) close(); };
const onHandleKey = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); close(); } };
</script>

<template>
  <div ref="el" class="sheet" role="dialog" :aria-label="label">
    <div ref="body">
      <div class="sheet-panel">
        <label v-if="look.handle" ref="handle" class="sheet-handle" role="button" tabindex="0" :aria-label="closeLabel || 'Close'"
          @click="onHandle" @keydown="onHandleKey">
          <input v-if="tapSwitch" type="checkbox" :switch.attr="''" class="hsw" aria-hidden="true">
          <i /><i />
        </label>
        <div class="sheet-scroll">
          <div class="sheet-in"><slot /></div>
        </div>
      </div>
    </div>
  </div>
</template>

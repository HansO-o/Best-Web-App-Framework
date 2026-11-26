// What the device and the place the page runs in can do. Read once.
// (the shell first: in an iPhone's app it gives navigator.vibrate(), which is asked about below)
import { inShell } from './shell.js';

export { inShell };
const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
export const appleTouch = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1);

export const android = /Android/.test(ua);

/** Opened from the home screen (an installed PWA). */
export const standalone = () => typeof window !== 'undefined'
  && (navigator.standalone === true || (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches));

/** The vibration API: Android, and the app on either phone (shell.js). */
export const canVibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

/**
 * iPhone: the only haptic a web page gets is the one a finger on a native switch (<input type="checkbox" switch>)
 * plays (README.md, "触感"). Components render such a switch only where this is true: anywhere else
 * a click would focus it, and the browser scrolling it into view would cut the page's own smooth scrolls short. It
 * never gets a tabindex.
 */
export const tapSwitch = !inShell && !canVibrate && appleTouch && typeof HTMLInputElement !== 'undefined' && 'switch' in HTMLInputElement.prototype;

export const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const supportsTimeline = typeof CSS !== 'undefined' && !!CSS.supports && CSS.supports('animation-timeline: scroll()');
// Chromium: Chrome, Edge and the rest of that family. (Chrome on iPhone is WebKit and has no "Chrome/" in its name.)
export const chromium = typeof navigator !== 'undefined' && (!!navigator.userAgentData || /\bChrome\//.test(ua));

// One short tick, by the vibration API. In a browser it stays silent until the page has had a first tap; a tick
// asked for before that (on a touch going down) is owed and played when the finger lifts.
let owed = false;
export function buzz() {
  if (canVibrate && !navigator.vibrate(10)) owed = true;
}
export function payBuzz() { if (owed) { owed = false; navigator.vibrate(10); } }

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

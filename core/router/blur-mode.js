// How the page behind is put out of focus. A technique, picked by the browser engine, not a look: the style only says
// whether there is a blur at all (look.blur).
//
//   veil    The layers behind only shrink, sink and fade (transform and opacity). The blur is a sheet of glass laid
//           over them, of a fixed radius, whose strength is the opacity() of its backdrop-filter. Nothing animates a
//           blur radius, so the browser's compositor can run all of it in step with the scrolling finger.
//   filter  The layers behind animate their own filter: blur(). The radius follows the finger exactly, but an
//           animation with a blur in it cannot run on Chromium's compositor: the main thread has to deliver every
//           frame of it, and a finger-driven scroll does not wait for the main thread.
//   none    No blur: transform and opacity only.
//
// Chromium (Chrome, Edge) gets the veil, every other engine the filter. For tests and for telling the blur's cost from
// everything else, localStorage['app:blur'] = 'veil' | 'filter' | 'none' forces one. Not a setting for users.
import { chromium } from '../platform/env';

/** The technique in effect for a look that wants blur (`wanted`): 'veil' | 'filter' | 'none'. */
export function blurMode(wanted) {
  if (wanted === false) return 'none';
  try {
    const m = localStorage.getItem('app:blur');
    if (m === 'veil' || m === 'filter' || m === 'none') return m;
  } catch (e) { /* no storage */ }
  return chromium ? 'veil' : 'filter';
}

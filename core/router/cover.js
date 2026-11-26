// What floats over the root pages (the tab row, anything above it) belongs to them. Whatever comes over a root page
// covers it: a page pushed in a tab, a sheet. Covering it means what it means for the root page itself: it goes as
// far behind as the page does, where it is. The chrome does not move.
//
//   const cover = ChromeCover(chromeElement, paint);
//   cover.set('stack', f);      // f per source: 0 = the root page in front, 1 = one page over it, 2 = two pages
//   cover.set('sheet', f);      // the most covered source wins
//
// This file only knows how far (f) and makes the chrome inert while covered (touches reach the page in front, the
// keyboard skips it). How "covered by f" looks is the style's: paint(chrome, f, { blur }) (look.chrome.cover). It is
// called only when f changes, with every value following the page it belongs to, frame by frame, from the gestures'
// own events; nothing is animated. At 0 the style takes off everything it wrote.
import { blurMode } from './blur-mode';

export function ChromeCover(chrome, paint, wantsBlur) {
  const sources = new Map();
  let f = 0, blur = true;
  function apply() {
    let nf = 0;
    sources.forEach((v) => { if (v > nf) nf = v; });
    if (nf > 0 && f === 0) blur = blurMode(wantsBlur) !== 'none';   // how the page behind goes out of focus, from now on
    f = nf;
    if (paint) paint(chrome, nf, { blur });
    const covered = nf > 0;
    if (chrome.inert !== covered) chrome.inert = covered;
  }
  return {
    set(key, v) {
      v = Math.max(0, +v || 0);
      if (sources.get(key) === v) return;
      sources.set(key, v);
      apply();
    },
    get f() { return f; },
  };
}

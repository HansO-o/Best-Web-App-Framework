// look: how this style turns pages, raises sheets and covers the floating chrome. Plain values that @core's router
// takes (core/router/stack.js, SheetSurface.vue, cover.js say what each one means). This is the "depth of field" of
// lit-paper-glass: a page has no ground of its own; the page you leave stays where it is and drops back, smaller,
// lower, out of focus and faint, and is the background of the page in front.
const EASE = 'cubic-bezier(.2,.86,.24,1)';
// what a page looks like right behind the one in front, and two pages back
const BACK = { s: 0.86, y: 4.5, blur: 24, o: 0.34 };
const FAR = { s: 0.74, y: 10, blur: 40, o: 0 };
const BACK_ICON = '<svg class="ic" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';

// ---- the tab you go to fades in, while the one you leave fades out over it
// What fades is what is inside the page in front, piece by piece, never the page or anything it sits in: an
// animation on something a scroller sits in would end under a finger that is already scrolling it. A piece is a
// block of the page; a block with glass in it is taken apart down to the glass, which fades by itself, because
// glass stops blurring inside anything that carries an opacity. The animations hold nothing once they have run.
const GLASS = '.glass, .sgm-haze';
const TAB_IN = { ms: 300, most: 60 };
const coming = new WeakMap();        // a tab's element -> the animations still bringing it in
function pieces(el, out) {
  for (const c of el.children) {
    if (out.length >= TAB_IN.most) return;
    if (c.matches(GLASS) || !c.querySelector(GLASS)) out.push(c);
    else pieces(c, out);
  }
}
function tabIn(view) {
  (coming.get(view) || []).forEach((a) => a.cancel());
  const fronts = [...view.querySelectorAll('.page-in')].filter((p) => !p.closest('.layer[inert]'));
  const front = fronts[fronts.length - 1];
  if (!front || typeof front.animate !== 'function') return;
  const list = [];
  pieces(front, list);
  coming.set(view, list.map((el) => el.animate({ opacity: [0, 1] }, { duration: TAB_IN.ms, easing: 'ease-in-out' })));
}

// ---- the floating chrome, covered by the page in front
// f: how far behind the root page is. 0 = in front (as always), 1 = right behind the page in front, 2 = two pages
// back. The tab row goes as far out of focus, in place:
//   icons and dot   blur and fade exactly as the page behind does (BACK at 1, FAR at 2); blur: false leaves them sharp
//   capsule         its own blur turned down, as the cube of how present the row is: it never shows as a sharp-edged
//                   frosted capsule over a page that is out of focus, and it forms together with the icons on the way
//                   back. It stays a backdrop-filter all along (blur(0px) at the far end), so the glass is never
//                   rebuilt on the way back
//   [data-cover="fade"]   anything else in the chrome that is glass itself (a play bar): it only fades (its own
//                   opacity thins its glass; it does not switch it off)
// Only these leaves are written to, by plain values: nothing the capsule sits in, and no animation, because glass
// stops blurring as soon as anything it sits in has an opacity below 1, a filter, or an animation of either. At 0
// every value written is taken off again, and the row is exactly what the stylesheet makes it.
const DEPTH = [{ b: 0, o: 1 }, { b: BACK.blur, o: BACK.o }, { b: FAR.blur, o: FAR.o }];
function coverChrome(chrome, f, { blur = true } = {}) {
  f = Math.max(0, Math.min(2, +f || 0));
  const st = chrome.lpgCover || (chrome.lpgCover = { f: 0, r: 18 });
  // nothing is written when nothing has changed (a value written again still counts as a change)
  if (f === st.f || (Math.abs(f - st.f) < 0.002 && f !== 0 && f !== 1 && f !== 2)) return;
  const leaves = chrome.querySelectorAll('.sgm-tabs .sgm-item, .sgm-tabs .sgm-ink'), haze = chrome.querySelector('.sgm-haze');
  const fades = chrome.querySelectorAll('[data-cover="fade"]');
  if (f === 0) {
    st.f = 0;
    leaves.forEach((n) => { n.style.removeProperty('filter'); n.style.removeProperty('opacity'); });
    fades.forEach((n) => n.style.removeProperty('opacity'));
    if (haze) { haze.style.removeProperty('-webkit-backdrop-filter'); haze.style.removeProperty('backdrop-filter'); }
    return;
  }
  if (st.f === 0 && haze) {                                       // the capsule's own blur, as the stylesheet has it
    const cs = getComputedStyle(haze), m = /blur\(([\d.]+)px\)/.exec(cs.backdropFilter || cs.webkitBackdropFilter || '');
    st.r = m ? +m[1] : 18;
  }
  st.f = f;
  const i = Math.min(1, Math.floor(f)), t = f - i, a = DEPTH[i], b = DEPTH[i + 1];
  const px = blur ? a.b + (b.b - a.b) * t : 0, op = a.o + (b.o - a.o) * t;
  leaves.forEach((n) => { n.style.filter = px > 0.05 ? `blur(${px.toFixed(2)}px)` : 'none'; n.style.opacity = String(+op.toFixed(3)); });
  const gone = (1 - Math.min(1, f)).toFixed(3);
  fades.forEach((n) => { n.style.opacity = gone; });
  if (haze) {
    const g = `blur(${(st.r * Math.pow(1 - Math.min(1, f), 3)).toFixed(2)}px)`;
    haze.style.webkitBackdropFilter = g; haze.style.backdropFilter = g;
  }
}

export const look = {
  // a page turn
  stack: {
    over: 0.1,                  // the back swipe ends this far past the edge
    gone: 0.8,                  // the leaving page has faded out after this share of the way
    pushMs: 660, pushEase: EASE,
    travel: 0.16,               // the new page slides in over this share of the screen; its blocks arrive one after another (style.css)
    back: BACK, far: FAR,
    blur: true, fade: true,
    backIcon: BACK_ICON, backClass: 'glass', backLabel: '返回',
  },
  // a sheet: what lies under it looks like a page behind another
  sheet: {
    over: 0.1, ms: 620, ease: EASE,
    back: BACK, blur: true,
    handle: { bend: 16, straight: '94%' },      // a short line bent into a shallow arrow pointing down; straight when pulled
  },
  // tabs cross-fade: the one you leave fades out over the one you go to (style.css, .tabview.out), for outMs, while
  // the one you go to fades in (tabIn, above)
  tabs: { outMs: 320, enter: tabIn },
  chrome: { cover: coverChrome },
};
export default look;

// The theme. Colours are CSS variables (style.css), so nothing is rendered again when it changes.
//
//   setTheme('dark' | 'light' | 'auto', anchorElement)        switchTheme(anchorElement)        isDark()
//
// Light <-> dark is never a jump. Where the browser has view transitions it is one picture of the screen giving way
// to another: with an anchor (the button that was pressed) the new theme spreads out from it in a circle (about
// 820 ms); without one (the theme was changed from elsewhere: another device, a script) the new one fades in over the
// old. Nothing is eased element by element then. Only where there are no view transitions does every colour
// cross-fade by itself.
import { reduced } from '@core';

function syncBars() {
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  if (!bg) return;
  document.querySelectorAll('meta[name="theme-color"]').forEach((el) => { el.media = ''; el.content = bg; });
}

/** Whether the dark theme is showing now. */
export function isDark() {
  const at = document.documentElement.getAttribute('data-theme');
  return at ? at === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
}

/** mode: 'light' | 'dark' | 'auto' (as the system has it). anchor: the element the new theme spreads from. */
export function setTheme(mode, anchor) {
  const root = document.documentElement;
  if (mode !== 'light' && mode !== 'dark') mode = 'auto';
  const was = isDark();
  const apply = () => {
    if (mode === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', mode);
    syncBars();
  };
  const will = mode === 'auto' ? matchMedia('(prefers-color-scheme: dark)').matches : mode === 'dark';
  if (will === was || reduced()) { apply(); return; }
  if (document.startViewTransition) {
    const r = anchor && anchor.isConnected ? anchor.getBoundingClientRect() : null;
    root.classList.add('theme-jump');                     // in the new picture the new theme is simply there
    const done = () => root.classList.remove('theme-jump');
    try {
      const vt = document.startViewTransition(apply);
      vt.ready.then(() => {
        if (r) {
          const x = r.left + r.width / 2, y = r.top + r.height / 2;
          const far = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
          root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${far}px at ${x}px ${y}px)`] },
            { duration: 820, easing: 'cubic-bezier(.22,1,.36,1)', pseudoElement: '::view-transition-new(root)' });
        } else root.animate({ opacity: [0, 1] }, { duration: 520, easing: 'ease', pseudoElement: '::view-transition-new(root)' });
        requestAnimationFrame(done);
      }).catch(done);
      return;
    } catch (e) { done(); }
  }
  root.classList.add('theming');
  apply();
  setTimeout(() => root.classList.remove('theming'), 650);
}

/** Light to dark, or dark to light; the new theme spreads from `anchor`. Returns the mode it set. */
export function switchTheme(anchor) {
  const mode = isDark() ? 'light' : 'dark';
  setTheme(mode, anchor);
  return mode;
}

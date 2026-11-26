// What an app does not do, on any device: zoom, select interface text, bring up the long-press menu.
// (The viewport meta says no zoom too; iOS ignores it, so the pinch events are cancelled as well. touch-action on
// <html> leaves only panning, which also takes the double-tap zoom away: core.css.)
//
// There is deliberately no touchmove listener on the document that can call preventDefault: with one, every scroll
// anywhere has to wait for the main thread before it may start, and the main thread is busiest right after a tab
// switch or a page turn. A drag that starts on something that cannot scroll is stopped where it starts (Router's
// floating chrome).
const editable = (t) => !!(t && t.closest && t.closest('input, textarea, [contenteditable], [data-selectable]'));

export function installGuards() {
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((t) => document.addEventListener(t, (e) => e.preventDefault(), { passive: false }));
  // interface text is never selected, and a long press brings up no menu; text fields and [data-selectable] keep both
  document.addEventListener('selectstart', (e) => { if (!editable(e.target)) e.preventDefault(); });
  if (navigator.maxTouchPoints > 0) document.addEventListener('contextmenu', (e) => { if (!editable(e.target)) e.preventDefault(); });
}

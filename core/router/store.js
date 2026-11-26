// The route: which tab shows, which pages lie on each tab, which sheet is up. One reactive object:
//
//   route.tab     the key of the tab showing
//   route.pages   { [tabKey]: [{ name, params }, …] }      the pages pushed on each tab, the first one at the bottom
//   route.sheet   { name, params } | null
//
// Navigating IS changing this object, and changing it from anywhere navigates: the router's views follow it (a page
// added to a list comes in, one taken off goes back, a sheet set comes up). router.* below are the ordinary ways to
// change it; a finger that swipes a page back changes it too.
//
// By default the router keeps the object itself. An app can hand <Router :route="obj"> a reactive object of its own
// with the same shape (a part of its own state, say): the router then reads and writes that one, and whatever else
// writes to it (another device, a script) moves the screen.
//
//   router.setTab(key | index)             router.tab   router.tabIndex
//   router.openSheet(name, params)         router.closeSheet()          router.sheet  ({ name, params } | null)
//   router.push(name, params)              a page on the tab showing; with a sheet up, the sheet goes first
//   router.pushOn(tabKey, name, params)    a page on any tab
//   router.pop()   router.popToRoot()      router.back()  (the sheet if one is up, else the page in front)
//   router.go({ tab, pages })              there at once, with no move (as the address does)
import { reactive, shallowRef, nextTick } from 'vue';

// What a route object must have; anything else on it is the app's own and is left alone.
function shape(r) {
  if (typeof r.tab !== 'string') r.tab = '';
  if (!r.pages || typeof r.pages !== 'object' || Array.isArray(r.pages)) r.pages = {};
  if (r.sheet === undefined || (r.sheet !== null && typeof r.sheet !== 'object')) r.sheet = null;
  return r;
}

const own = shape(reactive({}));
// what the <Router> puts in: the route object in use, its tabs, the stack views of its tabs, a page waiting for the
// sheet to go, and whether the change being made is to happen with no move
export const wiring = { route: shallowRef(own), tabs: shallowRef([]), stacks: new Map(), pending: null, instant: false };

/** Use this object as the route (or the router's own, for null). Returns it, in shape. */
export function useRouteObject(obj) {
  const r = shape(obj || own);
  if (wiring.route.value !== r) wiring.route.value = r;
  return r;
}

/** The route, reactive: read it in a template or a computed. */
export const useRoute = () => wiring.route.value;

/** One page of a route as a string: two pages are the same page when their names and parameters are. */
export const pageKey = (p) => String(p && p.name) + ':' + JSON.stringify((p && p.params) || {});
/** The pages of a tab, as the route has them, with anything that is not a page left out. */
export const pagesOf = (r, tabKey) => {
  const list = r && r.pages && r.pages[tabKey];
  return Array.isArray(list) ? list.filter((p) => p && typeof p.name === 'string') : [];
};

// A change made inside `fn` happens with no move: pages are in place at once. (The views read wiring.instant when
// they follow the change, which is before the next tick.)
export function instantly(fn) {
  wiring.instant = true;
  try { fn(); } finally { nextTick(() => { wiring.instant = false; }); }
}

const tabKeyOf = (t) => {
  const tabs = wiring.tabs.value;
  if (typeof t === 'number') return tabs[t] ? tabs[t].key : null;
  return tabs.some((x) => x.key === t) ? t : null;
};
function pushOn(tabKey, name, params) {
  const r = wiring.route.value;
  if (!Array.isArray(r.pages[tabKey])) r.pages[tabKey] = [];
  const list = r.pages[tabKey], page = { name: String(name), params: params || {} };
  if (list.length && pageKey(list[list.length - 1]) === pageKey(page)) return;      // it is the page in front already
  list.push(page);
}

export const router = {
  get route() { return wiring.route.value; },
  /** The key of the tab showing (the first tab, if the route names none that exists). */
  get tab() { const tabs = wiring.tabs.value, k = wiring.route.value.tab; return tabs.some((t) => t.key === k) ? k : tabs.length ? tabs[0].key : ''; },
  get tabIndex() { return Math.max(0, wiring.tabs.value.findIndex((t) => t.key === wiring.route.value.tab)); },
  get sheet() { return wiring.route.value.sheet; },
  /** How many pages lie over the first one of the tab showing. */
  get depth() { return pagesOf(wiring.route.value, router.tab).length; },
  setTab(t) { const k = tabKeyOf(t); if (k != null && k !== wiring.route.value.tab) wiring.route.value.tab = k; },
  /** Every call opens it, even while one swiped away is still sliding out (that one is then replaced by a new one). */
  openSheet(name, params) { wiring.pending = null; wiring.route.value.sheet = { name: String(name), params: params || {} }; },
  closeSheet() { if (wiring.route.value.sheet) wiring.route.value.sheet = null; },
  /** Called by <Router> when the sheet has gone (swiped away, or closed and done sliding). */
  sheetGone() {
    if (wiring.route.value.sheet) wiring.route.value.sheet = null;
    const p = wiring.pending;
    wiring.pending = null;
    if (p) pushOn(router.tab, p[0], p[1]);
  },
  push(name, params) {
    if (wiring.route.value.sheet) { wiring.pending = [name, params]; router.closeSheet(); return; }
    pushOn(router.tab, name, params);
  },
  /** A page on a tab that may not be the one showing. */
  pushOn(tabKey, name, params) { if (tabKeyOf(tabKey) != null) pushOn(tabKey, name, params); },
  pop() { const list = wiring.route.value.pages[router.tab]; if (Array.isArray(list) && list.length) list.pop(); },
  popToRoot() { const list = wiring.route.value.pages[router.tab]; if (Array.isArray(list) && list.length) list.splice(0, list.length); },
  /** One step back, whatever is in front: the sheet, or the page. True if there was anything to go back from. */
  back() {
    if (wiring.route.value.sheet) { router.closeSheet(); return true; }
    if (router.depth) { router.pop(); return true; }
    return false;
  },
  /** To the top of the first page of the tab showing. */
  scrollToTop() { const s = wiring.stacks.get(router.tab); if (s) s.scrollToTop(); },
  /** There at once, with no move: { tab, pages: [{ name, params }] } (what the address holds). */
  go(to) {
    const k = tabKeyOf(to && to.tab);
    if (k == null) return false;
    instantly(() => {
      const r = wiring.route.value;
      r.sheet = null;
      r.tab = k;
      r.pages[k] = (to.pages || []).filter((p) => p && typeof p.name === 'string').map((p) => ({ name: p.name, params: p.params || {} }));
    });
    return true;
  },
};

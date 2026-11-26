<!--
  Router: the whole of an app's navigation, with nothing of its look.

    <Router :look="look" :tabs="[{ key: 'home', label: '发现', … }, …]" :sheets="{ player: { label: '播放器' } }">
      <template #root="{ tab, nav, front }">…the first page of that tab…</template>
      <template #page="{ tab, name, params, nav, front }">…a page pushed by name…</template>
      <template #sheet="{ name, params, nav }">…what is in the sheet…</template>
      <template #chrome="{ tabs, index, onChange, onReselect }">…what floats over the root pages: a tab row…</template>
      …overlays: a toast, the update notice…
    </Router>

    look      from the style: how page turns, sheets and covered chrome look
    tabs      [{ key, label }]; anything else on a tab is the app's own (an icon, say) and comes back in the slots
    sheets    { [name]: { label, closeLabel } }: what a sheet is called, for screen readers
    route     a reactive route object of the app's own (./store.js); by default the router keeps one itself
    address   keep the address in step with the screen, and start where it says (default true)

  What it does, the same in every style:
    - Tabs, each with a page stack of its own (StackView): a tab keeps its pages while another shows. A tap on the
      tab already showing goes back to its first page, or to the top of it.
    - Pages are pushed by name: useNav().push('artist', { id }) in a page, router.push(…) anywhere. Back is a swipe
      (a finger on a phone, a mouse drag on a computer: the device decides, ../gesture/driver.js), the back button
      every pushed page has, Escape, or Alt + ←.
    - Sheets come up over everything: router.openSheet('player'). A page asked for from inside a sheet comes once the
      sheet has gone.
    - All of that is the route object (./store.js): where the screen is can be read from it, and changing it moves
      the screen.
    - The floating chrome belongs to the root pages: a page pushed over a root page, or a sheet, covers it where it
      is (./cover.js), and it is inert meanwhile. It is measured, and its height published as --chrome-h on .app, so
      that pages can keep clear of it.
    - The address follows the screen and restores it (./url.js): replaced, never pushed.

  The structure it renders (core.css lays it out; a style gives it its look):
    .under > main.views > section.tabview > .stack(.ds) > .layer > … > .page > .page-in      the pages
    .sheet-veil                                                                                 glass over .under while a sheet is up
    .chrome                                                                                     the floating chrome
    .sheet > … > .sheet-panel > .sheet-scroll > .sheet-in                                       the sheet
-->
<script setup>
import { ref, shallowRef, computed, watch, watchEffect, provide, onMounted, onBeforeUnmount, useTemplateRef } from 'vue';
import StackView from './StackView.vue';
import Sheet from './Sheet.vue';
import { ChromeCover } from './cover.js';
import { NAV } from './nav.js';
import { router, wiring, useRouteObject, pagesOf } from './store.js';
import { android } from '../platform/env.js';
import * as url from './url.js';

const props = defineProps({
  look: { type: Object, required: true },
  tabs: { type: Array, required: true },
  sheets: { type: Object, default: () => ({}) },
  route: { type: Object, default: null },
  address: { type: Boolean, default: true },
});

// ---- the route object, and where to start: the address, if it names a tab
wiring.tabs.value = props.tabs;
{
  const r = useRouteObject(props.route);
  const at = props.address ? url.read() : null;
  if (at && props.tabs.some((t) => t.key === at.tab)) {     // before any view exists: its pages are simply there
    r.tab = at.tab;
    r.pages[at.tab] = at.pages;
    r.sheet = null;                                         // (a sheet is not part of an address)
  }
}
watch(() => props.route, (o) => useRouteObject(o));
watch(() => props.tabs, (t) => { wiring.tabs.value = t; });
const route = () => wiring.route.value;
const tabKey = computed(() => router.tab);
const tabIndex = computed(() => Math.max(0, props.tabs.findIndex((t) => t.key === tabKey.value)));
const sheet = computed(() => route().sheet);

const underEl = useTemplateRef('under');
const veilEl = useTemplateRef('veil');
const chromeEl = useTemplateRef('chrome');
const ready = ref(false);              // mounted: a sheet may come up (it needs the elements above)

// ---- the floating chrome
// It is covered as far as the root page of the tab showing is (by pages pushed over it), or as far up as the sheet
// is, whichever is more.
let cover = null;
const covered = new Map();             // per tab: how far behind its root page is
const onDepth = (key, f) => { covered.set(key, f); if (cover && key === tabKey.value) cover.set('stack', f); };
const onCover = (f) => { if (cover) cover.set('sheet', f); };
watch(tabKey, (k) => { if (cover) cover.set('stack', covered.get(k) || 0); }, { flush: 'post' });

let off = [];
onMounted(() => {
  const el = chromeEl.value, app = el.closest('.app') || document.documentElement;
  // A drag that starts on the floating chrome scrolls nothing, and must not be handed to the document either (it
  // would take the whole screen with it). Anything in it that is a gesture of its own keeps its drags; so does a
  // native switch under a finger (the haptic ticks of a selector follow that finger).
  const stop = (e) => { if (e.cancelable && !(e.target.closest && e.target.closest('.sg, input[switch], [data-scroll-x]'))) e.preventDefault(); };
  el.addEventListener('touchmove', stop, { passive: false });
  off.push(() => el.removeEventListener('touchmove', stop, { passive: false }));

  // The chrome's height, for the pages: --chrome-h on .app.
  let last = -1;
  const tell = () => { const h = Math.round(el.offsetHeight); if (h !== last) { last = h; app.style.setProperty('--chrome-h', h + 'px'); } };
  tell();
  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(tell);
    ro.observe(el);
    off.push(() => ro.disconnect());
  }

  cover = ChromeCover(el, props.look.chrome && props.look.chrome.cover, props.look.stack.blur);
  cover.set('stack', covered.get(tabKey.value) || 0);

  // the address changed under the app (typed, or a link to another screen of it): go there, with no move
  const onHash = () => {
    if (!props.address) return;
    const at = url.read();
    if (!at || !router.go(at)) writeAddress();              // it names nothing here: the address goes back to what shows
  };
  window.addEventListener('hashchange', onHash);
  off.push(() => window.removeEventListener('hashchange', onHash));

  // The keyboard. Back: Escape, Alt + ← (which would otherwise leave the app: it has no history of its own), and ←.
  // ← and →: on a page over the first one (or with a sheet up) ← goes back and → does nothing; on a tab's first page
  // they go to the tab before and the tab after. (Not while something takes the arrows itself: a field, a selector
  // or the tab row with the focus.)
  let watcher = null;                  // Android's back, below (Escape is then a close request too: the watcher's)
  const onKey = (e) => {
    const esc = e.key === 'Escape', left = e.key === 'ArrowLeft', right = e.key === 'ArrowRight';
    if (!esc && !left && !right) return;
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const t = e.target;
    if (t && t.closest && t.closest('input, textarea, select, [contenteditable], [role="tablist"], [role="slider"], [role="radiogroup"]')) return;
    if (esc) { if (!router.sheet && !watcher) router.back(); return; }  // (the sheet hears Escape itself)
    if (e.altKey) { if (left && router.back()) e.preventDefault(); return; }
    const deep = !!router.sheet || pagesOf(route(), tabKey.value).length > 0;
    if (deep) { if (left && router.back()) e.preventDefault(); return; }
    const i = tabIndex.value + (left ? -1 : 1);
    if (i < 0 || i >= props.tabs.length) return;
    e.preventDefault();
    router.setTab(i);
  };
  document.addEventListener('keydown', onKey);
  off.push(() => document.removeEventListener('keydown', onKey));

  // Android's back button and back gesture. The app has no history for them to go through (the address is only ever
  // replaced), so with a page pushed or a sheet up they would leave the app. A close watcher takes them instead, and
  // adds nothing to the history: one stands for as long as there is something to go back from, and each request goes
  // one step back. With nothing to go back from there is none, and the system's back leaves the app, as it should.
  if (android && typeof CloseWatcher === 'function') {
    const stand = () => {
      const deep = !!route().sheet || pagesOf(route(), tabKey.value).length > 0;
      if (deep && !watcher) {
        try { watcher = new CloseWatcher(); } catch (e) { return; }
        watcher.onclose = () => { watcher = null; router.back(); };       // (still deep after it: stand() runs again)
      } else if (!deep && watcher) { const w = watcher; watcher = null; w.destroy(); }
    };
    off.push(watchEffect(stand), () => { if (watcher) watcher.destroy(); watcher = null; });
  }

  ready.value = true;
});
onBeforeUnmount(() => { off.forEach((fn) => fn()); off = []; cover = null; });

// ---- the address follows the screen
function writeAddress() {
  const k = tabKey.value;
  if (props.address && k) url.write({ tab: k, pages: pagesOf(route(), k) });
}
watchEffect(writeAddress);

// ---- the sheet: its content stays while it slides out
const shownSheet = shallowRef(null);
watch(sheet, (s) => { if (s) shownSheet.value = s; }, { immediate: true });
const sheetDef = computed(() => (shownSheet.value && props.sheets && props.sheets[shownSheet.value.name]) || {});
// navigation as what is in a sheet sees it: going back is putting the sheet away
const sheetNav = {
  push: router.push, pop: router.closeSheet, popToRoot: router.closeSheet, scrollToTop() {}, depth: 0,
  openSheet: router.openSheet, closeSheet: router.closeSheet,
};
provide(NAV, sheetNav);

const setTab = (i) => router.setTab(i);
// a tap on the tab already showing: back to its first page, or to the top of it
function onReselect(i) {
  const t = props.tabs[i], s = t && wiring.stacks.get(t.key);
  if (s) { if (s.depth) s.popToRoot(); else s.scrollToTop(); }
}
</script>

<template>
  <!-- what recedes behind a sheet: the pages -->
  <div ref="under" class="under">
    <main class="views">
      <StackView v-for="t in tabs" :key="t.key" :tab="t" :look="look.stack" :out-ms="look.tabs ? look.tabs.outMs : 0" :enter="look.tabs ? look.tabs.enter : null"
        :active="t.key === tabKey" @depth="(f) => onDepth(t.key, f)">
        <template #root="s"><slot name="root" :tab="t" v-bind="s" /></template>
        <template #page="s"><slot name="page" :tab="t" v-bind="s" /></template>
      </StackView>
    </main>
  </div>
  <!-- the glass that puts the pages out of focus behind a sheet, where that is done with a veil (./blur-mode.js) -->
  <div ref="veil" class="sheet-veil" />
  <!-- The floating chrome. It is not part of what recedes behind a sheet, and nothing it sits in ever carries a
       filter or an opacity: glass inside it would stop blurring. -->
  <div ref="chrome" class="chrome">
    <slot name="chrome" :tabs="tabs" :index="tabIndex" :on-change="setTab" :on-reselect="onReselect" />
  </div>
  <Sheet :look="look.sheet" :label="sheetDef.label" :close-label="sheetDef.closeLabel" :open="ready && !!sheet" :request="sheet"
    :under="underEl" :veil="veilEl" @cover="onCover" @closed="router.sheetGone">
    <slot v-if="shownSheet" name="sheet" v-bind="{ name: shownSheet.name, params: shownSheet.params || {}, nav: sheetNav, open: !!sheet }" />
  </Sheet>
  <slot />
</template>


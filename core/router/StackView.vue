<!--
  One tab's page stack: a PageStack (./stack.js) whose pages hold what the app puts into them. The stack owns the
  layers, the gestures and what the layers behind look like; Vue only puts content into each page (a Teleport).

    <StackView :tab="{ key: 'home', label: 'Discover' }" :look="look.stack" :active="tab === 'home'">
      <template #root="{ nav, front }">…the tab's first page…</template>
      <template #page="{ name, params, nav, front }">…a pushed page…</template>
    </StackView>

  Which pages lie on the stack is the route's (./store.js): route.pages[tab.key]. This view follows that list (a page
  added comes in, pages taken off go back), and writes to it when a page leaves by itself (a swipe, its back button).
  `front` tells a page that it is the one in front, on the tab showing.
-->
<script setup>
import { ref, shallowRef, computed, watch, nextTick, provide, onMounted, onBeforeUnmount, useTemplateRef } from 'vue';
import { reduced } from '../platform/env.js';
import { PageStack } from './stack.js';
import { NAV } from './nav.js';
import { router, wiring, pageKey, pagesOf } from './store.js';

const props = defineProps({
  tab: { type: Object, required: true },           // { key, label }
  look: { type: Object, required: true },          // the style's look.stack
  active: Boolean,
  outMs: { type: Number, default: 320 },
  enter: { type: Function, default: null },         // the style's look.tabs.enter(el): see below
});
const emit = defineEmits(['depth']);

const hostEl = useTemplateRef('host');
const viewEl = useTemplateRef('view');
const rootEl = shallowRef(null);
const shown = shallowRef([]);                      // the pages that hold content: { id, key, name, params, inner }
const KEY = props.tab.key;
let st = null;                                     // the PageStack
let offDepth = null;
let applying = false;                              // the stack is being changed to match the route
let seq = 0;
const leaving = new Set();                         // ids of pages asked to go back, still sliding out
// Accessibility copy may change without replacing any pages or gesture drivers.
const stackLook = { ...props.look, get backLabel() { return props.look.backLabel; } };

const route = () => wiring.route.value;
const want = () => pagesOf(route(), KEY);
// what the route wants on this tab, as one string: changes exactly when the list of pages does
const sig = computed(() => want().map(pageKey).join('\n'));

// ---- the route changed: the stack follows
function follow(instant) {
  if (!st) return;
  const to = want();
  const have = shown.value.filter((p) => st.has(p.id) && !leaving.has(p.id));
  let k = 0;
  while (k < to.length && k < have.length && pageKey(to[k]) === have[k].key) k++;
  applying = true;
  try {
    if (have.length > k) {
      if (to.length === k && !instant) {
        // only going back: the pages in between go at once, the one in front swipes away
        have.slice(k).forEach((p) => leaving.add(p.id));
        st.popTo(k);
      } else st.clear(k);
    }
    const list = shown.value.filter((p) => st.has(p.id));
    const add = to.slice(k);
    add.forEach((p, i) => {
      const key = pageKey(p), id = key + '#' + (++seq);
      // the last one comes in; the ones under it are simply there
      const page = st.push(id, { instant: !!instant || i < add.length - 1 });
      if (page) list.push({ id, key, name: p.name, params: p.params || {}, inner: page.inner });
    });
    shown.value = list;
  } finally { applying = false; }
}

// ---- the stack changed by itself (a swipe back, the back button): the route follows
function onStack() {
  if (!st) return;
  const cur = shown.value;
  if (!cur.every((p) => st.has(p.id))) shown.value = cur.filter((p) => st.has(p.id));
  leaving.forEach((id) => { if (!st.has(id)) leaving.delete(id); });
  if (applying) return;
  const list = route().pages[KEY];
  if (!Array.isArray(list)) return;
  const alive = shown.value.filter((p) => !leaving.has(p.id));
  let k = 0;
  while (k < list.length && k < alive.length && pageKey(list[k]) === alive[k].key) k++;
  if (alive.length === k && list.length > k) list.splice(k, list.length - k);
}

onMounted(() => {
  st = PageStack(hostEl.value, stackLook);
  rootEl.value = st.root;
  st.onChange(onStack);
  offDepth = st.onDepth((f) => emit('depth', f));
  follow(true);                                    // the pages the route has already: in place at once
});
watch(sig, () => follow(wiring.instant));
watch(() => wiring.route.value, () => follow(true));        // another route object: its pages are in place at once
watch(() => props.look.backLabel, (label) => {
  hostEl.value?.querySelectorAll('.nav > [role="button"]').forEach((el) => el.setAttribute('aria-label', label || 'Back'));
}, { flush: 'post' });

// ---- navigation, as the pages of this tab see it
const list = () => { const r = route(); if (!Array.isArray(r.pages[KEY])) r.pages[KEY] = []; return r.pages[KEY]; };
const nav = {
  tab: KEY,
  push: (name, params) => (props.active ? router.push(name, params) : router.pushOn(KEY, name, params)),
  pop: () => { const l = list(); if (l.length) l.pop(); },
  popToRoot: () => { const l = list(); if (l.length) l.splice(0, l.length); },
  scrollToTop: () => { if (st) st.rootPage.scrollTo({ top: 0, behavior: 'smooth' }); },
  get depth() { return want().length; },
  openSheet: router.openSheet,
  closeSheet: router.closeSheet,
};
provide(NAV, nav);
wiring.stacks.set(KEY, nav);

// ---- which page is in front (on the tab showing): 'root', or a page's id
const frontId = computed(() => {
  if (!props.active) return null;
  const to = want();
  if (!to.length) return 'root';
  const key = pageKey(to[to.length - 1]);
  for (let i = shown.value.length - 1; i >= 0; i--) if (shown.value[i].key === key) return shown.value[i].id;
  return null;
});

// The tab you leave stays for a moment, over the one you go to, so that the style can let it go its own way
// (.tabview.out). The tab you go to is there at once: it is the one a finger is about to scroll, and nothing about
// it may change when the old one has gone. A style that wants it to come in says how (look.tabs.enter(el), el being
// this tab's element, already showing): with animations of its own on what is inside the pages, which hold nothing
// once they have run, so that there is nothing to take off afterwards. (Not on the first screen of a launch, and
// not where motion is to be reduced.)
const out = ref(false);
let outTimer = 0;
watch(() => props.active, (on, was) => {
  clearTimeout(outTimer);
  if (on) {
    out.value = false;
    if (was === false && props.enter && !reduced()) nextTick(() => { if (props.active && viewEl.value) props.enter(viewEl.value); });
    return;
  }
  if (!was || !props.outMs) return;
  out.value = true;
  outTimer = setTimeout(() => { out.value = false; }, props.outMs);
});

onBeforeUnmount(() => {
  clearTimeout(outTimer);
  if (wiring.stacks.get(KEY) === nav) wiring.stacks.delete(KEY);
  if (offDepth) offDepth();
  if (st) st.destroy();
  st = null;
});
</script>

<template>
  <!-- a tab that is not showing takes no focus and is not read out -->
  <section ref="view" class="tabview" :class="{ on: active, out: !active && out }" :aria-label="tab.label" :inert="!active">
    <!-- The stack lives in an element of its own, whose class Vue never writes: PageStack puts its own classes on
         its host (the look's values hang on them). -->
    <div ref="host" class="stack" />
    <Teleport v-if="rootEl" :to="rootEl">
      <slot name="root" :nav="nav" :front="frontId === 'root'" />
    </Teleport>
    <Teleport v-for="p in shown" :key="p.id" :to="p.inner">
      <!-- (as one object: a slot outlet's own `name` is the slot's, so the page's name cannot be bound by itself) -->
      <slot name="page" v-bind="{ id: p.id, name: p.name, params: p.params, nav, front: frontId === p.id }" />
    </Teleport>
  </section>
</template>

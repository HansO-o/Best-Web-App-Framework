<!--
  Sheet: a full-screen surface that comes up from below, over whatever is on screen, and goes away with a swipe down
  (a finger, a mouse drag, its handle, Escape). Once up it is a page like any other. What was on screen before stays
  behind it and recedes, as a page does behind the next one.

    <Sheet :look="look.sheet" label="播放器" :open="!!sheet" :request="sheet" :under="underEl" :veil="veilEl"
      @cover="(f) => …" @closed="…">…what is in it…</Sheet>

    look         the sheet's look (./SheetSurface.vue says what each value means)
    label        what it is, for screen readers; closeLabel: what its handle does
    open         whether the sheet should be showing
    request      changes with every request to open it: asked for while the last one is still sliding out, a new one comes
    under        the element that lies under the sheet and recedes
    veil         an element that covers `under` and nothing else: the glass that puts it out of focus
    @cover(f)    every frame, how far up the sheet is, 0 (gone) .. 1 (up): for what belongs to the screen it covers
                 but is not in `under` (the tab row)
    @closed      as soon as it has gone (swiped down, or closed from outside and done sliding)

  The surface itself (the gesture, and what follows it) is ./SheetSurface.vue. This file decides when there is one:
  it is unmounted only once things are quiet (../gesture/quiet.js), and a new request while the last surface is on
  its way out gets a new surface.
-->
<script setup>
import { ref, watch, onBeforeUnmount } from 'vue';
import { whenQuiet } from '../gesture/quiet.js';
import SheetSurface from './SheetSurface.vue';

const props = defineProps({
  look: { type: Object, required: true },
  label: String,
  closeLabel: String,
  open: Boolean,
  request: { default: null },
  under: { default: null },
  veil: { default: null },
});
const emit = defineEmits(['cover', 'closed']);

const mounted = ref(false);
const gen = ref(0);
let tidy = null;
let away = true;               // no surface, or the one there is pulled down or leaving
let opened = false;
let newest = 0;                // the generation of the surface last asked for

watch(() => [props.open, props.request], () => {
  const was = opened;
  opened = props.open;
  if (!props.open) return;
  if (was && !away) return;                       // asked again while it is up: it stays
  if (tidy) { tidy.cancel(); tidy = null; }
  away = false;
  gen.value = ++newest;                           // a new surface, even if the last one is still sliding out
  mounted.value = true;
}, { immediate: true });
onBeforeUnmount(() => { if (tidy) tidy.cancel(); });

// Only the newest surface may say the sheet has gone: one sliding out can come to rest just after a new one was
// asked for, before it is in place, and would close the new one.
function onGone(g) {
  if (g !== newest) return;
  emit('closed');
  tidy = whenQuiet(() => { tidy = null; mounted.value = false; });
}
const onAway = (g, a) => { if (g === newest) away = a; };
</script>

<template>
  <SheetSurface v-if="mounted" :key="gen" :look="look" :label="label" :close-label="closeLabel" :open="open"
    :under="under" :veil="veil" @cover="(f) => emit('cover', f)" @gone="onGone(gen)" @away="(a) => onAway(gen, a)">
    <slot />
  </SheetSurface>
</template>

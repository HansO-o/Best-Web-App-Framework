// useGlider: the glider (./glider.js) for a Vue selector. The style renders the markup; this gives it the behaviour.
//
//   const bar = useTemplateRef('bar');
//   useGlider(bar, {
//     items: () => list.map((t) => t.key),          // which items there are (it is attached again when they change)
//     index: () => props.index,                     // the chosen one
//     draw,                                         // how the ink shows where it is (./glider.js); default: translateX
//     onChange: (i) => emit('change', i), onReselect: (i) => emit('reselect', i),
//   });
//
//   <label ref="bar" role="tablist">
//     <input v-if="tapSwitch" type="checkbox" :switch.attr="''" aria-hidden="true">       iPhone haptics
//     <i data-gl-ink />
//     <span v-for="t in list" :key="t.key" data-gl-item role="tab" tabindex="0">{{ t.label }}</span>
//   </label>
import { watch, onBeforeUnmount } from 'vue';
import { attachGlider } from './glider.js';

export function useGlider(bar, { items, index, draw, onChange, onReselect }) {
  let g = null;
  const drop = () => { if (g) { g.destroy(); g = null; } };
  // attached once the items are in the document, and again whenever there are other items
  watch([bar, () => String(items())], ([el, signature], [beforeEl, beforeSignature] = []) => {
    // A shallow element ref forces this combined watcher even when a fresh items
    // array has the same keys. Keep the held pointer and spring in that case.
    if (el === beforeEl && signature === beforeSignature) return;
    drop();
    if (!el) return;
    g = attachGlider(el, {
      index: index() || 0, draw,
      onSelect: (i) => { if (onChange) onChange(i); },
      onReselect: (i) => { if (onReselect) onReselect(i); },
    });
  }, { immediate: true, flush: 'post' });
  // a choice made elsewhere: the ink goes there
  watch(index, (i) => { if (g) g.set(i || 0); }, { flush: 'post' });
  onBeforeUnmount(drop);
}

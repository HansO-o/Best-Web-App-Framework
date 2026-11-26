// Segmented: choose one of a few. The tab row at the bottom of an app is one too: the same control in another look.
//
//   <Segmented :items="['WAV', 'MP3']" :index="i" label="下载格式" @change="(k) => (i = k)" />
//   <Segmented look="tabs" :items="[{ key: 'home', label: '发现', icon: 'compass' }, …]" :index="tab"
//     @change="setTab" @reselect="popToRoot" />                           (or <TabBar :tabs="…" />, the same thing)
//
//   items       strings, or { key, label, icon } (icon: a name from icon-paths.js, or a vnode; with an icon, the
//               label names it for screen readers)
//   index       the chosen item; @change(i) on every item the finger passes (where it lands, and while dragging);
//               @reselect(i) for a tap on the item already chosen
//   look        'pill' (default): a pill behind the chosen item, on a faint track. The items are as wide as the
//                 widest, and the control as wide as they are, unless it is given a width.
//               'tabs': a dot under the chosen item, on a capsule of blur with no fill, border or shadow (the app's
//                 tab row). The items share the width it is given. What is put in its `after` slot stands in the
//                 same capsule after the items, each thing as wide as an item, and is no part of the control: the
//                 dot never comes to it, a finger sliding along the items never chooses it.
//   height      the one size: padding, text, pill and dot follow it (default 34 for 'pill', --bar-h for 'tabs')
//   label, class, style
//
// How it behaves is @core's glider (core/controls/glider.js), the same in every style: the ink is moved by a spring,
// a tap pulls it to the item, a drag trails the finger and chooses every item passed, and every item chosen ticks (on
// iPhone through an invisible native switch over the whole control). What is this style's: the two looks, and how the
// ink is drawn. Held, it squashes (the dot into a flat ellipse); moving, it stretches with its speed.
//
// Colours are CSS variables with fallbacks: --sgm-fg (chosen item, dot), --sgm-muted (the others), --sgm-track
// ('pill' track), --sgm-pill ('pill' pill), --sgm-blur ('tabs' capsule, default 18px).
// Glass and opacity do not mix: the capsule stops blurring as soon as the control, or anything it sits in, has an
// opacity below 1, an opacity animation, will-change: opacity or a filter. Move it with transforms only; to cover it,
// write on its leaves (.sgm-item, .sgm-ink, .sgm-haze) as look.js does.
import { defineComponent, h, shallowRef, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useGlider, tapSwitch } from '@core';
import { Icon } from './Icon.js';

const drawDot = (ink, { x, speed, hold }) => {
  ink.style.setProperty('--sx', (1 + hold * 1.6 + Math.min(3.4, speed / 360)).toFixed(3));
  ink.style.setProperty('--sy', (1 - hold * 0.24 - Math.min(0.4, speed / 3400)).toFixed(3));
  ink.style.transform = `translateX(${x.toFixed(2)}px)`;
};
const drawPill = (ink, { x, speed, hold }) => {
  const sq = Math.min(0.1, speed / 9000);
  ink.style.transform = `translateX(${x.toFixed(2)}px) scale(${(1 + hold * 0.05 + sq).toFixed(3)},${(1 + hold * 0.05 - sq).toFixed(3)})`;
};
const itemOf = (t) => (t && typeof t === 'object' ? { ...t, key: String(t.key ?? t.label) } : { key: String(t), label: String(t) });

// The tab row's first icon, placed by what is drawn of it, not by its box (an icon's box has air round its lines). The
// capsule's end is round: the drawing is put where it is as far from the capsule's edge all round the end as it is
// from its top and its bottom. So a round drawing sits with its centre on the end's centre (the ring does), and
// a drawing with corners (a folder) sits further in, its corners as far from the curve as its top is from the top.
// Measured on the lines themselves (sampled along them, with their width). The answer is where the icon's box's
// centre goes, from the row's left: --tab-cf on .app, which the stylesheet places the row's places by
// (components.css, the tab row's places). Written only when it changes.
const SHAPES = 'path, circle, ellipse, rect, line, polyline, polygon';
export function drawnPoints(svg, origin) {
  const b = svg.getBoundingClientRect(), vb = svg.viewBox && svg.viewBox.baseVal;
  const k = vb && vb.width ? b.width / vb.width : 1, ox = vb ? vb.x : 0, oy = vb ? vb.y : 0;
  const cs = getComputedStyle(svg), half = (cs.stroke && cs.stroke !== 'none' ? parseFloat(cs.strokeWidth) || 0 : 0) * k / 2;
  const pts = [];
  for (const el of svg.querySelectorAll(SHAPES)) {
    if (typeof el.getTotalLength !== 'function') continue;
    let len = 0;
    try { len = el.getTotalLength(); } catch (e) { continue; }
    const n = Math.max(24, Math.min(240, Math.ceil(len * 3)));
    for (let i = 0; i <= n; i++) {
      const p = el.getPointAtLength((len * i) / n);
      pts.push([b.left - origin.left + (p.x - ox) * k, b.top - origin.top + (p.y - oy) * k]);
    }
  }
  return { pts, half, box: b };
}
function placeFirst(row) {
  const svg = row && row.querySelector('.sgm-tabs .sgm-item svg');
  if (!svg) return;
  const r = row.getBoundingClientRect();
  if (!r.height) return;
  const { pts, half, box } = drawnPoints(svg, r);
  if (!pts.length) return;
  const H = r.height, R = H / 2;
  const gap = Math.min(Math.min(...pts.map((p) => p[1])) - half, H - Math.max(...pts.map((p) => p[1])) - half);
  // moved right by s, is every point at least `gap` inside the round end?
  const fits = (s) => pts.every(([x, y]) => x + s >= R || R - Math.hypot(R - x - s, y - R) - half >= gap - 0.05);
  let lo = -H, hi = H;
  if (!fits(hi)) return;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (fits(m)) hi = m; else lo = m; }
  const cf = box.left - r.left + box.width / 2 + hi;
  const app = row.closest('.app') || document.documentElement, v = cf.toFixed(2) + 'px';
  if (app.style.getPropertyValue('--tab-cf') !== v) app.style.setProperty('--tab-cf', v);
}

export const Segmented = defineComponent({
  name: 'Segmented',
  inheritAttrs: false,
  props: {
    items: { type: Array, default: () => [] },
    index: { type: Number, default: 0 },
    look: { type: String, default: 'pill' },
    height: Number,
    label: String,
  },
  emits: ['change', 'reselect'],
  setup(props, { emit, slots, attrs }) {
    const bar = shallowRef(null);
    const list = computed(() => props.items.map(itemOf));
    useGlider(bar, {
      items: () => props.look + ':' + list.value.map((t) => t.key).join('\n'),
      index: () => props.index,
      draw: (ink, s) => (props.look === 'tabs' ? drawDot : drawPill)(ink, s),
      onChange: (i) => emit('change', i),
      onReselect: (i) => emit('reselect', i),
    });
    // (the tab row: its first icon placed by what is drawn of it; again when the first tab is another)
    // (and when the row's height changes: the end's curve is another)
    const row = shallowRef(null);
    const place = () => { if (props.look === 'tabs') nextTick(() => placeFirst(row.value)); };
    let ro = null, high = 0;
    onMounted(() => {
      place();
      if (props.look === 'tabs' && row.value && typeof ResizeObserver === 'function') {
        ro = new ResizeObserver(() => { const hh = row.value ? row.value.offsetHeight : 0; if (hh && hh !== high) { high = hh; place(); } });
        ro.observe(row.value);
      }
    });
    onBeforeUnmount(() => { if (ro) ro.disconnect(); ro = null; });
    watch(() => list.value.length && list.value[0].key + ':' + String(list.value[0].icon), place);
    return () => {
      const tabs = props.look === 'tabs';
      const size = props.height ? { '--h': props.height + 'px' } : null;
      // what the caller put on it (class, style, id, …) goes on the outermost element
      const { class: klass, style, ...rest } = attrs;
      const control = h('label', {
        ...(tabs ? null : rest), ref: bar, key: props.look, role: 'tablist', 'aria-label': props.label,
        class: ['sgm', tabs ? 'sgm-tabs' : 'sgm-pill', tabs ? null : klass],
        style: tabs ? { '--n': list.value.length } : [size, style],
      }, [
        tapSwitch ? h('input', { key: 'switch', type: 'checkbox', '^switch': '', class: 'sgm-switch', 'aria-hidden': 'true' }) : null,
        h('i', { key: 'ink', class: 'sgm-ink', 'data-gl-ink': '', 'aria-hidden': 'true' }),
        list.value.map((t) => h('span', {
          key: 'item:' + t.key, class: 'sgm-item', 'data-gl-item': '', role: 'tab', tabindex: 0, 'aria-label': t.icon ? t.label : undefined,
        }, t.icon ? (typeof t.icon === 'string' ? h(Icon, { name: t.icon, size: t.iconSize || 25 }) : t.icon) : t.label)),
      ]);
      if (!tabs) return control;
      // the capsule's box: the blur, the items, and whatever else stands in the row
      return h('div', { ...rest, ref: row, class: ['sgm-row', klass], style: [size, style] }, [
        h('i', { class: 'sgm-haze', 'aria-hidden': 'true' }),
        control,
        slots.after ? slots.after() : null,
      ]);
    };
  },
});

/** The bottom tab row: a Segmented in its 'tabs' look. `tabs`: [{ key, label, icon }]. */
export const TabBar = defineComponent({
  name: 'TabBar',
  props: { tabs: { type: Array, default: () => [] }, index: { type: Number, default: 0 }, label: { type: String, default: '页签' } },
  emits: ['change', 'reselect'],
  setup(props, { emit, slots }) {
    return () => h(Segmented, {
      look: 'tabs', label: props.label, items: props.tabs, index: props.index,
      onChange: (i) => emit('change', i), onReselect: (i) => emit('reselect', i),
    }, slots);
  },
});

export default Segmented;

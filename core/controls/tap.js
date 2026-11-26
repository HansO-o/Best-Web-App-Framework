// Tap: what makes an element a button, on every device. Behaviour only: how a pressed button looks is the style's
// ([data-tap] in its stylesheet).
//
//   <Tap label="Add" @tap="add">…</Tap>                                       in a template
//   h('label', { ...tapAttrs(), ...tapHandlers(add) }, [tapSwitchNode(), …])      the same thing in a render function
//
// - iPhone: the only haptic a web page gets is the one a finger on a <label> around a native switch plays
//   (../platform/env.js, tapSwitch; README.md, "Haptics"). So a tap is a <label>, on every device (one
//   markup everywhere), with an invisible switch in it where that ticks (.hsw, core.css). The label hands the click
//   on to its switch, and that second click comes back up through the label: it is not a tap.
// - Android: one tick through the vibration API.
// - It can be reached and pressed from the keyboard (Enter, Space).
import { defineComponent, h } from 'vue';
import { tapSwitch, buzz } from '../platform/env.js';

/** The attributes of a tap. inline: it stands in a line of text (a label is laid out as a block otherwise: core.css). */
export const tapAttrs = (inline) => ({ 'data-tap': inline ? 'inline' : '', role: 'button', tabindex: 0 });

/** The listeners of a tap: fn(event) for a click that is a tap, and for Enter or Space on it. */
export function tapHandlers(fn, haptic = true) {
  const fire = (e) => { if (haptic) buzz(); return fn(e); };
  return {
    onClick: (e) => { if (e.target.matches && e.target.matches('.hsw')) return undefined; return fire(e); },
    onKeydown: (e) => {
      if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return undefined;
      e.preventDefault();
      return fire(e);
    },
  };
}

/** The invisible native switch that makes an iPhone tick, as the label's first child; null where there is none. */
export const tapSwitchNode = (haptic = true) => (tapSwitch && haptic
  ? h('input', { type: 'checkbox', '^switch': '', class: 'hsw', 'aria-hidden': 'true', key: 'hsw' })
  : null);

export const Tap = defineComponent({
  name: 'Tap',
  props: {
    label: String,                                    // what it does, for screen readers (when its content does not say)
    haptic: { type: Boolean, default: true },
    inline: Boolean,
  },
  emits: ['tap'],
  setup(props, { emit, slots }) {
    const on = tapHandlers((e) => emit('tap', e), props.haptic);
    return () => h('label', { ...tapAttrs(props.inline), 'aria-label': props.label, ...on },
      [tapSwitchNode(props.haptic), slots.default ? slots.default() : null]);
  },
});
export default Tap;

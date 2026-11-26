// A toast: a line of glass that comes down from the top and goes by itself.
//
//   toast('Saved');            from anywhere
//   <Toast />                   once, among the Router's children
import { defineComponent, h, ref } from 'vue';

const message = ref(null);
let timer = 0;

export function toast(text, ms = 2200) {
  message.value = String(text);
  clearTimeout(timer);
  timer = setTimeout(() => { message.value = null; }, ms);
}

export const Toast = defineComponent({
  name: 'Toast',
  setup() {
    let last = '';                               // it keeps its words while it goes
    return () => {
      if (message.value) last = message.value;
      return h('div', { class: ['toast glass', message.value ? 'on' : null], role: 'status' }, last);
    };
  },
});
export default Toast;

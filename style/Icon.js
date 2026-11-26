// Line icons: an inline SVG drawn from the paths in icon-paths.js. They take their colour from the text around them
// (currentColor), and stand off the ground a little (style.css, --icon-lift).
//
//   <Icon name="compass" :size="25" />
//   <Icon :paths="[['path', { d: 'M5 12h14' }]]" />          an icon of the app's own, in the same format
import { h } from 'vue';
import { ICONS } from './icon-paths.js';

const kebab = (k) => k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
const shape = ([tag, attrs], i) => {
  const a = { key: i };
  for (const k in attrs) if (k !== 'fill') a[kebab(k)] = attrs[k];
  if (attrs.fill) a.fill = 'currentColor';
  return h(tag, a);
};

export function Icon(props) {
  const size = props.size || 22, color = props.color || 'currentColor';
  const paths = Array.isArray(props.paths) ? props.paths : ICONS[props.name] || [];
  return h('svg', {
    class: 'ic', width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, style: { color },
    'stroke-width': 1.9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true',
  }, paths.filter((p) => Array.isArray(p) && typeof p[0] === 'string').map(shape));
}
Icon.props = ['name', 'size', 'color', 'paths'];
export default Icon;

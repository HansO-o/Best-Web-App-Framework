// @style: lit-paper-glass. How an app built on @core looks: tokens, the look of the structure @core lays out, and the
// controls (the tab row is one of them). @core never imports from here; a style takes its behaviour from @core.
import './style.css';
import './components.css';
import { applyBackStyle } from './back-style.js';

applyBackStyle();                 // before the first paint of any page

// how pages turn, sheets rise and the chrome is covered: handed to @core's <Router :look="look">
export { look } from './look.js';

export { Segmented, TabBar } from './Segmented.js';
export { Icon } from './Icon.js';
export { ICONS } from './icon-paths.js';
export { Toast, toast } from './Toast.js';
export { setTheme, switchTheme, isDark } from './theme.js';
export { BACK_STYLES, getBackStyle, setBackStyle } from './back-style.js';

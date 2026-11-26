// @core: gestures and routing. The half of the framework that stays the same whatever the app looks like.
// (The other half is a style: ../style/.)
import './core.css';

// routing
export { default as Router } from './router/Router.vue';
export { router, useRoute, pageKey } from './router/store.js';
export { useNav } from './router/nav.js';
export { default as StackView } from './router/StackView.vue';
export { default as Sheet } from './router/Sheet.vue';
export { PageStack } from './router/stack.js';
export { blurMode } from './router/blur-mode.js';

// gestures
import './gesture/scroll-gesture.js';
export const ScrollGesture = window.ScrollGesture;
export { getDriver } from './gesture/driver.js';
export { whenQuiet } from './gesture/quiet.js';

// selectors (a segmented control, a tab row) and buttons: behaviour only
export { attachGlider } from './controls/glider.js';
export { useGlider } from './controls/useGlider.js';
export { Tap, tapAttrs, tapHandlers, tapSwitchNode } from './controls/tap.js';

// the device, and the places the app runs in
export * from './platform/env.js';
export { installGuards } from './platform/guards.js';


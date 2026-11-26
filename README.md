# Best Web App Framework

**Web apps that feel native.** Page turns, swipe back, full-screen sheets, the tab bar and haptics are all built on the browser's own CSS snap scrolling: tracking, momentum and bounce are done by the system on the compositor thread, not computed frame by frame in JavaScript. On iPhone, pages turn at 120fps with ProMotion, and a busy main thread never drops a frame.

Demo: <https://hanso-o.github.io/Best-Web-App-Framework/> (open it on a phone, or in Safari choose Share → Add to Home Screen)

This is the gestures, routing and tab bar layer of the [earth.icu](https://earth.icu) framework on its own: no state object, no backend, no AI. Just a navigation layer and a style that any Vue 3 app can use.

## Why it is fast

| What it does | What you get |
|---|---|
| Every pushed page is a horizontal `scroll-snap` container; going back is the system's own scroll | Tracking, momentum and snapping are the system's, exactly as in a native app |
| The page behind shrinks, blurs and fades on `animation-timeline: scroll()` | The motion follows the scroll position on the compositor thread, without JavaScript |
| Whatever follows a finger moves by `transform` and `opacity` only | No layout, no paint |
| In Chromium, the blur behind is one fixed-radius `backdrop-filter` whose opacity changes | No `blur()` keyframes pulling the animation back onto the main thread |
| Nothing changes the moment a transition ends; a page that left is removed after 350ms of quiet | A finger that goes on to scroll the new page is never interrupted |
| No `touchmove` listener on the `document` that can `preventDefault` | No scroll ever waits for the main thread to start |

Mouse dragging is the one case handled by script (browsers do not let a mouse drag a scroll container): the page moves by `transform` while dragged and is handed back to the scroll container on release.

## What is in it

- **Routing**: one page stack per tab, each tab keeping its own. The route is one reactive object, `{ tab, pages, sheet }`; navigating is changing it.
- **Going back**: swipe right anywhere on a page on touch devices; drag with the mouse or swipe two fingers on a trackpad; Esc, ←, Alt+←; Android's system back (`CloseWatcher`); the back button at the top left of every pushed page.
- **Full-screen sheets**: rise from below while the pages under them drop back out of focus; pull down, tap the handle or press Esc to close.
- **Tab bar**: a dot on a spring that squashes when held and stretches when dragged; hold and slide to sweep across tabs. The capsule is nothing but blur. Its ends are laid out the way Apple does it, concentric with the rounded ends, with the last place kept for a ring (in the demo it opens the sheet).
- **Segmented control**: the same component as the tab bar (`Segmented`), in another look.
- **Haptics**: on iPhone web every button hides a native switch (`<input type="checkbox" switch>`), and a finger landing on it makes the system tick, the only haptic a web page can get on iPhone. The segmented control and the tab bar tick on every item they pass. Android uses `navigator.vibrate`.
- **No browser history**: the address after `#` is only replaced (`replaceState`), so a reload comes back to the same screen and the browser's own back gesture never fights the app's.
- **Pages like an app's**: no zoom, no selectable interface text, no long-press menu, a clear status bar, content padded by the safe areas.
- **Themes**: light is lit paper, dark is pure black; a new theme spreads from where you pressed.

## Layout

```
core/     gestures + routing + buttons (Tap) + device detection. No colours, sizes or fonts
style/    the lit-paper-glass style: how pages turn (look.js), tab bar and segmented control, icons, themes, Toast
demo/     the demo app
```

`core/` never imports from `style/`; `style/` takes all of its behaviour from `@core`. A style that looks completely different needs no change in `core/`.

## Usage

```bash
npm install
npm run dev       # develop
npm run build     # build into dist/: static files that run from anywhere
```

```vue
<script setup>
import { Router, Tap, useNav, router } from '@core';
import { look, TabBar, Toast } from '@style';

const tabs = [{ key: 'home', label: 'Home', icon: 'compass' }, { key: 'me', label: 'Me', icon: 'user' }];
const sheets = { player: { label: 'Player' } };
</script>

<template>
  <Router :look="look" :tabs="tabs" :sheets="sheets">
    <template #root="{ tab }"><Home v-if="tab.key === 'home'" /><Me v-else /></template>
    <template #page="{ name, params }"><Detail v-if="name === 'detail'" v-bind="params" /></template>
    <template #sheet="{ name, params }"><Player v-bind="params" /></template>
    <template #chrome="{ tabs, index, onChange, onReselect }">
      <TabBar :tabs="tabs" :index="index" @change="onChange" @reselect="onReselect" />
    </template>
    <Toast />
  </Router>
</template>
```

```js
const nav = useNav();              // in a page
nav.push('detail', { id: 1 });     // push a page
nav.pop();  nav.popToRoot();
router.openSheet('player');        // from anywhere
router.setTab('me');
```

Every button is a `<Tap @tap="…">`: it is a `<label>` that carries the native switch on iPhone, so every tap ticks, and it can be pressed from the keyboard.

Call `installGuards()` once in `main.js` (no zoom, no text selection, no long-press menu). `core/platform/boot.js` must be inlined in `<head>` so the device classes are on `<html>` before the first paint (`vite.config.js` does this). Copy the `viewport` and `apple-mobile-web-app-*` tags from `demo/index.html`.

## Haptics

iPhone web pages cannot call a vibration API. The one haptic Safari plays is a finger toggling a native switch, so every `Tap` is a `<label>` wrapping an invisible `<input type="checkbox" switch>`, and selectors stretch one switch over the whole control and move it under the finger so each item passed ticks. The switch is rendered only on iPhone web. Android and the app shell use `navigator.vibrate`.

## Hard rules

1. Add no browser history: no `pushState`, no `location.href = …`, no `<a href>` that the browser follows.
2. Whatever follows a finger moves by `transform` and `opacity` only.
3. Nothing above glass may carry an opacity, a filter, or an animation of either; glass moves by `transform` only.
4. The default transition inside content is a list of properties (`--cont`), never `transition: all`, and never `visibility`. The structures core moves (`.layer`, `.sheet`, `.chrome`) have no `transition`.
5. Text fields are at least 16px (iPhone zooms into smaller ones).

Debug switches (not user settings): `?driver=js` forces the script driver to compare the feel; `localStorage['app:blur'] = 'veil' | 'filter' | 'none'` forces how the page behind is blurred.

## License

MIT

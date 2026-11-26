// The shell: an app whose WebView shows this page (shell/, made with Capacitor), which brings what a browser does
// not have. Capacitor puts its bridge into the page before any of the page's own scripts run (window.Capacitor, with
// a proxy for every native module compiled into the app), so nothing here needs a library; in a browser none of it is
// there, and nothing here happens.
//
// What the shell brings reaches a page in two ways:
//   - by the web's own name, where the web has one that means the same, so that one line of a page works in a
//     browser and in the app:
//       navigator.vibrate()   missing in an iPhone's WebView: the shell's haptics stand in for it
//       CloseWatcher          Android's back button and back gesture: in an app the system gives them to the app,
//                             not to the page, so the shell passes them on and CloseWatcher is made of that
//   - window.Native, for what the web has no name for:
//       Native.platform                       'ios' | 'android'
//       Native.has(module)                    is this native module in the app ('Haptics', 'BluetoothLe', …)
//       Native.call(module, method, args)     a Promise of what it answers
//       Native.on(module, event, fn)          hear its events; returns a function that stops listening
//     Only what is compiled into the app can be called, by its name: the shell's README lists the modules.
//
// And one thing it does by itself: the system's bars over the page (the clock and the battery, Android's gesture
// bar) are drawn dark over a light page and light over a dark one.
const cap = typeof window !== 'undefined' ? window.Capacitor : null;

/** Inside the app's WebView. */
export const inShell = !!cap && typeof cap.nativePromise === 'function' && typeof cap.getPlatform === 'function' && cap.getPlatform() !== 'web';

if (inShell) {
  const has = (name) => !!cap.Plugins && Object.prototype.hasOwnProperty.call(cap.Plugins, name);
  window.Native = {
    platform: cap.getPlatform(),
    has,
    call: (name, method, args) => (has(name)
      ? cap.nativePromise(name, method, args || {})
      : Promise.reject(new Error(`The app has no native module "${name}"`))),
    on(name, event, fn) {
      const heard = cap.addListener(name, event, fn);
      return () => { heard.remove(); };
    },
  };

  // navigator.vibrate(ms | [ms, pause, ms, …]), where the WebView has none (an iPhone). A short one is the system's
  // own tap, lighter or heavier by its length; a longer one is a vibration of that length. 0, or an empty list,
  // stops what was still to come. A failure is said once (the page's trace keeps it) and never thrown.
  if (typeof navigator.vibrate !== 'function' && has('Haptics')) {
    let waiting = [], last = -Infinity, said = false;
    const failed = (error) => { if (!said) { said = true; console.warn('Haptics:', (error && error.message) || error); } };
    const play = (ms) => {
      if (!(ms > 0)) return;
      const tap = ms <= 60;
      if (tap && Date.now() - last < 35) return;         // two taps asked for at once are one
      if (tap) last = Date.now();
      const call = tap
        ? cap.nativePromise('Haptics', 'impact', { style: ms <= 15 ? 'LIGHT' : ms <= 30 ? 'MEDIUM' : 'HEAVY' })
        : cap.nativePromise('Haptics', 'vibrate', { duration: ms });
      Promise.resolve(call).catch(failed);
    };
    navigator.vibrate = (pattern) => {
      const list = (Array.isArray(pattern) ? pattern : [pattern]).map(Number);
      if (list.some((ms) => !Number.isFinite(ms) || ms < 0)) return false;
      waiting.forEach(clearTimeout);
      waiting = [];
      let at = 0;
      list.forEach((ms, i) => {
        if (i % 2 === 0) { if (at === 0) play(ms); else waiting.push(setTimeout(play, at, ms)); }
        at += ms;
      });
      return true;
    };
  }

  // CloseWatcher, on Android: "back" asks the newest watcher standing to close, as it does in a browser. With none
  // standing there is nothing to go back from, and back leaves the app (it goes to the background, as the system
  // does with any app's first screen). Escape (a keyboard) is a request to close as well.
  if (cap.getPlatform() === 'android' && has('App')) {
    const standing = [];
    window.CloseWatcher = class CloseWatcher extends EventTarget {
      constructor() { super(); standing.push(this); }
      destroy() { const i = standing.indexOf(this); if (i >= 0) standing.splice(i, 1); }
      close() {
        if (!standing.includes(this)) return;
        this.destroy();
        const e = new Event('close');
        this.dispatchEvent(e);
        if (typeof this.onclose === 'function') this.onclose(e);
      }
      requestClose() {
        if (!standing.includes(this)) return;
        const e = new Event('cancel', { cancelable: true });
        this.dispatchEvent(e);
        if (typeof this.oncancel === 'function') this.oncancel(e);
        if (!e.defaultPrevented) this.close();
      }
    };
    const newest = () => standing[standing.length - 1];
    cap.addListener('App', 'backButton', () => {
      if (newest()) newest().requestClose();
      else Promise.resolve(cap.nativePromise('App', 'minimizeApp', {})).catch(() => {});
    });
    // (on the window: after the page's own key handlers have had it, which is when a browser asks a watcher)
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !e.defaultPrevented && newest()) newest().requestClose(); });
  }

  // The system's bars follow the theme the page shows (<html data-theme>: the page's first script sets it before
  // anything is drawn; without it the page is as the system is, and so are the bars).
  if (has('SystemBars')) {
    const html = document.documentElement;
    let told = '';
    const bars = () => {
      const theme = html.getAttribute('data-theme');
      const style = theme === 'dark' ? 'DARK' : theme === 'light' ? 'LIGHT' : 'DEFAULT';
      if (style === told) return;
      told = style;
      Promise.resolve(cap.nativePromise('SystemBars', 'setStyle', { style })).catch(() => {});
    };
    bars();
    new MutationObserver(bars).observe(html, { attributes: true, attributeFilter: ['data-theme'] });
  }
}

/* core/platform/boot.js: runs in <head>, before the first paint (the build puts it inline; core/update/vite-plugin.mjs).
   It reads the device and says so in classes on <html>, so that styles and scripts never have to guess:

     device-ios / device-android / device-desktop
     device-standalone     opened from the home screen (an installed PWA)
     device-webview        inside an app's WebView (the shell, shell/, names itself "AppShell" in its user agent)
     device-full-viewport  iPhone / iPad home-screen app with the translucent status bar (as Framework7 detects it)
     device-short-vh       in that mode, 100vh comes out short of the screen (by the top safe area) and the page's
                           origin lies under the status bar's lower edge: the app container is then moved up by the
                           top safe area and made 100vh + top safe area tall, which is the whole screen (core.css)

   window.__fit holds what was measured; window.__setFit('auto' | 'on' | 'off') forces device-short-vh for testing. */
(function () {
  var html = document.documentElement, ua = navigator.userAgent;
  var ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  var standalone = function () { return navigator.standalone === true || !!(window.matchMedia && matchMedia('(display-mode: standalone)').matches); };
  var bar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  html.classList.add(ios ? 'device-ios' : /Android/.test(ua) ? 'device-android' : 'device-desktop');
  if (standalone()) html.classList.add('device-standalone');
  /* WKWebView names no "Safari/" in its user agent; the shell adds "AppShell" on every platform */
  if (/AppShell/.test(ua) || (ios && !/Safari\//.test(ua))) html.classList.add('device-webview');
  var full = ios && standalone() && bar && bar.content === 'black-translucent';
  if (full) html.classList.add('device-full-viewport');

  function fit() {
    var p = document.createElement('div');
    p.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;width:0;height:100vh;padding-top:env(safe-area-inset-top,0px)';
    html.appendChild(p);
    var cs = getComputedStyle(p), vh = parseFloat(cs.height) || 0, top = parseFloat(cs.paddingTop) || 0;
    html.removeChild(p);
    var screenH = window.innerWidth > window.innerHeight ? Math.min(screen.width, screen.height) : Math.max(screen.width, screen.height);
    var mode = 'auto';
    try { mode = localStorage.getItem('app:fit') || 'auto'; } catch (e) { /* storage blocked */ }
    var short = mode === 'on' || (mode === 'auto' && full && top > 0 && vh < screenH - 2);
    html.classList.toggle('device-short-vh', short);
    window.__fit = { mode: mode, short: short, vh: Math.round(vh), top: Math.round(top), screen: screenH, inner: window.innerHeight, full: !!full };
    return window.__fit;
  }
  window.__setFit = function (mode) { try { localStorage.setItem('app:fit', mode); } catch (e) { /* storage blocked */ } return fit(); };
  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', function () { setTimeout(fit, 300); });
  window.addEventListener('pageshow', fit);
  window.addEventListener('load', function () { fit(); setTimeout(fit, 500); });     /* env() can still be 0 this early */
})();

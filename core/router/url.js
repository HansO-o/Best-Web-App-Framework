// The address follows the screen, and the screen can be restored from it.
//
//   #/<tab>/<page>;<key>=<value>;…/<page>…        e.g.  #/library/collection;id=c1/artist;id=vl
//
// - In the fragment: the app is static files that can be served from any folder, loaded by a WebView from a string,
//   or started offline from a cache, and none of that knows about paths.
// - Written with history.replaceState, never pushed: the app adds no history entries. Going back is the app's own
//   gesture and button; one entry in the browser's history would bring in the browser's back swipe and buttons, to
//   fight with them. (For the same reason the app never navigates by location.href or location.assign.)
// - Parameters come back as strings.
// - A sheet is not part of the address.
const enc = encodeURIComponent, dec = decodeURIComponent;

/** { tab: key, pages: [{ name, params }] } → '#/…' */
export function format(route) {
  const seg = (p) => [p.name].concat(Object.keys(p.params || {}).map((k) => `${enc(k)}=${enc(String(p.params[k]))}`)).join(';');
  return '#/' + [route.tab].concat((route.pages || []).map(seg)).join('/');
}

/** '#/…' → { tab: key, pages: [{ name, params }] }, or null if there is no route in it. */
export function parse(hash) {
  const m = /^#?\/(.+)$/.exec(hash || '');
  if (!m) return null;
  try {
    const parts = m[1].split('/').filter(Boolean);
    const pages = parts.slice(1).map((s) => {
      const [name, ...kv] = s.split(';');
      const params = {};
      kv.forEach((x) => { const i = x.indexOf('='); if (i > 0) params[dec(x.slice(0, i))] = dec(x.slice(i + 1)); });
      return { name: dec(name), params };
    });
    return { tab: dec(parts[0]), pages };
  } catch (e) { return null; }
}

export const read = () => (typeof location === 'undefined' ? null : parse(location.hash));

// Written a moment later, and only the last one: a finger dragged along the tab row passes many tabs, and browsers
// limit how often the address may be replaced (Safari: 100 times in 30 seconds, then it throws).
let timer = 0, wanted = null;
export function write(route) {
  wanted = format(route);
  if (timer) return;
  timer = setTimeout(() => {
    timer = 0;
    if (wanted === location.hash || (wanted === '#/' && !location.hash)) return;
    try { history.replaceState(history.state, '', wanted); } catch (e) { /* a document that may not (a sandbox): the screen is right anyway */ }
  }, 160);
}


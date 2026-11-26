// Which ScrollGesture driver a new gesture gets. Nobody chooses: the device does ('auto': a computer with a mouse or
// a trackpad gets the script-driven driver, which a mouse can drag; a phone or a tablet gets native scrolling).
//
// For tests, and for comparing the two on one device, a value can be forced: ?driver=scroll|js in the address, or
// localStorage['app:driver']. It is not a setting for users.
export function getDriver() {
  try {
    const q = new URLSearchParams(location.search).get('driver') || localStorage.getItem('app:driver');
    if (q === 'js' || q === 'scroll') return q;
  } catch (e) { /* no storage */ }
  return 'auto';
}

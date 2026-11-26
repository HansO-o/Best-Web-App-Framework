// Line icons as data: [tag, attributes] on a 24 x 24 field, stroke 1.9, round caps and joins. `fill: true` means the
// shape is filled with the icon's colour. Icon.js draws them as inline SVG. Add an app's own icons to this table (or,
// in an app that is drawn from a state object, to the state's `icons`).
const HEART = 'M3.6 8.8A4.3 4.3 0 0 1 7.9 4.5C9.9 4.5 11 6 12 7.5C13 6 14.1 4.5 16.1 4.5A4.3 4.3 0 0 1 20.4 8.8C20.4 13.8 15.2 17.6 12.7 19.9Q12 20.5 11.3 19.9C8.8 17.6 3.6 13.8 3.6 8.8Z';
const SHEET = 'M7.5 3.5h6l4.5 4.5v11a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1.5-1.5z';
const FRAME = 'M5.5 5h13A1.5 1.5 0 0 1 20 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-11A1.5 1.5 0 0 1 5.5 5z';
export const ICONS = {
  back: [['path', { d: 'M15 5l-7 7 7 7' }]],
  go: [['path', { d: 'M9 5l7 7-7 7' }]],
  play: [['path', { d: 'M8 5.5v13l11-6.5z', fill: true }]],
  pause: [['path', { d: 'M8 5v14M16 5v14', strokeWidth: 3.2 }]],
  next: [['path', { d: 'M6 6v12l9-6z', fill: true }], ['path', { d: 'M18 6v12' }]],
  prev: [['path', { d: 'M18 6v12l-9-6z', fill: true }], ['path', { d: 'M6 6v12' }]],
  // The heart fills its field: at size 16 it is 12.7 wide, the size it has in a list row. Two round lobes, a V between
  // them (a mitred join, so the notch is a clean point), a tip that is only just rounded.
  heart: [['path', { d: HEART, strokeWidth: 2, strokeLinejoin: 'miter' }]],
  heartFill: [['path', { d: HEART, strokeWidth: 2, strokeLinejoin: 'miter', fill: true }]],
  down: [['path', { d: 'M12 4v11M7 11l5 5 5-5M5 20h14' }]],
  up: [['path', { d: 'M12 16V5M7 9.5L12 4.5l5 5M5 20h14' }]],
  plus: [['path', { d: 'M12 5v14M5 12h14' }]],
  compass: [['circle', { cx: 12, cy: 12, r: 8.5 }], ['path', { d: 'M15.2 8.8l-1.9 4.5-4.5 1.9 1.9-4.5z' }]],
  search: [['circle', { cx: 11, cy: 11, r: 6.5 }], ['path', { d: 'M16 16l4.5 4.5' }]],
  stack: [['path', { d: 'M5 6v12M9.5 6v12M14 6.5l4.5 11' }]],
  radio: [['circle', { cx: 12, cy: 12, r: 1.7, fill: true }], ['path', { d: 'M8.4 8.4a5.1 5.1 0 0 0 0 7.2M15.6 8.4a5.1 5.1 0 0 1 0 7.2M5.5 5.5a9.2 9.2 0 0 0 0 13M18.5 5.5a9.2 9.2 0 0 1 0 13' }]],
  user: [['circle', { cx: 12, cy: 8.5, r: 3.7 }], ['path', { d: 'M4.8 20c1-3.7 4-5.5 7.2-5.5s6.2 1.8 7.2 5.5' }]],
  moon: [['path', { d: 'M19.5 14.2A7.6 7.6 0 0 1 9.8 4.5a7.6 7.6 0 1 0 9.7 9.7z' }]],
  sun: [['circle', { cx: 12, cy: 12, r: 3.8 }], ['path', { d: 'M12 2.8v2.1M12 19.1v2.1M2.8 12h2.1M19.1 12h2.1M5.5 5.5L7 7M17 17l1.5 1.5M5.5 18.5L7 17M17 7l1.5-1.5' }]],
  // files and what is done with them
  folder: [['path', { d: 'M3.5 7.5a2 2 0 0 1 2-2h3.7l2.3 2.5h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z' }]],
  file: [['path', { d: SHEET }], ['path', { d: 'M13.5 3.5V8H18' }]],
  text: [['path', { d: SHEET }], ['path', { d: 'M13.5 3.5V8H18M9 12.5h6M9 16h6' }]],
  image: [['path', { d: FRAME }], ['circle', { cx: 9, cy: 9.6, r: 1.4 }], ['path', { d: 'M4.6 16.6l4.2-4.1 3.4 3.3 2.6-2.5 4.6 4.5' }]],
  video: [['path', { d: FRAME }], ['path', { d: 'M10.3 9.3v5.4l4.4-2.7z', fill: true }]],
  music: [['path', { d: 'M9.5 17.3V6.4l8.5-2v10.9' }], ['circle', { cx: 7.3, cy: 17.3, r: 2.2 }], ['circle', { cx: 15.8, cy: 15.3, r: 2.2 }]],
  link: [['path', { d: 'M10.3 13.7a3.9 3.9 0 0 0 5.5 0l2.9-2.9a3.9 3.9 0 0 0-5.5-5.5l-1.2 1.2' }], ['path', { d: 'M13.7 10.3a3.9 3.9 0 0 0-5.5 0l-2.9 2.9a3.9 3.9 0 0 0 5.5 5.5l1.2-1.2' }]],
  trash: [['path', { d: 'M5 7h14M10 7V4.5h4V7M7 7l.8 11.6a1.6 1.6 0 0 0 1.6 1.4h5.2a1.6 1.6 0 0 0 1.6-1.4L17 7' }]],
  edit: [['path', { d: 'M4.5 19.5l1-4.2L15.9 4.9a2.3 2.3 0 0 1 3.2 3.2L8.7 18.5z' }], ['path', { d: 'M14 6.8l3.2 3.2' }]],
  more: [['circle', { cx: 6, cy: 12, r: 1.3, fill: true }], ['circle', { cx: 12, cy: 12, r: 1.3, fill: true }], ['circle', { cx: 18, cy: 12, r: 1.3, fill: true }]],
  close: [['path', { d: 'M6 6l12 12M18 6L6 18' }]],
  check: [['path', { d: 'M5 12.5l4.6 4.5L19 7.5' }]],
  clock: [['circle', { cx: 12, cy: 12, r: 8.5 }], ['path', { d: 'M12 7.5V12l3 2' }]],
  refresh: [['path', { d: 'M19.2 12a7.2 7.2 0 1 1-2.3-5.3M19.2 4.3v3.9h-3.9' }]],
  key: [['circle', { cx: 8.2, cy: 15.8, r: 3.7 }], ['path', { d: 'M10.9 13.1L19.5 4.5M15.7 8.3l2.6 2.6' }]],
  // send, stop, speak
  send: [['path', { d: 'M12 19V5.5M6 11l6-6 6 6' }]],
  stop: [['path', { d: 'M8 8h8v8H8z', fill: true }]],
  mic: [['path', { d: 'M12 3.5a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0v-5a3 3 0 0 1 3-3z' }], ['path', { d: 'M6 11.5a6 6 0 0 0 12 0M12 17.5V21' }]],
};

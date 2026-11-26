// The demo's build. @core and @style are the two folders at the top; core/platform/boot.js goes inline in <head>,
// so the device classes are on <html> before the first paint.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';

const at = (p) => fileURLToPath(new URL(p, import.meta.url));

const boot = {
  name: 'core-boot',
  transformIndexHtml: () => [{ tag: 'script', children: fs.readFileSync(at('./core/platform/boot.js'), 'utf8'), injectTo: 'head-prepend' }],
};

export default {
  root: at('./demo'),
  base: './',                       // static files: served from any folder
  plugins: [vue(), boot],
  resolve: { alias: { '@core': at('./core/index.js'), '@style': at('./style/index.js') } },
  build: { outDir: at('./dist'), emptyOutDir: true },
};

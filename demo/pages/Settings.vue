<script setup>
import { ref } from 'vue';
import { Tap } from '@core';
import { Segmented, setTheme, BACK_STYLES, getBackStyle, setBackStyle } from '@style';

const MODES = ['light', 'dark', 'auto'];
const kept = (() => { try { return localStorage.getItem('demo:theme') || 'auto'; } catch (e) { return 'auto'; } })();
const theme = ref(Math.max(0, MODES.indexOf(kept)));
function pickTheme(i) {
  theme.value = i;
  const mode = MODES[i];
  try { localStorage.setItem('demo:theme', mode); } catch (e) { /* storage blocked */ }
  setTheme(mode, document.getElementById('theme-pick'));
}
const back = ref(Math.max(0, BACK_STYLES.findIndex((s) => s.key === getBackStyle())));
function pickBack(i) { back.value = i; setBackStyle(BACK_STYLES[i].key); }
const open = () => window.open('https://github.com/HansO-o/Best-Web-App-Framework', '_blank', 'noopener');
</script>

<template>
  <div class="head">
    <div class="eyebrow">Settings</div>
    <div class="title">Settings</div>
  </div>
  <div class="sec">
    <div class="sec-title">Theme</div>
    <Segmented id="theme-pick" :items="['Light', 'Dark', 'System']" :index="theme" label="Theme" @change="pickTheme" />
    <div class="fine">Light is lit paper, dark is pure black. The new theme spreads from where you pressed.</div>
  </div>
  <div class="sec">
    <div class="sec-title">Back button</div>
    <Segmented :items="BACK_STYLES.map((s) => s.title)" :index="back" label="Back button" @change="pickBack" />
  </div>
  <div class="sec">
    <div class="sec-title">About</div>
    <div class="list">
      <Tap class="line" @tap="open">
        <div class="grow"><div class="line-title">GitHub</div><div class="set-note">HansO-o/Best-Web-App-Framework · MIT</div></div>
      </Tap>
      <div class="line"><div class="grow"><div class="line-title">Add to Home Screen</div><div class="set-note">In Safari: Share → Add to Home Screen. Full screen with a clear status bar, like a native app</div></div></div>
    </div>
  </div>
</template>

<script setup>
import { Tap, useNav, ScrollGesture, blurMode, android, appleTouch, tapSwitch, canVibrate, inShell } from '@core';

const nav = useNav();
const device = inShell ? 'App shell' : appleTouch ? 'iPhone / iPad' : android ? 'Android' : 'Computer';
const haptic = canVibrate ? 'navigator.vibrate' : tapSwitch ? 'Native switch (iOS 18+)' : 'None';
const ways = [
  ['Phone, tablet', 'Swipe right anywhere on the page; the page behind follows your finger'],
  ['Mouse', 'Drag the page right; past halfway or flicked fast enough, it goes back'],
  ['Trackpad', 'Two-finger swipe: native scrolling, with the system\'s own momentum and snapping'],
  ['Keyboard', 'Esc, ←, Alt + ←; on a tab\'s first page ← → switch tabs'],
  ['Android', 'The system back button and back gesture, one step at a time'],
  ['Everywhere', 'The back button at the top left'],
];
</script>

<template>
  <div class="head">
    <div class="eyebrow">Gestures</div>
    <div class="title">Ways to go back</div>
  </div>
  <div class="list">
    <div v-for="w in ways" :key="w[0]" class="line">
      <div class="grow"><div class="line-title">{{ w[0] }}</div><div class="set-note">{{ w[1] }}</div></div>
    </div>
  </div>
  <div class="row wrap">
    <Tap class="btn ink" @tap="nav.push('detail', { n: 1 })">Push a page</Tap>
    <Tap class="btn line" @tap="nav.openSheet('panel')">Open the sheet</Tap>
  </div>
  <div class="sec">
    <div class="sec-title">This device</div>
    <div class="list">
      <div class="line set"><div class="set-title">Device</div><div class="line-note">{{ device }}</div></div>
      <div class="line set"><div class="set-title">Gesture driver</div><div class="line-note">{{ ScrollGesture.autoDriver() }} (native scrolling)</div></div>
      <div class="line set"><div class="set-title">Blur behind</div><div class="line-note">{{ blurMode(true) }}</div></div>
      <div class="line set"><div class="set-title">Haptics</div><div class="line-note">{{ haptic }}</div></div>
    </div>
  </div>
</template>

<script setup>
import { Tap, useNav, ScrollGesture, blurMode, android, appleTouch, tapSwitch, canVibrate, inShell } from '@core';

const nav = useNav();
const device = inShell ? 'App 外壳' : appleTouch ? 'iPhone / iPad' : android ? 'Android' : '电脑';
const haptic = canVibrate ? 'navigator.vibrate' : tapSwitch ? '原生开关（iOS 18+）' : '无';
const ways = [
  ['手机、平板', '页面任意位置向右滑，后面那页跟手回来'],
  ['鼠标', '按住页面往右拖，过半或甩得够快就返回'],
  ['触控板', '双指横滑：系统原生滚动，惯性和吸附都是系统的'],
  ['键盘', 'Esc、←、Alt + ←；根页面上 ← → 切页签'],
  ['Android', '系统返回键和返回手势，一次退一步'],
  ['所有设备', '左上角的返回键'],
];
</script>

<template>
  <div class="head">
    <div class="eyebrow">Gestures</div>
    <div class="title">返回的方式</div>
  </div>
  <div class="list">
    <div v-for="w in ways" :key="w[0]" class="line">
      <div class="grow"><div class="line-title">{{ w[0] }}</div><div class="set-note">{{ w[1] }}</div></div>
    </div>
  </div>
  <div class="row wrap">
    <Tap class="btn ink" @tap="nav.push('detail', { n: 1 })">推入一页试试</Tap>
    <Tap class="btn line" @tap="nav.openSheet('panel')">打开面板</Tap>
  </div>
  <div class="sec">
    <div class="sec-title">这台设备</div>
    <div class="list">
      <div class="line set"><div class="set-title">设备</div><div class="line-note">{{ device }}</div></div>
      <div class="line set"><div class="set-title">手势驱动</div><div class="line-note">{{ ScrollGesture.autoDriver() }}（原生滚动）</div></div>
      <div class="line set"><div class="set-title">后页模糊</div><div class="line-note">{{ blurMode(true) }}</div></div>
      <div class="line set"><div class="set-title">触感</div><div class="line-note">{{ haptic }}</div></div>
    </div>
  </div>
</template>

<script setup>
import { Tap, useNav } from '@core';

defineProps({ n: { type: Number, default: 1 } });
const nav = useNav();
</script>

<template>
  <div class="head">
    <div class="eyebrow">Level {{ n }}</div>
    <div class="title">A pushed page</div>
  </div>
  <div class="lede">Swipe right anywhere on this page: the page behind follows your finger, and letting go decides. On a computer, drag with the mouse, swipe two fingers on the trackpad, or press Esc or ←.</div>
  <div class="row wrap">
    <Tap class="btn ink" @tap="nav.push('detail', { n: n + 1 })">Push another</Tap>
    <Tap v-if="n > 1" class="btn line" @tap="nav.popToRoot()">Back to Home</Tap>
  </div>
  <div class="sec">
    <div class="sec-title">Address</div>
    <div class="fine">The part after # says where you are, and a reload comes back here. It is only ever replaced, never pushed, so the browser's own back gesture never fights the app's.</div>
  </div>
  <div class="list">
    <div v-for="i in 14" :key="i" class="line">
      <div class="grow"><div class="line-title">Level {{ n }} · Row {{ i }}</div><div class="set-note">Scrolling and swiping back never get in each other's way</div></div>
    </div>
  </div>
</template>

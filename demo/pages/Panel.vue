<script setup>
import { Tap, router } from '@core';
</script>

<template>
  <div class="head">
    <div class="eyebrow">Sheet</div>
    <div class="title">A full-screen sheet</div>
  </div>
  <div class="lede">It rises from below while the pages under it drop back out of focus. Pull it down with a finger, drag it down with the mouse, tap the handle at the top or press Esc to put it away.</div>
  <div class="row wrap">
    <Tap class="btn ink" @tap="router.push('detail', { n: 1 })">Push a page from here</Tap>
    <Tap class="btn line" @tap="router.closeSheet()">Close</Tap>
  </div>
  <div class="fine">A page pushed from a sheet waits for the sheet to go, then comes in.</div>
  <div class="list">
    <div v-for="i in 12" :key="i" class="line"><div class="line-title">Sheet row {{ i }}</div></div>
  </div>
</template>

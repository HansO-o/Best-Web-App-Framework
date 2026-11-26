<script setup>
import { Tap, useNav } from '@core';
import { Icon } from '@style';

const nav = useNav();
</script>

<template>
  <div class="head">
    <div class="eyebrow">Best Web App Framework</div>
    <div class="title">A web app that feels native</div>
  </div>
  <div class="lede">Page turns, swipe back, sheets and tabs are all the browser's own snap scrolling: tracking, momentum and bounce run on the compositor thread, so a busy main thread never drops a frame. On iPhone, pages turn at 120fps with ProMotion.</div>
  <div class="stats">
    <div class="stat"><div class="stat-v">120</div><div class="stat-l">fps page turns</div></div>
    <div class="stat"><div class="stat-v">CSS</div><div class="stat-l">native scrolling</div></div>
    <div class="stat"><div class="stat-v">0</div><div class="stat-l">history entries</div></div>
  </div>
  <div class="sec">
    <div class="sec-title">Try it</div>
    <div class="list">
      <Tap class="line" @tap="nav.push('detail', { n: 1 })">
        <div class="grow"><div class="line-title">Push a page</div><div class="set-note">Swipe right anywhere on it to go back</div></div>
        <Icon name="go" :size="18" />
      </Tap>
      <Tap class="line" @tap="nav.openSheet('panel')">
        <div class="grow"><div class="line-title">Open a sheet</div><div class="set-note">Pull down, tap the handle or press Esc to close</div></div>
        <Icon name="up" :size="18" />
      </Tap>
      <Tap class="line" @tap="nav.push('detail', { n: 3 })">
        <div class="grow"><div class="line-title">Jump three pages deep</div><div class="set-note">Hold the tab bar and slide: the dot follows your finger</div></div>
        <Icon name="go" :size="18" />
      </Tap>
    </div>
  </div>
  <div class="sec">
    <div class="sec-title">Why it is fast</div>
    <div class="list">
      <div class="line"><div class="grow"><div class="line-title">Snap scrolling is the gesture</div><div class="set-note">Each page is a scroll-snap container: your finger drags the system's own scroll</div></div></div>
      <div class="line"><div class="grow"><div class="line-title">Scroll timelines drive the motion</div><div class="set-note">The page behind shrinks, blurs and fades on animation-timeline</div></div></div>
      <div class="line"><div class="grow"><div class="line-title">Only transform and opacity</div><div class="set-note">Nothing under your finger ever triggers layout or paint</div></div></div>
      <div class="line"><div class="grow"><div class="line-title">Nothing changes as a transition ends</div><div class="set-note">A page that left is removed only once touches and scrolling are quiet</div></div></div>
    </div>
  </div>
</template>

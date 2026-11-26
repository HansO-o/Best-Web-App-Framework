<script setup>
import { Tap, useNav } from '@core';
import { Icon } from '@style';

const nav = useNav();
</script>

<template>
  <div class="head">
    <div class="eyebrow">Best Web App Framework</div>
    <div class="title">像原生 App 的网页</div>
  </div>
  <div class="lede">翻页、返回、面板、页签，全是浏览器原生的吸附滚动：跟手、惯性、回弹都在合成线程上算，主线程再忙也不掉帧。iPhone 上随 ProMotion 跑到 120fps。</div>
  <div class="stats">
    <div class="stat"><div class="stat-v">120</div><div class="stat-l">fps 翻页</div></div>
    <div class="stat"><div class="stat-v">CSS</div><div class="stat-l">原生滚动驱动</div></div>
    <div class="stat"><div class="stat-v">0</div><div class="stat-l">浏览器历史</div></div>
  </div>
  <div class="sec">
    <div class="sec-title">试一试</div>
    <div class="list">
      <Tap class="line" @tap="nav.push('detail', { n: 1 })">
        <div class="grow"><div class="line-title">推入一页</div><div class="set-note">在页面任意位置向右滑返回</div></div>
        <Icon name="go" :size="18" />
      </Tap>
      <Tap class="line" @tap="nav.openSheet('panel')">
        <div class="grow"><div class="line-title">打开全屏面板</div><div class="set-note">下拉、点把手或按 Esc 收起</div></div>
        <Icon name="up" :size="18" />
      </Tap>
      <Tap class="line" @tap="nav.push('detail', { n: 3 })">
        <div class="grow"><div class="line-title">直接到第三层</div><div class="set-note">页签栏按住横滑，圆点跟着手指走</div></div>
        <Icon name="go" :size="18" />
      </Tap>
    </div>
  </div>
  <div class="sec">
    <div class="sec-title">为什么快</div>
    <div class="list">
      <div class="line"><div class="grow"><div class="line-title">CSS 吸附滚动当手势</div><div class="set-note">页面是一个 scroll-snap 容器，手指拖的是系统的滚动</div></div></div>
      <div class="line"><div class="grow"><div class="line-title">滚动时间线驱动动画</div><div class="set-note">后面那页的缩小、模糊、淡出跟 animation-timeline 走</div></div></div>
      <div class="line"><div class="grow"><div class="line-title">只动 transform 和 opacity</div><div class="set-note">跟手的东西永远不触发布局和重绘</div></div></div>
      <div class="line"><div class="grow"><div class="line-title">过渡结束那一刻什么都不改</div><div class="set-note">离开的页面等手指和滚动都安静了才移除</div></div></div>
    </div>
  </div>
</template>

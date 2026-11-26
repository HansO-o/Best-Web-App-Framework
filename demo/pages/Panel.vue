<script setup>
import { Tap, router } from '@core';
</script>

<template>
  <div class="head">
    <div class="eyebrow">Sheet</div>
    <div class="title">全屏面板</div>
  </div>
  <div class="lede">从下面升起，下面的页面退到后面、变虚。手指下拉、鼠标按住往下拖、点顶上的把手、按 Esc，都能收起。</div>
  <div class="row wrap">
    <Tap class="btn ink" @tap="router.push('detail', { n: 1 })">从面板推入一页</Tap>
    <Tap class="btn line" @tap="router.closeSheet()">收起</Tap>
  </div>
  <div class="fine">「从面板推入一页」：面板先收起，页面再进来。</div>
  <div class="list">
    <div v-for="i in 12" :key="i" class="line"><div class="line-title">面板内容 {{ i }}</div></div>
  </div>
</template>

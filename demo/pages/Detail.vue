<script setup>
import { Tap, useNav } from '@core';

defineProps({ n: { type: Number, default: 1 } });
const nav = useNav();
</script>

<template>
  <div class="head">
    <div class="eyebrow">第 {{ n }} 层</div>
    <div class="title">推入的页面</div>
  </div>
  <div class="lede">在这一页任意位置向右滑：后面那页跟着手指回来，松手决定去留。电脑上按住拖动、触控板双指横滑、Esc、← 都能返回。</div>
  <div class="row wrap">
    <Tap class="btn ink" @tap="nav.push('detail', { n: n + 1 })">再推一页</Tap>
    <Tap v-if="n > 1" class="btn line" @tap="nav.popToRoot()">回到首页</Tap>
  </div>
  <div class="sec">
    <div class="sec-title">地址</div>
    <div class="fine">地址栏的 # 后面记着现在在哪，刷新会回到这里。只替换，从不新增历史，所以浏览器自己的返回手势不会和应用打架。</div>
  </div>
  <div class="list">
    <div v-for="i in 14" :key="i" class="line">
      <div class="grow"><div class="line-title">第 {{ n }} 层 · 第 {{ i }} 行</div><div class="set-note">滚动和返回手势互不干扰</div></div>
    </div>
  </div>
</template>

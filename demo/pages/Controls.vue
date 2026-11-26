<script setup>
import { ref } from 'vue';
import { Tap, canVibrate, tapSwitch } from '@core';
import { Segmented, toast } from '@style';

const a = ref(0), b = ref(1), c = ref(0);
const picked = ref(['Vue']);
const toggle = (x) => { picked.value = picked.value.includes(x) ? picked.value.filter((y) => y !== x) : [...picked.value, x]; };
const patterns = [['轻', 10], ['中', 25], ['重', 50], ['节奏', [30, 70, 30, 70, 60]]];
const vibrate = (p) => navigator.vibrate(p);
</script>

<template>
  <div class="head">
    <div class="eyebrow">Controls</div>
    <div class="title">控件和触感</div>
  </div>
  <div class="lede">分段切换和底部页签栏是同一个组件：弹簧驱动的圆点，按住会压扁，拖动会拉长，划过的每一项都震一下。</div>
  <div class="sec">
    <div class="sec-title">分段切换</div>
    <Segmented :items="['日', '周', '月', '年']" :index="a" label="范围" @change="(i) => (a = i)" />
    <Segmented :items="['WAV', 'MP3']" :index="b" label="格式" @change="(i) => (b = i)" />
    <Segmented :items="['列表', '网格', '画廊']" :index="c" :height="40" label="视图" @change="(i) => (c = i)" />
  </div>
  <div class="sec">
    <div class="sec-title">按钮</div>
    <div class="row wrap">
      <Tap class="btn ink" @tap="toast('按下去，弹回来')">主要按钮</Tap>
      <Tap class="btn line" @tap="toast('每个可点的东西都是 Tap')">次要按钮</Tap>
    </div>
    <div class="chips">
      <Tap v-for="x in ['Vue', 'CSS', 'Scroll', 'Snap', '120fps']" :key="x" inline class="chip" :class="{ on: picked.includes(x) }" @tap="toggle(x)">{{ x }}</Tap>
    </div>
  </div>
  <div class="sec">
    <div class="sec-title">触感</div>
    <div class="fine" v-if="tapSwitch">iPhone 网页：每个按钮里藏着一个原生开关，手指按到它，系统就震一下。这是网页在 iPhone 上唯一能拿到的触感。</div>
    <div class="fine" v-else-if="canVibrate">这台设备有 navigator.vibrate：每次点按 10ms，也可以放一段节奏。</div>
    <div class="fine" v-else>这台设备没有触感（电脑）。在 iPhone 或 Android 上打开试试。</div>
    <div v-if="canVibrate" class="row wrap">
      <Tap v-for="p in patterns" :key="p[0]" class="btn line sm" :haptic="false" @tap="vibrate(p[1])">{{ p[0] }}</Tap>
    </div>
  </div>
</template>

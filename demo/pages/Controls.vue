<script setup>
import { ref } from 'vue';
import { Tap, canVibrate, tapSwitch } from '@core';
import { Segmented, toast } from '@style';

const a = ref(0), b = ref(1), c = ref(0);
const picked = ref(['Vue']);
const toggle = (x) => { picked.value = picked.value.includes(x) ? picked.value.filter((y) => y !== x) : [...picked.value, x]; };
const patterns = [['Light', 10], ['Medium', 25], ['Heavy', 50], ['Rhythm', [30, 70, 30, 70, 60]]];
const vibrate = (p) => navigator.vibrate(p);
</script>

<template>
  <div class="head">
    <div class="eyebrow">Controls</div>
    <div class="title">Controls and haptics</div>
  </div>
  <div class="lede">The segmented control and the tab bar are one component: a dot on a spring that squashes when held, stretches when dragged, and ticks on every item it passes.</div>
  <div class="sec">
    <div class="sec-title">Segmented</div>
    <Segmented :items="['Day', 'Week', 'Month', 'Year']" :index="a" label="Range" @change="(i) => (a = i)" />
    <Segmented :items="['WAV', 'MP3']" :index="b" label="Format" @change="(i) => (b = i)" />
    <Segmented :items="['List', 'Grid', 'Gallery']" :index="c" :height="40" label="View" @change="(i) => (c = i)" />
  </div>
  <div class="sec">
    <div class="sec-title">Buttons</div>
    <div class="row wrap">
      <Tap class="btn ink" @tap="toast('Down, and back up on a spring')">Primary</Tap>
      <Tap class="btn line" @tap="toast('Everything you can tap is a Tap')">Secondary</Tap>
    </div>
    <div class="chips">
      <Tap v-for="x in ['Vue', 'CSS', 'Scroll', 'Snap', '120fps']" :key="x" inline class="chip" :class="{ on: picked.includes(x) }" @tap="toggle(x)">{{ x }}</Tap>
    </div>
  </div>
  <div class="sec">
    <div class="sec-title">Haptics</div>
    <div class="fine" v-if="tapSwitch">iPhone web: every button hides a native switch, and a finger landing on it makes the system tick. It is the only haptic a web page can get on iPhone.</div>
    <div class="fine" v-else-if="canVibrate">This device has navigator.vibrate: 10ms on every tap, or a rhythm of your own.</div>
    <div class="fine" v-else>This device has no haptics. Open it on an iPhone or an Android phone.</div>
    <div v-if="canVibrate" class="row wrap">
      <Tap v-for="p in patterns" :key="p[0]" class="btn line sm" :haptic="false" @tap="vibrate(p[1])">{{ p[0] }}</Tap>
    </div>
  </div>
</template>

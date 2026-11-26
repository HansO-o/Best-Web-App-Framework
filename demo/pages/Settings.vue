<script setup>
import { ref } from 'vue';
import { Tap } from '@core';
import { Segmented, setTheme, BACK_STYLES, getBackStyle, setBackStyle } from '@style';

const MODES = ['light', 'dark', 'auto'];
const kept = (() => { try { return localStorage.getItem('demo:theme') || 'auto'; } catch (e) { return 'auto'; } })();
const theme = ref(Math.max(0, MODES.indexOf(kept)));
function pickTheme(i) {
  theme.value = i;
  const mode = MODES[i];
  try { localStorage.setItem('demo:theme', mode); } catch (e) { /* storage blocked */ }
  setTheme(mode, document.getElementById('theme-pick'));
}
const back = ref(Math.max(0, BACK_STYLES.findIndex((s) => s.key === getBackStyle())));
function pickBack(i) { back.value = i; setBackStyle(BACK_STYLES[i].key); }
const open = () => window.open('https://github.com/HansO-o/Best-Web-App-Framework', '_blank', 'noopener');
</script>

<template>
  <div class="head">
    <div class="eyebrow">Settings</div>
    <div class="title">设置</div>
  </div>
  <div class="sec">
    <div class="sec-title">主题</div>
    <Segmented id="theme-pick" :items="['浅色', '深色', '跟随系统']" :index="theme" label="主题" @change="pickTheme" />
    <div class="fine">浅色是一张有光的纸，深色是纯黑。新主题从按下的地方扩散开。</div>
  </div>
  <div class="sec">
    <div class="sec-title">返回键</div>
    <Segmented :items="BACK_STYLES.map((s) => s.title)" :index="back" label="返回键" @change="pickBack" />
  </div>
  <div class="sec">
    <div class="sec-title">关于</div>
    <div class="list">
      <Tap class="line" @tap="open">
        <div class="grow"><div class="line-title">GitHub</div><div class="set-note">HansO-o/Best-Web-App-Framework · MIT</div></div>
      </Tap>
      <div class="line"><div class="grow"><div class="line-title">加到主屏幕</div><div class="set-note">Safari 分享 → 添加到主屏幕：全屏、透明状态栏，和原生 App 一样</div></div></div>
    </div>
  </div>
</template>

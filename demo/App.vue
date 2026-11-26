<script setup>
import { Router, Tap, router } from '@core';
import { look, TabBar, Toast } from '@style';
import Home from './pages/Home.vue';
import Gestures from './pages/Gestures.vue';
import Controls from './pages/Controls.vue';
import Settings from './pages/Settings.vue';
import Detail from './pages/Detail.vue';
import Panel from './pages/Panel.vue';

const tabs = [
  { key: 'home', label: '首页', icon: 'compass' },
  { key: 'gestures', label: '手势', icon: 'stack' },
  { key: 'controls', label: '控件', icon: 'radio' },
  { key: 'settings', label: '设置', icon: 'user' },
];
const roots = { home: Home, gestures: Gestures, controls: Controls, settings: Settings };
const sheets = { panel: { label: '面板', closeLabel: '收起' } };
// the ring stands in the row's last place: the style spaces the places by how many tabs there are
document.documentElement.style.setProperty('--tabs-n', String(tabs.length));

const ring = () => (router.sheet ? router.closeSheet() : router.openSheet('panel'));
</script>

<template>
  <Router :look="look" :tabs="tabs" :sheets="sheets">
    <template #root="{ tab }"><component :is="roots[tab.key]" /></template>
    <template #page="{ name, params }"><Detail v-if="name === 'detail'" :n="Number(params.n) || 1" /></template>
    <template #sheet><Panel /></template>
    <template #chrome="{ tabs: row, index, onChange, onReselect }">
      <TabBar :tabs="row" :index="index" @change="onChange" @reselect="onReselect">
        <!-- the row's last place is kept free: the ring stands there, and is not one of the row's items -->
        <template #after><span class="tab-gap" aria-hidden="true" /></template>
      </TabBar>
    </template>
    <!-- not in the chrome: a page or the sheet that covers the tab row leaves it in reach -->
    <div class="dock"><Tap class="dock-ring" label="面板" @tap="ring"><i /></Tap></div>
    <Toast />
  </Router>
</template>

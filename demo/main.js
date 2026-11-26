import { createApp } from 'vue';
import { installGuards } from '@core';     // gestures and routing (and the structure's stylesheet, first)
import '@style';                           // the look, on top
import App from './App.vue';

installGuards();
createApp(App).mount('#app');

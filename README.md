# Best Web App Framework

**像原生 App 一样的 Web App。** 页面切换、滑动返回、全屏面板、底部页签栏、触感，全部基于浏览器原生的 CSS 吸附滚动：跟手、惯性、回弹由系统在合成线程上完成，不靠 JS 逐帧算位置。iPhone 上翻页随 ProMotion 跑到 120fps，主线程再忙也不掉帧。

演示：<https://hanso-o.github.io/Best-Web-App-Framework/>（用手机打开，或在 Safari 里「添加到主屏幕」）

它是 [earth.icu](https://earth.icu) 框架里「手势 + 路由 + 页签栏」这一部分，单独拿出来：没有状态对象、没有后端、没有 AI，就是一个普通的 Vue 3 应用能直接用的导航层和一套样式。

## 为什么快

| 做法 | 结果 |
|---|---|
| 每个推入的页面是一个 `scroll-snap` 横向滚动容器，返回手势就是系统的滚动 | 跟手、惯性、吸附都是系统的，和原生 App 一样的手感 |
| 后面那页的缩小、模糊、淡出挂在 `animation-timeline: scroll()` 上 | 动画跟着滚动位置在合成线程上走，不经过 JS |
| 跟着手指动的东西只动 `transform` 和 `opacity` | 不触发布局和重绘 |
| 模糊在 Chromium 里用一层固定半径的 `backdrop-filter` 调透明度 | 不让 `blur()` 关键帧把动画拉回主线程 |
| 过渡结束的那一刻什么都不改，离开的页面等安静 350ms 再移除 | 手指接着滚新页面时不会被打断 |
| `document` 上没有能 `preventDefault` 的 `touchmove` | 任何滚动开始前都不用等主线程 |

鼠标拖动是唯一由脚本处理的情况（浏览器不让鼠标拖滚动容器）：拖动时用 `transform` 移页面，松手交回滚动容器。

## 有什么

- **路由**：每个页签一个页面栈，页签之间互不影响。路由是一个响应式对象 `{ tab, pages, sheet }`，导航就是改它。
- **返回**：手机在页面任意位置右滑；电脑按住拖、触控板双指横滑；Esc、←、Alt+←；Android 系统返回键（`CloseWatcher`）；每页左上角的返回键。
- **全屏面板**：从下升起，下面的页面退后变虚；下拉、点把手、Esc 收起。
- **页签栏**：一颗弹簧驱动的圆点，按住压扁、拖动拉长，按住横滑一路切过去；胶囊只有模糊。两端按 Apple 的方式和圆角同心排布，最后一格留给一个圆环（演示里打开面板）。
- **分段切换**：和页签栏是同一个组件（`Segmented`），两种外观。
- **触感**：iPhone 网页每个按钮里藏一个原生开关（`<input type="checkbox" switch>`），手指按到它系统就震，这是网页在 iPhone 上唯一能拿到的触感；分段切换和页签栏划过的每一项都震。Android 走 `navigator.vibrate`。
- **不新增浏览器历史**：地址只用 `replaceState` 记在 `#` 后面，刷新能回到原处，浏览器自己的返回手势不会和应用打架。
- **像 App 一样的页面**：不能缩放、界面文字不能选中、长按没有菜单、状态栏透明、内容按安全区留白。
- **主题**：浅色是一张有光的纸，深色是纯黑；切换时新主题从按下的地方扩散。

## 目录

```
core/     手势 + 路由 + 按钮（Tap）+ 设备识别。不含任何颜色、尺寸、字体
style/    lit-paper-glass 样式：页面切换的长相（look.js）、页签栏和分段切换、图标、主题、Toast
demo/     演示 App
```

`core/` 不引用 `style/`；`style/` 的行为全部从 `@core` 拿。换一套长相完全不同的样式，`core/` 不用改。

## 用法

```bash
npm install
npm run dev       # 开发
npm run build     # 打包到 dist/，纯静态文件，放哪都能跑
```

```vue
<script setup>
import { Router, Tap, useNav, router } from '@core';
import { look, TabBar, Toast } from '@style';

const tabs = [{ key: 'home', label: '首页', icon: 'compass' }, { key: 'me', label: '我的', icon: 'user' }];
const sheets = { player: { label: '播放器' } };
</script>

<template>
  <Router :look="look" :tabs="tabs" :sheets="sheets">
    <template #root="{ tab }"><Home v-if="tab.key === 'home'" /><Me v-else /></template>
    <template #page="{ name, params }"><Detail v-if="name === 'detail'" v-bind="params" /></template>
    <template #sheet="{ name, params }"><Player v-bind="params" /></template>
    <template #chrome="{ tabs, index, onChange, onReselect }">
      <TabBar :tabs="tabs" :index="index" @change="onChange" @reselect="onReselect" />
    </template>
    <Toast />
  </Router>
</template>
```

```js
const nav = useNav();              // 页面里
nav.push('detail', { id: 1 });     // 推入一页
nav.pop();  nav.popToRoot();
router.openSheet('player');        // 任何地方
router.setTab('me');
```

按钮一律用 `<Tap @tap="…">`：它是一个 `<label>`，在 iPhone 上里面带着那个原生开关，所以每次点按都有触感，键盘也能按。

`main.js` 里调用一次 `installGuards()`（禁止缩放、选中文字、长按菜单）；`core/platform/boot.js` 要内联进 `<head>`，在第一帧之前给 `<html>` 打上设备的类（`vite.config.js` 里已经做了）。`index.html` 的 `viewport` 和 `apple-mobile-web-app-*` 照 `demo/index.html` 写。

## 几条硬规矩

1. 不新增浏览器历史：不 `pushState`、不 `location.href = …`、不用会被跟随的 `<a href>`。
2. 跟着手指动的东西只动 `transform` 和 `opacity`。
3. 毛玻璃的祖先上不能有透明度、滤镜和它们的动画；带玻璃的东西只用 `transform` 移动。
4. 内容里的默认过渡是一张属性清单（`--cont`），不是 `transition: all`，永远不过渡 `visibility`；core 移动的结构（`.layer`、`.sheet`、`.chrome`）上不能有 `transition`。
5. 输入框字号不小于 16px（否则 iPhone 聚焦时会放大）。

调试用的开关（不是给用户的设置）：`?driver=js` 强制脚本驱动对比手感；`localStorage['app:blur'] = 'veil' | 'filter' | 'none'` 强制后页模糊方式。

## 许可

MIT

<script setup lang="ts">
const { tweaks } = useTweaks()
const { phase, transition } = useWishFlow()

// praying 階段陰天;另外轉場期間(LoadingScreen 烏雲簾出現時)整個 web 也壓成陰天,
// 讓 body 背景與 loading 同步變色,避免「外面晴色、loading 烏雲」的不同步
const weather = computed(() => (phase.value === 'praying' || transition.value) ? 'rainy' : 'sunny')

// 將主題屬性同步到 documentElement,讓 CSS [data-theme="..."] selector 可從 html 起作用
useHead(() => ({
  htmlAttrs: {
    'data-theme': tweaks.value.themeColor,
    'data-font': tweaks.value.fontStyle,
    'data-style': tweaks.value.visualStyle,
    'data-weather': weather.value,
  },
}))
</script>

<template>
  <div
    :data-theme="tweaks.themeColor"
    :data-font="tweaks.fontStyle"
    :data-style="tweaks.visualStyle"
  >
    <NuxtRouteAnnouncer />
    <BgClouds />
    <NuxtPage />
  </div>
</template>

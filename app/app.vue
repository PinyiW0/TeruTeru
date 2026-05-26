<script setup lang="ts">
const { tweaks } = useTweaks()

// 將主題屬性同步到 documentElement,讓 CSS [data-theme="..."] selector 可從 html 起作用
useHead(() => ({
  htmlAttrs: {
    'data-theme': tweaks.value.themeColor,
    'data-font': tweaks.value.fontStyle,
    'data-style': tweaks.value.visualStyle,
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
    <NuxtPage />
  </div>
</template>

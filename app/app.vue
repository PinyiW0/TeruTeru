<script setup lang="ts">
const { tweaks } = useTweaks()
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

<script setup lang="ts">
const { phase, transition } = useWishFlow()
</script>

<template>
  <div class="stage" data-screen-root>
    <BgClouds />
    <DollDefs />

    <SetupScreen v-if="phase === 'setup'" />
    <PrayingScreen v-else-if="phase === 'praying'" />
    <CompleteScreen v-else />

    <LoadingScreen v-if="transition" />
  </div>
</template>

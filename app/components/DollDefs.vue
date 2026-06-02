<script setup lang="ts">
// 全頁共用 SVG defs:gradient 與 washi filter
// 掛在 pages/index.vue 根節點一次,供所有 TeruDoll 透過 url(#id) 引用
</script>

<template>
  <svg class="svg-defs" aria-hidden="true">
    <defs>
      <radialGradient id="headShade" cx="0.35" cy="0.3" r="0.8">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9" />
        <stop offset="55%" stop-color="#FFFFFF" stop-opacity="0" />
        <stop offset="100%" stop-color="#A0B0C0" stop-opacity="0.4" />
      </radialGradient>
      <linearGradient id="bodyShade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#D8DEE8" stop-opacity="0.5" />
        <stop offset="55%" stop-color="#FFFFFF" stop-opacity="0" />
        <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.6" />
      </linearGradient>
      <filter id="washi-edge" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" base-frequency="0.9" num-octaves="2" seed="3" />
        <feDisplacementMap in="SourceGraphic" scale="0.9" />
      </filter>
    </defs>
  </svg>
</template>

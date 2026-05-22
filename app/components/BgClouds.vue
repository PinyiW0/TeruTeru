<script setup lang="ts">
// 1:1 port of spec/ui-config/ui-reference/app.jsx::BgClouds
// 三朵漂浮雲背景,動畫由 teru.css 中的 .bg-cloud class 提供
</script>

<template>
  <div class="bg-clouds" aria-hidden="true">
    <svg class="bg-cloud" :style="{ top: '12%', left: '-20%' }" width="120" height="60" viewBox="0 0 120 60">
      <g fill="#FFFFFF" opacity="0.8">
        <ellipse cx="30" cy="35" rx="22" ry="14" />
        <ellipse cx="55" cy="28" rx="24" ry="18" />
        <ellipse cx="80" cy="34" rx="20" ry="14" />
      </g>
    </svg>
    <svg class="bg-cloud" :style="{ top: '34%', left: '-30%' }" width="160" height="70" viewBox="0 0 160 70">
      <g fill="#FFFFFF" opacity="0.6">
        <ellipse cx="40" cy="42" rx="28" ry="16" />
        <ellipse cx="75" cy="33" rx="32" ry="22" />
        <ellipse cx="110" cy="42" rx="26" ry="18" />
      </g>
    </svg>
    <svg class="bg-cloud" :style="{ top: '58%', left: '-25%' }" width="100" height="50" viewBox="0 0 100 50">
      <g fill="#FFFFFF" opacity="0.5">
        <ellipse cx="25" cy="28" rx="18" ry="12" />
        <ellipse cx="50" cy="22" rx="22" ry="16" />
        <ellipse cx="72" cy="28" rx="18" ry="12" />
      </g>
    </svg>
  </div>
</template>

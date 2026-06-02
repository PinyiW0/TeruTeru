<script setup lang="ts">
// 1:1 port of spec/ui-config/ui-reference/complete.jsx::RainCloud
const props = withDefaults(defineProps<{
  w?: number
  color?: string
  drops?: number
}>(), {
  w: 100,
  color: '#5F6F84',
  drops: 3,
})

const h = computed(() => props.w * 0.7)
const dropsList = computed(() => Array.from({ length: props.drops }, (_, i) => i))
</script>

<template>
  <svg :width="w" :height="h" viewBox="0 0 100 70">
    <ellipse cx="32" cy="32" rx="22" ry="18" :fill="color" opacity="0.9" />
    <ellipse cx="60" cy="28" rx="26" ry="22" :fill="color" opacity="0.95" />
    <ellipse cx="75" cy="38" rx="20" ry="16" :fill="color" opacity="0.9" />
    <ellipse cx="45" cy="42" rx="28" ry="14" :fill="color" opacity="0.85" />
    <ellipse cx="48" cy="24" rx="20" ry="5" fill="#FFFFFF" opacity="0.18" />
    <path
      v-for="i in dropsList"
      :key="i"
      :d="`M ${28 + i * 18} 56 q -2 4 0 8 q 2 -4 0 -8 z`"
      fill="#9CB6CC"
    />
  </svg>
</template>

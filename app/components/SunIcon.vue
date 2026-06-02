<script setup lang="ts">
// 1:1 port of spec/ui-config/ui-reference/complete.jsx::Sun
const props = withDefaults(defineProps<{
  size?: number
  rays?: number
  smile?: boolean
}>(), {
  size: 200,
  rays: 12,
  smile: true,
})

const cx = computed(() => props.size / 2)
const cy = computed(() => props.size / 2)
const coreR = computed(() => props.size * 0.22)
const innerR = computed(() => props.size * 0.28)
const outerR = computed(() => props.size * 0.46)

interface Ray {
  i: number
  x1: number
  y1: number
  x2: number
  y2: number
  opacity: number
  strokeWidth: number
}

const rayItems = computed<Ray[]>(() => {
  const list: Ray[] = []
  for (let i = 0; i < props.rays; i++) {
    const ang = (i / props.rays) * Math.PI * 2
    list.push({
      i,
      x1: cx.value + Math.cos(ang) * innerR.value,
      y1: cy.value + Math.sin(ang) * innerR.value,
      x2: cx.value + Math.cos(ang) * outerR.value,
      y2: cy.value + Math.sin(ang) * outerR.value,
      opacity: i % 2 === 0 ? 1 : 0.7,
      strokeWidth: props.size * 0.04,
    })
  }
  return list
})

const innerViewSize = computed(() => coreR.value * 2.2)
</script>

<template>
  <div class="sun-stage" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg class="sun-rays" :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
      <line
        v-for="r in rayItems"
        :key="r.i"
        :x1="r.x1" :y1="r.y1" :x2="r.x2" :y2="r.y2"
        stroke="var(--sun-deep)"
        :stroke-width="r.strokeWidth"
        stroke-linecap="round"
        :opacity="r.opacity"
      />
    </svg>
    <div class="sun-body">
      <svg
        :width="innerViewSize" :height="innerViewSize"
        :viewBox="`0 0 ${innerViewSize} ${innerViewSize}`"
      >
        <defs>
          <radialGradient id="sunGrad" cx="0.4" cy="0.35" r="0.75">
            <stop offset="0%" stop-color="#FFF2C2" />
            <stop offset="60%" stop-color="var(--sun)" />
            <stop offset="100%" stop-color="var(--sun-deep)" />
          </radialGradient>
        </defs>
        <circle :cx="coreR * 1.1" :cy="coreR * 1.1" :r="coreR" fill="url(#sunGrad)" />
        <g v-if="smile">
          <ellipse :cx="coreR * 0.85" :cy="coreR * 1.0" :rx="coreR * 0.06" :ry="coreR * 0.08" fill="#7A4A2A" />
          <ellipse :cx="coreR * 1.35" :cy="coreR * 1.0" :rx="coreR * 0.06" :ry="coreR * 0.08" fill="#7A4A2A" />
          <ellipse :cx="coreR * 0.78" :cy="coreR * 1.18" :rx="coreR * 0.08" :ry="coreR * 0.05" fill="#E89999" opacity="0.7" />
          <ellipse :cx="coreR * 1.42" :cy="coreR * 1.18" :rx="coreR * 0.08" :ry="coreR * 0.05" fill="#E89999" opacity="0.7" />
          <path
            :d="`M ${coreR * 0.95} ${coreR * 1.22} Q ${coreR * 1.1} ${coreR * 1.4} ${coreR * 1.25} ${coreR * 1.22}`"
            stroke="#7A4A2A" :stroke-width="coreR * 0.06" fill="none" stroke-linecap="round"
          />
        </g>
      </svg>
    </div>
  </div>
</template>

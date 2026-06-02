<script setup lang="ts">
import type { DollStyle, VisualStyle } from '~/types/tweaks'

const props = withDefaults(defineProps<{
  index?: number
  dollStyle?: DollStyle
  visualStyle?: VisualStyle
  tieColor?: string
  size?: number
  // 活潑模式:無視 dollStyle,以笑臉為主、五種表情錯雜呈現
  playful?: boolean
}>(), {
  index: 0,
  dollStyle: 'classic',
  visualStyle: 'flat',
  tieColor: undefined,
  size: 1,
  playful: false,
})
// 1:1 port of spec/ui-config/ui-reference/teru.jsx::TeruDoll
const DOLL_W = 60
const DOLL_H = 92

const VARIED_TIES = ['#E27E6F', '#F4B860', '#7CB1D6', '#A485C9', '#7BB386', '#E89BB0']
const VARIED_FACES = [
  { kind: 'dot', mouth: 'smile' },
  { kind: 'dot', mouth: 'o' },
  { kind: 'line', mouth: 'smile' },
  { kind: 'dot', mouth: 'flat' },
  { kind: 'dot', mouth: 'smile' },
  { kind: 'happy', mouth: 'smile' },
] as const

// 活潑表情組:3 種笑臉為主 + 2 種變化(驚喜、呆萌)點綴
const PLAYFUL_FACES = [
  { kind: 'dot', mouth: 'smile' }, // 0 微笑
  { kind: 'happy', mouth: 'smile' }, // 1 開心彎眼笑
  { kind: 'line', mouth: 'smile' }, // 2 瞇眼笑
  { kind: 'dot', mouth: 'o' }, // 3 驚喜圓嘴
  { kind: 'dot', mouth: 'flat' }, // 4 呆萌
] as const
// 錯雜出場序:笑臉(0/1/2)為主,驚喜/呆萌(3/4)少量穿插
const PLAYFUL_ORDER = [0, 1, 3, 2, 0, 1, 0, 4, 2, 1, 3, 0, 2, 1, 0, 4, 1, 2, 0, 3]

const tie = computed(() => {
  if (props.tieColor)
    return props.tieColor
  // playful:走隨主題變化的繽紛色票(--tie-1..6,定義於 teru.css)
  if (props.playful)
    return `var(--tie-${(props.index % 6) + 1})`
  return props.dollStyle === 'varied'
    ? VARIED_TIES[props.index % VARIED_TIES.length]
    : 'var(--accent)'
})

// playful 表情輪播:從 index 對應的起點出發,定時往後切換(以笑臉為主的序列)
const faceCursor = ref(props.index)
// 切換瞬間的「變臉」擠壓過渡開關
const switching = ref(false)

const face = computed(() => {
  if (props.playful) {
    const i = ((faceCursor.value % PLAYFUL_ORDER.length) + PLAYFUL_ORDER.length) % PLAYFUL_ORDER.length
    return PLAYFUL_FACES[PLAYFUL_ORDER[i]!]!
  }
  return props.dollStyle === 'varied'
    ? VARIED_FACES[props.index % VARIED_FACES.length]!
    : { kind: 'dot' as const, mouth: 'smile' as const }
})

let switchTimer: ReturnType<typeof setInterval> | null = null
let squashTimer: ReturnType<typeof setTimeout> | null = null
let restoreTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  if (!import.meta.client || !props.playful)
    return
  // 每隻娃娃切換週期錯開(3.0~5.5s),避免整排同步變臉
  const period = 3000 + (props.index % 6) * 500
  switchTimer = setInterval(() => {
    switching.value = true
    // 在臉壓扁的中點換表情,視覺上像眨一下後變臉
    squashTimer = setTimeout(() => (faceCursor.value += 1), 140)
    restoreTimer = setTimeout(() => (switching.value = false), 300)
  }, period)
})

onBeforeUnmount(() => {
  if (switchTimer)
    clearInterval(switchTimer)
  if (squashTimer)
    clearTimeout(squashTimer)
  if (restoreTimer)
    clearTimeout(restoreTimer)
})

const flipMul = computed(() => (props.index % 2 === 0 ? 1 : -1))

const bodyPath = computed(() =>
  props.dollStyle === 'simple'
    ? 'M 22 38 Q 18 56 18 76 Q 30 80 42 76 Q 42 56 38 38 Z'
    : 'M 20 38 Q 14 54 12 76 Q 16 80 20 76 Q 24 82 28 76 Q 32 82 36 76 Q 40 82 44 76 Q 48 80 48 76 Q 46 54 40 38 Z',
)

const filterUrl = computed(() => props.visualStyle === 'washi' ? 'url(#washi-edge)' : undefined)

const tailPath = computed(() =>
  flipMul.value > 0
    ? 'M 41 40 Q 47 42 46 47 L 43 45 Z'
    : 'M 19 40 Q 13 42 14 47 L 17 45 Z',
)
</script>

<template>
  <svg
    :width="DOLL_W * size"
    :height="DOLL_H * size"
    :viewBox="`0 0 ${DOLL_W} ${DOLL_H}`"
    style="display: block; overflow: visible;"
  >
    <!-- 上方繩線錨點 -->
    <line x1="30" y1="0" x2="30" y2="10" stroke="#3A2A1A" stroke-width="1" stroke-linecap="round" />
    <circle cx="30" cy="10" r="1.4" fill="#3A2A1A" />

    <!-- 身體陰影 -->
    <ellipse cx="30" cy="84" rx="16" ry="1.8" fill="rgba(40,60,90,0.10)" />

    <g :filter="filterUrl">
      <!-- 身體 -->
      <path
        :d="bodyPath"
        fill="#FBFBFB"
        stroke="rgba(40,60,90,0.16)"
        stroke-width="0.8"
      />
      <path
        :d="bodyPath"
        fill="url(#bodyShade)"
        opacity="0.55"
      />
      <!-- 領結 -->
      <rect data-role="tie" x="17" y="36" width="26" height="4.6" rx="1.6" :fill="tie" />
      <rect x="17" y="36" width="26" height="1.2" rx="0.6" fill="rgba(255,255,255,0.45)" />
      <path :d="tailPath" :fill="tie" opacity="0.85" />

      <!-- 頭 -->
      <circle cx="30" cy="25" r="14.5" fill="#FEFEFE" stroke="rgba(40,60,90,0.14)" stroke-width="0.8" />
      <circle cx="30" cy="25" r="14.5" fill="url(#headShade)" opacity="0.7" />

      <!-- 雙頰 -->
      <ellipse cx="20" cy="28" rx="3.6" ry="2.4" fill="#F2A8A2" opacity="0.75" />
      <ellipse cx="40" cy="28" rx="3.6" ry="2.4" fill="#F2A8A2" opacity="0.75" />

      <g
        data-role="face"
        :data-face="`${face.kind}-${face.mouth}`"
        class="teru-face"
        :class="{ 'is-switching': switching }"
      >
        <!-- 眼睛 -->
        <template v-if="face.kind === 'line'">
          <path d="M 23 22 L 27 22" stroke="#1F2A3A" stroke-width="1.6" stroke-linecap="round" />
          <path d="M 33 22 L 37 22" stroke="#1F2A3A" stroke-width="1.6" stroke-linecap="round" />
        </template>
        <template v-else-if="face.kind === 'happy'">
          <path d="M 22.5 23 Q 25 20 27.5 23" stroke="#1F2A3A" stroke-width="1.6" stroke-linecap="round" fill="none" />
          <path d="M 32.5 23 Q 35 20 37.5 23" stroke="#1F2A3A" stroke-width="1.6" stroke-linecap="round" fill="none" />
        </template>
        <template v-else>
          <ellipse cx="25" cy="22" rx="1.4" ry="1.7" fill="#1F2A3A" />
          <ellipse cx="35" cy="22" rx="1.4" ry="1.7" fill="#1F2A3A" />
        </template>

        <!-- 嘴巴 -->
        <ellipse
          v-if="face.mouth === 'o'"
          cx="30" cy="29" rx="1.1" ry="1.4" fill="#9B5346"
        />
        <path
          v-else-if="face.mouth === 'flat'"
          d="M 28 28.5 L 32 28.5" stroke="#9B5346" stroke-width="1.2" stroke-linecap="round"
        />
        <path
          v-else
          d="M 27.5 28 Q 30 30.5 32.5 28" stroke="#9B5346" stroke-width="1.2" stroke-linecap="round" fill="none"
        />
      </g>
    </g>

    <!-- collage 風格的紙邊 -->
    <circle
      v-if="visualStyle === 'collage'"
      cx="30" cy="25" r="14.5"
      fill="none"
      stroke="rgba(40,60,90,0.07)"
      stroke-width="0.8"
      stroke-dasharray="0.4 1.6"
    />
  </svg>
</template>

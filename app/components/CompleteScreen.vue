<script setup lang="ts">
// 1:1 port of spec/ui-config/ui-reference/complete.jsx::CompleteScreen
import { formatDateCN } from '~/utils/wishDate'

const { date, location, goTo } = useWishFlow()
const { tok, bloom } = useTeruAudio()

type AnimPhase = 'clouded' | 'clearing' | 'done'
const animPhase = ref<AnimPhase>('clouded')

const timers: ReturnType<typeof setTimeout>[] = []

onMounted(() => {
  timers.push(setTimeout(() => {
    animPhase.value = 'clearing'
  }, 350))
  timers.push(setTimeout(() => {
    animPhase.value = 'done'
    bloom()
  }, 1900))
})

onBeforeUnmount(() => {
  timers.forEach(clearTimeout)
  timers.length = 0
})

// 5 朵離場雲座標(直譯 reference)
interface DepartCloud {
  fromX: number
  fromY: number
  toX: number
  toY: number
  w: number
}
const departing: DepartCloud[] = [
  { fromX: -30, fromY: -10, toX: -260, toY: -160, w: 110 },
  { fromX: 40, fromY: -30, toX: 260, toY: -200, w: 130 },
  { fromX: -60, fromY: 40, toX: -300, toY: 100, w: 100 },
  { fromX: 50, fromY: 50, toX: 280, toY: 140, w: 120 },
  { fromX: 0, fromY: -60, toX: 0, toY: -260, w: 90 },
]

const sunStyle = computed(() => ({
  opacity: animPhase.value === 'clouded' ? 0.25 : 1,
  transform: animPhase.value === 'clouded' ? 'scale(0.85)' : 'scale(1)',
  transition: 'opacity 1.2s ease, transform 1.4s cubic-bezier(0.34,1.56,0.64,1)',
  zIndex: 1,
}))

const haloStyle = computed(() => ({
  position: 'absolute' as const,
  inset: 0,
  pointerEvents: 'none' as const,
  zIndex: 0,
  background: 'radial-gradient(60% 40% at 50% 32%, rgba(255,220,140,0.55) 0%, rgba(255,220,140,0) 60%)',
  opacity: animPhase.value === 'done' ? 1 : 0,
  transition: 'opacity 1.2s ease',
}))

const textStyle = computed(() => ({
  opacity: animPhase.value === 'done' ? 1 : 0,
  transform: animPhase.value === 'done' ? 'translateY(0)' : 'translateY(12px)',
  transition: 'opacity 0.8s ease 0.2s, transform 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.2s',
  zIndex: 2,
  textAlign: 'center' as const,
}))

function handleRestart() {
  tok()
  // 帶上目前日期,讓重新祈禱保留先前選擇(再次祈禱常為同一個日子)
  goTo('setup', { date: date.value })
}
</script>

<template>
  <div class="screen complete" data-screen-label="03 Complete">
    <!-- 背景光暈 -->
    <div :style="haloStyle" />

    <!-- 太陽 -->
    <div data-role="sun" :style="sunStyle">
      <SunIcon :size="220" />
    </div>

    <!-- 離場雲(進入 done 後不再渲染) -->
    <div
      v-if="animPhase !== 'done'"
      style="position: absolute; left: 50%; top: calc(50% - 80px); width: 0; height: 0; z-index: 2; pointer-events: none;"
    >
      <div
        v-for="(c, i) in departing"
        :key="i"
        class="depart-cloud"
        :style="{
          'left': `${c.fromX - c.w / 2}px`,
          'top': `${c.fromY - 30}px`,
          'position': 'absolute',
          'animationDelay': `${i * 80}ms`,
          '--from-x': '0px',
          '--from-y': '0px',
          '--to-x': `${c.toX}px`,
          '--to-y': `${c.toY}px`,
        }"
      >
        <RainCloud :w="c.w" color="#7F8FA3" :drops="animPhase === 'clouded' ? 3 : 0" />
      </div>
    </div>

    <!-- 文字 + CTA -->
    <div :style="textStyle">
      <h2 class="complete-title">
        一定會是好天氣的!
      </h2>
      <p class="complete-meta">
        {{ formatDateCN(date) }}<br>
        為 {{ location }} 祈禱
      </p>
      <button class="btn-primary" @click="handleRestart">
        重新祈禱
      </button>
    </div>
  </div>
</template>

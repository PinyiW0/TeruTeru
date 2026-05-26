<script setup lang="ts">
// 1:1 port of spec/ui-config/ui-reference/praying.jsx
import { formatDateCN } from '~/utils/wishDate'

const { date, location, dolls, addDoll, goTo, ROPES, slotToXY, ROPE_SAG, BAND_TOP, BAND_BOT, ROPE_Y_FRACTIONS } = useWishFlow()
const { tweaks } = useTweaks()
const { chimeAt, tok } = useTeruAudio()

const DOLL_W = 60
const DOLL_SCALE = 0.86
const DOLL_RW = DOLL_W * DOLL_SCALE

// Stage 尺寸追蹤
const stageRef = ref<HTMLDivElement | null>(null)
const size = ref({ w: 0, h: 0 })
let observer: ResizeObserver | null = null

onMounted(() => {
  if (!import.meta.client)
    return
  const el = stageRef.value
  if (!el)
    return
  const update = () => {
    size.value = { w: el.clientWidth, h: el.clientHeight }
  }
  update()
  observer = new ResizeObserver(update)
  observer.observe(el)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

// 繩子 SVG path 計算
interface RopePath {
  d: string
  y: number
  x0: number
  x1: number
}

const ropePaths = computed<RopePath[]>(() => {
  const list: RopePath[] = []
  if (size.value.w <= 0)
    return list
  const bandTop = size.value.h * BAND_TOP
  const bandBot = size.value.h * BAND_BOT
  for (let r = 0; r < ROPES; r++) {
    const y = bandTop + ROPE_Y_FRACTIONS[r]! * (bandBot - bandTop)
    const x0 = size.value.w * 0.06
    const x1 = size.value.w * 0.94
    const midY = y + ROPE_SAG
    const midX = size.value.w * 0.5
    list.push({
      d: `M ${x0} ${y} Q ${midX} ${midY} ${x1} ${y}`,
      y,
      x0,
      x1,
    })
  }
  return list
})

// SVG viewBox(隨 stage size 變)
const viewBox = computed(() => `0 0 ${size.value.w || 400} ${size.value.h || 700}`)

// Tap 處理
function handleTap(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  if (target && target.closest('.pray-back, .pray-top'))
    return

  const stage = stageRef.value
  if (!stage)
    return
  const rect = stage.getBoundingClientRect()
  const tapX = event.clientX - rect.left
  const tapY = event.clientY - rect.top

  const nextSlot = dolls.value.length
  if (nextSlot >= 25)
    return // composable 也會擋,這裡再保險避免無謂的 chime

  addDoll(tapX, tapY, size.value.w, size.value.h)
  chimeAt(nextSlot)
}

function handleBack() {
  tok()
  goTo('setup')
}

// Doll 位置與動畫變數
function dollLeft(slot: number) {
  return slotToXY(slot, size.value.w, size.value.h).x - DOLL_RW / 2
}
function dollTop(slot: number) {
  return slotToXY(slot, size.value.w, size.value.h).y
}
function swayDur(slot: number) {
  return `${4.2 + (slot % 5) * 0.3}s`
}
function swayDelay(slot: number) {
  return `${-((slot * 0.6) % 3)}s`
}
</script>

<template>
  <div
    ref="stageRef"
    class="screen praying"
    data-screen-label="02 Praying"
    @click="handleTap"
  >
    <!-- 頂部 -->
    <div class="pray-top" @click.stop>
      <button class="pray-back" aria-label="返回" @click="handleBack">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M11.5 3 L4.5 9 L11.5 15"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <div class="pray-meta">
        <div class="pray-meta-date">
          {{ formatDateCN(date) }}
        </div>
        <div class="pray-meta-loc">
          為 {{ location }} 祈禱晴天
        </div>
      </div>
    </div>

    <!-- 標題 -->
    <div class="pray-counter">
      <div class="pray-title">
        晴天娃娃降臨中
      </div>
    </div>

    <!-- 繩子 + 娃娃 -->
    <div class="pray-stage">
      <svg
        class="clothesline-svg"
        :viewBox="viewBox"
        preserveAspectRatio="none"
      >
        <g v-for="(rp, i) in ropePaths" :key="i">
          <!-- 兩端圖釘 -->
          <circle :cx="rp.x0" :cy="rp.y" r="2.4" fill="var(--rope-deep)" />
          <circle :cx="rp.x0" :cy="rp.y" r="1.0" fill="var(--rope)" />
          <circle :cx="rp.x1" :cy="rp.y" r="2.4" fill="var(--rope-deep)" />
          <circle :cx="rp.x1" :cy="rp.y" r="1.0" fill="var(--rope)" />
          <!-- 陰影 + 主線 + 紋路 -->
          <path
            :d="rp.d"
            stroke="rgba(0,0,0,0.10)"
            stroke-width="2.2"
            fill="none"
            transform="translate(0, 1.5)"
          />
          <path
            :data-rope-index="i"
            :d="rp.d"
            stroke="var(--rope)"
            stroke-width="1.6"
            fill="none"
            stroke-linecap="round"
          />
          <path
            :d="rp.d"
            stroke="var(--rope-deep)"
            stroke-width="0.6"
            fill="none"
            stroke-linecap="round"
            stroke-dasharray="1.5 2.5"
            opacity="0.5"
          />
        </g>
      </svg>

      <!-- Dolls -->
      <div
        v-for="d in dolls"
        :key="d.id"
        class="doll teru-doll"
        :class="d.hung ? 'hung' : 'floating-in'"
        :data-doll-slot="d.slot"
        :style="{
          'left': `${dollLeft(d.slot)}px`,
          'top': `${dollTop(d.slot)}px`,
          '--from-x': `${d.fromX}px`,
          '--from-y': `${d.fromY}px`,
          '--sway-dur': swayDur(d.slot),
          '--sway-delay': swayDelay(d.slot),
        }"
      >
        <TeruDoll
          :index="d.slot"
          :doll-style="tweaks.dollStyle"
          :visual-style="tweaks.visualStyle"
          :size="DOLL_SCALE"
        />
      </div>
    </div>

    <!-- 底部 hint -->
    <div class="pray-hint-bot">
      <span>點任意處</span>
      <span class="tap-dot">·</span>
      <span>掛上晴天娃娃</span>
    </div>
  </div>
</template>

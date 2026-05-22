<script setup lang="ts">
// 1:1 port of spec/ui-config/ui-reference/setup.jsx
import type { ThemeColor } from '~/types/tweaks'
import { buildDays, COMMON_LOCATIONS, isSameDay, todayMidnight, WEEKDAY_LABELS } from '~/utils/wishDate'

const { date, location, goTo } = useWishFlow()
const { tweaks, setTweak } = useTweaks()
const { pluck, tok } = useTeruAudio()

const today = computed(() => todayMidnight())
// 把 selected date 傳進去,讓 strip 延伸涵蓋使用者下拉選的遠日期
const days = computed(() => buildDays(today.value, date.value))

// 年/月/日 select 的選項(過去日 gate)
const minYear = computed(() => today.value.getFullYear())
const years = computed(() => [minYear.value, minYear.value + 1, minYear.value + 2])

const minMonth = computed(() => date.value.getFullYear() === minYear.value ? today.value.getMonth() : 0)
const months = computed(() => {
  const list: number[] = []
  for (let m = minMonth.value; m < 12; m++) list.push(m)
  return list
})

const daysInMonth = computed(() =>
  new Date(date.value.getFullYear(), date.value.getMonth() + 1, 0).getDate(),
)
const minDay = computed(() =>
  date.value.getFullYear() === minYear.value && date.value.getMonth() === today.value.getMonth()
    ? today.value.getDate()
    : 1,
)
const dayNums = computed(() => {
  const list: number[] = []
  for (let d = minDay.value; d <= daysInMonth.value; d++) list.push(d)
  return list
})

function setY(y: number) {
  const nd = new Date(date.value)
  nd.setFullYear(y)
  if (y === minYear.value && nd.getMonth() < today.value.getMonth()) {
    nd.setMonth(today.value.getMonth())
  }
  if (nd < today.value) {
    nd.setTime(today.value.getTime())
  }
  date.value = nd
  pluck(660)
}

function setM(m: number) {
  const nd = new Date(date.value)
  nd.setDate(1)
  nd.setMonth(m)
  const lastDay = new Date(nd.getFullYear(), nd.getMonth() + 1, 0).getDate()
  let newDay = Math.min(date.value.getDate(), lastDay)
  if (nd.getFullYear() === minYear.value && m === today.value.getMonth() && newDay < today.value.getDate()) {
    newDay = today.value.getDate()
  }
  nd.setDate(newDay)
  date.value = nd
  pluck(660)
}

function setD(d: number) {
  const nd = new Date(date.value)
  nd.setDate(d)
  date.value = nd
  pluck(660)
}

// Week strip refs
const stripRef = ref<HTMLDivElement | null>(null)
const dayRefs = ref<Record<number, HTMLDivElement | undefined>>({})

// Week strip 拖曳 scroll(僅 mouse,touch 用瀏覽器原生 swipe)
const dragState = {
  active: false,
  startX: 0,
  startScroll: 0,
  moved: 0,
  pointerId: null as number | null,
}
const DRAG_THRESHOLD = 5 // px,超過視為拖曳並吞掉後續 click

function onStripPointerDown(e: PointerEvent) {
  if (e.pointerType !== 'mouse')
    return
  const strip = stripRef.value
  if (!strip)
    return
  dragState.active = true
  dragState.startX = e.clientX
  dragState.startScroll = strip.scrollLeft
  dragState.moved = 0
  dragState.pointerId = null
  // 不在這裡 setPointerCapture,否則純點擊也會被捕獲導致 .day click 事件不觸發
}

function onStripPointerMove(e: PointerEvent) {
  if (!dragState.active)
    return
  const strip = stripRef.value
  if (!strip)
    return
  const dx = e.clientX - dragState.startX
  dragState.moved = Math.abs(dx)
  if (dragState.moved <= DRAG_THRESHOLD)
    return
  // 跨過 threshold 才真的算拖曳,這時才捕獲 pointer 讓拖出範圍仍能追蹤
  if (dragState.pointerId === null) {
    dragState.pointerId = e.pointerId
    strip.setPointerCapture(e.pointerId)
  }
  strip.scrollLeft = dragState.startScroll - dx
}

function onStripPointerUp() {
  if (!dragState.active)
    return
  const strip = stripRef.value
  if (strip && dragState.pointerId !== null) {
    strip.releasePointerCapture(dragState.pointerId)
  }
  dragState.active = false
  dragState.pointerId = null
}

function tapDay(d: Date) {
  // 若剛剛是拖曳(超過 threshold),吞掉這次 click 避免誤選
  if (dragState.moved > DRAG_THRESHOLD) {
    dragState.moved = 0
    return
  }
  if (d < today.value)
    return
  date.value = new Date(d)
  pluck(720)
}

function setDayRef(d: Date, el: Element | ComponentPublicInstance | null) {
  if (el instanceof HTMLDivElement) {
    dayRefs.value[+d] = el
  }
}

function scrollSelectedIntoCenter() {
  if (!import.meta.client)
    return
  const strip = stripRef.value
  const el = dayRefs.value[+date.value]
  if (!strip || !el)
    return
  const stripRect = strip.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  const target = strip.scrollLeft + (elRect.left - stripRect.left) - (stripRect.width / 2 - elRect.width / 2)
  strip.scrollTo({ left: Math.max(0, target), behavior: 'smooth' })
}

onMounted(() => {
  nextTick(scrollSelectedIntoCenter)
})

watch(date, () => {
  if (!import.meta.client)
    return
  nextTick(scrollSelectedIntoCenter)
})

// Theme dots
interface ThemeDot { id: ThemeColor, color: string }
const themeDots: ThemeDot[] = [
  { id: 'sunny', color: '#B8DEF0' },
  { id: 'sakura', color: '#FFD3DE' },
  { id: 'matcha', color: '#C7DDB5' },
]

function pickTheme(id: ThemeColor) {
  setTweak('themeColor', id)
  pluck(700)
}

// Location chips
function tapChip(loc: string) {
  location.value = loc
  pluck(620)
}

// Start CTA
const canStart = computed(() => location.value.trim().length > 0)

function handleStart() {
  if (!canStart.value)
    return
  tok()
  goTo('praying', { date: date.value, location: location.value.trim() })
}
</script>

<template>
  <div class="screen setup" data-screen-label="01 Setup">
    <div class="setup-header">
      <h1 class="setup-title">
        Teru Teru 放晴中
      </h1>
      <p class="setup-subtitle">
        為一個日子,為一個地方,求一場好天氣
      </p>
    </div>

    <!-- Theme color picker -->
    <div>
      <p class="field-label" />
      <div class="theme-picker" style="justify-content: center;">
        <button
          v-for="t in themeDots"
          :key="t.id"
          :aria-label="t.id"
          class="theme-dot"
          :class="{ active: tweaks.themeColor === t.id }"
          :style="{ background: t.color }"
          @click="pickTheme(t.id)"
        />
      </div>
    </div>

    <!-- Date picker -->
    <div style="margin: 8px 0 0;">
      <p class="field-label" style="margin: 4px 0 0;">
        選擇日期
      </p>
      <div class="date-picker">
        <select :value="date.getFullYear()" @change="setY(Number(($event.target as HTMLSelectElement).value))">
          <option v-for="y in years" :key="y" :value="y">
            {{ y }} 年
          </option>
        </select>
        <select :value="date.getMonth()" @change="setM(Number(($event.target as HTMLSelectElement).value))">
          <option v-for="m in months" :key="m" :value="m">
            {{ m + 1 }} 月
          </option>
        </select>
        <select :value="date.getDate()" @change="setD(Number(($event.target as HTMLSelectElement).value))">
          <option v-for="d in dayNums" :key="d" :value="d">
            {{ d }} 日
          </option>
        </select>
      </div>

      <div class="weekstrip-wrap">
        <div
          ref="stripRef"
          class="weekstrip"
          style="padding: 12px; cursor: grab;"
          @pointerdown="onStripPointerDown"
          @pointermove="onStripPointerMove"
          @pointerup="onStripPointerUp"
          @pointercancel="onStripPointerUp"
        >
          <div
            v-for="d in days"
            :key="+d"
            :ref="(el) => setDayRef(d, el)"
            class="day"
            :class="{
              'is-disabled': d < today,
              'is-today': isSameDay(d, today),
              'is-selected': isSameDay(d, date),
            }"
            @click="tapDay(d)"
          >
            <div class="day-w">
              {{ WEEKDAY_LABELS[d.getDay()] }}
            </div>
            <div class="day-d">
              {{ d.getDate() }}
            </div>
            <div class="day-m">
              {{ d.getMonth() + 1 }}月
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Location -->
    <div style="margin-top: 22px;">
      <p class="field-label">
        選擇地點
      </p>
      <input
        v-model="location"
        class="loc-input"
        type="text"
        placeholder="例如:台北、京都…"
      >
      <div class="chips" style="justify-content: center;">
        <button
          v-for="loc in COMMON_LOCATIONS"
          :key="loc"
          class="chip"
          :class="{ active: location === loc }"
          @click="tapChip(loc)"
        >
          {{ loc }}
        </button>
      </div>
    </div>

    <div class="start-cta">
      <button class="btn-primary" :disabled="!canStart" @click="handleStart">
        開始放晴
      </button>
      <div style="font-size: 11.5px; color: var(--muted); letter-spacing: 0.12em;">
        掛滿晴天娃娃就會放晴
      </div>
    </div>
  </div>
</template>

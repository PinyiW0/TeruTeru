<script setup lang="ts">
// 1:1 port of spec/ui-config/ui-reference/setup.jsx
import type { ThemeColor } from '~/types/tweaks'
import { buildDays, isSameDay, todayMidnight, WEEKDAY_LABELS } from '~/utils/wishDate'

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

// Week strip — 改用 Nuxt UI <UCarousel>(底層 Embla)
// Embla 原生處理觸控軸向鎖定(只吃水平),解決手機上滑動時上下亂跑/回彈
const carousel = useTemplateRef('carousel')

// 取得 Embla 實例(UCarousel 對外曝露 emblaApi)
function emblaApi() {
  return (carousel.value as { emblaApi?: { scrollTo: (i: number, jump?: boolean) => void, clickAllowed?: () => boolean, on?: (e: string, cb: () => void) => void } } | null)?.emblaApi
}

// 選取日在 days 中的索引,供 Embla scrollTo 置中
const selectedIndex = computed(() => days.value.findIndex(d => isSameDay(d, date.value)))

function scrollSelectedIntoCenter(jump = false) {
  const api = emblaApi()
  if (!api || selectedIndex.value < 0)
    return
  api.scrollTo(selectedIndex.value, jump)
}

function tapDay(d: Date) {
  // Embla 已判定剛剛是拖曳就不選取(避免滑動誤選)
  const api = emblaApi()
  if (api?.clickAllowed && !api.clickAllowed())
    return
  if (d < today.value)
    return
  date.value = new Date(d)
  pluck(720)
}

// hydration 完成標記:用於 canStart 等依賴 localStorage 還原值的 binding
// SSR location 必為空 → 按鈕 render 成 disabled;client 還原 location 後,
// Vue 不會自動 patch SSR/CSR 不一致的 disabled boolean 屬性。
// 以 mounted 閘控讓 SSR 與 client 首次 render 一致(皆 disabled),mount 後再反映真實狀態,
// 使 mounted false→true 的 reactive 變化確實觸發 patch。
const mounted = ref(false)
// strip 顯示閘:SSR 會渲染未置中的日期格,先隱藏,等 Embla 置中到選取日後再淡入,
// 避免使用者看到「今天偏左 → 跳到中央」的閃動
const stripReady = ref(false)

function initCarousel() {
  const api = emblaApi()
  if (!api)
    return false
  // 瞬間定位到選取日(含還原 localStorage 的日期 / re-pray)
  scrollSelectedIntoCenter(true)
  // days 延伸導致 Embla reInit 後,重新置中到選取日(避免格數變動後跑位)
  api.on?.('reInit', () => scrollSelectedIntoCenter(true))
  stripReady.value = true
  return true
}

onMounted(() => {
  mounted.value = true
  // <ClientOnly> 內的 Embla 會晚一兩個 tick 才就緒,輪詢直到拿到 emblaApi 再置中並淡入,
  // 確保 strip 一顯示就已置中於選取日(不會看到回到第一天的跑位)
  nextTick(() => {
    if (initCarousel())
      return
    const timer = setInterval(() => {
      if (initCarousel())
        clearInterval(timer)
    }, 30)
    setTimeout(clearInterval, 1500, timer)
  })
})

watch(date, () => {
  if (!import.meta.client)
    return
  // 日期變動可能讓 days 延伸並觸發 Embla reInit;用 nextTick + rAF 等 reInit 完成再置中
  nextTick(() => requestAnimationFrame(() => scrollSelectedIntoCenter(true)))
})

// Theme dots — 每個圓圈疊一個不同的晴天娃娃表情
type FaceKind = 'smile' | 'happy' | 'wink'
interface ThemeDot { id: ThemeColor, color: string, face: FaceKind }
const themeDots: ThemeDot[] = [
  { id: 'sunny', color: '#B8DEF0', face: 'smile' },
  { id: 'sakura', color: '#FFD3DE', face: 'happy' },
  { id: 'matcha', color: '#C7DDB5', face: 'wink' },
]

function pickTheme(id: ThemeColor) {
  setTweak('themeColor', id)
  pluck(700)
}

// Start CTA：location.trim() 非空才可啟用(Business Invariant)
// 閘 mounted 以避免 SSR(空 location)→ disabled 與 client 還原值的 hydration 不一致
const canStart = computed(() => mounted.value && location.value.trim().length > 0)

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
        為一個日子，為一個地方，求一場好天氣
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
          :class="{ active: mounted && tweaks.themeColor === t.id }"
          :style="{ background: t.color }"
          @click="pickTheme(t.id)"
        >
          <!-- 晴天娃娃表情(每顆不同) -->
          <svg class="dot-face" viewBox="0 0 36 36" aria-hidden="true">
            <!-- 雙頰 -->
            <ellipse cx="11" cy="21" rx="2.6" ry="1.7" fill="#F2A8A2" opacity="0.7" />
            <ellipse cx="25" cy="21" rx="2.6" ry="1.7" fill="#F2A8A2" opacity="0.7" />

            <!-- 眼睛 -->
            <template v-if="t.face === 'happy'">
              <!-- 笑彎的眼(^ ^) -->
              <path d="M 11 16 Q 13 13 15 16" stroke="#1F2A3A" stroke-width="1.5" stroke-linecap="round" fill="none" />
              <path d="M 21 16 Q 23 13 25 16" stroke="#1F2A3A" stroke-width="1.5" stroke-linecap="round" fill="none" />
            </template>
            <template v-else-if="t.face === 'wink'">
              <!-- 眨眼:左圓點、右彎眼 -->
              <ellipse cx="13" cy="15" rx="1.5" ry="1.8" fill="#1F2A3A" />
              <path d="M 21 16 Q 23 13 25 16" stroke="#1F2A3A" stroke-width="1.5" stroke-linecap="round" fill="none" />
            </template>
            <template v-else>
              <!-- 圓點眼 -->
              <ellipse cx="13" cy="15" rx="1.5" ry="1.8" fill="#1F2A3A" />
              <ellipse cx="23" cy="15" rx="1.5" ry="1.8" fill="#1F2A3A" />
            </template>

            <!-- 嘴巴 -->
            <path
              v-if="t.face === 'wink'"
              d="M 15 22 Q 18 26 21 22" stroke="#9B5346" stroke-width="1.3" stroke-linecap="round" fill="none"
            />
            <path
              v-else
              d="M 15 21 Q 18 24 21 21" stroke="#9B5346" stroke-width="1.3" stroke-linecap="round" fill="none"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Date picker -->
    <div style="margin: 8px 0 0;">
      <p class="field-label" style="margin: 4px 0 0;">
        選擇日期
      </p>
      <div class="date-picker">
        <select aria-label="年" :value="date.getFullYear()" @change="setY(Number(($event.target as HTMLSelectElement).value))">
          <option v-for="y in years" :key="y" :value="y">
            {{ y }} 年
          </option>
        </select>
        <select aria-label="月" :value="date.getMonth()" @change="setM(Number(($event.target as HTMLSelectElement).value))">
          <option v-for="m in months" :key="m" :value="m">
            {{ m + 1 }} 月
          </option>
        </select>
        <select aria-label="日" :value="date.getDate()" @change="setD(Number(($event.target as HTMLSelectElement).value))">
          <option v-for="d in dayNums" :key="d" :value="d">
            {{ d }} 日
          </option>
        </select>
      </div>

      <div class="weekstrip-wrap" :style="{ opacity: stripReady ? 1 : 0, transition: 'opacity 0.25s ease' }">
        <!-- 日期軸完全依賴 localStorage 還原的日期,屬 client-only;
             用 ClientOnly 避免 SSR(讀不到 localStorage)與 client 的格數不一致導致 Embla 跑位 -->
        <ClientOnly>
          <UCarousel
            ref="carousel"
            v-slot="{ item: d }"
            :items="days"
            :start-index="selectedIndex"
            align="center"
            :drag-free="true"
            :contain-scroll="false"
            class="weekstrip"
            :ui="{ container: '-ms-2 py-3', item: 'ps-2 basis-auto' }"
          >
            <div
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
          </UCarousel>
        </ClientOnly>
      </div>
    </div>

    <!-- Location -->
    <div style="margin-top: 22px;">
      <p class="field-label">
        輸入地點
      </p>
      <input
        v-model="location"
        aria-label="選擇地點"
        class="loc-input"
        type="text"
        placeholder="例如:台北、京都…"
      >
    </div>

    <div class="start-cta" style="transform: translateY(-24px);">
      <button class="btn-primary" :disabled="!canStart" @click="handleStart">
        開始放晴
      </button>
      <div style="font-size: 11.5px; color: var(--muted); letter-spacing: 0.12em;">
        掛滿晴天娃娃就會放晴
      </div>
    </div>
  </div>
</template>

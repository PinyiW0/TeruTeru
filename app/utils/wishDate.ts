// 日期相關 utility 與常數,給 SetupScreen / PrayingScreen / CompleteScreen 共用
// 直譯自 spec/ui-config/ui-reference/setup.jsx

export const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'] as const

export const COMMON_LOCATIONS = [
  '台北',
  '台中',
  '高雄',
  '東京',
  '大阪',
  '京都',
  '首爾',
  '沖繩',
] as const

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

export function formatDateCN(d: Date): string {
  const w = WEEKDAY_LABELS[d.getDay()]
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日（${w}）`
}

// 產出 -3 ~ max(+60, untilOffset+14) 天供 week strip 使用
// `until` 若超出預設 +60 範圍,延伸 strip 涵蓋到 until+14 天,保證下拉選的日期一定在 strip 內
export function buildDays(today: Date, until?: Date): Date[] {
  const days: Date[] = []
  const minOff = -3
  const defaultMaxOff = 60
  const paddingAfterUntil = 14
  let maxOff = defaultMaxOff
  if (until) {
    const oneDayMs = 24 * 60 * 60 * 1000
    const untilOff = Math.round((+until - +today) / oneDayMs)
    maxOff = Math.max(defaultMaxOff, untilOff + paddingAfterUntil)
  }
  for (let off = minOff; off <= maxOff; off++) {
    const d = new Date(today)
    d.setDate(d.getDate() + off)
    days.push(d)
  }
  return days
}

export function todayMidnight(): Date {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return t
}

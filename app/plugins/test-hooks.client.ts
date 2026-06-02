// 將 wishFlow / teruAudio / tweaks composable 實例掛到 window，供 E2E spec 透過 evaluate 操作
// 僅 client side 執行，SSR 不會建立任何全域引用
export default defineNuxtPlugin(() => {
  const wish = useWishFlow()
  const audio = useTeruAudio()
  const tweaks = useTweaks()

  const w = window as unknown as {
    __wish: typeof wish
    __teruAudio: typeof audio
    __tweaks: typeof tweaks
  }
  w.__wish = wish
  w.__teruAudio = audio
  w.__tweaks = tweaks
})

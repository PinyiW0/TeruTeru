<script setup lang="ts">
const { phase, transition } = useWishFlow()

// SEO — 首頁分享卡片與搜尋摘要(主要流量來自朋友間分享連結,OG 卡片務必完整)
const siteUrl = 'https://pinyiw0.github.io/TeruTeru/'
const ogImage = `${siteUrl}og-image.png`

useSeoMeta({
  title: 'Teru Teru 放晴吧！— 祈求好天氣的晴天娃娃',
  description: '為一個日子、為一個地方，掛上晴天娃娃，求一場好天氣。三段祈福流程，搭配可客製的主題色與晴天娃娃互動。',
  ogType: 'website',
  ogUrl: siteUrl,
  ogTitle: 'Teru Teru 放晴吧！',
  ogDescription: '為一個日子、為一個地方，掛上晴天娃娃，求一場好天氣。',
  ogImage,
  ogLocale: 'zh_TW',
  ogSiteName: 'Teru Teru 放晴吧！',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Teru Teru 放晴吧！',
  twitterDescription: '為一個日子、為一個地方，掛上晴天娃娃，求一場好天氣。',
  twitterImage: ogImage,
})

useHead({
  link: [{ rel: 'canonical', href: siteUrl }],
  script: [
    {
      type: 'application/ld+json',
      // 結構化資料,讓搜尋引擎理解這是一個免費的互動式祈福網頁應用
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'Teru Teru 放晴吧！',
        'url': siteUrl,
        'description': '為一個日子、為一個地方，掛上晴天娃娃，求一場好天氣。',
        'applicationCategory': 'LifestyleApplication',
        'operatingSystem': 'Web',
        'inLanguage': 'zh-Hant',
        'image': ogImage,
        'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'TWD' },
      }),
    },
  ],
})
</script>

<template>
  <div class="stage" data-screen-root>
    <DollDefs />

    <SetupScreen v-if="phase === 'setup'" />
    <PrayingScreen v-else-if="phase === 'praying'" />
    <CompleteScreen v-else />

    <LoadingScreen v-if="transition" />
  </div>
</template>

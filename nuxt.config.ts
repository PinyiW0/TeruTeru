// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/eslint', '@pinia/nuxt', 'pinia-plugin-persistedstate/nuxt'],
  eslint: {
    config: {
      standalone: false,
    },
  },
  css: ['~/assets/css/main.css', '~/assets/css/teru.css'],
  app: {
    head: {
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Huninn&family=Klee+One:wght@400;600&family=Zen+Maru+Gothic:wght@400;500;700&family=Noto+Sans+TC:wght@400;500;700&family=Yuji+Boku&display=swap',
        },
      ],
    },
  },
  // Nuxt UI 配置
  ui: {
    theme: {
      colors: ['primary', 'secondary', 'info', 'success', 'warning', 'error', 'neutral'],
    },
  },
})

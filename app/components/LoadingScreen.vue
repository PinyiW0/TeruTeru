<script setup lang="ts">
// 1:1 port of spec/ui-config/ui-reference/complete.jsx::LoadingScreen
// 無 props、無 setTimeout — 何時消失由 useWishFlow.transition 控制
// 注:reference 原本有 rain strands 斜線,但 preserveAspectRatio="none" 拉伸後角度跑掉,移除
</script>

<template>
  <div class="loader loading-screen" data-screen-label="Loading" data-testid="wish-loading-screen">
    <!-- 中央背後小 Sun -->
    <div class="loader-sun">
      <SunIcon :size="140" />
    </div>

    <!-- 左 curtain -->
    <div class="loader-curtain-l">
      <svg width="100%" height="100%" viewBox="0 0 360 600" preserveAspectRatio="none">
        <defs>
          <linearGradient id="cloudL" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#5F6F84" />
            <stop offset="100%" stop-color="#7A8AA0" />
          </linearGradient>
        </defs>
        <path
          d="M -40 0
             L 280 0
             C 290 40, 240 55, 260 90
             C 280 120, 240 135, 260 165
             C 280 195, 220 215, 250 250
             C 280 290, 220 305, 250 340
             C 280 375, 230 395, 255 430
             C 280 470, 220 490, 250 525
             C 280 560, 220 580, 240 600
             L -40 600 Z"
          fill="url(#cloudL)"
        />
      </svg>
    </div>

    <!-- 右 curtain(鏡像) -->
    <div class="loader-curtain-r">
      <svg width="100%" height="100%" viewBox="0 0 360 600" preserveAspectRatio="none">
        <defs>
          <linearGradient id="cloudR" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stop-color="#5F6F84" />
            <stop offset="100%" stop-color="#7A8AA0" />
          </linearGradient>
        </defs>
        <path
          d="M 400 0
             L 80 0
             C 70 40, 120 55, 100 90
             C 80 120, 120 135, 100 165
             C 80 195, 140 215, 110 250
             C 80 290, 140 305, 110 340
             C 80 375, 130 395, 105 430
             C 80 470, 140 490, 110 525
             C 80 560, 140 580, 120 600
             L 400 600 Z"
          fill="url(#cloudR)"
        />
      </svg>
    </div>

    <!-- 底部 tagline -->
    <div class="loader-text">
      Loading
      <span class="dot" />
      <span class="dot" />
      <span class="dot" />
      &nbsp; Sunshine
    </div>
  </div>
</template>

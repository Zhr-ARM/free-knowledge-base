<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  src: string
  title: string
  size?: string
}>()

const ready = ref(false)
const loaded = ref(false)
const slow = ref(false)
let slowTimer: number | undefined
let fallbackTimer: number | undefined

function clearTimers() {
  if (slowTimer) window.clearTimeout(slowTimer)
  if (fallbackTimer) window.clearTimeout(fallbackTimer)
  slowTimer = undefined
  fallbackTimer = undefined
}

function startTimers() {
  clearTimers()
  slowTimer = window.setTimeout(() => {
    slow.value = true
  }, 4500)
  fallbackTimer = window.setTimeout(() => {
    loaded.value = true
  }, 20000)
}

function handleLoad(event: Event) {
  const iframe = event.currentTarget as HTMLIFrameElement

  try {
    if (iframe.contentWindow?.location.href === 'about:blank') return
  } catch {
    // Native PDF viewers can move the frame into an isolated browser extension.
  }

  loaded.value = true
  clearTimers()
}

onMounted(() => {
  startTimers()
  ready.value = true
})

onBeforeUnmount(clearTimers)

watch(
  () => props.src,
  () => {
    loaded.value = false
    slow.value = false
    startTimers()
  }
)
</script>

<template>
  <div class="kb-pdf-preview" :class="{ 'is-loaded': loaded }" :aria-busy="!loaded">
    <Transition name="kb-pdf-loading">
      <div v-if="!loaded" class="kb-pdf-loading" role="status" aria-live="polite">
        <div class="kb-pdf-loading-content">
          <span class="kb-pdf-spinner" aria-hidden="true"></span>
          <p class="kb-pdf-loading-title">{{ slow ? 'PDF 仍在加载' : '正在载入 PDF' }}</p>
          <p class="kb-pdf-loading-meta">
            <template v-if="size">{{ size }} · </template>
            {{ slow ? '文件较大，请稍候' : '正在准备阅读界面' }}
          </p>
          <span class="kb-pdf-loading-track" aria-hidden="true">
            <span class="kb-pdf-loading-bar"></span>
          </span>
          <a
            v-if="slow"
            class="kb-pdf-loading-link"
            :href="src"
            target="_blank"
            rel="noopener"
          >
            在新窗口打开
          </a>
        </div>
      </div>
    </Transition>

    <iframe
      v-if="ready"
      :src="src"
      :title="title"
      loading="eager"
      allowfullscreen
      @load="handleLoad"
    ></iframe>
  </div>
</template>

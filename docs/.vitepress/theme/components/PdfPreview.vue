<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import modernPdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import legacyPdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
import type {
  DocumentInitParameters,
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  RenderTask
} from 'pdfjs-dist'

const props = defineProps<{
  src: string
  title: string
  size?: string
  previewSrc?: string
}>()

type PdfJsModule = typeof import('pdfjs-dist')

const canvas = ref<HTMLCanvasElement | null>(null)
const preview = ref<HTMLDivElement | null>(null)
const loading = ref(true)
const rendering = ref(false)
const errorMessage = ref('')
const progress = ref<number | null>(null)
const pageNumber = ref(1)
const pageInput = ref('1')
const pageCount = ref(0)
const zoom = ref(1)

let loadingTask: PDFDocumentLoadingTask | undefined
let pdfDocument: PDFDocumentProxy | undefined
let renderTask: RenderTask | undefined
let resizeObserver: ResizeObserver | undefined
let resizeFrame: number | undefined
let loadVersion = 0
let renderVersion = 0
const fetchControllers = new Set<AbortController>()
const rangeChunkSize = 256 * 1024
const tailPrefetchSize = 768 * 1024

const progressStyle = computed(() => ({
  width: progress.value === null ? '34%' : `${Math.max(4, progress.value)}%`
}))

const zoomLabel = computed(() => `${Math.round(zoom.value * 100)}%`)

function cancelRender() {
  renderVersion += 1
  renderTask?.cancel()
  renderTask = undefined
}

function releaseDocument() {
  cancelRender()
  for (const controller of fetchControllers) controller.abort()
  fetchControllers.clear()
  const task = loadingTask
  loadingTask = undefined
  pdfDocument = undefined
  void task?.destroy().catch((error) => {
    console.error('PDF cleanup failed', error)
  })
}

async function loadDocument() {
  const currentLoad = ++loadVersion
  releaseDocument()
  loading.value = true
  rendering.value = false
  errorMessage.value = ''
  progress.value = null
  pageNumber.value = 1
  pageInput.value = '1'
  pageCount.value = 0
  zoom.value = 1

  try {
    const { pdfjs, workerUrl } = await loadPdfJs()
    if (currentLoad !== loadVersion) return

    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
    const source = await createPdfSource(pdfjs, currentLoad)
    if (currentLoad !== loadVersion) return

    loadingTask = pdfjs.getDocument(source)
    loadingTask.onProgress = ({ loaded, total }) => {
      if (currentLoad !== loadVersion || !total) return
      progress.value = Math.min(100, Math.round((loaded / total) * 100))
    }

    pdfDocument = await loadingTask.promise
    if (currentLoad !== loadVersion) return

    pageCount.value = pdfDocument.numPages
    await nextTick()
    await renderCurrentPage()
    if (currentLoad === loadVersion) loading.value = false
  } catch (error) {
    if (currentLoad !== loadVersion) return
    loading.value = false
    errorMessage.value = '在线预览暂时无法打开，请使用新窗口阅读或下载文件。'
    console.error('PDF preview failed', error)
  }
}

async function loadPdfJs(): Promise<{ pdfjs: PdfJsModule, workerUrl: string }> {
  if (supportsModernPdfJs()) {
    return {
      pdfjs: await import('pdfjs-dist'),
      workerUrl: modernPdfWorkerUrl
    }
  }

  return {
    pdfjs: await import('pdfjs-dist/legacy/build/pdf.mjs') as PdfJsModule,
    workerUrl: legacyPdfWorkerUrl
  }
}

function supportsModernPdfJs() {
  return (
    typeof (Promise as any).withResolvers === 'function' &&
    typeof (Promise as any).try === 'function' &&
    typeof (URL as any).parse === 'function' &&
    typeof AbortSignal !== 'undefined' &&
    typeof (AbortSignal as any).any === 'function' &&
    typeof structuredClone === 'function'
  )
}

async function createPdfSource(
  pdfjs: PdfJsModule,
  currentLoad: number
): Promise<DocumentInitParameters> {
  const initialResponse = await fetchPdfRange(0, rangeChunkSize)
  const initialData = initialResponse.data
  const totalSize = readTotalSize(initialResponse.headers.get('content-range'))

  if (initialResponse.status !== 206 || !totalSize || initialData.byteLength >= totalSize) {
    progress.value = 100
    return { data: initialData, docBaseUrl: props.src }
  }

  let loadedBytes = initialData.byteLength
  progress.value = Math.max(1, Math.round((loadedBytes / totalSize) * 100))
  const tailBegin = Math.max(initialData.byteLength, totalSize - tailPrefetchSize)
  const tailPromise = tailBegin < totalSize
    ? fetchPdfRange(tailBegin, totalSize)
      .then((response) => {
        if (currentLoad !== loadVersion) return undefined
        const data = response.status === 206
          ? response.data
          : response.data.slice(tailBegin, totalSize)
        loadedBytes = Math.min(totalSize, loadedBytes + data.byteLength)
        progress.value = Math.max(1, Math.round((loadedBytes / totalSize) * 100))
        return data
      })
      .catch((error) => {
        if (!isAbortError(error) && currentLoad === loadVersion) {
          console.warn('PDF tail prefetch failed; falling back to range requests', error)
        }
        return undefined
      })
    : Promise.resolve<Uint8Array | undefined>(undefined)

  class HttpRangeTransport extends pdfjs.PDFDataRangeTransport {
    constructor() {
      super(totalSize, initialData)
    }

    requestDataRange(begin: number, end: number) {
      void this.provideRange(begin, end).catch((error) => {
        if (isAbortError(error)) return
        if (currentLoad !== loadVersion) return
        loading.value = false
        errorMessage.value = '网络读取中断，请重试或在新窗口中打开。'
        void loadingTask?.destroy().catch(() => {})
        console.error('PDF range request failed', error)
      })
    }

    async provideRange(begin: number, end: number) {
      if (begin >= tailBegin && end <= totalSize) {
        const tailData = await tailPromise
        if (tailData && currentLoad === loadVersion) {
          this.onDataRange(begin, tailData.slice(begin - tailBegin, end - tailBegin))
          return
        }
      }

      const response = await fetchPdfRange(begin, end)
      if (currentLoad !== loadVersion) return

      const chunk = response.status === 206
        ? response.data
        : response.data.slice(begin, end)
      loadedBytes = Math.min(totalSize, loadedBytes + chunk.byteLength)
      progress.value = Math.max(1, Math.round((loadedBytes / totalSize) * 100))
      this.onDataRange(begin, chunk)
    }

    abort() {
      for (const controller of fetchControllers) controller.abort()
      fetchControllers.clear()
    }
  }

  return {
    range: new HttpRangeTransport(),
    docBaseUrl: props.src,
    disableStream: true,
    disableAutoFetch: true,
    rangeChunkSize
  }
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError'
}

async function fetchPdfRange(begin: number, end: number) {
  const controller = new AbortController()
  fetchControllers.add(controller)

  try {
    const response = await fetch(props.src, {
      headers: {
        Range: `bytes=${begin}-${Math.max(begin, end - 1)}`
      },
      signal: controller.signal
    })

    if (!response.ok) throw new Error(`PDF request failed with ${response.status}`)
    return {
      status: response.status,
      headers: response.headers,
      data: new Uint8Array(await response.arrayBuffer())
    }
  } finally {
    fetchControllers.delete(controller)
  }
}

function readTotalSize(contentRange: string | null) {
  const match = contentRange?.match(/\/(\d+)$/)
  return match ? Number.parseInt(match[1], 10) : 0
}

async function renderCurrentPage() {
  if (!pdfDocument || !canvas.value || !preview.value) return

  const currentRender = ++renderVersion
  renderTask?.cancel()
  rendering.value = true

  try {
    const page = await pdfDocument.getPage(pageNumber.value)
    if (currentRender !== renderVersion) return

    const baseViewport = page.getViewport({ scale: 1 })
    const horizontalPadding = window.innerWidth <= 640 ? 24 : 48
    const availableWidth = Math.max(240, preview.value.clientWidth - horizontalPadding)
    const fitScale = availableWidth / baseViewport.width
    const viewport = page.getViewport({ scale: fitScale * zoom.value })
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    const context = canvas.value.getContext('2d', { alpha: false })

    if (!context) throw new Error('Canvas 2D context is unavailable')

    canvas.value.width = Math.floor(viewport.width * pixelRatio)
    canvas.value.height = Math.floor(viewport.height * pixelRatio)
    canvas.value.style.width = `${Math.floor(viewport.width)}px`
    canvas.value.style.height = `${Math.floor(viewport.height)}px`

    renderTask = page.render({
      canvas: canvas.value,
      canvasContext: context,
      viewport,
      transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
      background: '#ffffff'
    })
    await renderTask.promise
    if (currentRender === renderVersion) rendering.value = false
  } catch (error) {
    if (currentRender !== renderVersion) return
    if (error instanceof Error && error.name === 'RenderingCancelledException') return
    rendering.value = false
    errorMessage.value = '这一页暂时无法显示，请在新窗口中继续阅读。'
    console.error('PDF page render failed', error)
  }
}

function scheduleRender() {
  if (!pdfDocument) return
  if (resizeFrame) window.cancelAnimationFrame(resizeFrame)
  resizeFrame = window.requestAnimationFrame(() => {
    void renderCurrentPage()
  })
}

function goToPage(value: number) {
  if (!pdfDocument || pageCount.value === 0) return
  const target = Math.min(pageCount.value, Math.max(1, Math.round(value)))
  pageNumber.value = target
  pageInput.value = String(target)
  preview.value?.scrollTo({ top: 0, behavior: 'smooth' })
  void renderCurrentPage()
}

function commitPageInput() {
  const value = Number.parseInt(pageInput.value, 10)
  goToPage(Number.isFinite(value) ? value : pageNumber.value)
}

function changeZoom(delta: number) {
  zoom.value = Math.min(2.5, Math.max(0.6, Number((zoom.value + delta).toFixed(2))))
  void renderCurrentPage()
}

function resetZoom() {
  zoom.value = 1
  void renderCurrentPage()
}

onMounted(() => {
  resizeObserver = new ResizeObserver(scheduleRender)
  if (preview.value) resizeObserver.observe(preview.value)
  void loadDocument()
})

onBeforeUnmount(() => {
  loadVersion += 1
  resizeObserver?.disconnect()
  if (resizeFrame) window.cancelAnimationFrame(resizeFrame)
  releaseDocument()
})

watch(() => props.src, loadDocument)
</script>

<template>
  <div class="kb-pdf-viewer">
    <div class="kb-pdf-toolbar" :class="{ 'is-pending': !pageCount }" aria-label="PDF 阅读工具栏">
      <div class="kb-pdf-toolbar-group">
        <button
          type="button"
          class="kb-icon-button"
          :disabled="!pageCount || pageNumber <= 1 || rendering"
          title="上一页"
          aria-label="上一页"
          @click="goToPage(pageNumber - 1)"
        >
          &#8249;
        </button>
        <label class="kb-page-control">
          <span class="visually-hidden">页码</span>
          <input
            v-model="pageInput"
            type="number"
            min="1"
            :max="pageCount"
            :disabled="!pageCount"
            inputmode="numeric"
            @change="commitPageInput"
            @keydown.enter="commitPageInput"
          >
          <span>/ {{ pageCount || '—' }}</span>
        </label>
        <button
          type="button"
          class="kb-icon-button"
          :disabled="!pageCount || pageNumber >= pageCount || rendering"
          title="下一页"
          aria-label="下一页"
          @click="goToPage(pageNumber + 1)"
        >
          &#8250;
        </button>
      </div>

      <div class="kb-pdf-toolbar-group">
        <button
          type="button"
          class="kb-icon-button"
          :disabled="!pageCount || zoom <= 0.6 || rendering"
          title="缩小"
          aria-label="缩小"
          @click="changeZoom(-0.15)"
        >
          &minus;
        </button>
        <button
          type="button"
          class="kb-zoom-value"
          :disabled="!pageCount || zoom === 1 || rendering"
          title="适合页面宽度"
          @click="resetZoom"
        >
          {{ zoomLabel }}
        </button>
        <button
          type="button"
          class="kb-icon-button"
          :disabled="!pageCount || zoom >= 2.5 || rendering"
          title="放大"
          aria-label="放大"
          @click="changeZoom(0.15)"
        >
          +
        </button>
      </div>
    </div>

    <div ref="preview" class="kb-pdf-preview" :aria-busy="loading || rendering">
      <div
        v-if="errorMessage"
        class="kb-pdf-error"
        :class="{ 'has-preview': previewSrc }"
        role="alert"
      >
        <img
          v-if="previewSrc"
          class="kb-pdf-error-preview"
          :src="previewSrc"
          :alt="`${title}，第一页预览`"
          loading="eager"
          decoding="async"
        >
        <div class="kb-pdf-error-content">
          <strong>完整阅读器暂时不可用</strong>
          <p>{{ errorMessage }}</p>
          <div class="kb-pdf-error-actions">
            <button type="button" class="kb-download-button" @click="loadDocument">重新加载</button>
            <a
              :href="src"
              class="kb-download-button kb-download-button-secondary"
              target="_blank"
              rel="noopener"
            >打开原文件</a>
          </div>
        </div>
      </div>

      <div
        v-else
        class="kb-pdf-canvas-stage"
        :class="{
          'is-rendering': rendering && !loading,
          'has-placeholder': loading && previewSrc
        }"
      >
        <img
          v-if="loading && previewSrc"
          class="kb-pdf-placeholder"
          :src="previewSrc"
          :alt="`${title}，第一页预览`"
          loading="eager"
          fetchpriority="high"
          decoding="async"
        >
        <canvas
          ref="canvas"
          :class="{ 'is-waiting': loading && previewSrc }"
          role="img"
          :aria-label="`${title}，第 ${pageNumber} 页，共 ${pageCount} 页`"
        ></canvas>
        <span v-if="rendering && !loading" class="kb-page-loading" role="status">正在读取第 {{ pageNumber }} 页</span>
      </div>

      <div
        v-if="loading"
        class="kb-pdf-loading"
        :class="{ 'has-preview': previewSrc }"
        role="status"
        aria-live="polite"
      >
        <div class="kb-pdf-loading-content">
          <span class="kb-pdf-spinner" aria-hidden="true"></span>
          <p class="kb-pdf-loading-title">{{ previewSrc ? '正在准备翻页' : '正在读取第一页' }}</p>
          <p class="kb-pdf-loading-meta">
            <template v-if="size">{{ size }} &middot; </template>
            {{ previewSrc ? '完整阅读载入中' : '分段载入中' }}
          </p>
          <span class="kb-pdf-loading-track" aria-hidden="true">
            <span class="kb-pdf-loading-bar" :style="progressStyle"></span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

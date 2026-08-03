<script setup lang="ts">
import {
  ChevronLeft,
  ChevronRight,
  CloudDownload,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  ScanLine
} from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import modernPdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import legacyPdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
import type {
  DocumentInitParameters,
  OnProgressParameters,
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  RenderTask
} from 'pdfjs-dist/types/src/display/api'

const props = defineProps<{
  src: string
  originalSrc?: string
  title: string
  size?: string
  sizeBytes?: number
  previewSrc?: string
  previewSrcs?: string[]
  pageCountHint?: number
  initialBytesHint?: number
}>()

type PdfJsModule = typeof import('pdfjs-dist')
type ScrollAnchor = { x: number, y: number }
type ProgressivePdfTransport = {
  onDataProgressiveRead: (chunk: Uint8Array) => void
  onDataProgressiveDone: () => void
}
type NetworkInformationLike = EventTarget & {
  effectiveType?: string
  saveData?: boolean
}

const canvas = ref<HTMLCanvasElement | null>(null)
const preview = ref<HTMLDivElement | null>(null)
const viewer = ref<HTMLDivElement | null>(null)
const loading = ref(true)
const documentReady = ref(false)
const rendering = ref(false)
const fullscreenAvailable = ref(false)
const isFullscreen = ref(false)
const panning = ref(false)
const backgroundProgress = ref<number | null>(null)
const backgroundActive = ref(false)
const backgroundDeferred = ref(false)
const errorMessage = ref('')
const progress = ref<number | null>(null)
const pageNumber = ref(1)
const pageInput = ref('1')
const pageCount = ref(normalizedPageCountHint())
const zoom = ref(1)

let loadingTask: PDFDocumentLoadingTask | undefined
let pdfDocument: PDFDocumentProxy | undefined
let renderTask: RenderTask | undefined
let resizeObserver: ResizeObserver | undefined
let resizeFrame: number | undefined
let backgroundController: AbortController | undefined
let beginBackgroundLoad: (() => Promise<void>) | undefined
let pendingBackgroundLoad: (() => Promise<void>) | undefined
let backgroundWorkerReady: Promise<void> | undefined
let networkInformation: NetworkInformationLike | undefined
let foregroundRequestCount = 0
let loadVersion = 0
let renderVersion = 0
let warmPreviewTimer: number | undefined
const warmedPreviewImages: HTMLImageElement[] = []
const fetchControllers = new Set<AbortController>()
const rangeChunkSize = 256 * 1024
const tailPrefetchSize = 768 * 1024
const backgroundReadDelay = 40
const backgroundRetryLimit = 3
const foregroundRetryLimit = 2
const foregroundTimeout = 20000
const mobileBackgroundLimit = 32 * 1024 * 1024
let panOrigin: { x: number, y: number, left: number, top: number } | undefined

const previewSources = computed(() => {
  const sources = props.previewSrcs?.filter(Boolean) || []
  if (sources.length > 0) return sources
  return props.previewSrc ? [props.previewSrc] : []
})

const activePreviewSrc = computed(() => previewSources.value[pageNumber.value - 1] || '')

const previewNavigationLimit = computed(() => Math.min(
  previewSources.value.length,
  pageCount.value || previewSources.value.length
))

const navigationLimit = computed(() => (
  documentReady.value ? pageCount.value : previewNavigationLimit.value
))

const originalFileSrc = computed(() => props.originalSrc || props.src)

const progressStyle = computed(() => ({
  width: progress.value === null ? '34%' : `${Math.max(4, progress.value)}%`
}))

const zoomLabel = computed(() => `${Math.round(zoom.value * 100)}%`)

const backgroundProgressStyle = computed(() => ({
  width: `${Math.max(1, backgroundProgress.value || 0)}%`
}))

function normalizedPageCountHint() {
  const value = Number(props.pageCountHint)
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 0
}

function cancelRender() {
  renderVersion += 1
  renderTask?.cancel()
  renderTask = undefined
}

function releaseDocument() {
  cancelRender()
  documentReady.value = false
  backgroundController?.abort()
  backgroundController = undefined
  beginBackgroundLoad = undefined
  pendingBackgroundLoad = undefined
  backgroundWorkerReady = undefined
  backgroundActive.value = false
  backgroundDeferred.value = false
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
  backgroundProgress.value = null
  backgroundActive.value = false
  pageNumber.value = 1
  pageInput.value = '1'
  pageCount.value = normalizedPageCountHint()
  zoom.value = 1

  try {
    const { pdfjs, workerUrl } = await loadPdfJs()
    if (currentLoad !== loadVersion) return

    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
    const source = await createPdfSource(pdfjs, currentLoad)
    if (currentLoad !== loadVersion) return

    loadingTask = pdfjs.getDocument(source)
    loadingTask.onProgress = ({ loaded, total }: OnProgressParameters) => {
      if (currentLoad !== loadVersion || !total) return
      progress.value = Math.min(100, Math.round((loaded / total) * 100))
    }

    pdfDocument = await loadingTask.promise
    if (currentLoad !== loadVersion) return

    pageCount.value = pdfDocument.numPages
    pageNumber.value = Math.min(pageNumber.value, pageCount.value)
    pageInput.value = String(pageNumber.value)
    documentReady.value = true
    await nextTick()
    await renderCurrentPage()
    if (currentLoad === loadVersion) {
      loading.value = false
      const backgroundLoad = beginBackgroundLoad
      beginBackgroundLoad = undefined
      if (backgroundLoad) {
        if (shouldAutoCachePdf()) {
          void backgroundLoad()
        } else {
          pendingBackgroundLoad = backgroundLoad
          backgroundDeferred.value = true
        }
      }
    }
  } catch (error) {
    if (currentLoad !== loadVersion) return
    loading.value = false
    documentReady.value = false
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
  const hintedInitialSize = Math.max(0, Number(props.initialBytesHint) || 0)
  const initialRequestSize = hintedInitialSize > 0
    ? Math.ceil(hintedInitialSize / rangeChunkSize) * rangeChunkSize
    : rangeChunkSize
  const initialResponse = await fetchPdfRange(0, initialRequestSize, currentLoad)
  const initialData = initialResponse.data
  const initialSize = initialData.byteLength
  const totalSize = readTotalSize(initialResponse.headers.get('content-range'))

  if (initialResponse.status !== 206 || !totalSize || initialSize >= totalSize) {
    progress.value = 100
    backgroundProgress.value = 100
    return { data: initialData, docBaseUrl: props.src }
  }

  let loadedBytes = initialSize
  progress.value = Math.max(1, Math.round((loadedBytes / totalSize) * 100))
  const tailSize = isLinearizedPdf(initialData) ? rangeChunkSize : tailPrefetchSize
  const tailBegin = Math.max(initialSize, totalSize - tailSize)
  const tailPromise = tailBegin < totalSize
    ? fetchPdfRange(tailBegin, totalSize, currentLoad)
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

      const response = await fetchPdfRange(begin, end, currentLoad)
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

  const transport = new HttpRangeTransport()
  beginBackgroundLoad = () => streamPdfInBackground(
    transport,
    initialSize,
    totalSize,
    currentLoad
  )

  return {
    range: transport,
    docBaseUrl: props.src,
    disableStream: true,
    disableAutoFetch: true,
    rangeChunkSize
  }
}

function isLinearizedPdf(data: Uint8Array) {
  const header = new TextDecoder('latin1').decode(data.subarray(0, Math.min(data.byteLength, 4096)))
  return /\/Linearized(?:\s|$)/.test(header)
}

function isAbortError(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'name' in error && error.name === 'AbortError')
}

async function fetchPdfRange(begin: number, end: number, currentLoad: number) {
  foregroundRequestCount += 1

  try {
    let lastError: unknown

    for (let attempt = 0; attempt <= foregroundRetryLimit; attempt += 1) {
      if (currentLoad !== loadVersion) throw createAbortError()

      const controller = new AbortController()
      let timedOut = false
      fetchControllers.add(controller)
      const timeout = window.setTimeout(() => {
        timedOut = true
        controller.abort()
      }, foregroundTimeout)

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
      } catch (error) {
        if (currentLoad !== loadVersion || (isAbortError(error) && !timedOut)) throw error
        lastError = timedOut ? new Error('PDF request timed out') : error
        if (attempt >= foregroundRetryLimit) throw lastError
        await delay(300 * (attempt + 1))
      } finally {
        window.clearTimeout(timeout)
        fetchControllers.delete(controller)
      }
    }

    throw lastError || new Error('PDF request failed')
  } finally {
    foregroundRequestCount = Math.max(0, foregroundRequestCount - 1)
  }
}

function createAbortError() {
  return new DOMException('PDF loading was cancelled', 'AbortError')
}

function readNetworkInformation() {
  return (navigator as Navigator & { connection?: NetworkInformationLike }).connection
}

function shouldAutoCachePdf() {
  const connection = networkInformation || readNetworkInformation()
  if (connection?.saveData) return false
  if (connection?.effectiveType && ['slow-2g', '2g', '3g'].includes(connection.effectiveType)) {
    return false
  }
  const isLikelyMobile = navigator.maxTouchPoints > 0 && window.innerWidth <= 900
  if (isLikelyMobile && (props.sizeBytes || 0) > mobileBackgroundLimit) return false
  return true
}

function startDeferredBackgroundLoad() {
  const backgroundLoad = pendingBackgroundLoad
  if (!backgroundLoad) return
  pendingBackgroundLoad = undefined
  backgroundDeferred.value = false
  void backgroundLoad()
}

function handleNetworkChange() {
  if (backgroundDeferred.value && shouldAutoCachePdf()) startDeferredBackgroundLoad()
}

function readTotalSize(contentRange: string | null) {
  const match = contentRange?.match(/\/(\d+)$/)
  return match ? Number.parseInt(match[1], 10) : 0
}

function readRangeStart(contentRange: string | null) {
  const match = contentRange?.match(/^bytes\s+(\d+)-/i)
  return match ? Number.parseInt(match[1], 10) : null
}

async function streamPdfInBackground(
  transport: ProgressivePdfTransport,
  startOffset: number,
  totalSize: number,
  currentLoad: number
) {
  let nextOffset = startOffset
  let consecutiveFailures = 0
  let workerReady: Promise<void> | undefined
  backgroundActive.value = true
  backgroundProgress.value = Math.max(1, Math.round((nextOffset / totalSize) * 100))

  try {
    while (nextOffset < totalSize && currentLoad === loadVersion) {
      if (!await waitForBackgroundSlot(currentLoad)) return

      const attemptStart = nextOffset
      const controller = new AbortController()
      backgroundController = controller

      try {
        const request: RequestInit & { priority?: 'low' } = {
          headers: { Range: `bytes=${nextOffset}-${totalSize - 1}` },
          signal: controller.signal,
          priority: 'low'
        }
        const response = await fetch(props.src, request)
        if (!response.ok) throw new Error(`PDF background request failed with ${response.status}`)

        const responseStart = response.status === 206
          ? (readRangeStart(response.headers.get('content-range')) ?? nextOffset)
          : 0
        if (responseStart > nextOffset) {
          throw new Error(`PDF background response skipped bytes ${nextOffset}-${responseStart - 1}`)
        }

        let bytesToSkip = nextOffset - responseStart
        const pushChunk = async (sourceChunk: Uint8Array) => {
          if (bytesToSkip >= sourceChunk.byteLength) {
            bytesToSkip -= sourceChunk.byteLength
            return true
          }

          let chunk = bytesToSkip > 0
            ? sourceChunk.slice(bytesToSkip)
            : sourceChunk
          bytesToSkip = 0
          if (chunk.byteLength > totalSize - nextOffset) {
            chunk = chunk.slice(0, totalSize - nextOffset)
          }

          if (!await waitForBackgroundSlot(currentLoad)) return false
          const chunkLength = chunk.byteLength
          transport.onDataProgressiveRead(chunk)
          nextOffset += chunkLength
          backgroundProgress.value = Math.min(100, Math.round((nextOffset / totalSize) * 100))
          if (nextOffset < totalSize) await delay(backgroundReadDelay)
          return currentLoad === loadVersion
        }

        if (response.body) {
          const reader = response.body.getReader()
          while (true) {
            const { value, done } = await reader.read()
            if (done) break
            if (!await pushChunk(value)) {
              await reader.cancel()
              return
            }
          }
        } else if (!await pushChunk(new Uint8Array(await response.arrayBuffer()))) {
          return
        }

        if (nextOffset < totalSize) throw new Error('PDF background response ended early')
      } catch (error) {
        if (isAbortError(error) || currentLoad !== loadVersion) return
        consecutiveFailures = nextOffset > attemptStart ? 1 : consecutiveFailures + 1
        if (consecutiveFailures > backgroundRetryLimit) throw error
        await delay(400 * consecutiveFailures)
      } finally {
        if (backgroundController === controller) backgroundController = undefined
      }
    }

    if (currentLoad === loadVersion && nextOffset >= totalSize) {
      transport.onDataProgressiveDone()
      workerReady = pdfDocument?.getDownloadInfo().then(() => undefined)
      backgroundWorkerReady = workerReady
      backgroundProgress.value = 100
      await workerReady
    }
  } catch (error) {
    if (!isAbortError(error) && currentLoad === loadVersion) {
      console.warn('PDF background loading stopped; on-demand reading remains available', error)
    }
  } finally {
    if (backgroundWorkerReady === workerReady) backgroundWorkerReady = undefined
    if (currentLoad === loadVersion) backgroundActive.value = false
  }
}

async function waitForBackgroundSlot(currentLoad: number) {
  while (
    currentLoad === loadVersion &&
    (foregroundRequestCount > 0 || rendering.value || document.hidden)
  ) {
    await delay(document.hidden ? 400 : 60)
  }
  return currentLoad === loadVersion
}

function delay(duration: number) {
  return new Promise((resolve) => window.setTimeout(resolve, duration))
}

async function renderCurrentPage(scrollAnchor?: ScrollAnchor) {
  if (!pdfDocument || !canvas.value || !preview.value) return

  const currentRender = ++renderVersion
  renderTask?.cancel()
  rendering.value = true

  try {
    const workerReady = backgroundWorkerReady
    if (workerReady) {
      await workerReady
      if (currentRender !== renderVersion) return
    }

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
    if (scrollAnchor) restoreScrollAnchor(scrollAnchor)

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
  const scrollAnchor = captureScrollAnchor()
  resizeFrame = window.requestAnimationFrame(() => {
    void renderCurrentPage(scrollAnchor)
  })
}

function goToPage(value: number) {
  const maxPage = navigationLimit.value
  if (maxPage === 0) return
  const target = Math.min(maxPage, Math.max(1, Math.round(value)))
  const scrollAnchor = captureScrollAnchor()
  if (scrollAnchor) scrollAnchor.y = 0
  pageNumber.value = target
  pageInput.value = String(target)
  preview.value?.scrollTo({ top: 0, behavior: 'auto' })
  if (pdfDocument) void renderCurrentPage(scrollAnchor)
}

function commitPageInput() {
  const value = Number.parseInt(pageInput.value, 10)
  goToPage(Number.isFinite(value) ? value : pageNumber.value)
}

function changeZoom(delta: number) {
  if (!pdfDocument) return
  const nextZoom = Math.min(2.5, Math.max(0.6, Number((zoom.value + delta).toFixed(2))))
  if (nextZoom === zoom.value) return
  const scrollAnchor = captureScrollAnchor()
  zoom.value = nextZoom
  void renderCurrentPage(scrollAnchor)
}

function resetZoom() {
  if (!pdfDocument || zoom.value === 1) return
  const scrollAnchor = captureScrollAnchor()
  zoom.value = 1
  void renderCurrentPage(scrollAnchor)
}

function captureScrollAnchor(): ScrollAnchor | undefined {
  if (!preview.value) return undefined
  const { clientHeight, clientWidth, scrollHeight, scrollLeft, scrollTop, scrollWidth } = preview.value
  return {
    x: (scrollLeft + clientWidth / 2) / Math.max(scrollWidth, 1),
    y: (scrollTop + clientHeight / 2) / Math.max(scrollHeight, 1)
  }
}

function restoreScrollAnchor(anchor: ScrollAnchor) {
  if (!preview.value) return
  const { clientHeight, clientWidth, scrollHeight, scrollWidth } = preview.value
  preview.value.scrollLeft = Math.max(0, anchor.x * scrollWidth - clientWidth / 2)
  preview.value.scrollTop = Math.max(0, anchor.y * scrollHeight - clientHeight / 2)
}

function startPan(event: PointerEvent) {
  if (event.pointerType !== 'mouse' || event.button !== 0 || zoom.value <= 1 || !preview.value) return
  const stage = event.currentTarget as HTMLElement
  panning.value = true
  panOrigin = {
    x: event.clientX,
    y: event.clientY,
    left: preview.value.scrollLeft,
    top: preview.value.scrollTop
  }
  stage.setPointerCapture(event.pointerId)
  event.preventDefault()
}

function movePan(event: PointerEvent) {
  if (!panning.value || !panOrigin || !preview.value) return
  preview.value.scrollLeft = panOrigin.left - (event.clientX - panOrigin.x)
  preview.value.scrollTop = panOrigin.top - (event.clientY - panOrigin.y)
}

function stopPan(event?: PointerEvent) {
  const stage = event?.currentTarget as HTMLElement | undefined
  if (event && stage?.hasPointerCapture(event.pointerId)) {
    stage.releasePointerCapture(event.pointerId)
  }
  panning.value = false
  panOrigin = undefined
}

async function toggleFullscreen() {
  if (!fullscreenAvailable.value || !viewer.value) return

  try {
    if (document.fullscreenElement === viewer.value) {
      await document.exitFullscreen()
    } else {
      await viewer.value.requestFullscreen()
    }
  } catch (error) {
    console.error('PDF fullscreen request failed', error)
  }
}

function handleFullscreenChange() {
  isFullscreen.value = document.fullscreenElement === viewer.value
  stopPan()
  void nextTick().then(scheduleRender)
}

function handleFullscreenKeyboard(event: KeyboardEvent) {
  if (!isFullscreen.value || event.defaultPrevented) return
  const target = event.target
  if (target instanceof HTMLElement && (
    target.matches('input, textarea, select') || target.isContentEditable
  )) return

  if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
    event.preventDefault()
    goToPage(pageNumber.value - 1)
  } else if (event.key === 'ArrowRight' || event.key === 'PageDown') {
    event.preventDefault()
    goToPage(pageNumber.value + 1)
  } else if (event.key === 'Home') {
    event.preventDefault()
    goToPage(1)
  } else if (event.key === 'End') {
    event.preventDefault()
    goToPage(pageCount.value)
  } else if (event.key === '+' || event.key === '=') {
    event.preventDefault()
    changeZoom(0.15)
  } else if (event.key === '-' || event.key === '_') {
    event.preventDefault()
    changeZoom(-0.15)
  } else if (event.key === '0') {
    event.preventDefault()
    resetZoom()
  }
}

function warmQuickPreviewPages() {
  if (previewSources.value.length < 2) return
  warmPreviewTimer = window.setTimeout(() => {
    warmPreviewTimer = undefined
    for (const source of previewSources.value.slice(1)) {
      const image = new Image()
      image.decoding = 'async'
      image.fetchPriority = 'low'
      image.src = source
      warmedPreviewImages.push(image)
    }
  }, 800)
}

onMounted(() => {
  fullscreenAvailable.value = document.fullscreenEnabled
  networkInformation = readNetworkInformation()
  networkInformation?.addEventListener('change', handleNetworkChange)
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('keydown', handleFullscreenKeyboard)
  resizeObserver = new ResizeObserver(scheduleRender)
  if (preview.value) resizeObserver.observe(preview.value)
  warmQuickPreviewPages()
  void loadDocument()
})

onBeforeUnmount(() => {
  loadVersion += 1
  networkInformation?.removeEventListener('change', handleNetworkChange)
  networkInformation = undefined
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('keydown', handleFullscreenKeyboard)
  resizeObserver?.disconnect()
  if (resizeFrame) window.cancelAnimationFrame(resizeFrame)
  if (warmPreviewTimer) window.clearTimeout(warmPreviewTimer)
  warmedPreviewImages.length = 0
  releaseDocument()
})

watch(() => props.src, loadDocument)
</script>

<template>
  <div ref="viewer" class="kb-pdf-viewer" :class="{ 'is-fullscreen': isFullscreen }">
    <div class="kb-pdf-toolbar" :class="{ 'is-pending': !pageCount }" aria-label="PDF 阅读工具栏">
      <div class="kb-pdf-toolbar-group">
        <button
          type="button"
          class="kb-icon-button"
          :disabled="!navigationLimit || pageNumber <= 1 || rendering"
          title="上一页"
          aria-label="上一页"
          @click="goToPage(pageNumber - 1)"
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <label class="kb-page-control">
          <span class="visually-hidden">页码</span>
          <input
            v-model="pageInput"
            type="number"
            min="1"
            :max="navigationLimit"
            :disabled="!navigationLimit"
            inputmode="numeric"
            @change="commitPageInput"
            @keydown.enter="commitPageInput"
          >
          <span>/ {{ pageCount || '—' }}</span>
        </label>
        <button
          type="button"
          class="kb-icon-button"
          :disabled="!navigationLimit || pageNumber >= navigationLimit || rendering"
          title="下一页"
          aria-label="下一页"
          @click="goToPage(pageNumber + 1)"
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>

      <div class="kb-pdf-toolbar-group">
        <button
          type="button"
          class="kb-icon-button"
          :disabled="!documentReady || zoom <= 0.6 || rendering"
          title="缩小"
          aria-label="缩小"
          @click="changeZoom(-0.15)"
        >
          <Minus aria-hidden="true" />
        </button>
        <span class="kb-zoom-value" aria-live="polite">
          {{ zoomLabel }}
        </span>
        <button
          type="button"
          class="kb-icon-button"
          :disabled="!documentReady || zoom >= 2.5 || rendering"
          title="放大"
          aria-label="放大"
          @click="changeZoom(0.15)"
        >
          <Plus aria-hidden="true" />
        </button>
        <span class="kb-toolbar-divider" aria-hidden="true"></span>
        <button
          v-if="backgroundDeferred"
          type="button"
          class="kb-icon-button"
          title="缓存完整文档"
          aria-label="缓存完整文档"
          @click="startDeferredBackgroundLoad"
        >
          <CloudDownload aria-hidden="true" />
        </button>
        <button
          type="button"
          class="kb-icon-button"
          :disabled="!documentReady || zoom === 1 || rendering"
          title="适合页面宽度"
          aria-label="适合页面宽度"
          @click="resetZoom"
        >
          <ScanLine aria-hidden="true" />
        </button>
        <button
          type="button"
          class="kb-icon-button kb-fullscreen-button"
          :disabled="!fullscreenAvailable"
          :title="fullscreenAvailable ? (isFullscreen ? '退出全屏' : '全屏阅读') : '当前浏览器不支持全屏'"
          :aria-label="isFullscreen ? '退出全屏' : '全屏阅读'"
          @click="toggleFullscreen"
        >
          <Minimize2 v-if="isFullscreen" aria-hidden="true" />
          <Maximize2 v-else aria-hidden="true" />
        </button>
      </div>
      <span
        v-if="backgroundActive && backgroundProgress !== null"
        class="kb-pdf-background-progress"
        role="progressbar"
        aria-label="后台读取 PDF"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="backgroundProgress"
        :title="`后台读取 ${backgroundProgress}%`"
      >
        <span :style="backgroundProgressStyle"></span>
      </span>
    </div>

    <div ref="preview" class="kb-pdf-preview" :aria-busy="loading || rendering">
      <div
        v-if="errorMessage"
        class="kb-pdf-error"
        :class="{ 'has-preview': activePreviewSrc }"
        role="alert"
      >
        <img
          v-if="activePreviewSrc"
          class="kb-pdf-error-preview"
          :src="activePreviewSrc"
          :alt="`${title}，第 ${pageNumber} 页预览`"
          loading="eager"
          decoding="async"
        >
        <div class="kb-pdf-error-content">
          <strong>完整阅读器暂时不可用</strong>
          <p>{{ errorMessage }}</p>
          <div class="kb-pdf-error-actions">
            <button type="button" class="kb-download-button" @click="loadDocument">重新加载</button>
            <a
              :href="originalFileSrc"
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
          'has-placeholder': loading && activePreviewSrc,
          'is-pannable': zoom > 1 && !loading,
          'is-panning': panning
        }"
        @pointerdown="startPan"
        @pointermove="movePan"
        @pointerup="stopPan"
        @pointercancel="stopPan"
        @lostpointercapture="stopPan"
      >
        <img
          v-if="loading && activePreviewSrc"
          class="kb-pdf-placeholder"
          :src="activePreviewSrc"
          :alt="`${title}，第 ${pageNumber} 页预览`"
          loading="eager"
          fetchpriority="high"
          decoding="async"
        >
        <canvas
          ref="canvas"
          :class="{ 'is-waiting': loading && activePreviewSrc }"
          role="img"
          :aria-label="`${title}，第 ${pageNumber} 页，共 ${pageCount} 页`"
        ></canvas>
        <span v-if="rendering && !loading" class="kb-page-loading" role="status">正在读取第 {{ pageNumber }} 页</span>
      </div>

      <div
        v-if="loading"
        class="kb-pdf-loading"
        :class="{ 'has-preview': activePreviewSrc }"
        role="status"
        aria-live="polite"
      >
        <div class="kb-pdf-loading-content">
          <span class="kb-pdf-spinner" aria-hidden="true"></span>
          <p class="kb-pdf-loading-title">{{ activePreviewSrc ? '正在载入高清页面' : '正在读取第一页' }}</p>
          <p class="kb-pdf-loading-meta">
            <template v-if="size">{{ size }} &middot; </template>
            {{ activePreviewSrc ? '完整内容载入中' : '分段载入中' }}
          </p>
          <span class="kb-pdf-loading-track" aria-hidden="true">
            <span class="kb-pdf-loading-bar" :style="progressStyle"></span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

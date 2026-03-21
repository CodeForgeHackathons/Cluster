<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  tourUrl: string
  title: string
  width?: string
  height?: string
  autoplay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '400px',
  autoplay: true
})

const emit = defineEmits<{
  (e: 'tourStarted'): void
  (e: 'tourEnded'): void
  (e: 'pointReached', pointId: string): void
}>()

const viewerRef = ref<HTMLDivElement>()
const isLoading = ref(true)
const hasError = ref(false)

const avalinScriptUrl =
  (import.meta as unknown as { env?: { VITE_AVALIN_CDN_URL?: string } }).env
    ?.VITE_AVALIN_CDN_URL || 'https://cdn.avalin.ru/viewer/latest/viewer.js'

let avalinScriptPromise: Promise<void> | null = null

// AVALIN viewer configuration
const viewerConfig = {
  autoplay: props.autoplay,
  controls: true,
  fullscreen: true,
  vr: true,
  hotspots: true,
  navigation: true
}

onMounted(() => {
  if (props.tourUrl && viewerRef.value) {
    loadAvalinViewer()
  } else {
    hasError.value = true
    isLoading.value = false
    console.log('AVALIN: No tour URL or viewer ref', { tourUrl: props.tourUrl, viewerRef: viewerRef.value })
  }
})

onUnmounted(() => {
  // Cleanup AVALIN viewer instance
  if (window.AvalinViewer && viewerRef.value) {
    try {
      window.AvalinViewer.destroy(viewerRef.value)
    } catch (error) {
      console.warn('Error destroying AVALIN viewer:', error)
    }
  }
})

function loadAvalinViewer() {
  try {
    console.log('AVALIN: Loading viewer for URL:', props.tourUrl)

    loadAvalinScript()
      .then(() => {
        initializeViewer()
        isLoading.value = false
      })
      .catch((error) => {
        console.error('AVALIN: Script load failed:', error)
        hasError.value = true
        isLoading.value = false
        fallbackToImage()
      })
  } catch (error) {
    console.error('AVALIN: Error loading viewer:', error)
    hasError.value = true
    isLoading.value = false
    fallbackToImage()
  }
}

function loadAvalinScript(): Promise<void> {
  if (window.AvalinViewer) return Promise.resolve()
  if (avalinScriptPromise) return avalinScriptPromise

  let url = avalinScriptUrl
  if (!url.endsWith('.js')) {
    url = `${url.replace(/\/$/, '')}/viewer.js`
  }

  avalinScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${url}"]`) as HTMLScriptElement | null
    if (existing && (existing as any)._loaded) {
      resolve()
      return
    }

    const script = existing || document.createElement('script')
    script.src = url
    script.async = true
    script.onload = () => {
      ;(script as any)._loaded = true
      resolve()
    }
    script.onerror = (e) => reject(e)
    if (!existing) document.head.appendChild(script)
  })

  return avalinScriptPromise
}

function initializeViewer() {
  if (!window.AvalinViewer || !viewerRef.value) {
    console.error('AVALIN: Cannot initialize viewer', {
      hasAvalin: !!window.AvalinViewer,
      hasViewerRef: !!viewerRef.value
    })
    return
  }

  try {
    console.log('AVALIN: Initializing viewer with config:', {
      url: props.tourUrl,
      ...viewerConfig
    })

    window.AvalinViewer.init(viewerRef.value, {
      url: props.tourUrl,
      ...viewerConfig
    })

    // Set up event listeners
    window.AvalinViewer.on('tourStarted', () => {
      console.log('AVALIN: Tour started')
      isLoading.value = false
      emit('tourStarted')
    })

    window.AvalinViewer.on('tourEnded', () => {
      console.log('AVALIN: Tour ended')
      emit('tourEnded')
    })

    window.AvalinViewer.on('pointReached', (pointId: string) => {
      emit('pointReached', pointId)
    })

  } catch (error) {
    console.error('AVALIN: Error initializing viewer:', error)
    hasError.value = true
    isLoading.value = false
    fallbackToImage()
  }
}

function fallbackToImage() {
  // Fallback to regular image gallery if 3D tour fails
  const img = document.createElement('img')
  img.src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop'
  img.alt = props.title
  img.className = 'w-full h-full object-cover rounded-lg'

  if (viewerRef.value) {
    viewerRef.value.innerHTML = ''
    viewerRef.value.appendChild(img)
  }
}
</script>

<template>
  <div class="avalin-viewer-container">
    <!-- Loading state -->
    <div
      v-if="isLoading"
      class="flex items-center justify-center bg-gray-100 rounded-lg"
      :style="{ width, height }"
    >
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Загружаем 3D тур...</p>
        <p class="text-sm text-gray-500">{{ title }}</p>
      </div>
    </div>

    <!-- Error state with fallback -->
    <div
      v-else-if="hasError"
      class="flex flex-col items-center justify-center bg-gray-100 rounded-lg p-6"
      :style="{ width, height }"
    >
      <div class="text-center">
        <div class="text-6xl mb-4">🎯</div>
        <p class="text-gray-600 mb-2">3D тур временно недоступен</p>
        <p class="text-sm text-gray-500 mb-4">Показываем фотографии места</p>
        <div class="w-full h-48 bg-gray-200 rounded-lg overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop"
            :alt="title"
            class="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>

    <!-- AVALIN viewer -->
    <div
      v-else
      ref="viewerRef"
      class="avalin-viewer rounded-lg overflow-hidden"
      :style="{ width, height }"
    >
      <!-- AVALIN viewer will be mounted here -->
    </div>

    <!-- 3D tour badge -->
    <div class="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold z-10">
      <span class="flex items-center gap-1">
        <span class="w-2 h-2 bg-white rounded-full animate-pulse"></span>
        3D ТУР
      </span>
    </div>
  </div>
</template>

<style scoped>
.avalin-viewer-container {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  overflow: hidden;
}

.avalin-viewer {
  background: #000;
  border-radius: 12px;
}

/* Custom styles for AVALIN viewer integration */
.avalin-viewer :deep(.avalin-controls) {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
}

.avalin-viewer :deep(.avalin-hotspot) {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}
</style>

<!-- Global types for AVALIN viewer -->
<script lang="ts">
declare global {
  interface Window {
    AvalinViewer?: {
      init: (element: HTMLElement, config: any) => void
      on: (event: string, callback: Function) => void
      destroy: (element: HTMLElement) => void
    }
  }
}
</script>

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
    // Load AVALIN SDK if not already loaded
    if (!window.AvalinViewer) {
      const script = document.createElement('script')
      script.src = 'https://cdn.avalin.ru/viewer/latest/avalin-viewer.js'
      script.onload = () => initializeViewer()
      script.onerror = () => {
        hasError.value = true
        isLoading.value = false
      }
      document.head.appendChild(script)
    } else {
      initializeViewer()
    }
  } catch (error) {
    console.error('Error loading AVALIN viewer:', error)
    hasError.value = true
    isLoading.value = false
  }
}

function initializeViewer() {
  if (!window.AvalinViewer || !viewerRef.value) return

  try {
    window.AvalinViewer.init(viewerRef.value, {
      url: props.tourUrl,
      ...viewerConfig
    })

    // Set up event listeners
    window.AvalinViewer.on('tourStarted', () => {
      isLoading.value = false
      emit('tourStarted')
    })

    window.AvalinViewer.on('tourEnded', () => {
      emit('tourEnded')
    })

    window.AvalinViewer.on('pointReached', (pointId: string) => {
      emit('pointReached', pointId)
    })

  } catch (error) {
    console.error('Error initializing AVALIN viewer:', error)
    hasError.value = true
    isLoading.value = false
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

    <!-- Error state -->
    <div
      v-else-if="hasError"
      class="flex flex-col items-center justify-center bg-gray-100 rounded-lg p-6"
      :style="{ width, height }"
    >
      <div class="text-center">
        <div class="text-6xl mb-4">🎯</div>
        <p class="text-gray-600 mb-2">3D тур временно недоступен</p>
        <p class="text-sm text-gray-500 mb-4">Попробуйте посмотреть фотографии места</p>
        <button
          @click="fallbackToImage"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Показать фотографии
        </button>
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

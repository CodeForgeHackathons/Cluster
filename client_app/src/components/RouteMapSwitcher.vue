<script setup lang="ts">
import { defineAsyncComponent, ref, watch, onMounted, nextTick } from 'vue'
import type { MapPoint } from './RouteMapSimple.vue'

const props = defineProps<{
  points: MapPoint[]
  activePointId?: string | null
}>()

const emit = defineEmits<{
  (e: 'selectPoint', id: string): void
}>()

// Асинхронный компонент для Yandex карты
const RouteMapYandex = defineAsyncComponent(() => import('./RouteMapYandexSimple.vue'))

const mapType = ref<'yandex'>('yandex')

// Переключение типа карты (удалено - используем только Yandex)
// function switchMapType(type: 'osrm' | 'yandex') { ... }

// Загружаем сохраненный тип карты (удалено - используем только Yandex)
onMounted(() => {
  console.log('=== SWITCHER ONMOUNTED ===')
  console.log('Используем только Yandex карты')
})

</script>

<template>
  <div class="mapSwitcher">
    <!-- Yandex карта -->
    <RouteMapYandex
      :points="props.points"
      :active-point-id="props.activePointId"
      @select-point="emit('selectPoint', $event)"
    />
  </div>
</template>

<style scoped>
.mapSwitcher {
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 22px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(16, 18, 28, 0.9);
}
</style>

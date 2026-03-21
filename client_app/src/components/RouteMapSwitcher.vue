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

// Асинхронные компоненты для разных карт
const RouteMapSimple = defineAsyncComponent(() => import('./RouteMapSimple.vue'))
const RouteMapYandex = defineAsyncComponent(() => import('./RouteMapYandex.vue'))

const mapType = ref<'osrm' | 'yandex'>('osrm')

// Переключение типа карты
function switchMapType(type: 'osrm' | 'yandex') {
  mapType.value = type
  localStorage.setItem('preferredMapType', type)
}

// Загружаем сохраненный тип карты
onMounted(() => {
  const saved = localStorage.getItem('preferredMapType') as 'osrm' | 'yandex' | null
  if (saved) {
    mapType.value = saved
  }
})

watch(mapType, () => {
  // Перерисовка при смене типа
  nextTick()
})
</script>

<template>
  <div class="mapSwitcher">
    <!-- Переключатель типа карты -->
    <div class="mapSwitcher__controls">
      <div class="mapSwitcher__title">Тип карты:</div>
      <div class="mapSwitcher__buttons">
        <button
          type="button"
          class="mapSwitcher__button"
          :class="{ 'mapSwitcher__button--active': mapType === 'osrm' }"
          @click="switchMapType('osrm')"
        >
          <span class="mapSwitcher__buttonIcon">🌐</span>
          <span class="mapSwitcher__buttonText">OSRM (бесплатно)</span>
        </button>
        <button
          type="button"
          class="mapSwitcher__button"
          :class="{ 'mapSwitcher__button--active': mapType === 'yandex' }"
          @click="switchMapType('yandex')"
        >
          <span class="mapSwitcher__buttonIcon">🗺️</span>
          <span class="mapSwitcher__buttonText">Яндекс Карты</span>
        </button>
      </div>
    </div>

    <!-- Динамический компонент карты -->
    <RouteMapSimple
      v-if="mapType === 'osrm'"
      :points="props.points"
      :active-point-id="props.activePointId"
      @select-point="emit('selectPoint', $event)"
    />
    
    <RouteMapYandex
      v-if="mapType === 'yandex'"
      :points="props.points"
      :active-point-id="props.activePointId"
      @select-point="emit('selectPoint', $event)"
    />

    <!-- Информация о текущем типе -->
    <div class="mapSwitcher__info">
      <div v-if="mapType === 'osrm'" class="mapSwitcher__infoItem">
        <span class="mapSwitcher__infoIcon">🌐</span>
        <span class="mapSwitcher__infoText">OSRM Routing Engine</span>
        <span class="mapSwitcher__infoDesc">Бесплатные маршруты по дорогам</span>
      </div>
      
      <div v-if="mapType === 'yandex'" class="mapSwitcher__infoItem">
        <span class="mapSwitcher__infoIcon">🗺️</span>
        <span class="mapSwitcher__infoText">Яндекс Карты API</span>
        <span class="mapSwitcher__infoDesc">Точные маршруты по РФ с пробками</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mapSwitcher {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-radius: 22px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(16, 18, 28, 0.9);
}

.mapSwitcher__controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  gap: 16px;
  flex-wrap: wrap;
}

.mapSwitcher__title {
  font-size: 13px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
}

.mapSwitcher__buttons {
  display: flex;
  gap: 8px;
}

.mapSwitcher__button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease;
}

.mapSwitcher__button:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(0, 194, 255, 0.5);
  color: rgba(255, 255, 255, 0.9);
}

.mapSwitcher__button--active {
  background: rgba(0, 194, 255, 0.2);
  border-color: rgba(0, 194, 255, 0.8);
  color: rgba(255, 255, 255, 0.95);
}

.mapSwitcher__buttonIcon {
  font-size: 14px;
}

.mapSwitcher__buttonText {
  font-weight: 700;
}

.mapSwitcher__info {
  display: flex;
  gap: 12px;
  padding: 0 16px;
  flex-wrap: wrap;
}

.mapSwitcher__infoItem {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(0, 194, 255, 0.1);
  border: 1px solid rgba(0, 194, 255, 0.3);
  border-radius: 12px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
}

.mapSwitcher__infoIcon {
  font-size: 14px;
}

.mapSwitcher__infoText {
  font-weight: 700;
  margin-right: 4px;
}

.mapSwitcher__infoDesc {
  opacity: 0.8;
  font-size: 10px;
}

@media (max-width: 700px) {
  .mapSwitcher__controls {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .mapSwitcher__buttons {
    justify-content: center;
  }
  
  .mapSwitcher__info {
    flex-direction: column;
    gap: 8px;
  }
}
</style>

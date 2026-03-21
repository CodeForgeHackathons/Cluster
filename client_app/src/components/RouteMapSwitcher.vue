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
const RouteMapYandex = defineAsyncComponent(() => import('./RouteMapYandexSimple.vue'))

const mapType = ref<'osrm' | 'yandex'>('osrm')

// Переключение типа карты
function switchMapType(type: 'osrm' | 'yandex') {
  console.log('=== ПЕРЕКЛЮЧЕНИЕ КАРТЫ ===')
  console.log('Переключаем тип карты на:', type)
  console.log('Было:', mapType.value, 'Стало:', type)
  mapType.value = type
  localStorage.setItem('preferredMapType', type)
  
  // Небольшая задержка для корректного переключения
  nextTick(() => {
    console.log('Тип карты переключен')
  })
}

// Загружаем сохраненный тип карты
onMounted(() => {
  console.log('=== SWITCHER ONMOUNTED ===')
  const saved = localStorage.getItem('preferredMapType') as 'osrm' | 'yandex' | null
  console.log('Сохраненный тип карты:', saved)
  if (saved) {
    mapType.value = saved
    console.log('Установлен тип карты:', mapType.value)
  } else {
    console.log('Сохраненный тип не найден, используем по умолчанию')
  }
})

// Добавим watch для отладки
watch(() => props.points, (newPoints) => {
  console.log('=== SWITCHER WATCH СРАБОТАЛ ===')
  console.log('Switcher получил точки:', newPoints.length)
}, { deep: true, immediate: true })

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
          <span class="mapSwitcher__buttonText">Яндекс (простые)</span>
        </button>
      </div>
    </div>

    <!-- Динамический компонент карты -->
    <div style="background: rgba(255,0,0,0.1); padding: 10px; margin: 5px 0; border-radius: 5px;">
      <strong>DEBUG: mapType = {{ mapType }}</strong><br>
      <strong>DEBUG: points.length = {{ props.points.length }}</strong><br>
      <strong>DEBUG: activePointId = {{ props.activePointId }}</strong>
    </div>
    
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
        <span class="mapSwitcher__infoText">Яндекс Карты</span>
        <span class="mapSwitcher__infoDesc">Простые линии между точками</span>
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

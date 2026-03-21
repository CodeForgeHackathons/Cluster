<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.js'

export type MapPoint = {
  id: string
  title: string
  location: string
  lat: number
  lon: number
  day: number
  slot: string
  cost: number
  rating: number
  photo: string
}

const props = defineProps<{
  points: MapPoint[]
  activePointId?: string | null
}>()

const emit = defineEmits<{
  (e: 'selectPoint', id: string): void
}>()

let map: L.Map | null = null
let markers: L.Marker[] = []
let routingControl: L.Routing.Control | null = null
let mapEl: HTMLElement | null = null

const DAY_COLORS: Record<number, string> = {
  0: '#00c2ff',
  1: '#ff6b6b',
  2: '#6bffb8',
}

const DAY_GLOW: Record<number, string> = {
  0: 'rgba(0,194,255,0.55)',
  1: 'rgba(255,107,107,0.55)',
  2: 'rgba(107,255,184,0.55)',
}

function getColor(day: number): string {
  return DAY_COLORS[day] ?? '#fff'
}

function getGlow(day: number): string {
  return DAY_GLOW[day] ?? 'rgba(255,255,255,0.4)'
}

function makeIcon(point: MapPoint, index: number, isActive: boolean): L.DivIcon {
  const color = getColor(point.day)
  const glow = getGlow(point.day)
  const size = isActive ? 44 : 36
  const fontSize = isActive ? 16 : 13
  const shadow = isActive
    ? `0 0 0 4px ${glow}, 0 8px 28px rgba(0,0,0,0.55)`
    : `0 4px 14px rgba(0,0,0,0.45)`

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: rgba(16,18,28,0.92);
      border: 2.5px solid ${color};
      box-shadow: ${shadow};
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: ${fontSize}px;
      color: ${color};
      font-family: system-ui, sans-serif;
      transition: all 220ms ease;
      cursor: pointer;
      position: relative;
    ">
      ${index + 1}
      ${isActive ? `<div style="
        position: absolute;
        inset: -6px;
        border-radius: 50%;
        border: 2px solid ${color};
        opacity: 0.45;
        animation: pulseRing 1.4s ease-out infinite;
      "></div>` : ''}
    </div>
  `
  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  })
}

function makePopup(point: MapPoint): string {
  const color = getColor(point.day)
  return `
    <div style="
      background: rgba(16,18,28,0.97);
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 16px;
      padding: 12px;
      min-width: 220px;
      max-width: 260px;
      font-family: system-ui, sans-serif;
      color: rgba(255,255,255,0.96);
      box-shadow: 0 20px 60px rgba(0,0,0,0.65);
    ">
      ${point.photo ? `<img src="${point.photo}" style="width:100%;height:110px;object-fit:cover;border-radius:12px;border:1px solid rgba(255,255,255,0.12);margin-bottom:10px;display:block;" />` : ''}
      <div style="font-size:11px;opacity:0.75;margin-bottom:4px;">
        День ${point.day + 1} · ${point.slot}
      </div>
      <div style="font-weight:900;font-size:14px;line-height:1.25;margin-bottom:5px;">
        ${point.title}
      </div>
      <div style="font-size:12px;opacity:0.82;margin-bottom:7px;">
        ${point.location}
      </div>
      <div style="display:flex;gap:10px;align-items:center;">
        <span style="color:#ffd600;font-size:12px;">★ ${point.rating.toFixed(1)}</span>
        <span style="
          background: rgba(${point.day === 0 ? '0,194,255' : point.day === 1 ? '255,107,107' : '107,255,184'},0.16);
          border: 1px solid ${color};
          border-radius: 999px;
          padding: 3px 9px;
          font-size:12px;
          font-weight:900;
          color: ${color};
        ">${point.cost} ₽</span>
      </div>
    </div>
  `
}

function buildMap() {
  if (!mapEl) return

  map = L.map(mapEl, {
    zoomControl: true,
    attributionControl: false,
  })

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
  }).addTo(map)

  L.control.attribution({ prefix: false })
    .addAttribution('© <a href="https://carto.com/">CARTO</a> | © <a href="https://www.openstreetmap.org/copyright">OSM</a>')
    .addTo(map)

  renderPoints()
}

function renderPoints() {
  if (!map) return

  // Очищаем старые маркеры и маршруты
  markers.forEach((m) => m.remove())
  markers = []
  
  if (routingControl) {
    map.removeControl(routingControl)
    routingControl = null
  }

  if (!props.points.length) return

  // Создаем маркеры
  props.points.forEach((pt, idx) => {
    const isActive = pt.id === props.activePointId
    const icon = makeIcon(pt, idx, isActive)
    const marker = L.marker([pt.lat, pt.lon], { icon, zIndexOffset: isActive ? 1000 : idx * 10 })

    marker.bindPopup(makePopup(pt), {
      className: 'route-popup',
      maxWidth: 270,
      closeButton: false,
    })

    marker.on('click', () => {
      emit('selectPoint', pt.id)
    })

    marker.addTo(map!)
    markers.push(marker)
  })

  // Группируем точки по дням для создания отдельных маршрутов
  const pointsByDay = new Map<number, MapPoint[]>()
  props.points.forEach(point => {
    if (!pointsByDay.has(point.day)) {
      pointsByDay.set(point.day, [])
    }
    pointsByDay.get(point.day)!.push(point)
  })

  // Создаем маршруты для каждого дня
  pointsByDay.forEach((dayPoints, day) => {
    if (dayPoints.length < 2) return

    const waypoints = dayPoints.map(point => L.latLng(point.lat, point.lon))
    
    // Создаем кастомный маршрут для каждого дня
    const dayRoutingControl = L.Routing.control({
      waypoints: waypoints,
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org',
        profile: 'driving' // Можно изменить на 'walking' для пешеходных маршрутов
      }),
      lineOptions: {
        styles: [{
          color: getColor(day),
          weight: 4,
          opacity: 0.8,
          dashArray: undefined
        }],
        extendToWaypoints: false,
        missingRouteTolerance: 0
      },
      addWaypoints: false, // Запрещаем добавление новых точек
      createMarker: () => null, // Отключаем автоматические маркеры
      routeWhileDragging: false,
      show: false, // Скрываем панель с инструкциями
      fitSelectedRoutes: false, // Не меняем масштаб автоматически
      useZoomParameter: false,
    }).addTo(map!)

    // Скрываем панель инструкций
    setTimeout(() => {
      const instructionsContainer = dayRoutingControl.getContainer()
      if (instructionsContainer) {
        instructionsContainer.style.display = 'none'
      }
    }, 100)
  })

  // Настраиваем вид карты
  if (props.points.length === 1) {
    map!.setView([props.points[0].lat, props.points[0].lon], 11, { animate: true })
  } else {
    const bounds = L.latLngBounds(props.points.map(p => [p.lat, p.lon]))
    map!.fitBounds(bounds.pad(0.22), { animate: true, maxZoom: 12 })
  }
}

function flyToActive() {
  if (!map || !props.activePointId) return
  const idx = props.points.findIndex((p) => p.id === props.activePointId)
  if (idx < 0) return
  const pt = props.points[idx]!
  map.flyTo([pt.lat, pt.lon], 13, { duration: 0.9, easeLinearity: 0.3 })

  // Открываем попап для активного маркера
  const marker = markers[idx]
  if (marker) {
    setTimeout(() => marker.openPopup(), 700)
  }

  // Обновляем иконки (active/inactive)
  markers.forEach((m, i) => {
    const point = props.points[i]!
    const isActive = point.id === props.activePointId
    m.setIcon(makeIcon(point, i, isActive))
  })
}

onMounted(async () => {
  await nextTick()
  mapEl = document.getElementById('route-leaflet-map')
  if (mapEl) buildMap()
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})

watch(() => props.points, async () => {
  await nextTick()
  if (!map) {
    mapEl = document.getElementById('route-leaflet-map')
    if (mapEl) buildMap()
  } else {
    renderPoints()
  }
}, { deep: true })

watch(() => props.activePointId, () => {
  flyToActive()
})
</script>

<template>
  <div class="routeMap">
    <!-- Легенда дней -->
    <div class="routeMap__legend" aria-label="Легенда дней маршрута">
      <div
        v-for="day in [0, 1, 2]"
        :key="day"
        class="routeMap__legendItem"
        :style="{ '--day-color': DAY_COLORS[day] }"
      >
        <span class="routeMap__legendDot" />
        <span class="routeMap__legendLabel">День {{ day + 1 }}</span>
      </div>
    </div>

    <!-- Информация о маршрутах -->
    <div class="routeMap__info">
      <div class="routeMap__infoItem">
        <span class="routeMap__infoIcon">🛣️</span>
        <span class="routeMap__infoText">Реальные маршруты по дорогам</span>
      </div>
      <div class="routeMap__infoItem">
        <span class="routeMap__infoIcon">🚗</span>
        <span class="routeMap__infoText">OSRM Routing Engine</span>
      </div>
    </div>

    <!-- Сама карта -->
    <div id="route-leaflet-map" class="routeMap__map" aria-label="Интерактивная карта маршрута" />

    <!-- Подсказка -->
    <div class="routeMap__hint">
      Нажмите на маркер, чтобы узнать подробности о месте
    </div>

    <!-- Анимация пульса в <head> через style-тег -->
    <component :is="'style'">
      {{ `
        @keyframes pulseRing {
          0%   { transform: scale(1);   opacity: 0.5; }
          70%  { transform: scale(1.5); opacity: 0;   }
          100% { transform: scale(1.5); opacity: 0;   }
        }
        .route-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .route-popup .leaflet-popup-content {
          margin: 0 !important;
        }
        .route-popup .leaflet-popup-tip-container {
          display: none !important;
        }
        .leaflet-control-zoom a {
          background: rgba(16,18,28,0.92) !important;
          border-color: rgba(255,255,255,0.18) !important;
          color: rgba(255,255,255,0.9) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(0,194,255,0.18) !important;
        }
        .leaflet-control-attribution {
          background: rgba(16,18,28,0.75) !important;
          color: rgba(255,255,255,0.5) !important;
          font-size: 10px !important;
        }
        .leaflet-control-attribution a {
          color: rgba(0,194,255,0.8) !important;
        }
        /* Скрываем панель инструкций маршрутизации */
        .leaflet-routing-container {
          display: none !important;
        }
      ` }}
    </component>
  </div>
</template>

<style scoped>
.routeMap {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-radius: 22px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(16, 18, 28, 0.9);
}

.routeMap__legend {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 12px 16px 0;
  flex-wrap: wrap;
}

.routeMap__legendItem {
  display: flex;
  align-items: center;
  gap: 7px;
}

.routeMap__legendDot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--day-color);
  box-shadow: 0 0 8px var(--day-color);
  flex-shrink: 0;
}

.routeMap__legendLabel {
  font-size: 13px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
}

.routeMap__info {
  display: flex;
  gap: 16px;
  padding: 8px 16px 0;
  flex-wrap: wrap;
}

.routeMap__infoItem {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(0, 194, 255, 0.1);
  border: 1px solid rgba(0, 194, 255, 0.3);
  border-radius: 12px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
}

.routeMap__infoIcon {
  font-size: 12px;
}

.routeMap__infoText {
  font-weight: 600;
}

.routeMap__map {
  width: 100%;
  height: 420px;
  z-index: 1;
}

.routeMap__hint {
  padding: 8px 16px 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
  text-align: center;
}

@media (max-width: 700px) {
  .routeMap__map {
    height: 300px;
  }
  
  .routeMap__info {
    flex-direction: column;
    gap: 8px;
  }
  
  .routeMap__infoItem {
    justify-content: center;
  }
}
</style>

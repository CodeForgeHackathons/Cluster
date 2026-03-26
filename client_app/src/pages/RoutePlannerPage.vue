<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getApiBase } from '../api/client'
import type { Place } from '../types/cluster'
import RouteMapSwitcher from '../components/RouteMapSwitcher.vue'
import type { MapPoint } from '../components/RouteMapSimple.vue'
import AvalinViewer from '../components/AvalinViewer.vue'

type TravelerType = 'family' | 'elderly' | 'digital' | 'gastro' | 'active' | 'eco'

const props = defineProps<{
  routePlaces: Place[]
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'openClusterByPlaceId', placeId: string): void
}>()

const logisticsRefs = ref<Array<HTMLElement | null>>([])
const logisticsHeight = ref<number | null>(null)

const setLogisticsRef = (idx: number) => (el: HTMLElement | null) => {
  logisticsRefs.value[idx] = el
}

const updateLogisticsHeight = async (): Promise<void> => {
  await nextTick()
  const heights = logisticsRefs.value.map((el) => (el ? el.scrollHeight : 0))
  const max = Math.max(0, ...heights)
  logisticsHeight.value = max > 0 ? max : null
}

const onResize = (): void => {
  void updateLogisticsHeight()
}

function todayISODate(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function parseISODateUTC(s: string): Date {
  const [y, m, d] = s.split('-').map((x) => Number(x))
  return new Date(Date.UTC(y, m - 1, d))
}

function formatISODateUTC(dt: Date): string {
  const yyyy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(dt.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function addDaysUTC(dt: Date, days: number): Date {
  const copy = new Date(dt.getTime())
  copy.setUTCDate(copy.getUTCDate() + days)
  return copy
}

const startDate = ref<string>(todayISODate())
const month = computed<number>(() => parseISODateUTC(startDate.value).getUTCMonth() + 1)

const endDate = computed<string>(() => {
  const dt = parseISODateUTC(startDate.value)
  return formatISODateUTC(addDaysUTC(dt, 2))
})

const startDateLabel = computed(() => startDate.value)
const endDateLabel = computed(() => endDate.value)
const travelerType = ref<TravelerType>('family')
const interests = ref<string>('')

type DaySlot = 'Утро' | 'День' | 'Вечер'

type DayPlan = {
  dayIndex: number
  places: Array<{
    place: Place
    slot: DaySlot
    why: string
    logisticsNotes?: string
  }>
}

const generated = ref(false)
const days = ref<DayPlan[]>([])
const overallWhy = ref('')

onMounted(() => {
  void updateLogisticsHeight()
  window.addEventListener('resize', onResize)
})

watch(
  () => days.value,
  () => {
    void updateLogisticsHeight()
  },
  { deep: true },
)

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
})

type WeatherDay = {
  maxTemp: number
  minTemp: number
  precipitationSum: number
  weatherCode: number
  isRainy: boolean
  label: string
}

const weatherLoading = ref(false)
const weatherByDay = ref<WeatherDay[]>([])
const weatherError = ref<string>('')
const apiError = ref<string>('')
const generateLoading = ref(false)

const show3DTour = ref(false)
const currentTourPlace = ref<Place | null>(null)

function start3DTour(place: Place): void {
  currentTourPlace.value = place
  show3DTour.value = true
}

function close3DTour(): void {
  show3DTour.value = false
  currentTourPlace.value = null
}

function has3DTour(place: Place): boolean {
  return !!place.avalinTourUrl
}

function openClusterByPlaceId(placeId: string): void {
  emit('openClusterByPlaceId', placeId)
}

function weatherLabelFromCode(code: number): { label: string; isRainy: boolean } {
  const isRainy =
    (code >= 51 && code <= 67) ||
    (code >= 71 && code <= 77) ||
    (code >= 80 && code <= 82) ||
    code === 95 ||
    code === 96 ||
    code === 99

  const label = (() => {
    if (code === 0) return 'Ясно'
    if (code === 1 || code === 2) return 'Облачно с прояснениями'
    if (code === 3) return 'Пасмурно'
    if (code === 45 || code === 48) return 'Туман'
    if (code >= 51 && code <= 57) return 'Морось'
    if (code >= 58 && code <= 67) return 'Дождь'
    if (code >= 71 && code <= 77) return 'Снег/снежок'
    if (code >= 80 && code <= 82) return 'Ливни'
    if (code >= 85 && code <= 86) return 'Снегопад'
    if (code >= 95) return 'Гроза'
    return 'Погода переменчива'
  })()

  return { label, isRainy }
}

async function fetchWeather(): Promise<void> {
  weatherError.value = ''
  weatherLoading.value = true

  try {
    const anchor = props.routePlaces[0]?.coordinates ?? { lat: 45.0, lon: 38.0 }
    const url = new URL('https://api.open-meteo.com/v1/forecast')
    url.searchParams.set('latitude', String(anchor.lat))
    url.searchParams.set('longitude', String(anchor.lon))
    url.searchParams.set(
      'daily',
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum',
    )
    url.searchParams.set('start_date', startDate.value)
    url.searchParams.set('end_date', endDate.value)
    url.searchParams.set('timezone', 'Europe/Moscow')

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as {
      daily?: {
        weather_code?: number[]
        temperature_2m_max?: number[]
        temperature_2m_min?: number[]
        precipitation_sum?: number[]
        time?: string[]
      }
    }

    const daily = data.daily
    const codes = daily?.weather_code ?? []
    const maxs = daily?.temperature_2m_max ?? []
    const mins = daily?.temperature_2m_min ?? []
    const precs = daily?.precipitation_sum ?? []

    const next: WeatherDay[] = [0, 1, 2].map((i) => {
      const code = codes[i] ?? 0
      const maxTemp = maxs[i] ?? 0
      const minTemp = mins[i] ?? 0
      const precipitationSum = precs[i] ?? 0
      const w = weatherLabelFromCode(code)
      return {
        maxTemp,
        minTemp,
        precipitationSum,
        weatherCode: code,
        isRainy: w.isRainy,
        label: w.label,
      }
    })

    weatherByDay.value = next
  } catch (e) {
    weatherError.value = 'Погоду временно не удалось загрузить.'
    weatherByDay.value = []
  } finally {
    weatherLoading.value = false
  }
}

const vauSelectedIndex = ref(0)

const vauItems = computed(() => {
  const items: Array<{
    place: Place
    dayIndex: number
    slot: DaySlot
    why: string
  }> = []

  days.value.forEach((d) => {
    d.places.forEach((p) => {
      items.push({
        place: p.place,
        dayIndex: d.dayIndex,
        slot: p.slot,
        why: p.why,
      })
    })
  })

  return items
})

const vauActive = computed(() => vauItems.value[vauSelectedIndex.value] ?? null)

function monthToSeason(m: number): 'winter' | 'spring' | 'summer' | 'autumn' {
  if (m === 12 || m === 1 || m === 2) return 'winter'
  if (m >= 3 && m <= 5) return 'spring'
  if (m >= 6 && m <= 8) return 'summer'
  return 'autumn'
}

const seasonLabel = computed(() => {
  const s = monthToSeason(month.value)
  if (s === 'winter') return 'Зима'
  if (s === 'spring') return 'Весна'
  if (s === 'summer') return 'Лето'
  return 'Осень'
})

function travelerLabel(t: TravelerType): string {
  switch (t) {
    case 'family':
      return 'Семья с детьми'
    case 'elderly':
      return 'Пенсионеры'
    case 'digital':
      return 'Фрилансер с ноутбуком'
    case 'gastro':
      return 'Гастроэнтузиаст'
    case 'active':
      return 'Активный отдых'
    case 'eco':
      return 'Эко/природа'
  }
}

function clusterKey(place: Place): string {
  return place.id.split('-')[0] ?? ''
}

const clusterSeasonTags: Record<string, string[]> = {
  cl1: ['summer'],
  cl2: ['spring', 'autumn'],
  cl3: ['spring', 'summer', 'autumn', 'winter'],
  cl4: ['autumn', 'spring'],
  cl5: ['spring', 'summer'],
  cl6: ['autumn', 'winter'],
}

const clusterSeasonWorst: Record<string, string[]> = {
  cl1: ['winter'],
  cl2: ['winter'],
  cl4: ['summer', 'winter'],
  cl5: ['winter'],
  cl6: ['spring', 'summer'],
}

const outdoorClusters = new Set(['cl1', 'cl2', 'cl5'])
const indoorClusters = new Set(['cl3', 'cl4', 'cl6'])
const clusterTypeTags: Record<string, string[]> = {
  cl1: ['family', 'elderly-friendly', 'relaxed', 'outdoor'],
  cl2: ['family', 'eco', 'relaxed', 'nature'],
  cl3: ['digital', 'indoor-safe', 'view'],
  cl4: ['gastro', 'wine', 'family', 'indoor-safe'],
  cl5: ['family', 'kids-friendly', 'active'],
  cl6: ['eco', 'relaxed', 'craft'],
}

function buildCandidatesFromPlaces(places: Place[]) {
  return places.map((p) => {
    const key = clusterKey(p)
    const title = p.title.toLowerCase()
    const seasonsBest = clusterSeasonTags[key] ?? []
    let typeTags = [...(clusterTypeTags[key] ?? [])]
    if (title.includes('дет') || title.includes('семей')) typeTags.push('family', 'kids-friendly')
    if (title.includes('тих') || title.includes('неспеш')) typeTags.push('elderly-friendly')
    if (title.includes('вино') || title.includes('дегуст') || title.includes('вкус')) typeTags.push('gastro')
    if (title.includes('природ') || title.includes('озер') || title.includes('троп')) typeTags.push('eco')
    const months = seasonsBest.flatMap((s) => {
      if (s === 'summer') return ['06', '07', '08']
      if (s === 'winter') return ['12', '01', '02']
      if (s === 'spring') return ['03', '04', '05']
      if (s === 'autumn') return ['09', '10', '11']
      return []
    })
    const isOutdoor = outdoorClusters.has(key)
    const isIndoor = indoorClusters.has(key)
    const indoorOptions = isIndoor
      ? ['дегустации', 'мастерские', 'кафе с видом']
      : ['кафе рядом', 'веранды']
    const outdoorOptions = isOutdoor
      ? ['пляж', 'набережная', 'прогулки у воды']
      : ['прогулки', 'фото-остановки']

    return {
      id: p.id,
      clusterId: key || (p.id.split('-')[0] ?? p.id),
      title: p.title,
      location: p.location,
      coordinates: { lat: p.coordinates.lat, lon: p.coordinates.lon },
      rating: p.rating,
      cost: p.cost,
      fact: p.fact,
      description: p.description,
      seasonsBest,
      availableMonths: [...new Set(months)],
      typeTags: [...new Set(typeTags)],
      indoorOptions,
      outdoorOptions,
      suitabilityFlags: {
        kidsFriendly: typeTags.some((t) => t.includes('kids') || t.includes('family')),
        elderlyFriendly: typeTags.some((t) => t.includes('elderly')),
        wifi: typeTags.some((t) => t.includes('digital')),
        accessibilityNotes: 'без сложных подъёмов',
      },
    }
  })
}

async function generate(): Promise<void> {
  generated.value = true
  apiError.value = ''
  generateLoading.value = true

  await fetchWeather()
  const places = props.routePlaces ?? []
  const candidates = places.length > 0 ? buildCandidatesFromPlaces(places) : []
  const payload = {
    requestType: 'itinerary_generation',
    travelerType: travelerType.value,
    startDate: startDate.value,
    durationDays: 3,
    interests: interests.value || undefined,
    weatherByDay: weatherByDay.value.map((w) => ({
      weatherCode: w.weatherCode,
      minTemp: w.minTemp,
      maxTemp: w.maxTemp,
      precipitationSum: w.precipitationSum,
      isRainy: w.isRainy,
      weatherLabel: w.label,
    })),
    candidates,
    outputContract: { daysCount: 3, daySlots: ['Утро', 'День', 'Вечер'], maxPlacesPerDay: 3, language: 'ru' },
  }
  const placeById = new Map(places.map((p) => [p.id, p]))
  try {
    const base = getApiBase()
    const res = await fetch(`${base}/itinerary/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`)
    const data = (await res.json()) as {
      itineraryDays: Array<{
        dayIndex: number
        steps: Array<{
          slot: string
          placeId: string
          why: string
          logisticsNotes?: string
          placeInfo?: { id: string; title: string; location: string; cost: number; rating: number; fact: string; description: string; photoUrl: string }
        }>
      }>
      overallWhy: string
    }
    days.value = data.itineraryDays.map((d) => ({
      dayIndex: d.dayIndex,
      places: d.steps
        .map((s) => {
          let place = placeById.get(s.placeId)
          if (!place && s.placeInfo) {
            place = {
              id: s.placeInfo.id,
              photo: s.placeInfo.photoUrl || '',
              rating: s.placeInfo.rating,
              title: s.placeInfo.title,
              location: s.placeInfo.location,
              coordinates: { lat: 45, lon: 38 },
              fact: s.placeInfo.fact,
              cost: s.placeInfo.cost,
              description: s.placeInfo.description,
              reviewsLabel: '',
              reviews: [],
            } as Place
          }
          if (!place) return null
          return { place, slot: s.slot as DaySlot, why: s.why, logisticsNotes: s.logisticsNotes }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    }))
    overallWhy.value = data.overallWhy ?? ''
  } catch (e) {
    apiError.value = e instanceof Error ? e.message : 'Ошибка при генерации. Бэкенд запущен на порту 8000?'
    days.value = []
    overallWhy.value = ''
  } finally {
    generateLoading.value = false
  }
  vauSelectedIndex.value = 0
  stopTripPreviewAutoplay()
  isTripPreviewOpen.value = false
}

function logisticsForDay(day: DayPlan): { transport: string; stay: string; food: string } {
  const dayIndex = day.dayIndex
  const season = monthToSeason(month.value)
  const t = travelerType.value
  const places = day.places.map((x) => x.place)
  const mainPlace = places[0]
  const dayTone =
    dayIndex === 0 ? 'на старте' : dayIndex === 1 ? 'в основной день' : 'в финальной части'

  const seasonPack = (() => {
    if (season === 'summer') {
      return {
        transport: `переезды короткие: больше пеших прогулок (${dayTone})`,
        food: 'пикники и лёгкие гастро-точки',
        stay: 'вечером — рядом с ключевыми локациями',
      }
    }
    if (season === 'winter') {
      return {
        transport: `план с запасом по времени (${dayTone})`,
        food: 'уютные остановки: тёплые дегустации',
        stay: 'размещение ближе к активностям',
      }
    }
    if (season === 'spring') {
      return {
        transport: `маршрут по "коротким лучам" (${dayTone})`,
        food: 'весенние вкусы: свежие продукты',
        stay: 'комфортный ночлег рядом',
      }
    }
    return {
      transport: `мягкий темп под осеннюю погоду (${dayTone})`,
      food: 'вкусные остановки с историей',
      stay: 'размещение в уюте',
    }
  })()

  return {
    transport: seasonPack.transport,
    stay: `${seasonPack.stay}${mainPlace ? `, опорная точка — «${mainPlace.title}»` : ''}.`,
    food: `${seasonPack.food}${mainPlace ? ` вокруг «${mainPlace.title}»` : ''}.`,
  }
}

const hasPlaces = computed(() => props.routePlaces.length > 0)
const totalCost = computed(() => props.routePlaces.reduce((sum, p) => sum + p.cost, 0))

const activeMapPointId = ref<string | null>(null)

const mapPoints = computed<MapPoint[]>(() => {
  const pts: MapPoint[] = []
  
  days.value.forEach((d) => {
    d.places.forEach((item) => {
      const mapPoint = {
        id: item.place.id,
        title: item.place.title,
        location: item.place.location,
        lat: item.place.coordinates.lat,
        lon: item.place.coordinates.lon,
        day: d.dayIndex,
        slot: item.slot,
        cost: item.place.cost,
        rating: item.place.rating,
        photo: item.place.photo,
      }
      pts.push(mapPoint)
    })
  })
  
  return pts
})

function onMapSelectPoint(id: string): void {
  activeMapPointId.value = id
  for (let di = 0; di < days.value.length; di++) {
    const d = days.value[di]!
    for (let si = 0; si < d.places.length; si++) {
      if (d.places[si]!.place.id === id) {
        previewDayIndex.value = di
        previewStepIndex.value = si
        return
      }
    }
  }
}

const isTripPreviewOpen = ref(false)
const previewDayIndex = ref(0)
const previewStepIndex = ref(0)
const previewAutoplay = ref(false)
let previewTimer: number | null = null

const previewDay = computed(() => days.value[previewDayIndex.value] ?? null)
const previewStep = computed(() => previewDay.value?.places[previewStepIndex.value] ?? null)

function truncateText(s: string, maxLen: number): string {
  const str = (s ?? '').trim()
  if (!str) return ''
  if (str.length <= maxLen) return str
  return str.slice(0, Math.max(0, maxLen - 1)).trimEnd() + '...'
}

const previewWhyShort = computed(() => truncateText(previewStep.value?.why ?? '', 170))
const previewLogisticsShort = computed(() =>
  truncateText(previewStep.value?.logisticsNotes ?? '', 130),
)
const previewProgress = computed(() => {
  const total = previewDay.value?.places.length ?? 0
  if (total <= 1) return 100
  return Math.round((previewStepIndex.value / (total - 1)) * 100)
})

function openTripPreview(): void {
  if (!days.value.length) return
  isTripPreviewOpen.value = true
  previewDayIndex.value = 0
  previewStepIndex.value = 0
  activeMapPointId.value = days.value[0]?.places[0]?.place.id ?? null
}

function closeTripPreview(): void {
  stopTripPreviewAutoplay()
  isTripPreviewOpen.value = false
}

function nextPreviewStep(): void {
  const d = previewDay.value
  if (!d || !d.places.length) return
  if (previewStepIndex.value < d.places.length - 1) {
    previewStepIndex.value += 1
    activeMapPointId.value = previewStep.value?.place.id ?? null
    return
  }
  if (previewDayIndex.value < days.value.length - 1) {
    previewDayIndex.value += 1
    previewStepIndex.value = 0
    activeMapPointId.value = previewStep.value?.place.id ?? null
    return
  }
  stopTripPreviewAutoplay()
}

function prevPreviewStep(): void {
  if (previewStepIndex.value > 0) {
    previewStepIndex.value -= 1
    activeMapPointId.value = previewStep.value?.place.id ?? null
    return
  }
  if (previewDayIndex.value > 0) {
    previewDayIndex.value -= 1
    const d = days.value[previewDayIndex.value]
    previewStepIndex.value = Math.max((d?.places.length ?? 1) - 1, 0)
    activeMapPointId.value = previewStep.value?.place.id ?? null
  }
}

function selectPreviewDay(dayIndex: number): void {
  previewDayIndex.value = dayIndex
  previewStepIndex.value = 0
}

function toggleTripPreviewAutoplay(): void {
  if (previewAutoplay.value) {
    stopTripPreviewAutoplay()
  } else {
    startTripPreviewAutoplay()
  }
}

function startTripPreviewAutoplay(): void {
  stopTripPreviewAutoplay()
  previewAutoplay.value = true
  previewTimer = window.setInterval(() => {
    nextPreviewStep()
  }, 2200)
}

function stopTripPreviewAutoplay(): void {
  previewAutoplay.value = false
  if (previewTimer !== null) {
    window.clearInterval(previewTimer)
    previewTimer = null
  }
}

onBeforeUnmount(() => {
  stopTripPreviewAutoplay()
})
</script>

<template>
  <main class="planner">
    <!-- Header -->
    <header class="planner-header">
      <button type="button" class="back-btn" @click="emit('back')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Назад
      </button>
      <div class="planner-header__center">
        <h1 class="planner-header__title">Планировщик маршрута</h1>
        <span class="planner-header__subtitle">ИИ-куратор подберёт оптимальный план</span>
      </div>
      <div class="planner-header__total">
        <span class="total-badge">{{ totalCost.toLocaleString('ru-RU') }} ₽</span>
      </div>
    </header>

    <div class="planner-content">
      <!-- Controls Panel -->
      <section class="controls-panel">
        <div class="control-group">
          <label class="control-label">Дата начала</label>
          <input
            v-model="startDate"
            type="date"
            class="control-input"
          />
          <span class="control-hint">{{ seasonLabel }} / 3 дня</span>
        </div>

        <div class="control-group">
          <label class="control-label">Тип путешественника</label>
          <select v-model="travelerType" class="control-input">
            <option value="family">Семья с детьми</option>
            <option value="elderly">Пенсионеры</option>
            <option value="digital">Фрилансер с ноутбуком</option>
            <option value="gastro">Гастроэнтузиаст</option>
            <option value="active">Активный отдых</option>
            <option value="eco">Эко/природа</option>
          </select>
          <span class="control-hint">{{ travelerLabel(travelerType) }}</span>
        </div>

        <div class="control-group">
          <label class="control-label">Интересы</label>
          <input
            v-model="interests"
            type="text"
            class="control-input"
            placeholder="Напр. дегустации, природа, театры"
          />
          <span class="control-hint">Ключевые слова для точнее подбора</span>
        </div>

        <div class="control-actions">
          <button
            type="button"
            class="generate-btn"
            :disabled="generateLoading"
            @click="generate"
          >
            <svg v-if="!generateLoading" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.64 5.64l2.12 2.12m8.48 8.48l2.12 2.12M5.64 18.36l2.12-2.12m8.48-8.48l2.12-2.12"/>
            </svg>
            {{ generateLoading ? 'Генерация...' : 'Сгенерировать маршрут' }}
          </button>
          <p v-if="!hasPlaces" class="control-note">
            Без выбранных мест — автоподбор по предпочтениям
          </p>
        </div>
      </section>

      <!-- Results -->
      <section v-if="generated" class="results-section">
        <!-- Result Header -->
        <div class="result-header">
          <div class="result-meta">
            <h2 class="result-title">{{ startDateLabel }} - {{ endDateLabel }}</h2>
            <span class="result-traveler">{{ travelerLabel(travelerType) }}</span>
          </div>
          <p v-if="overallWhy" class="result-summary">{{ overallWhy }}</p>
          <button type="button" class="preview-btn" @click="openTripPreview">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
            Примерить поездку
          </button>
        </div>

        <!-- Weather -->
        <div v-if="weatherByDay.length" class="weather-section">
          <h3 class="section-title">Прогноз погоды</h3>
          <div class="weather-grid">
            <div v-for="(w, idx) in weatherByDay" :key="idx" class="weather-card">
              <span class="weather-day">День {{ idx + 1 }}</span>
              <span class="weather-temp">{{ w.minTemp }}..{{ w.maxTemp }}°C</span>
              <span class="weather-desc">{{ w.label }}</span>
              <span class="weather-precip">{{ w.precipitationSum }} мм</span>
            </div>
          </div>
          <p v-if="weatherError" class="weather-error">{{ weatherError }}</p>
        </div>

        <p v-if="apiError" class="api-error">{{ apiError }}</p>

        <!-- Map Section -->
        <div v-if="mapPoints.length" class="map-section">
          <h3 class="section-title">Карта путешествия</h3>
          <RouteMapSwitcher
            :points="mapPoints"
            :active-point-id="activeMapPointId"
            @select-point="onMapSelectPoint"
          />
        </div>

        <!-- Days Timeline -->
        <div v-if="days.length" class="days-grid">
          <article v-for="d in days" :key="d.dayIndex" class="day-card">
            <div class="day-header">
              <h3 class="day-title">День {{ d.dayIndex + 1 }}</h3>
              <span class="day-count">{{ d.places.length }} места</span>
            </div>

            <div class="day-places">
              <div
                v-for="item in d.places"
                :key="item.place.id"
                class="place-card"
                :class="{ 'place-card--active': activeMapPointId === item.place.id }"
                @click="onMapSelectPoint(item.place.id)"
              >
                <div class="place-image-wrap">
                  <img :src="item.place.photo" :alt="item.place.title" class="place-img" />
                  <button
                    v-if="has3DTour(item.place)"
                    type="button"
                    class="place-tour-btn"
                    @click.stop="start3DTour(item.place)"
                  >
                    3D
                  </button>
                </div>
                <div class="place-info">
                  <div class="place-slot">{{ item.slot }}</div>
                  <h4 class="place-title">{{ item.place.title }}</h4>
                  <p class="place-location">{{ item.place.location }}</p>
                  <p class="place-why">{{ item.why }}</p>
                  <div class="place-footer">
                    <span class="place-price">{{ item.place.cost.toLocaleString('ru-RU') }} ₽</span>
                    <button
                      type="button"
                      class="place-more-btn"
                      @click.stop="openClusterByPlaceId(item.place.id)"
                    >
                      Подробнее
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div
              class="day-logistics"
              :ref="setLogisticsRef(d.dayIndex)"
            >
              <h4 class="logistics-title">Логистика</h4>
              <div class="logistics-row">
                <span class="logistics-label">Транспорт</span>
                <span class="logistics-value">{{ logisticsForDay(d).transport }}</span>
              </div>
              <div class="logistics-row">
                <span class="logistics-label">Ночлег</span>
                <span class="logistics-value">{{ logisticsForDay(d).stay }}</span>
              </div>
              <div class="logistics-row">
                <span class="logistics-label">Питание</span>
                <span class="logistics-value">{{ logisticsForDay(d).food }}</span>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>

    <!-- Trip Preview Modal -->
    <div v-if="isTripPreviewOpen" class="preview-modal" @click="closeTripPreview">
      <div class="preview-modal__content" @click.stop>
        <div class="preview-modal__header">
          <h2 class="preview-modal__title">Примерка поездки</h2>
          <div class="preview-modal__controls">
            <button type="button" class="preview-ctrl-btn" @click="toggleTripPreviewAutoplay">
              {{ previewAutoplay ? 'Пауза' : 'Автоплей' }}
            </button>
            <button type="button" class="preview-ctrl-btn preview-ctrl-btn--close" @click="closeTripPreview">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="preview-days">
          <button
            v-for="d in days"
            :key="'pday-' + d.dayIndex"
            type="button"
            class="preview-day-btn"
            :class="{ 'preview-day-btn--active': d.dayIndex === previewDayIndex }"
            @click="selectPreviewDay(d.dayIndex)"
          >
            День {{ d.dayIndex + 1 }}
          </button>
        </div>

        <div class="preview-progress">
          <div class="preview-progress__bar" :style="{ width: `${previewProgress}%` }"></div>
        </div>

        <transition name="fade" mode="out-in">
          <div v-if="previewStep" :key="`${previewDayIndex}-${previewStepIndex}`" class="preview-body">
            <img :src="previewStep.place.photo" :alt="previewStep.place.title" class="preview-image" />
            <div class="preview-info">
              <span class="preview-meta">День {{ previewDayIndex + 1 }} / {{ previewStep.slot }}</span>
              <h3 class="preview-place">{{ previewStep.place.title }}</h3>
              <p class="preview-why">{{ previewWhyShort }}</p>
              <p v-if="previewLogisticsShort" class="preview-logistics">{{ previewLogisticsShort }}</p>
            </div>
          </div>
        </transition>

        <div class="preview-nav">
          <button type="button" class="preview-nav-btn" @click="prevPreviewStep">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Назад
          </button>
          <button type="button" class="preview-nav-btn" @click="nextPreviewStep">
            Далее
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 3D Tour Modal -->
    <div v-if="show3DTour && currentTourPlace" class="tour-modal" @click="close3DTour">
      <div class="tour-modal__content" @click.stop>
        <div class="tour-modal__header">
          <h3 class="tour-modal__title">{{ currentTourPlace.title }}</h3>
          <button type="button" class="tour-modal__close" @click="close3DTour">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="tour-modal__body">
          <AvalinViewer
            :tour-url="currentTourPlace.avalinTourUrl"
            :title="currentTourPlace.title"
            height="500px"
          />
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.planner {
  min-height: 100vh;
  background: var(--bg-primary);
}

/* Header */
.planner-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
  z-index: 50;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.back-btn:hover {
  color: var(--text-primary);
  background: var(--bg-elevated);
}

.planner-header__center {
  text-align: center;
}

.planner-header__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.planner-header__subtitle {
  font-size: 13px;
  color: var(--text-tertiary);
}

.total-badge {
  padding: var(--space-2) var(--space-4);
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-light);
  background: var(--accent-muted);
  border: 1px solid var(--accent-border);
  border-radius: var(--radius-md);
}

/* Content */
.planner-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6);
}

/* Controls */
.controls-panel {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  margin-bottom: var(--space-6);
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.control-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.control-input {
  padding: var(--space-3) var(--space-4);
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  outline: none;
}

.control-input:focus {
  border-color: var(--accent);
}

.control-hint {
  font-size: 12px;
  color: var(--text-tertiary);
}

.control-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  justify-content: center;
}

.generate-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  font-size: 14px;
  font-weight: 600;
  color: #000;
  background: var(--accent);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.generate-btn:hover:not(:disabled) {
  background: var(--accent-light);
}

.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.control-note {
  font-size: 12px;
  color: var(--text-tertiary);
  text-align: center;
}

/* Results */
.results-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.result-header {
  padding: var(--space-5);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
}

.result-meta {
  display: flex;
  align-items: baseline;
  gap: var(--space-4);
  margin-bottom: var(--space-3);
}

.result-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.result-traveler {
  font-size: 14px;
  color: var(--accent);
  padding: var(--space-1) var(--space-3);
  background: var(--accent-muted);
  border-radius: var(--radius-full);
}

.result-summary {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin-bottom: var(--space-4);
}

.preview-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.preview-btn:hover {
  background: var(--bg-elevated);
  border-color: var(--accent-border);
}

/* Weather */
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-4);
}

.weather-section {
  padding: var(--space-5);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
}

.weather-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

.weather-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-4);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}

.weather-day {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-tertiary);
  text-transform: uppercase;
}

.weather-temp {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.weather-desc {
  font-size: 14px;
  color: var(--text-secondary);
}

.weather-precip {
  font-size: 12px;
  color: var(--text-tertiary);
}

.weather-error, .api-error {
  font-size: 13px;
  color: #ef4444;
  margin-top: var(--space-2);
}

/* Map */
.map-section {
  padding: var(--space-5);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
}

/* Days Grid */
.days-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-5);
}

.day-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}

.day-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.day-count {
  font-size: 12px;
  color: var(--text-tertiary);
  padding: var(--space-1) var(--space-2);
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
}

.day-places {
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.place-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.place-card:hover {
  border-color: var(--border-default);
}

.place-card--active {
  border-color: var(--accent-border);
  background: var(--accent-muted);
}

.place-image-wrap {
  position: relative;
  aspect-ratio: 16/9;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.place-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.place-tour-btn {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  padding: var(--space-1) var(--space-2);
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.place-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.place-slot {
  font-size: 11px;
  font-weight: 500;
  color: var(--accent);
  text-transform: uppercase;
}

.place-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
}

.place-location {
  font-size: 12px;
  color: var(--text-tertiary);
}

.place-why {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.place-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-2);
}

.place-price {
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-light);
}

.place-more-btn {
  padding: var(--space-1) var(--space-2);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.place-more-btn:hover {
  color: var(--text-primary);
  border-color: var(--border-default);
}

/* Logistics */
.day-logistics {
  padding: var(--space-4);
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
}

.logistics-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-3);
}

.logistics-row {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}

.logistics-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-tertiary);
  min-width: 80px;
}

.logistics-value {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* Preview Modal */
.preview-modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
}

.preview-modal__content {
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
}

.preview-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border-subtle);
}

.preview-modal__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.preview-modal__controls {
  display: flex;
  gap: var(--space-2);
}

.preview-ctrl-btn {
  padding: var(--space-2) var(--space-3);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.preview-ctrl-btn:hover {
  color: var(--text-primary);
  background: var(--bg-elevated);
}

.preview-ctrl-btn--close {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2);
}

.preview-days {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-5);
}

.preview-day-btn {
  padding: var(--space-2) var(--space-3);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.preview-day-btn--active {
  color: var(--text-primary);
  background: var(--accent-muted);
  border-color: var(--accent-border);
}

.preview-progress {
  height: 4px;
  background: var(--bg-tertiary);
  margin: 0 var(--space-5);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.preview-progress__bar {
  height: 100%;
  background: var(--accent);
  transition: width 200ms ease;
}

.preview-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-5);
  padding: var(--space-5);
}

.preview-image {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
  border-radius: var(--radius-lg);
}

.preview-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.preview-meta {
  font-size: 12px;
  color: var(--text-tertiary);
  text-transform: uppercase;
}

.preview-place {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.preview-why {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.preview-logistics {
  font-size: 13px;
  color: var(--text-tertiary);
}

.preview-nav {
  display: flex;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--border-subtle);
}

.preview-nav-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.preview-nav-btn:hover {
  color: var(--text-primary);
  background: var(--bg-elevated);
}

/* Tour Modal */
.tour-modal {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
}

.tour-modal__content {
  width: 100%;
  max-width: 900px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.tour-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border-subtle);
}

.tour-modal__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.tour-modal__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.tour-modal__body {
  padding: var(--space-4);
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 1024px) {
  .controls-panel {
    grid-template-columns: 1fr;
  }
  
  .days-grid {
    grid-template-columns: 1fr;
  }
  
  .preview-body {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .planner-content {
    padding: var(--space-4);
  }
  
  .planner-header {
    padding: var(--space-3) var(--space-4);
  }
  
  .planner-header__title {
    font-size: 16px;
  }
  
  .weather-grid {
    grid-template-columns: 1fr;
  }
}
</style>

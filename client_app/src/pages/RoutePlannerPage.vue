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
// Оставляем переменную `month` как computed, чтобы не переписывать логику сезонности.
const month = computed<number>(() => parseISODateUTC(startDate.value).getUTCMonth() + 1)

const endDate = computed<string>(() => {
  const dt = parseISODateUTC(startDate.value)
  return formatISODateUTC(addDaysUTC(dt, 2))
})

const startDateLabel = computed(() => startDate.value)
const endDateLabel = computed(() => endDate.value)
const travelerType = ref<TravelerType>('family')

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

// 3D Tour state for route
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
  // Open-Meteo weather codes:
  // 0 clear, 1-2 mainly clear/partly cloudy, 3 overcast,
  // 45 fog, 48 depositing rime fog,
  // 51-67 drizzle/rain, 71-77 snow, 80-82 rain showers, 85-86 snow showers,
  // 95 thunderstorm, 96-99 thunderstorm with hail
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

// Вау-блок: “дистанционный визит” (витрина на основе сгенерированного плана).
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
  // id вида `${clusterId}-p1`
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

// Кластеры, которые плохо подходят для конкретного сезона
const clusterSeasonWorst: Record<string, string[]> = {
  cl1: ['winter'],
  cl2: ['winter'],
  cl4: ['summer', 'winter'],
  cl5: ['winter'],
  cl6: ['spring', 'summer'],
}

// Outdoor-кластеры (штраф при дождях), indoor (бонус при дождях)
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

// Скоринг места — синхронизирован с бэкендом (_score_candidate)
function scorePlace(place: Place): number {
  const t = travelerType.value
  const season = monthToSeason(month.value)
  const key = clusterKey(place)
  const title = place.title.toLowerCase()
  const location = place.location.toLowerCase()
  let score = 0

  // --- Сезонность (главный фактор, +40 / -25) ---
  const best = clusterSeasonTags[key]
  if (best) {
    if (best.includes(season)) {
      score += 40
    } else {
      const worst = clusterSeasonWorst[key] ?? []
      if (worst.includes(season)) score -= 25
    }
  }

  // --- Погода: учитываем дождливые дни поездки ---
  const rainyDays = weatherByDay.value.filter((w) => w.isRainy).length
  if (rainyDays > 0) {
    if (outdoorClusters.has(key)) score -= rainyDays * 6
    if (indoorClusters.has(key)) score += rainyDays * 5
  }

  // Под тип туриста
  if (t === 'family') {
    if (title.includes('дет')) score += 12
    if (title.includes('пар')) score += 6
    if (location.includes('интересно')) score += 4
  }
  if (t === 'elderly') {
    if (title.includes('мягкий') || title.includes('неспеш') || title.includes('тих')) score += 12
    if (location.includes('тих')) score += 8
  }
  if (t === 'digital') {
    if (title.includes('работ') || title.includes('коворкин') || title.includes('вид')) score += 15
    if (location.includes('кофе') || location.includes('терраса')) score += 6
  }
  if (t === 'gastro') {
    if (title.includes('вино') || title.includes('дегуст') || title.includes('вкус') || title.includes('ремесла')) score += 15
    if (location.includes('вкус') || location.includes('продукт')) score += 8
  }
  if (t === 'active') {
    if (title.includes('маршрут') || title.includes('прогул') || title.includes('троп') || title.includes('паузы')) score += 12
  }
  if (t === 'eco') {
    if (title.includes('природ') || title.includes('озер') || title.includes('лес') || title.includes('тропа')) score += 15
    if (location.includes('зел')) score += 6
  }

  // База по рейтингу
  score += Math.round(place.rating * 2)
  return score
}

function slotForIndex(i: number): DaySlot {
  if (i % 3 === 0) return 'Утро'
  if (i % 3 === 1) return 'День'
  return 'Вечер'
}

function whyForPlace(place: Place, dayIndex: number): string {
  const season = monthToSeason(month.value)
  const key = clusterKey(place)
  const base = (() => {
    if (season === 'summer') return 'в тёплый сезон особенно приятно гулять без спешки'
    if (season === 'winter') return 'в холодный сезон важны уют и “смысловые” остановки'
    if (season === 'spring') return 'весной ощущается свежесть и легко планировать короткие маршруты'
    return 'осенью выигрывают атмосфера и погода для прогулок'
  })()

  const t = travelerType.value
  const audience = (() => {
    if (t === 'family') return 'подходит семье: спокойный темп и понятные сценарии'
    if (t === 'elderly') return 'подходит тем, кому важны тишина и удобная логика передвижений'
    if (t === 'digital') return 'хорошо для фокуса: вид, кофе и рабочий ритм'
    if (t === 'gastro') return 'про вкус: дегустация/ремесло и “история” вокруг места'
    if (t === 'active') return 'даёт движение: прогулки и короткие “точки-успеха”'
    return 'про природу: вода/лес/тропа и ощущение “я перезагрузился(лась)”'
  })()

  const keyHint: Record<string, string> = {
    cl1: 'мы поставили акцент на море рядом',
    cl2: 'добавили зелёную паузу у воды',
    cl3: 'оставили фокус на видовых остановках',
    cl4: 'встроили вкусный сценарий с дегустацией',
    cl5: 'включили семейный блок',
    cl6: 'сделали маршрут менее “толповым”',
  }

  return `Выбранное место: “${place.title}”. ${keyHint[key] ?? 'под настроение'} — ${audience}. ${base}. День ${dayIndex + 1}.`
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
// (локальный fallback удалён — генерация через API)
function _unusedLocalFallback_REMOVED() {
  const places = props.routePlaces ?? []
  const sorted = [...places].sort((a, b) => scorePlace(b) - scorePlace(a))
  const dayBuckets: DayPlan[] = [
    { dayIndex: 0, places: [] },
    { dayIndex: 1, places: [] },
    { dayIndex: 2, places: [] },
  ]

  sorted.forEach((p, i) => {
    const dayIndex = i % 3
    dayBuckets[dayIndex]!.places.push({
      place: p,
      slot: slotForIndex(i),
      why: whyForPlace(p, dayIndex),
    })
  })

  days.value = dayBuckets

  const season = monthToSeason(month.value)
  overallWhy.value = `ИИ-куратор: для ${travelerLabel(travelerType.value)} в ${season === 'winter' ? 'зимний' : season === 'spring' ? 'весенний' : season === 'summer' ? 'летний' : 'осенний'} период мы распределили места по дням так, чтобы сохранить темп, логичность и “вау”-атмосферу.`

  // Всегда начинаем “виртуальный визит” с первого пункта плана.
  vauSelectedIndex.value = 0
}

function logisticsForDay(day: DayPlan): { transport: string; stay: string; food: string } {
  const dayIndex = day.dayIndex
  const season = monthToSeason(month.value)
  const t = travelerType.value
  const places = day.places.map((x) => x.place)
  const mainPlace = places[0]
  const mainKey = mainPlace?.id.split('-')[0] ?? 'general'
  const clusterKeys = Array.from(new Set(places.map((p) => p.id.split('-')[0] ?? '')))
  const clusterHint = clusterKeys.length > 1 ? 'сбалансировали разные типы локаций' : 'держим единый ритм дня'
  const dayTone =
    dayIndex === 0 ? 'на старте' : dayIndex === 1 ? 'в основной день' : 'в финальной части'
  const w = weatherByDay.value[dayIndex]
  const variantSeed =
    dayIndex +
    (mainPlace?.title.length ?? 0) +
    Math.round((w?.precipitationSum ?? 0) * 10) +
    (w?.weatherCode ?? 0)
  const pick = (arr: string[]) => arr[Math.abs(variantSeed) % arr.length] ?? arr[0] ?? ''
  const weatherSuffix = w
    ? w.isRainy
      ? `план А/Б: ${w.label} и осадки (${w.precipitationSum} мм) — больше “внутренних” остановок, меньше долгих переходов`
      : `похоже на удачный день: ${w.label} (осадки ${w.precipitationSum} мм) — больше прогулок`
    : 'Погода загрузится после генерации'

  const seasonPack = (() => {
    if (season === 'summer') {
      return {
        transport: `переезды короткие: больше пеших прогулок и “окна” под закаты (${dayTone})`,
        food: 'пикники и лёгкие гастро-точки (фермерские продукты + местная кухня)',
        stay: 'вечером — рядом с ключевыми локациями: меньше времени в дороге',
      }
    }
    if (season === 'winter') {
      return {
        transport: `план — с запасом по времени: меньше долгих перемещений (${dayTone})`,
        food: 'уютные остановки: тёплые дегустации и “домашняя” кухня',
        stay: 'выбираем размещение ближе к активностям и с комфортным сервисом',
      }
    }
    if (season === 'spring') {
      return {
        transport: `маршрут по “коротким лучам”: переходы между локациями удобны (${dayTone})`,
        food: 'весенние вкусы: свежие продукты и локальные рынки',
        stay: 'комфортный ночлег рядом, чтобы начинать день без спешки',
      }
    }
    return {
      transport: `мягкий темп: логистика под осеннюю погоду и виды (${dayTone})`,
      food: 'вкусные остановки с историей: ремесло, вино, сезонные блюда',
      stay: 'размещение, которое позволяет чаще возвращаться “в уют”',
    }
  })()

  const transportVariants = [
    `${seasonPack.transport}; ${weatherSuffix}; ${clusterHint}.`,
    `${weatherSuffix}; ${seasonPack.transport}; ${clusterHint}.`,
    `${seasonPack.transport}. ${clusterHint}; ${weatherSuffix}.`,
  ]

  const stayByCluster: Record<string, string[]> = {
    cl1: ['ближе к набережной', 'в районе моря и вечерних маршрутов'],
    cl2: ['в тихой зоне у природы', 'рядом с прогулочными зонами'],
    cl3: ['в точке с удобным ритмом дня', 'рядом с рабочими и обзорными локациями'],
    cl4: ['рядом с дегустационными точками', 'в локации с короткими переездами между винными объектами'],
    cl5: ['в семейно-спокойной зоне', 'рядом с локациями без долгих переходов'],
    cl6: ['в спокойном районе без толпы', 'рядом с ремесленными точками'],
    general: ['рядом с ключевыми локациями дня', 'в зоне с удобной логистикой'],
  }
  const stayHint = pick(stayByCluster[mainKey] ?? stayByCluster.general)

  const foodBySeason: Record<string, string[]> = {
    spring: ['сезонные локальные продукты и лёгкое меню', 'рынки и фермерские точки без спешки'],
    summer: ['лёгкие блюда и прохладные остановки', 'гастро-точки с короткими паузами между прогулками'],
    autumn: ['сезонные блюда и тёплые гастро-остановки', 'локальная кухня с акцентом на атмосферу'],
    winter: ['тёплые форматы и уютные точки питания', 'комфортные остановки в помещении'],
  }
  const foodBase = pick(foodBySeason[season] ?? foodBySeason.spring)

  if (t === 'family') {
    return {
      transport: pick(transportVariants),
      stay: `семейное размещение ${stayHint}${mainPlace ? `, опорная точка — «${mainPlace.title}»` : ''}.`,
      food: `${foodBase}; учитываем детские форматы и короткие сценарии${mainPlace ? ` вокруг «${mainPlace.title}»` : ''}.`,
    }
  }
  if (t === 'elderly') {
    return {
      transport: pick(transportVariants),
      stay: `размещение ${stayHint}${mainPlace ? `, ядро дня — «${mainPlace.title}»` : ''}, без долгих пересадок.`,
      food: `${foodBase}; делаем остановки понятными и без спешки.`,
    }
  }
  if (t === 'digital') {
    return {
      transport: pick(transportVariants),
      stay: `ночлег ${stayHint}${mainPlace ? `, ключевая точка — «${mainPlace.title}»` : ''}, чтобы проще планировать рабочие блоки.`,
      food: `${foodBase}; кофе/террасы используем как опорные точки.`,
    }
  }

  return {
    transport: pick(transportVariants),
    stay: `${pick([seasonPack.stay, `размещение ${stayHint}`])}${mainPlace ? ` Опорная точка: «${mainPlace.title}».` : ''}`,
    food: `${foodBase}${mainPlace ? ` Ближе к району «${mainPlace.location}».` : ''}`,
  }
}

function offerForPlace(place: Place): string {
  const key = place.id.split('-')[0] ?? ''
  const season = monthToSeason(month.value)

  const seasonSuffix =
    season === 'summer'
      ? 'летний бонус'
      : season === 'winter'
        ? 'зимний уют'
        : season === 'spring'
          ? 'весенний пик'
          : 'осеннее предложение'

  const offersByCluster: Record<string, string[]> = {
    cl1: ['закатный маршрут у моря', 'прогулка по набережной + чай', 'видовой сет у воды'],
    cl2: ['тихая прогулка у воды', 'зелёная пауза и пикник', 'маршрут у озера без спешки'],
    cl3: ['кофе + фокусный сценарий', 'рабочая терраса с видом', 'видовая точка и тихий ритм'],
    cl4: ['дегустация со спецценой', 'вкусный сет локальных продуктов', 'история места + дегустация'],
    cl5: ['семейный мастер-класс', 'детская активность + пауза', 'семейный сценарий без спешки'],
    cl6: ['ремесленная история без толпы', 'тихий маршрут по станице', 'локальные мастерские и фото'],
    general: ['персональный бонус', 'спокойный сценарий', 'локальный штрих'],
  }

  const variants = offersByCluster[key] ?? offersByCluster.general

  const basis = `${place.id}|${place.title}|${seasonSuffix}`
  let hash = 0
  for (let i = 0; i < basis.length; i += 1) {
    hash = (hash * 31 + basis.charCodeAt(i)) % 100000
  }
  const offer = variants[hash % variants.length] ?? variants[0] ?? 'персональный бонус'

  return `Спецпредложение (${seasonSuffix}): ${offer}.`
}

function offerForDay(d: DayPlan): string {
  const first = d.places[0]?.place
  if (!first) return ''
  return offerForPlace(first)
}

function osmEmbedUrlForPlace(place: Place): string {
  const { lat, lon } = place.coordinates
  const d = 0.06
  const bbox = `${lon - d},${lat - d},${lon + d},${lat + d}`
  const marker = encodeURIComponent(`${lat},${lon}`)
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`
}

function osmLinkUrlForPlace(place: Place): string {
  const { lat, lon } = place.coordinates
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=11/${lat}/${lon}`
}

function osmEmbedUrlForDay(d: DayPlan): string {
  const first = d.places[0]?.place
  if (!first) return ''
  return osmEmbedUrlForPlace(first)
}

function osmLinkUrlForDay(d: DayPlan): string {
  const first = d.places[0]?.place
  if (!first) return ''
  return osmLinkUrlForPlace(first)
}

const hasPlaces = computed(() => props.routePlaces.length > 0)
const totalCost = computed(() => props.routePlaces.reduce((sum, p) => sum + p.cost, 0))

// --- Leaflet карта маршрута ---
const activeMapPointId = ref<string | null>(null)

const mapPoints = computed<MapPoint[]>(() => {
  const pts: MapPoint[] = []
  console.log('=== ROUTE PLANNER MAPPOINTS ===')
  console.log('days.value.length:', days.value.length)
  console.log('days.value:', days.value)
  
  days.value.forEach((d, dayIndex) => {
    console.log(`День ${dayIndex}, мест: ${d.places.length}`)
    d.places.forEach((item, placeIndex) => {
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
      console.log(`  Место ${placeIndex}:`, mapPoint)
    })
  })
  
  console.log('Итого mapPoints:', pts.length)
  return pts
})

function onMapSelectPoint(id: string): void {
  activeMapPointId.value = id
  // Синхронизируем с TripPreview: ищем шаг по id
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

// "Примерка поездки": интерактивный проигрыватель маршрута.
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
  return str.slice(0, Math.max(0, maxLen - 1)).trimEnd() + '…'
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
  // Конец сценария — останавливаемся на последнем шаге.
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
  <main class="planner" role="application" aria-label="Планировщик маршрута для туриста">
    <div class="planner__bg" aria-hidden="true" />

    <header class="planner__header">
      <button type="button" class="planner__backBtn" @click="emit('back')">
        <span aria-hidden="true">←</span>
        <span>Назад</span>
      </button>

      <div class="planner__titleWrap">
        <div class="planner__title">Маршрут для туриста</div>
        <div class="planner__subtitle">ИИ-куратор: сезон + подход под ваш тип</div>
      </div>

      <div class="planner__meta">
        <div class="planner__pill">Всего: {{ totalCost }} ₽</div>
      </div>
    </header>

    <section class="planner__content">
      <div class="planner__controls">
        <label class="planner__field">
          <span class="planner__fieldLabel">Даты поездки</span>
          <input
            v-model="startDate"
            class="planner__select"
            type="date"
            aria-label="Дата начала поездки"
          />
          <span class="planner__fieldHint"
            >Сезон: {{ seasonLabel }} • Длительность: 3 дня</span
          >
        </label>

        <label class="planner__field">
          <span class="planner__fieldLabel">Кто вы</span>
          <select v-model="travelerType" class="planner__select" aria-label="Выбор типа туриста">
            <option value="family">Семья с детьми</option>
            <option value="elderly">Пенсионеры</option>
            <option value="digital">Фрилансер с ноутбуком</option>
            <option value="gastro">Гастроэнтузиаст</option>
            <option value="active">Активный отдых</option>
            <option value="eco">Эко/природа</option>
          </select>
          <span class="planner__fieldHint">Подстройка под: {{ travelerLabel(travelerType) }}</span>
        </label>

        <div class="planner__actions">
          <button
            type="button"
            class="planner__generateBtn"
            :disabled="generateLoading"
            @click="generate"
          >
            {{ generateLoading ? 'Генерация...' : 'Сгенерировать маршрут' }}
          </button>
          <div v-if="!hasPlaces" class="planner__actionsHint">
            Без выбранных мест — автоматический подбор по предпочтениям.
          </div>
        </div>
      </div>

      <div v-if="generated" class="planner__result">
        <div class="planner__resultHeader">
          <div class="planner__resultTitle">
            Результат на {{ startDateLabel }}–{{ endDateLabel }} • {{ travelerLabel(travelerType) }}
          </div>
          <div class="planner__resultWhy">{{ overallWhy }}</div>
          <button type="button" class="planner__previewBtn" @click="openTripPreview">
            Примерить поездку
          </button>
        </div>

        <section class="plannerWeather" aria-label="Прогноз погоды">
          <div class="plannerWeather__title">Погода под ваш план</div>
          <div class="plannerWeather__row" role="list" aria-label="Прогноз по дням">
            <div
              v-for="(w, idx) in weatherByDay"
              :key="`w-${idx}`"
              class="plannerWeather__day"
              role="listitem"
            >
              <div class="plannerWeather__dayLabel">День {{ idx + 1 }}</div>
              <div class="plannerWeather__temps">
                {{ w.minTemp }}..{{ w.maxTemp }}°C
              </div>
              <div class="plannerWeather__desc">
                {{ w.label }} • осадки {{ w.precipitationSum }} мм
              </div>
            </div>
          </div>

          <div v-if="weatherLoading" class="plannerWeather__status">Загружаем погоду...</div>
          <div v-else-if="weatherError" class="plannerWeather__status">{{ weatherError }}</div>
          <div v-else-if="!weatherByDay.length" class="plannerWeather__status">
            Нажмите “Сгенерировать маршрут”, чтобы подгрузить погоду.
          </div>
          <div v-if="apiError" class="plannerWeather__status plannerWeather__status--error">{{ apiError }}</div>
        </section>

        <section v-if="vauItems.length" class="plannerVau" aria-label="Дистанционный визит (вау)">
          <div class="plannerVau__header">Дистанционный визит</div>

          <div v-if="vauActive" class="plannerVau__hero">
            <img :src="vauActive.place.photo" class="plannerVau__heroImg" :alt="vauActive.place.title" />
            <div class="plannerVau__heroOverlay" aria-hidden="true" />
            <div class="plannerVau__heroText">
              <div class="plannerVau__heroTitle">{{ vauActive.place.title }}</div>
              <div class="plannerVau__heroMeta">
                День {{ vauActive.dayIndex + 1 }} • {{ vauActive.slot }}
              </div>
              <div class="plannerVau__heroWhy">{{ vauActive.why }}</div>
            </div>
          </div>

          <div class="plannerVau__thumbs" role="list" aria-label="Сменить объект визита">
            <button
              v-for="(it, idx) in vauItems"
              :key="it.place.id + '-' + idx"
              type="button"
              class="plannerVau__thumb"
              :class="{ 'plannerVau__thumb--active': idx === vauSelectedIndex }"
              role="listitem"
              :aria-label="'Показать: ' + it.place.title"
              @click="vauSelectedIndex = idx"
            >
              <img :src="it.place.photo" class="plannerVau__thumbImg" :alt="it.place.title" />
            </button>
          </div>
        </section>

        <section v-if="mapPoints.length" class="plannerMapSection">
          <div class="plannerMapSection__header">Карта вашего путешествия</div>
          <RouteMapSwitcher
            :points="mapPoints"
            :active-point-id="activeMapPointId"
            @select-point="onMapSelectPoint"
          />
        </section>

        <div class="plannerTimeline" role="list" aria-label="Маршрут по дням">
          <section
            v-for="d in days"
            :key="d.dayIndex"
            class="plannerDay"
            role="listitem"
            :aria-label="`День ${d.dayIndex + 1}`"
          >
            <div class="plannerDay__top">
              <div class="plannerDay__label">День {{ d.dayIndex + 1 }}</div>
              <div class="plannerDay__badge">{{ d.places.length }} места</div>
            </div>

            <div class="plannerDay__list">
              <article
                v-for="item in d.places"
                :key="item.place.id"
                class="plannerPlace"
                :class="{ 'plannerPlace--active': activeMapPointId === item.place.id }"
                @click="onMapSelectPoint(item.place.id)"
              >
                <div class="plannerPlace__media">
                  <img :src="item.place.photo" :alt="item.place.title" class="plannerPlace__img" />

                  <!-- 3D Tour Button -->
                  <button
                    v-if="has3DTour(item.place)"
                    type="button"
                    class="plannerPlace__3dBtn"
                    @click.stop="start3DTour(item.place)"
                  >
                    <span class="plannerPlace__3dBtnIcon">🎯</span>
                    <span>3D тур</span>
                  </button>
                </div>

                <div class="plannerPlace__body">
                  <div class="plannerPlace__row">
                    <div class="plannerPlace__title">{{ item.slot }} • {{ item.place.title }}</div>
                    <div class="plannerPlace__cost">{{ item.place.cost }} ₽</div>
                  </div>
                  <div class="plannerPlace__loc">{{ item.place.location }}</div>
                  <div class="plannerPlace__why">{{ item.why }}</div>
                  <div class="plannerPlace__actions">
                    <button
                      type="button"
                      class="plannerPlace__moreBtn"
                      @click.stop="openClusterByPlaceId(item.place.id)"
                    >
                      Читать далее
                    </button>
                  </div>
                </div>
              </article>
            </div>

            <div
              class="plannerDay__logistics"
              :ref="setLogisticsRef(d.dayIndex)"
              :style="{ height: logisticsHeight ? `${logisticsHeight}px` : 'auto' }"
            >
              <div class="plannerDay__logTitle">Логистика дня</div>
              <div class="plannerDay__logLine">
                <span class="plannerDay__logKey">Транспорт:</span>
                <span class="plannerDay__logVal">{{ logisticsForDay(d).transport }}</span>
              </div>
              <div class="plannerDay__logLine">
                <span class="plannerDay__logKey">Ночлег:</span>
                <span class="plannerDay__logVal">{{ logisticsForDay(d).stay }}</span>
              </div>
              <div class="plannerDay__logLine">
                <span class="plannerDay__logKey">Питание:</span>
                <span class="plannerDay__logVal">{{ logisticsForDay(d).food }}</span>
              </div>

              <div v-if="offerForDay(d)" class="plannerDay__offer">
                {{ offerForDay(d) }}
              </div>


            </div>
          </section>
        </div>

        <div class="planner__mapHint">
          Карта показывает ключевые точки дня.
        </div>
      </div>
    </section>

    <div v-if="isTripPreviewOpen" class="tripPreview" role="dialog" aria-modal="true">
      <div class="tripPreview__card">
        <div class="tripPreview__header">
          <div class="tripPreview__title">Примерка поездки</div>
          <div class="tripPreview__controls">
            <button type="button" class="tripPreview__ctrlBtn" @click="toggleTripPreviewAutoplay">
              {{ previewAutoplay ? 'Пауза' : 'Автоплей' }}
            </button>
            <button type="button" class="tripPreview__ctrlBtn" @click="closeTripPreview">Закрыть</button>
          </div>
        </div>

        <div class="tripPreview__days">
          <button
            v-for="d in days"
            :key="'pday-' + d.dayIndex"
            type="button"
            class="tripPreview__dayBtn"
            :class="{ 'tripPreview__dayBtn--active': d.dayIndex === previewDayIndex }"
            @click="selectPreviewDay(d.dayIndex)"
          >
            День {{ d.dayIndex + 1 }}
          </button>
        </div>

        <div class="tripPreview__progressWrap">
          <div class="tripPreview__progress" :style="{ width: `${previewProgress}%` }" />
        </div>

        <transition name="tripPreviewStepFade" mode="out-in">
          <div
            v-if="previewStep"
            :key="`preview-${previewDayIndex}-${previewStepIndex}`"
            class="tripPreview__body"
          >
            <img :src="previewStep.place.photo" :alt="previewStep.place.title" class="tripPreview__img" />
            <div class="tripPreview__info">
              <div class="tripPreview__meta">
                День {{ previewDayIndex + 1 }} • {{ previewStep.slot }} • Шаг {{ previewStepIndex + 1 }}
              </div>
              <div class="tripPreview__place">{{ previewStep.place.title }}</div>
              <div class="tripPreview__why">{{ previewWhyShort }}</div>
              <div class="tripPreview__loc">{{ previewLogisticsShort }}</div>
              <div v-if="osmEmbedUrlForPlace(previewStep.place)" class="tripPreview__map">
                <iframe
                  :src="osmEmbedUrlForPlace(previewStep.place)"
                  class="tripPreview__mapFrame"
                  loading="lazy"
                  referrerpolicy="no-referrer"
                  aria-label="Мини-карта текущей точки"
                />
              </div>
              <a
                class="tripPreview__mapLink"
                :href="osmLinkUrlForPlace(previewStep.place)"
                target="_blank"
                rel="noreferrer"
              >
                Открыть точку на карте
              </a>
            </div>
          </div>
        </transition>

        <div class="tripPreview__footer">
          <button type="button" class="tripPreview__ctrlBtn" @click="prevPreviewStep">◀ Назад</button>
          <button type="button" class="tripPreview__ctrlBtn" @click="nextPreviewStep">Дальше ▶</button>
        </div>
      </div>
    </div>

    <!-- 3D Tour Modal -->
    <div v-if="show3DTour && currentTourPlace" class="tourModal" @click="close3DTour">
      <div class="tourModal__content" @click.stop>
        <div class="tourModal__header">
          <h3 class="tourModal__title">{{ currentTourPlace.title }}</h3>
          <button type="button" class="tourModal__close" @click="close3DTour">×</button>
        </div>
        <div class="tourModal__body">
          <AvalinViewer
            :tour-url="currentTourPlace.avalinTourUrl"
            :title="currentTourPlace.title"
            height="500px"
            @tour-started="() => console.log('3D тур маршрута начат')"
            @tour-ended="() => console.log('3D тур маршрута завершен')"
          />
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.planner {
  position: fixed;
  inset: 0;
  z-index: 60;
  color: rgba(255, 255, 255, 0.98);
  overflow: auto;
  background:
    radial-gradient(1200px 600px at 10% 5%, rgba(0, 194, 255, 0.28), transparent 55%),
    linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.52) 0%,
      rgba(0, 0, 0, 0.65) 65%,
      rgba(0, 0, 0, 0.75) 100%
    );
}

.planner__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.planner__header {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
}

.planner__backBtn {
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.95);
  border-radius: 14px;
  padding: 10px 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.planner__titleWrap {
  flex: 1;
  min-width: 0;
  text-align: center;
}

.planner__title {
  font-weight: 1000;
  letter-spacing: 0.2px;
  font-size: 18px;
}

.planner__subtitle {
  opacity: 0.85;
  margin-top: 4px;
  font-size: 13px;
}

.planner__meta {
  width: 160px;
  display: flex;
  justify-content: flex-end;
}

.planner__pill {
  border-radius: 999px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(0, 0, 0, 0.22);
  font-weight: 900;
}

.planner__content {
  padding: 18px 16px 34px;
  width: min(1100px, 100%);
  margin: 0 auto;
}

.planner__controls {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 14px;
  align-items: start;
  padding: 14px;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
}

.planner__field {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.planner__fieldLabel {
  display: block;
  font-weight: 950;
  font-size: 13px;
  opacity: 0.95;
  margin-bottom: 8px;
}



.planner__select {
  width: 100%;
  height: 46px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(0, 0, 0, 0.26);
  color: rgba(255, 255, 255, 0.98);
  outline: none;
  box-sizing: border-box;
  min-width: 0;
}

.planner__fieldHint {
  margin-top: 8px;
  display: block;
  font-size: 12px;
  opacity: 0.85;
}

.planner__actions {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.planner__generateBtn {
  flex: 1;
  border-radius: 18px;
  border: 1px solid rgba(0, 194, 255, 0.5);
  background: rgba(0, 194, 255, 0.12);
  color: rgba(255, 255, 255, 0.98);
  padding: 14px 16px;
  font-weight: 1000;
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease, background-color 160ms ease;
}

.planner__generateBtn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.planner__generateBtn:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: rgba(0, 194, 255, 0.75);
  background: rgba(0, 194, 255, 0.18);
}

.planner__actionsHint {
  width: 280px;
  opacity: 0.85;
  font-size: 13px;
}

.planner__result {
  margin-top: 16px;
}

.planner__resultHeader {
  padding: 16px 14px;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
}

.planner__resultTitle {
  font-weight: 1000;
  font-size: 18px;
  letter-spacing: 0.2px;
}

.planner__resultWhy {
  margin-top: 8px;
  opacity: 0.88;
  line-height: 1.4;
}

.planner__previewBtn {
  margin-top: 10px;
  border-radius: 12px;
  border: 1px solid rgba(0, 194, 255, 0.55);
  background: rgba(0, 194, 255, 0.14);
  color: rgba(255, 255, 255, 0.98);
  padding: 8px 12px;
  font-weight: 800;
  cursor: pointer;
}

.plannerTimeline {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  align-items: start;
}

.plannerMapSection {
  margin-top: 24px;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  padding: 14px;
}

.plannerMapSection__header {
  font-weight: 1000;
  letter-spacing: 0.2px;
  margin-bottom: 14px;
}

.plannerDay {
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.plannerDay__top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 6px 12px;
}

.plannerDay__label {
  font-weight: 1000;
  letter-spacing: 0.2px;
}

.plannerDay__badge {
  font-size: 13px;
  opacity: 0.85;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.18);
}

.plannerDay__list {
  display: grid;
  gap: 10px;
  align-content: start;
}

.plannerPlace {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  padding: 10px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.18);
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease;
  height: 320px;
  overflow: hidden;
}

.plannerPlace:hover {
  transform: translateX(4px);
  border-color: rgba(255, 255, 255, 0.25);
}

.plannerPlace--active {
  border-color: rgba(0, 194, 255, 0.65);
  background: rgba(0, 194, 255, 0.08);
  box-shadow: 0 0 20px rgba(0, 194, 255, 0.15);
}

.plannerPlace__img {
  width: 100px;
  height: 74px;
  border-radius: 14px;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.plannerPlace__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.plannerPlace__row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 6px;
}

.plannerPlace__title {
  font-weight: 1000;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.plannerPlace__cost {
  font-weight: 1000;
  white-space: nowrap;
  align-self: flex-start;
}

.plannerPlace__loc {
  opacity: 0.88;
  font-size: 12px;
  margin-top: 5px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.plannerPlace__why {
  margin-top: 8px;
  font-size: 13px;
  opacity: 0.92;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.plannerPlace__actions {
  margin-top: auto;
  display: flex;
  justify-content: flex-start;
}

.plannerPlace__moreBtn {
  border-radius: 12px;
  border: 1px solid rgba(0, 194, 255, 0.5);
  background: rgba(0, 194, 255, 0.12);
  color: rgba(255, 255, 255, 0.98);
  padding: 8px 12px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease, background-color 160ms ease;
}

.plannerPlace__moreBtn:hover {
  transform: translateY(-1px);
  border-color: rgba(0, 194, 255, 0.8);
  background: rgba(0, 194, 255, 0.2);
}

.planner__mapHint {
  margin-top: 16px;
  opacity: 0.85;
  font-size: 13px;
  text-align: center;
}

.tripPreview {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
}

.tripPreview__card {
  width: min(980px, 100%);
  max-height: 88vh;
  overflow: auto;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(20, 22, 30, 0.9);
  padding: 14px;
}

.tripPreview__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.tripPreview__title {
  font-weight: 900;
  font-size: 18px;
}

.tripPreview__controls {
  display: flex;
  gap: 8px;
}

.tripPreview__ctrlBtn {
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.98);
  padding: 7px 10px;
  cursor: pointer;
}

.tripPreview__days {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.tripPreview__dayBtn {
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.96);
  padding: 6px 10px;
  cursor: pointer;
}

.tripPreview__dayBtn--active {
  border-color: rgba(0, 194, 255, 0.8);
  background: rgba(0, 194, 255, 0.18);
}

.tripPreview__progressWrap {
  margin-top: 12px;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
}

.tripPreview__progress {
  height: 100%;
  background: linear-gradient(90deg, #00c2ff, #71d9ff);
  transition: width 280ms ease;
}

.tripPreview__body {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 12px;
}

.tripPreview__img {
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  object-fit: cover;
  height: 280px;
}

.tripPreview__map {
  margin-top: 10px;
}

.tripPreview__mapFrame {
  width: 100%;
  height: 170px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 14px;
  display: block;
}

.tripPreview__info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tripPreview__meta { opacity: 0.86; font-size: 13px; }
.tripPreview__place { font-size: 20px; font-weight: 900; }
.tripPreview__why { line-height: 1.45; opacity: 0.96; }
.tripPreview__loc { opacity: 0.85; font-size: 13px; }

.tripPreview__mapLink {
  margin-top: 8px;
  color: #8fe6ff;
  text-decoration: none;
}

.tripPreview__footer {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
}

.tripPreviewStepFade-enter-active,
.tripPreviewStepFade-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.tripPreviewStepFade-enter-from,
.tripPreviewStepFade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.plannerVau {
  margin-top: 14px;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  padding: 14px;
}

.plannerVau__header {
  font-weight: 1000;
  letter-spacing: 0.2px;
  margin-bottom: 10px;
}

.plannerVau__hero {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  min-height: 320px;
}

.plannerVau__heroImg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transform: scale(1.02);
}

.plannerVau__heroOverlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(1200px 450px at 20% 10%, rgba(0, 194, 255, 0.35), transparent 55%),
    linear-gradient(180deg, rgba(0, 0, 0, 0.06) 0%, rgba(0, 0, 0, 0.74) 90%);
}

.plannerVau__heroText {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 16px;
  gap: 8px;
}

.plannerVau__heroTitle {
  font-weight: 1000;
  font-size: 20px;
  letter-spacing: 0.2px;
  text-shadow: 0 20px 80px rgba(0, 0, 0, 0.55);
}

.plannerVau__heroMeta {
  opacity: 0.9;
  font-size: 13px;
}

.plannerVau__heroWhy {
  opacity: 0.95;
  font-size: 13px;
  line-height: 1.35;
}

.plannerVau__thumbs {
  display: flex;
  gap: 10px;
  overflow: auto;
  padding-top: 12px;
}

.plannerVau__thumb {
  flex: 0 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  border-radius: 14px;
  padding: 6px;
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease, background-color 160ms ease;
}

.plannerVau__thumb:hover {
  transform: translateY(-2px);
  border-color: rgba(0, 194, 255, 0.55);
}

.plannerVau__thumb--active {
  border-color: rgba(0, 194, 255, 0.85);
  background: rgba(0, 194, 255, 0.12);
}

.plannerVau__thumbImg {
  width: 96px;
  height: 64px;
  object-fit: cover;
  display: block;
  border-radius: 10px;
}

.plannerDay__logistics {
  margin-top: 12px;
  padding: 12px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.plannerDay__logTitle {
  font-weight: 1000;
  margin-bottom: 8px;
  letter-spacing: 0.2px;
}

.plannerDay__logLine {
  display: grid;
  grid-template-columns: minmax(86px, 120px) minmax(0, 1fr);
  column-gap: 10px;
  row-gap: 6px;
  margin-bottom: 6px;
  align-items: start;
  line-height: 1.3;
}

.plannerDay__logKey {
  font-weight: 1000;
  opacity: 0.95;
  white-space: nowrap;
}

.plannerDay__logVal {
  opacity: 0.92;
  overflow-wrap: anywhere;
  word-break: break-word;
  hyphens: auto;
}

.plannerDay__offer {
  margin-top: 10px;
  font-weight: 1000;
  opacity: 0.95;
}

.plannerWeather {
  margin-top: 14px;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.03);
  padding: 14px;
}

.plannerWeather__title {
  font-weight: 1000;
  letter-spacing: 0.2px;
  margin-bottom: 10px;
}

.plannerWeather__row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.plannerWeather__day {
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.16);
  padding: 10px;
}

.plannerWeather__dayLabel {
  font-weight: 1000;
  opacity: 0.95;
  font-size: 13px;
  margin-bottom: 6px;
}

.plannerWeather__temps {
  font-weight: 1000;
  font-size: 16px;
}

.plannerWeather__desc {
  opacity: 0.88;
  font-size: 12px;
  line-height: 1.35;
  margin-top: 6px;
}

.plannerWeather__status {
  margin-top: 10px;
  opacity: 0.9;
}
.plannerWeather__status--error {
  color: #ff9a9a;
  font-size: 13px;
}

.plannerDay__map {
  margin-top: 12px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  overflow: hidden;
  background: rgba(0, 0, 0, 0.14);
}

.plannerDay__mapFrame {
  width: 100%;
  height: 210px;
  border: 0;
  display: block;
}

.plannerDay__mapLink {
  display: block;
  padding: 10px 12px;
  color: rgba(255, 255, 255, 0.95);
  text-decoration: underline;
  opacity: 0.9;
  font-size: 13px;
}

/* 3D Tour Styles */
.plannerPlace__media {
  position: relative;
  width: 100%;
  height: 160px;
  border-radius: 12px;
  overflow: hidden;
}

.plannerPlace__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.plannerPlace__3dBtn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 6px 12px;
  color: white;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s ease;
}

.plannerPlace__3dBtn:hover {
  background: rgba(0, 0, 0, 0.8);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.plannerPlace__3dBtnIcon {
  font-size: 12px;
}

.tourModal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.tourModal__content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 25px 100px rgba(0, 0, 0, 0.5);
}

.tourModal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.tourModal__title {
  color: white;
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}

.tourModal__close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  color: white;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.tourModal__close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.tourModal__body {
  padding: 24px;
}

@media (max-width: 1280px) {
  .plannerTimeline {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .planner__controls {
    grid-template-columns: 1fr;
  }

  .planner__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .planner__actionsHint {
    width: auto;
  }

  .plannerTimeline {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .plannerDay__logLine {
    grid-template-columns: 1fr;
  }

  .plannerDay__logKey {
    white-space: normal;
  }
}
</style>

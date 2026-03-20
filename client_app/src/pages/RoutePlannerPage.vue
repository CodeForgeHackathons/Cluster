<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Place } from '../types/cluster'

type TravelerType = 'family' | 'elderly' | 'digital' | 'gastro' | 'active' | 'eco'

const props = defineProps<{
  routePlaces: Place[]
}>()

const emit = defineEmits<{
  (e: 'back'): void
}>()

const month = ref<number>(new Date().getMonth() + 1)
const travelerType = ref<TravelerType>('family')

type DaySlot = 'Утро' | 'День' | 'Вечер'

type DayPlan = {
  dayIndex: number
  places: Array<{
    place: Place
    slot: DaySlot
    why: string
  }>
}

const generated = ref(false)
const days = ref<DayPlan[]>([])
const overallWhy = ref('')

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

// MVP: “ИИ-логика” локальная, без бэка. Она учитывает сезон и тип туриста.
function scorePlace(place: Place): number {
  const t = travelerType.value
  const season = monthToSeason(month.value)
  const key = clusterKey(place)
  const title = place.title.toLowerCase()
  const location = place.location.toLowerCase()
  let score = 0

  // Сезонное соответствие (заглушка, но визуально и смыслово по ТЗ)
  const seasonBest: Record<string, Array<'winter' | 'spring' | 'summer' | 'autumn'>> = {
    cl1: ['summer'], // море
    cl2: ['spring', 'autumn'], // природа/озеро
    cl3: ['spring', 'summer', 'autumn', 'winter'], // вид/кофе/работа круглый год
    cl4: ['autumn', 'spring'], // вино
    cl5: ['spring', 'summer'], // дети
    cl6: ['autumn', 'winter'], // меньше людей
  }
  const best = seasonBest[key]
  if (best && best.includes(season)) score += 10

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

function generate(): void {
  generated.value = true
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
  overallWhy.value = `ИИ-куратор (MVP): для ${travelerLabel(travelerType.value)} в ${season === 'winter' ? 'зимний' : season === 'spring' ? 'весенний' : season === 'summer' ? 'летний' : 'осенний'} период мы распределили места по дням так, чтобы сохранить темп, логичность и “вау”-атмосферу.`
}

const hasPlaces = computed(() => props.routePlaces.length > 0)
const totalCost = computed(() => props.routePlaces.reduce((sum, p) => sum + p.cost, 0))

function prettyMonth(m: number): string {
  const labels = [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
  ]
  return labels[Math.max(0, Math.min(11, m - 1))] ?? `Месяц ${m}`
}
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
          <span class="planner__fieldLabel">Месяц поездки</span>
          <select v-model="month" class="planner__select" aria-label="Выбор месяца">
            <option v-for="m in 12" :key="m" :value="m">
              {{ prettyMonth(m) }}
            </option>
          </select>
          <span class="planner__fieldHint">Сезон: {{ seasonLabel }}</span>
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
            :disabled="!hasPlaces"
            @click="generate"
          >
            Сгенерировать маршрут (MVP ИИ)
          </button>
          <div v-if="!hasPlaces" class="planner__actionsHint">
            Добавьте хотя бы одно место в маршрут на экране кластера.
          </div>
        </div>
      </div>

      <div v-if="generated" class="planner__result">
        <div class="planner__resultHeader">
          <div class="planner__resultTitle">
            Результат на {{ prettyMonth(month) }} • {{ travelerLabel(travelerType) }}
          </div>
          <div class="planner__resultWhy">{{ overallWhy }}</div>
        </div>

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
              <article v-for="item in d.places" :key="item.place.id" class="plannerPlace">
                <img :src="item.place.photo" :alt="item.place.title" class="plannerPlace__img" />
                <div class="plannerPlace__body">
                  <div class="plannerPlace__row">
                    <div class="plannerPlace__title">{{ item.slot }} • {{ item.place.title }}</div>
                    <div class="plannerPlace__cost">{{ item.place.cost }} ₽</div>
                  </div>
                  <div class="plannerPlace__loc">{{ item.place.location }}</div>
                  <div class="plannerPlace__why">{{ item.why }}</div>
                </div>
              </article>
            </div>
          </section>
        </div>

        <div class="planner__mapHint">
          MVP: “карта-таймлайн” пока в виде витрины. На следующей итерации подключим OSM/Leaflet и проложим маршрут по точкам.
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.planner {
  position: fixed;
  inset: 0;
  z-index: 60;
  color: rgba(255, 255, 255, 0.98);
  overflow: auto;
  background: radial-gradient(1200px 700px at 10% 10%, rgba(0, 194, 255, 0.22), transparent 55%),
    radial-gradient(900px 600px at 95% 20%, rgba(170, 59, 255, 0.16), transparent 50%),
    rgba(12, 12, 20, 0.92);
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
  padding: 14px;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
}

.planner__field {
  display: block;
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
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(0, 0, 0, 0.26);
  color: rgba(255, 255, 255, 0.98);
  outline: none;
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

.plannerTimeline {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.plannerDay {
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  padding: 12px;
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
}

.plannerPlace {
  display: flex;
  gap: 12px;
  padding: 10px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.18);
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
}

.plannerPlace__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
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
}

.plannerPlace__loc {
  opacity: 0.88;
  font-size: 12px;
  margin-top: 5px;
}

.plannerPlace__why {
  margin-top: 8px;
  font-size: 13px;
  opacity: 0.92;
  line-height: 1.35;
}

.planner__mapHint {
  margin-top: 16px;
  opacity: 0.85;
  font-size: 13px;
  text-align: center;
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
</style>


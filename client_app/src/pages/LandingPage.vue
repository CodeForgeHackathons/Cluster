<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import seaImg from '../assets/kk/пляж.jfif'
import wineImg from '../assets/kk/винодельня.jfif'
import kidsImg from '../assets/kk/дети.png'
import viewImg from '../assets/kk/коворкинг.jpg'
import calmImg from '../assets/kk/природа.jpg'
import secretImg from '../assets/kk/станица.jfif'
import type { Cluster } from '../types/cluster'

const emit = defineEmits<{
  (e: 'openCluster', cluster: Cluster): void
}>()

type Filter = {
  id: string
  label: string
  bgImage: string // фото для фона лендинга (при наведении)
  cardImage: string // фото внутри карточки
}

// TODO: когда добавите реальные фото Краснодарского края,
// замените поля `bgImage`/`cardImage` на импорты из `src/assets/kk/`.
const filters: Filter[] = [
  {
    id: 'run',
    label: 'Сбежать от людей',
    bgImage: seaImg,
    cardImage: seaImg,
  },
  {
    id: 'taste',
    label: 'Почувствовать вкус',
    bgImage: wineImg,
    cardImage: wineImg,
  },
  {
    id: 'kids',
    label: 'Легко с детьми',
    bgImage: kidsImg,
    cardImage: kidsImg,
  },
  {
    id: 'view',
    label: 'Работа с видом',
    bgImage: viewImg,
    cardImage: viewImg,
  },
  {
    id: 'calm',
    label: 'Размеренно и душевно',
    bgImage: calmImg,
    cardImage: calmImg,
  },
  {
    id: 'secret',
    label: 'То, о чём никто не знает',
    bgImage: secretImg,
    cardImage: secretImg,
  },
]

type StubCluster = {
  id: string
  image: string
  rating: number
  reviews: string
  title: string
  meta: string
  price: number
}

// Заглушка вместо данных из бэка: чтобы MVP выглядел как “озон-путешествия”.
// Позже сюда подставим реальные данные кластеров и маршрутов.
const stubClusters: StubCluster[] = [
  {
    id: 'cl1',
    image: seaImg,
    rating: 4.9,
    reviews: '359 отзывов',
    title: 'Отель и прогулки у моря',
    meta: 'Краснодарский край · 4–5 км от центра',
    price: 7361,
  },
  {
    id: 'cl2',
    image: calmImg,
    rating: 5.0,
    reviews: '27 отзывов',
    title: 'Дом среди природы',
    meta: 'Тихий район · до озера 1–2 км',
    price: 5429,
  },
  {
    id: 'cl3',
    image: viewImg,
    rating: 4.9,
    reviews: '84 отзыва',
    title: 'Локация для работы с видом',
    meta: 'Кофе, терраса, рабочие места',
    price: 7854,
  },
  {
    id: 'cl4',
    image: wineImg,
    rating: 4.9,
    reviews: '242 отзыва',
    title: 'Винные маршруты и дегустации',
    meta: 'Вкус, атмосфера и местные продукты',
    price: 12328,
  },
  {
    id: 'cl5',
    image: kidsImg,
    rating: 4.9,
    reviews: '174 отзыва',
    title: 'Куда сходить с детьми',
    meta: 'Интересно взрослым и детям',
    price: 6000,
  },
  {
    id: 'cl6',
    image: secretImg,
    rating: 4.8,
    reviews: '95 отзывов',
    title: 'Нестандартная станица и ремесла',
    meta: 'Меньше людей · больше впечатлений',
    price: 7010,
  },
]

const factPresets: Record<string, [string, string, string]> = {
  cl1: ['Соль в воздухе', 'Закат рядом', 'Тихая бухта'],
  cl2: ['Тишина рядом', 'Чай и зелень', 'Туман красиво'],
  cl3: ['Фокус и вид', 'Дела в тишине', 'Заметки на свежем'],
  cl4: ['Вино в бокале', 'Ремесло вкусно', 'Ветер в листьях'],
  cl5: ['Игра и вкус', 'Творчество рядом', 'Шаги в радость'],
  cl6: ['Тайные мастерские', 'Дела руками', 'Фото без толпы'],
}

// В MVP данных о фото нет: поэтому используем разные уже существующие картинки
// (по 3 на кластер), чтобы в галерее было “много” изображений.
const clusterPhotoSets: Record<string, [string, string, string]> = {
  cl1: [seaImg, calmImg, wineImg],
  cl2: [calmImg, seaImg, viewImg],
  cl3: [viewImg, calmImg, seaImg],
  cl4: [wineImg, secretImg, calmImg],
  cl5: [kidsImg, seaImg, viewImg],
  cl6: [secretImg, calmImg, kidsImg],
}

// Координаты для мини-карт и погоды (MVP: заглушки).
const clusterCoords: Record<string, { lat: number; lon: number }> = {
  cl1: { lat: 43.585, lon: 39.723 }, // побережье (примерно Сочи)
  cl2: { lat: 45.041, lon: 37.360 }, // природа/озёра (примерно район Краснодара)
  cl3: { lat: 44.982, lon: 38.917 }, // вид/работа (примерно юг края)
  cl4: { lat: 44.958, lon: 37.783 }, // вино (примерно Анапа/окрестности)
  cl5: { lat: 45.025, lon: 37.170 }, // семейный сценарий (примерно Краснодарский район)
  cl6: { lat: 44.476, lon: 39.016 }, // станица/ремесла (примерно Новороссийск/окрестности)
}

const clusterById = new Map<string, Cluster>(
  stubClusters.map((c) => {
    const [fact1, fact2, fact3] = factPresets[c.id] ?? ['Впечатления', 'Вдохновение', 'Путешествие']
    const placePhotos = clusterPhotoSets[c.id] ?? [c.image, c.image, c.image]
    const coords = clusterCoords[c.id] ?? { lat: 45.0, lon: 38.0 }

    const baseDescription = `Сценарий “${c.title}”: локальные смыслы, понятная логистика и ощущение “я нашёл(ла) своё место”.`

    const places = [
      {
        id: `${c.id}-p1`,
        photo: placePhotos[0]!,
        rating: c.rating,
        title: c.title,
        location: c.meta,
        fact: fact1,
        coordinates: coords,
        cost: c.price,
        description: baseDescription,
        reviewsLabel: c.reviews,
        reviews: [
          { id: `${c.id}-r1`, author: 'Анна', rating: Math.min(5, c.rating), text: 'Визит ощущается как “дистанционное” предвкушение: сразу хочется ехать.' },
          { id: `${c.id}-r2`, author: 'Илья', rating: Math.max(4.5, c.rating - 0.2), text: 'Маршрут из деталей — всё сходится, без лишней суеты.' },
          { id: `${c.id}-r3`, author: 'Мария', rating: Math.max(4.4, c.rating - 0.4), text: 'Понравился темп и атмосфера. Вернёмся в сезон.' },
        ],
      },
      {
        id: `${c.id}-p2`,
        photo: placePhotos[1]!,
        rating: Math.max(4.5, c.rating - 0.2),
        title: `${c.title} · мягкий маршрут`,
        location: c.meta,
        fact: fact2,
        coordinates: coords,
        cost: Math.round(c.price * 0.92),
        description: `${baseDescription} В этом варианте — больше “медленных” остановок и воздуха.`,
        reviewsLabel: c.reviews,
        reviews: [
          { id: `${c.id}-r4`, author: 'Олег', rating: 4.7, text: 'Хорошо заходит тем, кто хочет спокойную поездку.' },
          { id: `${c.id}-r5`, author: 'Светлана', rating: 4.8, text: 'Немного тише, но по ощущениям даже лучше.' },
          { id: `${c.id}-r6`, author: 'Дмитрий', rating: 4.6, text: 'Собрали маршрут и не пожалели — всё рядом.' },
        ],
      },
      {
        id: `${c.id}-p3`,
        photo: placePhotos[2]!,
        rating: Math.max(4.5, c.rating - 0.1),
        title: `${c.title} · видовые точки`,
        location: c.meta,
        fact: fact3,
        coordinates: coords,
        cost: Math.round(c.price * 1.04),
        description: `${baseDescription} Добавили “вау”-кадры и небольшие видовые паузы.`,
        reviewsLabel: c.reviews,
        reviews: [
          { id: `${c.id}-r7`, author: 'Вера', rating: 4.9, text: 'Очень красиво на фото и вживую — прям вау!' },
          { id: `${c.id}-r8`, author: 'Кирилл', rating: 4.7, text: 'Сильная концепция: хочется продолжения.' },
          { id: `${c.id}-r9`, author: 'Ирина', rating: 4.8, text: 'Легко представить поездку заранее. Отличная витрина.' },
        ],
      },
    ]

    const cluster: Cluster = {
      id: c.id,
      coverImage: c.image,
      title: c.title,
      places,
    }

    return [c.id, cluster] as const
  }),
)

function openClusterById(id: string): void {
  const cluster = clusterById.get(id)
  if (!cluster) return
  emit('openCluster', cluster)
}

// Галерея фото внутри карточек кластеров (MVP: локальные заглушки).
const isGalleryOpen = ref(false)
const galleryClusterTitle = ref('')
const galleryImages = ref<string[]>([])
const galleryActiveIndex = ref(0)

function openClusterGallery(id: string): void {
  const cluster = clusterById.get(id)
  if (!cluster) return

  galleryClusterTitle.value = cluster.title
  galleryImages.value = cluster.places.map((p) => p.photo)
  galleryActiveIndex.value = 0
  isGalleryOpen.value = true
}

function closeClusterGallery(): void {
  isGalleryOpen.value = false
}

function selectGalleryImage(idx: number): void {
  if (idx < 0 || idx >= galleryImages.value.length) return
  galleryActiveIndex.value = idx
}

const defaultBgUrl = filters[0]!.bgImage
const currentBgUrl = ref<string>(defaultBgUrl)
const nextBgUrl = ref<string>(defaultBgUrl)
const isBgFading = ref(false)
const fadeMs = 720
let bgFadeTimer: number | undefined

const selectedId = ref<string | null>(null)
const filtersDismissed = ref(false)
const isBgBlurring = ref(false)
const clustersVisible = ref(false)

// Временный “бесконечный” список кластеров (MVP-заглушка).
const PAGE_SIZE = 6
const visibleCount = ref(PAGE_SIZE)
const visibleClusters = computed(() => {
  const baseLen = stubClusters.length
  if (baseLen === 0) return []
  return Array.from({ length: visibleCount.value }, (_, i) => stubClusters[i % baseLen]!)
})

const clustersSentinel = ref<HTMLElement | null>(null)
const isLoadingMore = ref(false)
let clustersObserver: IntersectionObserver | null = null

function disconnectClustersObserver(): void {
  if (clustersObserver) clustersObserver.disconnect()
  clustersObserver = null
}

function connectClustersObserver(): void {
  disconnectClustersObserver()

  if (!clustersSentinel.value) return
  clustersObserver = new IntersectionObserver(
    (entries) => {
      const first = entries[0]
      if (!first?.isIntersecting) return
      if (isLoadingMore.value) return

      // Подгружаем следующую “пачку” в момент близости к концу списка.
      isLoadingMore.value = true
      visibleCount.value += PAGE_SIZE

      // Небольшая пауза, чтобы не разгонять события.
      window.setTimeout(() => {
        isLoadingMore.value = false
      }, 250)
    },
    { root: null, threshold: 0.15 },
  )

  clustersObserver.observe(clustersSentinel.value)
}

watch(
  clustersVisible,
  async (v) => {
    if (!v) {
      disconnectClustersObserver()
      visibleCount.value = PAGE_SIZE
      return
    }

    visibleCount.value = PAGE_SIZE
    await nextTick()
    connectClustersObserver()
  },
  { immediate: false },
)

const blurStartDelayMs = 900
const blurHoldMs = 520
let bgBlurTimer: number | undefined
let bgSwitchTimer: number | undefined
let bgRequestId = 0

function blurAndSwapBg(url: string): void {
  const reqId = ++bgRequestId

  nextBgUrl.value = url
  isBgBlurring.value = false
  isBgFading.value = false

  if (bgFadeTimer !== undefined) window.clearTimeout(bgFadeTimer)
  if (bgBlurTimer !== undefined) window.clearTimeout(bgBlurTimer)
  if (bgSwitchTimer !== undefined) window.clearTimeout(bgSwitchTimer)

  bgBlurTimer = window.setTimeout(() => {
    if (reqId !== bgRequestId) return
    isBgBlurring.value = true
  }, blurStartDelayMs)

  bgSwitchTimer = window.setTimeout(() => {
    if (reqId !== bgRequestId) return
    // В момент появления нового фото плавно “снимаем” сильный блюр.
    isBgBlurring.value = false
    isBgFading.value = true

    bgFadeTimer = window.setTimeout(() => {
      if (reqId !== bgRequestId) return
      currentBgUrl.value = url
      isBgFading.value = false
      // Только после полного кроссфейда показываем карточки кластеров.
      clustersVisible.value = true
    }, fadeMs)
  }, blurStartDelayMs + blurHoldMs)
}

function selectFilter(filter: Filter): void {
  if (filtersDismissed.value) return
  selectedId.value = filter.id
  // всегда показываем тот же снимок, что и у выбранной карточки
  blurAndSwapBg(filter.cardImage)

  // Плавно “уезжаем” вверх и исчезаем, как в макете.
  filtersDismissed.value = true
}

function resetToInitial(): void {
  // Сбрасываем таймеры, чтобы старые blur/fade не перезаписали фон после “назад”.
  if (bgFadeTimer !== undefined) window.clearTimeout(bgFadeTimer)
  if (bgBlurTimer !== undefined) window.clearTimeout(bgBlurTimer)
  if (bgSwitchTimer !== undefined) window.clearTimeout(bgSwitchTimer)

  bgRequestId += 1

  selectedId.value = null
  filtersDismissed.value = false
  isBgBlurring.value = false
  isBgFading.value = false
  clustersVisible.value = false
  isGalleryOpen.value = false
  visibleCount.value = PAGE_SIZE
  disconnectClustersObserver()

  currentBgUrl.value = defaultBgUrl
  nextBgUrl.value = defaultBgUrl
}

onBeforeUnmount(() => {
  if (bgFadeTimer !== undefined) window.clearTimeout(bgFadeTimer)
  if (bgBlurTimer !== undefined) window.clearTimeout(bgBlurTimer)
  if (bgSwitchTimer !== undefined) window.clearTimeout(bgSwitchTimer)
  disconnectClustersObserver()
})
</script>

<template>
  <main
    class="landing"
    :class="{ 'landing--clusters': clustersVisible }"
    role="application"
    aria-label="Кластер — лендинг"
  >
    <div
      class="landing__bg landing__bg--current"
      :class="{ 'landing__bg--hidden': isBgFading, 'landing__bg--blurring': isBgBlurring }"
      :style="{ backgroundImage: `url(${currentBgUrl})` }"
    />
    <div
      class="landing__bg landing__bg--next"
      :class="{ 'landing__bg--shown': isBgFading, 'landing__bg--blurring': isBgBlurring }"
      :style="{ backgroundImage: `url(${nextBgUrl})` }"
    />
    <div class="landing__scrim" />

    <div class="landing__content">
      <button
        v-if="clustersVisible"
        type="button"
        class="landing__backBtn"
        aria-label="Назад"
        @click="resetToInitial"
      >
        <span class="landing__backIcon" aria-hidden="true">←</span>
      </button>

      <h1
        v-if="!clustersVisible"
        class="landing__title"
        :class="{ 'landing__title--dismiss': filtersDismissed }"
      >
        Что ты хочешь почувствовать?
      </h1>

      <section
        v-if="!clustersVisible"
        class="landing__filters"
        aria-label="Фильтры впечатлений"
        :class="{ 'landing__filters--dismiss': filtersDismissed }"
      >
        <button
          v-for="(f, idx) in filters"
          :key="f.id"
          type="button"
          class="landing__card"
          :class="{
            'landing__card--active': selectedId === f.id,
            'landing__card--dismiss': filtersDismissed,
          }"
          :style="{ backgroundImage: `url(${f.cardImage})` }"
          :data-idx="idx"
          @click="selectFilter(f)"
        >
          <span class="landing__cardLabel">{{ f.label }}</span>
        </button>
      </section>

      <section
        v-if="clustersVisible"
        class="landing__clusters"
        aria-label="Кластеры (заглушка)"
      >
        <article
          v-for="(c, idx) in visibleClusters"
          :key="c.id + '-' + idx"
          class="landing__clusterCard"
          :data-idx="idx % PAGE_SIZE"
          role="button"
          tabindex="0"
          :aria-label="`Открыть кластер: ${c.title}`"
          @click="openClusterById(c.id)"
          @keydown.enter.prevent="openClusterById(c.id)"
          @keydown.space.prevent="openClusterById(c.id)"
        >
          <div class="landing__clusterImgWrap">
            <img
              class="landing__clusterImg"
              :src="c.image"
              :alt="c.title"
            />
          </div>
          <div class="landing__clusterBody">
            <div class="landing__clusterTop">
              <div class="landing__clusterRating">
                <span class="landing__clusterStars">★</span>
                <span>{{ c.rating }}</span>
              </div>
              <div class="landing__clusterReviews">{{ c.reviews }}</div>
            </div>
            <div class="landing__clusterTitle">{{ c.title }}</div>
            <div class="landing__clusterMeta">{{ c.meta }}</div>
            <div class="landing__clusterPrice">{{ c.price }} ₽</div>
            <div class="landing__clusterActions">
              <button
                type="button"
                class="landing__clusterGalleryBtn"
                aria-label="Просмотреть фото кластера"
                @click.stop="openClusterGallery(c.id)"
              >
                Просмотреть фото
              </button>
            </div>
          </div>
        </article>

        <div ref="clustersSentinel" class="landing__clustersSentinel" aria-hidden="true" />
      </section>

      <div
        v-if="isGalleryOpen"
        class="galleryOverlay"
        role="dialog"
        aria-modal="true"
        tabindex="0"
        @click="closeClusterGallery"
        @keydown.esc="closeClusterGallery"
      >
        <div class="galleryModal" @click.stop>
          <div class="galleryHeader">
            <div class="galleryTitle">{{ galleryClusterTitle }}</div>
            <button type="button" class="galleryCloseBtn" aria-label="Закрыть" @click="closeClusterGallery">
              ✕
            </button>
          </div>

          <div class="galleryMain">
            <img
              v-if="galleryImages.length"
              :src="galleryImages[galleryActiveIndex]"
              class="galleryMainImg"
              alt="Фото кластера"
            />
          </div>

          <div class="galleryThumbs" role="list" aria-label="Миниатюры">
            <button
              v-for="(img, idx) in galleryImages"
              :key="img + idx"
              type="button"
              class="galleryThumb"
              :class="{ 'galleryThumb--active': idx === galleryActiveIndex }"
              role="listitem"
              :aria-label="`Фото ${idx + 1}`"
              @click="selectGalleryImage(idx)"
            >
              <img :src="img" class="galleryThumbImg" :alt="`Фото ${idx + 1}`" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.landing {
  position: relative;
  height: 100svh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-sizing: border-box;
  padding: 22px 18px;
}

.landing--clusters {
  /* После появления карточек разрешаем скролл (внутри экрана), чтобы без “дёргания” на первом экране. */
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  height: auto;
  min-height: 100svh;
  align-items: stretch;
}

.landing--clusters .landing__bg {
  opacity: 0 !important;
}

.landing--clusters .landing__scrim {
  background:
    radial-gradient(1100px 520px at 20% 10%, rgba(0, 194, 255, 0.28), transparent 60%),
    radial-gradient(900px 520px at 85% 20%, rgba(170, 59, 255, 0.22), transparent 55%),
    linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.2) 0%,
      rgba(0, 0, 0, 0.55) 60%,
      rgba(0, 0, 0, 0.75) 100%
    );
}

.landing__bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transition:
    opacity var(--bg-fade-ms, 720ms) cubic-bezier(0.2, 0.8, 0.2, 1),
    transform var(--bg-fade-ms, 720ms) cubic-bezier(0.2, 0.8, 0.2, 1),
    filter var(--bg-fade-ms, 720ms) cubic-bezier(0.2, 0.8, 0.2, 1);
  transform: scale(1.03);
  filter: blur(8px);
  will-change: opacity, transform, filter;
}

.landing__bg--blurring {
  filter: blur(18px) saturate(1.1) contrast(1.04) !important;
  transform: scale(1.06);
}

.landing__bg--current {
  opacity: 1;
  transform: scale(1);
  filter: blur(0);
}

.landing__bg--next {
  opacity: 0;
  transform: scale(1.05);
  filter: blur(10px);
}

.landing__bg--hidden {
  opacity: 0;
  transform: scale(1.08);
  filter: blur(12px);
}

.landing__bg--shown {
  opacity: 1;
  transform: scale(1);
  filter: blur(0);
}

.landing__scrim {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.45) 0%,
      rgba(0, 0, 0, 0.25) 45%,
      rgba(0, 0, 0, 0.55) 100%
    );
}

.landing__title {
  position: relative;
  z-index: 1;
  color: #ffffff;
  font-family: var(--heading);
  font-weight: 700;
  font-size: clamp(22px, 2.9vw, 40px);
  text-align: center;
  line-height: 1.1;
  margin: 0;
  padding: 0 16px;
  text-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
  animation: titleIn 700ms ease both;
  transform: translateY(0);
  transition:
    opacity 900ms cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 900ms cubic-bezier(0.2, 0.8, 0.2, 1),
    filter 900ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.landing__title--dismiss {
  /* важно: гасим стартовую titleIn анимацию, чтобы не “возвращала” opacity */
  animation: none;
  opacity: 0 !important;
  transform: translateY(-28px);
  filter: blur(16px);
}

.landing__content {
  position: relative;
  z-index: 1;
  width: min(1120px, 100%);
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 0;
  gap: 26px;
}

.landing--clusters .landing__content {
  height: auto;
  min-height: 100svh;
  justify-content: flex-start;
}

.landing__backBtn {
  position: fixed;
  top: calc(14px + env(safe-area-inset-top));
  left: calc(14px + env(safe-area-inset-left));
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  color: rgba(255, 255, 255, 0.95);
  cursor: pointer;
  transition: box-shadow 180ms ease, background-color 180ms ease, border-color 180ms ease;
  box-shadow:
    0 18px 60px rgba(0, 0, 0, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.16);
  animation:
    backBtnIn 420ms ease both,
    backBtnFloat 4s ease-in-out infinite 420ms;
}

.landing__backBtn:hover {
  border-color: rgba(0, 194, 255, 0.75);
  background: rgba(0, 194, 255, 0.12);
}

.landing__backIcon {
  font-size: 18px;
  line-height: 1;
}

.landing__backText {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.landing__backBtn[aria-label='Назад'] {
  animation: backBtnIn 420ms ease both;
}

.landing__filters {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  padding: 0 8px 8px;
  margin-top: 0;
  transition:
    opacity 920ms cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 1200ms cubic-bezier(0.2, 0.8, 0.2, 1),
    filter 920ms cubic-bezier(0.2, 0.8, 0.2, 1);
  opacity: 1;
  transform: translateY(0);
}

.landing__filters--dismiss {
  opacity: 0;
  transform: translateY(-84px);
  filter: blur(4px);
  pointer-events: none;
}

.landing__clusters {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  padding: 0 8px 6px;
  animation: clustersIn 720ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.landing__clustersSentinel {
  height: 1px;
}

.landing__clusterCard {
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(16px) saturate(145%);
  -webkit-backdrop-filter: blur(16px) saturate(145%);
  box-shadow:
    0 26px 90px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  overflow: hidden;
  transform: translateY(10px);
  opacity: 0;
  animation: clusterCardIn 720ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
  cursor: pointer;
}

.landing__clusterCard:hover {
  transform: translateY(0) scale(1.02);
  border-color: rgba(0, 194, 255, 0.65);
  box-shadow:
    0 30px 110px rgba(0, 0, 0, 0.32),
    inset 0 1px 0 rgba(255, 255, 255, 0.14);
}

.landing__clusterCard:focus-visible {
  outline: 2px solid rgba(0, 194, 255, 0.9);
  outline-offset: 4px;
}

.landing__clusterImgWrap {
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
}

.landing__clusterImg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.landing__clusterBody {
  padding: 12px 14px 16px;
  color: rgba(255, 255, 255, 0.95);
}

.landing__clusterTop {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
}

.landing__clusterRating {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 14px;
}

.landing__clusterStars {
  color: rgba(255, 255, 255, 0.95);
}

.landing__clusterReviews {
  font-size: 12px;
  opacity: 0.85;
}

.landing__clusterTitle {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.landing__clusterMeta {
  font-size: 12px;
  opacity: 0.82;
  margin-bottom: 10px;
}

.landing__clusterPrice {
  font-size: 18px;
  font-weight: 800;
}

.landing__clusterCard[data-idx='0'] {
  animation-delay: 0ms;
}
.landing__clusterCard[data-idx='1'] {
  animation-delay: 80ms;
}
.landing__clusterCard[data-idx='2'] {
  animation-delay: 160ms;
}
.landing__clusterCard[data-idx='3'] {
  animation-delay: 240ms;
}
.landing__clusterCard[data-idx='4'] {
  animation-delay: 320ms;
}
.landing__clusterCard[data-idx='5'] {
  animation-delay: 400ms;
}

@keyframes clustersIn {
  from {
    opacity: 0;
    transform: translateY(16px);
    filter: blur(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

@keyframes clusterCardIn {
  from {
    opacity: 0;
    transform: translateY(14px);
    filter: blur(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

.landing__card {
  appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.34);
  border-radius: 28px;
  cursor: pointer;
  padding: 30px 18px;
  min-height: 124px;
  display: flex;
  align-items: center;
  justify-content: center;

  /* Стекло: непрозрачность + сильный blur, без “пластика”. */
  background-color: rgba(255, 255, 255, 0.09);
  background-size: cover;
  background-position: center;

  position: relative;
  color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(22px) saturate(165%);
  -webkit-backdrop-filter: blur(22px) saturate(165%);

  transform: scale(1);
  transition:
    transform 170ms ease,
    border-color 170ms ease,
    box-shadow 170ms ease,
    background-color 170ms ease;

  opacity: 0;
  filter: blur(6px);
  animation: cardIn 850ms ease forwards;

  box-shadow:
    0 26px 90px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    inset 0 -1px 0 rgba(255, 255, 255, 0.08);
}

.landing__card--dismiss {
  opacity: 0;
  transform: scale(0.98) translateY(-22px);
  filter: blur(26px);
  transition:
    transform 1100ms cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 1100ms cubic-bezier(0.2, 0.8, 0.2, 1),
    filter 1100ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.landing__card--dismiss[data-idx='0'] {
  transition-delay: 0ms;
}
.landing__card--dismiss[data-idx='1'] {
  transition-delay: 70ms;
}
.landing__card--dismiss[data-idx='2'] {
  transition-delay: 140ms;
}
.landing__card--dismiss[data-idx='3'] {
  transition-delay: 210ms;
}
.landing__card--dismiss[data-idx='4'] {
  transition-delay: 280ms;
}
.landing__card--dismiss[data-idx='5'] {
  transition-delay: 350ms;
}

.landing__card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  z-index: 0;

  /* Многослойная подложка под “преломление стекла”. */
  background:
    radial-gradient(
      120% 90% at 18% 10%,
      rgba(255, 255, 255, 0.45) 0%,
      rgba(255, 255, 255, 0.08) 40%,
      rgba(255, 255, 255, 0) 68%
    ),
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.14) 0%,
      rgba(0, 0, 0, 0.18) 42%,
      rgba(0, 0, 0, 0.46) 100%
    );

  transition:
    background 220ms ease,
    opacity 220ms ease,
    filter 220ms ease;
  opacity: 1;
  filter: saturate(115%);
}

.landing__card::after {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.6) 0%,
    rgba(255, 255, 255, 0.12) 35%,
    rgba(255, 255, 255, 0) 62%
  );
  opacity: 0;
  transition: opacity 180ms ease, transform 180ms ease;
  z-index: 0;
  pointer-events: none;
}

.landing__cardLabel {
  position: relative;
  z-index: 1;
  font-family: var(--heading);
  font-weight: 700;
  font-size: 21px;
  text-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
  text-align: center;
  line-height: 1.12;
}

.landing__card:hover {
  transform: scale(1.06);
  border-color: rgba(0, 194, 255, 0.75);
  box-shadow:
    0 28px 90px rgba(0, 0, 0, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
}

.landing__card:hover::before {
  background:
    linear-gradient(
      180deg,
      rgba(0, 194, 255, 0.20) 0%,
      rgba(0, 0, 0, 0.18) 45%,
      rgba(0, 0, 0, 0.45) 100%
    );
}

.landing__card:hover::after {
  opacity: 1;
  transform: translateY(-1px);
}

.landing__card--active {
  transform: scale(1.08);
  border-color: rgba(0, 194, 255, 0.9);
  box-shadow:
    0 32px 100px rgba(0, 0, 0, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.26);
}

.landing__card--active::before {
  filter: saturate(125%);
  background:
    radial-gradient(
      120% 90% at 18% 10%,
      rgba(255, 255, 255, 0.48) 0%,
      rgba(255, 255, 255, 0.09) 42%,
      rgba(255, 255, 255, 0) 70%
    ),
    linear-gradient(
      180deg,
      rgba(0, 194, 255, 0.20) 0%,
      rgba(0, 0, 0, 0.14) 42%,
      rgba(0, 0, 0, 0.54) 100%
    );
}

.landing__card:focus-visible {
  outline: 2px solid rgba(0, 194, 255, 0.9);
  outline-offset: 3px;
}

@media (max-width: 980px) {
  .landing__filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .landing__cardLabel {
    font-size: 16px;
  }

  .landing__clusters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .landing {
    padding: 18px 14px;
  }

  .landing__content {
    padding-top: 0;
    gap: 16px;
  }

  .landing__filters {
    grid-template-columns: 1fr;
    gap: 12px;
    padding-bottom: 4px;
  }

  .landing__card {
    min-height: 76px;
    padding: 16px 14px;
    border-radius: 16px;
  }

  .landing__cardLabel {
    font-size: 14px;
  }

  .landing__clusters {
    grid-template-columns: 1fr;
    gap: 12px;
    padding-bottom: 8px;
  }
}

@media (max-height: 740px) and (min-width: 521px) {
  .landing__content {
    gap: 20px;
  }

  .landing__filters {
    gap: 14px;
    padding-bottom: 6px;
  }

  .landing__card {
    padding: 24px 18px;
    min-height: 110px;
  }

  .landing__cardLabel {
    font-size: 19px;
  }
}

.landing__clusterActions {
  padding-top: 10px;
}

.landing__clusterGalleryBtn {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.22);
  color: rgba(255, 255, 255, 0.98);
  border-radius: 14px;
  padding: 10px 12px;
  font-weight: 900;
  letter-spacing: 0.15px;
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease, background-color 160ms ease;
}

.landing__clusterGalleryBtn:hover {
  transform: translateY(-1px);
  border-color: rgba(0, 194, 255, 0.6);
  background: rgba(0, 194, 255, 0.14);
}

.galleryOverlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.52);
  backdrop-filter: blur(10px) saturate(120%);
  -webkit-backdrop-filter: blur(10px) saturate(120%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.galleryModal {
  width: min(920px, 100%);
  max-height: 86vh;
  overflow: auto;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(18, 18, 26, 0.78);
  box-shadow: 0 40px 160px rgba(0, 0, 0, 0.65);
}

.galleryHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.galleryTitle {
  font-weight: 1000;
  letter-spacing: 0.2px;
  color: rgba(255, 255, 255, 0.98);
}

.galleryCloseBtn {
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.96);
  border-radius: 12px;
  padding: 8px 10px;
  cursor: pointer;
}

.galleryMain {
  padding: 12px 16px 10px;
}

.galleryMainImg {
  width: 100%;
  height: min(440px, 52vh);
  object-fit: cover;
  display: block;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.galleryThumbs {
  display: flex;
  gap: 10px;
  padding: 10px 16px 16px;
  overflow: auto;
}

.galleryThumb {
  flex: 0 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  border-radius: 14px;
  padding: 6px;
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease, background-color 160ms ease;
}

.galleryThumb:hover {
  transform: translateY(-1px);
  border-color: rgba(0, 194, 255, 0.45);
}

.galleryThumb--active {
  border-color: rgba(0, 194, 255, 0.85);
  background: rgba(0, 194, 255, 0.12);
}

.galleryThumbImg {
  width: 96px;
  height: 64px;
  object-fit: cover;
  border-radius: 10px;
  display: block;
}

@keyframes backBtnIn {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.98);
    filter: blur(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

@keyframes backBtnFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(2px);
  }
}

@keyframes titleIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes cardIn {
  to {
    opacity: 1;
    filter: blur(0);
  }
}

/* Небольшая стаггер-анимация карточек */
.landing__card[data-idx='0'] {
  animation-delay: 0ms;
}
.landing__card[data-idx='1'] {
  animation-delay: 90ms;
}
.landing__card[data-idx='2'] {
  animation-delay: 180ms;
}
.landing__card[data-idx='3'] {
  animation-delay: 270ms;
}
.landing__card[data-idx='4'] {
  animation-delay: 360ms;
}
.landing__card[data-idx='5'] {
  animation-delay: 450ms;
}

@media (prefers-reduced-motion: reduce) {
  .landing__bg {
    transition: none;
  }
  .landing__title,
  .landing__card,
  .landing__clusterCard {
    animation: none;
    opacity: 1;
    filter: none;
    transition: none;
  }
  .landing__filters {
    transition: none;
  }
  .landing__bg--blurring {
    filter: none !important;
    transform: none;
  }
  .landing__clusters {
    animation: none;
  }
}

/* Варп/стекание больше не используем: только блюр и кроссфейд. */
</style>


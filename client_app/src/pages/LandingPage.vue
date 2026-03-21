<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import seaImg from '../assets/kk/пляж.jfif'
import wineImg from '../assets/kk/винодельня.jfif'
import kidsImg from '../assets/kk/дети.png'
import viewImg from '../assets/kk/коворкинг.jpg'
import calmImg from '../assets/kk/природа.jpg'
import secretImg from '../assets/kk/станица.jfif'
import { fetchClusters, type ClusterCard } from '../api/clusters'
import type { Cluster } from '../types/cluster'

const emit = defineEmits<{
  (e: 'openCluster', cluster: Cluster): void
  (e: 'openPlanner'): void
  (e: 'openPartner'): void
}>()

type Filter = {
  id: string
  label: string
  description: string
  bgImage: string
  cardImage: string
}

const filters: Filter[] = [
  {
    id: 'run',
    label: 'Сбежать от людей',
    description: 'Уединённые места и тишина',
    bgImage: seaImg,
    cardImage: seaImg,
  },
  {
    id: 'taste',
    label: 'Почувствовать вкус',
    description: 'Вино, еда и локальные продукты',
    bgImage: wineImg,
    cardImage: wineImg,
  },
  {
    id: 'kids',
    label: 'Легко с детьми',
    description: 'Семейный отдых без хлопот',
    bgImage: kidsImg,
    cardImage: kidsImg,
  },
  {
    id: 'view',
    label: 'Работа с видом',
    description: 'Коворкинги и видовые точки',
    bgImage: viewImg,
    cardImage: viewImg,
  },
  {
    id: 'calm',
    label: 'Размеренно и душевно',
    description: 'Спокойный темп и природа',
    bgImage: calmImg,
    cardImage: calmImg,
  },
  {
    id: 'secret',
    label: 'То, о чём никто не знает',
    description: 'Секретные локации региона',
    bgImage: secretImg,
    cardImage: secretImg,
  },
]

const fallbackCards: ClusterCard[] = [
  { id: 'cl1', image: seaImg, rating: 4.9, reviews: 'По отзывам', title: 'Отель и прогулки у моря', meta: 'Краснодарский край', price: 7361 },
  { id: 'cl2', image: calmImg, rating: 5.0, reviews: 'По отзывам', title: 'Дом среди природы', meta: 'Тихий район', price: 5429 },
  { id: 'cl3', image: viewImg, rating: 4.9, reviews: 'По отзывам', title: 'Локация для работы с видом', meta: 'Кофе, терраса', price: 7854 },
  { id: 'cl4', image: wineImg, rating: 4.9, reviews: 'По отзывам', title: 'Винные маршруты', meta: 'Вкус, дегустации', price: 12328 },
  { id: 'cl5', image: kidsImg, rating: 4.9, reviews: 'По отзывам', title: 'Куда сходить с детьми', meta: 'Семейный отдых', price: 6000 },
  { id: 'cl6', image: secretImg, rating: 4.8, reviews: 'По отзывам', title: 'Нестандартная станица', meta: 'Ремесла', price: 7010 },
]

const clusterCards = ref<ClusterCard[]>(fallbackCards)
const clusterByIdRef = ref<Map<string, Cluster>>(buildFallbackClusters(fallbackCards))
const clustersLoading = ref(true)

onMounted(async () => {
  const result = await fetchClusters()
  clustersLoading.value = false
  if (result) {
    clusterCards.value = result.cards
    clusterByIdRef.value = result.clusters
  }
})

function buildFallbackClusters(cards: ClusterCard[]): Map<string, Cluster> {
  const factPresets: Record<string, [string, string, string]> = {
    cl1: ['Соль в воздухе', 'Закат рядом', 'Тихая бухта'],
    cl2: ['Тишина рядом', 'Чай и зелень', 'Туман красиво'],
    cl3: ['Фокус и вид', 'Дела в тишине', 'Заметки на свежем'],
    cl4: ['Вино в бокале', 'Ремесло вкусно', 'Ветер в листьях'],
    cl5: ['Игра и вкус', 'Творчество рядом', 'Шаги в радость'],
    cl6: ['Тайные мастерские', 'Дела руками', 'Фото без толпы'],
  }

  const clusterPhotoSets: Record<string, [string, string, string]> = {
    cl1: [seaImg, calmImg, wineImg],
    cl2: [calmImg, seaImg, viewImg],
    cl3: [viewImg, calmImg, seaImg],
    cl4: [wineImg, secretImg, calmImg],
    cl5: [kidsImg, seaImg, viewImg],
    cl6: [secretImg, calmImg, kidsImg],
  }

  const clusterCoords: Record<string, { lat: number; lon: number }> = {
    cl1: { lat: 43.585, lon: 39.723 },
    cl2: { lat: 45.041, lon: 37.360 },
    cl3: { lat: 44.982, lon: 38.917 },
    cl4: { lat: 44.958, lon: 37.783 },
    cl5: { lat: 45.025, lon: 37.170 },
    cl6: { lat: 44.476, lon: 39.016 },
  }

  const map = new Map<string, Cluster>()
  for (const c of cards) {
    const [fact1, fact2, fact3] = factPresets[c.id] ?? ['Впечатления', 'Вдохновение', 'Путешествие']
    const placePhotos = clusterPhotoSets[c.id] ?? [c.image, c.image, c.image]
    const coords = clusterCoords[c.id] ?? { lat: 45.0, lon: 38.0 }

    const baseDescription = `Сценарий "${c.title}": локальные смыслы, понятная логистика и ощущение "я нашёл(ла) своё место".`

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
          { id: `${c.id}-r1`, author: 'Анна', rating: Math.min(5, c.rating), text: 'Визит ощущается как "дистанционное" предвкушение: сразу хочется ехать.' },
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
        description: `${baseDescription} В этом варианте — больше "медленных" остановок и воздуха.`,
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
        description: `${baseDescription} Добавили "вау"-кадры и небольшие видовые паузы.`,
        reviewsLabel: c.reviews,
        reviews: [
          { id: `${c.id}-r7`, author: 'Вера', rating: 4.9, text: 'Очень красиво на фото и вживую — прям вау!' },
          { id: `${c.id}-r8`, author: 'Кирилл', rating: 4.7, text: 'Сильная концепция: хочется продолжения.' },
          { id: `${c.id}-r9`, author: 'Ирина', rating: 4.8, text: 'Легко представить поездку заранее. Отличный вариант.' },
        ],
      },
    ]

    const cluster: Cluster = {
      id: c.id,
      coverImage: c.image,
      title: c.title,
      places,
    }
    map.set(c.id, cluster)
  }
  return map
}

function openClusterById(id: string): void {
  const cluster = clusterByIdRef.value.get(id)
  if (!cluster) return
  emit('openCluster', cluster)
}

const isGalleryOpen = ref(false)
const galleryClusterTitle = ref('')
const galleryImages = ref<string[]>([])
const galleryActiveIndex = ref(0)

function openClusterGallery(id: string): void {
  const cluster = clusterByIdRef.value.get(id)
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

const selectedId = ref<string | null>(null)
const showClusters = ref(false)

const clusterFilterMap: Record<string, string[]> = {
  run: ['cl1', 'cl2', 'cl6'],
  taste: ['cl4'],
  kids: ['cl5'],
  view: ['cl3'],
  calm: ['cl2', 'cl6'],
  secret: ['cl6'],
}

const visibleClusters = computed(() => {
  const dedup = new Map<string, ClusterCard>()
  for (const c of clusterCards.value) dedup.set(c.id, c)
  const list = Array.from(dedup.values())
  const selected = selectedId.value
  if (!selected) return list
  const allowed = new Set(clusterFilterMap[selected] ?? [])
  const filtered = list.filter((c) => allowed.has(c.id))
  return filtered.length ? filtered : list
})

function selectFilter(filter: Filter): void {
  selectedId.value = filter.id
  showClusters.value = true
}

function resetToInitial(): void {
  selectedId.value = null
  showClusters.value = false
  isGalleryOpen.value = false
}
</script>

<template>
  <main class="landing">
    <!-- Header -->
    <header class="header">
      <div class="header__logo">
        <span class="header__logoIcon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
            <path d="M2 12h20"/>
          </svg>
        </span>
        <span class="header__logoText">Cluster</span>
      </div>
      <nav class="header__nav">
        <button type="button" class="header__navLink" @click="emit('openPlanner')">
          Маршруты
        </button>
        <button type="button" class="header__navLink" @click="emit('openPartner')">
          Партнёрам
        </button>
      </nav>
      <button type="button" class="header__cta" @click="emit('openPlanner')">
        Собрать маршрут
      </button>
    </header>

    <!-- Hero Section -->
    <section v-if="!showClusters" class="hero">
      <div class="hero__content">
        <span class="hero__badge">Краснодарский край</span>
        <h1 class="hero__title">
          Открой свой<br/>идеальный маршрут
        </h1>
        <p class="hero__subtitle">
          Персонализированные путешествия с ИИ-планировщиком.<br/>
          Выбери настроение — мы подберём места.
        </p>
        <div class="hero__actions">
          <button type="button" class="hero__btn hero__btn--primary" @click="emit('openPlanner')">
            Подобрать по ИИ
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
          <button type="button" class="hero__btn hero__btn--secondary" @click="showClusters = true">
            Смотреть все
          </button>
        </div>
      </div>
    </section>

    <!-- Filters Section -->
    <section v-if="!showClusters" class="filters">
      <h2 class="filters__title">Что ты хочешь почувствовать?</h2>
      <div class="filters__grid">
        <button
          v-for="f in filters"
          :key="f.id"
          type="button"
          class="filter-card"
          @click="selectFilter(f)"
        >
          <div class="filter-card__image" :style="{ backgroundImage: `url(${f.cardImage})` }"></div>
          <div class="filter-card__overlay"></div>
          <div class="filter-card__content">
            <h3 class="filter-card__title">{{ f.label }}</h3>
            <p class="filter-card__desc">{{ f.description }}</p>
          </div>
        </button>
      </div>
    </section>

    <!-- Clusters Section -->
    <section v-if="showClusters" class="clusters">
      <div class="clusters__header">
        <button type="button" class="clusters__back" @click="resetToInitial">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Назад
        </button>
        <h2 class="clusters__title">
          {{ selectedId ? filters.find(f => f.id === selectedId)?.label : 'Все маршруты' }}
        </h2>
      </div>
      
      <div class="clusters__grid">
        <article
          v-for="c in visibleClusters"
          :key="c.id"
          class="cluster-card"
          role="button"
          tabindex="0"
          @click="openClusterById(c.id)"
          @keydown.enter.prevent="openClusterById(c.id)"
        >
          <div class="cluster-card__image">
            <img :src="c.image" :alt="c.title" />
            <div class="cluster-card__rating">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
              </svg>
              {{ c.rating }}
            </div>
          </div>
          <div class="cluster-card__body">
            <span class="cluster-card__meta">{{ c.meta }}</span>
            <h3 class="cluster-card__title">{{ c.title }}</h3>
            <div class="cluster-card__footer">
              <span class="cluster-card__price">{{ c.price.toLocaleString('ru-RU') }} ₽</span>
              <button
                type="button"
                class="cluster-card__gallery"
                @click.stop="openClusterGallery(c.id)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- Gallery Modal -->
    <div v-if="isGalleryOpen" class="gallery-modal" @click="closeClusterGallery">
      <div class="gallery-modal__content" @click.stop>
        <div class="gallery-modal__header">
          <h3 class="gallery-modal__title">{{ galleryClusterTitle }}</h3>
          <button type="button" class="gallery-modal__close" @click="closeClusterGallery">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="gallery-modal__main">
          <img
            v-if="galleryImages.length"
            :src="galleryImages[galleryActiveIndex]"
            alt="Фото кластера"
          />
        </div>
        <div class="gallery-modal__thumbs">
          <button
            v-for="(img, idx) in galleryImages"
            :key="idx"
            type="button"
            class="gallery-modal__thumb"
            :class="{ 'gallery-modal__thumb--active': idx === galleryActiveIndex }"
            @click="selectGalleryImage(idx)"
          >
            <img :src="img" :alt="`Фото ${idx + 1}`" />
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.landing {
  min-height: 100vh;
  background: var(--bg-primary);
}

/* Header */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6);
  background: rgba(10, 10, 11, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-subtle);
}

.header__logo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-primary);
}

.header__logoIcon {
  display: flex;
  color: var(--accent);
}

.header__logoText {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.header__nav {
  display: flex;
  gap: var(--space-1);
}

.header__navLink {
  padding: var(--space-2) var(--space-3);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.header__navLink:hover {
  color: var(--text-primary);
  background: var(--bg-elevated);
}

.header__cta {
  padding: var(--space-2) var(--space-4);
  font-size: 14px;
  font-weight: 500;
  color: #000;
  background: var(--accent);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.header__cta:hover {
  background: var(--accent-light);
}

/* Hero */
.hero {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: calc(80px + var(--space-16)) var(--space-6) var(--space-10);
  text-align: center;
}

.hero__content {
  max-width: 720px;
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font-size: 13px;
  font-weight: 500;
  color: var(--accent-light);
  background: var(--accent-muted);
  border: 1px solid var(--accent-border);
  border-radius: var(--radius-full);
  margin-bottom: var(--space-6);
}

.hero__title {
  font-size: clamp(36px, 6vw, 64px);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: var(--text-primary);
  margin-bottom: var(--space-5);
}

.hero__subtitle {
  font-size: 18px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin-bottom: var(--space-8);
}

.hero__actions {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
  flex-wrap: wrap;
}

.hero__btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-6);
  font-size: 15px;
  font-weight: 600;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.hero__btn--primary {
  color: #000;
  background: var(--accent);
  border: none;
}

.hero__btn--primary:hover {
  background: var(--accent-light);
  transform: translateY(-1px);
}

.hero__btn--secondary {
  color: var(--text-primary);
  background: transparent;
  border: 1px solid var(--border-default);
}

.hero__btn--secondary:hover {
  background: var(--bg-elevated);
  border-color: var(--border-strong);
}

/* Filters */
.filters {
  padding: 0 var(--space-6) var(--space-16);
  max-width: 1200px;
  margin: 0 auto;
}

.filters__title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-6);
  text-align: center;
}

.filters__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

.filter-card {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: var(--radius-xl);
  overflow: hidden;
  cursor: pointer;
  border: 1px solid var(--border-subtle);
  transition: all var(--transition-base);
}

.filter-card:hover {
  border-color: var(--accent-border);
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.filter-card__image {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transition: transform var(--transition-slow);
}

.filter-card:hover .filter-card__image {
  transform: scale(1.05);
}

.filter-card__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.85) 0%,
    rgba(0, 0, 0, 0.4) 50%,
    rgba(0, 0, 0, 0.2) 100%
  );
}

.filter-card__content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--space-5);
}

.filter-card__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.filter-card__desc {
  font-size: 14px;
  color: var(--text-secondary);
}

/* Clusters */
.clusters {
  padding: calc(80px + var(--space-6)) var(--space-6) var(--space-16);
  max-width: 1200px;
  margin: 0 auto;
}

.clusters__header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.clusters__back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.clusters__back:hover {
  color: var(--text-primary);
  background: var(--bg-elevated);
}

.clusters__title {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
}

.clusters__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-5);
}

.cluster-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-base);
}

.cluster-card:hover {
  border-color: var(--border-default);
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.cluster-card__image {
  position: relative;
  aspect-ratio: 16/10;
  overflow: hidden;
}

.cluster-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow);
}

.cluster-card:hover .cluster-card__image img {
  transform: scale(1.05);
}

.cluster-card__rating {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  border-radius: var(--radius-sm);
}

.cluster-card__rating svg {
  color: #fbbf24;
}

.cluster-card__body {
  padding: var(--space-4);
}

.cluster-card__meta {
  font-size: 12px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.cluster-card__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-top: var(--space-1);
  margin-bottom: var(--space-3);
  line-height: 1.3;
}

.cluster-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cluster-card__price {
  font-size: 18px;
  font-weight: 700;
  color: var(--accent-light);
}

.cluster-card__gallery {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: var(--text-tertiary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.cluster-card__gallery:hover {
  color: var(--text-primary);
  background: var(--bg-elevated);
  border-color: var(--border-default);
}

/* Gallery Modal */
.gallery-modal {
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

.gallery-modal__content {
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.gallery-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border-subtle);
}

.gallery-modal__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.gallery-modal__close {
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
  transition: all var(--transition-fast);
}

.gallery-modal__close:hover {
  color: var(--text-primary);
  background: var(--bg-elevated);
}

.gallery-modal__main {
  padding: var(--space-4);
}

.gallery-modal__main img {
  width: 100%;
  height: auto;
  max-height: 60vh;
  object-fit: contain;
  border-radius: var(--radius-lg);
}

.gallery-modal__thumbs {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-4);
  padding-top: 0;
  overflow-x: auto;
}

.gallery-modal__thumb {
  flex-shrink: 0;
  width: 80px;
  height: 60px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.gallery-modal__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-modal__thumb:hover {
  border-color: var(--text-tertiary);
}

.gallery-modal__thumb--active {
  border-color: var(--accent);
}

/* Responsive */
@media (max-width: 1024px) {
  .filters__grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .clusters__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .header__nav {
    display: none;
  }
  
  .hero {
    padding-top: calc(60px + var(--space-10));
    padding-left: var(--space-4);
    padding-right: var(--space-4);
  }
  
  .hero__subtitle br {
    display: none;
  }
  
  .hero__actions {
    flex-direction: column;
    width: 100%;
  }
  
  .hero__btn {
    width: 100%;
    justify-content: center;
  }
  
  .filters {
    padding-left: var(--space-4);
    padding-right: var(--space-4);
  }
  
  .filters__grid {
    grid-template-columns: 1fr;
  }
  
  .clusters {
    padding-left: var(--space-4);
    padding-right: var(--space-4);
  }
  
  .clusters__header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
  
  .clusters__grid {
    grid-template-columns: 1fr;
  }
}
</style>

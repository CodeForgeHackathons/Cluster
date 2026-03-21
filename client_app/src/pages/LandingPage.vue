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
  icon: string
}

const filters: Filter[] = [
  {
    id: 'run',
    label: 'Сбежать от людей',
    description: 'Уединённые места и тишина',
    bgImage: seaImg,
    cardImage: seaImg,
    icon: 'escape',
  },
  {
    id: 'taste',
    label: 'Почувствовать вкус',
    description: 'Вино, еда и локальные продукты',
    bgImage: wineImg,
    cardImage: wineImg,
    icon: 'wine',
  },
  {
    id: 'kids',
    label: 'Легко с детьми',
    description: 'Семейный отдых без хлопот',
    bgImage: kidsImg,
    cardImage: kidsImg,
    icon: 'family',
  },
  {
    id: 'view',
    label: 'Работа с видом',
    description: 'Коворкинги и видовые точки',
    bgImage: viewImg,
    cardImage: viewImg,
    icon: 'laptop',
  },
  {
    id: 'calm',
    label: 'Размеренно и душевно',
    description: 'Спокойный темп и природа',
    bgImage: calmImg,
    cardImage: calmImg,
    icon: 'leaf',
  },
  {
    id: 'secret',
    label: 'То, о чём никто не знает',
    description: 'Секретные локации региона',
    bgImage: secretImg,
    cardImage: secretImg,
    icon: 'compass',
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
const isPageMounted = ref(false)

onMounted(async () => {
  isPageMounted.value = true
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
    <!-- Animated Background -->
    <div class="bg-effects">
      <div class="bg-gradient"></div>
      <div class="bg-grid"></div>
      <div class="bg-glow bg-glow--1"></div>
      <div class="bg-glow bg-glow--2"></div>
    </div>

    <!-- Header -->
    <header class="header" :class="{ 'header--visible': isPageMounted }">
      <div class="header__logo" @click="resetToInitial">
        <!-- Custom SVG Logo -->
        <div class="logo">
          <div class="logo__icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <!-- Main cluster shape -->
              <circle cx="16" cy="16" r="6" fill="url(#logoGradient)" />
              <circle cx="8" cy="10" r="3" fill="url(#logoGradient)" opacity="0.8" />
              <circle cx="24" cy="10" r="3" fill="url(#logoGradient)" opacity="0.8" />
              <circle cx="8" cy="22" r="3" fill="url(#logoGradient)" opacity="0.6" />
              <circle cx="24" cy="22" r="3" fill="url(#logoGradient)" opacity="0.6" />
              <!-- Connecting lines -->
              <path d="M11 13L14 15M18 15L21 13M11 19L14 17M18 17L21 19" stroke="url(#logoGradient)" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
              <!-- Glow effect -->
              <circle cx="16" cy="16" r="10" stroke="url(#logoGradient)" stroke-width="0.5" opacity="0.3" />
              <defs>
                <linearGradient id="logoGradient" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stop-color="#34d399" />
                  <stop offset="100%" stop-color="#10b981" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span class="logo__text">Cluster</span>
        </div>
      </div>
      <nav class="header__nav">
        <button type="button" class="header__navLink" @click="emit('openPlanner')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
          Маршруты
        </button>
        <button type="button" class="header__navLink" @click="emit('openPartner')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          Партнёрам
        </button>
      </nav>
      <button type="button" class="header__cta" @click="emit('openPlanner')">
        <span class="header__cta-glow"></span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 3v18M3 12h18"/>
        </svg>
        Собрать маршрут
      </button>
    </header>

    <!-- Hero Section -->
    <section v-if="!showClusters" class="hero">
      <div class="hero__content" :class="{ 'hero__content--visible': isPageMounted }">
        <div class="hero__badge">
          <span class="hero__badge-dot"></span>
          Краснодарский край
          <span class="hero__badge-new">AI</span>
        </div>
        <h1 class="hero__title">
          <span class="hero__title-line">Открой свой</span>
          <span class="hero__title-accent">идеальный маршрут</span>
        </h1>
        <p class="hero__subtitle">
          Персонализированные путешествия с ИИ-планировщиком.
          Выбери настроение — мы подберём места.
        </p>
        <div class="hero__actions">
          <button type="button" class="hero__btn hero__btn--primary" @click="emit('openPlanner')">
            <span class="hero__btn-bg"></span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            Подобрать по ИИ
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
          <button type="button" class="hero__btn hero__btn--secondary" @click="showClusters = true">
            Смотреть все маршруты
          </button>
        </div>
        
        <!-- Stats -->
        <div class="hero__stats">
          <div class="hero__stat">
            <span class="hero__stat-value">50+</span>
            <span class="hero__stat-label">маршрутов</span>
          </div>
          <div class="hero__stat-divider"></div>
          <div class="hero__stat">
            <span class="hero__stat-value">200+</span>
            <span class="hero__stat-label">локаций</span>
          </div>
          <div class="hero__stat-divider"></div>
          <div class="hero__stat">
            <span class="hero__stat-value">4.9</span>
            <span class="hero__stat-label">рейтинг</span>
          </div>
        </div>
      </div>

      <!-- Floating elements -->
      <div class="hero__floating">
        <div class="floating-card floating-card--1">
          <img :src="seaImg" alt="" />
          <span>Море</span>
        </div>
        <div class="floating-card floating-card--2">
          <img :src="wineImg" alt="" />
          <span>Вино</span>
        </div>
        <div class="floating-card floating-card--3">
          <img :src="calmImg" alt="" />
          <span>Природа</span>
        </div>
      </div>
    </section>

    <!-- Filters Section -->
    <section v-if="!showClusters" class="filters">
      <div class="section-header">
        <span class="section-label">Настроения</span>
        <h2 class="section-title">Что ты хочешь почувствовать?</h2>
      </div>
      <div class="filters__grid">
        <button
          v-for="(f, index) in filters"
          :key="f.id"
          type="button"
          class="filter-card"
          :style="{ animationDelay: `${index * 0.1}s` }"
          @click="selectFilter(f)"
        >
          <div class="filter-card__image" :style="{ backgroundImage: `url(${f.cardImage})` }"></div>
          <div class="filter-card__overlay"></div>
          <div class="filter-card__shine"></div>
          <div class="filter-card__content">
            <div class="filter-card__icon">
              <!-- Escape icon -->
              <svg v-if="f.icon === 'escape'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <!-- Wine icon -->
              <svg v-else-if="f.icon === 'wine'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 22h8"/>
                <path d="M12 11v11"/>
                <path d="M5 3h14l-3 9c-.4 1.2-1.5 2-2.8 2h-2.4c-1.3 0-2.4-.8-2.8-2L5 3Z"/>
              </svg>
              <!-- Family icon -->
              <svg v-else-if="f.icon === 'family'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="5" r="3"/>
                <path d="M12 8v4"/>
                <circle cx="6" cy="10" r="2"/>
                <circle cx="18" cy="10" r="2"/>
                <path d="M6 12v2"/>
                <path d="M18 12v2"/>
                <path d="M9 20a3 3 0 0 1 6 0"/>
              </svg>
              <!-- Laptop icon -->
              <svg v-else-if="f.icon === 'laptop'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <path d="M2 20h20"/>
              </svg>
              <!-- Leaf icon -->
              <svg v-else-if="f.icon === 'leaf'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 9-9 0 5-2 10-9 10"/>
                <path d="M20 4s-2 3-4 5"/>
              </svg>
              <!-- Compass icon -->
              <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88"/>
              </svg>
            </div>
            <h3 class="filter-card__title">{{ f.label }}</h3>
            <p class="filter-card__desc">{{ f.description }}</p>
            <span class="filter-card__arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </span>
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
          v-for="(c, index) in visibleClusters"
          :key="c.id"
          class="cluster-card"
          :style="{ animationDelay: `${index * 0.1}s` }"
          role="button"
          tabindex="0"
          @click="openClusterById(c.id)"
          @keydown.enter.prevent="openClusterById(c.id)"
        >
          <div class="cluster-card__image">
            <img :src="c.image" :alt="c.title" />
            <div class="cluster-card__overlay"></div>
            <div class="cluster-card__rating">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
              </svg>
              {{ c.rating }}
            </div>
            <div class="cluster-card__badge">Популярное</div>
          </div>
          <div class="cluster-card__body">
            <span class="cluster-card__meta">{{ c.meta }}</span>
            <h3 class="cluster-card__title">{{ c.title }}</h3>
            <div class="cluster-card__footer">
              <div class="cluster-card__price">
                <span class="cluster-card__price-label">от</span>
                <span class="cluster-card__price-value">{{ c.price.toLocaleString('ru-RU') }} ₽</span>
              </div>
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
    <Teleport to="body">
      <Transition name="modal">
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
      </Transition>
    </Teleport>
  </main>
</template>

<style scoped>
.landing {
  min-height: 100vh;
  background: var(--bg-primary);
  position: relative;
  overflow: hidden;
}

/* ===== ANIMATED BACKGROUND ===== */
.bg-effects {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16, 185, 129, 0.15), transparent),
    radial-gradient(ellipse 60% 40% at 100% 0%, rgba(16, 185, 129, 0.08), transparent);
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent);
}

.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  animation: float 8s ease-in-out infinite;
}

.bg-glow--1 {
  width: 600px;
  height: 600px;
  background: rgba(16, 185, 129, 0.15);
  top: -200px;
  right: -100px;
}

.bg-glow--2 {
  width: 400px;
  height: 400px;
  background: rgba(16, 185, 129, 0.1);
  bottom: -100px;
  left: -100px;
  animation-delay: -4s;
}

/* ===== HEADER ===== */
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
  background: rgba(10, 10, 11, 0.7);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-subtle);
  transform: translateY(-100%);
  opacity: 0;
  transition: transform 0.6s ease, opacity 0.6s ease;
}

.header--visible {
  transform: translateY(0);
  opacity: 1;
}

/* Logo */
.logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  cursor: pointer;
}

.logo__icon {
  display: flex;
  animation: float 4s ease-in-out infinite;
}

.logo__text {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, var(--text-primary), var(--accent-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header__nav {
  display: flex;
  gap: var(--space-1);
}

.header__navLink {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
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

.header__navLink svg {
  opacity: 0.7;
}

.header__cta {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-size: 14px;
  font-weight: 600;
  color: #000;
  background: linear-gradient(135deg, var(--accent), var(--accent-dark));
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  overflow: hidden;
}

.header__cta-glow {
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, var(--accent-light), var(--accent));
  border-radius: inherit;
  opacity: 0;
  filter: blur(10px);
  transition: opacity var(--transition-base);
  z-index: -1;
}

.header__cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px var(--accent-muted);
}

.header__cta:hover .header__cta-glow {
  opacity: 0.5;
}

/* ===== HERO ===== */
.hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 75vh;
  padding: calc(80px + var(--space-16)) var(--space-6) var(--space-8);
  text-align: center;
  z-index: 1;
}

.hero__content {
  max-width: 800px;
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.hero__content--visible {
  opacity: 1;
  transform: translateY(0);
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-size: 13px;
  font-weight: 500;
  color: var(--accent-light);
  background: var(--accent-muted);
  border: 1px solid var(--accent-border);
  border-radius: var(--radius-full);
  margin-bottom: var(--space-6);
  animation: pulseGlow 3s ease-in-out infinite;
}

.hero__badge-dot {
  width: 6px;
  height: 6px;
  background: var(--accent);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

.hero__badge-new {
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 700;
  color: #000;
  background: var(--accent);
  border-radius: var(--radius-sm);
}

.hero__title {
  margin-bottom: var(--space-6);
}

.hero__title-line {
  display: block;
  font-size: clamp(36px, 6vw, 64px);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: var(--text-primary);
}

.hero__title-accent {
  display: block;
  font-size: clamp(40px, 7vw, 72px);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, var(--accent-light), var(--accent), #059669);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero__subtitle {
  font-size: 18px;
  line-height: 1.7;
  color: var(--text-secondary);
  margin-bottom: var(--space-8);
  max-width: 560px;
  margin-left: auto;
  margin-right: auto;
}

.hero__actions {
  display: flex;
  gap: var(--space-4);
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: var(--space-12);
}

.hero__btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-6);
  font-size: 15px;
  font-weight: 600;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  overflow: hidden;
}

.hero__btn--primary {
  color: #000;
  background: linear-gradient(135deg, var(--accent), var(--accent-dark));
  border: none;
  box-shadow: 0 4px 30px var(--accent-muted);
}

.hero__btn-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--accent-light), var(--accent));
  opacity: 0;
  transition: opacity var(--transition-base);
}

.hero__btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 40px var(--accent-glow);
}

.hero__btn--primary:hover .hero__btn-bg {
  opacity: 1;
}

.hero__btn--primary svg,
.hero__btn--primary span {
  position: relative;
  z-index: 1;
}

.hero__btn--secondary {
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
}

.hero__btn--secondary:hover {
  background: var(--bg-elevated);
  border-color: var(--border-strong);
  transform: translateY(-2px);
}

/* Stats */
.hero__stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-6);
  padding: var(--space-5) var(--space-8);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  max-width: fit-content;
  margin: 0 auto;
}

.hero__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}

.hero__stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--accent-light);
}

.hero__stat-label {
  font-size: 13px;
  color: var(--text-tertiary);
}

.hero__stat-divider {
  width: 1px;
  height: 40px;
  background: var(--border-default);
}

/* Floating cards */
.hero__floating {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.floating-card {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  animation: float 6s ease-in-out infinite;
}

.floating-card img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: var(--radius-md);
}

.floating-card span {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.floating-card--1 {
  top: 25%;
  left: 8%;
  animation-delay: 0s;
}

.floating-card--2 {
  top: 35%;
  right: 8%;
  animation-delay: -2s;
}

.floating-card--3 {
  bottom: 25%;
  left: 12%;
  animation-delay: -4s;
}

/* ===== SECTION HEADER ===== */
.section-header {
  text-align: center;
  margin-bottom: var(--space-10);
}

.section-label {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent);
  background: var(--accent-muted);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-3);
}

.section-title {
  font-size: clamp(24px, 4vw, 36px);
  font-weight: 700;
  color: var(--text-primary);
}

/* ===== FILTERS ===== */
.filters {
  position: relative;
  padding: 0 var(--space-6) var(--space-16);
  max-width: 1280px;
  margin: 0 auto;
  z-index: 1;
}

.filters__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-5);
}

.filter-card {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: var(--radius-xl);
  overflow: hidden;
  cursor: pointer;
  border: 1px solid var(--border-subtle);
  transition: all var(--transition-base);
  animation: fadeInUp 0.6s ease-out backwards;
}

.filter-card:hover {
  border-color: var(--accent-border);
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px var(--accent-muted);
}

.filter-card__image {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transition: transform 0.6s ease;
}

.filter-card:hover .filter-card__image {
  transform: scale(1.1);
}

.filter-card__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.9) 0%,
    rgba(0, 0, 0, 0.5) 40%,
    rgba(0, 0, 0, 0.2) 100%
  );
  transition: background var(--transition-base);
}

.filter-card:hover .filter-card__overlay {
  background: linear-gradient(
    to top,
    rgba(16, 185, 129, 0.3) 0%,
    rgba(0, 0, 0, 0.6) 50%,
    rgba(0, 0, 0, 0.3) 100%
  );
}

.filter-card__shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    transparent 0%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 100%
  );
  transform: translateX(-100%);
  transition: transform 0.8s ease;
}

.filter-card:hover .filter-card__shine {
  transform: translateX(100%);
}

.filter-card__content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.filter-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: var(--accent-muted);
  border: 1px solid var(--accent-border);
  border-radius: var(--radius-md);
  color: var(--accent-light);
  margin-bottom: var(--space-3);
  transition: all var(--transition-base);
}

.filter-card:hover .filter-card__icon {
  background: var(--accent);
  color: #000;
  transform: scale(1.1);
}

.filter-card__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.filter-card__desc {
  font-size: 14px;
  color: var(--text-secondary);
}

.filter-card__arrow {
  position: absolute;
  bottom: var(--space-5);
  right: var(--space-5);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 50%;
  color: var(--text-secondary);
  opacity: 0;
  transform: translateX(-10px);
  transition: all var(--transition-base);
}

.filter-card:hover .filter-card__arrow {
  opacity: 1;
  transform: translateX(0);
}

/* ===== CLUSTERS ===== */
.clusters {
  position: relative;
  padding: calc(80px + var(--space-6)) var(--space-6) var(--space-16);
  max-width: 1280px;
  margin: 0 auto;
  z-index: 1;
}

.clusters__header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
  animation: fadeInDown 0.5s ease-out;
}

.clusters__back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
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
  transform: translateX(-4px);
}

.clusters__title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.clusters__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-6);
}

.cluster-card {
  position: relative;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-base);
  animation: fadeInUp 0.6s ease-out backwards;
}

.cluster-card:hover {
  border-color: var(--accent-border);
  transform: translateY(-8px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 30px var(--accent-muted);
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
  transition: transform 0.6s ease;
}

.cluster-card:hover .cluster-card__image img {
  transform: scale(1.1);
}

.cluster-card__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.4), transparent);
  opacity: 0;
  transition: opacity var(--transition-base);
}

.cluster-card:hover .cluster-card__overlay {
  opacity: 1;
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
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  border-radius: var(--radius-sm);
}

.cluster-card__rating svg {
  color: #fbbf24;
}

.cluster-card__badge {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
  padding: var(--space-1) var(--space-2);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #000;
  background: var(--accent);
  border-radius: var(--radius-sm);
}

.cluster-card__body {
  padding: var(--space-4) var(--space-5);
}

.cluster-card__meta {
  font-size: 12px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.cluster-card__title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin-top: var(--space-1);
  margin-bottom: var(--space-4);
  line-height: 1.3;
}

.cluster-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cluster-card__price {
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
}

.cluster-card__price-label {
  font-size: 12px;
  color: var(--text-tertiary);
}

.cluster-card__price-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--accent-light);
}

.cluster-card__gallery {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: var(--text-tertiary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.cluster-card__gallery:hover {
  color: var(--accent-light);
  background: var(--accent-muted);
  border-color: var(--accent-border);
}

/* ===== GALLERY MODAL ===== */
.gallery-modal {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(20px);
}

.gallery-modal__content {
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  overflow: hidden;
  animation: fadeInScale 0.3s ease-out;
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
  width: 40px;
  height: 40px;
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
  padding: var(--space-5);
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
  padding: var(--space-4) var(--space-5);
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

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .gallery-modal__content,
.modal-leave-active .gallery-modal__content {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .gallery-modal__content,
.modal-leave-to .gallery-modal__content {
  transform: scale(0.95);
  opacity: 0;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1024px) {
  .filters__grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .clusters__grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .hero__floating {
    display: none;
  }
}

@media (max-width: 768px) {
  .header__nav {
    display: none;
  }
  
  .hero {
    min-height: auto;
    padding-top: calc(70px + var(--space-10));
    padding-left: var(--space-4);
    padding-right: var(--space-4);
  }
  
  .hero__stats {
    flex-direction: row;
    gap: var(--space-4);
    padding: var(--space-4);
  }
  
  .hero__stat-divider {
    height: 30px;
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
</template>

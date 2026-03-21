<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Cluster, Place, Review } from '../types/cluster'
import AvalinViewer from '../components/AvalinViewer.vue'

const props = defineProps<{
  cluster: Cluster
  routePlaceIds: Set<string>
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'toggleRoutePlace', place: Place): void
}>()

const query = ref('')
const selectedPlaceId = ref('')
const show3DTour = ref(false)

const filteredPlaces = computed<Place[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.cluster.places

  return props.cluster.places.filter((p) => {
    return (
      p.title.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      p.fact.toLowerCase().includes(q)
    )
  })
})

const selectedPlace = computed<Place>(() => {
  const list = filteredPlaces.value.length ? filteredPlaces.value : props.cluster.places
  const found = list.find((p) => p.id === selectedPlaceId.value)
  return found ?? list[0]
})

const factParts = computed<[string, string]>(() => {
  const words = selectedPlace.value.fact.split(/\s+/).filter(Boolean)
  const first = words[0] ?? ''
  const second = words[1] ?? ''
  return [first, second]
})

watch(
  () => props.cluster.id,
  () => {
    query.value = ''
    selectedPlaceId.value = props.cluster.places[0]?.id ?? ''
  },
  { immediate: true },
)

function toggleRoute(): void {
  emit('toggleRoutePlace', selectedPlace.value)
}

function toggle3DTour(): void {
  show3DTour.value = !show3DTour.value
}

function has3DTour(place: Place): boolean {
  return !!place.avalinTourUrl
}

function reviewStars(r: Review): string {
  const rating = r.rating ?? 5
  const full = Math.round(rating)
  return '★'.repeat(full) + '☆'.repeat(5 - full)
}
</script>

<template>
  <main class="cluster-page">
    <!-- Header -->
    <header class="page-header">
      <button type="button" class="back-btn" @click="emit('back')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Назад
      </button>
      <div class="page-header__center">
        <h1 class="page-header__title">{{ cluster.title }}</h1>
        <span class="page-header__subtitle">Выберите места для маршрута</span>
      </div>
      <div class="page-header__rating">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
        </svg>
        {{ selectedPlace.rating.toFixed(1) }}
      </div>
    </header>

    <div class="cluster-content">
      <!-- Sidebar with search and places -->
      <aside class="cluster-sidebar">
        <div class="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            v-model="query"
            type="search"
            placeholder="Поиск места..."
            class="search-input"
          />
        </div>

        <div class="places-list">
          <button
            v-for="p in filteredPlaces"
            :key="p.id"
            type="button"
            class="place-item"
            :class="{ 'place-item--active': p.id === selectedPlace.id }"
            @click="selectedPlaceId = p.id"
          >
            <img :src="p.photo" :alt="p.title" class="place-item__image" />
            <div class="place-item__info">
              <span class="place-item__title">{{ p.title }}</span>
              <span class="place-item__location">{{ p.location }}</span>
            </div>
            <span v-if="props.routePlaceIds.has(p.id)" class="place-item__badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
          </button>
        </div>
      </aside>

      <!-- Main content area -->
      <div class="cluster-main">
        <div class="place-detail">
          <!-- Image Section -->
          <div class="place-image-section">
            <div v-if="show3DTour && has3DTour(selectedPlace)" class="place-3d-tour">
              <AvalinViewer
                :tour-url="selectedPlace.avalinTourUrl"
                :title="selectedPlace.title"
                height="100%"
              />
            </div>
            <img
              v-else
              :src="selectedPlace.photo"
              :alt="selectedPlace.title"
              class="place-image"
            />
            
            <button
              v-if="has3DTour(selectedPlace)"
              type="button"
              class="tour-toggle"
              @click="toggle3DTour"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
              {{ show3DTour ? 'Фото' : '3D тур' }}
            </button>

            <div class="place-image-overlay">
              <span class="place-price">{{ selectedPlace.cost.toLocaleString('ru-RU') }} ₽</span>
            </div>
          </div>

          <!-- Info Section -->
          <div class="place-info">
            <div class="place-header">
              <div>
                <h2 class="place-title">{{ selectedPlace.title }}</h2>
                <p class="place-location">{{ selectedPlace.location }}</p>
              </div>
              <button
                type="button"
                class="add-route-btn"
                :class="{ 'add-route-btn--added': props.routePlaceIds.has(selectedPlace.id) }"
                @click="toggleRoute"
              >
                <svg v-if="!props.routePlaceIds.has(selectedPlace.id)" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {{ props.routePlaceIds.has(selectedPlace.id) ? 'В маршруте' : 'Добавить' }}
              </button>
            </div>

            <!-- Fact Card -->
            <div class="info-card">
              <span class="info-card__label">Интересный факт</span>
              <div class="fact-text">
                <span>{{ factParts[0] }}</span>
                <span class="fact-text--accent">{{ factParts[1] }}</span>
              </div>
            </div>

            <!-- Description Card -->
            <div class="info-card">
              <span class="info-card__label">Описание</span>
              <p class="description-text">{{ selectedPlace.description }}</p>
            </div>

            <!-- Reviews Section -->
            <div class="reviews-section">
              <div class="reviews-header">
                <span class="info-card__label">Отзывы</span>
                <span class="reviews-count">{{ selectedPlace.reviewsLabel }}</span>
              </div>
              <div class="reviews-list">
                <div
                  v-for="r in selectedPlace.reviews.slice(0, 3)"
                  :key="r.id"
                  class="review-card"
                >
                  <div class="review-header">
                    <span class="review-author">{{ r.author }}</span>
                    <span class="review-stars">{{ reviewStars(r) }}</span>
                  </div>
                  <p class="review-text">{{ r.text }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.cluster-page {
  min-height: 100vh;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
}

/* Page Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-subtle);
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

.page-header__center {
  text-align: center;
}

.page-header__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.page-header__subtitle {
  font-size: 13px;
  color: var(--text-tertiary);
}

.page-header__rating {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.page-header__rating svg {
  color: #fbbf24;
}

/* Content Layout */
.cluster-content {
  flex: 1;
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 0;
  overflow: hidden;
}

/* Sidebar */
.cluster-sidebar {
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-box {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}

.search-box svg {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  padding: var(--space-2);
  font-size: 14px;
  color: var(--text-primary);
  background: transparent;
  border: none;
  outline: none;
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.places-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2);
}

.place-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  text-align: left;
  transition: all var(--transition-fast);
}

.place-item:hover {
  background: var(--bg-tertiary);
}

.place-item--active {
  background: var(--bg-elevated);
  border-color: var(--accent-border);
}

.place-item__image {
  width: 56px;
  height: 42px;
  object-fit: cover;
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.place-item__info {
  flex: 1;
  min-width: 0;
}

.place-item__title {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.place-item__location {
  display: block;
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

.place-item__badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--accent-muted);
  border-radius: var(--radius-full);
  color: var(--accent);
}

/* Main Content */
.cluster-main {
  overflow-y: auto;
  padding: var(--space-6);
}

.place-detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
  max-width: 1100px;
}

/* Image Section */
.place-image-section {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--bg-secondary);
}

.place-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.place-3d-tour {
  width: 100%;
  height: 100%;
}

.tour-toggle {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tour-toggle:hover {
  background: rgba(0, 0, 0, 0.8);
}

.place-image-overlay {
  position: absolute;
  bottom: var(--space-4);
  right: var(--space-4);
}

.place-price {
  padding: var(--space-2) var(--space-4);
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  background: var(--accent-muted);
  border: 1px solid var(--accent-border);
  border-radius: var(--radius-lg);
}

/* Info Section */
.place-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.place-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.place-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.place-location {
  font-size: 14px;
  color: var(--text-secondary);
}

.add-route-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  font-size: 14px;
  font-weight: 600;
  color: #000;
  background: var(--accent);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.add-route-btn:hover {
  background: var(--accent-light);
}

.add-route-btn--added {
  color: var(--accent-light);
  background: var(--accent-muted);
  border: 1px solid var(--accent-border);
}

.add-route-btn--added:hover {
  background: var(--accent-muted);
}

/* Info Cards */
.info-card {
  padding: var(--space-4);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}

.info-card__label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-2);
}

.fact-text {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.fact-text--accent {
  color: var(--accent);
  margin-left: var(--space-2);
}

.description-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
}

/* Reviews */
.reviews-section {
  padding: var(--space-4);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}

.reviews-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.reviews-count {
  font-size: 13px;
  color: var(--text-tertiary);
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.review-card {
  padding: var(--space-3);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.review-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.review-author {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.review-stars {
  font-size: 12px;
  color: #fbbf24;
  letter-spacing: 1px;
}

.review-text {
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-secondary);
}

/* Responsive */
@media (max-width: 1024px) {
  .cluster-content {
    grid-template-columns: 1fr;
  }
  
  .cluster-sidebar {
    display: none;
  }
  
  .place-detail {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .page-header {
    padding: var(--space-3) var(--space-4);
  }
  
  .page-header__title {
    font-size: 16px;
  }
  
  .cluster-main {
    padding: var(--space-4);
  }
  
  .place-header {
    flex-direction: column;
  }
  
  .add-route-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>

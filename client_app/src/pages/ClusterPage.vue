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
  const full = '★★★★★'.slice(0, Math.max(0, Math.min(5, Math.round(rating))))
  const empty = '☆☆☆☆☆'.slice(0, 5 - full.length)
  return `${full}${empty}`
}
</script>

<template>
  <main
    class="cluster"
    role="application"
    :aria-label="`Кластер: ${cluster.title}`"
  >
    <div
      class="cluster__bg"
      :style="{ backgroundImage: `url(${selectedPlace.photo})` }"
      aria-hidden="true"
    />
    <div class="cluster__scrim" aria-hidden="true" />

    <header class="cluster__header">
      <button type="button" class="cluster__backBtn" @click="emit('back')">
        <span aria-hidden="true">←</span>
        <span>Назад</span>
      </button>

      <div class="cluster__headerTitle">
        <div class="cluster__title">{{ cluster.title }}</div>
        <div class="cluster__subtitle">Подбор впечатлений</div>
      </div>

      <div class="cluster__headerMeta">
        <div class="cluster__pill">
          <span class="cluster__pillIcon" aria-hidden="true">★</span>
          <span>{{ selectedPlace.rating.toFixed(1) }}</span>
        </div>
      </div>
    </header>

    <section class="cluster__content">
      <div class="cluster__searchWrap">
        <label class="cluster__searchLabel">
          Поиск места
          <input
            v-model="query"
            class="cluster__search"
            type="search"
            autocomplete="off"
            placeholder="Например: вид, дегустация, станция..."
          />
        </label>

        <div class="cluster__results" role="list" aria-label="Результаты поиска">
          <button
            v-for="p in filteredPlaces"
            :key="p.id"
            type="button"
            class="cluster__resultChip"
            :class="{ 'cluster__resultChip--active': p.id === selectedPlace.id }"
            role="listitem"
            @click="selectedPlaceId = p.id"
          >
            <img :src="p.photo" class="cluster__resultChipImg" :alt="p.title" />
            <span class="cluster__resultChipTitle">{{ p.title }}</span>
          </button>
        </div>
      </div>

      <article class="clusterCard">
        <div class="clusterCard__media">
          <!-- 3D Tour Viewer -->
          <div v-if="show3DTour && has3DTour(selectedPlace)" class="clusterCard__3dTour">
            <AvalinViewer
              :tour-url="selectedPlace.avalinTourUrl"
              :title="selectedPlace.title"
              height="300px"
              @tour-started="() => console.log('3D тур начат')"
              @tour-ended="() => console.log('3D тур завершен')"
            />
          </div>

          <!-- Regular Image -->
          <img
            v-else
            :src="selectedPlace.photo"
            class="clusterCard__img"
            :alt="selectedPlace.title"
          />

          <!-- 3D Tour Toggle Button -->
          <button
            v-if="has3DTour(selectedPlace)"
            type="button"
            class="clusterCard__3dToggle"
            @click="toggle3DTour"
          >
            <span class="clusterCard__3dToggleIcon">🎯</span>
            <span>{{ show3DTour ? 'Фотографии' : '3D тур' }}</span>
          </button>

          <div class="clusterCard__rating">
            <span class="clusterCard__ratingStars" aria-hidden="true">★</span>
            <span class="clusterCard__ratingValue">{{ selectedPlace.rating.toFixed(1) }}</span>
          </div>

          <div class="clusterCard__price">{{ selectedPlace.cost }} ₽</div>
        </div>

        <div class="clusterCard__body">
          <div class="clusterCard__top">
            <div class="clusterCard__title">{{ selectedPlace.title }}</div>
            <div class="clusterCard__location">{{ selectedPlace.location }}</div>
          </div>

          <div class="clusterCard__fact">
            <div class="clusterCard__factLabel">Интересный факт</div>
            <div class="clusterCard__factWords">
              <span class="clusterCard__factWord">{{ factParts[0] }}</span>
              <span class="clusterCard__factWord clusterCard__factWord--second">{{ factParts[1] }}</span>
            </div>
          </div>

          <div class="clusterCard__desc">
            <div class="clusterCard__descLabel">Описание</div>
            <p class="clusterCard__descText">{{ selectedPlace.description }}</p>
          </div>

          <div class="clusterCard__reviews">
            <div class="clusterCard__reviewsHeader">
              <div class="clusterCard__reviewsLabel">Отзывы</div>
              <div class="clusterCard__reviewsLabel2">{{ selectedPlace.reviewsLabel }}</div>
            </div>

            <div class="clusterCard__reviewsList">
              <div
                v-for="r in selectedPlace.reviews.slice(0, 3)"
                :key="r.id"
                class="clusterReview"
              >
                <div class="clusterReview__top">
                  <div class="clusterReview__author">{{ r.author }}</div>
                  <div class="clusterReview__stars" aria-hidden="true">{{ reviewStars(r) }}</div>
                </div>
                <div class="clusterReview__text">{{ r.text }}</div>
              </div>
            </div>
          </div>

          <div class="clusterCard__actions">
            <button type="button" class="clusterActionBtn" @click="toggleRoute">
              {{
                props.routePlaceIds.has(selectedPlace.id)
                  ? 'В маршруте'
                  : 'Добавить в маршрут'
              }}
            </button>
            <div class="clusterCard__hint">Добавляйте места в маршрут.</div>
          </div>
        </div>
      </article>
    </section>
  </main>
</template>

<style scoped>
.cluster {
  position: relative;
  min-height: 100svh;
  width: 100%;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.98);
}

.cluster__bg {
  position: absolute;
  inset: -20px;
  background-size: cover;
  background-position: center;
  filter: blur(16px) saturate(1.08) contrast(1.03);
  transform: scale(1.06);
}

.cluster__scrim {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(1200px 600px at 10% 5%, rgba(0, 194, 255, 0.28), transparent 55%),
    linear-gradient(180deg, rgba(0, 0, 0, 0.52) 0%, rgba(0, 0, 0, 0.65) 65%, rgba(0, 0, 0, 0.75) 100%);
}

.cluster__header {
  position: relative;
  z-index: 2;
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 8px;
}

.cluster__backBtn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(14px) saturate(140%);
  color: rgba(255, 255, 255, 0.96);
  cursor: pointer;
}

.cluster__headerTitle {
  flex: 1;
  min-width: 0;
  text-align: center;
}

.cluster__title {
  font-weight: 950;
  letter-spacing: 0.2px;
  font-size: clamp(18px, 2.4vw, 26px);
  text-shadow: 0 18px 70px rgba(0, 0, 0, 0.45);
}

.cluster__subtitle {
  margin-top: 4px;
  opacity: 0.9;
  font-size: 12px;
}

.cluster__headerMeta {
  width: 120px;
  display: flex;
  justify-content: flex-end;
}

.cluster__pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.2);
}

.cluster__content {
  position: relative;
  z-index: 2;
  padding: 10px 16px 24px;
  width: min(1100px, 100%);
  margin: 0 auto;
}

.cluster__searchWrap {
  margin: 10px 0 14px;
  padding: 14px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(16px) saturate(150%);
}

.cluster__searchLabel {
  display: block;
  font-weight: 900;
  font-size: 14px;
  margin-bottom: 10px;
}

.cluster__search {
  width: 100%;
  margin-top: 8px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(0, 0, 0, 0.25);
  color: rgba(255, 255, 255, 0.98);
  outline: none;
}

.cluster__search::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.cluster__results {
  display: flex;
  gap: 10px;
  overflow: auto;
  padding-bottom: 6px;
}

.cluster__resultChip {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.22);
  color: rgba(255, 255, 255, 0.95);
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease, background-color 160ms ease;
}

.cluster__resultChip:hover {
  transform: translateY(-2px);
  border-color: rgba(0, 194, 255, 0.5);
}

.cluster__resultChip--active {
  border-color: rgba(0, 194, 255, 0.85);
  background: rgba(0, 194, 255, 0.12);
  transform: translateY(-2px);
}

.cluster__resultChipImg {
  width: 42px;
  height: 32px;
  border-radius: 12px;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.cluster__resultChipTitle {
  font-weight: 900;
  font-size: 13px;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.clusterCard {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  gap: 16px;
  border-radius: 22px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(18px) saturate(160%);
  box-shadow: 0 40px 170px rgba(0, 0, 0, 0.55);
  animation: cardIn 520ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.clusterCard__media {
  position: relative;
  border-radius: 22px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
  min-height: 420px;
}

.clusterCard__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transform: scale(1.02);
}

.clusterCard__media::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(800px 380px at 15% 15%, rgba(255, 255, 255, 0.18), transparent 55%),
    linear-gradient(180deg, rgba(0, 0, 0, 0.0) 40%, rgba(0, 0, 0, 0.7) 100%);
}

.clusterCard__rating {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 1;
  display: inline-flex;
  gap: 10px;
  align-items: baseline;
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.32);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.clusterCard__ratingStars {
  font-size: 14px;
}

.clusterCard__ratingValue {
  font-weight: 950;
  letter-spacing: 0.2px;
}

.clusterCard__price {
  position: absolute;
  bottom: 14px;
  right: 14px;
  z-index: 1;
  font-weight: 1000;
  font-size: 22px;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(0, 194, 255, 0.14);
  border: 1px solid rgba(0, 194, 255, 0.35);
  text-shadow: 0 14px 60px rgba(0, 0, 0, 0.35);
}

.clusterCard__body {
  padding: 6px 6px 10px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.clusterCard__top {
  border-radius: 22px;
  padding: 12px 12px 6px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.18);
}

.clusterCard__title {
  font-weight: 1000;
  font-size: 20px;
  letter-spacing: 0.2px;
  line-height: 1.2;
}

.clusterCard__location {
  opacity: 0.9;
  margin-top: 6px;
  font-size: 13px;
}

.clusterCard__fact {
  border-radius: 22px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
}

.clusterCard__factLabel {
  font-weight: 950;
  font-size: 13px;
  opacity: 0.9;
  margin-bottom: 10px;
}

.clusterCard__factWords {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: baseline;
}

.clusterCard__factWord {
  font-weight: 1000;
  font-size: clamp(20px, 2.8vw, 30px);
  letter-spacing: 0.2px;
  color: rgba(255, 255, 255, 0.98);
}

.clusterCard__factWord--second {
  color: rgba(0, 194, 255, 0.95);
  text-shadow: 0 18px 60px rgba(0, 194, 255, 0.22);
}

.clusterCard__desc {
  border-radius: 22px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.18);
}

.clusterCard__descLabel {
  font-weight: 950;
  font-size: 13px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.clusterCard__descText {
  margin: 0;
  line-height: 1.4;
  opacity: 0.95;
}

.clusterCard__reviews {
  border-radius: 22px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
}

.clusterCard__reviewsHeader {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
}

.clusterCard__reviewsLabel {
  font-weight: 950;
  font-size: 13px;
  opacity: 0.9;
}

.clusterCard__reviewsLabel2 {
  opacity: 0.85;
  font-size: 13px;
}

.clusterCard__reviewsList {
  display: grid;
  gap: 10px;
}

.clusterReview {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px;
  background: rgba(0, 0, 0, 0.18);
}

.clusterReview__top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 8px;
}

.clusterReview__author {
  font-weight: 950;
}

.clusterReview__stars {
  font-size: 12px;
  opacity: 0.85;
  letter-spacing: 1px;
}

.clusterReview__text {
  opacity: 0.95;
  line-height: 1.35;
}

.clusterCard__actions {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.clusterActionBtn {
  flex: 1;
  border-radius: 18px;
  border: 1px solid rgba(0, 194, 255, 0.35);
  background: rgba(0, 194, 255, 0.12);
  color: rgba(255, 255, 255, 0.98);
  padding: 14px 16px;
  font-weight: 1000;
  letter-spacing: 0.2px;
  cursor: pointer;
  box-shadow: 0 24px 90px rgba(0, 194, 255, 0.14);
  transition: transform 160ms ease, border-color 160ms ease, background-color 160ms ease;
}

.clusterActionBtn:hover {
  transform: translateY(-2px);
  border-color: rgba(0, 194, 255, 0.75);
  background: rgba(0, 194, 255, 0.18);
}

.clusterCard__hint {
  width: 190px;
  opacity: 0.86;
  font-size: 12px;
  text-align: right;
}

.clusterCard__3dTour {
  width: 100%;
  height: 300px;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
}

.clusterCard__3dToggle {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 8px 16px;
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
  z-index: 10;
}

.clusterCard__3dToggle:hover {
  background: rgba(0, 0, 0, 0.8);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.clusterCard__3dToggleIcon {
  font-size: 14px;
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(14px);
    filter: blur(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

@media (max-width: 980px) {
  .clusterCard {
    grid-template-columns: 1fr;
  }

  .clusterCard__media {
    min-height: 300px;
  }

  .clusterCard__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .clusterCard__hint {
    width: auto;
    text-align: left;
  }
}
</style>

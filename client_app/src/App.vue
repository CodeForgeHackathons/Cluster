<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import LandingPage from './pages/LandingPage.vue'
import ClusterPage from './pages/ClusterPage.vue'
import RoutePlannerPage from './pages/RoutePlannerPage.vue'
import PartnerCabinetPage from './pages/PartnerCabinetPage.vue'
import { fetchClusters } from './api/clusters'
import type { Cluster, Place } from './types/cluster'

type Mode = 'landing' | 'cluster' | 'plan' | 'partner'

const mode = ref<Mode>('landing')
const selectedCluster = ref<Cluster | null>(null)
const clustersRef = ref<Map<string, Cluster> | null>(null)
const clustersLoading = ref(false)

const routePlaces = ref<Place[]>([])
const routePlaceIds = computed(() => new Set(routePlaces.value.map((p) => p.id)))

const isRouteOpen = ref(false)
const isPlannerOpen = ref(false)
const autoPlannerOpenedOnce = ref(false)

function openPlanner(): void {
  isPlannerOpen.value = true
  autoPlannerOpenedOnce.value = true
  mode.value = 'plan'
  isRouteOpen.value = false
}

function openCluster(cluster: Cluster): void {
  selectedCluster.value = cluster
  mode.value = 'cluster'
  isRouteOpen.value = false
}

async function ensureClustersLoaded(): Promise<Map<string, Cluster> | null> {
  if (clustersRef.value) return clustersRef.value
  if (clustersLoading.value) return clustersRef.value
  clustersLoading.value = true
  const result = await fetchClusters()
  clustersLoading.value = false
  if (!result) return null
  clustersRef.value = result.clusters
  return clustersRef.value
}

async function openClusterByPlaceId(placeId: string): Promise<void> {
  const clusterId = placeId.split('-')[0] ?? ''
  if (!clusterId) return
  const clusters = await ensureClustersLoaded()
  const cluster = clusters?.get(clusterId)
  if (cluster) openCluster(cluster)
}

function backToLanding(): void {
  mode.value = 'landing'
  selectedCluster.value = null
}

function backFromPlanner(): void {
  mode.value = selectedCluster.value ? 'cluster' : 'landing'
  isPlannerOpen.value = false
}

function openPartner(): void {
  mode.value = 'partner'
}

function backFromPartner(): void {
  mode.value = 'landing'
}

watch(
  () => routePlaces.value.length,
  (len) => {
    if (len === 0) {
      autoPlannerOpenedOnce.value = false
      return
    }

    if (len === 1 && !autoPlannerOpenedOnce.value && mode.value === 'cluster' && selectedCluster.value) {
      autoPlannerOpenedOnce.value = true
      mode.value = 'plan'
      isRouteOpen.value = false
      isPlannerOpen.value = true
    }
  },
)

onMounted(() => {
  void ensureClustersLoaded()
})

function togglePlaceInRoute(place: Place): void {
  const idx = routePlaces.value.findIndex((p) => p.id === place.id)
  if (idx >= 0) routePlaces.value.splice(idx, 1)
  else routePlaces.value.push(place)
}
</script>

<template>
  <LandingPage
    v-if="mode === 'landing'"
    @openCluster="openCluster"
    @openPlanner="openPlanner"
    @openPartner="openPartner"
  />

  <ClusterPage
    v-if="mode === 'cluster' && selectedCluster"
    :cluster="selectedCluster"
    :route-place-ids="routePlaceIds"
    @back="backToLanding"
    @toggleRoutePlace="togglePlaceInRoute"
  />

  <!-- Route FAB -->
  <button
    v-if="mode !== 'plan' && mode !== 'partner'"
    type="button"
    class="route-fab"
    :aria-label="routePlaces.length > 0 ? `Открыть маршрут. В нём ${routePlaces.length} мест` : 'Подобрать маршрут'"
    @click="routePlaces.length > 0 ? (isRouteOpen = !isRouteOpen) : openPlanner()"
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
    </svg>
    <span>{{ routePlaces.length > 0 ? `Маршрут: ${routePlaces.length}` : 'Подобрать маршрут' }}</span>
  </button>

  <!-- Route Drawer -->
  <transition name="drawer">
    <div v-if="isRouteOpen" class="route-drawer-overlay" role="dialog" aria-modal="true">
      <div class="route-drawer">
        <div class="route-drawer__header">
          <h2 class="route-drawer__title">Ваш маршрут</h2>
          <button type="button" class="route-drawer__close" @click="isRouteOpen = false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="route-drawer__list" role="list">
          <div
            v-for="p in routePlaces"
            :key="p.id"
            class="route-item"
            role="listitem"
          >
            <img :src="p.photo" class="route-item__img" :alt="p.title" />
            <div class="route-item__body">
              <div class="route-item__top">
                <span class="route-item__title">{{ p.title }}</span>
                <span class="route-item__cost">{{ p.cost.toLocaleString('ru-RU') }} ₽</span>
              </div>
              <span class="route-item__loc">{{ p.location }}</span>
              <button
                type="button"
                class="route-item__remove"
                @click="togglePlaceInRoute(p)"
              >
                Убрать
              </button>
            </div>
          </div>
        </div>

        <div class="route-drawer__footer">
          <p class="route-drawer__hint">Выберите места и соберите маршрут.</p>
          <button
            type="button"
            class="route-drawer__plan"
            @click="openPlanner"
          >
            Собрать маршрут
          </button>
        </div>
      </div>
    </div>
  </transition>

  <RoutePlannerPage
    v-if="mode === 'plan'"
    :route-places="routePlaces"
    @back="backFromPlanner"
    @openClusterByPlaceId="openClusterByPlaceId"
  />

  <PartnerCabinetPage v-if="mode === 'partner'" @back="backFromPartner" />
</template>

<style scoped>
/* Route FAB */
.route-fab {
  position: fixed;
  right: var(--space-4);
  bottom: var(--space-4);
  z-index: 50;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  font-size: 14px;
  font-weight: 600;
  color: #000;
  background: var(--accent);
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  box-shadow: var(--shadow-lg);
  transition: all var(--transition-fast);
}

.route-fab:hover {
  background: var(--accent-light);
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
}

/* Route Drawer Overlay */
.route-drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

/* Route Drawer */
.route-drawer {
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.route-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border-subtle);
}

.route-drawer__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.route-drawer__close {
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

.route-drawer__close:hover {
  color: var(--text-primary);
  background: var(--bg-elevated);
}

.route-drawer__list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* Route Item */
.route-item {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}

.route-item__img {
  width: 80px;
  height: 60px;
  object-fit: cover;
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.route-item__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.route-item__top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
}

.route-item__title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.route-item__cost {
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-light);
  flex-shrink: 0;
}

.route-item__loc {
  font-size: 12px;
  color: var(--text-tertiary);
}

.route-item__remove {
  align-self: flex-start;
  margin-top: var(--space-2);
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

.route-item__remove:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

/* Route Drawer Footer */
.route-drawer__footer {
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.route-drawer__hint {
  font-size: 13px;
  color: var(--text-tertiary);
}

.route-drawer__plan {
  padding: var(--space-3) var(--space-5);
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

.route-drawer__plan:hover {
  background: var(--accent-light);
}

/* Transitions */
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 200ms ease;
}

.drawer-enter-active .route-drawer,
.drawer-leave-active .route-drawer {
  transition: transform 200ms ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .route-drawer,
.drawer-leave-to .route-drawer {
  transform: translateY(100%);
}

/* Responsive */
@media (max-width: 640px) {
  .route-drawer__footer {
    flex-direction: column;
  }
  
  .route-drawer__plan {
    width: 100%;
  }
}
</style>

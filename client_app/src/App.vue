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
  <Transition name="page" mode="out-in">
    <LandingPage
      v-if="mode === 'landing'"
      key="landing"
      @openCluster="openCluster"
      @openPlanner="openPlanner"
      @openPartner="openPartner"
    />

    <ClusterPage
      v-else-if="mode === 'cluster' && selectedCluster"
      key="cluster"
      :cluster="selectedCluster"
      :route-place-ids="routePlaceIds"
      @back="backToLanding"
      @toggleRoutePlace="togglePlaceInRoute"
    />

    <RoutePlannerPage
      v-else-if="mode === 'plan'"
      key="plan"
      :route-places="routePlaces"
      @back="backFromPlanner"
      @openClusterByPlaceId="openClusterByPlaceId"
    />

    <PartnerCabinetPage 
      v-else-if="mode === 'partner'" 
      key="partner"
      @back="backFromPartner" 
    />
  </Transition>

  <!-- Route FAB -->
  <Transition name="fab">
    <button
      v-if="mode !== 'plan' && mode !== 'partner'"
      type="button"
      class="route-fab"
      :class="{ 'route-fab--active': routePlaces.length > 0 }"
      :aria-label="routePlaces.length > 0 ? `Открыть маршрут. В нём ${routePlaces.length} мест` : 'Подобрать маршрут'"
      @click="routePlaces.length > 0 ? (isRouteOpen = !isRouteOpen) : openPlanner()"
    >
      <span class="route-fab__glow"></span>
      <span class="route-fab__icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
        </svg>
      </span>
      <span class="route-fab__text">{{ routePlaces.length > 0 ? `Маршрут: ${routePlaces.length}` : 'Подобрать маршрут' }}</span>
      <span v-if="routePlaces.length > 0" class="route-fab__badge">{{ routePlaces.length }}</span>
    </button>
  </Transition>

  <!-- Route Drawer -->
  <Transition name="drawer">
    <div v-if="isRouteOpen" class="route-drawer-overlay" role="dialog" aria-modal="true" @click="isRouteOpen = false">
      <div class="route-drawer" @click.stop>
        <div class="route-drawer__header">
          <div class="route-drawer__header-content">
            <div class="route-drawer__icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            </div>
            <div>
              <h2 class="route-drawer__title">Ваш маршрут</h2>
              <p class="route-drawer__count">{{ routePlaces.length }} {{ routePlaces.length === 1 ? 'место' : 'мест' }}</p>
            </div>
          </div>
          <button type="button" class="route-drawer__close" @click="isRouteOpen = false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="route-drawer__list" role="list">
          <TransitionGroup name="list">
            <div
              v-for="(p, index) in routePlaces"
              :key="p.id"
              class="route-item"
              role="listitem"
              :style="{ animationDelay: `${index * 0.05}s` }"
            >
              <div class="route-item__number">{{ index + 1 }}</div>
              <img :src="p.photo" class="route-item__img" :alt="p.title" />
              <div class="route-item__body">
                <div class="route-item__top">
                  <span class="route-item__title">{{ p.title }}</span>
                  <span class="route-item__cost">{{ p.cost.toLocaleString('ru-RU') }} ₽</span>
                </div>
                <span class="route-item__loc">{{ p.location }}</span>
              </div>
              <button
                type="button"
                class="route-item__remove"
                @click="togglePlaceInRoute(p)"
                title="Убрать из маршрута"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </TransitionGroup>
          
          <div v-if="routePlaces.length === 0" class="route-drawer__empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
            <p>Добавьте места в маршрут</p>
          </div>
        </div>

        <div class="route-drawer__footer">
          <div class="route-drawer__total">
            <span class="route-drawer__total-label">Итого:</span>
            <span class="route-drawer__total-value">{{ routePlaces.reduce((sum, p) => sum + p.cost, 0).toLocaleString('ru-RU') }} ₽</span>
          </div>
          <button
            type="button"
            class="route-drawer__plan"
            :disabled="routePlaces.length === 0"
            @click="openPlanner"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            Собрать маршрут с ИИ
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Page Transitions */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* FAB Transitions */
.fab-enter-active,
.fab-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fab-enter-from,
.fab-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}

/* Route FAB */
.route-fab {
  position: fixed;
  right: var(--space-5);
  bottom: var(--space-5);
  z-index: 50;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  font-size: 14px;
  font-weight: 600;
  color: #000;
  background: linear-gradient(135deg, var(--accent), var(--accent-dark));
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  box-shadow: 0 8px 30px var(--accent-muted);
  transition: all var(--transition-fast);
  overflow: hidden;
}

.route-fab__glow {
  position: absolute;
  inset: -3px;
  background: linear-gradient(135deg, var(--accent-light), var(--accent));
  border-radius: inherit;
  opacity: 0;
  filter: blur(12px);
  transition: opacity var(--transition-base);
  z-index: -1;
}

.route-fab:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 40px var(--accent-glow);
}

.route-fab:hover .route-fab__glow {
  opacity: 0.6;
}

.route-fab--active {
  animation: pulseGlow 2s ease-in-out infinite;
}

.route-fab__icon {
  display: flex;
}

.route-fab__text {
  position: relative;
  z-index: 1;
}

.route-fab__badge {
  display: none;
}

/* Route Drawer Overlay */
.route-drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

/* Route Drawer */
.route-drawer {
  width: 100%;
  max-width: 560px;
  max-height: 85vh;
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
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-tertiary);
}

.route-drawer__header-content {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.route-drawer__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: var(--accent-muted);
  border: 1px solid var(--accent-border);
  border-radius: var(--radius-lg);
  color: var(--accent-light);
}

.route-drawer__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.route-drawer__count {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

.route-drawer__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: var(--text-secondary);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.route-drawer__close:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.route-drawer__list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.route-drawer__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  padding: var(--space-12) var(--space-4);
  color: var(--text-tertiary);
  text-align: center;
}

.route-drawer__empty svg {
  opacity: 0.3;
}

/* Route Item */
.route-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
  animation: fadeInUp 0.3s ease-out backwards;
}

.route-item:hover {
  border-color: var(--border-default);
  background: var(--bg-elevated);
}

.route-item__number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 12px;
  font-weight: 700;
  color: #000;
  background: var(--accent);
  border-radius: 50%;
  flex-shrink: 0;
}

.route-item__img {
  width: 64px;
  height: 48px;
  object-fit: cover;
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.route-item__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--text-tertiary);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.route-item__remove:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

/* Route Drawer Footer */
.route-drawer__footer {
  padding: var(--space-5) var(--space-6);
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.route-drawer__total {
  display: flex;
  flex-direction: column;
}

.route-drawer__total-label {
  font-size: 12px;
  color: var(--text-tertiary);
}

.route-drawer__total-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.route-drawer__plan {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  font-size: 14px;
  font-weight: 600;
  color: #000;
  background: linear-gradient(135deg, var(--accent), var(--accent-dark));
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: 0 4px 20px var(--accent-muted);
}

.route-drawer__plan:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px var(--accent-glow);
}

.route-drawer__plan:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Drawer Transitions */
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.3s ease;
}

.drawer-enter-active .route-drawer,
.drawer-leave-active .route-drawer {
  transition: transform 0.3s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .route-drawer,
.drawer-leave-to .route-drawer {
  transform: translateY(100%);
}

/* List Transitions */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.list-move {
  transition: transform 0.3s ease;
}

/* Responsive */
@media (max-width: 640px) {
  .route-fab {
    right: var(--space-4);
    bottom: var(--space-4);
    padding: var(--space-3) var(--space-4);
  }
  
  .route-drawer__footer {
    flex-direction: column;
    gap: var(--space-3);
  }
  
  .route-drawer__total {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  
  .route-drawer__plan {
    width: 100%;
    justify-content: center;
  }
}
</style>

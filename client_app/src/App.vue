<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import LandingPage from './pages/LandingPage.vue'
import ClusterPage from './pages/ClusterPage.vue'
import RoutePlannerPage from './pages/RoutePlannerPage.vue'
import PartnerCabinetPage from './pages/PartnerCabinetPage.vue'
import type { Cluster, Place } from './types/cluster'

type Mode = 'landing' | 'cluster' | 'plan' | 'partner'

const mode = ref<Mode>('landing')
const selectedCluster = ref<Cluster | null>(null)

// "Маршрут" хранится в памяти: без запросов в бэкенд.
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

function backToLanding(): void {
  mode.value = 'landing'
  selectedCluster.value = null
}

function backFromPlanner(): void {
  // Возвращаемся в “Кластер”, если он был открыт, иначе на лендинг.
  // Важно: не сбрасываем `selectedCluster`, иначе `ClusterPage` (v-if) не отрендерится.
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

    // Открываем планировщик “для туриста” после добавления первого места,
    // чтобы шаг “когда еду / кто я” был в потоке выбора, а не в отдельной кнопке.
    if (len === 1 && !autoPlannerOpenedOnce.value && mode.value === 'cluster' && selectedCluster.value) {
      autoPlannerOpenedOnce.value = true
      mode.value = 'plan'
      isRouteOpen.value = false
      isPlannerOpen.value = true
    }
  },
)

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

  <button
    v-if="mode !== 'plan' && mode !== 'partner'"
    type="button"
    class="routeFab"
    :aria-label="routePlaces.length > 0 ? `Открыть маршрут. В нём ${routePlaces.length} мест` : 'Подобрать маршрут'"
    @click="routePlaces.length > 0 ? (isRouteOpen = !isRouteOpen) : openPlanner()"
  >
    <span class="routeFab__icon" aria-hidden="true">⟶</span>
    <span class="routeFab__label">{{ routePlaces.length > 0 ? `Маршрут: ${routePlaces.length}` : 'Подобрать маршрут' }}</span>
  </button>

  <transition name="routeDrawer">
    <div v-if="isRouteOpen" class="routeDrawerOverlay" role="dialog" aria-modal="true">
      <div class="routeDrawer">
        <div class="routeDrawer__header">
          <div class="routeDrawer__title">Ваш маршрут</div>
          <button type="button" class="routeDrawer__close" @click="isRouteOpen = false">
            ✕
          </button>
        </div>

        <div class="routeDrawer__list" role="list">
          <div
            v-for="p in routePlaces"
            :key="p.id"
            class="routeDrawerItem"
            role="listitem"
          >
            <img :src="p.photo" class="routeDrawerItem__img" :alt="p.title" />
            <div class="routeDrawerItem__body">
              <div class="routeDrawerItem__top">
                <div class="routeDrawerItem__title">{{ p.title }}</div>
                <div class="routeDrawerItem__cost">{{ p.cost }} ₽</div>
              </div>
              <div class="routeDrawerItem__loc">{{ p.location }}</div>
              <div class="routeDrawerItem__actions">
                <button
                  type="button"
                  class="routeDrawerItem__btn"
                  @click="togglePlaceInRoute(p)"
                >
                  Убрать
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="routeDrawer__footer">
          <div class="routeDrawer__footerRow">
            <div class="routeDrawer__hint">Выберите места и соберите маршрут.</div>
            <button
              type="button"
              class="routeDrawer__planBtn"
              @click="openPlanner"
            >
              Собрать маршрут
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>

  <RoutePlannerPage
    v-if="mode === 'plan'"
    :route-places="routePlaces"
    @back="backFromPlanner"
  />

  <PartnerCabinetPage v-if="mode === 'partner'" @back="backFromPartner" />
</template>

<style scoped>
.routeFab {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 20;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(20, 20, 30, 0.55);
  backdrop-filter: blur(14px);
  color: rgba(255, 255, 255, 0.98);
  cursor: pointer;
  box-shadow: 0 22px 70px rgba(0, 0, 0, 0.35);
  transition: transform 160ms ease, border-color 160ms ease, background-color 160ms ease;
}

@media (max-width: 980px) {
  .routeFab {
    right: 12px;
    bottom: 12px;
    padding: 10px 12px;
    gap: 8px;
  }
  
  .routeFab__icon {
    font-size: 14px;
  }
  
  .routeFab__label {
    font-size: 13px;
  }
}

@media (max-width: 640px) {
  .routeFab {
    right: 8px;
    bottom: 8px;
    padding: 8px 10px;
    gap: 6px;
  }
  
  .routeFab__icon {
    font-size: 12px;
  }
  
  .routeFab__label {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .routeFab {
    right: 6px;
    bottom: 6px;
    padding: 6px 8px;
    gap: 4px;
  }
  
  .routeFab__icon {
    font-size: 10px;
  }
  
  .routeFab__label {
    font-size: 10px;
  }
}

.routeFab:hover {
  transform: translateY(-2px);
  border-color: rgba(0, 194, 255, 0.65);
  background: rgba(20, 20, 30, 0.7);
}

.routeFab__icon {
  font-size: 16px;
}

.routeFab__label {
  font-weight: 800;
  letter-spacing: 0.2px;
}

.routeDrawerOverlay {
  position: fixed;
  inset: 0;
  z-index: 30;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

@media (max-width: 640px) {
  .routeDrawerOverlay {
    align-items: flex-end;
  }
}

.routeDrawer {
  width: min(720px, 100%);
  max-height: 78vh;
  border-radius: 22px 22px 0 0;
  background: rgba(25, 25, 35, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(18px) saturate(140%);
  box-shadow: 0 -30px 120px rgba(0, 0, 0, 0.55);
  overflow: hidden;
}

@media (max-width: 640px) {
  .routeDrawer {
    width: 100%;
    max-height: 85vh;
    border-radius: 16px 16px 0 0;
  }
}

.routeDrawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}

.routeDrawer__title {
  color: rgba(255, 255, 255, 0.98);
  font-weight: 900;
  letter-spacing: 0.2px;
}

.routeDrawer__close {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 8px 10px;
  cursor: pointer;
}

.routeDrawer__list {
  padding: 10px 12px 0;
  overflow: auto;
  max-height: 58vh;
}

.routeDrawerItem {
  display: flex;
  gap: 12px;
  padding: 10px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  margin-bottom: 10px;
}

.routeDrawerItem__img {
  width: 92px;
  height: 62px;
  object-fit: cover;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.routeDrawerItem__body {
  flex: 1;
  min-width: 0;
  color: rgba(255, 255, 255, 0.98);
}

.routeDrawerItem__top {
  display: flex;
  gap: 10px;
  justify-content: space-between;
  align-items: baseline;
}

.routeDrawerItem__title {
  font-weight: 900;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.routeDrawerItem__cost {
  font-weight: 900;
}

.routeDrawerItem__loc {
  opacity: 0.9;
  font-size: 13px;
  margin-top: 3px;
}

.routeDrawerItem__actions {
  margin-top: 8px;
}

.routeDrawerItem__btn {
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 8px 10px;
  cursor: pointer;
}

.routeDrawer__footer {
  padding: 12px 16px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.routeDrawer__footerRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.routeDrawer__planBtn {
  border-radius: 14px;
  border: 1px solid rgba(0, 194, 255, 0.5);
  background: rgba(0, 194, 255, 0.12);
  color: rgba(255, 255, 255, 0.98);
  padding: 10px 12px;
  font-weight: 1000;
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease, background-color 160ms ease;
  white-space: nowrap;
}

.routeDrawer__planBtn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.routeDrawer__planBtn:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: rgba(0, 194, 255, 0.75);
  background: rgba(0, 194, 255, 0.18);
}

.routeDrawer__hint {
  opacity: 0.85;
  color: rgba(255, 255, 255, 0.95);
  font-size: 13px;
}

@media (max-width: 720px) {
  .routeDrawer__footerRow {
    flex-direction: column;
    align-items: stretch;
  }

  .routeDrawer__planBtn {
    width: 100%;
  }
}

.routeDrawer-enter-active,
.routeDrawer-leave-active {
  transition: opacity 180ms ease;
}

.routeDrawer-enter-from,
.routeDrawer-leave-to {
  opacity: 0;
}
</style>

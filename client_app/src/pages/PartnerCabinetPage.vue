<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  createPartnerPlace,
  deletePartnerPlace,
  fetchPartnerPlaceDetail,
  fetchPartnerPlaces,
  updatePartnerPlace,
  loginPartner,
  registerPartner,
  getPartnerMe,
  getToken,
  setToken,
  clearToken,
  fetchPartnerClusters,
  createPartnerCluster,
  type PartnerPlaceDetail,
  type PartnerPlace,
  type PartnerPlaceUpdate,
  type PartnerProfile,
  type PartnerCluster,
  type ClusterCreate,
} from '../api/partner'

const emit = defineEmits<{
  (e: 'back'): void
}>()

// Auth state
type AuthMode = 'login' | 'register'
const authMode = ref<AuthMode>('login')
const authLogin = ref('')
const authEmail = ref('')
const authFullName = ref('')
const authPassword = ref('')
const authError = ref('')
const authLoading = ref(false)
const currentPartner = ref<PartnerProfile | null>(null)
const partnerClusters = ref<PartnerCluster[]>([])
const clustersLoading = ref(false)
const clustersError = ref('')
const showCreateClusterForm = ref(false)
const createClusterError = ref('')
const creatingCluster = ref(false)
const newClusterTitle = ref('')
const newClusterMeta = ref('')
const newClusterDescription = ref('')

// Cabinet state
const places = ref<PartnerPlace[]>([])
const selectedPlace = ref<PartnerPlaceDetail | null>(null)
const selectedPlaceLoading = ref(false)
const loading = ref(true)
const error = ref('')
const createError = ref('')
const creating = ref(false)
const deleting = ref(false)
const saving = ref(false)
const showCreateForm = ref(false)
const showEditForm = ref(false)
const editError = ref('')

const editName = ref('')
const editClusterId = ref('')
const editType = ref('')
const editLocation = ref('')
const editFact = ref('')
const editDescription = ref('')
const editPrice = ref<number | ''>('')
const editImageUrl = ref('')

const formName = ref('')
const formClusterId = ref('')
const formType = ref('')
const formLocation = ref('')
const formFact = ref('')
const formDescription = ref('')
const formPrice = ref<number | ''>('')
const formImageUrl = ref('')

// Auth functions
async function tryRestoreSession(): Promise<void> {
  if (!getToken()) return
  try {
    currentPartner.value = await getPartnerMe()
  } catch {
    clearToken()
    currentPartner.value = null
  }
}

async function submitAuth(): Promise<void> {
  authError.value = ''
  authLoading.value = true
  try {
    let resp
    if (authMode.value === 'login') {
      resp = await loginPartner(authLogin.value.trim(), authPassword.value)
    } else {
      if (!authEmail.value.trim()) {
        authError.value = 'Введите email'
        return
      }
      resp = await registerPartner(
        authLogin.value.trim(),
        authEmail.value.trim(),
        authPassword.value,
        authFullName.value.trim() || undefined,
      )
    }
    setToken(resp.access_token)
    currentPartner.value = { id: resp.partner_id, username: resp.username, email: '', full_name: resp.full_name }
    authLogin.value = ''
    authEmail.value = ''
    authPassword.value = ''
    authFullName.value = ''
    await loadData()
    await loadPartnerClusters()
  } catch (e) {
    authError.value = (e as Error)?.message ?? 'Ошибка авторизации'
  } finally {
    authLoading.value = false
  }
}

function logout(): void {
  clearToken()
  currentPartner.value = null
  places.value = []
  selectedPlace.value = null
  showCreateForm.value = false
  showEditForm.value = false
}

// Data functions
const PLACEHOLDER_PHOTO =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="112" viewBox="0 0 160 112">' +
      '<rect width="160" height="112" fill="#18181b"/>' +
      '<text x="80" y="58" text-anchor="middle" fill="#52525b" font-family="system-ui,sans-serif" font-size="11">Фото</text>' +
      '</svg>',
  )

const usePhotoFallback = ref<Record<number, boolean>>({})

function placePhotoSrc(p: PartnerPlace): string {
  if (usePhotoFallback.value[p.place_id] || !p.photo?.trim()) return PLACEHOLDER_PHOTO
  return p.photo
}

function onPlacePhotoError(placeId: number): void {
  usePhotoFallback.value = { ...usePhotoFallback.value, [placeId]: true }
}

function openEditForm(): void {
  if (!selectedPlace.value) return
  const p = selectedPlace.value
  editName.value = p.name
  editClusterId.value = p.cluster_id ?? ''
  editType.value = p.place_type ?? ''
  editLocation.value = p.location ?? ''
  editFact.value = p.interesting_fact ?? ''
  editDescription.value = p.description ?? ''
  editPrice.value = p.price ?? ''
  editImageUrl.value = p.images[0] ?? ''
  editError.value = ''
  showEditForm.value = true
}

function closeEditForm(): void {
  showEditForm.value = false
  editError.value = ''
}

async function savePlace(): Promise<void> {
  if (!selectedPlace.value) return
  if (!editName.value.trim()) {
    editError.value = 'Введите название места'
    return
  }

  saving.value = true
  editError.value = ''
  const payload: PartnerPlaceUpdate = {
    cluster_id: editClusterId.value.trim() || null,
    name: editName.value.trim(),
    place_type: editType.value.trim() || null,
    location: editLocation.value.trim() || null,
    interesting_fact: editFact.value.trim() || null,
    description: editDescription.value.trim() || null,
    price: editPrice.value === '' ? null : Number(editPrice.value),
    images: editImageUrl.value.trim() ? [editImageUrl.value.trim()] : [],
  }

  try {
    selectedPlace.value = await updatePartnerPlace(selectedPlace.value.place_id, payload)
    showEditForm.value = false
    await loadData()
  } catch (e) {
    editError.value = (e as Error)?.message ?? 'Не удалось сохранить изменения'
  } finally {
    saving.value = false
  }
}

function resetCreateForm(): void {
  formName.value = ''
  formClusterId.value = ''
  formType.value = ''
  formLocation.value = ''
  formFact.value = ''
  formDescription.value = ''
  formPrice.value = ''
  formImageUrl.value = ''
  createError.value = ''
}

async function loadData(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    places.value = await fetchPartnerPlaces()
  } catch (e) {
    error.value = (e as Error)?.message ?? 'Ошибка загрузки'
  } finally {
    loading.value = false
  }
}

function getPlacesForCluster(clusterId: string): PartnerPlace[] {
  return places.value.filter(place => place.cluster_id === clusterId)
}

function getPlacesWord(count: number): string {
  if (count === 1) return 'место'
  if (count >= 2 && count <= 4) return 'места'
  return 'мест'
}

async function loadPartnerClusters(): Promise<void> {
  clustersError.value = ''
  clustersLoading.value = true
  try {
    const clusters = await fetchPartnerClusters()
    partnerClusters.value = clusters
  } catch (e) {
    clustersError.value = (e as Error)?.message ?? 'Не удалось загрузить кластеры'
    partnerClusters.value = []
  } finally {
    clustersLoading.value = false
  }
}

function openCreateClusterForm(): void {
  showCreateClusterForm.value = true
  resetCreateClusterForm()
}

function closeCreateClusterForm(): void {
  showCreateClusterForm.value = false
  resetCreateClusterForm()
}

function resetCreateClusterForm(): void {
  newClusterTitle.value = ''
  newClusterMeta.value = ''
  newClusterDescription.value = ''
  createClusterError.value = ''
}

async function createCluster(): Promise<void> {
  if (!newClusterTitle.value.trim()) {
    createClusterError.value = 'Введите название кластера'
    return
  }

  creatingCluster.value = true
  createClusterError.value = ''
  const payload: ClusterCreate = {
    title: newClusterTitle.value.trim(),
    meta: newClusterMeta.value.trim() || null,
    description: newClusterDescription.value.trim() || null,
  }

  try {
    const newCluster = await createPartnerCluster(payload)
    partnerClusters.value.push(newCluster)
    closeCreateClusterForm()
  } catch (e) {
    createClusterError.value = (e as Error)?.message ?? 'Не удалось создать кластер'
  } finally {
    creatingCluster.value = false
  }
}

async function openPlace(placeId: number): Promise<void> {
  selectedPlaceLoading.value = true
  error.value = ''
  try {
    selectedPlace.value = await fetchPartnerPlaceDetail(placeId)
  } catch (e) {
    error.value = (e as Error)?.message ?? 'Не удалось открыть место'
  } finally {
    selectedPlaceLoading.value = false
  }
}

function closePlace(): void {
  selectedPlace.value = null
  showEditForm.value = false
  editError.value = ''
}

async function deletePlace(placeId: number, placeName: string): Promise<void> {
  if (!confirm(`Удалить место «${placeName}»? Это действие необратимо.`)) return

  deleting.value = true
  error.value = ''
  try {
    await deletePartnerPlace(placeId)
    selectedPlace.value = null
    await loadData()
  } catch (e) {
    error.value = (e as Error)?.message ?? 'Не удалось удалить место'
  } finally {
    deleting.value = false
  }
}

function openCreateForm(): void {
  showCreateForm.value = true
  resetCreateForm()
}

function closeCreateForm(): void {
  showCreateForm.value = false
  resetCreateForm()
}

type PartnerPlaceCreate = {
  business_id: number
  cluster_id: string | null
  name: string
  place_type: string | null
  location: string | null
  interesting_fact: string | null
  description: string | null
  price: number | null
  images: string[]
}

async function createPlace(): Promise<void> {
  if (!formName.value.trim()) {
    createError.value = 'Введите название места'
    return
  }
  if (!formClusterId.value.trim()) {
    createError.value = 'Выберите кластер'
    return
  }

  creating.value = true
  createError.value = ''
  
  const payload: PartnerPlaceCreate = {
    business_id: currentPartner.value?.id ?? 0,
    cluster_id: formClusterId.value.trim() || null,
    name: formName.value.trim(),
    place_type: formType.value.trim() || null,
    location: formLocation.value.trim() || null,
    interesting_fact: formFact.value.trim() || null,
    description: formDescription.value.trim() || null,
    price: formPrice.value === '' ? null : Number(formPrice.value),
    images: formImageUrl.value.trim() ? [formImageUrl.value.trim()] : [],
  }

  try {
    await createPartnerPlace(payload)
    closeCreateForm()
    await loadData()
  } catch (e) {
    createError.value = (e as Error)?.message ?? 'Не удалось создать место'
  } finally {
    creating.value = false
  }
}

onMounted(async () => {
  await tryRestoreSession()
  if (currentPartner.value) {
    await loadData()
    await loadPartnerClusters()
  } else {
    loading.value = false
  }
})
</script>

<template>
  <main class="partner-page">
    <!-- Header -->
    <header class="page-header">
      <button type="button" class="back-btn" @click="emit('back')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        На главную
      </button>
      <div class="page-header__center">
        <h1 class="page-header__title">Кабинет партнёра</h1>
        <span v-if="currentPartner" class="page-header__subtitle">
          {{ currentPartner.full_name || currentPartner.username }}
        </span>
      </div>
      <div v-if="currentPartner" class="page-header__actions">
        <button type="button" class="header-btn" @click="openCreateClusterForm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Кластер
        </button>
        <button type="button" class="header-btn" @click="openCreateForm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Место
        </button>
        <button type="button" class="logout-btn" @click="logout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
        </button>
      </div>
    </header>

    <div class="page-content">
      <!-- Auth Screen -->
      <template v-if="!currentPartner">
        <div class="auth-container">
          <div class="auth-card">
            <div class="auth-tabs">
              <button
                type="button"
                class="auth-tab"
                :class="{ 'auth-tab--active': authMode === 'login' }"
                @click="authMode = 'login'; authError = ''"
              >
                Вход
              </button>
              <button
                type="button"
                class="auth-tab"
                :class="{ 'auth-tab--active': authMode === 'register' }"
                @click="authMode = 'register'; authError = ''"
              >
                Регистрация
              </button>
            </div>

            <div v-if="authError" class="auth-error">{{ authError }}</div>

            <div class="auth-form">
              <input
                v-model="authLogin"
                type="text"
                class="auth-input"
                :placeholder="authMode === 'login' ? 'Логин или email' : 'Логин (username)'"
                autocomplete="username"
              />
              <template v-if="authMode === 'register'">
                <input
                  v-model="authEmail"
                  type="email"
                  class="auth-input"
                  placeholder="Email"
                  autocomplete="email"
                />
                <input
                  v-model="authFullName"
                  type="text"
                  class="auth-input"
                  placeholder="Имя / Название компании"
                  autocomplete="name"
                />
              </template>
              <input
                v-model="authPassword"
                type="password"
                class="auth-input"
                placeholder="Пароль"
                autocomplete="current-password"
                @keydown.enter="submitAuth"
              />
              <button
                type="button"
                class="auth-submit"
                :disabled="authLoading || !authLogin.trim() || !authPassword"
                @click="submitAuth"
              >
                {{ authLoading ? 'Загрузка...' : (authMode === 'login' ? 'Войти' : 'Создать аккаунт') }}
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Dashboard -->
      <template v-else>
        <div v-if="loading" class="loading-state">Загрузка...</div>
        <div v-else-if="error" class="error-state">{{ error }}</div>

        <template v-else>
          <!-- Place Detail -->
          <section v-if="selectedPlace" class="detail-section">
            <div class="detail-nav">
              <button type="button" class="back-btn" @click="closePlace">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                К списку
              </button>
              <div class="detail-actions">
                <button
                  type="button"
                  class="action-btn"
                  :disabled="deleting"
                  @click="showEditForm ? closeEditForm() : openEditForm()"
                >
                  {{ showEditForm ? 'Отмена' : 'Редактировать' }}
                </button>
                <button
                  type="button"
                  class="action-btn action-btn--danger"
                  :disabled="deleting"
                  @click="deletePlace(selectedPlace.place_id, selectedPlace.name)"
                >
                  {{ deleting ? 'Удаление...' : 'Удалить' }}
                </button>
              </div>
            </div>

            <!-- Edit Form -->
            <div v-if="showEditForm" class="form-card">
              <h3 class="form-title">Редактирование места</h3>
              <div v-if="editError" class="form-error">{{ editError }}</div>
              
              <div class="form-grid">
                <input v-model="editName" class="form-input" type="text" placeholder="Название" />
                <select v-model="editClusterId" class="form-input">
                  <option value="" disabled>Выберите кластер</option>
                  <option v-for="c in partnerClusters" :key="c.id" :value="c.id">
                    {{ c.title }}
                  </option>
                </select>
                <input v-model="editType" class="form-input" type="text" placeholder="Тип места" />
                <input v-model="editLocation" class="form-input" type="text" placeholder="Локация" />
                <input v-model="editFact" class="form-input" type="text" placeholder="Интересный факт" />
                <input v-model="editPrice" class="form-input" type="number" min="0" placeholder="Цена, ₽" />
                <textarea v-model="editDescription" class="form-input form-input--textarea" placeholder="Описание"></textarea>
                <input v-model="editImageUrl" class="form-input" type="url" placeholder="Ссылка на фото" />
              </div>

              <div class="form-actions">
                <button type="button" class="submit-btn" :disabled="saving" @click="savePlace">
                  {{ saving ? 'Сохранение...' : 'Сохранить' }}
                </button>
                <button type="button" class="cancel-btn" @click="closeEditForm">Отмена</button>
              </div>
            </div>

            <!-- Place Card -->
            <div class="place-detail-card">
              <img
                :src="selectedPlace.images[0] || PLACEHOLDER_PHOTO"
                :alt="selectedPlace.name"
                class="place-detail__image"
                referrerpolicy="no-referrer"
              />
              <div class="place-detail__body">
                <h2 class="place-detail__title">{{ selectedPlace.name }}</h2>
                <p class="place-detail__meta">
                  {{ selectedPlace.location ?? selectedPlace.place_type ?? '-' }}
                </p>
                <p v-if="selectedPlace.price != null" class="place-detail__price">
                  {{ selectedPlace.price.toLocaleString('ru-RU') }} ₽
                </p>
                <p v-if="selectedPlace.description" class="place-detail__desc">
                  {{ selectedPlace.description }}
                </p>
                <p v-if="selectedPlace.interesting_fact" class="place-detail__fact">
                  {{ selectedPlace.interesting_fact }}
                </p>
              </div>
            </div>
          </section>

          <!-- Clusters List -->
          <section v-else class="clusters-section">
            <div v-if="selectedPlaceLoading" class="loading-state">Загрузка места...</div>

            <!-- Create Cluster Form -->
            <div v-if="showCreateClusterForm" class="form-card">
              <h3 class="form-title">Новый кластер</h3>
              <div v-if="createClusterError" class="form-error">{{ createClusterError }}</div>
              
              <div class="form-grid">
                <input v-model="newClusterTitle" class="form-input" type="text" placeholder="Название кластера" />
                <input v-model="newClusterMeta" class="form-input" type="text" placeholder="Мета-описание" />
                <textarea v-model="newClusterDescription" class="form-input form-input--textarea" placeholder="Описание кластера"></textarea>
              </div>

              <div class="form-actions">
                <button type="button" class="submit-btn" :disabled="creatingCluster" @click="createCluster">
                  {{ creatingCluster ? 'Создание...' : 'Создать' }}
                </button>
                <button type="button" class="cancel-btn" @click="closeCreateClusterForm">Отмена</button>
              </div>
            </div>

            <!-- Create Place Form -->
            <div v-if="showCreateForm" class="form-card">
              <h3 class="form-title">Новое место</h3>
              <div v-if="createError" class="form-error">{{ createError }}</div>
              
              <div class="form-grid">
                <input v-model="formName" class="form-input" type="text" placeholder="Название" />
                <select v-model="formClusterId" class="form-input">
                  <option value="" disabled>Выберите кластер</option>
                  <option v-for="c in partnerClusters" :key="c.id" :value="c.id">
                    {{ c.title }}
                  </option>
                </select>
                <input v-model="formType" class="form-input" type="text" placeholder="Тип места" />
                <input v-model="formLocation" class="form-input" type="text" placeholder="Локация" />
                <input v-model="formFact" class="form-input" type="text" placeholder="Интересный факт" />
                <input v-model="formPrice" class="form-input" type="number" min="0" placeholder="Цена, ₽" />
                <textarea v-model="formDescription" class="form-input form-input--textarea" placeholder="Описание"></textarea>
                <input v-model="formImageUrl" class="form-input" type="url" placeholder="Ссылка на фото" />
              </div>

              <div class="form-actions">
                <button type="button" class="submit-btn" :disabled="creating" @click="createPlace">
                  {{ creating ? 'Создание...' : 'Создать' }}
                </button>
                <button type="button" class="cancel-btn" @click="closeCreateForm">Отмена</button>
              </div>
            </div>

            <!-- Clusters Grid -->
            <div v-if="!showCreateClusterForm && !showCreateForm" class="clusters-grid">
              <h2 class="section-title">Ваши кластеры</h2>

              <div v-if="clustersLoading" class="loading-state">Загрузка кластеров...</div>
              <div v-else-if="clustersError" class="error-state">{{ clustersError }}</div>
              <div v-else-if="partnerClusters.length === 0" class="empty-state">
                <p>У вас пока нет кластеров.</p>
                <p>Создайте первый кластер, чтобы добавлять места.</p>
              </div>

              <div v-else class="clusters-list">
                <article v-for="cluster in partnerClusters" :key="cluster.id" class="cluster-card">
                  <div class="cluster-header">
                    <h3 class="cluster-title">{{ cluster.title }}</h3>
                    <span class="cluster-status">{{ cluster.status }}</span>
                  </div>
                  <p v-if="cluster.meta" class="cluster-meta">{{ cluster.meta }}</p>

                  <div class="cluster-places">
                    <div class="cluster-places__header">
                      <span>Места в кластере</span>
                      <span class="cluster-places__count">
                        {{ getPlacesForCluster(cluster.id).length }} {{ getPlacesWord(getPlacesForCluster(cluster.id).length) }}
                      </span>
                    </div>

                    <div v-if="getPlacesForCluster(cluster.id).length === 0" class="empty-cluster">
                      В этом кластере пока нет мест
                    </div>

                    <div v-else class="places-list">
                      <div
                        v-for="place in getPlacesForCluster(cluster.id)"
                        :key="place.place_id"
                        class="place-item"
                        @click="openPlace(place.place_id)"
                      >
                        <img
                          :src="placePhotoSrc(place)"
                          :alt="place.name"
                          class="place-item__image"
                          referrerpolicy="no-referrer"
                          loading="lazy"
                          @error="onPlacePhotoError(place.place_id)"
                        />
                        <div class="place-item__info">
                          <span class="place-item__name">{{ place.name }}</span>
                          <span class="place-item__meta">{{ place.location ?? place.place_type ?? '-' }}</span>
                          <span v-if="place.price != null" class="place-item__price">{{ place.price }} ₽</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </section>
        </template>
      </template>
    </div>
  </main>
</template>

<style scoped>
.partner-page {
  min-height: 100vh;
  background: var(--bg-primary);
}

/* Header */
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

.page-header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.header-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.header-btn:hover {
  background: var(--bg-elevated);
  border-color: var(--accent-border);
}

.logout-btn {
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

.logout-btn:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

/* Content */
.page-content {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--space-6);
}

/* Auth */
.auth-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  padding: var(--space-6);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
}

.auth-tabs {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
}

.auth-tab {
  flex: 1;
  padding: var(--space-3);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.auth-tab--active {
  color: var(--text-primary);
  background: var(--accent-muted);
  border-color: var(--accent-border);
}

.auth-error {
  padding: var(--space-3);
  margin-bottom: var(--space-4);
  font-size: 13px;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-md);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.auth-input {
  padding: var(--space-3) var(--space-4);
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  outline: none;
  transition: all var(--transition-fast);
}

.auth-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-muted);
}

.auth-input::placeholder {
  color: var(--text-tertiary);
}

.auth-submit {
  padding: var(--space-3) var(--space-4);
  font-size: 14px;
  font-weight: 600;
  color: #000;
  background: var(--accent);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.auth-submit:hover:not(:disabled) {
  background: var(--accent-light);
}

.auth-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* States */
.loading-state,
.error-state,
.empty-state {
  padding: var(--space-10);
  text-align: center;
  color: var(--text-secondary);
}

.error-state {
  color: #ef4444;
}

.empty-state p {
  margin-bottom: var(--space-2);
}

/* Detail Section */
.detail-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.detail-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.detail-actions {
  display: flex;
  gap: var(--space-2);
}

.action-btn {
  padding: var(--space-2) var(--space-4);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover:not(:disabled) {
  background: var(--bg-elevated);
}

.action-btn--danger {
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);
}

.action-btn--danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.1);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Forms */
.form-card {
  padding: var(--space-5);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
}

.form-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-4);
}

.form-error {
  padding: var(--space-3);
  margin-bottom: var(--space-4);
  font-size: 13px;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-md);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

.form-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  outline: none;
  transition: all var(--transition-fast);
}

.form-input:focus {
  border-color: var(--accent);
}

.form-input::placeholder {
  color: var(--text-tertiary);
}

.form-input--textarea {
  grid-column: 1 / -1;
  min-height: 100px;
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.submit-btn {
  padding: var(--space-3) var(--space-5);
  font-size: 14px;
  font-weight: 600;
  color: #000;
  background: var(--accent);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.submit-btn:hover:not(:disabled) {
  background: var(--accent-light);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  padding: var(--space-3) var(--space-5);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.cancel-btn:hover {
  color: var(--text-primary);
  background: var(--bg-elevated);
}

/* Place Detail Card */
.place-detail-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.place-detail__image {
  width: 100%;
  height: 300px;
  object-fit: cover;
}

.place-detail__body {
  padding: var(--space-5);
}

.place-detail__title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.place-detail__meta {
  font-size: 14px;
  color: var(--text-tertiary);
  margin-bottom: var(--space-3);
}

.place-detail__price {
  font-size: 20px;
  font-weight: 600;
  color: var(--accent-light);
  margin-bottom: var(--space-4);
}

.place-detail__desc {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin-bottom: var(--space-3);
}

.place-detail__fact {
  font-size: 13px;
  color: var(--text-tertiary);
  padding: var(--space-3);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

/* Clusters */
.clusters-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-4);
}

.clusters-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.cluster-card {
  padding: var(--space-5);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
}

.cluster-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.cluster-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.cluster-status {
  font-size: 11px;
  font-weight: 500;
  color: var(--accent);
  text-transform: uppercase;
  padding: var(--space-1) var(--space-2);
  background: var(--accent-muted);
  border-radius: var(--radius-sm);
}

.cluster-meta {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: var(--space-4);
}

.cluster-places {
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-subtle);
}

.cluster-places__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
  font-size: 13px;
  color: var(--text-tertiary);
}

.cluster-places__count {
  padding: var(--space-1) var(--space-2);
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
}

.empty-cluster {
  padding: var(--space-4);
  text-align: center;
  font-size: 13px;
  color: var(--text-tertiary);
  background: var(--bg-tertiary);
  border: 1px dashed var(--border-default);
  border-radius: var(--radius-md);
}

.places-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.place-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.place-item:hover {
  border-color: var(--accent-border);
  transform: translateX(4px);
}

.place-item__image {
  width: 64px;
  height: 48px;
  object-fit: cover;
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.place-item__info {
  flex: 1;
  min-width: 0;
}

.place-item__name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.place-item__meta {
  display: block;
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

.place-item__price {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--accent);
  margin-top: var(--space-1);
}

/* Responsive */
@media (max-width: 640px) {
  .page-header {
    flex-wrap: wrap;
    gap: var(--space-3);
  }
  
  .page-header__actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .page-content {
    padding: var(--space-4);
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .detail-nav {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

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

// ---------- Авторизация ----------
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

// ---------- Кабинет ----------
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

// ---------- Авторизация: функции ----------

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

// ---------- Данные ----------

/** Unsplash и др. часто режут картинки при Referer с localhost — без referrer грузится стабильнее */
const PLACEHOLDER_PHOTO =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="112" viewBox="0 0 160 112">' +
      '<rect width="160" height="112" fill="#2a2d3a"/>' +
      '<text x="80" y="58" text-anchor="middle" fill="#8b90a0" font-family="system-ui,sans-serif" font-size="11">Фото</text>' +
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
    console.log('Загруженные места:', places.value)
    console.log('Количество мест:', places.value.length)
    if (places.value.length > 0) {
      const firstPlace = places.value[0]
      const lastPlace = places.value[places.value.length - 1]
      console.log('Первое место (детально):', firstPlace)
      console.log('Последнее место (детально):', lastPlace)
      console.log('Последнее место (JSON):', JSON.stringify(lastPlace, null, 2))
      console.log('Поля последнего места:', {
        place_type: lastPlace.place_type,
        cluster_id: lastPlace.cluster_id,
        name: lastPlace.name,
        id: lastPlace.place_id
      })
      
      // Проверяем детальную информацию о последнем месте
      fetchPartnerPlaceDetail(lastPlace.place_id).then(detail => {
        console.log('Детальная информация о последнем месте:', detail)
        console.log('Детальные поля:', {
          cluster_id: detail.cluster_id,
          place_type: detail.place_type,
          name: detail.name
        })
      }).catch(err => {
        console.log('Ошибка при загрузке детальной информации:', err)
      })
    }
    console.log('Доступные кластеры:', partnerClusters.value)
    if (partnerClusters.value.length > 0) {
      const firstCluster = partnerClusters.value[0]
      console.log('Первый кластер (детально):', firstCluster)
      console.log('Первый кластер (JSON):', JSON.stringify(firstCluster, null, 2))
      console.log('ID первого кластера:', firstCluster.id)
    }
  } catch (e) {
    error.value = (e as Error)?.message ?? 'Ошибка загрузки'
  } finally {
    loading.value = false
  }
}

function getPlacesForCluster(clusterId: string): PartnerPlace[] {
  const filtered = places.value.filter(place => {
    // Сначала проверяем cluster_id (если есть)
    if (place.cluster_id === clusterId) {
      console.log(`Место "${place.name}" привязано к кластеру "${clusterId}" по cluster_id`)
      return true
    }
    
    // Если нет cluster_id, проверяем place_type (временное решение)
    if (place.place_type === clusterId) {
      console.log(`Место "${place.name}" привязано к кластеру "${clusterId}" по place_type`)
      return true
    }
    
    return false
  })
  console.log(`Кластер "${clusterId}": найдено ${filtered.length} мест`)
  return filtered
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
    console.log('Начинаю загрузку кластеров...')
    const clusters = await fetchPartnerClusters()
    console.log('Кластеры загружены:', clusters)
    partnerClusters.value = clusters
    console.log('partnerClusters.value установлено:', partnerClusters.value)
  } catch (e) {
    console.error('Ошибка при загрузке кластеров:', e)
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
  console.log('=== СОЗДАНИЕ МЕСТА ===')
  console.log('formClusterId.value:', formClusterId.value)
  console.log('formName.value:', formName.value)
  console.log('formType.value:', formType.value)
  console.log('partnerClusters.value:', partnerClusters.value)
  
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

  console.log('Создание места с payload:', JSON.stringify(payload, null, 2))
  console.log('Выбранный кластер ID:', formClusterId.value.trim())
  console.log('Доступные кластеры для выбора:', partnerClusters.value.map(c => ({ id: c.id, title: c.title })))

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
  <main class="partner" role="application" aria-label="Кабинет партнёра">
    <div class="partner__bg" aria-hidden="true" />
    <div class="partner__scrim" aria-hidden="true" />

    <!-- Экран авторизации -->
    <template v-if="!currentPartner">
      <header class="partner__header">
        <button type="button" class="partner__backBtn" @click="emit('back')">
          <span aria-hidden="true">←</span>
          <span>На главную</span>
        </button>
        <div class="partner__headerTitle">
          <div class="partner__title">Кабинет партнёра</div>
          <div class="partner__subtitle">Войдите или создайте аккаунт</div>
        </div>
      </header>

      <section class="partner__content">
        <div class="authCard">
          <div class="authCard__tabs">
            <button
              type="button"
              class="authCard__tab"
              :class="{ 'authCard__tab--active': authMode === 'login' }"
              @click="authMode = 'login'; authError = ''"
            >Войти</button>
            <button
              type="button"
              class="authCard__tab"
              :class="{ 'authCard__tab--active': authMode === 'register' }"
              @click="authMode = 'register'; authError = ''"
            >Регистрация</button>
          </div>

          <div v-if="authError" class="partner__error authCard__error">{{ authError }}</div>

          <input
            v-model="authLogin"
            class="createInput"
            type="text"
            :placeholder="authMode === 'login' ? 'Логин или email' : 'Логин (username)'"
            autocomplete="username"
          />
          <template v-if="authMode === 'register'">
            <input
              v-model="authEmail"
              class="createInput"
              type="email"
              placeholder="Email *"
              autocomplete="email"
            />
            <input
              v-model="authFullName"
              class="createInput"
              type="text"
              placeholder="Имя / Название компании"
              autocomplete="name"
            />
          </template>
          <input
            v-model="authPassword"
            class="createInput"
            type="password"
            placeholder="Пароль"
            autocomplete="current-password"
            @keydown.enter="submitAuth"
          />

          <button
            type="button"
            class="partner__newBtn authCard__submit"
            :disabled="authLoading || !authLogin.trim() || !authPassword"
            @click="submitAuth"
          >
            {{ authLoading ? 'Подождите…' : (authMode === 'login' ? 'Войти' : 'Создать аккаунт') }}
          </button>
        </div>
      </section>
    </template>

    <!-- Кабинет партнёра -->
    <template v-else>
    <header class="partner__header">
      <button type="button" class="partner__backBtn" @click="emit('back')">
        <span aria-hidden="true">←</span>
        <span>На главную</span>
      </button>
      <div class="partner__headerTitle">
        <div class="partner__title">Кабинет партнёра</div>
        <div class="partner__subtitle">{{ currentPartner.full_name || currentPartner.username }}</div>
      </div>
      <button type="button" class="partner__newBtn" @click="openCreateClusterForm">
        + Новый кластер
      </button>
      <button type="button" class="partner__newBtn" @click="openCreateForm">
        + Новое место
      </button>
      <button type="button" class="partner__backBtn" @click="logout">
        <span aria-hidden="true">↩</span>
        <span>Выйти</span>
      </button>
    </header>

    <section class="partner__content">
      <div v-if="loading" class="partner__loading">Загрузка…</div>
      <div v-else-if="error" class="partner__error partner__error--center">{{ error }}</div>

      <template v-else>
        <section v-if="selectedPlace" class="partner__section">
          <div class="partner__detailNav">
            <button type="button" class="partner__backBtn partner__backToList" @click="closePlace">
              <span aria-hidden="true">←</span>
              <span>К списку мест</span>
            </button>
            <div class="partner__detailActions">
              <button
                type="button"
                class="partner__editBtn"
                :disabled="deleting"
                @click="showEditForm ? closeEditForm() : openEditForm()"
              >
                {{ showEditForm ? '✕ Отмена' : '✏️ Редактировать' }}
              </button>
              <button
                type="button"
                class="partner__deleteBtn"
                :disabled="deleting"
                @click="deletePlace(selectedPlace.place_id, selectedPlace.name)"
              >
                {{ deleting ? 'Удаление…' : '🗑 Удалить' }}
              </button>
            </div>
          </div>

          <section v-if="showEditForm" class="partner__createSection">
            <div class="createPlaceCard">
              <div class="createPlaceCard__title">Редактирование места</div>
              <div v-if="editError" class="partner__error">{{ editError }}</div>

              <input v-model="editName" class="createInput" type="text" placeholder="Название *" />
              <select v-model="editClusterId" class="createInput">
                <option value="" disabled>Выберите кластер *</option>
                <option v-for="c in partnerClusters" :key="c.id" :value="c.id">
                  {{ c.title }}
                </option>
              </select>
              <input v-model="editType" class="createInput" type="text" placeholder="Тип места" />
              <input v-model="editLocation" class="createInput" type="text" placeholder="Локация" />
              <input v-model="editFact" class="createInput" type="text" placeholder="Интересный факт (1-10 слов)" />
              <textarea v-model="editDescription" class="createInput createInput--textarea" placeholder="Описание" />
              <input v-model="editPrice" class="createInput" type="number" min="0" step="1" placeholder="Цена, ₽" />
              <input v-model="editImageUrl" class="createInput" type="url" placeholder="Ссылка на фото (https://...)" />

              <div class="createPlaceCard__actions">
                <button type="button" class="partner__newBtn" :disabled="saving" @click="savePlace">
                  {{ saving ? 'Сохранение…' : 'Сохранить изменения' }}
                </button>
                <button type="button" class="partner__backBtn" @click="closeEditForm">Отмена</button>
              </div>
            </div>
          </section>

          <article class="placeDetailCard">
            <img
              :src="selectedPlace.images[0] || PLACEHOLDER_PHOTO"
              class="placeDetailCard__img"
              :alt="selectedPlace.name"
              referrerpolicy="no-referrer"
            />
            <div class="placeDetailCard__body">
              <div class="placeDetailCard__title">{{ selectedPlace.name }}</div>
              <div class="placeDetailCard__meta">
                {{ selectedPlace.location ?? selectedPlace.place_type ?? '—' }}
              </div>
              <div v-if="selectedPlace.price != null" class="placeDetailCard__price">
                {{ selectedPlace.price }} ₽
              </div>
              <p v-if="selectedPlace.description" class="placeDetailCard__desc">
                {{ selectedPlace.description }}
              </p>
              <div v-if="selectedPlace.interesting_fact" class="placeDetailCard__fact">
                Факт: {{ selectedPlace.interesting_fact }}
              </div>
            </div>
          </article>
        </section>

        <section v-else class="partner__section">
          <div v-if="selectedPlaceLoading" class="partner__loading">Открываем место…</div>

          <!-- Список кластеров с местами -->
          <div v-if="!showCreateClusterForm && !showCreateForm && !selectedPlace" class="partner__clusters">
            <h3 class="partner__sectionTitle">Ваши кластеры и места</h3>
            <div v-if="clustersLoading" class="partner__loading">Загрузка кластеров…</div>
            <div v-else-if="clustersError" class="partner__error">{{ clustersError }}</div>
            <div v-else-if="partnerClusters.length === 0" class="partner__empty">
              У вас пока нет кластеров. Создайте первый кластер, чтобы добавлять места.
            </div>
            <div v-else class="partner__clusterList">
              <div
                v-for="cluster in partnerClusters"
                :key="cluster.id"
                class="partner__clusterItem"
              >
                <div class="partner__clusterInfo">
                  <div class="partner__clusterTitle">{{ cluster.title }}</div>
                  <div v-if="cluster.meta" class="partner__clusterMeta">{{ cluster.meta }}</div>
                  <div class="partner__clusterStatus">Статус: {{ cluster.status }}</div>
                </div>
                
                <!-- Места в этом кластере -->
                <div class="partner__clusterPlaces">
                  <div class="partner__clusterPlacesHeader">
                    <span class="partner__clusterPlacesTitle">Места в кластере</span>
                    <span class="partner__clusterPlacesCount">
                      {{ getPlacesForCluster(cluster.id).length }} {{ getPlacesWord(getPlacesForCluster(cluster.id).length) }}
                    </span>
                  </div>
                  
                  <div v-if="getPlacesForCluster(cluster.id).length === 0" class="partner__emptyCluster">
                    В этом кластере пока нет мест
                  </div>
                  
                  <div v-else class="partner__placesInCluster">
                    <article
                      v-for="place in getPlacesForCluster(cluster.id)"
                      :key="place.place_id"
                      class="partnerPlace partnerPlace--inCluster"
                      @click="openPlace(place.place_id)"
                    >
                      <img
                        :src="placePhotoSrc(place)"
                        class="partnerPlace__img"
                        :alt="place.name"
                        referrerpolicy="no-referrer"
                        loading="lazy"
                        @error="onPlacePhotoError(place.place_id)"
                      />
                      <div class="partnerPlace__body">
                        <div class="partnerPlace__name">{{ place.name }}</div>
                        <div class="partnerPlace__meta">{{ place.location ?? place.place_type ?? '—' }}</div>
                        <div v-if="place.price != null" class="partnerPlace__price">{{ place.price }} ₽</div>
                      </div>
                    </article>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section v-if="showCreateClusterForm" class="partner__createSection">
            <div class="createPlaceCard">
              <div class="createPlaceCard__title">Новый кластер</div>
              <div v-if="createClusterError" class="partner__error">{{ createClusterError }}</div>

              <input v-model="newClusterTitle" class="createInput" type="text" placeholder="Название кластера *" />
              <input v-model="newClusterMeta" class="createInput" type="text" placeholder="Мета-описание (кратко)" />
              <textarea v-model="newClusterDescription" class="createInput createInput--textarea" placeholder="Описание кластера"></textarea>

              <div class="createPlaceCard__actions">
                <button type="button" class="partner__newBtn" :disabled="creatingCluster" @click="createCluster">
                  {{ creatingCluster ? 'Создание…' : 'Создать кластер' }}
                </button>
                <button type="button" class="partner__backBtn" @click="closeCreateClusterForm">Отмена</button>
              </div>
            </div>
          </section>

          <section v-if="showCreateForm" class="partner__createSection">
            <div class="createPlaceCard">
              <div class="createPlaceCard__title">Новое место</div>
              <div v-if="createError" class="partner__error">{{ createError }}</div>

              <input v-model="formName" class="createInput" type="text" placeholder="Название *" />
              <select v-model="formClusterId" class="createInput">
                <option value="" disabled>Выберите кластер *</option>
                <option v-for="c in partnerClusters" :key="c.id" :value="c.id">
                  {{ c.title }}
                </option>
              </select>
              <input v-model="formType" class="createInput" type="text" placeholder="Тип места" />
              <input v-model="formLocation" class="createInput" type="text" placeholder="Локация" />
              <input v-model="formFact" class="createInput" type="text" placeholder="Интересный факт (1-10 слов)" />
              <textarea v-model="formDescription" class="createInput createInput--textarea" placeholder="Описание" />
              <input v-model="formPrice" class="createInput" type="number" min="0" step="1" placeholder="Цена, ₽" />
              <input v-model="formImageUrl" class="createInput" type="url" placeholder="Ссылка на фото (https://...)" />

              <div class="createPlaceCard__actions">
                <button type="button" class="partner__newBtn" :disabled="creating" @click="createPlace">
                  {{ creating ? 'Создание…' : 'Создать место' }}
                </button>
                <button type="button" class="partner__backBtn" @click="closeCreateForm">Отмена</button>
              </div>
            </div>
          </section>
        </section>
      </template>
    </section>
    </template>
  </main>
</template>

<style scoped>
.authCard {
  margin-top: 40px;
  max-width: 440px;
  margin-left: auto;
  margin-right: auto;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 0;
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.authCard__tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.authCard__tab {
  flex: 1;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  font-weight: 600;
  transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
}

.authCard__tab--active {
  background: rgba(0, 194, 255, 0.15);
  border-color: rgba(0, 194, 255, 0.5);
  color: rgba(255, 255, 255, 0.98);
}

.authCard__error {
  padding: 8px 0 4px;
  text-align: left;
}

.authCard__submit {
  margin-top: 16px;
  width: 100%;
  padding: 12px;
  font-size: 15px;
}

.authCard__submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.partner {
  position: relative;
  min-height: 100svh;
  width: 100%;
  overflow-x: hidden;
  color: rgba(255, 255, 255, 0.98);
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
}

.partner__bg {
  position: fixed;
  inset: 0;
  background: 
    radial-gradient(circle at 20% 50%, rgba(0, 194, 255, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 20%, rgba(236, 72, 153, 0.08) 0%, transparent 50%),
    linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  z-index: 0;
}

.partner__scrim {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 1;
}

.partner__header {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  flex-wrap: wrap;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
}

.partner__backBtn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.partner__backBtn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

.partner__headerTitle {
  flex: 1;
  min-width: 0;
}

.partner__newBtn {
  border: 1px solid rgba(0, 194, 255, 0.4);
  background: linear-gradient(135deg, rgba(0, 194, 255, 0.15), rgba(0, 194, 255, 0.08));
  color: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 12px 16px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 194, 255, 0.2);
}

.partner__newBtn:hover {
  background: linear-gradient(135deg, rgba(0, 194, 255, 0.25), rgba(0, 194, 255, 0.15));
  border-color: rgba(0, 194, 255, 0.6);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 194, 255, 0.3);
}

.partner__title {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #ffffff, #e0e7ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.partner__subtitle {
  font-size: 14px;
  opacity: 0.85;
  margin-top: 2px;
}

.partner__content {
  position: relative;
  z-index: 2;
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.partner__loading {
  padding: 40px 0;
  text-align: center;
  opacity: 0.9;
}

.partner__error {
  color: rgba(255, 255, 255, 0.95);
  white-space: pre-line;
  padding: 8px 0;
  opacity: 0.95;
}

.partner__error--center {
  padding: 40px 0;
  text-align: center;
}

.partner__section {
  margin-top: 28px;
}

.partner__places {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.partnerPlace {
  display: flex;
  gap: 16px;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.partnerPlace:hover {
  border-color: rgba(0, 194, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 194, 255, 0.15);
}

.partner__detailNav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.partner__detailActions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.partner__editBtn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 14px;
  border: 1px solid rgba(0, 194, 255, 0.45);
  background: rgba(0, 194, 255, 0.12);
  color: rgba(255, 255, 255, 0.98);
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: background 160ms ease, border-color 160ms ease;
}

.partner__editBtn:hover:not(:disabled) {
  background: rgba(0, 194, 255, 0.22);
  border-color: rgba(0, 194, 255, 0.7);
}

.partner__editBtn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.partner__backToList {
  margin-bottom: 0;
}

.partner__deleteBtn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 14px;
  border: 1px solid rgba(248, 113, 113, 0.45);
  background: rgba(248, 113, 113, 0.12);
  color: rgba(255, 255, 255, 0.98);
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: background 160ms ease, border-color 160ms ease;
}

.partner__deleteBtn:hover:not(:disabled) {
  background: rgba(248, 113, 113, 0.22);
  border-color: rgba(248, 113, 113, 0.7);
}

.partner__deleteBtn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.partner__clusters {
  margin-top: 20px;
}

.partner__sectionTitle {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #ffffff, #60a5fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.3px;
}

.partner__empty {
  text-align: center;
  opacity: 0.7;
  padding: 40px 20px;
  font-style: italic;
}

.partner__clusterList {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.partner__clusterItem {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
  padding: 20px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.partner__clusterItem:hover {
  border-color: rgba(0, 194, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 194, 255, 0.15);
}

.partner__clusterInfo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.partner__clusterPlaces {
  margin-top: 16px;
}

.partner__clusterPlacesHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.partner__clusterPlacesTitle {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.partner__clusterPlacesCount {
  font-size: 12px;
  font-weight: 500;
  color: rgba(0, 194, 255, 0.8);
  background: rgba(0, 194, 255, 0.1);
  padding: 4px 8px;
  border-radius: 12px;
  border: 1px solid rgba(0, 194, 255, 0.2);
}

.partner__emptyCluster {
  text-align: center;
  padding: 20px;
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
}

.partner__placesInCluster {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.partnerPlace--inCluster {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01));
  padding: 12px;
  transition: all 0.2s ease;
  transform: translateX(0);
}

.partnerPlace--inCluster:hover {
  border-color: rgba(0, 194, 255, 0.3);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 194, 255, 0.1);
}

.partner__clusterTitle {
  font-size: 18px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 4px;
}

.partner__clusterMeta {
  font-size: 14px;
  opacity: 0.8;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 4px;
}

.partner__clusterStatus {
  font-size: 12px;
  opacity: 0.7;
  color: rgba(0, 194, 255, 0.8);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.partner__createSection {
  margin-bottom: 24px;
}

.placeDetailCard {
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.placeDetailCard__img {
  width: 100%;
  height: 260px;
  object-fit: cover;
  display: block;
}

.placeDetailCard__body {
  padding: 14px;
}

.placeDetailCard__title {
  font-size: 20px;
  font-weight: 800;
}

.placeDetailCard__meta {
  opacity: 0.85;
  margin-top: 4px;
}

.placeDetailCard__price {
  margin-top: 8px;
  color: rgba(0, 194, 255, 0.95);
  font-weight: 800;
}

.placeDetailCard__desc {
  margin-top: 10px;
  line-height: 1.45;
}

.placeDetailCard__fact {
  margin-top: 10px;
  font-size: 14px;
  opacity: 0.9;
}

.partnerPlace__img {
  width: 80px;
  height: 56px;
  object-fit: cover;
  border-radius: 10px;
}

.partnerPlace__body {
  flex: 1;
  min-width: 0;
}

.partnerPlace__name {
  font-weight: 700;
}

.partnerPlace__meta {
  font-size: 13px;
  opacity: 0.85;
  margin-top: 2px;
}

.partnerPlace__price {
  font-size: 14px;
  font-weight: 600;
  margin-top: 4px;
  color: rgba(0, 194, 255, 0.9);
}

.createPlaceCard {
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
  padding: 24px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.createPlaceCard__title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #ffffff, #a5b4fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.createInput {
  width: 100%;
  margin-top: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.95);
  padding: 14px 16px;
  box-sizing: border-box;
  font-size: 15px;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.createInput:focus {
  outline: none;
  border-color: rgba(0, 194, 255, 0.5);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(0, 194, 255, 0.1);
}

.createInput::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.createInput--textarea {
  min-height: 86px;
  resize: vertical;
}

.createPlaceCard__actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
}

</style>

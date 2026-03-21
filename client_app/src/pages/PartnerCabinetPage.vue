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
  type PartnerPlaceDetail,
  type PartnerPlace,
  type PartnerPlaceUpdate,
  type PartnerProfile,
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
const editType = ref('')
const editLocation = ref('')
const editFact = ref('')
const editDescription = ref('')
const editPrice = ref<number | ''>('')
const editImageUrl = ref('')

const formName = ref('')
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

  creating.value = true
  createError.value = ''
  const payload = {
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
  if (currentPartner.value) await loadData()
  else loading.value = false
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

          <section v-if="showCreateForm" class="partner__createSection">
            <div class="createPlaceCard">
              <div class="createPlaceCard__title">Новое место</div>
              <div v-if="createError" class="partner__error">{{ createError }}</div>

              <input v-model="formName" class="createInput" type="text" placeholder="Название *" />
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

          <div class="partner__places">
            <article
              v-for="p in places"
              :key="p.place_id"
              class="partnerPlace"
              @click="openPlace(p.place_id)"
            >
              <img
                :src="placePhotoSrc(p)"
                class="partnerPlace__img"
                :alt="p.name"
                referrerpolicy="no-referrer"
                loading="lazy"
                @error="onPlacePhotoError(p.place_id)"
              />
              <div class="partnerPlace__body">
                <div class="partnerPlace__name">{{ p.name }}</div>
                <div class="partnerPlace__meta">{{ p.location ?? p.place_type ?? '—' }}</div>
                <div v-if="p.price != null" class="partnerPlace__price">{{ p.price }} ₽</div>
              </div>
            </article>
          </div>
        </section>
      </template>
    </section>
    </template>
  </main>
</template>

<style scoped>
.authCard {
  margin-top: 40px;
  max-width: 420px;
  margin-left: auto;
  margin-right: auto;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.07);
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 0;
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
}

.partner__bg {
  position: fixed;
  inset: 0;
  background: linear-gradient(160deg, #1a1b26 0%, #252836 50%, #1e2030 100%);
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
  padding: 16px 20px;
  flex-wrap: wrap;
}

.partner__backBtn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.98);
  cursor: pointer;
  font-size: 15px;
}

.partner__backBtn:hover {
  background: rgba(255, 255, 255, 0.12);
}

.partner__headerTitle {
  flex: 1;
  min-width: 0;
}

.partner__newBtn {
  border: 1px solid rgba(0, 194, 255, 0.45);
  background: rgba(0, 194, 255, 0.15);
  color: rgba(255, 255, 255, 0.98);
  border-radius: 12px;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 700;
}

.partner__title {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.3px;
}

.partner__subtitle {
  font-size: 14px;
  opacity: 0.85;
  margin-top: 2px;
}

.partner__content {
  position: relative;
  z-index: 2;
  padding: 0 20px 32px;
  max-width: 720px;
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
  gap: 14px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  cursor: pointer;
}

.partnerPlace:hover {
  border-color: rgba(0, 194, 255, 0.45);
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
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
  padding: 14px;
}

.createPlaceCard__title {
  font-size: 18px;
  font-weight: 800;
  margin-bottom: 10px;
}

.createInput {
  width: 100%;
  margin-top: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.98);
  padding: 10px 12px;
  box-sizing: border-box;
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

@media (min-width: 2560px) {
  .partnerCabinet {
    max-width: 1400px;
    margin: 0 auto;
    padding: 32px 24px;
  }
  
  .partnerCabinet__header {
    padding: 0 0 32px;
  }
  
  .partnerCabinet__title {
    font-size: 48px;
    margin-bottom: 24px;
  }
  
  .partnerCabinet__subtitle {
    font-size: 24px;
    margin-bottom: 32px;
  }
  
  .partnerCabinet__content {
    gap: 32px;
  }
  
  .partnerCabinet__section {
    padding: 32px;
  }
  
  .partnerCabinet__sectionTitle {
    font-size: 28px;
    margin-bottom: 24px;
  }
  
  .partnerCabinet__places {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
  
  .partnerPlace {
    padding: 24px;
  }
  
  .partnerPlace__img {
    width: 80px;
    height: 56px;
    object-fit: cover;
    border-radius: 10px;
    margin-bottom: 16px;
  }
  
  .partnerPlace__name {
    font-size: 18px;
  }
  
  .partnerPlace__meta {
    font-size: 14px;
  }
  
  .partnerPlace__price {
    font-size: 15px;
  }
  
  .placeDetailCard {
    padding: 24px;
  }
  
  .placeDetailCard__title {
    font-size: 24px;
  }
  
  .placeDetailCard__desc {
    font-size: 16px;
  }
  
  .placeDetailCard__fact {
    font-size: 15px;
  }
  
  .createPlaceCard {
    padding: 24px;
  }
  
  .createPlaceCard__title {
    font-size: 20px;
  }
  
  .createInput {
    padding: 16px;
    font-size: 16px;
  }
  
  .createPlaceCard__actions {
    margin-top: 16px;
    gap: 12px;
  }
}

@media (max-width: 980px) {
  .partnerCabinet {
    padding: 20px 16px;
  }
  
  .partnerCabinet__header {
    padding: 0 0 20px;
  }
  
  .partnerCabinet__title {
    font-size: 28px;
    margin-bottom: 12px;
  }
  
  .partnerCabinet__subtitle {
    font-size: 16px;
    margin-bottom: 20px;
  }
  
  .partnerCabinet__content {
    gap: 20px;
  }
  
  .partnerCabinet__section {
    padding: 20px;
  }
  
  .partnerCabinet__sectionTitle {
    font-size: 20px;
    margin-bottom: 16px;
  }
  
  .partnerCabinet__places {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .partnerPlace {
    padding: 16px;
  }
  
  .partnerPlace__img {
    width: 100%;
    height: 120px;
    border-radius: 12px;
    margin-bottom: 12px;
  }
  
  .partnerPlace__body {
    min-width: auto;
  }
  
  .partnerPlace__name {
    font-size: 16px;
  }
  
  .partnerPlace__meta {
    font-size: 12px;
  }
  
  .partnerPlace__price {
    font-size: 13px;
  }
  
  .placeDetailCard {
    padding: 16px;
  }
  
  .placeDetailCard__title {
    font-size: 18px;
  }
  
  .placeDetailCard__desc {
    font-size: 14px;
  }
  
  .placeDetailCard__fact {
    font-size: 13px;
  }
  
  .createPlaceCard {
    padding: 16px;
  }
  
  .createPlaceCard__title {
    font-size: 16px;
  }
  
  .createInput {
    padding: 12px;
    font-size: 14px;
  }
}

@media (max-width: 640px) {
  .partnerCabinet {
    padding: 16px 12px;
  }
  
  .partnerCabinet__header {
    padding: 0 0 16px;
  }
  
  .partnerCabinet__title {
    font-size: 24px;
    margin-bottom: 10px;
  }
  
  .partnerCabinet__subtitle {
    font-size: 15px;
    margin-bottom: 16px;
  }
  
  .partnerCabinet__content {
    gap: 16px;
  }
  
  .partnerCabinet__section {
    padding: 16px;
  }
  
  .partnerCabinet__sectionTitle {
    font-size: 18px;
    margin-bottom: 12px;
  }
  
  .partnerCabinet__places {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .partnerPlace {
    padding: 12px;
  }
  
  .partnerPlace__img {
    width: 100%;
    height: 100px;
    border-radius: 10px;
    margin-bottom: 10px;
  }
  
  .partnerPlace__name {
    font-size: 15px;
  }
  
  .partnerPlace__meta {
    font-size: 11px;
  }
  
  .partnerPlace__price {
    font-size: 12px;
  }
  
  .placeDetailCard {
    padding: 12px;
  }
  
  .placeDetailCard__title {
    font-size: 16px;
  }
  
  .placeDetailCard__desc {
    font-size: 13px;
  }
  
  .placeDetailCard__fact {
    font-size: 12px;
  }
  
  .createPlaceCard {
    padding: 12px;
  }
  
  .createPlaceCard__title {
    font-size: 15px;
  }
  
  .createInput {
    padding: 10px;
    font-size: 13px;
  }
  
  .createPlaceCard__actions {
    flex-direction: column;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .partnerCabinet {
    padding: 12px 8px;
  }
  
  .partnerCabinet__title {
    font-size: 20px;
  }
  
  .partnerCabinet__subtitle {
    font-size: 14px;
  }
  
  .partnerCabinet__section {
    padding: 12px;
  }
  
  .partnerCabinet__sectionTitle {
    font-size: 16px;
  }
  
  .partnerPlace {
    padding: 10px;
  }
  
  .partnerPlace__img {
    height: 80px;
  }
  
  .partnerPlace__name {
    font-size: 14px;
  }
  
  .partnerPlace__meta {
    font-size: 10px;
  }
  
  .partnerPlace__price {
    font-size: 11px;
  }
  
  .placeDetailCard {
    padding: 10px;
  }
  
  .placeDetailCard__title {
    font-size: 15px;
  }
  
  .placeDetailCard__desc {
    font-size: 12px;
  }
  
  .placeDetailCard__fact {
    font-size: 11px;
  }
  
  .createPlaceCard {
    padding: 10px;
  }
  
  .createPlaceCard__title {
    font-size: 14px;
  }
  
  .createInput {
    padding: 8px;
    font-size: 12px;
  }
}

</style>

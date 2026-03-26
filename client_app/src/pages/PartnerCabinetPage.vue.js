/// <reference types="C:/Users/Иван Жутяев/AppData/Local/npm-cache/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/Иван Жутяев/AppData/Local/npm-cache/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { onMounted, ref } from 'vue';
import { createPartnerPlace, deletePartnerPlace, fetchPartnerPlaceDetail, fetchPartnerPlaces, updatePartnerPlace, loginPartner, registerPartner, getPartnerMe, getToken, setToken, clearToken, fetchPartnerClusters, createPartnerCluster, } from '../api/partner';
const emit = defineEmits();
const authMode = ref('login');
const authLogin = ref('');
const authEmail = ref('');
const authFullName = ref('');
const authPassword = ref('');
const authError = ref('');
const authLoading = ref(false);
const currentPartner = ref(null);
const partnerClusters = ref([]);
const clustersLoading = ref(false);
const clustersError = ref('');
const showCreateClusterForm = ref(false);
const createClusterError = ref('');
const creatingCluster = ref(false);
const newClusterTitle = ref('');
const newClusterMeta = ref('');
const newClusterDescription = ref('');
// Cabinet state
const places = ref([]);
const selectedPlace = ref(null);
const selectedPlaceLoading = ref(false);
const loading = ref(true);
const error = ref('');
const createError = ref('');
const creating = ref(false);
const deleting = ref(false);
const saving = ref(false);
const showCreateForm = ref(false);
const showEditForm = ref(false);
const editError = ref('');
const editName = ref('');
const editClusterId = ref('');
const editType = ref('');
const editLocation = ref('');
const editFact = ref('');
const editDescription = ref('');
const editPrice = ref('');
const editImageUrl = ref('');
const formName = ref('');
const formClusterId = ref('');
const formType = ref('');
const formLocation = ref('');
const formFact = ref('');
const formDescription = ref('');
const formPrice = ref('');
const formImageUrl = ref('');
// Auth functions
async function tryRestoreSession() {
    if (!getToken())
        return;
    try {
        currentPartner.value = await getPartnerMe();
    }
    catch {
        clearToken();
        currentPartner.value = null;
    }
}
async function submitAuth() {
    authError.value = '';
    authLoading.value = true;
    try {
        let resp;
        if (authMode.value === 'login') {
            resp = await loginPartner(authLogin.value.trim(), authPassword.value);
        }
        else {
            if (!authEmail.value.trim()) {
                authError.value = 'Введите email';
                return;
            }
            resp = await registerPartner(authLogin.value.trim(), authEmail.value.trim(), authPassword.value, authFullName.value.trim() || undefined);
        }
        setToken(resp.access_token);
        currentPartner.value = { id: resp.partner_id, username: resp.username, email: '', full_name: resp.full_name };
        authLogin.value = '';
        authEmail.value = '';
        authPassword.value = '';
        authFullName.value = '';
        await loadData();
        await loadPartnerClusters();
    }
    catch (e) {
        authError.value = e?.message ?? 'Ошибка авторизации';
    }
    finally {
        authLoading.value = false;
    }
}
function logout() {
    clearToken();
    currentPartner.value = null;
    places.value = [];
    selectedPlace.value = null;
    showCreateForm.value = false;
    showEditForm.value = false;
}
// Data functions
const PLACEHOLDER_PHOTO = 'data:image/svg+xml,' +
    encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="112" viewBox="0 0 160 112">' +
        '<rect width="160" height="112" fill="#18181b"/>' +
        '<text x="80" y="58" text-anchor="middle" fill="#52525b" font-family="system-ui,sans-serif" font-size="11">Фото</text>' +
        '</svg>');
const usePhotoFallback = ref({});
function placePhotoSrc(p) {
    if (usePhotoFallback.value[p.place_id] || !p.photo?.trim())
        return PLACEHOLDER_PHOTO;
    return p.photo;
}
function onPlacePhotoError(placeId) {
    usePhotoFallback.value = { ...usePhotoFallback.value, [placeId]: true };
}
function openEditForm() {
    if (!selectedPlace.value)
        return;
    const p = selectedPlace.value;
    editName.value = p.name;
    editClusterId.value = p.cluster_id ?? '';
    editType.value = p.place_type ?? '';
    editLocation.value = p.location ?? '';
    editFact.value = p.interesting_fact ?? '';
    editDescription.value = p.description ?? '';
    editPrice.value = p.price ?? '';
    editImageUrl.value = p.images[0] ?? '';
    editError.value = '';
    showEditForm.value = true;
}
function closeEditForm() {
    showEditForm.value = false;
    editError.value = '';
}
async function savePlace() {
    if (!selectedPlace.value)
        return;
    if (!editName.value.trim()) {
        editError.value = 'Введите название места';
        return;
    }
    saving.value = true;
    editError.value = '';
    const payload = {
        cluster_id: editClusterId.value.trim() || null,
        name: editName.value.trim(),
        place_type: editType.value.trim() || null,
        location: editLocation.value.trim() || null,
        interesting_fact: editFact.value.trim() || null,
        description: editDescription.value.trim() || null,
        price: editPrice.value === '' ? null : Number(editPrice.value),
        images: editImageUrl.value.trim() ? [editImageUrl.value.trim()] : [],
    };
    try {
        selectedPlace.value = await updatePartnerPlace(selectedPlace.value.place_id, payload);
        showEditForm.value = false;
        await loadData();
    }
    catch (e) {
        editError.value = e?.message ?? 'Не удалось сохранить изменения';
    }
    finally {
        saving.value = false;
    }
}
function resetCreateForm() {
    formName.value = '';
    formClusterId.value = '';
    formType.value = '';
    formLocation.value = '';
    formFact.value = '';
    formDescription.value = '';
    formPrice.value = '';
    formImageUrl.value = '';
    createError.value = '';
}
async function loadData() {
    loading.value = true;
    error.value = '';
    try {
        places.value = await fetchPartnerPlaces();
    }
    catch (e) {
        error.value = e?.message ?? 'Ошибка загрузки';
    }
    finally {
        loading.value = false;
    }
}
function getPlacesForCluster(clusterId) {
    return places.value.filter(place => place.cluster_id === clusterId);
}
function getPlacesWord(count) {
    if (count === 1)
        return 'место';
    if (count >= 2 && count <= 4)
        return 'места';
    return 'мест';
}
async function loadPartnerClusters() {
    clustersError.value = '';
    clustersLoading.value = true;
    try {
        const clusters = await fetchPartnerClusters();
        partnerClusters.value = clusters;
    }
    catch (e) {
        clustersError.value = e?.message ?? 'Не удалось загрузить кластеры';
        partnerClusters.value = [];
    }
    finally {
        clustersLoading.value = false;
    }
}
function openCreateClusterForm() {
    showCreateClusterForm.value = true;
    resetCreateClusterForm();
}
function closeCreateClusterForm() {
    showCreateClusterForm.value = false;
    resetCreateClusterForm();
}
function resetCreateClusterForm() {
    newClusterTitle.value = '';
    newClusterMeta.value = '';
    newClusterDescription.value = '';
    createClusterError.value = '';
}
async function createCluster() {
    if (!newClusterTitle.value.trim()) {
        createClusterError.value = 'Введите название кластера';
        return;
    }
    creatingCluster.value = true;
    createClusterError.value = '';
    const payload = {
        title: newClusterTitle.value.trim(),
        meta: newClusterMeta.value.trim() || null,
        description: newClusterDescription.value.trim() || null,
    };
    try {
        const newCluster = await createPartnerCluster(payload);
        partnerClusters.value.push(newCluster);
        closeCreateClusterForm();
    }
    catch (e) {
        createClusterError.value = e?.message ?? 'Не удалось создать кластер';
    }
    finally {
        creatingCluster.value = false;
    }
}
async function openPlace(placeId) {
    selectedPlaceLoading.value = true;
    error.value = '';
    try {
        selectedPlace.value = await fetchPartnerPlaceDetail(placeId);
    }
    catch (e) {
        error.value = e?.message ?? 'Не удалось открыть место';
    }
    finally {
        selectedPlaceLoading.value = false;
    }
}
function closePlace() {
    selectedPlace.value = null;
    showEditForm.value = false;
    editError.value = '';
}
async function deletePlace(placeId, placeName) {
    if (!confirm(`Удалить место «${placeName}»? Это действие необратимо.`))
        return;
    deleting.value = true;
    error.value = '';
    try {
        await deletePartnerPlace(placeId);
        selectedPlace.value = null;
        await loadData();
    }
    catch (e) {
        error.value = e?.message ?? 'Не удалось удалить место';
    }
    finally {
        deleting.value = false;
    }
}
function openCreateForm() {
    showCreateForm.value = true;
    resetCreateForm();
}
function closeCreateForm() {
    showCreateForm.value = false;
    resetCreateForm();
}
async function createPlace() {
    if (!formName.value.trim()) {
        createError.value = 'Введите название места';
        return;
    }
    if (!formClusterId.value.trim()) {
        createError.value = 'Выберите кластер';
        return;
    }
    creating.value = true;
    createError.value = '';
    const payload = {
        business_id: currentPartner.value?.id ?? 0,
        cluster_id: formClusterId.value.trim() || null,
        name: formName.value.trim(),
        place_type: formType.value.trim() || null,
        location: formLocation.value.trim() || null,
        interesting_fact: formFact.value.trim() || null,
        description: formDescription.value.trim() || null,
        price: formPrice.value === '' ? null : Number(formPrice.value),
        images: formImageUrl.value.trim() ? [formImageUrl.value.trim()] : [],
    };
    try {
        await createPartnerPlace(payload);
        closeCreateForm();
        await loadData();
    }
    catch (e) {
        createError.value = e?.message ?? 'Не удалось создать место';
    }
    finally {
        creating.value = false;
    }
}
onMounted(async () => {
    await tryRestoreSession();
    if (currentPartner.value) {
        await loadData();
        await loadPartnerClusters();
    }
    else {
        loading.value = false;
    }
});
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['header-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['logout-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-input']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-input']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-submit']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-submit']} */ ;
/** @type {__VLS_StyleScopedClasses['error-state']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn--danger']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['submit-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['submit-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['cancel-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['place-item']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['page-content']} */ ;
/** @type {__VLS_StyleScopedClasses['form-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-nav']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
    ...{ class: "partner-page" },
});
/** @type {__VLS_StyleScopedClasses['partner-page']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
    ...{ class: "page-header" },
});
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit('back');
            // @ts-ignore
            [emit,];
        } },
    type: "button",
    ...{ class: "back-btn" },
});
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M19 12H5M12 19l-7-7 7-7",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-header__center" },
});
/** @type {__VLS_StyleScopedClasses['page-header__center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
    ...{ class: "page-header__title" },
});
/** @type {__VLS_StyleScopedClasses['page-header__title']} */ ;
if (__VLS_ctx.currentPartner) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "page-header__subtitle" },
    });
    /** @type {__VLS_StyleScopedClasses['page-header__subtitle']} */ ;
    (__VLS_ctx.currentPartner.full_name || __VLS_ctx.currentPartner.username);
}
if (__VLS_ctx.currentPartner) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "page-header__actions" },
    });
    /** @type {__VLS_StyleScopedClasses['page-header__actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.openCreateClusterForm) },
        type: "button",
        ...{ class: "header-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['header-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        width: "16",
        height: "16",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M12 5v14M5 12h14",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.openCreateForm) },
        type: "button",
        ...{ class: "header-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['header-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        width: "16",
        height: "16",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M12 5v14M5 12h14",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.logout) },
        type: "button",
        ...{ class: "logout-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['logout-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        width: "16",
        height: "16",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
    });
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-content" },
});
/** @type {__VLS_StyleScopedClasses['page-content']} */ ;
if (!__VLS_ctx.currentPartner) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "auth-container" },
    });
    /** @type {__VLS_StyleScopedClasses['auth-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "auth-card" },
    });
    /** @type {__VLS_StyleScopedClasses['auth-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "auth-tabs" },
    });
    /** @type {__VLS_StyleScopedClasses['auth-tabs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(!__VLS_ctx.currentPartner))
                    return;
                __VLS_ctx.authMode = 'login';
                __VLS_ctx.authError = '';
                // @ts-ignore
                [currentPartner, currentPartner, currentPartner, currentPartner, currentPartner, openCreateClusterForm, openCreateForm, logout, authMode, authError,];
            } },
        type: "button",
        ...{ class: "auth-tab" },
        ...{ class: ({ 'auth-tab--active': __VLS_ctx.authMode === 'login' }) },
    });
    /** @type {__VLS_StyleScopedClasses['auth-tab']} */ ;
    /** @type {__VLS_StyleScopedClasses['auth-tab--active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(!__VLS_ctx.currentPartner))
                    return;
                __VLS_ctx.authMode = 'register';
                __VLS_ctx.authError = '';
                // @ts-ignore
                [authMode, authMode, authError,];
            } },
        type: "button",
        ...{ class: "auth-tab" },
        ...{ class: ({ 'auth-tab--active': __VLS_ctx.authMode === 'register' }) },
    });
    /** @type {__VLS_StyleScopedClasses['auth-tab']} */ ;
    /** @type {__VLS_StyleScopedClasses['auth-tab--active']} */ ;
    if (__VLS_ctx.authError) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "auth-error" },
        });
        /** @type {__VLS_StyleScopedClasses['auth-error']} */ ;
        (__VLS_ctx.authError);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "auth-form" },
    });
    /** @type {__VLS_StyleScopedClasses['auth-form']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.authLogin),
        type: "text",
        ...{ class: "auth-input" },
        placeholder: (__VLS_ctx.authMode === 'login' ? 'Логин или email' : 'Логин (username)'),
        autocomplete: "username",
    });
    /** @type {__VLS_StyleScopedClasses['auth-input']} */ ;
    if (__VLS_ctx.authMode === 'register') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "email",
            ...{ class: "auth-input" },
            placeholder: "Email",
            autocomplete: "email",
        });
        (__VLS_ctx.authEmail);
        /** @type {__VLS_StyleScopedClasses['auth-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            value: (__VLS_ctx.authFullName),
            type: "text",
            ...{ class: "auth-input" },
            placeholder: "Имя / Название компании",
            autocomplete: "name",
        });
        /** @type {__VLS_StyleScopedClasses['auth-input']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onKeydown: (__VLS_ctx.submitAuth) },
        type: "password",
        ...{ class: "auth-input" },
        placeholder: "Пароль",
        autocomplete: "current-password",
    });
    (__VLS_ctx.authPassword);
    /** @type {__VLS_StyleScopedClasses['auth-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.submitAuth) },
        type: "button",
        ...{ class: "auth-submit" },
        disabled: (__VLS_ctx.authLoading || !__VLS_ctx.authLogin.trim() || !__VLS_ctx.authPassword),
    });
    /** @type {__VLS_StyleScopedClasses['auth-submit']} */ ;
    (__VLS_ctx.authLoading ? 'Загрузка...' : (__VLS_ctx.authMode === 'login' ? 'Войти' : 'Создать аккаунт'));
}
else {
    if (__VLS_ctx.loading) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "loading-state" },
        });
        /** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
    }
    else if (__VLS_ctx.error) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "error-state" },
        });
        /** @type {__VLS_StyleScopedClasses['error-state']} */ ;
        (__VLS_ctx.error);
    }
    else {
        if (__VLS_ctx.selectedPlace) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
                ...{ class: "detail-section" },
            });
            /** @type {__VLS_StyleScopedClasses['detail-section']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "detail-nav" },
            });
            /** @type {__VLS_StyleScopedClasses['detail-nav']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (__VLS_ctx.closePlace) },
                type: "button",
                ...{ class: "back-btn" },
            });
            /** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
                width: "18",
                height: "18",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                'stroke-width': "2",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                d: "M19 12H5M12 19l-7-7 7-7",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "detail-actions" },
            });
            /** @type {__VLS_StyleScopedClasses['detail-actions']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(!__VLS_ctx.currentPartner))
                            return;
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!(__VLS_ctx.selectedPlace))
                            return;
                        __VLS_ctx.showEditForm ? __VLS_ctx.closeEditForm() : __VLS_ctx.openEditForm();
                        // @ts-ignore
                        [authMode, authMode, authMode, authMode, authError, authError, authLogin, authLogin, authEmail, authFullName, submitAuth, submitAuth, authPassword, authPassword, authLoading, authLoading, loading, error, error, selectedPlace, closePlace, showEditForm, closeEditForm, openEditForm,];
                    } },
                type: "button",
                ...{ class: "action-btn" },
                disabled: (__VLS_ctx.deleting),
            });
            /** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
            (__VLS_ctx.showEditForm ? 'Отмена' : 'Редактировать');
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(!__VLS_ctx.currentPartner))
                            return;
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!(__VLS_ctx.selectedPlace))
                            return;
                        __VLS_ctx.deletePlace(__VLS_ctx.selectedPlace.place_id, __VLS_ctx.selectedPlace.name);
                        // @ts-ignore
                        [selectedPlace, selectedPlace, showEditForm, deleting, deletePlace,];
                    } },
                type: "button",
                ...{ class: "action-btn action-btn--danger" },
                disabled: (__VLS_ctx.deleting),
            });
            /** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
            /** @type {__VLS_StyleScopedClasses['action-btn--danger']} */ ;
            (__VLS_ctx.deleting ? 'Удаление...' : 'Удалить');
            if (__VLS_ctx.showEditForm) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "form-card" },
                });
                /** @type {__VLS_StyleScopedClasses['form-card']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
                    ...{ class: "form-title" },
                });
                /** @type {__VLS_StyleScopedClasses['form-title']} */ ;
                if (__VLS_ctx.editError) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "form-error" },
                    });
                    /** @type {__VLS_StyleScopedClasses['form-error']} */ ;
                    (__VLS_ctx.editError);
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "form-grid" },
                });
                /** @type {__VLS_StyleScopedClasses['form-grid']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    value: (__VLS_ctx.editName),
                    ...{ class: "form-input" },
                    type: "text",
                    placeholder: "Название",
                });
                /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                    value: (__VLS_ctx.editClusterId),
                    ...{ class: "form-input" },
                });
                /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                    value: "",
                    disabled: true,
                });
                for (const [c] of __VLS_vFor((__VLS_ctx.partnerClusters))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                        key: (c.id),
                        value: (c.id),
                    });
                    (c.title);
                    // @ts-ignore
                    [showEditForm, deleting, deleting, editError, editError, editName, editClusterId, partnerClusters,];
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    value: (__VLS_ctx.editType),
                    ...{ class: "form-input" },
                    type: "text",
                    placeholder: "Тип места",
                });
                /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    value: (__VLS_ctx.editLocation),
                    ...{ class: "form-input" },
                    type: "text",
                    placeholder: "Локация",
                });
                /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    value: (__VLS_ctx.editFact),
                    ...{ class: "form-input" },
                    type: "text",
                    placeholder: "Интересный факт",
                });
                /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    ...{ class: "form-input" },
                    type: "number",
                    min: "0",
                    placeholder: "Цена, ₽",
                });
                (__VLS_ctx.editPrice);
                /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
                    value: (__VLS_ctx.editDescription),
                    ...{ class: "form-input form-input--textarea" },
                    placeholder: "Описание",
                });
                /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
                /** @type {__VLS_StyleScopedClasses['form-input--textarea']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    ...{ class: "form-input" },
                    type: "url",
                    placeholder: "Ссылка на фото",
                });
                (__VLS_ctx.editImageUrl);
                /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "form-actions" },
                });
                /** @type {__VLS_StyleScopedClasses['form-actions']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (__VLS_ctx.savePlace) },
                    type: "button",
                    ...{ class: "submit-btn" },
                    disabled: (__VLS_ctx.saving),
                });
                /** @type {__VLS_StyleScopedClasses['submit-btn']} */ ;
                (__VLS_ctx.saving ? 'Сохранение...' : 'Сохранить');
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (__VLS_ctx.closeEditForm) },
                    type: "button",
                    ...{ class: "cancel-btn" },
                });
                /** @type {__VLS_StyleScopedClasses['cancel-btn']} */ ;
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "place-detail-card" },
            });
            /** @type {__VLS_StyleScopedClasses['place-detail-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                src: (__VLS_ctx.selectedPlace.images[0] || __VLS_ctx.PLACEHOLDER_PHOTO),
                alt: (__VLS_ctx.selectedPlace.name),
                ...{ class: "place-detail__image" },
                referrerpolicy: "no-referrer",
            });
            /** @type {__VLS_StyleScopedClasses['place-detail__image']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "place-detail__body" },
            });
            /** @type {__VLS_StyleScopedClasses['place-detail__body']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
                ...{ class: "place-detail__title" },
            });
            /** @type {__VLS_StyleScopedClasses['place-detail__title']} */ ;
            (__VLS_ctx.selectedPlace.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "place-detail__meta" },
            });
            /** @type {__VLS_StyleScopedClasses['place-detail__meta']} */ ;
            (__VLS_ctx.selectedPlace.location ?? __VLS_ctx.selectedPlace.place_type ?? '-');
            if (__VLS_ctx.selectedPlace.price != null) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "place-detail__price" },
                });
                /** @type {__VLS_StyleScopedClasses['place-detail__price']} */ ;
                (__VLS_ctx.selectedPlace.price.toLocaleString('ru-RU'));
            }
            if (__VLS_ctx.selectedPlace.description) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "place-detail__desc" },
                });
                /** @type {__VLS_StyleScopedClasses['place-detail__desc']} */ ;
                (__VLS_ctx.selectedPlace.description);
            }
            if (__VLS_ctx.selectedPlace.interesting_fact) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "place-detail__fact" },
                });
                /** @type {__VLS_StyleScopedClasses['place-detail__fact']} */ ;
                (__VLS_ctx.selectedPlace.interesting_fact);
            }
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
                ...{ class: "clusters-section" },
            });
            /** @type {__VLS_StyleScopedClasses['clusters-section']} */ ;
            if (__VLS_ctx.selectedPlaceLoading) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "loading-state" },
                });
                /** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
            }
            if (__VLS_ctx.showCreateClusterForm) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "form-card" },
                });
                /** @type {__VLS_StyleScopedClasses['form-card']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
                    ...{ class: "form-title" },
                });
                /** @type {__VLS_StyleScopedClasses['form-title']} */ ;
                if (__VLS_ctx.createClusterError) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "form-error" },
                    });
                    /** @type {__VLS_StyleScopedClasses['form-error']} */ ;
                    (__VLS_ctx.createClusterError);
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "form-grid" },
                });
                /** @type {__VLS_StyleScopedClasses['form-grid']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    value: (__VLS_ctx.newClusterTitle),
                    ...{ class: "form-input" },
                    type: "text",
                    placeholder: "Название кластера",
                });
                /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    value: (__VLS_ctx.newClusterMeta),
                    ...{ class: "form-input" },
                    type: "text",
                    placeholder: "Мета-описание",
                });
                /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
                    value: (__VLS_ctx.newClusterDescription),
                    ...{ class: "form-input form-input--textarea" },
                    placeholder: "Описание кластера",
                });
                /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
                /** @type {__VLS_StyleScopedClasses['form-input--textarea']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "form-actions" },
                });
                /** @type {__VLS_StyleScopedClasses['form-actions']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (__VLS_ctx.createCluster) },
                    type: "button",
                    ...{ class: "submit-btn" },
                    disabled: (__VLS_ctx.creatingCluster),
                });
                /** @type {__VLS_StyleScopedClasses['submit-btn']} */ ;
                (__VLS_ctx.creatingCluster ? 'Создание...' : 'Создать');
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (__VLS_ctx.closeCreateClusterForm) },
                    type: "button",
                    ...{ class: "cancel-btn" },
                });
                /** @type {__VLS_StyleScopedClasses['cancel-btn']} */ ;
            }
            if (__VLS_ctx.showCreateForm) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "form-card" },
                });
                /** @type {__VLS_StyleScopedClasses['form-card']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
                    ...{ class: "form-title" },
                });
                /** @type {__VLS_StyleScopedClasses['form-title']} */ ;
                if (__VLS_ctx.createError) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "form-error" },
                    });
                    /** @type {__VLS_StyleScopedClasses['form-error']} */ ;
                    (__VLS_ctx.createError);
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "form-grid" },
                });
                /** @type {__VLS_StyleScopedClasses['form-grid']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    value: (__VLS_ctx.formName),
                    ...{ class: "form-input" },
                    type: "text",
                    placeholder: "Название",
                });
                /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                    value: (__VLS_ctx.formClusterId),
                    ...{ class: "form-input" },
                });
                /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                    value: "",
                    disabled: true,
                });
                for (const [c] of __VLS_vFor((__VLS_ctx.partnerClusters))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                        key: (c.id),
                        value: (c.id),
                    });
                    (c.title);
                    // @ts-ignore
                    [selectedPlace, selectedPlace, selectedPlace, selectedPlace, selectedPlace, selectedPlace, selectedPlace, selectedPlace, selectedPlace, selectedPlace, selectedPlace, closeEditForm, partnerClusters, editType, editLocation, editFact, editPrice, editDescription, editImageUrl, savePlace, saving, saving, PLACEHOLDER_PHOTO, selectedPlaceLoading, showCreateClusterForm, createClusterError, createClusterError, newClusterTitle, newClusterMeta, newClusterDescription, createCluster, creatingCluster, creatingCluster, closeCreateClusterForm, showCreateForm, createError, createError, formName, formClusterId,];
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    value: (__VLS_ctx.formType),
                    ...{ class: "form-input" },
                    type: "text",
                    placeholder: "Тип места",
                });
                /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    value: (__VLS_ctx.formLocation),
                    ...{ class: "form-input" },
                    type: "text",
                    placeholder: "Локация",
                });
                /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    value: (__VLS_ctx.formFact),
                    ...{ class: "form-input" },
                    type: "text",
                    placeholder: "Интересный факт",
                });
                /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    ...{ class: "form-input" },
                    type: "number",
                    min: "0",
                    placeholder: "Цена, ₽",
                });
                (__VLS_ctx.formPrice);
                /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
                    value: (__VLS_ctx.formDescription),
                    ...{ class: "form-input form-input--textarea" },
                    placeholder: "Описание",
                });
                /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
                /** @type {__VLS_StyleScopedClasses['form-input--textarea']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    ...{ class: "form-input" },
                    type: "url",
                    placeholder: "Ссылка на фото",
                });
                (__VLS_ctx.formImageUrl);
                /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "form-actions" },
                });
                /** @type {__VLS_StyleScopedClasses['form-actions']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (__VLS_ctx.createPlace) },
                    type: "button",
                    ...{ class: "submit-btn" },
                    disabled: (__VLS_ctx.creating),
                });
                /** @type {__VLS_StyleScopedClasses['submit-btn']} */ ;
                (__VLS_ctx.creating ? 'Создание...' : 'Создать');
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (__VLS_ctx.closeCreateForm) },
                    type: "button",
                    ...{ class: "cancel-btn" },
                });
                /** @type {__VLS_StyleScopedClasses['cancel-btn']} */ ;
            }
            if (!__VLS_ctx.showCreateClusterForm && !__VLS_ctx.showCreateForm) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "clusters-grid" },
                });
                /** @type {__VLS_StyleScopedClasses['clusters-grid']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
                    ...{ class: "section-title" },
                });
                /** @type {__VLS_StyleScopedClasses['section-title']} */ ;
                if (__VLS_ctx.clustersLoading) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "loading-state" },
                    });
                    /** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
                }
                else if (__VLS_ctx.clustersError) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "error-state" },
                    });
                    /** @type {__VLS_StyleScopedClasses['error-state']} */ ;
                    (__VLS_ctx.clustersError);
                }
                else if (__VLS_ctx.partnerClusters.length === 0) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "empty-state" },
                    });
                    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
                    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
                }
                else {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "clusters-list" },
                    });
                    /** @type {__VLS_StyleScopedClasses['clusters-list']} */ ;
                    for (const [cluster] of __VLS_vFor((__VLS_ctx.partnerClusters))) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
                            key: (cluster.id),
                            ...{ class: "cluster-card" },
                        });
                        /** @type {__VLS_StyleScopedClasses['cluster-card']} */ ;
                        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                            ...{ class: "cluster-header" },
                        });
                        /** @type {__VLS_StyleScopedClasses['cluster-header']} */ ;
                        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
                            ...{ class: "cluster-title" },
                        });
                        /** @type {__VLS_StyleScopedClasses['cluster-title']} */ ;
                        (cluster.title);
                        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                            ...{ class: "cluster-status" },
                        });
                        /** @type {__VLS_StyleScopedClasses['cluster-status']} */ ;
                        (cluster.status);
                        if (cluster.meta) {
                            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                                ...{ class: "cluster-meta" },
                            });
                            /** @type {__VLS_StyleScopedClasses['cluster-meta']} */ ;
                            (cluster.meta);
                        }
                        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                            ...{ class: "cluster-places" },
                        });
                        /** @type {__VLS_StyleScopedClasses['cluster-places']} */ ;
                        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                            ...{ class: "cluster-places__header" },
                        });
                        /** @type {__VLS_StyleScopedClasses['cluster-places__header']} */ ;
                        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                            ...{ class: "cluster-places__count" },
                        });
                        /** @type {__VLS_StyleScopedClasses['cluster-places__count']} */ ;
                        (__VLS_ctx.getPlacesForCluster(cluster.id).length);
                        (__VLS_ctx.getPlacesWord(__VLS_ctx.getPlacesForCluster(cluster.id).length));
                        if (__VLS_ctx.getPlacesForCluster(cluster.id).length === 0) {
                            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                                ...{ class: "empty-cluster" },
                            });
                            /** @type {__VLS_StyleScopedClasses['empty-cluster']} */ ;
                        }
                        else {
                            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                                ...{ class: "places-list" },
                            });
                            /** @type {__VLS_StyleScopedClasses['places-list']} */ ;
                            for (const [place] of __VLS_vFor((__VLS_ctx.getPlacesForCluster(cluster.id)))) {
                                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                                    ...{ onClick: (...[$event]) => {
                                            if (!!(!__VLS_ctx.currentPartner))
                                                return;
                                            if (!!(__VLS_ctx.loading))
                                                return;
                                            if (!!(__VLS_ctx.error))
                                                return;
                                            if (!!(__VLS_ctx.selectedPlace))
                                                return;
                                            if (!(!__VLS_ctx.showCreateClusterForm && !__VLS_ctx.showCreateForm))
                                                return;
                                            if (!!(__VLS_ctx.clustersLoading))
                                                return;
                                            if (!!(__VLS_ctx.clustersError))
                                                return;
                                            if (!!(__VLS_ctx.partnerClusters.length === 0))
                                                return;
                                            if (!!(__VLS_ctx.getPlacesForCluster(cluster.id).length === 0))
                                                return;
                                            __VLS_ctx.openPlace(place.place_id);
                                            // @ts-ignore
                                            [partnerClusters, partnerClusters, showCreateClusterForm, showCreateForm, formType, formLocation, formFact, formPrice, formDescription, formImageUrl, createPlace, creating, creating, closeCreateForm, clustersLoading, clustersError, clustersError, getPlacesForCluster, getPlacesForCluster, getPlacesForCluster, getPlacesForCluster, getPlacesWord, openPlace,];
                                        } },
                                    key: (place.place_id),
                                    ...{ class: "place-item" },
                                });
                                /** @type {__VLS_StyleScopedClasses['place-item']} */ ;
                                __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                                    ...{ onError: (...[$event]) => {
                                            if (!!(!__VLS_ctx.currentPartner))
                                                return;
                                            if (!!(__VLS_ctx.loading))
                                                return;
                                            if (!!(__VLS_ctx.error))
                                                return;
                                            if (!!(__VLS_ctx.selectedPlace))
                                                return;
                                            if (!(!__VLS_ctx.showCreateClusterForm && !__VLS_ctx.showCreateForm))
                                                return;
                                            if (!!(__VLS_ctx.clustersLoading))
                                                return;
                                            if (!!(__VLS_ctx.clustersError))
                                                return;
                                            if (!!(__VLS_ctx.partnerClusters.length === 0))
                                                return;
                                            if (!!(__VLS_ctx.getPlacesForCluster(cluster.id).length === 0))
                                                return;
                                            __VLS_ctx.onPlacePhotoError(place.place_id);
                                            // @ts-ignore
                                            [onPlacePhotoError,];
                                        } },
                                    src: (__VLS_ctx.placePhotoSrc(place)),
                                    alt: (place.name),
                                    ...{ class: "place-item__image" },
                                    referrerpolicy: "no-referrer",
                                    loading: "lazy",
                                });
                                /** @type {__VLS_StyleScopedClasses['place-item__image']} */ ;
                                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                                    ...{ class: "place-item__info" },
                                });
                                /** @type {__VLS_StyleScopedClasses['place-item__info']} */ ;
                                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                                    ...{ class: "place-item__name" },
                                });
                                /** @type {__VLS_StyleScopedClasses['place-item__name']} */ ;
                                (place.name);
                                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                                    ...{ class: "place-item__meta" },
                                });
                                /** @type {__VLS_StyleScopedClasses['place-item__meta']} */ ;
                                (place.location ?? place.place_type ?? '-');
                                if (place.price != null) {
                                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                                        ...{ class: "place-item__price" },
                                    });
                                    /** @type {__VLS_StyleScopedClasses['place-item__price']} */ ;
                                    (place.price);
                                }
                                // @ts-ignore
                                [placePhotoSrc,];
                            }
                        }
                        // @ts-ignore
                        [];
                    }
                }
            }
        }
    }
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
});
export default {};

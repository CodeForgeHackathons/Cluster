/// <reference types="C:/Users/Иван Жутяев/AppData/Local/npm-cache/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/Иван Жутяев/AppData/Local/npm-cache/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, onMounted, ref } from 'vue';
import seaImg from '../assets/kk/пляж.jfif';
import wineImg from '../assets/kk/винодельня.jfif';
import kidsImg from '../assets/kk/дети.png';
import viewImg from '../assets/kk/коворкинг.jpg';
import calmImg from '../assets/kk/природа.jpg';
import secretImg from '../assets/kk/станица.jfif';
import { fetchClusters } from '../api/clusters';
const emit = defineEmits();
const filters = [
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
];
const fallbackCards = [
    { id: 'cl1', image: seaImg, rating: 4.9, reviews: 'По отзывам', title: 'Отель и прогулки у моря', meta: 'Краснодарский край', price: 7361 },
    { id: 'cl2', image: calmImg, rating: 5.0, reviews: 'По отзывам', title: 'Дом среди природы', meta: 'Тихий район', price: 5429 },
    { id: 'cl3', image: viewImg, rating: 4.9, reviews: 'По отзывам', title: 'Локация для работы с видом', meta: 'Кофе, терраса', price: 7854 },
    { id: 'cl4', image: wineImg, rating: 4.9, reviews: 'По отзывам', title: 'Винные маршруты', meta: 'Вкус, дегустации', price: 12328 },
    { id: 'cl5', image: kidsImg, rating: 4.9, reviews: 'По отзывам', title: 'Куда сходить с детьми', meta: 'Семейный отдых', price: 6000 },
    { id: 'cl6', image: secretImg, rating: 4.8, reviews: 'По отзывам', title: 'Нестандартная станица', meta: 'Ремесла', price: 7010 },
];
const clusterCards = ref(fallbackCards);
const clusterByIdRef = ref(buildFallbackClusters(fallbackCards));
const clustersLoading = ref(true);
const isPageMounted = ref(false);
onMounted(async () => {
    isPageMounted.value = true;
    const result = await fetchClusters();
    clustersLoading.value = false;
    if (result) {
        clusterCards.value = result.cards;
        clusterByIdRef.value = result.clusters;
    }
});
function buildFallbackClusters(cards) {
    const factPresets = {
        cl1: ['Соль в воздухе', 'Закат рядом', 'Тихая бухта'],
        cl2: ['Тишина рядом', 'Чай и зелень', 'Туман красиво'],
        cl3: ['Фокус и вид', 'Дела в тишине', 'Заметки на свежем'],
        cl4: ['Вино в бокале', 'Ремесло вкусно', 'Ветер в листьях'],
        cl5: ['Игра и вкус', 'Творчество рядом', 'Шаги в радость'],
        cl6: ['Тайные мастерские', 'Дела руками', 'Фото без толпы'],
    };
    const clusterPhotoSets = {
        cl1: [seaImg, calmImg, wineImg],
        cl2: [calmImg, seaImg, viewImg],
        cl3: [viewImg, calmImg, seaImg],
        cl4: [wineImg, secretImg, calmImg],
        cl5: [kidsImg, seaImg, viewImg],
        cl6: [secretImg, calmImg, kidsImg],
    };
    const clusterCoords = {
        cl1: { lat: 43.585, lon: 39.723 },
        cl2: { lat: 45.041, lon: 37.360 },
        cl3: { lat: 44.982, lon: 38.917 },
        cl4: { lat: 44.958, lon: 37.783 },
        cl5: { lat: 45.025, lon: 37.170 },
        cl6: { lat: 44.476, lon: 39.016 },
    };
    const map = new Map();
    for (const c of cards) {
        const [fact1, fact2, fact3] = factPresets[c.id] ?? ['Впечатления', 'Вдохновение', 'Путешествие'];
        const placePhotos = clusterPhotoSets[c.id] ?? [c.image, c.image, c.image];
        const coords = clusterCoords[c.id] ?? { lat: 45.0, lon: 38.0 };
        const baseDescription = `Сценарий "${c.title}": локальные смыслы, понятная логистика и ощущение "я нашёл(ла) своё место".`;
        const places = [
            {
                id: `${c.id}-p1`,
                photo: placePhotos[0],
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
                photo: placePhotos[1],
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
                photo: placePhotos[2],
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
        ];
        const cluster = {
            id: c.id,
            coverImage: c.image,
            title: c.title,
            places,
        };
        map.set(c.id, cluster);
    }
    return map;
}
function openClusterById(id) {
    const cluster = clusterByIdRef.value.get(id);
    if (!cluster)
        return;
    emit('openCluster', cluster);
}
const isGalleryOpen = ref(false);
const galleryClusterTitle = ref('');
const galleryImages = ref([]);
const galleryActiveIndex = ref(0);
function openClusterGallery(id) {
    const cluster = clusterByIdRef.value.get(id);
    if (!cluster)
        return;
    galleryClusterTitle.value = cluster.title;
    galleryImages.value = cluster.places.map((p) => p.photo);
    galleryActiveIndex.value = 0;
    isGalleryOpen.value = true;
}
function closeClusterGallery() {
    isGalleryOpen.value = false;
}
function selectGalleryImage(idx) {
    if (idx < 0 || idx >= galleryImages.value.length)
        return;
    galleryActiveIndex.value = idx;
}
const selectedId = ref(null);
const showClusters = ref(false);
const clusterFilterMap = {
    run: ['cl1', 'cl2', 'cl6'],
    taste: ['cl4'],
    kids: ['cl5'],
    view: ['cl3'],
    calm: ['cl2', 'cl6'],
    secret: ['cl6'],
};
const visibleClusters = computed(() => {
    const dedup = new Map();
    for (const c of clusterCards.value)
        dedup.set(c.id, c);
    const list = Array.from(dedup.values());
    const selected = selectedId.value;
    if (!selected)
        return list;
    const allowed = new Set(clusterFilterMap[selected] ?? []);
    const filtered = list.filter((c) => allowed.has(c.id));
    return filtered.length ? filtered : list;
});
function selectFilter(filter) {
    selectedId.value = filter.id;
    showClusters.value = true;
}
function resetToInitial() {
    selectedId.value = null;
    showClusters.value = false;
    isGalleryOpen.value = false;
}
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
/** @type {__VLS_StyleScopedClasses['header__navLink']} */ ;
/** @type {__VLS_StyleScopedClasses['header__navLink']} */ ;
/** @type {__VLS_StyleScopedClasses['header__cta']} */ ;
/** @type {__VLS_StyleScopedClasses['header__cta']} */ ;
/** @type {__VLS_StyleScopedClasses['header__cta-glow']} */ ;
/** @type {__VLS_StyleScopedClasses['hero__btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['hero__btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['hero__btn-bg']} */ ;
/** @type {__VLS_StyleScopedClasses['hero__btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['hero__btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['hero__btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['floating-card']} */ ;
/** @type {__VLS_StyleScopedClasses['floating-card']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-card']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-card']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-card__image']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-card']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-card__overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-card']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-card__shine']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-card']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-card__icon']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-card']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-card__arrow']} */ ;
/** @type {__VLS_StyleScopedClasses['clusters__back']} */ ;
/** @type {__VLS_StyleScopedClasses['cluster-card']} */ ;
/** @type {__VLS_StyleScopedClasses['cluster-card__image']} */ ;
/** @type {__VLS_StyleScopedClasses['cluster-card']} */ ;
/** @type {__VLS_StyleScopedClasses['cluster-card__image']} */ ;
/** @type {__VLS_StyleScopedClasses['cluster-card']} */ ;
/** @type {__VLS_StyleScopedClasses['cluster-card__overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['cluster-card__rating']} */ ;
/** @type {__VLS_StyleScopedClasses['cluster-card__gallery']} */ ;
/** @type {__VLS_StyleScopedClasses['gallery-modal__close']} */ ;
/** @type {__VLS_StyleScopedClasses['gallery-modal__main']} */ ;
/** @type {__VLS_StyleScopedClasses['gallery-modal__thumb']} */ ;
/** @type {__VLS_StyleScopedClasses['gallery-modal__thumb']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-enter-active']} */ ;
/** @type {__VLS_StyleScopedClasses['gallery-modal__content']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-leave-active']} */ ;
/** @type {__VLS_StyleScopedClasses['gallery-modal__content']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-enter-from']} */ ;
/** @type {__VLS_StyleScopedClasses['gallery-modal__content']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-leave-to']} */ ;
/** @type {__VLS_StyleScopedClasses['gallery-modal__content']} */ ;
/** @type {__VLS_StyleScopedClasses['filters__grid']} */ ;
/** @type {__VLS_StyleScopedClasses['clusters__grid']} */ ;
/** @type {__VLS_StyleScopedClasses['hero__floating']} */ ;
/** @type {__VLS_StyleScopedClasses['header__nav']} */ ;
/** @type {__VLS_StyleScopedClasses['hero']} */ ;
/** @type {__VLS_StyleScopedClasses['hero__stats']} */ ;
/** @type {__VLS_StyleScopedClasses['hero__stat-divider']} */ ;
/** @type {__VLS_StyleScopedClasses['hero__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['hero__btn']} */ ;
/** @type {__VLS_StyleScopedClasses['filters']} */ ;
/** @type {__VLS_StyleScopedClasses['filters__grid']} */ ;
/** @type {__VLS_StyleScopedClasses['clusters']} */ ;
/** @type {__VLS_StyleScopedClasses['clusters__header']} */ ;
/** @type {__VLS_StyleScopedClasses['clusters__grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
    ...{ class: "landing" },
});
/** @type {__VLS_StyleScopedClasses['landing']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "bg-effects" },
});
/** @type {__VLS_StyleScopedClasses['bg-effects']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "bg-gradient" },
});
/** @type {__VLS_StyleScopedClasses['bg-gradient']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "bg-grid" },
});
/** @type {__VLS_StyleScopedClasses['bg-grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "bg-glow bg-glow--1" },
});
/** @type {__VLS_StyleScopedClasses['bg-glow']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-glow--1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "bg-glow bg-glow--2" },
});
/** @type {__VLS_StyleScopedClasses['bg-glow']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-glow--2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
    ...{ class: "header" },
    ...{ class: ({ 'header--visible': __VLS_ctx.isPageMounted }) },
});
/** @type {__VLS_StyleScopedClasses['header']} */ ;
/** @type {__VLS_StyleScopedClasses['header--visible']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ onClick: (__VLS_ctx.resetToInitial) },
    ...{ class: "header__logo" },
});
/** @type {__VLS_StyleScopedClasses['header__logo']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "logo" },
});
/** @type {__VLS_StyleScopedClasses['logo']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "logo__icon" },
});
/** @type {__VLS_StyleScopedClasses['logo__icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    width: "32",
    height: "32",
    viewBox: "0 0 32 32",
    fill: "none",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
    cx: "16",
    cy: "16",
    r: "6",
    fill: "url(#logoGradient)",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
    cx: "8",
    cy: "10",
    r: "3",
    fill: "url(#logoGradient)",
    opacity: "0.8",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
    cx: "24",
    cy: "10",
    r: "3",
    fill: "url(#logoGradient)",
    opacity: "0.8",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
    cx: "8",
    cy: "22",
    r: "3",
    fill: "url(#logoGradient)",
    opacity: "0.6",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
    cx: "24",
    cy: "22",
    r: "3",
    fill: "url(#logoGradient)",
    opacity: "0.6",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M11 13L14 15M18 15L21 13M11 19L14 17M18 17L21 19",
    stroke: "url(#logoGradient)",
    'stroke-width': "1.5",
    'stroke-linecap': "round",
    opacity: "0.4",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
    cx: "16",
    cy: "16",
    r: "10",
    stroke: "url(#logoGradient)",
    'stroke-width': "0.5",
    opacity: "0.3",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.defs, __VLS_intrinsics.defs)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.linearGradient, __VLS_intrinsics.linearGradient)({
    id: "logoGradient",
    x1: "0",
    y1: "0",
    x2: "32",
    y2: "32",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.stop)({
    offset: "0%",
    'stop-color': "#34d399",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.stop)({
    offset: "100%",
    'stop-color': "#10b981",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "logo__text" },
});
/** @type {__VLS_StyleScopedClasses['logo__text']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
    ...{ class: "header__nav" },
});
/** @type {__VLS_StyleScopedClasses['header__nav']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit('openPlanner');
            // @ts-ignore
            [isPageMounted, resetToInitial, emit,];
        } },
    type: "button",
    ...{ class: "header__navLink" },
});
/** @type {__VLS_StyleScopedClasses['header__navLink']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit('openPartner');
            // @ts-ignore
            [emit,];
        } },
    type: "button",
    ...{ class: "header__navLink" },
});
/** @type {__VLS_StyleScopedClasses['header__navLink']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
    cx: "12",
    cy: "7",
    r: "4",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit('openPlanner');
            // @ts-ignore
            [emit,];
        } },
    type: "button",
    ...{ class: "header__cta" },
});
/** @type {__VLS_StyleScopedClasses['header__cta']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "header__cta-glow" },
});
/** @type {__VLS_StyleScopedClasses['header__cta-glow']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M12 3v18M3 12h18",
});
if (!__VLS_ctx.showClusters) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "hero" },
    });
    /** @type {__VLS_StyleScopedClasses['hero']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "hero__content" },
        ...{ class: ({ 'hero__content--visible': __VLS_ctx.isPageMounted }) },
    });
    /** @type {__VLS_StyleScopedClasses['hero__content']} */ ;
    /** @type {__VLS_StyleScopedClasses['hero__content--visible']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "hero__badge" },
    });
    /** @type {__VLS_StyleScopedClasses['hero__badge']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "hero__badge-dot" },
    });
    /** @type {__VLS_StyleScopedClasses['hero__badge-dot']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "hero__badge-new" },
    });
    /** @type {__VLS_StyleScopedClasses['hero__badge-new']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
        ...{ class: "hero__title" },
    });
    /** @type {__VLS_StyleScopedClasses['hero__title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "hero__title-line" },
    });
    /** @type {__VLS_StyleScopedClasses['hero__title-line']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "hero__title-accent" },
    });
    /** @type {__VLS_StyleScopedClasses['hero__title-accent']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "hero__subtitle" },
    });
    /** @type {__VLS_StyleScopedClasses['hero__subtitle']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "hero__actions" },
    });
    /** @type {__VLS_StyleScopedClasses['hero__actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(!__VLS_ctx.showClusters))
                    return;
                __VLS_ctx.emit('openPlanner');
                // @ts-ignore
                [isPageMounted, emit, showClusters,];
            } },
        type: "button",
        ...{ class: "hero__btn hero__btn--primary" },
    });
    /** @type {__VLS_StyleScopedClasses['hero__btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['hero__btn--primary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "hero__btn-bg" },
    });
    /** @type {__VLS_StyleScopedClasses['hero__btn-bg']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        width: "18",
        height: "18",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M12 2L2 7l10 5 10-5-10-5z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M2 17l10 5 10-5",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M2 12l10 5 10-5",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        width: "16",
        height: "16",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M5 12h14M12 5l7 7-7 7",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(!__VLS_ctx.showClusters))
                    return;
                __VLS_ctx.showClusters = true;
                // @ts-ignore
                [showClusters,];
            } },
        type: "button",
        ...{ class: "hero__btn hero__btn--secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['hero__btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['hero__btn--secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "hero__stats" },
    });
    /** @type {__VLS_StyleScopedClasses['hero__stats']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "hero__stat" },
    });
    /** @type {__VLS_StyleScopedClasses['hero__stat']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "hero__stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['hero__stat-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "hero__stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['hero__stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "hero__stat-divider" },
    });
    /** @type {__VLS_StyleScopedClasses['hero__stat-divider']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "hero__stat" },
    });
    /** @type {__VLS_StyleScopedClasses['hero__stat']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "hero__stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['hero__stat-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "hero__stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['hero__stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "hero__stat-divider" },
    });
    /** @type {__VLS_StyleScopedClasses['hero__stat-divider']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "hero__stat" },
    });
    /** @type {__VLS_StyleScopedClasses['hero__stat']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "hero__stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['hero__stat-value']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "hero__stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['hero__stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "hero__floating" },
    });
    /** @type {__VLS_StyleScopedClasses['hero__floating']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "floating-card floating-card--1" },
    });
    /** @type {__VLS_StyleScopedClasses['floating-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['floating-card--1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        src: (__VLS_ctx.seaImg),
        alt: "",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "floating-card floating-card--2" },
    });
    /** @type {__VLS_StyleScopedClasses['floating-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['floating-card--2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        src: (__VLS_ctx.wineImg),
        alt: "",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "floating-card floating-card--3" },
    });
    /** @type {__VLS_StyleScopedClasses['floating-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['floating-card--3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        src: (__VLS_ctx.calmImg),
        alt: "",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
}
if (!__VLS_ctx.showClusters) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "filters" },
    });
    /** @type {__VLS_StyleScopedClasses['filters']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-header" },
    });
    /** @type {__VLS_StyleScopedClasses['section-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "section-label" },
    });
    /** @type {__VLS_StyleScopedClasses['section-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        ...{ class: "section-title" },
    });
    /** @type {__VLS_StyleScopedClasses['section-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filters__grid" },
    });
    /** @type {__VLS_StyleScopedClasses['filters__grid']} */ ;
    for (const [f, index] of __VLS_vFor((__VLS_ctx.filters))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.showClusters))
                        return;
                    __VLS_ctx.selectFilter(f);
                    // @ts-ignore
                    [showClusters, seaImg, wineImg, calmImg, filters, selectFilter,];
                } },
            key: (f.id),
            type: "button",
            ...{ class: "filter-card" },
            ...{ style: ({ animationDelay: `${index * 0.1}s` }) },
        });
        /** @type {__VLS_StyleScopedClasses['filter-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "filter-card__image" },
            ...{ style: ({ backgroundImage: `url(${f.cardImage})` }) },
        });
        /** @type {__VLS_StyleScopedClasses['filter-card__image']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "filter-card__overlay" },
        });
        /** @type {__VLS_StyleScopedClasses['filter-card__overlay']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "filter-card__shine" },
        });
        /** @type {__VLS_StyleScopedClasses['filter-card__shine']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "filter-card__content" },
        });
        /** @type {__VLS_StyleScopedClasses['filter-card__content']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "filter-card__icon" },
        });
        /** @type {__VLS_StyleScopedClasses['filter-card__icon']} */ ;
        if (f.icon === 'escape') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
                width: "24",
                height: "24",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                'stroke-width': "2",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                d: "M13.73 21a2 2 0 0 1-3.46 0",
            });
        }
        else if (f.icon === 'wine') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
                width: "24",
                height: "24",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                'stroke-width': "2",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                d: "M8 22h8",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                d: "M12 11v11",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                d: "M5 3h14l-3 9c-.4 1.2-1.5 2-2.8 2h-2.4c-1.3 0-2.4-.8-2.8-2L5 3Z",
            });
        }
        else if (f.icon === 'family') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
                width: "24",
                height: "24",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                'stroke-width': "2",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
                cx: "12",
                cy: "5",
                r: "3",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                d: "M12 8v4",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
                cx: "6",
                cy: "10",
                r: "2",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
                cx: "18",
                cy: "10",
                r: "2",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                d: "M6 12v2",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                d: "M18 12v2",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                d: "M9 20a3 3 0 0 1 6 0",
            });
        }
        else if (f.icon === 'laptop') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
                width: "24",
                height: "24",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                'stroke-width': "2",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
                x: "2",
                y: "3",
                width: "20",
                height: "14",
                rx: "2",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                d: "M2 20h20",
            });
        }
        else if (f.icon === 'leaf') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
                width: "24",
                height: "24",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                'stroke-width': "2",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                d: "M11 20A7 7 0 0 1 4 13c0-5 4-9 9-9 0 5-2 10-9 10",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                d: "M20 4s-2 3-4 5",
            });
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
                width: "24",
                height: "24",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                'stroke-width': "2",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
                cx: "12",
                cy: "12",
                r: "10",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.polygon)({
                points: "16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88",
            });
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
            ...{ class: "filter-card__title" },
        });
        /** @type {__VLS_StyleScopedClasses['filter-card__title']} */ ;
        (f.label);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "filter-card__desc" },
        });
        /** @type {__VLS_StyleScopedClasses['filter-card__desc']} */ ;
        (f.description);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "filter-card__arrow" },
        });
        /** @type {__VLS_StyleScopedClasses['filter-card__arrow']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            width: "20",
            height: "20",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M5 12h14M12 5l7 7-7 7",
        });
        // @ts-ignore
        [];
    }
}
if (__VLS_ctx.showClusters) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "clusters" },
    });
    /** @type {__VLS_StyleScopedClasses['clusters']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "clusters__header" },
    });
    /** @type {__VLS_StyleScopedClasses['clusters__header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.resetToInitial) },
        type: "button",
        ...{ class: "clusters__back" },
    });
    /** @type {__VLS_StyleScopedClasses['clusters__back']} */ ;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        ...{ class: "clusters__title" },
    });
    /** @type {__VLS_StyleScopedClasses['clusters__title']} */ ;
    (__VLS_ctx.selectedId ? __VLS_ctx.filters.find(f => f.id === __VLS_ctx.selectedId)?.label : 'Все маршруты');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "clusters__grid" },
    });
    /** @type {__VLS_StyleScopedClasses['clusters__grid']} */ ;
    for (const [c, index] of __VLS_vFor((__VLS_ctx.visibleClusters))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showClusters))
                        return;
                    __VLS_ctx.openClusterById(c.id);
                    // @ts-ignore
                    [resetToInitial, showClusters, filters, selectedId, selectedId, visibleClusters, openClusterById,];
                } },
            ...{ onKeydown: (...[$event]) => {
                    if (!(__VLS_ctx.showClusters))
                        return;
                    __VLS_ctx.openClusterById(c.id);
                    // @ts-ignore
                    [openClusterById,];
                } },
            key: (c.id),
            ...{ class: "cluster-card" },
            ...{ style: ({ animationDelay: `${index * 0.1}s` }) },
            role: "button",
            tabindex: "0",
        });
        /** @type {__VLS_StyleScopedClasses['cluster-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "cluster-card__image" },
        });
        /** @type {__VLS_StyleScopedClasses['cluster-card__image']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
            src: (c.image),
            alt: (c.title),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "cluster-card__overlay" },
        });
        /** @type {__VLS_StyleScopedClasses['cluster-card__overlay']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "cluster-card__rating" },
        });
        /** @type {__VLS_StyleScopedClasses['cluster-card__rating']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            width: "14",
            height: "14",
            viewBox: "0 0 24 24",
            fill: "currentColor",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.polygon)({
            points: "12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26",
        });
        (c.rating);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "cluster-card__badge" },
        });
        /** @type {__VLS_StyleScopedClasses['cluster-card__badge']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "cluster-card__body" },
        });
        /** @type {__VLS_StyleScopedClasses['cluster-card__body']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "cluster-card__meta" },
        });
        /** @type {__VLS_StyleScopedClasses['cluster-card__meta']} */ ;
        (c.meta);
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
            ...{ class: "cluster-card__title" },
        });
        /** @type {__VLS_StyleScopedClasses['cluster-card__title']} */ ;
        (c.title);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "cluster-card__footer" },
        });
        /** @type {__VLS_StyleScopedClasses['cluster-card__footer']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "cluster-card__price" },
        });
        /** @type {__VLS_StyleScopedClasses['cluster-card__price']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "cluster-card__price-label" },
        });
        /** @type {__VLS_StyleScopedClasses['cluster-card__price-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "cluster-card__price-value" },
        });
        /** @type {__VLS_StyleScopedClasses['cluster-card__price-value']} */ ;
        (c.price.toLocaleString('ru-RU'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showClusters))
                        return;
                    __VLS_ctx.openClusterGallery(c.id);
                    // @ts-ignore
                    [openClusterGallery,];
                } },
            type: "button",
            ...{ class: "cluster-card__gallery" },
        });
        /** @type {__VLS_StyleScopedClasses['cluster-card__gallery']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            width: "16",
            height: "16",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
            x: "3",
            y: "3",
            width: "18",
            height: "18",
            rx: "2",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
            cx: "8.5",
            cy: "8.5",
            r: "1.5",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M21 15l-5-5L5 21",
        });
        // @ts-ignore
        [];
    }
}
let __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.Teleport | typeof __VLS_components.Teleport} */
Teleport;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    to: "body",
}));
const __VLS_2 = __VLS_1({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_5 } = __VLS_3.slots;
let __VLS_6;
/** @ts-ignore @type {typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
Transition;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
    name: "modal",
}));
const __VLS_8 = __VLS_7({
    name: "modal",
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
const { default: __VLS_11 } = __VLS_9.slots;
if (__VLS_ctx.isGalleryOpen) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeClusterGallery) },
        ...{ class: "gallery-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['gallery-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "gallery-modal__content" },
    });
    /** @type {__VLS_StyleScopedClasses['gallery-modal__content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "gallery-modal__header" },
    });
    /** @type {__VLS_StyleScopedClasses['gallery-modal__header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
        ...{ class: "gallery-modal__title" },
    });
    /** @type {__VLS_StyleScopedClasses['gallery-modal__title']} */ ;
    (__VLS_ctx.galleryClusterTitle);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeClusterGallery) },
        type: "button",
        ...{ class: "gallery-modal__close" },
    });
    /** @type {__VLS_StyleScopedClasses['gallery-modal__close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        width: "20",
        height: "20",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M18 6L6 18M6 6l12 12",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "gallery-modal__main" },
    });
    /** @type {__VLS_StyleScopedClasses['gallery-modal__main']} */ ;
    if (__VLS_ctx.galleryImages.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
            src: (__VLS_ctx.galleryImages[__VLS_ctx.galleryActiveIndex]),
            alt: "Фото кластера",
        });
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "gallery-modal__thumbs" },
    });
    /** @type {__VLS_StyleScopedClasses['gallery-modal__thumbs']} */ ;
    for (const [img, idx] of __VLS_vFor((__VLS_ctx.galleryImages))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.isGalleryOpen))
                        return;
                    __VLS_ctx.selectGalleryImage(idx);
                    // @ts-ignore
                    [isGalleryOpen, closeClusterGallery, closeClusterGallery, galleryClusterTitle, galleryImages, galleryImages, galleryImages, galleryActiveIndex, selectGalleryImage,];
                } },
            key: (idx),
            type: "button",
            ...{ class: "gallery-modal__thumb" },
            ...{ class: ({ 'gallery-modal__thumb--active': idx === __VLS_ctx.galleryActiveIndex }) },
        });
        /** @type {__VLS_StyleScopedClasses['gallery-modal__thumb']} */ ;
        /** @type {__VLS_StyleScopedClasses['gallery-modal__thumb--active']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
            src: (img),
            alt: (`Фото ${idx + 1}`),
        });
        // @ts-ignore
        [galleryActiveIndex,];
    }
}
// @ts-ignore
[];
var __VLS_9;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
});
export default {};

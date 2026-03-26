/// <reference types="C:/Users/Иван Жутяев/AppData/Local/npm-cache/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/Иван Жутяев/AppData/Local/npm-cache/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, ref, watch } from 'vue';
import AvalinViewer from '../components/AvalinViewer.vue';
const props = defineProps();
const emit = defineEmits();
const query = ref('');
const selectedPlaceId = ref('');
const show3DTour = ref(false);
const filteredPlaces = computed(() => {
    const q = query.value.trim().toLowerCase();
    if (!q)
        return props.cluster.places;
    return props.cluster.places.filter((p) => {
        return (p.title.toLowerCase().includes(q) ||
            p.location.toLowerCase().includes(q) ||
            p.fact.toLowerCase().includes(q));
    });
});
const selectedPlace = computed(() => {
    const list = filteredPlaces.value.length ? filteredPlaces.value : props.cluster.places;
    const found = list.find((p) => p.id === selectedPlaceId.value);
    return found ?? list[0];
});
const factParts = computed(() => {
    const words = selectedPlace.value.fact.split(/\s+/).filter(Boolean);
    const first = words[0] ?? '';
    const second = words[1] ?? '';
    return [first, second];
});
watch(() => props.cluster.id, () => {
    query.value = '';
    selectedPlaceId.value = props.cluster.places[0]?.id ?? '';
}, { immediate: true });
function toggleRoute() {
    emit('toggleRoutePlace', selectedPlace.value);
}
function toggle3DTour() {
    show3DTour.value = !show3DTour.value;
}
function has3DTour(place) {
    return !!place.avalinTourUrl;
}
function reviewStars(r) {
    const rating = r.rating ?? 5;
    const full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
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
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header__rating']} */ ;
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
/** @type {__VLS_StyleScopedClasses['place-item']} */ ;
/** @type {__VLS_StyleScopedClasses['tour-toggle']} */ ;
/** @type {__VLS_StyleScopedClasses['add-route-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['add-route-btn--added']} */ ;
/** @type {__VLS_StyleScopedClasses['cluster-content']} */ ;
/** @type {__VLS_StyleScopedClasses['cluster-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['place-detail']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header__title']} */ ;
/** @type {__VLS_StyleScopedClasses['cluster-main']} */ ;
/** @type {__VLS_StyleScopedClasses['place-header']} */ ;
/** @type {__VLS_StyleScopedClasses['add-route-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
    ...{ class: "cluster-page" },
});
/** @type {__VLS_StyleScopedClasses['cluster-page']} */ ;
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
(__VLS_ctx.cluster.title);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "page-header__subtitle" },
});
/** @type {__VLS_StyleScopedClasses['page-header__subtitle']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-header__rating" },
});
/** @type {__VLS_StyleScopedClasses['page-header__rating']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "currentColor",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.polygon)({
    points: "12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26",
});
(__VLS_ctx.selectedPlace.rating.toFixed(1));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "cluster-content" },
});
/** @type {__VLS_StyleScopedClasses['cluster-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.aside, __VLS_intrinsics.aside)({
    ...{ class: "cluster-sidebar" },
});
/** @type {__VLS_StyleScopedClasses['cluster-sidebar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "search-box" },
});
/** @type {__VLS_StyleScopedClasses['search-box']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
    cx: "11",
    cy: "11",
    r: "8",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M21 21l-4.35-4.35",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "search",
    placeholder: "Поиск места...",
    ...{ class: "search-input" },
});
(__VLS_ctx.query);
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "places-list" },
});
/** @type {__VLS_StyleScopedClasses['places-list']} */ ;
for (const [p] of __VLS_vFor((__VLS_ctx.filteredPlaces))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.selectedPlaceId = p.id;
                // @ts-ignore
                [cluster, selectedPlace, query, filteredPlaces, selectedPlaceId,];
            } },
        key: (p.id),
        type: "button",
        ...{ class: "place-item" },
        ...{ class: ({ 'place-item--active': p.id === __VLS_ctx.selectedPlace.id }) },
    });
    /** @type {__VLS_StyleScopedClasses['place-item']} */ ;
    /** @type {__VLS_StyleScopedClasses['place-item--active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        src: (p.photo),
        alt: (p.title),
        ...{ class: "place-item__image" },
    });
    /** @type {__VLS_StyleScopedClasses['place-item__image']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "place-item__info" },
    });
    /** @type {__VLS_StyleScopedClasses['place-item__info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "place-item__title" },
    });
    /** @type {__VLS_StyleScopedClasses['place-item__title']} */ ;
    (p.title);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "place-item__location" },
    });
    /** @type {__VLS_StyleScopedClasses['place-item__location']} */ ;
    (p.location);
    if (props.routePlaceIds.has(p.id)) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "place-item__badge" },
        });
        /** @type {__VLS_StyleScopedClasses['place-item__badge']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            width: "14",
            height: "14",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.polyline)({
            points: "20 6 9 17 4 12",
        });
    }
    // @ts-ignore
    [selectedPlace,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "cluster-main" },
});
/** @type {__VLS_StyleScopedClasses['cluster-main']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "place-detail" },
});
/** @type {__VLS_StyleScopedClasses['place-detail']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "place-image-section" },
});
/** @type {__VLS_StyleScopedClasses['place-image-section']} */ ;
if (__VLS_ctx.show3DTour && __VLS_ctx.has3DTour(__VLS_ctx.selectedPlace)) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "place-3d-tour" },
    });
    /** @type {__VLS_StyleScopedClasses['place-3d-tour']} */ ;
    const __VLS_0 = AvalinViewer;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        tourUrl: (__VLS_ctx.selectedPlace.avalinTourUrl),
        title: (__VLS_ctx.selectedPlace.title),
        height: "100%",
    }));
    const __VLS_2 = __VLS_1({
        tourUrl: (__VLS_ctx.selectedPlace.avalinTourUrl),
        title: (__VLS_ctx.selectedPlace.title),
        height: "100%",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        src: (__VLS_ctx.selectedPlace.photo),
        alt: (__VLS_ctx.selectedPlace.title),
        ...{ class: "place-image" },
    });
    /** @type {__VLS_StyleScopedClasses['place-image']} */ ;
}
if (__VLS_ctx.has3DTour(__VLS_ctx.selectedPlace)) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.toggle3DTour) },
        type: "button",
        ...{ class: "tour-toggle" },
    });
    /** @type {__VLS_StyleScopedClasses['tour-toggle']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        width: "16",
        height: "16",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
    });
    (__VLS_ctx.show3DTour ? 'Фото' : '3D тур');
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "place-image-overlay" },
});
/** @type {__VLS_StyleScopedClasses['place-image-overlay']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "place-price" },
});
/** @type {__VLS_StyleScopedClasses['place-price']} */ ;
(__VLS_ctx.selectedPlace.cost.toLocaleString('ru-RU'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "place-info" },
});
/** @type {__VLS_StyleScopedClasses['place-info']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "place-header" },
});
/** @type {__VLS_StyleScopedClasses['place-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
    ...{ class: "place-title" },
});
/** @type {__VLS_StyleScopedClasses['place-title']} */ ;
(__VLS_ctx.selectedPlace.title);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "place-location" },
});
/** @type {__VLS_StyleScopedClasses['place-location']} */ ;
(__VLS_ctx.selectedPlace.location);
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.toggleRoute) },
    type: "button",
    ...{ class: "add-route-btn" },
    ...{ class: ({ 'add-route-btn--added': props.routePlaceIds.has(__VLS_ctx.selectedPlace.id) }) },
});
/** @type {__VLS_StyleScopedClasses['add-route-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['add-route-btn--added']} */ ;
if (!props.routePlaceIds.has(__VLS_ctx.selectedPlace.id)) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        width: "18",
        height: "18",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M12 5v14M5 12h14",
    });
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        width: "18",
        height: "18",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.polyline)({
        points: "20 6 9 17 4 12",
    });
}
(props.routePlaceIds.has(__VLS_ctx.selectedPlace.id) ? 'В маршруте' : 'Добавить');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-card" },
});
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-card__label" },
});
/** @type {__VLS_StyleScopedClasses['info-card__label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "fact-text" },
});
/** @type {__VLS_StyleScopedClasses['fact-text']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.factParts[0]);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "fact-text--accent" },
});
/** @type {__VLS_StyleScopedClasses['fact-text--accent']} */ ;
(__VLS_ctx.factParts[1]);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "info-card" },
});
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-card__label" },
});
/** @type {__VLS_StyleScopedClasses['info-card__label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "description-text" },
});
/** @type {__VLS_StyleScopedClasses['description-text']} */ ;
(__VLS_ctx.selectedPlace.description);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "reviews-section" },
});
/** @type {__VLS_StyleScopedClasses['reviews-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "reviews-header" },
});
/** @type {__VLS_StyleScopedClasses['reviews-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "info-card__label" },
});
/** @type {__VLS_StyleScopedClasses['info-card__label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "reviews-count" },
});
/** @type {__VLS_StyleScopedClasses['reviews-count']} */ ;
(__VLS_ctx.selectedPlace.reviewsLabel);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "reviews-list" },
});
/** @type {__VLS_StyleScopedClasses['reviews-list']} */ ;
for (const [r] of __VLS_vFor((__VLS_ctx.selectedPlace.reviews.slice(0, 3)))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (r.id),
        ...{ class: "review-card" },
    });
    /** @type {__VLS_StyleScopedClasses['review-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "review-header" },
    });
    /** @type {__VLS_StyleScopedClasses['review-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "review-author" },
    });
    /** @type {__VLS_StyleScopedClasses['review-author']} */ ;
    (r.author);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "review-stars" },
    });
    /** @type {__VLS_StyleScopedClasses['review-stars']} */ ;
    (__VLS_ctx.reviewStars(r));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "review-text" },
    });
    /** @type {__VLS_StyleScopedClasses['review-text']} */ ;
    (r.text);
    // @ts-ignore
    [selectedPlace, selectedPlace, selectedPlace, selectedPlace, selectedPlace, selectedPlace, selectedPlace, selectedPlace, selectedPlace, selectedPlace, selectedPlace, selectedPlace, selectedPlace, selectedPlace, selectedPlace, show3DTour, show3DTour, has3DTour, has3DTour, toggle3DTour, toggleRoute, factParts, factParts, reviewStars,];
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};

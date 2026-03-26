/// <reference types="C:/Users/Иван Жутяев/AppData/Local/npm-cache/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/Иван Жутяев/AppData/Local/npm-cache/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, onMounted, ref, watch } from 'vue';
import LandingPage from './pages/LandingPage.vue';
import ClusterPage from './pages/ClusterPage.vue';
import RoutePlannerPage from './pages/RoutePlannerPage.vue';
import PartnerCabinetPage from './pages/PartnerCabinetPage.vue';
import { fetchClusters } from './api/clusters';
const mode = ref('landing');
const selectedCluster = ref(null);
const clustersRef = ref(null);
const clustersLoading = ref(false);
const routePlaces = ref([]);
const routePlaceIds = computed(() => new Set(routePlaces.value.map((p) => p.id)));
const isRouteOpen = ref(false);
const isPlannerOpen = ref(false);
const autoPlannerOpenedOnce = ref(false);
function openPlanner() {
    isPlannerOpen.value = true;
    autoPlannerOpenedOnce.value = true;
    mode.value = 'plan';
    isRouteOpen.value = false;
}
function openCluster(cluster) {
    selectedCluster.value = cluster;
    mode.value = 'cluster';
    isRouteOpen.value = false;
}
async function ensureClustersLoaded() {
    if (clustersRef.value)
        return clustersRef.value;
    if (clustersLoading.value)
        return clustersRef.value;
    clustersLoading.value = true;
    const result = await fetchClusters();
    clustersLoading.value = false;
    if (!result)
        return null;
    clustersRef.value = result.clusters;
    return clustersRef.value;
}
async function openClusterByPlaceId(placeId) {
    const clusterId = placeId.split('-')[0] ?? '';
    if (!clusterId)
        return;
    const clusters = await ensureClustersLoaded();
    const cluster = clusters?.get(clusterId);
    if (cluster)
        openCluster(cluster);
}
function backToLanding() {
    mode.value = 'landing';
    selectedCluster.value = null;
}
function backFromPlanner() {
    mode.value = selectedCluster.value ? 'cluster' : 'landing';
    isPlannerOpen.value = false;
}
function openPartner() {
    mode.value = 'partner';
}
function backFromPartner() {
    mode.value = 'landing';
}
watch(() => routePlaces.value.length, (len) => {
    if (len === 0) {
        autoPlannerOpenedOnce.value = false;
        return;
    }
    if (len === 1 && !autoPlannerOpenedOnce.value && mode.value === 'cluster' && selectedCluster.value) {
        autoPlannerOpenedOnce.value = true;
        mode.value = 'plan';
        isRouteOpen.value = false;
        isPlannerOpen.value = true;
    }
});
onMounted(() => {
    void ensureClustersLoaded();
});
function togglePlaceInRoute(place) {
    const idx = routePlaces.value.findIndex((p) => p.id === place.id);
    if (idx >= 0)
        routePlaces.value.splice(idx, 1);
    else
        routePlaces.value.push(place);
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['route-fab']} */ ;
/** @type {__VLS_StyleScopedClasses['route-fab']} */ ;
/** @type {__VLS_StyleScopedClasses['route-fab__glow']} */ ;
/** @type {__VLS_StyleScopedClasses['route-drawer__close']} */ ;
/** @type {__VLS_StyleScopedClasses['route-drawer__empty']} */ ;
/** @type {__VLS_StyleScopedClasses['route-item']} */ ;
/** @type {__VLS_StyleScopedClasses['route-item__remove']} */ ;
/** @type {__VLS_StyleScopedClasses['route-drawer__plan']} */ ;
/** @type {__VLS_StyleScopedClasses['route-drawer__plan']} */ ;
/** @type {__VLS_StyleScopedClasses['drawer-enter-active']} */ ;
/** @type {__VLS_StyleScopedClasses['route-drawer']} */ ;
/** @type {__VLS_StyleScopedClasses['drawer-leave-active']} */ ;
/** @type {__VLS_StyleScopedClasses['route-drawer']} */ ;
/** @type {__VLS_StyleScopedClasses['drawer-enter-from']} */ ;
/** @type {__VLS_StyleScopedClasses['route-drawer']} */ ;
/** @type {__VLS_StyleScopedClasses['drawer-leave-to']} */ ;
/** @type {__VLS_StyleScopedClasses['route-drawer']} */ ;
/** @type {__VLS_StyleScopedClasses['route-fab']} */ ;
/** @type {__VLS_StyleScopedClasses['route-drawer__footer']} */ ;
/** @type {__VLS_StyleScopedClasses['route-drawer__total']} */ ;
/** @type {__VLS_StyleScopedClasses['route-drawer__plan']} */ ;
let __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
Transition;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    name: "page",
    mode: "out-in",
}));
const __VLS_2 = __VLS_1({
    name: "page",
    mode: "out-in",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_5 } = __VLS_3.slots;
if (__VLS_ctx.mode === 'landing') {
    const __VLS_6 = LandingPage;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        ...{ 'onOpenCluster': {} },
        ...{ 'onOpenPlanner': {} },
        ...{ 'onOpenPartner': {} },
        key: "landing",
    }));
    const __VLS_8 = __VLS_7({
        ...{ 'onOpenCluster': {} },
        ...{ 'onOpenPlanner': {} },
        ...{ 'onOpenPartner': {} },
        key: "landing",
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    let __VLS_11;
    const __VLS_12 = ({ openCluster: {} },
        { onOpenCluster: (__VLS_ctx.openCluster) });
    const __VLS_13 = ({ openPlanner: {} },
        { onOpenPlanner: (__VLS_ctx.openPlanner) });
    const __VLS_14 = ({ openPartner: {} },
        { onOpenPartner: (__VLS_ctx.openPartner) });
    var __VLS_9;
    var __VLS_10;
}
else if (__VLS_ctx.mode === 'cluster' && __VLS_ctx.selectedCluster) {
    const __VLS_15 = ClusterPage;
    // @ts-ignore
    const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
        ...{ 'onBack': {} },
        ...{ 'onToggleRoutePlace': {} },
        key: "cluster",
        cluster: (__VLS_ctx.selectedCluster),
        routePlaceIds: (__VLS_ctx.routePlaceIds),
    }));
    const __VLS_17 = __VLS_16({
        ...{ 'onBack': {} },
        ...{ 'onToggleRoutePlace': {} },
        key: "cluster",
        cluster: (__VLS_ctx.selectedCluster),
        routePlaceIds: (__VLS_ctx.routePlaceIds),
    }, ...__VLS_functionalComponentArgsRest(__VLS_16));
    let __VLS_20;
    const __VLS_21 = ({ back: {} },
        { onBack: (__VLS_ctx.backToLanding) });
    const __VLS_22 = ({ toggleRoutePlace: {} },
        { onToggleRoutePlace: (__VLS_ctx.togglePlaceInRoute) });
    var __VLS_18;
    var __VLS_19;
}
else if (__VLS_ctx.mode === 'plan') {
    const __VLS_23 = RoutePlannerPage;
    // @ts-ignore
    const __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({
        ...{ 'onBack': {} },
        ...{ 'onOpenClusterByPlaceId': {} },
        key: "plan",
        routePlaces: (__VLS_ctx.routePlaces),
    }));
    const __VLS_25 = __VLS_24({
        ...{ 'onBack': {} },
        ...{ 'onOpenClusterByPlaceId': {} },
        key: "plan",
        routePlaces: (__VLS_ctx.routePlaces),
    }, ...__VLS_functionalComponentArgsRest(__VLS_24));
    let __VLS_28;
    const __VLS_29 = ({ back: {} },
        { onBack: (__VLS_ctx.backFromPlanner) });
    const __VLS_30 = ({ openClusterByPlaceId: {} },
        { onOpenClusterByPlaceId: (__VLS_ctx.openClusterByPlaceId) });
    var __VLS_26;
    var __VLS_27;
}
else if (__VLS_ctx.mode === 'partner') {
    const __VLS_31 = PartnerCabinetPage;
    // @ts-ignore
    const __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({
        ...{ 'onBack': {} },
        key: "partner",
    }));
    const __VLS_33 = __VLS_32({
        ...{ 'onBack': {} },
        key: "partner",
    }, ...__VLS_functionalComponentArgsRest(__VLS_32));
    let __VLS_36;
    const __VLS_37 = ({ back: {} },
        { onBack: (__VLS_ctx.backFromPartner) });
    var __VLS_34;
    var __VLS_35;
}
// @ts-ignore
[mode, mode, mode, mode, openCluster, openPlanner, openPartner, selectedCluster, selectedCluster, routePlaceIds, backToLanding, togglePlaceInRoute, routePlaces, backFromPlanner, openClusterByPlaceId, backFromPartner,];
var __VLS_3;
let __VLS_38;
/** @ts-ignore @type {typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
Transition;
// @ts-ignore
const __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({
    name: "fab",
}));
const __VLS_40 = __VLS_39({
    name: "fab",
}, ...__VLS_functionalComponentArgsRest(__VLS_39));
const { default: __VLS_43 } = __VLS_41.slots;
if (__VLS_ctx.mode !== 'plan' && __VLS_ctx.mode !== 'partner') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.mode !== 'plan' && __VLS_ctx.mode !== 'partner'))
                    return;
                __VLS_ctx.routePlaces.length > 0 ? (__VLS_ctx.isRouteOpen = !__VLS_ctx.isRouteOpen) : __VLS_ctx.openPlanner();
                // @ts-ignore
                [mode, mode, openPlanner, routePlaces, isRouteOpen, isRouteOpen,];
            } },
        type: "button",
        ...{ class: "route-fab" },
        ...{ class: ({ 'route-fab--active': __VLS_ctx.routePlaces.length > 0 }) },
        'aria-label': (__VLS_ctx.routePlaces.length > 0 ? `Открыть маршрут. В нём ${__VLS_ctx.routePlaces.length} мест` : 'Подобрать маршрут'),
    });
    /** @type {__VLS_StyleScopedClasses['route-fab']} */ ;
    /** @type {__VLS_StyleScopedClasses['route-fab--active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "route-fab__glow" },
    });
    /** @type {__VLS_StyleScopedClasses['route-fab__glow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "route-fab__icon" },
    });
    /** @type {__VLS_StyleScopedClasses['route-fab__icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        width: "18",
        height: "18",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "route-fab__text" },
    });
    /** @type {__VLS_StyleScopedClasses['route-fab__text']} */ ;
    (__VLS_ctx.routePlaces.length > 0 ? `Маршрут: ${__VLS_ctx.routePlaces.length}` : 'Подобрать маршрут');
    if (__VLS_ctx.routePlaces.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "route-fab__badge" },
        });
        /** @type {__VLS_StyleScopedClasses['route-fab__badge']} */ ;
        (__VLS_ctx.routePlaces.length);
    }
}
// @ts-ignore
[routePlaces, routePlaces, routePlaces, routePlaces, routePlaces, routePlaces, routePlaces,];
var __VLS_41;
let __VLS_44;
/** @ts-ignore @type {typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
Transition;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
    name: "drawer",
}));
const __VLS_46 = __VLS_45({
    name: "drawer",
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
const { default: __VLS_49 } = __VLS_47.slots;
if (__VLS_ctx.isRouteOpen) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.isRouteOpen))
                    return;
                __VLS_ctx.isRouteOpen = false;
                // @ts-ignore
                [isRouteOpen, isRouteOpen,];
            } },
        ...{ class: "route-drawer-overlay" },
        role: "dialog",
        'aria-modal': "true",
    });
    /** @type {__VLS_StyleScopedClasses['route-drawer-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "route-drawer" },
    });
    /** @type {__VLS_StyleScopedClasses['route-drawer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "route-drawer__header" },
    });
    /** @type {__VLS_StyleScopedClasses['route-drawer__header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "route-drawer__header-content" },
    });
    /** @type {__VLS_StyleScopedClasses['route-drawer__header-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "route-drawer__icon" },
    });
    /** @type {__VLS_StyleScopedClasses['route-drawer__icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        width: "20",
        height: "20",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        ...{ class: "route-drawer__title" },
    });
    /** @type {__VLS_StyleScopedClasses['route-drawer__title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "route-drawer__count" },
    });
    /** @type {__VLS_StyleScopedClasses['route-drawer__count']} */ ;
    (__VLS_ctx.routePlaces.length);
    (__VLS_ctx.routePlaces.length === 1 ? 'место' : 'мест');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.isRouteOpen))
                    return;
                __VLS_ctx.isRouteOpen = false;
                // @ts-ignore
                [routePlaces, routePlaces, isRouteOpen,];
            } },
        type: "button",
        ...{ class: "route-drawer__close" },
    });
    /** @type {__VLS_StyleScopedClasses['route-drawer__close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        width: "18",
        height: "18",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M18 6L6 18M6 6l12 12",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "route-drawer__list" },
        role: "list",
    });
    /** @type {__VLS_StyleScopedClasses['route-drawer__list']} */ ;
    let __VLS_50;
    /** @ts-ignore @type {typeof __VLS_components.TransitionGroup | typeof __VLS_components.TransitionGroup} */
    TransitionGroup;
    // @ts-ignore
    const __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({
        name: "list",
    }));
    const __VLS_52 = __VLS_51({
        name: "list",
    }, ...__VLS_functionalComponentArgsRest(__VLS_51));
    const { default: __VLS_55 } = __VLS_53.slots;
    for (const [p, index] of __VLS_vFor((__VLS_ctx.routePlaces))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (p.id),
            ...{ class: "route-item" },
            role: "listitem",
            ...{ style: ({ animationDelay: `${index * 0.05}s` }) },
        });
        /** @type {__VLS_StyleScopedClasses['route-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "route-item__number" },
        });
        /** @type {__VLS_StyleScopedClasses['route-item__number']} */ ;
        (index + 1);
        __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
            src: (p.photo),
            ...{ class: "route-item__img" },
            alt: (p.title),
        });
        /** @type {__VLS_StyleScopedClasses['route-item__img']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "route-item__body" },
        });
        /** @type {__VLS_StyleScopedClasses['route-item__body']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "route-item__top" },
        });
        /** @type {__VLS_StyleScopedClasses['route-item__top']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "route-item__title" },
        });
        /** @type {__VLS_StyleScopedClasses['route-item__title']} */ ;
        (p.title);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "route-item__cost" },
        });
        /** @type {__VLS_StyleScopedClasses['route-item__cost']} */ ;
        (p.cost.toLocaleString('ru-RU'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "route-item__loc" },
        });
        /** @type {__VLS_StyleScopedClasses['route-item__loc']} */ ;
        (p.location);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.isRouteOpen))
                        return;
                    __VLS_ctx.togglePlaceInRoute(p);
                    // @ts-ignore
                    [togglePlaceInRoute, routePlaces,];
                } },
            type: "button",
            ...{ class: "route-item__remove" },
            title: "Убрать из маршрута",
        });
        /** @type {__VLS_StyleScopedClasses['route-item__remove']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            width: "16",
            height: "16",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M18 6L6 18M6 6l12 12",
        });
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_53;
    if (__VLS_ctx.routePlaces.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "route-drawer__empty" },
        });
        /** @type {__VLS_StyleScopedClasses['route-drawer__empty']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            width: "48",
            height: "48",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "1.5",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "route-drawer__footer" },
    });
    /** @type {__VLS_StyleScopedClasses['route-drawer__footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "route-drawer__total" },
    });
    /** @type {__VLS_StyleScopedClasses['route-drawer__total']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "route-drawer__total-label" },
    });
    /** @type {__VLS_StyleScopedClasses['route-drawer__total-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "route-drawer__total-value" },
    });
    /** @type {__VLS_StyleScopedClasses['route-drawer__total-value']} */ ;
    (__VLS_ctx.routePlaces.reduce((sum, p) => sum + p.cost, 0).toLocaleString('ru-RU'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.openPlanner) },
        type: "button",
        ...{ class: "route-drawer__plan" },
        disabled: (__VLS_ctx.routePlaces.length === 0),
    });
    /** @type {__VLS_StyleScopedClasses['route-drawer__plan']} */ ;
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
}
// @ts-ignore
[openPlanner, routePlaces, routePlaces, routePlaces,];
var __VLS_47;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};

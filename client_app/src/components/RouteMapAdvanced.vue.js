/// <reference types="C:/Users/Иван Жутяев/AppData/Local/npm-cache/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/Иван Жутяев/AppData/Local/npm-cache/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { onMounted, onBeforeUnmount, watch, nextTick, ref } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.js';
const props = defineProps();
const emit = defineEmits();
let map = null;
let markers = [];
let routingControls = [];
let mapEl = null;
// Тип маршрута - можно переключать
const routeProfile = ref('driving');
const showRouteInfo = ref(false);
const DAY_COLORS = {
    0: '#00c2ff',
    1: '#ff6b6b',
    2: '#6bffb8',
};
const DAY_GLOW = {
    0: 'rgba(0,194,255,0.55)',
    1: 'rgba(255,107,107,0.55)',
    2: 'rgba(107,255,184,0.55)',
};
const PROFILE_ICONS = {
    driving: '🚗',
    walking: '🚶',
    cycling: '🚴'
};
const PROFILE_NAMES = {
    driving: 'На машине',
    walking: 'Пешком',
    cycling: 'На велосипеде'
};
function getColor(day) {
    return DAY_COLORS[day] ?? '#fff';
}
function getGlow(day) {
    return DAY_GLOW[day] ?? 'rgba(255,255,255,0.4)';
}
function makeIcon(point, index, isActive) {
    const color = getColor(point.day);
    const glow = getGlow(point.day);
    const size = isActive ? 44 : 36;
    const fontSize = isActive ? 16 : 13;
    const shadow = isActive
        ? `0 0 0 4px ${glow}, 0 8px 28px rgba(0,0,0,0.55)`
        : `0 4px 14px rgba(0,0,0,0.45)`;
    const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: rgba(16,18,28,0.92);
      border: 2.5px solid ${color};
      box-shadow: ${shadow};
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: ${fontSize}px;
      color: ${color};
      font-family: system-ui, sans-serif;
      transition: all 220ms ease;
      cursor: pointer;
      position: relative;
    ">
      ${index + 1}
      ${isActive ? `<div style="
        position: absolute;
        inset: -6px;
        border-radius: 50%;
        border: 2px solid ${color};
        opacity: 0.45;
        animation: pulseRing 1.4s ease-out infinite;
      "></div>` : ''}
    </div>
  `;
    return L.divIcon({
        html,
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -(size / 2 + 4)],
    });
}
function makePopup(point) {
    const color = getColor(point.day);
    return `
    <div style="
      background: rgba(16,18,28,0.97);
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 16px;
      padding: 12px;
      min-width: 220px;
      max-width: 260px;
      font-family: system-ui, sans-serif;
      color: rgba(255,255,255,0.96);
      box-shadow: 0 20px 60px rgba(0,0,0,0.65);
    ">
      ${point.photo ? `<img src="${point.photo}" style="width:100%;height:110px;object-fit:cover;border-radius:12px;border:1px solid rgba(255,255,255,0.12);margin-bottom:10px;display:block;" />` : ''}
      <div style="font-size:11px;opacity:0.75;margin-bottom:4px;">
        День ${point.day + 1} · ${point.slot}
      </div>
      <div style="font-weight:900;font-size:14px;line-height:1.25;margin-bottom:5px;">
        ${point.title}
      </div>
      <div style="font-size:12px;opacity:0.82;margin-bottom:7px;">
        ${point.location}
      </div>
      <div style="display:flex;gap:10px;align-items:center;">
        <span style="color:#ffd600;font-size:12px;">★ ${point.rating.toFixed(1)}</span>
        <span style="
          background: rgba(${point.day === 0 ? '0,194,255' : point.day === 1 ? '255,107,107' : '107,255,184'},0.16);
          border: 1px solid ${color};
          border-radius: 999px;
          padding: 3px 9px;
          font-size:12px;
          font-weight:900;
          color: ${color};
        ">${point.cost} ₽</span>
      </div>
    </div>
  `;
}
function buildMap() {
    if (!mapEl)
        return;
    map = L.map(mapEl, {
        zoomControl: true,
        attributionControl: false,
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
    }).addTo(map);
    L.control.attribution({ prefix: false })
        .addAttribution('© <a href="https://carto.com/">CARTO</a> | © <a href="https://www.openstreetmap.org/copyright">OSM</a>')
        .addTo(map);
    renderPoints();
}
function renderPoints() {
    if (!map)
        return;
    // Очищаем старые маркеры и маршруты
    markers.forEach((m) => m.remove());
    markers = [];
    routingControls.forEach(control => map.removeControl(control));
    routingControls = [];
    if (!props.points.length)
        return;
    // Создаем маркеры
    props.points.forEach((pt, idx) => {
        const isActive = pt.id === props.activePointId;
        const icon = makeIcon(pt, idx, isActive);
        const marker = L.marker([pt.lat, pt.lon], { icon, zIndexOffset: isActive ? 1000 : idx * 10 });
        marker.bindPopup(makePopup(pt), {
            className: 'route-popup',
            maxWidth: 270,
            closeButton: false,
        });
        marker.on('click', () => {
            emit('selectPoint', pt.id);
        });
        marker.addTo(map);
        markers.push(marker);
    });
    // Группируем точки по дням для создания отдельных маршрутов
    const pointsByDay = new Map();
    props.points.forEach(point => {
        if (!pointsByDay.has(point.day)) {
            pointsByDay.set(point.day, []);
        }
        pointsByDay.get(point.day).push(point);
    });
    // Создаем маршруты для каждого дня
    pointsByDay.forEach((dayPoints, day) => {
        if (dayPoints.length < 2)
            return;
        const waypoints = dayPoints.map(point => L.latLng(point.lat, point.lon));
        // Создаем маршрут для каждого дня с выбранным профилем
        const dayRoutingControl = L.Routing.control({
            waypoints: waypoints,
            router: L.Routing.osrmv1({
                serviceUrl: 'https://router.project-osrm.org',
                profile: routeProfile.value
            }),
            lineOptions: {
                styles: [{
                        color: getColor(day),
                        weight: routeProfile.value === 'walking' ? 5 : 4,
                        opacity: 0.8,
                        dashArray: routeProfile.value === 'walking' ? '10,5' : undefined
                    }],
                extendToWaypoints: false,
                missingRouteTolerance: 0
            },
            addWaypoints: false,
            createMarker: () => null,
            routeWhileDragging: false,
            show: false,
            fitSelectedRoutes: false,
            useZoomParameter: false,
        }).on('routesfound', (e) => {
            // Можно добавить обработку информации о маршруте
            const routes = e.routes;
            if (routes && routes[0]) {
                const summary = routes[0].summary;
                console.log(`Маршрут дня ${day + 1}: ${(summary.totalDistance / 1000).toFixed(1)} км, ${Math.round(summary.totalTime / 60)} мин`);
            }
        }).addTo(map);
        routingControls.push(dayRoutingControl);
        // Скрываем панель инструкций
        setTimeout(() => {
            const instructionsContainer = dayRoutingControl.getContainer();
            if (instructionsContainer) {
                instructionsContainer.style.display = 'none';
            }
        }, 100);
    });
    // Настраиваем вид карты
    if (props.points.length === 1) {
        map.setView([props.points[0].lat, props.points[0].lon], 11, { animate: true });
    }
    else {
        const bounds = L.latLngBounds(props.points.map(p => [p.lat, p.lon]));
        map.fitBounds(bounds.pad(0.22), { animate: true, maxZoom: 12 });
    }
}
function flyToActive() {
    if (!map || !props.activePointId)
        return;
    const idx = props.points.findIndex((p) => p.id === props.activePointId);
    if (idx < 0)
        return;
    const pt = props.points[idx];
    map.flyTo([pt.lat, pt.lon], 13, { duration: 0.9, easeLinearity: 0.3 });
    const marker = markers[idx];
    if (marker) {
        setTimeout(() => marker.openPopup(), 700);
    }
    markers.forEach((m, i) => {
        const point = props.points[i];
        const isActive = point.id === props.activePointId;
        m.setIcon(makeIcon(point, i, isActive));
    });
}
function switchProfile(profile) {
    routeProfile.value = profile;
    renderPoints();
}
onMounted(async () => {
    await nextTick();
    mapEl = document.getElementById('route-leaflet-map');
    if (mapEl)
        buildMap();
});
onBeforeUnmount(() => {
    if (map) {
        map.remove();
        map = null;
    }
});
watch(() => props.points, async () => {
    await nextTick();
    if (!map) {
        mapEl = document.getElementById('route-leaflet-map');
        if (mapEl)
            buildMap();
    }
    else {
        renderPoints();
    }
}, { deep: true });
watch(() => props.activePointId, () => {
    flyToActive();
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
/** @type {__VLS_StyleScopedClasses['routeMap__profileBtn']} */ ;
/** @type {__VLS_StyleScopedClasses['routeMap__controls']} */ ;
/** @type {__VLS_StyleScopedClasses['routeMap__legend']} */ ;
/** @type {__VLS_StyleScopedClasses['routeMap__profileSelector']} */ ;
/** @type {__VLS_StyleScopedClasses['routeMap__map']} */ ;
/** @type {__VLS_StyleScopedClasses['routeMap__info']} */ ;
/** @type {__VLS_StyleScopedClasses['routeMap__infoItem']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "routeMap" },
});
/** @type {__VLS_StyleScopedClasses['routeMap']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "routeMap__controls" },
});
/** @type {__VLS_StyleScopedClasses['routeMap__controls']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "routeMap__legend" },
});
/** @type {__VLS_StyleScopedClasses['routeMap__legend']} */ ;
for (const [day] of __VLS_vFor(([0, 1, 2]))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (day),
        ...{ class: "routeMap__legendItem" },
        ...{ style: ({ '--day-color': __VLS_ctx.DAY_COLORS[day] }) },
    });
    /** @type {__VLS_StyleScopedClasses['routeMap__legendItem']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
        ...{ class: "routeMap__legendDot" },
    });
    /** @type {__VLS_StyleScopedClasses['routeMap__legendDot']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "routeMap__legendLabel" },
    });
    /** @type {__VLS_StyleScopedClasses['routeMap__legendLabel']} */ ;
    (day + 1);
    // @ts-ignore
    [DAY_COLORS,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "routeMap__profileSelector" },
});
/** @type {__VLS_StyleScopedClasses['routeMap__profileSelector']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "routeMap__profileLabel" },
});
/** @type {__VLS_StyleScopedClasses['routeMap__profileLabel']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "routeMap__profileButtons" },
});
/** @type {__VLS_StyleScopedClasses['routeMap__profileButtons']} */ ;
for (const [name, profile] of __VLS_vFor((__VLS_ctx.PROFILE_NAMES))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.switchProfile(profile);
                // @ts-ignore
                [PROFILE_NAMES, switchProfile,];
            } },
        key: (profile),
        type: "button",
        ...{ class: "routeMap__profileBtn" },
        ...{ class: ({ 'routeMap__profileBtn--active': __VLS_ctx.routeProfile === profile }) },
    });
    /** @type {__VLS_StyleScopedClasses['routeMap__profileBtn']} */ ;
    /** @type {__VLS_StyleScopedClasses['routeMap__profileBtn--active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "routeMap__profileIcon" },
    });
    /** @type {__VLS_StyleScopedClasses['routeMap__profileIcon']} */ ;
    (__VLS_ctx.PROFILE_ICONS[profile]);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "routeMap__profileName" },
    });
    /** @type {__VLS_StyleScopedClasses['routeMap__profileName']} */ ;
    (name);
    // @ts-ignore
    [routeProfile, PROFILE_ICONS,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "routeMap__info" },
});
/** @type {__VLS_StyleScopedClasses['routeMap__info']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "routeMap__infoItem" },
});
/** @type {__VLS_StyleScopedClasses['routeMap__infoItem']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "routeMap__infoIcon" },
});
/** @type {__VLS_StyleScopedClasses['routeMap__infoIcon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "routeMap__infoText" },
});
/** @type {__VLS_StyleScopedClasses['routeMap__infoText']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "routeMap__infoItem" },
});
/** @type {__VLS_StyleScopedClasses['routeMap__infoItem']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "routeMap__infoIcon" },
});
/** @type {__VLS_StyleScopedClasses['routeMap__infoIcon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "routeMap__infoText" },
});
/** @type {__VLS_StyleScopedClasses['routeMap__infoText']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "routeMap__infoItem" },
});
/** @type {__VLS_StyleScopedClasses['routeMap__infoItem']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "routeMap__infoIcon" },
});
/** @type {__VLS_StyleScopedClasses['routeMap__infoIcon']} */ ;
(__VLS_ctx.PROFILE_ICONS[__VLS_ctx.routeProfile]);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "routeMap__infoText" },
});
/** @type {__VLS_StyleScopedClasses['routeMap__infoText']} */ ;
(__VLS_ctx.PROFILE_NAMES[__VLS_ctx.routeProfile]);
__VLS_asFunctionalElement1(__VLS_intrinsics.div)({
    id: "route-leaflet-map",
    ...{ class: "routeMap__map" },
    'aria-label': "Интерактивная карта маршрута",
});
/** @type {__VLS_StyleScopedClasses['routeMap__map']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "routeMap__hint" },
});
/** @type {__VLS_StyleScopedClasses['routeMap__hint']} */ ;
const __VLS_0 = ('style');
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_5 } = __VLS_3.slots;
(`
        @keyframes pulseRing {
          0%   { transform: scale(1);   opacity: 0.5; }
          70%  { transform: scale(1.5); opacity: 0;   }
          100% { transform: scale(1.5); opacity: 0;   }
        }
        .route-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .route-popup .leaflet-popup-content {
          margin: 0 !important;
        }
        .route-popup .leaflet-popup-tip-container {
          display: none !important;
        }
        .leaflet-control-zoom a {
          background: rgba(16,18,28,0.92) !important;
          border-color: rgba(255,255,255,0.18) !important;
          color: rgba(255,255,255,0.9) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(0,194,255,0.18) !important;
        }
        .leaflet-control-attribution {
          background: rgba(16,18,28,0.75) !important;
          color: rgba(255,255,255,0.5) !important;
          font-size: 10px !important;
        }
        .leaflet-control-attribution a {
          color: rgba(0,194,255,0.8) !important;
        }
        .leaflet-routing-container {
          display: none !important;
        }
      `);
// @ts-ignore
[PROFILE_NAMES, routeProfile, routeProfile, PROFILE_ICONS,];
var __VLS_3;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};

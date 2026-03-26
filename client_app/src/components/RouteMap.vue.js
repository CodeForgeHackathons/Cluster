/// <reference types="C:/Users/Иван Жутяев/AppData/Local/npm-cache/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/Иван Жутяев/AppData/Local/npm-cache/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
const props = defineProps();
const emit = defineEmits();
let map = null;
let markers = [];
let polyline = null;
let mapEl = null;
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
    markers.forEach((m) => m.remove());
    markers = [];
    if (polyline) {
        polyline.remove();
        polyline = null;
    }
    if (!props.points.length)
        return;
    const latlngs = [];
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
        latlngs.push([pt.lat, pt.lon]);
    });
    // Линия маршрута с градиентным эффектом (через несколько Polyline по сегментам)
    for (let i = 0; i < latlngs.length - 1; i++) {
        const day = props.points[i]?.day ?? 0;
        L.polyline([latlngs[i], latlngs[i + 1]], {
            color: getColor(day),
            weight: 3,
            opacity: 0.7,
            dashArray: '8 6',
        }).addTo(map);
    }
    // Основная полилиния (невидимая, для fitBounds)
    polyline = L.polyline(latlngs, { opacity: 0 }).addTo(map);
    if (latlngs.length === 1) {
        map.setView(latlngs[0], 11, { animate: true });
    }
    else {
        map.fitBounds(polyline.getBounds().pad(0.22), { animate: true, maxZoom: 12 });
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
    // Открываем попап для активного маркера
    const marker = markers[idx];
    if (marker) {
        setTimeout(() => marker.openPopup(), 700);
    }
    // Обновляем иконки (active/inactive)
    markers.forEach((m, i) => {
        const point = props.points[i];
        const isActive = point.id === props.activePointId;
        m.setIcon(makeIcon(point, i, isActive));
    });
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
/** @type {__VLS_StyleScopedClasses['routeMap__map']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "routeMap" },
});
/** @type {__VLS_StyleScopedClasses['routeMap']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "routeMap__legend" },
    'aria-label': "Легенда дней маршрута",
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
      `);
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};

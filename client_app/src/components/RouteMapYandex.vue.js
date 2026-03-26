/// <reference types="C:/Users/Иван Жутяев/AppData/Local/npm-cache/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/Иван Жутяев/AppData/Local/npm-cache/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
const props = defineProps();
const emit = defineEmits();
let map = null;
let markers = [];
let routeLines = [];
let mapEl = null;
// Yandex Maps API ключ (нужно будет получить)
const YANDEX_API_KEY = '0e24184e-ed66-4a25-a5d3-27188c22426c'; // Замените на реальный ключ
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
    return `
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
// Функция для построения маршрута через Yandex Maps API
async function buildYandexRoute(points) {
    if (!map || points.length < 2)
        return;
    const day = points[0]?.day ?? 0;
    const color = getColor(day);
    try {
        console.log(`Строим Yandex маршрут дня ${day + 1} для ${points.length} точек`);
        // Создаем мультимаршрут через Yandex Maps API
        const multiRoute = new ymaps.multiRouter.multiRoute({
            referencePoints: points.map(p => [p.lat, p.lon]), // Правильный порядок: [lat, lon]
            params: {
                routingMode: 'auto', // 'auto', 'pedestrian', 'masstransit'
                avoidTrafficJams: true,
                results: 1
            }
        });
        // Добавляем маршрут на карту сразу
        map.geoObjects.add(multiRoute);
        routeLines.push(multiRoute);
        // Обрабатываем построение маршрута
        multiRoute.model.events.add('requestsuccess', function () {
            console.log(`Yandex маршрут дня ${day + 1} построен успешно`);
            // Изменяем стиль маршрута
            const routes = multiRoute.getRoutes();
            if (routes.length > 0) {
                const route = routes[0];
                const paths = route.getPaths();
                paths.forEach((path) => {
                    path.options.set({
                        strokeColor: color,
                        strokeWidth: 4,
                        strokeOpacity: 0.8,
                        strokeStyle: 'solid'
                    });
                });
            }
        });
        multiRoute.model.events.add('requestfail', function (error) {
            console.error('Ошибка построения Yandex маршрута:', error);
            // Fallback: прямая линия
            drawFallbackRoute(points, color);
        });
    }
    catch (error) {
        console.error('Ошибка Yandex Maps API:', error);
        drawFallbackRoute(points, color);
    }
}
// Fallback функция для прямых линий
function drawFallbackRoute(points, color) {
    if (!map || points.length < 2)
        return;
    const coordinates = points.map(p => [p.lat, p.lon]); // Правильный порядок: [lat, lon]
    const polyline = new ymaps.Polyline(coordinates, {
        strokeColor: color,
        strokeWidth: 3,
        strokeOpacity: 0.6,
        strokeStyle: 'dash'
    });
    map.geoObjects.add(polyline);
    routeLines.push(polyline);
    console.log(`Fallback маршрут дня ${points[0].day + 1}: прямая линия`);
}
function initYandexMaps() {
    if (!mapEl)
        return;
    // Загружаем Yandex Maps API
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=${YANDEX_API_KEY}`;
    script.type = 'text/javascript';
    script.onload = () => {
        ymaps.ready(() => {
            map = new ymaps.Map(mapEl, {
                center: [45.0355, 38.9753], // Краснодар
                zoom: 10,
                controls: ['zoomControl', 'typeSelector', 'fullscreenControl']
            });
            renderPoints();
        });
    };
    document.head.appendChild(script);
}
function renderPoints() {
    if (!map)
        return;
    // Очищаем старые маркеры и линии
    markers.forEach(m => map.geoObjects.remove(m));
    markers = [];
    routeLines.forEach(l => map.geoObjects.remove(l));
    routeLines = [];
    if (!props.points.length)
        return;
    // Создаем маркеры
    props.points.forEach((pt, idx) => {
        const isActive = pt.id === props.activePointId;
        const iconContent = makeIcon(pt, idx, isActive);
        const placemark = new ymaps.Placemark([pt.lat, pt.lon], {
            balloonContent: makePopup(pt)
        }, {
            preset: 'islands#darkBlueDotIcon',
            iconLayout: 'default#imageWithContent'
        });
        placemark.events.add('click', () => {
            emit('selectPoint', pt.id);
        });
        map.geoObjects.add(placemark);
        markers.push(placemark);
    });
    // Группируем точки по дням для построения маршрутов
    const pointsByDay = new Map();
    props.points.forEach(point => {
        if (!pointsByDay.has(point.day)) {
            pointsByDay.set(point.day, []);
        }
        pointsByDay.get(point.day).push(point);
    });
    // Строим маршруты для каждого дня
    for (const [day, dayPoints] of pointsByDay) {
        if (dayPoints.length >= 2) {
            buildYandexRoute(dayPoints);
        }
    }
    // Настраиваем вид карты
    if (props.points.length === 1) {
        map.setCenter([props.points[0].lat, props.points[0].lon], 11);
    }
    else {
        const bounds = props.points.map(p => [p.lat, p.lon]);
        map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 50 });
    }
}
function flyToActive() {
    if (!map || !props.activePointId)
        return;
    const idx = props.points.findIndex((p) => p.id === props.activePointId);
    if (idx < 0)
        return;
    const pt = props.points[idx];
    map.setCenter([pt.lat, pt.lon], 13, {
        duration: 900,
        timingFunction: 'ease-in-out'
    });
    // Открываем балун для активного маркера
    const marker = markers[idx];
    if (marker) {
        setTimeout(() => {
            marker.balloon.open();
        }, 700);
    }
}
onMounted(async () => {
    await nextTick();
    mapEl = document.getElementById('route-leaflet-map');
    if (mapEl)
        initYandexMaps();
});
onBeforeUnmount(() => {
    if (map) {
        map.destroy();
        map = null;
    }
});
watch(() => props.points, async () => {
    await nextTick();
    if (!map) {
        mapEl = document.getElementById('route-leaflet-map');
        if (mapEl)
            initYandexMaps();
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
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "routeMap__infoText" },
});
/** @type {__VLS_StyleScopedClasses['routeMap__infoText']} */ ;
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

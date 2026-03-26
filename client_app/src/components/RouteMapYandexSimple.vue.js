/// <reference types="C:/Users/Иван Жутяев/AppData/Local/npm-cache/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/Иван Жутяев/AppData/Local/npm-cache/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
const props = defineProps();
const emit = defineEmits();
let map = null;
let markers = [];
let routes = [];
let mapEl = null;
const YANDEX_API_KEY = '0e24184e-ed66-4a25-a5d3-27188c22426c';
// Глобальный флаг для отслеживания загрузки API
if (typeof window !== 'undefined') {
    window.YANDEX_API_LOADING = false;
}
const DAY_COLORS = {
    0: '#00c2ff',
    1: '#ff6b6b',
    2: '#6bffb8',
};
function getColor(day) {
    return DAY_COLORS[day] ?? '#fff';
}
function initYandexMaps() {
    if (!mapEl)
        return;
    // Проверяем глобальный флаг загрузки с защитой от бесконечного цикла
    if (window.YANDEX_API_LOADING) {
        console.log('Яндекс API уже загружается, ждем...');
        setTimeout(() => {
            if (window.YANDEX_API_LOADING) {
                console.log('Все еще загружается, повторяем попытку');
                initYandexMaps();
            }
            else {
                console.log('Загрузка завершена, инициализируем');
                initYandexMaps();
            }
        }, 500);
        return;
    }
    // Проверяем, не загружен ли уже API
    if (typeof window.ymaps !== 'undefined' && window.ymaps.Map) {
        console.log('Яндекс Карты уже загружены, используем существующий API');
        setTimeout(() => {
            if (typeof ymaps !== 'undefined') {
                ymaps.ready(() => {
                    console.log('Яндекс Карты готовы');
                    try {
                        map = new ymaps.Map(mapEl, {
                            center: [45.0355, 38.9753],
                            zoom: 10,
                            controls: ['zoomControl']
                        });
                        renderPoints();
                    }
                    catch (error) {
                        console.error('Ошибка создания карты:', error);
                    }
                });
            }
        }, 100);
        return;
    }
    // Устанавливаем флаг загрузки
    ;
    window.YANDEX_API_LOADING = true;
    // Загружаем Yandex Maps API только если еще не загружен
    console.log('Загружаем Яндекс Карты API...');
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=${YANDEX_API_KEY}`;
    script.type = 'text/javascript';
    script.onload = () => {
        console.log('Скрипт Яндекс Карт загружен');
        ymaps.ready(() => {
            console.log('Яндекс Карты загружены');
            window.YANDEX_API_LOADING = false;
            try {
                map = new ymaps.Map(mapEl, {
                    center: [45.0355, 38.9753],
                    zoom: 10,
                    controls: ['zoomControl']
                });
                renderPoints();
            }
            catch (error) {
                console.error('Ошибка создания карты:', error);
                window.YANDEX_API_LOADING = false;
            }
        });
    };
    script.onerror = () => {
        console.error('Ошибка загрузки скрипта Яндекс Карт');
        window.YANDEX_API_LOADING = false;
    };
    document.head.appendChild(script);
}
function renderPoints() {
    console.log('renderPoints() вызвана, map существует:', !!map, 'точек:', props.points.length);
    if (!map) {
        console.log('map не существует, выходим');
        return;
    }
    // Очищаем старые маркеры и маршруты
    markers.forEach(m => map.geoObjects.remove(m));
    routes.forEach(r => map.geoObjects.remove(r));
    markers = [];
    routes = [];
    if (!props.points.length) {
        console.log('нет точек, выходим');
        return;
    }
    console.log('начинаем обрабатывать точки:', props.points);
    // Создаем маркеры
    props.points.forEach((pt, idx) => {
        const isActive = pt.id === props.activePointId;
        const placemark = new ymaps.Placemark([pt.lat, pt.lon], {
            balloonContent: `
        <div style="padding: 10px;">
          <strong>${pt.title}</strong><br>
          ${pt.location}<br>
          День ${pt.day + 1} · ${pt.slot}<br>
          Рейтинг: ${pt.rating.toFixed(1)} · ${pt.cost} ₽
        </div>
      `
        }, {
            preset: isActive ? 'islands#redDotIcon' : 'islands#blueDotIcon'
        });
        placemark.events.add('click', () => {
            emit('selectPoint', pt.id);
        });
        map.geoObjects.add(placemark);
        markers.push(placemark);
    });
    // Группируем точки по дням и строим маршруты
    const pointsByDay = new Map();
    props.points.forEach(point => {
        if (!pointsByDay.has(point.day)) {
            pointsByDay.set(point.day, []);
        }
        pointsByDay.get(point.day).push(point);
    });
    // Строим маршруты для каждого дня
    console.log('pointsByDay:', pointsByDay);
    for (const [day, dayPoints] of pointsByDay) {
        console.log(`День ${day}, точек: ${dayPoints.length}`);
        if (dayPoints.length >= 2) {
            console.log(`Строим маршрут для дня ${day}`);
            buildSimpleRoute(dayPoints, day);
        }
        else {
            console.log(`Пропускаем день ${day} - меньше 2 точек`);
        }
    }
    // Дополнительно: строим маршрут между всеми точками (если их >= 2)
    if (props.points.length >= 2) {
        console.log('Строим общий маршрут между всеми точками');
        buildSimpleRoute(props.points, 0); // Используем цвет дня 0
    }
    // Настраиваем вид карты
    if (props.points.length === 1) {
        map.setCenter([props.points[0].lat, props.points[0].lon], 13);
    }
    else {
        const bounds = props.points.map(p => [p.lat, p.lon]);
        map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 50 });
    }
}
function buildSimpleRoute(points, day) {
    console.log(`buildSimpleRoute() вызвана, map: ${!!map}, точек: ${points.length}`);
    if (!map || points.length < 2) {
        console.log('условия не выполнены, выходим');
        return;
    }
    try {
        console.log(`Строим РЕАЛЬНЫЙ маршрут дня ${day + 1} для ${points.length} точек`);
        // Создаем РЕАЛЬНЫЙ маршрут через Яндекс Карты
        const multiRoute = new ymaps.multiRouter.MultiRoute({
            referencePoints: points.map(p => [p.lat, p.lon]),
            params: {
                routingMode: 'auto', // 'auto', 'pedestrian', 'masstransit'
                avoidTrafficJams: true,
                results: 1
            }
        });
        // Добавляем маршрут на карту
        map.geoObjects.add(multiRoute);
        routes.push(multiRoute);
        // Обрабатываем успешное построение
        multiRoute.model.events.add('requestsuccess', function () {
            console.log(`РЕАЛЬНЫЙ маршрут дня ${day + 1} построен успешно`);
            // Изменяем стиль маршрута
            const routes = multiRoute.getRoutes();
            if (routes.length > 0) {
                const route = routes[0];
                const paths = route.getPaths();
                paths.forEach((path) => {
                    path.options.set({
                        strokeColor: getColor(day),
                        strokeWidth: 4,
                        strokeOpacity: 0.8,
                        strokeStyle: 'solid'
                    });
                });
            }
        });
        // Обрабатываем ошибки
        multiRoute.model.events.add('requestfail', function (error) {
            console.error('Ошибка построения РЕАЛЬНОГО маршрута:', error);
            // Fallback на прямую линию
            buildFallbackRoute(points, day);
        });
        console.log(`Запрос на РЕАЛЬНЫЙ маршрут дня ${day + 1} отправлен`);
    }
    catch (error) {
        console.error('Ошибка построения маршрута:', error);
        buildFallbackRoute(points, day);
    }
}
// Fallback функция для прямых линий
function buildFallbackRoute(points, day) {
    if (!map || points.length < 2)
        return;
    console.log(`Создаем fallback маршрут дня ${day + 1}`);
    const coordinates = points.map(p => [p.lat, p.lon]);
    const color = getColor(day);
    const polyline = new ymaps.Polyline(coordinates, {
        balloonContent: `Fallback маршрут дня ${day + 1}`
    }, {
        strokeColor: color,
        strokeWidth: 3,
        strokeOpacity: 0.6,
        strokeStyle: 'dash'
    });
    map.geoObjects.add(polyline);
    routes.push(polyline);
    console.log(`Fallback маршрут дня ${day + 1} построен`);
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
    const marker = markers[idx];
    if (marker) {
        setTimeout(() => {
            marker.balloon.open();
        }, 700);
    }
}
onMounted(async () => {
    await nextTick();
    console.log('=== ONMOUNTED СРАБОТАЛ ===');
    console.log('props.points в onMounted:', props.points.length);
    mapEl = document.getElementById('route-leaflet-map');
    console.log('Элемент карты найден:', !!mapEl);
    // Очищаем элемент карты перед инициализацией
    if (mapEl) {
        mapEl.innerHTML = '';
        console.log('Элемент карты очищен');
        initYandexMaps();
    }
    else {
        console.log('Элемент карты не найден в onMounted!');
    }
});
onBeforeUnmount(() => {
    if (map) {
        map.destroy();
        map = null;
    }
});
watch(() => props.points, async () => {
    await nextTick();
    console.log('=== WATCH СРАБОТАЛ ===');
    console.log('props.points изменились, количество:', props.points.length);
    console.log('Точки:', props.points);
    if (!map) {
        console.log('map не существует, пытаемся инициализировать');
        mapEl = document.getElementById('route-leaflet-map');
        if (mapEl) {
            console.log('Элемент карты найден, инициализируем');
            initYandexMaps();
        }
        else {
            console.log('Элемент карты не найден!');
        }
    }
    else {
        console.log('map существует, вызываем renderPoints()');
        renderPoints();
    }
}, { deep: true, immediate: true });
// Добавим отдельный watch для отладки
watch(() => props.points.length, (newLength, oldLength) => {
    console.log(`Длина props.points изменилась с ${oldLength} на ${newLength}`);
}, { immediate: true });
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
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};

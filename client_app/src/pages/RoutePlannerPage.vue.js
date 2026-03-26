/// <reference types="C:/Users/Иван Жутяев/AppData/Local/npm-cache/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/Иван Жутяев/AppData/Local/npm-cache/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { getApiBase } from '../api/client';
import RouteMapSwitcher from '../components/RouteMapSwitcher.vue';
import AvalinViewer from '../components/AvalinViewer.vue';
const props = defineProps();
const emit = defineEmits();
const logisticsRefs = ref([]);
const logisticsHeight = ref(null);
const setLogisticsRef = (idx) => (el) => {
    logisticsRefs.value[idx] = el;
};
const updateLogisticsHeight = async () => {
    await nextTick();
    const heights = logisticsRefs.value.map((el) => (el ? el.scrollHeight : 0));
    const max = Math.max(0, ...heights);
    logisticsHeight.value = max > 0 ? max : null;
};
const onResize = () => {
    void updateLogisticsHeight();
};
function todayISODate() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}
function parseISODateUTC(s) {
    const [y, m, d] = s.split('-').map((x) => Number(x));
    return new Date(Date.UTC(y, m - 1, d));
}
function formatISODateUTC(dt) {
    const yyyy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(dt.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}
function addDaysUTC(dt, days) {
    const copy = new Date(dt.getTime());
    copy.setUTCDate(copy.getUTCDate() + days);
    return copy;
}
const startDate = ref(todayISODate());
const month = computed(() => parseISODateUTC(startDate.value).getUTCMonth() + 1);
const endDate = computed(() => {
    const dt = parseISODateUTC(startDate.value);
    return formatISODateUTC(addDaysUTC(dt, 2));
});
const startDateLabel = computed(() => startDate.value);
const endDateLabel = computed(() => endDate.value);
const travelerType = ref('family');
const interests = ref('');
const generated = ref(false);
const days = ref([]);
const overallWhy = ref('');
onMounted(() => {
    void updateLogisticsHeight();
    window.addEventListener('resize', onResize);
});
watch(() => days.value, () => {
    void updateLogisticsHeight();
}, { deep: true });
onBeforeUnmount(() => {
    window.removeEventListener('resize', onResize);
});
const weatherLoading = ref(false);
const weatherByDay = ref([]);
const weatherError = ref('');
const apiError = ref('');
const generateLoading = ref(false);
const show3DTour = ref(false);
const currentTourPlace = ref(null);
function start3DTour(place) {
    currentTourPlace.value = place;
    show3DTour.value = true;
}
function close3DTour() {
    show3DTour.value = false;
    currentTourPlace.value = null;
}
function has3DTour(place) {
    return !!place.avalinTourUrl;
}
function openClusterByPlaceId(placeId) {
    emit('openClusterByPlaceId', placeId);
}
function weatherLabelFromCode(code) {
    const isRainy = (code >= 51 && code <= 67) ||
        (code >= 71 && code <= 77) ||
        (code >= 80 && code <= 82) ||
        code === 95 ||
        code === 96 ||
        code === 99;
    const label = (() => {
        if (code === 0)
            return 'Ясно';
        if (code === 1 || code === 2)
            return 'Облачно с прояснениями';
        if (code === 3)
            return 'Пасмурно';
        if (code === 45 || code === 48)
            return 'Туман';
        if (code >= 51 && code <= 57)
            return 'Морось';
        if (code >= 58 && code <= 67)
            return 'Дождь';
        if (code >= 71 && code <= 77)
            return 'Снег/снежок';
        if (code >= 80 && code <= 82)
            return 'Ливни';
        if (code >= 85 && code <= 86)
            return 'Снегопад';
        if (code >= 95)
            return 'Гроза';
        return 'Погода переменчива';
    })();
    return { label, isRainy };
}
async function fetchWeather() {
    weatherError.value = '';
    weatherLoading.value = true;
    try {
        const anchor = props.routePlaces[0]?.coordinates ?? { lat: 45.0, lon: 38.0 };
        const url = new URL('https://api.open-meteo.com/v1/forecast');
        url.searchParams.set('latitude', String(anchor.lat));
        url.searchParams.set('longitude', String(anchor.lon));
        url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum');
        url.searchParams.set('start_date', startDate.value);
        url.searchParams.set('end_date', endDate.value);
        url.searchParams.set('timezone', 'Europe/Moscow');
        const res = await fetch(url.toString());
        if (!res.ok)
            throw new Error(`HTTP ${res.status}`);
        const data = (await res.json());
        const daily = data.daily;
        const codes = daily?.weather_code ?? [];
        const maxs = daily?.temperature_2m_max ?? [];
        const mins = daily?.temperature_2m_min ?? [];
        const precs = daily?.precipitation_sum ?? [];
        const next = [0, 1, 2].map((i) => {
            const code = codes[i] ?? 0;
            const maxTemp = maxs[i] ?? 0;
            const minTemp = mins[i] ?? 0;
            const precipitationSum = precs[i] ?? 0;
            const w = weatherLabelFromCode(code);
            return {
                maxTemp,
                minTemp,
                precipitationSum,
                weatherCode: code,
                isRainy: w.isRainy,
                label: w.label,
            };
        });
        weatherByDay.value = next;
    }
    catch (e) {
        weatherError.value = 'Погоду временно не удалось загрузить.';
        weatherByDay.value = [];
    }
    finally {
        weatherLoading.value = false;
    }
}
const vauSelectedIndex = ref(0);
const vauItems = computed(() => {
    const items = [];
    days.value.forEach((d) => {
        d.places.forEach((p) => {
            items.push({
                place: p.place,
                dayIndex: d.dayIndex,
                slot: p.slot,
                why: p.why,
            });
        });
    });
    return items;
});
const vauActive = computed(() => vauItems.value[vauSelectedIndex.value] ?? null);
function monthToSeason(m) {
    if (m === 12 || m === 1 || m === 2)
        return 'winter';
    if (m >= 3 && m <= 5)
        return 'spring';
    if (m >= 6 && m <= 8)
        return 'summer';
    return 'autumn';
}
const seasonLabel = computed(() => {
    const s = monthToSeason(month.value);
    if (s === 'winter')
        return 'Зима';
    if (s === 'spring')
        return 'Весна';
    if (s === 'summer')
        return 'Лето';
    return 'Осень';
});
function travelerLabel(t) {
    switch (t) {
        case 'family':
            return 'Семья с детьми';
        case 'elderly':
            return 'Пенсионеры';
        case 'digital':
            return 'Фрилансер с ноутбуком';
        case 'gastro':
            return 'Гастроэнтузиаст';
        case 'active':
            return 'Активный отдых';
        case 'eco':
            return 'Эко/природа';
    }
}
function clusterKey(place) {
    return place.id.split('-')[0] ?? '';
}
const clusterSeasonTags = {
    cl1: ['summer'],
    cl2: ['spring', 'autumn'],
    cl3: ['spring', 'summer', 'autumn', 'winter'],
    cl4: ['autumn', 'spring'],
    cl5: ['spring', 'summer'],
    cl6: ['autumn', 'winter'],
};
const clusterSeasonWorst = {
    cl1: ['winter'],
    cl2: ['winter'],
    cl4: ['summer', 'winter'],
    cl5: ['winter'],
    cl6: ['spring', 'summer'],
};
const outdoorClusters = new Set(['cl1', 'cl2', 'cl5']);
const indoorClusters = new Set(['cl3', 'cl4', 'cl6']);
const clusterTypeTags = {
    cl1: ['family', 'elderly-friendly', 'relaxed', 'outdoor'],
    cl2: ['family', 'eco', 'relaxed', 'nature'],
    cl3: ['digital', 'indoor-safe', 'view'],
    cl4: ['gastro', 'wine', 'family', 'indoor-safe'],
    cl5: ['family', 'kids-friendly', 'active'],
    cl6: ['eco', 'relaxed', 'craft'],
};
function buildCandidatesFromPlaces(places) {
    return places.map((p) => {
        const key = clusterKey(p);
        const title = p.title.toLowerCase();
        const seasonsBest = clusterSeasonTags[key] ?? [];
        let typeTags = [...(clusterTypeTags[key] ?? [])];
        if (title.includes('дет') || title.includes('семей'))
            typeTags.push('family', 'kids-friendly');
        if (title.includes('тих') || title.includes('неспеш'))
            typeTags.push('elderly-friendly');
        if (title.includes('вино') || title.includes('дегуст') || title.includes('вкус'))
            typeTags.push('gastro');
        if (title.includes('природ') || title.includes('озер') || title.includes('троп'))
            typeTags.push('eco');
        const months = seasonsBest.flatMap((s) => {
            if (s === 'summer')
                return ['06', '07', '08'];
            if (s === 'winter')
                return ['12', '01', '02'];
            if (s === 'spring')
                return ['03', '04', '05'];
            if (s === 'autumn')
                return ['09', '10', '11'];
            return [];
        });
        const isOutdoor = outdoorClusters.has(key);
        const isIndoor = indoorClusters.has(key);
        const indoorOptions = isIndoor
            ? ['дегустации', 'мастерские', 'кафе с видом']
            : ['кафе рядом', 'веранды'];
        const outdoorOptions = isOutdoor
            ? ['пляж', 'набережная', 'прогулки у воды']
            : ['прогулки', 'фото-остановки'];
        return {
            id: p.id,
            clusterId: key || (p.id.split('-')[0] ?? p.id),
            title: p.title,
            location: p.location,
            coordinates: { lat: p.coordinates.lat, lon: p.coordinates.lon },
            rating: p.rating,
            cost: p.cost,
            fact: p.fact,
            description: p.description,
            seasonsBest,
            availableMonths: [...new Set(months)],
            typeTags: [...new Set(typeTags)],
            indoorOptions,
            outdoorOptions,
            suitabilityFlags: {
                kidsFriendly: typeTags.some((t) => t.includes('kids') || t.includes('family')),
                elderlyFriendly: typeTags.some((t) => t.includes('elderly')),
                wifi: typeTags.some((t) => t.includes('digital')),
                accessibilityNotes: 'без сложных подъёмов',
            },
        };
    });
}
async function generate() {
    generated.value = true;
    apiError.value = '';
    generateLoading.value = true;
    await fetchWeather();
    const places = props.routePlaces ?? [];
    const candidates = places.length > 0 ? buildCandidatesFromPlaces(places) : [];
    const payload = {
        requestType: 'itinerary_generation',
        travelerType: travelerType.value,
        startDate: startDate.value,
        durationDays: 3,
        interests: interests.value || undefined,
        weatherByDay: weatherByDay.value.map((w) => ({
            weatherCode: w.weatherCode,
            minTemp: w.minTemp,
            maxTemp: w.maxTemp,
            precipitationSum: w.precipitationSum,
            isRainy: w.isRainy,
            weatherLabel: w.label,
        })),
        candidates,
        outputContract: { daysCount: 3, daySlots: ['Утро', 'День', 'Вечер'], maxPlacesPerDay: 3, language: 'ru' },
    };
    const placeById = new Map(places.map((p) => [p.id, p]));
    try {
        const base = getApiBase();
        const res = await fetch(`${base}/itinerary/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok)
            throw new Error(await res.text() || `HTTP ${res.status}`);
        const data = (await res.json());
        days.value = data.itineraryDays.map((d) => ({
            dayIndex: d.dayIndex,
            places: d.steps
                .map((s) => {
                let place = placeById.get(s.placeId);
                if (!place && s.placeInfo) {
                    place = {
                        id: s.placeInfo.id,
                        photo: s.placeInfo.photoUrl || '',
                        rating: s.placeInfo.rating,
                        title: s.placeInfo.title,
                        location: s.placeInfo.location,
                        coordinates: { lat: 45, lon: 38 },
                        fact: s.placeInfo.fact,
                        cost: s.placeInfo.cost,
                        description: s.placeInfo.description,
                        reviewsLabel: '',
                        reviews: [],
                    };
                }
                if (!place)
                    return null;
                return { place, slot: s.slot, why: s.why, logisticsNotes: s.logisticsNotes };
            })
                .filter((x) => x !== null),
        }));
        overallWhy.value = data.overallWhy ?? '';
    }
    catch (e) {
        apiError.value = e instanceof Error ? e.message : 'Ошибка при генерации. Бэкенд запущен на порту 8000?';
        days.value = [];
        overallWhy.value = '';
    }
    finally {
        generateLoading.value = false;
    }
    vauSelectedIndex.value = 0;
    stopTripPreviewAutoplay();
    isTripPreviewOpen.value = false;
}
function logisticsForDay(day) {
    const dayIndex = day.dayIndex;
    const season = monthToSeason(month.value);
    const t = travelerType.value;
    const places = day.places.map((x) => x.place);
    const mainPlace = places[0];
    const dayTone = dayIndex === 0 ? 'на старте' : dayIndex === 1 ? 'в основной день' : 'в финальной части';
    const seasonPack = (() => {
        if (season === 'summer') {
            return {
                transport: `переезды короткие: больше пеших прогулок (${dayTone})`,
                food: 'пикники и лёгкие гастро-точки',
                stay: 'вечером — рядом с ключевыми локациями',
            };
        }
        if (season === 'winter') {
            return {
                transport: `план с запасом по времени (${dayTone})`,
                food: 'уютные остановки: тёплые дегустации',
                stay: 'размещение ближе к активностям',
            };
        }
        if (season === 'spring') {
            return {
                transport: `маршрут по "коротким лучам" (${dayTone})`,
                food: 'весенние вкусы: свежие продукты',
                stay: 'комфортный ночлег рядом',
            };
        }
        return {
            transport: `мягкий темп под осеннюю погоду (${dayTone})`,
            food: 'вкусные остановки с историей',
            stay: 'размещение в уюте',
        };
    })();
    return {
        transport: seasonPack.transport,
        stay: `${seasonPack.stay}${mainPlace ? `, опорная точка — «${mainPlace.title}»` : ''}.`,
        food: `${seasonPack.food}${mainPlace ? ` вокруг «${mainPlace.title}»` : ''}.`,
    };
}
const hasPlaces = computed(() => props.routePlaces.length > 0);
const totalCost = computed(() => props.routePlaces.reduce((sum, p) => sum + p.cost, 0));
const activeMapPointId = ref(null);
const mapPoints = computed(() => {
    const pts = [];
    days.value.forEach((d) => {
        d.places.forEach((item) => {
            const mapPoint = {
                id: item.place.id,
                title: item.place.title,
                location: item.place.location,
                lat: item.place.coordinates.lat,
                lon: item.place.coordinates.lon,
                day: d.dayIndex,
                slot: item.slot,
                cost: item.place.cost,
                rating: item.place.rating,
                photo: item.place.photo,
            };
            pts.push(mapPoint);
        });
    });
    return pts;
});
function onMapSelectPoint(id) {
    activeMapPointId.value = id;
    for (let di = 0; di < days.value.length; di++) {
        const d = days.value[di];
        for (let si = 0; si < d.places.length; si++) {
            if (d.places[si].place.id === id) {
                previewDayIndex.value = di;
                previewStepIndex.value = si;
                return;
            }
        }
    }
}
const isTripPreviewOpen = ref(false);
const previewDayIndex = ref(0);
const previewStepIndex = ref(0);
const previewAutoplay = ref(false);
let previewTimer = null;
const previewDay = computed(() => days.value[previewDayIndex.value] ?? null);
const previewStep = computed(() => previewDay.value?.places[previewStepIndex.value] ?? null);
function truncateText(s, maxLen) {
    const str = (s ?? '').trim();
    if (!str)
        return '';
    if (str.length <= maxLen)
        return str;
    return str.slice(0, Math.max(0, maxLen - 1)).trimEnd() + '...';
}
const previewWhyShort = computed(() => truncateText(previewStep.value?.why ?? '', 170));
const previewLogisticsShort = computed(() => truncateText(previewStep.value?.logisticsNotes ?? '', 130));
const previewProgress = computed(() => {
    const total = previewDay.value?.places.length ?? 0;
    if (total <= 1)
        return 100;
    return Math.round((previewStepIndex.value / (total - 1)) * 100);
});
function openTripPreview() {
    if (!days.value.length)
        return;
    isTripPreviewOpen.value = true;
    previewDayIndex.value = 0;
    previewStepIndex.value = 0;
    activeMapPointId.value = days.value[0]?.places[0]?.place.id ?? null;
}
function closeTripPreview() {
    stopTripPreviewAutoplay();
    isTripPreviewOpen.value = false;
}
function nextPreviewStep() {
    const d = previewDay.value;
    if (!d || !d.places.length)
        return;
    if (previewStepIndex.value < d.places.length - 1) {
        previewStepIndex.value += 1;
        activeMapPointId.value = previewStep.value?.place.id ?? null;
        return;
    }
    if (previewDayIndex.value < days.value.length - 1) {
        previewDayIndex.value += 1;
        previewStepIndex.value = 0;
        activeMapPointId.value = previewStep.value?.place.id ?? null;
        return;
    }
    stopTripPreviewAutoplay();
}
function prevPreviewStep() {
    if (previewStepIndex.value > 0) {
        previewStepIndex.value -= 1;
        activeMapPointId.value = previewStep.value?.place.id ?? null;
        return;
    }
    if (previewDayIndex.value > 0) {
        previewDayIndex.value -= 1;
        const d = days.value[previewDayIndex.value];
        previewStepIndex.value = Math.max((d?.places.length ?? 1) - 1, 0);
        activeMapPointId.value = previewStep.value?.place.id ?? null;
    }
}
function selectPreviewDay(dayIndex) {
    previewDayIndex.value = dayIndex;
    previewStepIndex.value = 0;
}
function toggleTripPreviewAutoplay() {
    if (previewAutoplay.value) {
        stopTripPreviewAutoplay();
    }
    else {
        startTripPreviewAutoplay();
    }
}
function startTripPreviewAutoplay() {
    stopTripPreviewAutoplay();
    previewAutoplay.value = true;
    previewTimer = window.setInterval(() => {
        nextPreviewStep();
    }, 2200);
}
function stopTripPreviewAutoplay() {
    previewAutoplay.value = false;
    if (previewTimer !== null) {
        window.clearInterval(previewTimer);
        previewTimer = null;
    }
}
onBeforeUnmount(() => {
    stopTripPreviewAutoplay();
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
/** @type {__VLS_StyleScopedClasses['control-input']} */ ;
/** @type {__VLS_StyleScopedClasses['generate-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['generate-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['place-card']} */ ;
/** @type {__VLS_StyleScopedClasses['place-more-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-ctrl-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-nav-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['controls-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['days-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-body']} */ ;
/** @type {__VLS_StyleScopedClasses['planner-content']} */ ;
/** @type {__VLS_StyleScopedClasses['planner-header']} */ ;
/** @type {__VLS_StyleScopedClasses['planner-header__title']} */ ;
/** @type {__VLS_StyleScopedClasses['weather-grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
    ...{ class: "planner" },
});
/** @type {__VLS_StyleScopedClasses['planner']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
    ...{ class: "planner-header" },
});
/** @type {__VLS_StyleScopedClasses['planner-header']} */ ;
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
    ...{ class: "planner-header__center" },
});
/** @type {__VLS_StyleScopedClasses['planner-header__center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
    ...{ class: "planner-header__title" },
});
/** @type {__VLS_StyleScopedClasses['planner-header__title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "planner-header__subtitle" },
});
/** @type {__VLS_StyleScopedClasses['planner-header__subtitle']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "planner-header__total" },
});
/** @type {__VLS_StyleScopedClasses['planner-header__total']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "total-badge" },
});
/** @type {__VLS_StyleScopedClasses['total-badge']} */ ;
(__VLS_ctx.totalCost.toLocaleString('ru-RU'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "planner-content" },
});
/** @type {__VLS_StyleScopedClasses['planner-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "controls-panel" },
});
/** @type {__VLS_StyleScopedClasses['controls-panel']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "control-group" },
});
/** @type {__VLS_StyleScopedClasses['control-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "control-label" },
});
/** @type {__VLS_StyleScopedClasses['control-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "date",
    ...{ class: "control-input" },
});
(__VLS_ctx.startDate);
/** @type {__VLS_StyleScopedClasses['control-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "control-hint" },
});
/** @type {__VLS_StyleScopedClasses['control-hint']} */ ;
(__VLS_ctx.seasonLabel);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "control-group" },
});
/** @type {__VLS_StyleScopedClasses['control-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "control-label" },
});
/** @type {__VLS_StyleScopedClasses['control-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.travelerType),
    ...{ class: "control-input" },
});
/** @type {__VLS_StyleScopedClasses['control-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "family",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "elderly",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "digital",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "gastro",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "active",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "eco",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "control-hint" },
});
/** @type {__VLS_StyleScopedClasses['control-hint']} */ ;
(__VLS_ctx.travelerLabel(__VLS_ctx.travelerType));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "control-group" },
});
/** @type {__VLS_StyleScopedClasses['control-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "control-label" },
});
/** @type {__VLS_StyleScopedClasses['control-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    value: (__VLS_ctx.interests),
    type: "text",
    ...{ class: "control-input" },
    placeholder: "Напр. дегустации, природа, театры",
});
/** @type {__VLS_StyleScopedClasses['control-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "control-hint" },
});
/** @type {__VLS_StyleScopedClasses['control-hint']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "control-actions" },
});
/** @type {__VLS_StyleScopedClasses['control-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.generate) },
    type: "button",
    ...{ class: "generate-btn" },
    disabled: (__VLS_ctx.generateLoading),
});
/** @type {__VLS_StyleScopedClasses['generate-btn']} */ ;
if (!__VLS_ctx.generateLoading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        width: "18",
        height: "18",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M12 3v3m0 12v3M3 12h3m12 0h3M5.64 5.64l2.12 2.12m8.48 8.48l2.12 2.12M5.64 18.36l2.12-2.12m8.48-8.48l2.12-2.12",
    });
}
(__VLS_ctx.generateLoading ? 'Генерация...' : 'Сгенерировать маршрут');
if (!__VLS_ctx.hasPlaces) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "control-note" },
    });
    /** @type {__VLS_StyleScopedClasses['control-note']} */ ;
}
if (__VLS_ctx.generated) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "results-section" },
    });
    /** @type {__VLS_StyleScopedClasses['results-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "result-header" },
    });
    /** @type {__VLS_StyleScopedClasses['result-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "result-meta" },
    });
    /** @type {__VLS_StyleScopedClasses['result-meta']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        ...{ class: "result-title" },
    });
    /** @type {__VLS_StyleScopedClasses['result-title']} */ ;
    (__VLS_ctx.startDateLabel);
    (__VLS_ctx.endDateLabel);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "result-traveler" },
    });
    /** @type {__VLS_StyleScopedClasses['result-traveler']} */ ;
    (__VLS_ctx.travelerLabel(__VLS_ctx.travelerType));
    if (__VLS_ctx.overallWhy) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "result-summary" },
        });
        /** @type {__VLS_StyleScopedClasses['result-summary']} */ ;
        (__VLS_ctx.overallWhy);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.openTripPreview) },
        type: "button",
        ...{ class: "preview-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        width: "16",
        height: "16",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.polygon)({
        points: "5,3 19,12 5,21",
    });
    if (__VLS_ctx.weatherByDay.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "weather-section" },
        });
        /** @type {__VLS_StyleScopedClasses['weather-section']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
            ...{ class: "section-title" },
        });
        /** @type {__VLS_StyleScopedClasses['section-title']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "weather-grid" },
        });
        /** @type {__VLS_StyleScopedClasses['weather-grid']} */ ;
        for (const [w, idx] of __VLS_vFor((__VLS_ctx.weatherByDay))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (idx),
                ...{ class: "weather-card" },
            });
            /** @type {__VLS_StyleScopedClasses['weather-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "weather-day" },
            });
            /** @type {__VLS_StyleScopedClasses['weather-day']} */ ;
            (idx + 1);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "weather-temp" },
            });
            /** @type {__VLS_StyleScopedClasses['weather-temp']} */ ;
            (w.minTemp);
            (w.maxTemp);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "weather-desc" },
            });
            /** @type {__VLS_StyleScopedClasses['weather-desc']} */ ;
            (w.label);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "weather-precip" },
            });
            /** @type {__VLS_StyleScopedClasses['weather-precip']} */ ;
            (w.precipitationSum);
            // @ts-ignore
            [totalCost, startDate, seasonLabel, travelerType, travelerType, travelerType, travelerLabel, travelerLabel, interests, generate, generateLoading, generateLoading, generateLoading, hasPlaces, generated, startDateLabel, endDateLabel, overallWhy, overallWhy, openTripPreview, weatherByDay, weatherByDay,];
        }
        if (__VLS_ctx.weatherError) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "weather-error" },
            });
            /** @type {__VLS_StyleScopedClasses['weather-error']} */ ;
            (__VLS_ctx.weatherError);
        }
    }
    if (__VLS_ctx.apiError) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "api-error" },
        });
        /** @type {__VLS_StyleScopedClasses['api-error']} */ ;
        (__VLS_ctx.apiError);
    }
    if (__VLS_ctx.mapPoints.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "map-section" },
        });
        /** @type {__VLS_StyleScopedClasses['map-section']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
            ...{ class: "section-title" },
        });
        /** @type {__VLS_StyleScopedClasses['section-title']} */ ;
        const __VLS_0 = RouteMapSwitcher;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
            ...{ 'onSelectPoint': {} },
            points: (__VLS_ctx.mapPoints),
            activePointId: (__VLS_ctx.activeMapPointId),
        }));
        const __VLS_2 = __VLS_1({
            ...{ 'onSelectPoint': {} },
            points: (__VLS_ctx.mapPoints),
            activePointId: (__VLS_ctx.activeMapPointId),
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        let __VLS_5;
        const __VLS_6 = ({ selectPoint: {} },
            { onSelectPoint: (__VLS_ctx.onMapSelectPoint) });
        var __VLS_3;
        var __VLS_4;
    }
    if (__VLS_ctx.days.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "days-grid" },
        });
        /** @type {__VLS_StyleScopedClasses['days-grid']} */ ;
        for (const [d] of __VLS_vFor((__VLS_ctx.days))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
                key: (d.dayIndex),
                ...{ class: "day-card" },
            });
            /** @type {__VLS_StyleScopedClasses['day-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "day-header" },
            });
            /** @type {__VLS_StyleScopedClasses['day-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
                ...{ class: "day-title" },
            });
            /** @type {__VLS_StyleScopedClasses['day-title']} */ ;
            (d.dayIndex + 1);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "day-count" },
            });
            /** @type {__VLS_StyleScopedClasses['day-count']} */ ;
            (d.places.length);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "day-places" },
            });
            /** @type {__VLS_StyleScopedClasses['day-places']} */ ;
            for (const [item] of __VLS_vFor((d.places))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.generated))
                                return;
                            if (!(__VLS_ctx.days.length))
                                return;
                            __VLS_ctx.onMapSelectPoint(item.place.id);
                            // @ts-ignore
                            [weatherError, weatherError, apiError, apiError, mapPoints, mapPoints, activeMapPointId, onMapSelectPoint, onMapSelectPoint, days, days,];
                        } },
                    key: (item.place.id),
                    ...{ class: "place-card" },
                    ...{ class: ({ 'place-card--active': __VLS_ctx.activeMapPointId === item.place.id }) },
                });
                /** @type {__VLS_StyleScopedClasses['place-card']} */ ;
                /** @type {__VLS_StyleScopedClasses['place-card--active']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "place-image-wrap" },
                });
                /** @type {__VLS_StyleScopedClasses['place-image-wrap']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                    src: (item.place.photo),
                    alt: (item.place.title),
                    ...{ class: "place-img" },
                });
                /** @type {__VLS_StyleScopedClasses['place-img']} */ ;
                if (__VLS_ctx.has3DTour(item.place)) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!(__VLS_ctx.generated))
                                    return;
                                if (!(__VLS_ctx.days.length))
                                    return;
                                if (!(__VLS_ctx.has3DTour(item.place)))
                                    return;
                                __VLS_ctx.start3DTour(item.place);
                                // @ts-ignore
                                [activeMapPointId, has3DTour, start3DTour,];
                            } },
                        type: "button",
                        ...{ class: "place-tour-btn" },
                    });
                    /** @type {__VLS_StyleScopedClasses['place-tour-btn']} */ ;
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "place-info" },
                });
                /** @type {__VLS_StyleScopedClasses['place-info']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "place-slot" },
                });
                /** @type {__VLS_StyleScopedClasses['place-slot']} */ ;
                (item.slot);
                __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({
                    ...{ class: "place-title" },
                });
                /** @type {__VLS_StyleScopedClasses['place-title']} */ ;
                (item.place.title);
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "place-location" },
                });
                /** @type {__VLS_StyleScopedClasses['place-location']} */ ;
                (item.place.location);
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "place-why" },
                });
                /** @type {__VLS_StyleScopedClasses['place-why']} */ ;
                (item.why);
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "place-footer" },
                });
                /** @type {__VLS_StyleScopedClasses['place-footer']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "place-price" },
                });
                /** @type {__VLS_StyleScopedClasses['place-price']} */ ;
                (item.place.cost.toLocaleString('ru-RU'));
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.generated))
                                return;
                            if (!(__VLS_ctx.days.length))
                                return;
                            __VLS_ctx.openClusterByPlaceId(item.place.id);
                            // @ts-ignore
                            [openClusterByPlaceId,];
                        } },
                    type: "button",
                    ...{ class: "place-more-btn" },
                });
                /** @type {__VLS_StyleScopedClasses['place-more-btn']} */ ;
                // @ts-ignore
                [];
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "day-logistics" },
                ref: (__VLS_ctx.setLogisticsRef(d.dayIndex)),
            });
            /** @type {__VLS_StyleScopedClasses['day-logistics']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({
                ...{ class: "logistics-title" },
            });
            /** @type {__VLS_StyleScopedClasses['logistics-title']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "logistics-row" },
            });
            /** @type {__VLS_StyleScopedClasses['logistics-row']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "logistics-label" },
            });
            /** @type {__VLS_StyleScopedClasses['logistics-label']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "logistics-value" },
            });
            /** @type {__VLS_StyleScopedClasses['logistics-value']} */ ;
            (__VLS_ctx.logisticsForDay(d).transport);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "logistics-row" },
            });
            /** @type {__VLS_StyleScopedClasses['logistics-row']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "logistics-label" },
            });
            /** @type {__VLS_StyleScopedClasses['logistics-label']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "logistics-value" },
            });
            /** @type {__VLS_StyleScopedClasses['logistics-value']} */ ;
            (__VLS_ctx.logisticsForDay(d).stay);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "logistics-row" },
            });
            /** @type {__VLS_StyleScopedClasses['logistics-row']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "logistics-label" },
            });
            /** @type {__VLS_StyleScopedClasses['logistics-label']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "logistics-value" },
            });
            /** @type {__VLS_StyleScopedClasses['logistics-value']} */ ;
            (__VLS_ctx.logisticsForDay(d).food);
            // @ts-ignore
            [setLogisticsRef, logisticsForDay, logisticsForDay, logisticsForDay,];
        }
    }
}
if (__VLS_ctx.isTripPreviewOpen) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeTripPreview) },
        ...{ class: "preview-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "preview-modal__content" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-modal__content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "preview-modal__header" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-modal__header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        ...{ class: "preview-modal__title" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-modal__title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "preview-modal__controls" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-modal__controls']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.toggleTripPreviewAutoplay) },
        type: "button",
        ...{ class: "preview-ctrl-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-ctrl-btn']} */ ;
    (__VLS_ctx.previewAutoplay ? 'Пауза' : 'Автоплей');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeTripPreview) },
        type: "button",
        ...{ class: "preview-ctrl-btn preview-ctrl-btn--close" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-ctrl-btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['preview-ctrl-btn--close']} */ ;
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
        ...{ class: "preview-days" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-days']} */ ;
    for (const [d] of __VLS_vFor((__VLS_ctx.days))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.isTripPreviewOpen))
                        return;
                    __VLS_ctx.selectPreviewDay(d.dayIndex);
                    // @ts-ignore
                    [days, isTripPreviewOpen, closeTripPreview, closeTripPreview, toggleTripPreviewAutoplay, previewAutoplay, selectPreviewDay,];
                } },
            key: ('pday-' + d.dayIndex),
            type: "button",
            ...{ class: "preview-day-btn" },
            ...{ class: ({ 'preview-day-btn--active': d.dayIndex === __VLS_ctx.previewDayIndex }) },
        });
        /** @type {__VLS_StyleScopedClasses['preview-day-btn']} */ ;
        /** @type {__VLS_StyleScopedClasses['preview-day-btn--active']} */ ;
        (d.dayIndex + 1);
        // @ts-ignore
        [previewDayIndex,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "preview-progress" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-progress']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "preview-progress__bar" },
        ...{ style: ({ width: `${__VLS_ctx.previewProgress}%` }) },
    });
    /** @type {__VLS_StyleScopedClasses['preview-progress__bar']} */ ;
    let __VLS_7;
    /** @ts-ignore @type {typeof __VLS_components.transition | typeof __VLS_components.Transition | typeof __VLS_components.transition | typeof __VLS_components.Transition} */
    transition;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        name: "fade",
        mode: "out-in",
    }));
    const __VLS_9 = __VLS_8({
        name: "fade",
        mode: "out-in",
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    const { default: __VLS_12 } = __VLS_10.slots;
    if (__VLS_ctx.previewStep) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (`${__VLS_ctx.previewDayIndex}-${__VLS_ctx.previewStepIndex}`),
            ...{ class: "preview-body" },
        });
        /** @type {__VLS_StyleScopedClasses['preview-body']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
            src: (__VLS_ctx.previewStep.place.photo),
            alt: (__VLS_ctx.previewStep.place.title),
            ...{ class: "preview-image" },
        });
        /** @type {__VLS_StyleScopedClasses['preview-image']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "preview-info" },
        });
        /** @type {__VLS_StyleScopedClasses['preview-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "preview-meta" },
        });
        /** @type {__VLS_StyleScopedClasses['preview-meta']} */ ;
        (__VLS_ctx.previewDayIndex + 1);
        (__VLS_ctx.previewStep.slot);
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
            ...{ class: "preview-place" },
        });
        /** @type {__VLS_StyleScopedClasses['preview-place']} */ ;
        (__VLS_ctx.previewStep.place.title);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "preview-why" },
        });
        /** @type {__VLS_StyleScopedClasses['preview-why']} */ ;
        (__VLS_ctx.previewWhyShort);
        if (__VLS_ctx.previewLogisticsShort) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "preview-logistics" },
            });
            /** @type {__VLS_StyleScopedClasses['preview-logistics']} */ ;
            (__VLS_ctx.previewLogisticsShort);
        }
    }
    // @ts-ignore
    [previewDayIndex, previewDayIndex, previewProgress, previewStep, previewStep, previewStep, previewStep, previewStep, previewStepIndex, previewWhyShort, previewLogisticsShort, previewLogisticsShort,];
    var __VLS_10;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "preview-nav" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-nav']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.prevPreviewStep) },
        type: "button",
        ...{ class: "preview-nav-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-nav-btn']} */ ;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.nextPreviewStep) },
        type: "button",
        ...{ class: "preview-nav-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-nav-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        width: "18",
        height: "18",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M5 12h14M12 5l7 7-7 7",
    });
}
if (__VLS_ctx.show3DTour && __VLS_ctx.currentTourPlace) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.close3DTour) },
        ...{ class: "tour-modal" },
    });
    /** @type {__VLS_StyleScopedClasses['tour-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "tour-modal__content" },
    });
    /** @type {__VLS_StyleScopedClasses['tour-modal__content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "tour-modal__header" },
    });
    /** @type {__VLS_StyleScopedClasses['tour-modal__header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
        ...{ class: "tour-modal__title" },
    });
    /** @type {__VLS_StyleScopedClasses['tour-modal__title']} */ ;
    (__VLS_ctx.currentTourPlace.title);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.close3DTour) },
        type: "button",
        ...{ class: "tour-modal__close" },
    });
    /** @type {__VLS_StyleScopedClasses['tour-modal__close']} */ ;
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
        ...{ class: "tour-modal__body" },
    });
    /** @type {__VLS_StyleScopedClasses['tour-modal__body']} */ ;
    const __VLS_13 = AvalinViewer;
    // @ts-ignore
    const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
        tourUrl: (__VLS_ctx.currentTourPlace.avalinTourUrl),
        title: (__VLS_ctx.currentTourPlace.title),
        height: "500px",
    }));
    const __VLS_15 = __VLS_14({
        tourUrl: (__VLS_ctx.currentTourPlace.avalinTourUrl),
        title: (__VLS_ctx.currentTourPlace.title),
        height: "500px",
    }, ...__VLS_functionalComponentArgsRest(__VLS_14));
}
// @ts-ignore
[prevPreviewStep, nextPreviewStep, show3DTour, currentTourPlace, currentTourPlace, currentTourPlace, currentTourPlace, close3DTour, close3DTour,];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};

/// <reference types="C:/Users/Иван Жутяев/AppData/Local/npm-cache/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/Иван Жутяев/AppData/Local/npm-cache/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { defineAsyncComponent, ref, onMounted } from 'vue';
const props = defineProps();
const emit = defineEmits();
// Асинхронный компонент для Yandex карты
const RouteMapYandex = defineAsyncComponent(() => import('./RouteMapYandexSimple.vue'));
const mapType = ref('yandex');
// Переключение типа карты (удалено - используем только Yandex)
// function switchMapType(type: 'osrm' | 'yandex') { ... }
// Загружаем сохраненный тип карты (удалено - используем только Yandex)
onMounted(() => {
    console.log('=== SWITCHER ONMOUNTED ===');
    console.log('Используем только Yandex карты');
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mapSwitcher" },
});
/** @type {__VLS_StyleScopedClasses['mapSwitcher']} */ ;
let __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.RouteMapYandex} */
RouteMapYandex;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onSelectPoint': {} },
    points: (props.points),
    activePointId: (props.activePointId),
}));
const __VLS_2 = __VLS_1({
    ...{ 'onSelectPoint': {} },
    points: (props.points),
    activePointId: (props.activePointId),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ selectPoint: {} },
    { onSelectPoint: (...[$event]) => {
            __VLS_ctx.emit('selectPoint', $event);
            // @ts-ignore
            [emit,];
        } });
var __VLS_3;
var __VLS_4;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};

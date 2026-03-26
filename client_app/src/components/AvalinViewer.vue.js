/// <reference types="C:/Users/Иван Жутяев/AppData/Local/npm-cache/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="C:/Users/Иван Жутяев/AppData/Local/npm-cache/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, onMounted, onUnmounted } from 'vue';
export default {};
const __VLS_export = await (async () => {
    const props = withDefaults(defineProps(), {
        width: '100%',
        height: '400px',
        autoplay: true
    });
    const emit = defineEmits();
    const viewerRef = ref();
    const isLoading = ref(true);
    const hasError = ref(false);
    const avalinScriptUrl = import.meta.env
        ?.VITE_AVALIN_CDN_URL || 'https://cdn.avalin.ru/viewer/latest/viewer.js';
    let avalinScriptPromise = null;
    // AVALIN viewer configuration
    const viewerConfig = {
        autoplay: props.autoplay,
        controls: true,
        fullscreen: true,
        vr: true,
        hotspots: true,
        navigation: true
    };
    onMounted(() => {
        if (props.tourUrl && viewerRef.value) {
            loadAvalinViewer();
        }
        else {
            hasError.value = true;
            isLoading.value = false;
            console.log('AVALIN: No tour URL or viewer ref', { tourUrl: props.tourUrl, viewerRef: viewerRef.value });
        }
    });
    onUnmounted(() => {
        // Cleanup AVALIN viewer instance
        if (window.AvalinViewer && viewerRef.value) {
            try {
                window.AvalinViewer.destroy(viewerRef.value);
            }
            catch (error) {
                console.warn('Error destroying AVALIN viewer:', error);
            }
        }
    });
    function loadAvalinViewer() {
        try {
            console.log('AVALIN: Loading viewer for URL:', props.tourUrl);
            loadAvalinScript()
                .then(() => {
                initializeViewer();
                isLoading.value = false;
            })
                .catch((error) => {
                console.error('AVALIN: Script load failed:', error);
                hasError.value = true;
                isLoading.value = false;
                fallbackToImage();
            });
        }
        catch (error) {
            console.error('AVALIN: Error loading viewer:', error);
            hasError.value = true;
            isLoading.value = false;
            fallbackToImage();
        }
    }
    function loadAvalinScript() {
        if (window.AvalinViewer)
            return Promise.resolve();
        if (avalinScriptPromise)
            return avalinScriptPromise;
        let url = avalinScriptUrl;
        if (!url.endsWith('.js')) {
            url = `${url.replace(/\/$/, '')}/viewer.js`;
        }
        avalinScriptPromise = new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${url}"]`);
            if (existing && existing._loaded) {
                resolve();
                return;
            }
            const script = existing || document.createElement('script');
            script.src = url;
            script.async = true;
            script.onload = () => {
                ;
                script._loaded = true;
                resolve();
            };
            script.onerror = (e) => reject(e);
            if (!existing)
                document.head.appendChild(script);
        });
        return avalinScriptPromise;
    }
    function initializeViewer() {
        if (!window.AvalinViewer || !viewerRef.value) {
            console.error('AVALIN: Cannot initialize viewer', {
                hasAvalin: !!window.AvalinViewer,
                hasViewerRef: !!viewerRef.value
            });
            return;
        }
        try {
            console.log('AVALIN: Initializing viewer with config:', {
                url: props.tourUrl,
                ...viewerConfig
            });
            window.AvalinViewer.init(viewerRef.value, {
                url: props.tourUrl,
                ...viewerConfig
            });
            // Set up event listeners
            window.AvalinViewer.on('tourStarted', () => {
                console.log('AVALIN: Tour started');
                isLoading.value = false;
                emit('tourStarted');
            });
            window.AvalinViewer.on('tourEnded', () => {
                console.log('AVALIN: Tour ended');
                emit('tourEnded');
            });
            window.AvalinViewer.on('pointReached', (pointId) => {
                emit('pointReached', pointId);
            });
        }
        catch (error) {
            console.error('AVALIN: Error initializing viewer:', error);
            hasError.value = true;
            isLoading.value = false;
            fallbackToImage();
        }
    }
    function fallbackToImage() {
        // Fallback to regular image gallery if 3D tour fails
        const img = document.createElement('img');
        img.src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop';
        img.alt = props.title;
        img.className = 'w-full h-full object-cover rounded-lg';
        if (viewerRef.value) {
            viewerRef.value.innerHTML = '';
            viewerRef.value.appendChild(img);
        }
    }
    const __VLS_defaults = {
        width: '100%',
        height: '400px',
        autoplay: true
    };
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
    /** @type {__VLS_StyleScopedClasses['avalin-viewer']} */ ;
    /** @type {__VLS_StyleScopedClasses['avalin-viewer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "avalin-viewer-container" },
    });
    /** @type {__VLS_StyleScopedClasses['avalin-viewer-container']} */ ;
    if (__VLS_ctx.isLoading) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex items-center justify-center bg-gray-100 rounded-lg" },
            ...{ style: ({ width: __VLS_ctx.width, height: __VLS_ctx.height }) },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" },
        });
        /** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-b-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-blue-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-gray-600" },
        });
        /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-gray-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
        (__VLS_ctx.title);
    }
    else if (__VLS_ctx.hasError) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-col items-center justify-center bg-gray-100 rounded-lg p-6" },
            ...{ style: ({ width: __VLS_ctx.width, height: __VLS_ctx.height }) },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "text-6xl mb-4" },
        });
        /** @type {__VLS_StyleScopedClasses['text-6xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-gray-600 mb-2" },
        });
        /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-gray-500 mb-4" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "w-full h-48 bg-gray-200 rounded-lg overflow-hidden" },
        });
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-48']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-gray-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
            src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop",
            alt: (__VLS_ctx.title),
            ...{ class: "w-full h-full object-cover" },
        });
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ref: "viewerRef",
            ...{ class: "avalin-viewer rounded-lg overflow-hidden" },
            ...{ style: ({ width: __VLS_ctx.width, height: __VLS_ctx.height }) },
        });
        /** @type {__VLS_StyleScopedClasses['avalin-viewer']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold z-10" },
    });
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['top-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['right-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-green-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-10']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "flex items-center gap-1" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "w-2 h-2 bg-white rounded-full animate-pulse" },
    });
    /** @type {__VLS_StyleScopedClasses['w-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
    // @ts-ignore
    [isLoading, width, width, width, height, height, height, title, title, hasError,];
    return (await import('vue')).defineComponent({
        __typeEmits: {},
        __defaults: __VLS_defaults,
        __typeProps: {},
    });
})();

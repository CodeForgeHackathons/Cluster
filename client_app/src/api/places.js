import { apiFetch } from "./client";
const DEFAULT_PHOTO = "";
function mapPlaceToFrontend(p, clusterId, photo) {
    const desc = p.description || p.description_ai || "";
    return {
        id: `p${p.place_id}`,
        photo: p.images?.[0] || photo,
        rating: p.rating ?? 0,
        title: p.name,
        location: p.location || "",
        coordinates: { lat: 45, lon: 38 },
        fact: p.interesting_fact || "Впечатления",
        cost: p.price ?? 0,
        description: desc,
        reviewsLabel: "",
        reviews: [],
        avalinTourUrl: p.avalin_tour_url || undefined,
    };
}
/**
 * Группирует места по place_type в кластеры.
 * Возвращает [] при ошибке — вызывающий использует stub.
 */
export async function fetchClustersFromApi() {
    try {
        const places = await apiFetch("/places");
        if (!places?.length)
            return null;
        const byType = new Map();
        for (const p of places) {
            const key = p.place_type || "general";
            if (!byType.has(key))
                byType.set(key, []);
            byType.get(key).push(p);
        }
        const clusters = [];
        let idx = 0;
        for (const [type, list] of byType) {
            const clusterId = `api-${type}-${idx++}`;
            clusters.push({
                id: clusterId,
                coverImage: list[0]?.images?.[0] || DEFAULT_PHOTO,
                title: type === "general" ? "Места для отдыха" : type,
                places: list.map((p) => mapPlaceToFrontend(p, clusterId, list[0]?.images?.[0] || DEFAULT_PHOTO)),
            });
        }
        return clusters.length ? clusters : null;
    }
    catch {
        return null;
    }
}

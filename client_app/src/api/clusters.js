import { apiFetch } from "./client";
function formatReviews(count) {
    if (count === 0)
        return "Пока нет отзывов";
    if (count === 1)
        return "1 отзыв";
    if (count >= 2 && count <= 4)
        return `${count} отзыва`;
    return `${count} отзывов`;
}
function mapPlace(p) {
    return {
        id: p.id,
        photo: p.photo,
        rating: p.rating,
        title: p.title,
        location: p.location,
        coordinates: { lat: p.lat, lon: p.lon },
        fact: p.fact || "Впечатления",
        cost: p.cost,
        description: p.description,
        reviewsLabel: formatReviews(p.reviews_count),
        reviews: [],
        avalinTourUrl: p.avalin_tour_url ?? undefined,
    };
}
/**
 * Загружает кластеры с API. Возвращает null при ошибке.
 */
export async function fetchClusters() {
    try {
        const data = await apiFetch("/clusters");
        if (!data?.length)
            return null;
        const cards = [];
        const clusterMap = new Map();
        for (const c of data) {
            const places = c.places.map(mapPlace);
            const cluster = {
                id: c.id,
                coverImage: c.coverImage,
                title: c.title,
                places,
            };
            clusterMap.set(c.id, cluster);
            cards.push({
                id: c.id,
                image: c.coverImage,
                rating: c.rating,
                reviews: formatReviews(c.reviews_count),
                title: c.title,
                meta: c.meta,
                price: c.price,
            });
        }
        return { cards, clusters: clusterMap };
    }
    catch {
        return null;
    }
}

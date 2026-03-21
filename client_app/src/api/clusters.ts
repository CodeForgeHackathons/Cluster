/**
 * Загрузка кластеров с бэкенда для лендинга.
 */
import type { Cluster, Place } from "../types/cluster";
import { apiFetch } from "./client";

type PlaceInCluster = {
  id: string;
  photo: string;
  rating: number;
  title: string;
  location: string;
  lat: number;
  lon: number;
  fact: string;
  cost: number;
  description: string;
  reviews_count: number;
  avalin_tour_url?: string | null;
};

type ClusterResponse = {
  id: string;
  coverImage: string;
  title: string;
  meta: string;
  price: number;
  rating: number;
  reviews_count: number;
  places: PlaceInCluster[];
};

function formatReviews(count: number): string {
  if (count === 0) return "Пока нет отзывов";
  if (count === 1) return "1 отзыв";
  if (count >= 2 && count <= 4) return `${count} отзыва`;
  return `${count} отзывов`;
}

function mapPlace(p: PlaceInCluster): Place {
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

export type ClusterCard = {
  id: string;
  image: string;
  rating: number;
  reviews: string;
  title: string;
  meta: string;
  price: number;
};

export type ClusterWithPlaces = Cluster & { places: Place[] };

/**
 * Загружает кластеры с API. Возвращает null при ошибке.
 */
export async function fetchClusters(): Promise<{
  cards: ClusterCard[];
  clusters: Map<string, Cluster>;
} | null> {
  try {
    const data = await apiFetch<ClusterResponse[]>("/clusters");
    if (!data?.length) return null;

    const cards: ClusterCard[] = [];
    const clusterMap = new Map<string, Cluster>();

    for (const c of data) {
      const places: Place[] = c.places.map(mapPlace);
      const cluster: Cluster = {
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
  } catch {
    return null;
  }
}

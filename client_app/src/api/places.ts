/**
 * Загрузка мест с бэкенда и маппинг в формат фронта.
 * Используется как опция: если бэк вернёт данные — подставляем, иначе stub.
 */
import type { Cluster, Place } from '../types/cluster'
import { apiFetch } from './client'

type PlaceResponse = {
  place_id: number
  name: string
  place_type: string | null
  location: string | null
  interesting_fact: string | null
  description: string | null
  description_ai: string | null
  price: number | null
  images: string[]
  rating: number
}

const DEFAULT_PHOTO = ''

function mapPlaceToFrontend(p: PlaceResponse, clusterId: string, photo: string): Place {
  const desc = p.description || p.description_ai || ''
  return {
    id: `p${p.place_id}`,
    photo: p.images?.[0] || photo,
    rating: p.rating ?? 0,
    title: p.name,
    location: p.location || '',
    coordinates: { lat: 45, lon: 38 },
    fact: p.interesting_fact || 'Впечатления',
    cost: p.price ?? 0,
    description: desc,
    reviewsLabel: '',
    reviews: [],
  }
}

/**
 * Группирует места по place_type в кластеры.
 * Возвращает [] при ошибке — вызывающий использует stub.
 */
export async function fetchClustersFromApi(): Promise<Cluster[] | null> {
  try {
    const places = await apiFetch<PlaceResponse[]>('/places')
    if (!places?.length) return null

    const byType = new Map<string, PlaceResponse[]>()
    for (const p of places) {
      const key = p.place_type || 'general'
      if (!byType.has(key)) byType.set(key, [])
      byType.get(key)!.push(p)
    }

    const clusters: Cluster[] = []
    let idx = 0
    for (const [type, list] of byType) {
      const clusterId = `api-${type}-${idx++}`
      clusters.push({
        id: clusterId,
        coverImage: list[0]?.images?.[0] || DEFAULT_PHOTO,
        title: type === 'general' ? 'Места для отдыха' : type,
        places: list.map((p) => mapPlaceToFrontend(p, clusterId, list[0]?.images?.[0] || DEFAULT_PHOTO)),
      })
    }
    return clusters.length ? clusters : null
  } catch {
    return null
  }
}

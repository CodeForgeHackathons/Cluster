/**
 * API клиент для запросов к бэкенду.
 * В dev (Vite порт 5173) используется proxy /api → localhost:8000.
 */

export function getApiBase(): string {
  const env = (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env
  if (env?.VITE_API_URL) return env.VITE_API_URL.replace(/\/$/, '')
  if (typeof window === 'undefined') return 'http://localhost:8000'
  const port = window.location?.port
  if (port === '5173') return '/api'
  return 'http://localhost:8000'
}

export async function apiFetch<T = unknown>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const base = getApiBase()
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

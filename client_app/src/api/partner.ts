/**
 * API кабинета партнёра: авторизация, места, спецпредложения.
 */
import { apiFetch } from "./client";

// --------------------------------------------------------------------------- //
// Типы                                                                         //
// --------------------------------------------------------------------------- //

export type PartnerPlace = {
  place_id: number;
  name: string;
  place_type: string | null;
  location: string | null;
  price: number | null;
  photo: string;
  interesting_fact: string | null;
  cluster_id: string | null;
};

export type PartnerPlaceDetail = {
  place_id: number;
  business_id: number;
  cluster_id: string | null;
  name: string;
  place_type: string | null;
  location: string | null;
  interesting_fact: string | null;
  description: string | null;
  price: number | null;
  images: string[];
};

export type PartnerPlaceCreate = {
  business_id: number;
  cluster_id?: string | null;
  name: string;
  place_type?: string | null;
  location?: string | null;
  interesting_fact?: string | null;
  description?: string | null;
  price?: number | null;
  images?: string[];
};

export type PartnerPlaceUpdate = {
  cluster_id?: string | null;
  name?: string | null;
  place_type?: string | null;
  location?: string | null;
  interesting_fact?: string | null;
  description?: string | null;
  price?: number | null;
  images?: string[];
};

export type PartnerProfile = {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
};

export type PartnerCluster = {
  id: string;
  title: string;
  meta: string | null;
  description: string | null;
  status: string;
};

export type ClusterCreate = {
  title: string;
  meta?: string | null;
  description?: string | null;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  partner_id: number;
  username: string;
  full_name: string | null;
};

// --------------------------------------------------------------------------- //
// Токен                                                                        //
// --------------------------------------------------------------------------- //

const TOKEN_KEY = "partner_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  return apiFetch<T>(path, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers ?? {}),
    },
  });
}

// --------------------------------------------------------------------------- //
// Авторизация                                                                  //
// --------------------------------------------------------------------------- //

export async function registerPartner(
  username: string,
  email: string,
  password: string,
  fullName?: string,
): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/partner/auth/register", {
    method: "POST",
    body: JSON.stringify({
      username,
      email,
      password,
      full_name: fullName ?? null,
    }),
  });
}

export async function loginPartner(
  login: string,
  password: string,
): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/partner/auth/login", {
    method: "POST",
    body: JSON.stringify({ login, password }),
  });
}

export async function getPartnerMe(): Promise<PartnerProfile> {
  return authFetch<PartnerProfile>("/partner/auth/me");
}

export async function fetchPartnerClusters(): Promise<PartnerCluster[]> {
  const data = await authFetch<PartnerCluster[]>("/partner/clusters");
  return data ?? [];
}

export async function createPartnerCluster(
  payload: ClusterCreate,
): Promise<PartnerCluster> {
  return authFetch<PartnerCluster>("/partner/clusters", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// --------------------------------------------------------------------------- //
// Места                                                                        //
// --------------------------------------------------------------------------- //

export async function fetchPartnerPlaces(): Promise<PartnerPlace[]> {
  const data = await authFetch<PartnerPlace[]>("/partner/places");
  return data ?? [];
}

export async function fetchPartnerPlaceDetail(
  placeId: number,
): Promise<PartnerPlaceDetail> {
  const data = await authFetch<{
    place_id: number;
    business_id: number;
    cluster_id: string | null;
    name: string;
    place_type: string | null;
    location: string | null;
    interesting_fact: string | null;
    description: string | null;
    description_ai: string | null;
    price: number | null;
    images: string[];
  }>(`/places/${placeId}`);

  return {
    place_id: data.place_id,
    business_id: data.business_id,
    cluster_id: data.cluster_id,
    name: data.name,
    place_type: data.place_type,
    location: data.location,
    interesting_fact: data.interesting_fact,
    description: data.description ?? data.description_ai ?? null,
    price: data.price,
    images: data.images ?? [],
  };
}

export async function createPartnerPlace(
  payload: PartnerPlaceCreate,
): Promise<void> {
  // Убираем business_id из payload - он должен добавляться на бэкенде
  const { business_id, ...payloadWithoutBusinessId } = payload;
  await authFetch("/places", {
    method: "POST",
    body: JSON.stringify(payloadWithoutBusinessId),
  });
}

export async function updatePartnerPlace(
  placeId: number,
  payload: PartnerPlaceUpdate,
): Promise<PartnerPlaceDetail> {
  const data = await authFetch<{
    place_id: number;
    business_id: number;
    cluster_id: string | null;
    name: string;
    place_type: string | null;
    location: string | null;
    interesting_fact: string | null;
    description: string | null;
    description_ai: string | null;
    price: number | null;
    images: string[];
  }>(`/places/${placeId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return {
    place_id: data.place_id,
    business_id: data.business_id,
    cluster_id: data.cluster_id,
    name: data.name,
    place_type: data.place_type,
    location: data.location,
    interesting_fact: data.interesting_fact,
    description: data.description ?? data.description_ai ?? null,
    price: data.price,
    images: data.images ?? [],
  };
}

export async function deletePartnerPlace(placeId: number): Promise<void> {
  await authFetch(`/places/${placeId}`, {
    method: "DELETE",
  });
}

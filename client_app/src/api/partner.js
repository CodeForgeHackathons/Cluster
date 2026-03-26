/**
 * API кабинета партнёра: авторизация, места, спецпредложения.
 */
import { apiFetch } from "./client";
// --------------------------------------------------------------------------- //
// Токен                                                                        //
// --------------------------------------------------------------------------- //
const TOKEN_KEY = "partner_token";
export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}
function authHeaders() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}
function authFetch(path, options = {}) {
    return apiFetch(path, {
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
export async function registerPartner(username, email, password, fullName) {
    return apiFetch("/partner/auth/register", {
        method: "POST",
        body: JSON.stringify({
            username,
            email,
            password,
            full_name: fullName ?? null,
        }),
    });
}
export async function loginPartner(login, password) {
    return apiFetch("/partner/auth/login", {
        method: "POST",
        body: JSON.stringify({ login, password }),
    });
}
export async function getPartnerMe() {
    return authFetch("/partner/auth/me");
}
export async function fetchPartnerClusters() {
    const data = await authFetch("/partner/clusters");
    return data ?? [];
}
export async function createPartnerCluster(payload) {
    return authFetch("/partner/clusters", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
// --------------------------------------------------------------------------- //
// Места                                                                        //
// --------------------------------------------------------------------------- //
export async function fetchPartnerPlaces() {
    const data = await authFetch("/partner/places");
    return data ?? [];
}
export async function fetchPartnerPlaceDetail(placeId) {
    const data = await authFetch(`/places/${placeId}`);
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
export async function createPartnerPlace(payload) {
    // Убираем business_id из payload - он должен добавляться на бэкенде
    const { business_id, ...payloadWithoutBusinessId } = payload;
    await authFetch("/places", {
        method: "POST",
        body: JSON.stringify(payloadWithoutBusinessId),
    });
}
export async function updatePartnerPlace(placeId, payload) {
    const data = await authFetch(`/places/${placeId}`, {
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
export async function deletePartnerPlace(placeId) {
    await authFetch(`/places/${placeId}`, {
        method: "DELETE",
    });
}

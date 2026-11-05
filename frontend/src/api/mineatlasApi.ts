/**
 * MineAtlas API Client
 *
 * This module is the single access point for all backend HTTP requests
 * made by the MineAtlas frontend.
 *
 * CRITICAL ARCHITECTURAL RULES:
 * 1. The frontend MUST ONLY communicate with our FastAPI backend (/api/*).
 * 2. Never allow the frontend/browser to call external APIs (such as Astroworld) directly.
 * 3. All external data ingestion and rate-limiting happen strictly on the FastAPI backend.
 * 4. Normal user navigation strictly queries local cached SQLite data.
 */

import {
  BiomeDetail,
  BiomeListItem,
  DataStatusResponse,
  DetailResponse,
  FarmDetail,
  FarmListItem,
  GraphNeighborsResponse,
  ItemDetail,
  ItemListItem,
  MobDetail,
  MobListItem,
  PaginatedResponse,
  SearchResponse,
  StructureDetail,
  StructureListItem,
  BiomeMatchesResponse,
  PortalConvertRequest,
  PortalConvertResponse,
  SpawnSphereRequest,
  SpawnSphereResponse,
  WorldReferenceResponse,
} from './types';

export interface HealthResponse {
  status: string;
  service: string;
  edition: string;
  phase: string;
}

// Fallback to local FastAPI development server if environment variable is not defined
const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Internal generic fetch helper with standard error handling.
 */
async function fetchJson<T>(endpoint: string, searchParams?: Record<string, string | number | boolean | null | undefined>): Promise<T> {
  let url = `${API_BASE_URL}${endpoint}`;

  if (searchParams) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== null && value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    }
    const queryString = params.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    let errorDetail = response.statusText || 'Unknown Error';
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.detail) {
        errorDetail = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
      }
    } catch {
      // Ignore if body is not JSON
    }
    throw new Error(`API Error (${response.status}): ${errorDetail}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Internal generic POST helper with JSON payload and standard error handling.
 */
async function postJson<T>(endpoint: string, body: unknown): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorDetail = response.statusText || 'Unknown Error';
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.detail) {
        errorDetail = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
      }
    } catch {
      // Ignore if body is not JSON
    }
    throw new Error(`API Error (${response.status}): ${errorDetail}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Health check endpoint.
 */
export async function getHealthStatus(): Promise<HealthResponse> {
  return fetchJson<HealthResponse>('/api/health');
}

/**
 * Cache and ingestion freshness status.
 */
export async function getDataStatus(): Promise<DataStatusResponse> {
  return fetchJson<DataStatusResponse>('/api/data-status');
}

/**
 * Unified multi-entity search.
 */
export async function searchEntities(
  q: string,
  types?: string,
  limit: number = 20
): Promise<SearchResponse> {
  return fetchJson<SearchResponse>('/api/search', {
    q,
    types,
    limit,
  });
}

/**
 * Mobs explorer - list
 */
export async function getMobs(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  type?: string;
  category?: string;
  tameable?: boolean;
  breedable?: boolean;
}): Promise<PaginatedResponse<MobListItem>> {
  return fetchJson<PaginatedResponse<MobListItem>>('/api/mobs', params);
}

/**
 * Mobs explorer - detail
 */
export async function getMobById(mobId: string): Promise<MobDetail> {
  const res = await fetchJson<DetailResponse<MobDetail>>(`/api/mobs/${encodeURIComponent(mobId)}`);
  return res.data;
}

/**
 * Biomes explorer - list
 */
export async function getBiomes(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  dimension?: string;
  category?: string;
  rarity?: string;
}): Promise<PaginatedResponse<BiomeListItem>> {
  return fetchJson<PaginatedResponse<BiomeListItem>>('/api/biomes', params);
}

/**
 * Biomes explorer - detail
 */
export async function getBiomeById(biomeId: string): Promise<BiomeDetail> {
  const res = await fetchJson<DetailResponse<BiomeDetail>>(`/api/biomes/${encodeURIComponent(biomeId)}`);
  return res.data;
}

/**
 * Items & Key Blocks explorer - list
 */
export async function getItems(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string;
  enchantable?: boolean;
}): Promise<PaginatedResponse<ItemListItem>> {
  return fetchJson<PaginatedResponse<ItemListItem>>('/api/items', params);
}

/**
 * Items & Key Blocks explorer - detail
 */
export async function getItemById(itemId: string): Promise<ItemDetail> {
  const res = await fetchJson<DetailResponse<ItemDetail>>(`/api/items/${encodeURIComponent(itemId)}`);
  return res.data;
}

/**
 * Structures explorer - list
 */
export async function getStructures(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  dimension?: string;
  category?: string;
  rarity?: string;
}): Promise<PaginatedResponse<StructureListItem>> {
  return fetchJson<PaginatedResponse<StructureListItem>>('/api/structures', params);
}

/**
 * Structures explorer - detail
 */
export async function getStructureById(structureId: string): Promise<StructureDetail> {
  const res = await fetchJson<DetailResponse<StructureDetail>>(`/api/structures/${encodeURIComponent(structureId)}`);
  return res.data;
}

/**
 * Curated Farm Blueprint Hub - list
 */
export async function getFarms(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  difficulty?: string;
  dimension?: string;
}): Promise<PaginatedResponse<FarmListItem>> {
  return fetchJson<PaginatedResponse<FarmListItem>>('/api/farms', params);
}

/**
 * Curated Farm Blueprint Hub - detail
 */
export async function getFarmBySlug(farmSlug: string): Promise<FarmDetail> {
  const res = await fetchJson<DetailResponse<FarmDetail>>(`/api/farms/${encodeURIComponent(farmSlug)}`);
  return res.data;
}

/**
 * Localized knowledge graph neighbors.
 */
export async function getGraphNeighbors(
  entityType: string,
  entityId: string,
  depth: number = 1,
  relationshipTypes?: string,
  limit: number = 50
): Promise<GraphNeighborsResponse> {
  return fetchJson<GraphNeighborsResponse>(
    `/api/graph/neighbors/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`,
    {
      depth,
      relationship_types: relationshipTypes,
      limit,
    }
  );
}

// ==================== WORLD ATLAS TOOLS ====================

/**
 * Curated world reference metadata for Java Edition dimensions & coordinates.
 */
export async function getWorldReference(): Promise<WorldReferenceResponse> {
  return fetchJson<WorldReferenceResponse>('/api/world/reference');
}

/**
 * Calculated 8:1 Nether portal horizontal coordinate converter.
 */
export async function convertPortalCoordinates(
  payload: PortalConvertRequest
): Promise<PortalConvertResponse> {
  return postJson<PortalConvertResponse>('/api/world/portal-convert', payload);
}

/**
 * Criteria-based biome search with explainable match reasons.
 */
export async function getBiomeMatches(params?: {
  dimension?: string;
  category?: string;
  rarity?: string;
  precipitation?: string;
  temperature_min?: number;
  temperature_max?: number;
  has_village_opportunity?: boolean;
  has_tameable_mob_opportunity?: boolean;
  beginner_friendly?: boolean;
  limit?: number;
}): Promise<BiomeMatchesResponse> {
  return fetchJson<BiomeMatchesResponse>('/api/world/biome-matches', params);
}

/**
 * Geometric spawn sphere and despawn radius visualizer calculations.
 */
export async function calculateSpawnSphere(
  payload: SpawnSphereRequest
): Promise<SpawnSphereResponse> {
  return postJson<SpawnSphereResponse>('/api/world/spawn-sphere', payload);
}


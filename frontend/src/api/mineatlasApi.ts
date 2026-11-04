/**
 * MineAtlas API Client
 *
 * This module is the single access point for all backend HTTP requests
 * made by the MineAtlas frontend.
 *
 * CRITICAL ARCHITECTURAL RULES:
 * 1. The frontend MUST ONLY communicate with our FastAPI backend.
 * 2. Never allow the frontend/browser to call external APIs (such as Astroworld) directly.
 * 3. All external data ingestion and rate-limiting happen strictly on the FastAPI backend.
 */

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
 * Fetches the backend health check payload from /api/health.
 *
 * @returns Promise<HealthResponse> parsed JSON response from the backend.
 * @throws Error if network fails or server returns a non-2xx status code.
 */
export async function getHealthStatus(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Backend returned HTTP ${response.status} (${response.statusText || 'Error'})`
    );
  }

  const data: HealthResponse = await response.json();
  return data;
}


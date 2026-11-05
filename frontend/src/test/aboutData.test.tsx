import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AboutDataPage from '../pages/AboutDataPage';
import * as api from '../api/mineatlasApi';

describe('AboutDataPage Component', () => {
  it('renders data transparency, three-tier architecture, and rate limits', async () => {
    vi.spyOn(api, 'getDataStatus').mockResolvedValue({
      status: 'healthy',
      latest_sync_status: 'success',
      latest_sync_started_at: '2026-11-04T12:00:00Z',
      latest_sync_completed_at: '2026-11-04T12:05:00Z',
      cache_freshness_seconds: 3600,
      cache_freshness_human: '1 hour ago',
      total_entities: 688,
      total_relationship_edges: 650,
      cached_counts: {
        mob: 76,
        biome: 64,
        item: 100,
        structure: 24,
      },
      edition: 'Minecraft Java Edition',
      coverage_summary: 'Comprehensive Java Edition cache.',
    });

    render(
      <MemoryRouter>
        <AboutDataPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('About MineAtlas Data & Architecture')).toBeInTheDocument();
      expect(screen.getByText('Three-Tier Architecture Rules')).toBeInTheDocument();
      expect(screen.getByText('50/min')).toBeInTheDocument();
      expect(screen.getByText(/React Frontend \(Browser\)/i)).toBeInTheDocument();
      expect(screen.getByText(/FastAPI Backend & SQLite Cache/i)).toBeInTheDocument();
      expect(screen.getByText(/Astroworld Upstream Ingestion/i)).toBeInTheDocument();

      // Check visible Astroworld attribution links
      const attributionLinks = screen.getAllByRole('link', { name: /Powered by Astroworld API/i });
      expect(attributionLinks.length).toBeGreaterThanOrEqual(1);
      attributionLinks.forEach((link) => {
        expect(link).toHaveAttribute('href', 'https://api.astroworldmc.com');
        expect(link.getAttribute('rel') || '').not.toContain('nofollow');
      });

      // Check legal & scope disclaimers
      expect(screen.getByText(/Minecraft Java Edition Only:/i)).toBeInTheDocument();
      expect(screen.getByText(/Not an official Minecraft product/i)).toBeInTheDocument();
    });
  });
});

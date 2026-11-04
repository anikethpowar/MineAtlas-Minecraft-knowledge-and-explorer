import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import MobDetailPage from '../pages/MobDetailPage';
import RelatedConnections from '../components/explorers/RelatedConnections';
import * as api from '../api/mineatlasApi';

describe('Entity Detail Views & Knowledge Graph Connections', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockBeeDetail = {
    id: 'bee',
    name: 'Bee',
    mob_type: 'neutral',
    category: 'arthropod',
    behavior: 'Neutral flying mob that pollinates crops and lives in beehives.',
    hp: 10,
    damage_easy: 2,
    damage_normal: 2,
    damage_hard: 3,
    xp_min: 1,
    xp_max: 3,
    spawn_conditions: 'Spawns near Bee Nests on oak or birch trees in Plains, Sunflower Plains, and Flower Forests.',
    tameable: false,
    taming_method: null,
    breedable: true,
    breeding_item: 'Flowers',
    version_added: '1.15',
    notes: 'Produces honey when pollinating flowers.',
    source: {
      source_type: 'astroworld_api',
      source_url: 'https://api.astroworldmc.com/api/v1/mobs',
      edition: 'java',
      game_version: '1.15',
      last_verified_at: '2026-11-04T12:00:00Z',
    },
    coverage_note: 'Combat and traits data cached from Astroworld API for Minecraft Java Edition.',
  };

  it('renders detailed mob combat, breeding, and provenance specifications', async () => {
    vi.spyOn(api, 'getMobById').mockResolvedValue(mockBeeDetail);
    vi.spyOn(api, 'getGraphNeighbors').mockResolvedValue({
      root: { entity_type: 'mob', entity_id: 'bee', name: 'Bee' },
      nodes: [
        {
          entity_type: 'biome',
          id: 'plains',
          name: 'Plains',
          source_type: 'astroworld_api',
          edition: 'java',
          game_version: null,
        },
      ],
      edges: [
        {
          id: 1,
          source_entity_type: 'mob',
          source_entity_id: 'bee',
          relationship_type: 'SPAWNS_IN',
          target_entity_type: 'biome',
          target_entity_id: 'plains',
          source_type: 'calculated',
          metadata: null,
          explanation: 'Bee spawns naturally in Plains biome.',
        },
      ],
      metadata: {
        depth: 1,
        truncated: false,
        available_relationship_types: ['SPAWNS_IN'],
        total_nodes: 1,
        total_edges: 1,
      },
    });

    render(
      <MemoryRouter initialEntries={['/mobs/bee']}>
        <Routes>
          <Route path="/mobs/:mobId" element={<MobDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Bee', level: 1 })).toBeInTheDocument();
      expect(screen.getByText('10 HP (5 ♥)')).toBeInTheDocument();
      expect(screen.getByText('1 - 3 XP')).toBeInTheDocument();
      expect(screen.getByText('Item: Flowers')).toBeInTheDocument();
      expect(screen.getByText('SPAWNS_IN')).toBeInTheDocument();
      expect(screen.getByText('Plains')).toBeInTheDocument();
    });
  });

  it('renders graceful empty state for entity with zero derived graph connections', async () => {
    vi.spyOn(api, 'getGraphNeighbors').mockResolvedValue({
      root: { entity_type: 'mob', entity_id: 'zombie', name: 'Zombie' },
      nodes: [],
      edges: [],
      metadata: {
        depth: 1,
        truncated: false,
        available_relationship_types: [],
        total_nodes: 0,
        total_edges: 0,
      },
    });

    render(
      <MemoryRouter>
        <RelatedConnections entityType="mob" entityId="zombie" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('no-connections-message')).toBeInTheDocument();
      expect(screen.getByText(/No derived graph connections indexed for this entity yet/i)).toBeInTheDocument();
    });
  });
});
